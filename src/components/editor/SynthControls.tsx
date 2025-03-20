
import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Waves, 
  BarChart2, 
  Activity, 
  ToggleLeft, 
  Volume2, 
  Filter, 
  RefreshCw, 
  Zap,
  SquareCode,
  Triangle,
  Hash,
  Square
} from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SynthesizerSettings } from '@/utils/synthesizer';

interface SynthControlsProps {
  synthSettings: SynthesizerSettings | null;
  onUpdateSettings: (settings: Partial<SynthesizerSettings>) => void;
  currentInstrument: string;
}

export const SynthControls: React.FC<SynthControlsProps> = ({
  synthSettings,
  onUpdateSettings,
  currentInstrument
}) => {
  const [localSettings, setLocalSettings] = useState<SynthesizerSettings | null>(synthSettings);

  // Update local settings when prop changes
  useEffect(() => {
    setLocalSettings(synthSettings);
  }, [synthSettings]);

  // Can't render without settings
  if (!localSettings) return null;

  // Handle oscillator changes
  const updateOscillator = (index: number, key: keyof typeof localSettings.oscillators[0], value: any) => {
    if (!localSettings) return;
    
    const newOscillators = [...localSettings.oscillators];
    newOscillators[index] = { ...newOscillators[index], [key]: value };
    
    const newSettings = { ...localSettings, oscillators: newOscillators };
    setLocalSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  // Handle envelope changes
  const updateEnvelope = (key: keyof typeof localSettings.envelope, value: number) => {
    if (!localSettings) return;
    
    const newEnvelope = { ...localSettings.envelope, [key]: value };
    const newSettings = { ...localSettings, envelope: newEnvelope };
    setLocalSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  // Handle filter changes
  const updateFilter = (key: keyof typeof localSettings.filter, value: any) => {
    if (!localSettings) return;
    
    const newFilter = { ...localSettings.filter, [key]: value };
    const newSettings = { ...localSettings, filter: newFilter };
    setLocalSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  // Handle LFO changes
  const updateLFO = (key: keyof typeof localSettings.lfo, value: any) => {
    if (!localSettings) return;
    
    const newLFO = { ...localSettings.lfo, [key]: value };
    const newSettings = { ...localSettings, lfo: newLFO };
    setLocalSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  // Handle master gain changes
  const updateMasterGain = (value: number) => {
    if (!localSettings) return;
    
    const newSettings = { ...localSettings, masterGain: value };
    setLocalSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  // Get icon for oscillator type
  const getOscillatorIcon = (type: OscillatorType) => {
    switch (type) {
      case 'sine':
        return <Waves className="h-4 w-4" />;
      case 'square':
        return <Square className="h-4 w-4" />;
      case 'sawtooth':
        return <Zap className="h-4 w-4" />;
      case 'triangle':
        return <Triangle className="h-4 w-4" />;
      default:
        return <Waves className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Synthesizer</h3>
        <div className="text-sm text-muted-foreground bg-zinc-800 px-2 py-1 rounded">
          {currentInstrument.charAt(0) + currentInstrument.slice(1).toLowerCase()}
        </div>
      </div>
      
      <Tabs defaultValue="oscillators" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="oscillators" className="text-xs flex flex-col items-center gap-1 py-1 h-auto">
            <Waves className="h-4 w-4" />
            <span>Oscillators</span>
          </TabsTrigger>
          <TabsTrigger value="envelope" className="text-xs flex flex-col items-center gap-1 py-1 h-auto">
            <Activity className="h-4 w-4" />
            <span>Envelope</span>
          </TabsTrigger>
          <TabsTrigger value="filter" className="text-xs flex flex-col items-center gap-1 py-1 h-auto">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </TabsTrigger>
          <TabsTrigger value="lfo" className="text-xs flex flex-col items-center gap-1 py-1 h-auto">
            <RefreshCw className="h-4 w-4" />
            <span>LFO/CFO</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Oscillators Tab */}
        <TabsContent value="oscillators" className="space-y-4">
          <div className="text-xs font-medium mb-1">Master Gain</div>
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider 
              value={[localSettings.masterGain]} 
              min={0} 
              max={1} 
              step={0.01} 
              onValueChange={([value]) => updateMasterGain(value)}
            />
            <span className="text-xs w-8 text-right">{Math.round(localSettings.masterGain * 100)}%</span>
          </div>
          
          <Separator className="my-4" />
          
          {localSettings.oscillators.map((osc, index) => (
            <div key={index} className="space-y-3 pb-3 border border-zinc-800 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div className="text-xs font-medium">Oscillator {index + 1}</div>
                <Select 
                  value={osc.type} 
                  onValueChange={(value) => updateOscillator(index, 'type', value as OscillatorType)}
                >
                  <SelectTrigger className="w-32 h-7">
                    <SelectValue placeholder="Waveform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sine" className="flex items-center gap-2">
                      <Waves className="h-4 w-4 inline mr-1" /> Sine
                    </SelectItem>
                    <SelectItem value="square" className="flex items-center gap-2">
                      <Square className="h-4 w-4 inline mr-1" /> Square
                    </SelectItem>
                    <SelectItem value="sawtooth" className="flex items-center gap-2">
                      <Zap className="h-4 w-4 inline mr-1" /> Sawtooth
                    </SelectItem>
                    <SelectItem value="triangle" className="flex items-center gap-2">
                      <Triangle className="h-4 w-4 inline mr-1" /> Triangle
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Gain</span>
                  <span>{Math.round(osc.gain * 100)}%</span>
                </div>
                <Slider 
                  value={[osc.gain]} 
                  min={0} 
                  max={1} 
                  step={0.01} 
                  onValueChange={([value]) => updateOscillator(index, 'gain', value)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Detune</span>
                  <span>{osc.detune} cents</span>
                </div>
                <Slider 
                  value={[osc.detune]} 
                  min={-50} 
                  max={50} 
                  step={1} 
                  onValueChange={([value]) => updateOscillator(index, 'detune', value)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Octave Shift</span>
                  <span>{osc.octaveShift > 0 ? `+${osc.octaveShift}` : osc.octaveShift}</span>
                </div>
                <Slider 
                  value={[osc.octaveShift]} 
                  min={-2} 
                  max={2} 
                  step={1} 
                  onValueChange={([value]) => updateOscillator(index, 'octaveShift', value)}
                />
              </div>
            </div>
          ))}
        </TabsContent>
        
        {/* Envelope Tab */}
        <TabsContent value="envelope" className="space-y-4">
          <div className="relative h-32 mb-6 border border-zinc-700 rounded-lg p-2 bg-zinc-900">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* ADSR visualization */}
              <path
                d={`
                  M 0,100
                  L ${localSettings.envelope.attack * 200},0
                  L ${localSettings.envelope.attack * 200 + localSettings.envelope.decay * 200},${100 - localSettings.envelope.sustain * 100}
                  L 80,${100 - localSettings.envelope.sustain * 100}
                  L 100,100
                  Z
                `}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-blue-500"
              />
              
              {/* ADSR labels */}
              <text x={localSettings.envelope.attack * 100} y="97" className="text-[8px] fill-zinc-400 text-center">A</text>
              <text x={localSettings.envelope.attack * 200 + localSettings.envelope.decay * 100} y="97" className="text-[8px] fill-zinc-400 text-center">D</text>
              <text x="80" y="97" className="text-[8px] fill-zinc-400 text-center">R</text>
              <text x={localSettings.envelope.attack * 200 + localSettings.envelope.decay * 200 + 5} y={100 - localSettings.envelope.sustain * 100 + 3} className="text-[8px] fill-zinc-400">S</text>
            </svg>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Attack</span>
                <span>{(localSettings.envelope.attack * 1000).toFixed(0)}ms</span>
              </div>
              <Slider 
                value={[localSettings.envelope.attack]} 
                min={0.001} 
                max={1} 
                step={0.001} 
                onValueChange={([value]) => updateEnvelope('attack', value)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Decay</span>
                <span>{(localSettings.envelope.decay * 1000).toFixed(0)}ms</span>
              </div>
              <Slider 
                value={[localSettings.envelope.decay]} 
                min={0.001} 
                max={1} 
                step={0.001} 
                onValueChange={([value]) => updateEnvelope('decay', value)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Sustain</span>
                <span>{Math.round(localSettings.envelope.sustain * 100)}%</span>
              </div>
              <Slider 
                value={[localSettings.envelope.sustain]} 
                min={0} 
                max={1} 
                step={0.01} 
                onValueChange={([value]) => updateEnvelope('sustain', value)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Release</span>
                <span>{(localSettings.envelope.release * 1000).toFixed(0)}ms</span>
              </div>
              <Slider 
                value={[localSettings.envelope.release]} 
                min={0.001} 
                max={2} 
                step={0.001} 
                onValueChange={([value]) => updateEnvelope('release', value)}
              />
            </div>
          </div>
        </TabsContent>
        
        {/* Filter Tab */}
        <TabsContent value="filter" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="filter-enabled" className="text-sm">Filter Enabled</Label>
            <Switch 
              id="filter-enabled" 
              checked={localSettings.filter.enabled} 
              onCheckedChange={(checked) => updateFilter('enabled', checked)}
            />
          </div>
          
          <Select 
            value={localSettings.filter.type} 
            onValueChange={(value) => updateFilter('type', value as BiquadFilterType)}
            disabled={!localSettings.filter.enabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lowpass">Low Pass</SelectItem>
              <SelectItem value="highpass">High Pass</SelectItem>
              <SelectItem value="bandpass">Band Pass</SelectItem>
              <SelectItem value="notch">Notch</SelectItem>
              <SelectItem value="peaking">Peaking</SelectItem>
              <SelectItem value="lowshelf">Low Shelf</SelectItem>
              <SelectItem value="highshelf">High Shelf</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Frequency</span>
              <span>{localSettings.filter.frequency.toFixed(0)} Hz</span>
            </div>
            <Slider 
              value={[localSettings.filter.frequency]} 
              min={20} 
              max={20000} 
              step={1} 
              onValueChange={([value]) => updateFilter('frequency', value)}
              disabled={!localSettings.filter.enabled}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Resonance (Q)</span>
              <span>{localSettings.filter.Q.toFixed(1)}</span>
            </div>
            <Slider 
              value={[localSettings.filter.Q]} 
              min={0.1} 
              max={20} 
              step={0.1} 
              onValueChange={([value]) => updateFilter('Q', value)}
              disabled={!localSettings.filter.enabled}
            />
          </div>
          
          {(localSettings.filter.type === 'peaking' || 
            localSettings.filter.type === 'lowshelf' || 
            localSettings.filter.type === 'highshelf') && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Gain</span>
                <span>{localSettings.filter.gain.toFixed(1)} dB</span>
              </div>
              <Slider 
                value={[localSettings.filter.gain]} 
                min={-40} 
                max={40} 
                step={0.1} 
                onValueChange={([value]) => updateFilter('gain', value)}
                disabled={!localSettings.filter.enabled}
              />
            </div>
          )}
        </TabsContent>
        
        {/* LFO Tab */}
        <TabsContent value="lfo" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="lfo-enabled" className="text-sm">LFO Enabled</Label>
            <Switch 
              id="lfo-enabled" 
              checked={localSettings.lfo.enabled} 
              onCheckedChange={(checked) => updateLFO('enabled', checked)}
            />
          </div>
          
          <Select 
            value={localSettings.lfo.type} 
            onValueChange={(value) => updateLFO('type', value as OscillatorType)}
            disabled={!localSettings.lfo.enabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="LFO Waveform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sine">Sine</SelectItem>
              <SelectItem value="square">Square</SelectItem>
              <SelectItem value="sawtooth">Sawtooth</SelectItem>
              <SelectItem value="triangle">Triangle</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={localSettings.lfo.target} 
            onValueChange={(value) => updateLFO('target', value as 'frequency' | 'amplitude' | 'filter')}
            disabled={!localSettings.lfo.enabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Modulation Target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="frequency">Frequency (Vibrato)</SelectItem>
              <SelectItem value="amplitude">Amplitude (Tremolo)</SelectItem>
              <SelectItem value="filter">Filter Cutoff (Wah)</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Frequency</span>
              <span>{localSettings.lfo.frequency.toFixed(1)} Hz</span>
            </div>
            <Slider 
              value={[localSettings.lfo.frequency]} 
              min={0.1} 
              max={20} 
              step={0.1} 
              onValueChange={([value]) => updateLFO('frequency', value)}
              disabled={!localSettings.lfo.enabled}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Depth</span>
              <span>{localSettings.lfo.depth.toFixed(0)}%</span>
            </div>
            <Slider 
              value={[localSettings.lfo.depth]} 
              min={0} 
              max={100} 
              step={1} 
              onValueChange={([value]) => updateLFO('depth', value)}
              disabled={!localSettings.lfo.enabled}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
