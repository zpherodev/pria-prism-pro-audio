
import React, { useEffect, useRef, useState } from 'react';
import { CircleOff } from 'lucide-react';

interface PhaseAnalysisProps {
  file: File | null;
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

export const PhaseAnalysis = ({ file, analyser, isPlaying }: PhaseAnalysisProps) => {
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
    if (!file || !file.type.includes('audio') || !analyser) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsLoading(false);
    
    // Only start drawing when playing
    if (isPlaying) {
      drawPhase();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
  }, [file, analyser, isPlaying]);

  const drawPhase = () => {
    if (!analyser) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const timeData = new Uint8Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);
    
    const draw = () => {
      // Get canvas dimensions for responsive drawing
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) * 0.8;
      
      // Request next animation frame
      animationRef.current = requestAnimationFrame(draw);
      
      // Get time domain and frequency data
      analyser.getByteTimeDomainData(timeData);
      analyser.getByteFrequencyData(freqData);
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw phase circle
      ctx.strokeStyle = '#8B5CF6'; // Purple color
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw phase plot (Lissajous figure)
      ctx.strokeStyle = '#D946EF'; // Magenta color
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Use a subset of the data for smoother visualization
      const step = Math.floor(bufferLength / 360);
      
      for (let i = 0; i < bufferLength; i += step) {
        // Normalize values to [-1, 1]
        const x = ((timeData[i] / 128.0) - 1.0) * radius;
        const y = ((freqData[i] / 128.0) - 1.0) * radius;
        
        if (i === 0) {
          ctx.moveTo(centerX + x, centerY + y);
        } else {
          ctx.lineTo(centerX + x, centerY + y);
        }
      }
      
      ctx.closePath();
      ctx.stroke();
      
      // Draw reference axes
      ctx.strokeStyle = '#64748B';
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();
    };
    
    draw();
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      {file ? (
        isLoading ? (
          <div className="text-editor-text-secondary">Loading phase analysis...</div>
        ) : (
          <canvas 
            ref={canvasRef} 
            className="w-full h-full"
            width={800}
            height={200}
          />
        )
      ) : (
        <div className="flex flex-col items-center justify-center text-editor-text-secondary">
          <CircleOff className="h-16 w-16 mb-2" />
          <span>No audio selected for phase analysis</span>
        </div>
      )}
    </div>
  );
};
