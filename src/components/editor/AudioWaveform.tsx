
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

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Get the audio data from the first channel
      const audioData = audioBuffer.getChannelData(0);
      const step = Math.ceil(audioData.length / canvas.width);
      const amp = canvas.height / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#3B82F6';
      ctx.beginPath();
      ctx.moveTo(0, amp);

      // Draw the waveform
      for (let i = 0; i < canvas.width; i++) {
        let min = 1.0;
        let max = -1.0;

        for (let j = 0; j < step; j++) {
          const datum = audioData[i * step + j];
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }

        ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
      }
    };

    const loadAudio = async () => {
      try {
        setIsLoading(true);
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new AudioContext();
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
        setAudioBuffer(decodedBuffer);
        drawWaveform(decodedBuffer);
      } catch (error) {
        console.error('Error loading audio:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAudio();
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
            width={800}
            height={200}
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
