
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, AudioLines, BarChart3, CircleOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AudioWaveform } from './AudioWaveform';
import { SpectrumAnalysis } from './SpectrumAnalysis';
import { PhaseAnalysis } from './PhaseAnalysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PreviewProps {
  file: File | null;
}

export const Preview = ({ file }: PreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] = useState<MediaElementAudioSourceNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Initialize audio context and analyzers when file changes
  useEffect(() => {
    if (!file || !file.type.includes('audio')) return;

    // Clean up previous audio context
    if (audioContext) {
      audioContext.close();
    }

    const newAudioContext = new AudioContext();
    setAudioContext(newAudioContext);

    // Create analyser node
    const newAnalyser = newAudioContext.createAnalyser();
    newAnalyser.fftSize = 2048;
    setAnalyser(newAnalyser);

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [file]);

  // Connect audio element to audio context when audio element is available
  useEffect(() => {
    if (!audioRef.current || !audioContext || !analyser) return;

    // Create source node from audio element
    const source = audioContext.createMediaElementSource(audioRef.current);
    setAudioSource(source);

    // Connect nodes: source -> analyser -> destination
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    return () => {
      if (audioSource) {
        audioSource.disconnect();
      }
    };
  }, [audioRef.current, audioContext, analyser]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    // Resume audio context if it's suspended (needed for autoplay policies)
    if (audioContext?.state === 'suspended') {
      audioContext.resume();
    }
    
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
        <h3 className="text-lg font-medium">Audio Analysis</h3>
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
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={togglePlayback}
            disabled={!file || !file.type.includes('audio')}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div className="preview-window flex-grow">
        <Tabs defaultValue="waveform" className="w-full h-full">
          <TabsList className="mb-2">
            <TabsTrigger value="waveform" className="flex items-center gap-1">
              <AudioLines className="h-4 w-4" />
              <span>Waveform</span>
            </TabsTrigger>
            <TabsTrigger value="spectrum" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span>Spectrum</span>
            </TabsTrigger>
            <TabsTrigger value="phase" className="flex items-center gap-1">
              <CircleOff className="h-4 w-4" />
              <span>Phase</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="waveform" className="h-full">
            <AudioWaveform file={file} />
          </TabsContent>
          
          <TabsContent value="spectrum" className="h-full">
            <SpectrumAnalysis file={file} analyser={analyser} isPlaying={isPlaying} />
          </TabsContent>
          
          <TabsContent value="phase" className="h-full">
            <PhaseAnalysis file={file} analyser={analyser} isPlaying={isPlaying} />
          </TabsContent>
        </Tabs>

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
