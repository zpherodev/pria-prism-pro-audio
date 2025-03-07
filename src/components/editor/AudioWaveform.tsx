
import React, { useEffect, useRef, useState } from 'react';
import { AudioLines } from 'lucide-react';

interface AudioWaveformProps {
  file: File | null;
}

export const AudioWaveform = ({ file }: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  useEffect(() => {
    if (!file || !file.type.includes('audio')) return;

    const drawWaveform = (audioBuffer: AudioBuffer) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Get canvas dimensions for responsive drawing
      const width = canvas.width;
      const height = canvas.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Get the audio data from the first channel
      const audioData = audioBuffer.getChannelData(0);
      const step = Math.ceil(audioData.length / width);
      
      // Clear canvas with dark background
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, width, height);
      
      // Draw center line
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw the waveform
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.beginPath();

      let x = 0;
      for (let i = 0; i < width; i++) {
        let min = 1.0;
        let max = -1.0;

        // Find min and max in this segment
        for (let j = 0; j < step; j++) {
          const index = Math.min(audioData.length - 1, i * step + j);
          const datum = audioData[index];
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }

        // Draw vertical line from min to max
        const y1 = ((1 + min) * height) / 2;
        const y2 = ((1 + max) * height) / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y1);
        } else {
          ctx.lineTo(x, y1);
        }
        ctx.lineTo(x, y2);
        
        x += 1;
      }
      
      ctx.stroke();
    };

    const loadAudio = async () => {
      try {
        setIsLoading(true);
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new AudioContext();
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
        setAudioBuffer(decodedBuffer);
        
        // Set canvas dimensions
        if (canvasRef.current) {
          canvasRef.current.width = canvasRef.current.clientWidth;
          canvasRef.current.height = canvasRef.current.clientHeight;
        }
        
        drawWaveform(decodedBuffer);
        
        // Clean up
        audioContext.close();
      } catch (error) {
        console.error('Error loading audio for waveform:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAudio();
    
    // Handle resize
    const handleResize = () => {
      if (canvasRef.current && audioBuffer) {
        canvasRef.current.width = canvasRef.current.clientWidth;
        canvasRef.current.height = canvasRef.current.clientHeight;
        drawWaveform(audioBuffer);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [file]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      {file ? (
        isLoading ? (
          <div className="text-editor-text-secondary">Loading waveform...</div>
        ) : (
          <canvas 
            ref={canvasRef} 
            className="w-full h-full"
          />
        )
      ) : (
        <div className="flex flex-col items-center justify-center text-editor-text-secondary">
          <AudioLines className="h-16 w-16 mb-2" />
          <span>No audio selected</span>
        </div>
      )}
    </div>
  );
};
