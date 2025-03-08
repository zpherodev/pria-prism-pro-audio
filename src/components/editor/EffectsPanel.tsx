
import React, { useState } from 'react';
import { Sliders, Waveform, Filter, Mic2, Music4 } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EffectsPanelProps {
  audioBuffer: AudioBuffer | null;
}

export const EffectsPanel = ({ audioBuffer }: EffectsPanelProps) => {
  const [gain, setGain] = useState(0);
  const [bass, setBass] = useState(0);
  const [mid, setMid] = useState(0);
  const [treble, setTreble] = useState(0);
  const [reverb, setReverb] = useState(0);
  const [delay, setDelay] = useState(0);
  
  const handleApplyEffect = (effectName: string) => {
    console.log(`Applying ${effectName} effect`);
    // In a real implementation, this would apply audio effects to the selected track
  };
  
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="eq" className="w-full flex-grow">
        <TabsList className="mb-4">
          <TabsTrigger value="eq" className="flex items-center gap-1">
            <Sliders className="h-4 w-4" />
            <span>EQ</span>
          </TabsTrigger>
          <TabsTrigger value="dynamics" className="flex items-center gap-1">
            <Waveform className="h-4 w-4" />
            <span>Dynamics</span>
          </TabsTrigger>
          <TabsTrigger value="effects" className="flex items-center gap-1">
            <Music4 className="h-4 w-4" />
            <span>Effects</span>
          </TabsTrigger>
          <TabsTrigger value="filters" className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="eq" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm">Gain</label>
                <span className="text-sm">{gain}dB</span>
              </div>
              <Slider
                value={[gain]}
                onValueChange={(values) => setGain(values[0])}
                min={-12}
                max={12}
                step={0.1}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm">Bass</label>
                <span className="text-sm">{bass}dB</span>
              </div>
              <Slider
                value={[bass]}
                onValueChange={(values) => setBass(values[0])}
                min={-12}
                max={12}
                step={0.1}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm">Mid</label>
                <span className="text-sm">{mid}dB</span>
              </div>
              <Slider
                value={[mid]}
                onValueChange={(values) => setMid(values[0])}
                min={-12}
                max={12}
                step={0.1}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm">Treble</label>
                <span className="text-sm">{treble}dB</span>
              </div>
              <Slider
                value={[treble]}
                onValueChange={(values) => setTreble(values[0])}
                min={-12}
                max={12}
                step={0.1}
              />
            </div>
          </div>
          
          <Button 
            className="w-full mt-4" 
            onClick={() => handleApplyEffect('equalizer')}
            disabled={!audioBuffer}
          >
            Apply EQ
          </Button>
        </TabsContent>
        
        <TabsContent value="dynamics" className="space-y-4">
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <Waveform className="h-8 w-8 mb-2" />
            <p>Compression, Limiter, and Gate controls would be here</p>
          </div>
          
          <Button 
            className="w-full mt-4" 
            onClick={() => handleApplyEffect('dynamics')}
            disabled={!audioBuffer}
          >
            Apply Dynamics
          </Button>
        </TabsContent>
        
        <TabsContent value="effects" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm">Reverb</label>
                <span className="text-sm">{reverb}%</span>
              </div>
              <Slider
                value={[reverb]}
                onValueChange={(values) => setReverb(values[0])}
                min={0}
                max={100}
                step={1}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm">Delay</label>
                <span className="text-sm">{delay}ms</span>
              </div>
              <Slider
                value={[delay]}
                onValueChange={(values) => setDelay(values[0])}
                min={0}
                max={500}
                step={5}
              />
            </div>
          </div>
          
          <Button 
            className="w-full mt-4" 
            onClick={() => handleApplyEffect('reverb and delay')}
            disabled={!audioBuffer}
          >
            Apply Effects
          </Button>
        </TabsContent>
        
        <TabsContent value="filters" className="space-y-4">
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <Filter className="h-8 w-8 mb-2" />
            <p>High-pass, Low-pass, and Band-pass filter controls would be here</p>
          </div>
          
          <Button 
            className="w-full mt-4" 
            onClick={() => handleApplyEffect('filters')}
            disabled={!audioBuffer}
          >
            Apply Filters
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};
