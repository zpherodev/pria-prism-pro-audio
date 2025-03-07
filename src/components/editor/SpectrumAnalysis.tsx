
import React, { useEffect, useRef, useState } from 'react';
import { BarChart3 } from 'lucide-react';

interface SpectrumAnalysisProps {
  file: File | null;
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

export const SpectrumAnalysis = ({ file, analyser, isPlaying }: SpectrumAnalysisProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const animationRef = useRef<number | null>(null);
  const spectrogramDataRef = useRef<ImageData[]>([]);
  const [freqLabels, setFreqLabels] = useState<number[]>([]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!file || !file.type.includes('audio')) {
      return;
    }
    
    setIsLoading(false);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Update canvas dimensions to match display size
    const resizeCanvas = () => {
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
      
      // Clear spectrogram data on resize
      spectrogramDataRef.current = [];
      
      // Initialize with black background
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    
    resizeCanvas();
    
    // Create frequency labels for y-axis (logarithmic scale)
    if (analyser) {
      const sampleRate = 44100; // Standard sample rate
      const nyquist = sampleRate / 2;
      const frequencies = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(
        khz => khz * 1000
      );
      setFreqLabels(frequencies);
    }
    
    window.addEventListener('resize', resizeCanvas);
    
    // Only start drawing when playing and analyzer is available
    if (isPlaying && analyser) {
      console.log("Starting spectrum visualization");
      drawSpectrogram();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [file, analyser, isPlaying]);

  const drawSpectrogram = () => {
    if (!analyser) {
      console.log("No analyzer available for spectrum");
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const width = canvas.width;
    const height = canvas.height;
    
    // Draw grid and labels
    const drawGrid = () => {
      // Background
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, width, height);
      
      // Time markers (x-axis) - add time markers every 0.5 seconds
      ctx.fillStyle = '#6B7280';
      ctx.font = '10px sans-serif';
      
      // Y-axis labels (frequencies)
      for (let i = 0; i < freqLabels.length; i++) {
        const freq = freqLabels[i];
        const y = height - (height * Math.log10(freq + 1) / Math.log10(22000 + 1));
        
        // Only draw labels that fit on screen
        if (y >= 10 && y <= height - 10) {
          ctx.fillText(`${freq / 1000} kHz`, 5, y);
          
          // Draw horizontal grid line
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(50, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }
    };
    
    drawGrid();
    
    // Create an offscreen canvas for the spectrogram
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width - 50; // Account for left margin
    offscreenCanvas.height = height;
    const offCtx = offscreenCanvas.getContext('2d');
    
    if (!offCtx) return;
    
    // Initialize with black
    offCtx.fillStyle = '#111827';
    offCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    const draw = () => {
      // Request next animation frame
      animationRef.current = requestAnimationFrame(draw);
      
      // Get frequency data
      analyser.getByteFrequencyData(dataArray);
      
      // Create column image data
      const columnCanvas = document.createElement('canvas');
      columnCanvas.width = 1;
      columnCanvas.height = height;
      const columnCtx = columnCanvas.getContext('2d');
      
      if (!columnCtx) return;
      
      // Draw the frequency data to a single column
      const gradient = columnCtx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#6366F1'); // Indigo for high frequencies
      gradient.addColorStop(0.2, '#3B82F6'); // Blue
      gradient.addColorStop(0.4, '#10B981'); // Emerald
      gradient.addColorStop(0.6, '#FBBF24'); // Amber
      gradient.addColorStop(0.8, '#F59E0B'); // Amber
      gradient.addColorStop(1, '#EF4444'); // Red for low frequencies
      
      columnCtx.fillStyle = '#111827';
      columnCtx.fillRect(0, 0, 1, height);
      
      // Draw the spectrogram column (logarithmic frequency scale)
      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        if (value > 0) {
          const intensity = value / 255;
          
          // Map frequency bin to y position (logarithmic scale)
          const freqRatio = i / bufferLength;
          const logFreq = Math.pow(10, freqRatio * Math.log10(22000));
          const y = height - (height * Math.log10(logFreq + 1) / Math.log10(22000 + 1));
          
          // Draw a small rectangle with color intensity based on value
          columnCtx.globalAlpha = Math.min(0.8, intensity);
          columnCtx.fillStyle = gradient;
          columnCtx.fillRect(0, y - 2, 1, 4);
        }
      }
      
      // Shift previous data to the left
      offCtx.drawImage(
        offscreenCanvas, 
        1, 0, 
        offscreenCanvas.width - 1, offscreenCanvas.height, 
        0, 0, 
        offscreenCanvas.width - 1, offscreenCanvas.height
      );
      
      // Add new column on the right
      offCtx.drawImage(
        columnCanvas,
        0, 0,
        1, columnCanvas.height,
        offscreenCanvas.width - 1, 0,
        1, offscreenCanvas.height
      );
      
      // Draw the complete image to the main canvas
      drawGrid();
      ctx.drawImage(offscreenCanvas, 50, 0); // Draw with left margin for labels
    };
    
    draw();
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      {file ? (
        isLoading ? (
          <div className="text-editor-text-secondary">Loading spectrum analyzer...</div>
        ) : (
          <canvas 
            ref={canvasRef} 
            className="w-full h-full"
          />
        )
      ) : (
        <div className="flex flex-col items-center justify-center text-editor-text-secondary">
          <BarChart3 className="h-16 w-16 mb-2" />
          <span>No audio selected for spectrum analysis</span>
        </div>
      )}
    </div>
  );
};
