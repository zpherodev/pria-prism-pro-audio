
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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  // Clean up audio URL when component unmounts or file changes
  useEffect(() => {
    if (file && file.type.includes('audio')) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      
      // Load audio buffer for timeline
      const loadAudioBuffer = async () => {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const tempContext = new AudioContext();
          const buffer = await tempContext.decodeAudioData(arrayBuffer);
          setAudioBuffer(buffer);
          tempContext.close();
        } catch (error) {
          console.error("Error loading audio buffer:", error);
        }
      };
      
      loadAudioBuffer();
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  // Initialize audio context when component mounts
  useEffect(() => {
    // Fix: Use only AudioContext without the webkit prefix
    const context = new AudioContext();
    setAudioContext(context);

    return () => {
      if (context) {
        context.close();
      }
    };
  }, []);

  // Set up audio nodes when file or audio context changes
  useEffect(() => {
    if (!audioContext || !file || !file.type.includes('audio') || !audioRef.current) return;

    // Make sure previous connections are cleaned up
    if (audioSource) {
      audioSource.disconnect();
    }

    // Create analyzer node
    const newAnalyser = audioContext.createAnalyser();
    newAnalyser.fftSize = 2048;
    setAnalyser(newAnalyser);

    // Connect audio element to context when it's loaded
    const handleCanPlay = () => {
      console.log("Audio can play now, setting up audio graph");
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      // Create source from audio element
      const source = audioContext.createMediaElementSource(audioRef.current!);
      setAudioSource(source);
      
      // Connect nodes: source -> analyser -> destination
      source.connect(newAnalyser);
      newAnalyser.connect(audioContext.destination);
      
      // Set initial volume
      if (audioRef.current) {
        audioRef.current.volume = volume / 100;
      }
    };

    // Wait for the audio to be ready before setting up the audio graph
    if (audioRef.current.readyState >= 2) {
      // Audio is already loaded
      handleCanPlay();
    } else {
      // Wait for audio to load
      audioRef.current.addEventListener('canplay', handleCanPlay, { once: true });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('canplay', handleCanPlay);
      }
    };
  }, [audioContext, file]);

  const togglePlayback = () => {
    if (!audioRef.current || !audioContext) return;
    
    // Resume audio context (needed for autoplay policies)
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log("AudioContext resumed");
      });
    }
    
    if (isPlaying) {
      console.log("Pausing audio");
      audioRef.current.pause();
    } else {
      console.log("Playing audio");
      audioRef.current.play()
        .catch(error => {
          console.error("Error playing audio:", error);
        });
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100;
    }
  };

  // Handle timeline selection
  const handleTimelineChange = (startTime: number, endTime: number) => {
    console.log(`Timeline selection: ${startTime}s - ${endTime}s`);
    // You would implement actual editing functionality here
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

        {audioUrl && (
          <audio
            ref={audioRef}
            className="hidden"
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            preload="auto"
          />
        )}
      </div>
    </div>
  );
};
