
import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, AudioLines } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AudioWaveform } from './AudioWaveform';

interface PreviewProps {
  file: File | null;
}

export const Preview = ({ file }: PreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Waveform</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-editor-text-secondary" />
            <Slider 
              className="w-24" 
              value={[volume]} 
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
            />
          </div>
          <Button variant="ghost" size="icon" onClick={togglePlayback}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div className="preview-window flex-grow">
        <AudioWaveform file={file} />
        {file && file.type.includes('audio') && (
          <audio
            ref={audioRef}
            className="hidden"
            src={URL.createObjectURL(file)}
            onEnded={() => setIsPlaying(false)}
          />
        )}
      </div>
    </div>
  );
};
