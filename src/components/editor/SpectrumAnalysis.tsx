
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
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Only start drawing when playing and analyzer is available
    if (isPlaying && analyser) {
      console.log("Starting spectrum visualization");
      drawSpectrum();
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

  const drawSpectrum = () => {
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
    
    const draw = () => {
      // Get canvas dimensions for responsive drawing
      const width = canvas.width;
      const height = canvas.height;
      
      // Request next animation frame
      animationRef.current = requestAnimationFrame(draw);
      
      // Get frequency data
      analyser.getByteFrequencyData(dataArray);
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw spectrum
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        
        // Create gradient based on frequency (lower = warm, higher = cool)
        const hue = i / bufferLength * 240; // 0 (red) to 240 (blue)
        ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
        
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
        
        // Stop drawing when we reach the canvas width
        if (x >= width) break;
      }
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
