
import React, { useEffect, useRef, useState } from 'react';
import { BarChart3 } from 'lucide-react';

interface SpectrumAnalysisProps {
  file: File | null;
}

export const SpectrumAnalysis = ({ file }: SpectrumAnalysisProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] = useState<MediaElementAudioSourceNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!file || !file.type.includes('audio')) return;

    const setupAudio = async () => {
      try {
        setIsLoading(true);
        
        // Clean up previous instances
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        
        if (audioContext) {
          audioContext.close();
        }

        // Create new audio context
        const newAudioContext = new AudioContext();
        setAudioContext(newAudioContext);

        // Create audio element
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        audioRef.current = audio;

        // Create analyser
        const newAnalyser = newAudioContext.createAnalyser();
        newAnalyser.fftSize = 2048;
        setAnalyser(newAnalyser);

        // Create source
        const source = newAudioContext.createMediaElementSource(audio);
        setAudioSource(source);

        // Connect nodes
        source.connect(newAnalyser);
        newAnalyser.connect(newAudioContext.destination);

        // Start drawing
        drawSpectrum(newAnalyser);
      } catch (error) {
        console.error('Error setting up spectrum analysis:', error);
      } finally {
        setIsLoading(false);
      }
    };

    setupAudio();
  }, [file]);

  const drawSpectrum = (analyserNode: AnalyserNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      // Get canvas dimensions for responsive drawing
      const width = canvas.width;
      const height = canvas.height;
      
      // Request next animation frame
      animationRef.current = requestAnimationFrame(draw);
      
      // Get frequency data
      analyserNode.getByteFrequencyData(dataArray);
      
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
            width={800}
            height={200}
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
