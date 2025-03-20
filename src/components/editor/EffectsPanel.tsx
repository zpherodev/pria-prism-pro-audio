
import React, { useState, useRef, useEffect } from 'react';
import { Sliders, AudioWaveform, Filter, Music4, BadgePlus, ChevronsUpDown, BadgePercent, PlayCircle, Waves } from 'lucide-react';
import { Slider, VerticalSlider, FrequencySlider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SynthControls } from './SynthControls';
import { SynthesizerSettings } from '@/utils/synthesizer';

// Professional 10-band EQ frequency presets with more precise frequencies
const eqBands = [{
  freq: "31Hz",
  value: 0
}, {
  freq: "63Hz",
  value: 0
}, {
  freq: "125Hz",
  value: 0
}, {
  freq: "250Hz",
  value: 0
}, {
  freq: "500Hz",
  value: 0
}, {
  freq: "1kHz",
  value: 0
}, {
  freq: "2kHz",
  value: 0
}, {
  freq: "4kHz",
  value: 0
}, {
  freq: "8kHz",
  value: 0
}, {
  freq: "16kHz",
  value: 0
}];

// Parametric EQ band colors
const bandColors = [
  "#ff7b00", // Orange
  "#ffbb00", // Yellow
  "#85cc35", // Green
  "#00b3a0", // Teal
  "#4f9ef8", // Blue
  "#a85eff"  // Purple
];

type ParamEQBand = {
  id: number;
  frequency: number;
  gain: number;
  q: number;
  enabled: boolean;
  color: string;
};

type EffectsPanelProps = {
  audioBuffer?: AudioBuffer | null;
  synthSettings?: SynthesizerSettings;
  currentInstrument?: string;
  onUpdateSynthSettings?: (settings: SynthesizerSettings) => void;
};

export const EffectsPanel = ({
  audioBuffer,
  synthSettings,
  currentInstrument = 'PIANO',
  onUpdateSynthSettings
}: EffectsPanelProps) => {
  const [gain, setGain] = useState(0);
  const [eqValues, setEqValues] = useState(eqBands);

  // Compressor settings
  const [threshold, setThreshold] = useState(-24);
  const [ratio, setRatio] = useState(4);
  const [attack, setAttack] = useState(0.003);
  const [release, setRelease] = useState(0.25);

  // Limiter settings
  const [limiterThreshold, setLimiterThreshold] = useState(-1);
  const [limiterRelease, setLimiterRelease] = useState(0.1);

  // Effects settings
  const [reverb, setReverb] = useState(0);
  const [delay, setDelay] = useState(0);
  const [flanger, setFlanger] = useState(0);
  const [echo, setEcho] = useState(0);
  const [distortion, setDistortion] = useState(0);
  const [wahwah, setWahwah] = useState(0);
  const [timeStretch, setTimeStretch] = useState(1);
  const [pitchShift, setPitchShift] = useState(0);

  // Filter settings - parametric EQ
  const [paramEQBands, setParamEQBands] = useState<ParamEQBand[]>([
    { id: 1, frequency: 100, gain: 0, q: 1, enabled: true, color: bandColors[0] },
    { id: 2, frequency: 500, gain: -12, q: 1.2, enabled: true, color: bandColors[1] },
    { id: 3, frequency: 1000, gain: 3, q: 1.5, enabled: true, color: bandColors[2] },
    { id: 4, frequency: 5000, gain: 6, q: 1, enabled: true, color: bandColors[3] },
  ]);
  
  const [selectedBand, setSelectedBand] = useState<number | null>(1);
  const [filterType, setFilterType] = useState<'parametric' | 'lowpass' | 'highpass'>('parametric');
  const [cutoffFrequency, setCutoffFrequency] = useState(1000);
  const [filterResonance, setFilterResonance] = useState(0.5);

  // Canvas for frequency response drawing
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update EQ band value
  const handleEqChange = (index: number, newValue: number) => {
    const newValues = [...eqValues];
    newValues[index] = {
      ...newValues[index],
      value: newValue
    };
    setEqValues(newValues);
  };

  const handleApplyEffect = (effectName: string) => {
    console.log(`Applying ${effectName} effect`);
    // In a real implementation, this would apply audio effects to the selected track
  };

  // Update parametric EQ band parameters
  const updateParamEQBand = (id: number, param: keyof ParamEQBand, value: any) => {
    const updatedBands = paramEQBands.map(band => 
      band.id === id ? { ...band, [param]: value } : band
    );
    setParamEQBands(updatedBands);
  };

  // Add a new parametric EQ band
  const addParamEQBand = () => {
    if (paramEQBands.length >= 6) return; // Limit to 6 bands
    
    const newId = Math.max(0, ...paramEQBands.map(b => b.id)) + 1;
    const newBand: ParamEQBand = {
      id: newId,
      frequency: 1000,
      gain: 0,
      q: 1,
      enabled: true,
      color: bandColors[paramEQBands.length % bandColors.length]
    };
    
    setParamEQBands([...paramEQBands, newBand]);
    setSelectedBand(newId);
  };

  // Remove a parametric EQ band
  const removeParamEQBand = (id: number) => {
    if (paramEQBands.length <= 1) return; // Keep at least one band
    
    const updatedBands = paramEQBands.filter(band => band.id !== id);
    setParamEQBands(updatedBands);
    setSelectedBand(updatedBands[0]?.id || null);
  };

  // Toggle band on/off
  const toggleBandEnabled = (id: number) => {
    updateParamEQBand(id, 'enabled', !paramEQBands.find(b => b.id === id)?.enabled);
  };

  // Draw the frequency response curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the actual canvas dimensions from the element
    const width = canvas.width;
    const height = canvas.height;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Draw frequency response background
    ctx.fillStyle = '#161618';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    // Horizontal grid lines (dB markers)
    const dbMarkers = [-30, -24, -18, -12, -6, 0, 6, 12, 18];
    for (const db of dbMarkers) {
      const y = height / 2 - (db / 36) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      // Label the dB value
      if (db % 6 === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`${db > 0 ? '+' : ''}${db}`, width - 5, y + 3);
      }
    }

    // Vertical grid lines (frequency markers)
    const freqMarkers = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    for (const freq of freqMarkers) {
      // Convert frequency to logarithmic x position
      const x = (Math.log10(freq / 20) / Math.log10(20000 / 20)) * width;
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      // Label the frequency
      if ([100, 1000, 10000].includes(freq)) {
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(freq >= 1000 ? `${freq/1000}k` : `${freq}`, x, height - 5);
      }
    }

    // Draw 0 dB line with emphasis
    const zeroDbY = height / 2;
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, zeroDbY);
    ctx.lineTo(width, zeroDbY);
    ctx.stroke();

    // Draw band markers and controls
    paramEQBands.forEach(band => {
      if (!band.enabled) return;
      
      // Convert frequency to logarithmic x position
      const x = (Math.log10(band.frequency / 20) / Math.log10(20000 / 20)) * width;
      // Convert gain to y position
      const y = height / 2 - (band.gain / 36) * height;
      
      // Draw the band point
      ctx.fillStyle = band.color;
      ctx.strokeStyle = band.id === selectedBand ? '#fff' : band.color;
      ctx.lineWidth = band.id === selectedBand ? 3 : 2;
      
      ctx.beginPath();
      ctx.arc(x, y, band.id === selectedBand ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Simple frequency response curve simulation (not actual EQ filtering)
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Start at left edge, 0dB
    ctx.moveTo(0, height/2);
    
    // Draw curve through all points with 100 steps
    for (let x = 0; x <= width; x++) {
      // Convert x to frequency (logarithmic)
      const freq = 20 * Math.pow(20000 / 20, x / width);
      
      // Calculate response as sum of all enabled band responses
      let response = 0;
      for (const band of paramEQBands) {
        if (band.enabled) {
          // Simple bell curve approximation
          const freqRatio = freq / band.frequency;
          const logFreqRatio = Math.log2(freqRatio) * 2;
          const qFactor = 1 / band.q;
          response += band.gain * Math.exp(-logFreqRatio * logFreqRatio / qFactor);
        }
      }
      
      // Convert response to y coordinate
      const y = height / 2 - (response / 36) * height;
      
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();

  }, [paramEQBands, selectedBand]);

  // Fixed discrete points for dB markers
  const dbMarkers = [12, 8, 4, 0, -4, -8, -12];

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="synth" className="w-full flex-grow">
        <TabsList className="mb-4 bg-zinc-800 rounded-full">
          <TabsTrigger value="synth" className="flex items-center gap-1">
            <Waves className="h-4 w-4" />
            <span>Synth</span>
          </TabsTrigger>
          <TabsTrigger value="eq" className="flex items-center gap-1">
            <Sliders className="h-4 w-4" />
            <span>EQ</span>
          </TabsTrigger>
          <TabsTrigger value="dynamics" className="flex items-center gap-1">
            <ChevronsUpDown className="h-4 w-4" />
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
        
        <ScrollArea className="h-[calc(100%-40px)]">
          {/* Synth Controls Tab */}
          <TabsContent value="synth" className="space-y-4 pr-4">
            {synthSettings && onUpdateSynthSettings ? (
              <SynthControls 
                synthSettings={synthSettings}
                onUpdateSettings={onUpdateSynthSettings}
                currentInstrument={currentInstrument}
              />
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <Waves className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No synthesizer available</p>
                <p className="text-xs mt-2">Load an instrument to use the synthesizer</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="eq" className="space-y-4 pr-4">
            <div className="space-y-2 border-b rounded-xl py-[9px]">
              <div className="flex justify-between">
                <label className="text-sm">Master Gain</label>
                <span className="text-sm">{gain}dB</span>
              </div>
              <Slider value={[gain]} onValueChange={values => setGain(values[0])} min={-12} max={12} step={0.1} />
            </div>
            
            {/* Professional EQ visualization with vertical markers */}
            <div className="mt-4 flex flex-col bg-zinc-900 px-2 py-4 rounded-md border border-zinc-700">
              <h3 className="text-center text-sm font-medium text-zinc-400 mb-2">10-Band Graphic Equalizer</h3>
              
              {/* dB scale on the left */}
              <div className="flex">
                <div className="w-8 flex flex-col justify-between h-48 pr-1 border-r border-zinc-700">
                  {dbMarkers.map(db => (
                    <div key={`db-${db}`} className="flex items-center">
                      <span className="text-[9px] text-zinc-400 ml-auto">{db > 0 ? '+' : ''}{db}</span>
                      <div className="h-[1px] w-2 bg-zinc-700 ml-1"></div>
                    </div>
                  ))}
                </div>
                
                {/* EQ sliders */}
                <div className="flex-1">
                  <div className="flex justify-between items-stretch w-full h-48 relative">
                    {/* Horizontal grid lines */}
                    {dbMarkers.map(db => (
                      <div 
                        key={`grid-${db}`} 
                        className="absolute w-full h-[1px] bg-zinc-800"
                        style={{ 
                          top: `${((12-db)/24) * 100}%`
                        }}
                      ></div>
                    ))}
                    
                    {/* Center line (0 dB) highlighted */}
                    <div 
                      className="absolute w-full h-[1px] bg-zinc-600"
                      style={{ top: '50%' }}
                    ></div>
                    
                    {/* EQ sliders */}
                    {eqValues.map((band, index) => (
                      <div key={index} className="flex flex-col items-center justify-center" style={{ width: '9%' }}>
                        <VerticalSlider 
                          value={[band.value]} 
                          onValueChange={values => handleEqChange(index, values[0])} 
                          min={-12} 
                          max={12} 
                          step={1}
                          className="h-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Frequency labels below sliders */}
              <div className="flex justify-between items-center w-full pl-8 mt-2 border-t border-zinc-700 pt-2">
                {eqValues.map((band, index) => (
                  <div key={`label-${index}`} className="flex flex-col items-center justify-center" style={{ width: '9%' }}>
                    <span className="text-[9px] text-zinc-300 text-center w-full">{band.freq}</span>
                    <span className="text-[8px] text-blue-400">{band.value > 0 ? '+' : ''}{band.value}dB</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Preset buttons */}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="text-xs flex-1 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
                Flat
              </Button>
              <Button variant="outline" size="sm" className="text-xs flex-1 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
                Bass Boost
              </Button>
              <Button variant="outline" size="sm" className="text-xs flex-1 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
                Vocal
              </Button>
              <Button variant="outline" size="sm" className="text-xs flex-1 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
                Custom
              </Button>
            </div>
            
            <Button onClick={() => handleApplyEffect('equalizer')} disabled={!audioBuffer} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-full">
              Apply EQ
            </Button>
          </TabsContent>
          
          <TabsContent value="dynamics" className="space-y-6 pr-4 mx-0">
            <div className="space-y-4 border border-gray-700 rounded-md p-3 px-[34px]">
              <h3 className="text-sm font-medium">Compressor</h3>
              
              <div className="space-y-2 border-b rounded-xl py-[9px]">
                <div className="flex justify-between">
                  <label className="text-xs">Threshold</label>
                  <span className="text-xs">{threshold}dB</span>
                </div>
                <Slider value={[threshold]} onValueChange={values => setThreshold(values[0])} min={-60} max={0} step={0.1} />
              </div>
              
              <div className="space-y-2 border-b rounded-xl py-[9px]">
                <div className="flex justify-between">
                  <label className="text-xs">Ratio</label>
                  <span className="text-xs">{ratio}:1</span>
                </div>
                <Slider value={[ratio]} onValueChange={values => setRatio(values[0])} min={1} max={20} step={0.1} />
              </div>
              
              <div className="space-y-2 border-b rounded-xl py-[9px]">
                <div className="flex justify-between">
                  <label className="text-xs">Attack</label>
                  <span className="text-xs">{attack * 1000}ms</span>
                </div>
                <Slider value={[attack]} onValueChange={values => setAttack(values[0])} min={0.001} max={0.5} step={0.001} />
              </div>
              
              <div className="space-y-2 border-b rounded-xl py-[9px]">
                <div className="flex justify-between">
                  <label className="text-xs">Release</label>
                  <span className="text-xs">{release * 1000}ms</span>
                </div>
                <Slider value={[release]} onValueChange={values => setRelease(values[0])} min={0.01} max={2} step={0.01} />
              </div>
              
              <Button size="sm" onClick={() => handleApplyEffect('compressor')} disabled={!audioBuffer} className="w-full mt-2 rounded-full border bg-zinc-700 hover:bg-zinc-600">
                Apply Compressor
              </Button>
            </div>
            
            <div className="space-y-4 border border-gray-700 rounded-md p-3">
              <h3 className="text-sm font-medium">Limiter</h3>
              
              <div className="space-y-2 border-b rounded-xl py-[9px]">
                <div className="flex justify-between">
                  <label className="text-xs">Threshold</label>
                  <span className="text-xs">{limiterThreshold}dB</span>
                </div>
                <Slider value={[limiterThreshold]} onValueChange={values => setLimiterThreshold(values[0])} min={-30} max={0} step={0.1} />
              </div>
              
              <div className="space-y-2 border-b rounded-xl py-[9px]">
                <div className="flex justify-between">
                  <label className="text-xs">Release</label>
                  <span className="text-xs">{limiterRelease * 1000}ms</span>
                </div>
                <Slider value={[limiterRelease]} onValueChange={values => setLimiterRelease(values[0])} min={0.01} max={1} step={0.01} />
              </div>
              
              <Button size="sm" onClick={() => handleApplyEffect('limiter')} disabled={!audioBuffer} className="w-full mt-2 bg-zinc-700 hover:bg-zinc-600 rounded-full border py-0 my-[12px]">
                Apply Limiter
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="effects" className="space-y-4 pr-4">
            <div className="grid grid-cols-2 gap-4 py-[15px] mx-[5px] px-[6px] bg-zinc-800 rounded-xl border-zinc-600 shadow ">
              <div className="border-b px-1 mx-1 py-0 rounded-xl bg-gray-900">
                <div className="flex justify-between py-[9px] px-[9px]">
                  <label className="text-xs">Reverb</label>
                  <span className="text-xs">{reverb}%</span>
                </div>
                <Slider value={[reverb]} onValueChange={values => setReverb(values[0])} min={0} max={100} step={1} />
              </div>
              
              <div className="px-1 py-0 border-b rounded-xl bg-gray-800">
                <div className="flex justify-between px-[10px] py-[10px] my-0">
                  <label className="text-xs">Delay</label>
                  <span className="text-xs">{delay}ms</span>
                </div>
                <Slider value={[delay]} onValueChange={values => setDelay(values[0])} min={0} max={500} step={5} />
              </div>
              
              <div className="space-y-2 rounded-xl border-b bg-emerald-950 my-0 mx-0">
                <div className="flex justify-between mx-[12px] my-[8px] py-[4px]">
                  <label className="text-xs">Flanger</label>
                  <span className="text-xs">{flanger}%</span>
                </div>
                <Slider value={[flanger]} onValueChange={values => setFlanger(values[0])} min={0} max={100} step={1} />
              </div>
              
              <div className="space-y-2 rounded-xl bg-gray-700 border-b py-0">
                <div className="flex justify-between py-[8px] px-[12px]">
                  <label className="text-xs">Echo</label>
                  <span className="text-xs">{echo}%</span>
                </div>
                <Slider value={[echo]} onValueChange={values => setEcho(values[0])} min={0} max={100} step={1} />
              </div>
              
              <div className="space-y-2 border-b rounded-xl bg-pink-900">
                <div className="flex justify-between px-[16px] my-[9px] py-0">
                  <label className="text-xs">Distortion</label>
                  <span className="text-xs">{distortion}%</span>
                </div>
                <Slider value={[distortion]} onValueChange={values => setDistortion(values[0])} min={0} max={100} step={1} />
              </div>
              
              <div className="space-y-2 rounded-xl border-b px-[4px] bg-purple-900">
                <div className="flex justify-between mx-[12px] py-[5px]">
                  <label className="text-xs">Wah-Wah</label>
                  <span className="text-xs">{wahwah}%</span>
                </div>
                <Slider value={[wahwah]} onValueChange={values => setWahwah(values[0])} min={0} max={100} step={1} />
              </div>
            </div>
            
            <div className="space-y-2 mt-4 border-t border-gray-700 pt-4">
              <h3 className="text-sm font-medium">Time & Pitch Manipulation</h3>
              
              <div className="space-y-2 border-b rounded-xl py-[9px]">
                <div className="flex justify-between">
                  <label className="text-xs">Time Stretch</label>
                  <span className="text-xs">x{timeStretch.toFixed(2)}</span>
                </div>
                <Slider value={[timeStretch]} onValueChange={values => setTimeStretch(values[0])} min={0.5} max={2} step={0.01} />
              </div>
              
              <div className="space-y-2 border-b rounded-xl py-[9px]">
                <div className="flex justify-between">
                  <label className="text-xs">Pitch Shift</label>
                  <span className="text-xs">{pitchShift > 0 ? '+' : ''}{pitchShift} semitones</span>
                </div>
                <Slider value={[pitchShift]} onValueChange={values => setPitchShift(values[0])} min={-12} max={12} step={1} />
              </div>
            </div>
            
            <Button onClick={() => handleApplyEffect('time and effects')} disabled={!audioBuffer} className="w-full mt-4 rounded-full border py-[21px] font-bold text-zinc-50 bg-zinc-800 hover:bg-zinc-700 text-center">
              Apply Effects
            </Button>
          </TabsContent>
          
          <TabsContent value="filters" className="space-y-4 pr-4">
            <div className="space-y-4 bg-zinc-900 rounded-lg border border-zinc-800 p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Parametric Equalizer</h3>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 px-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                    onClick={addParamEQBand}
                    disabled={paramEQBands.length >= 6}
                  >
                    <BadgePlus className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Add Band</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-white"
                    onClick={() => handleApplyEffect('parametricEQ')}
                  >
                    <PlayCircle className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Preview</span>
                  </Button>
                </div>
              </div>
              
              {/* Frequency Response Visualization */}
              <div className="relative w-full h-48 rounded-md overflow-hidden border border-zinc-800">
                <canvas 
                  ref={canvasRef} 
                  width={500} 
                  height={200} 
                  className="w-full h-full"
                  onClick={(e) => {
                    // Handle click on canvas to select nearest band
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const canvasWidth = rect.width;
                    
                    // Convert x to frequency (logarithmic)
                    const freq = 20 * Math.pow(20000 / 20, x / canvasWidth);
                    
                    // Find closest band
                    let closestBand = null;
                    let minDistance = Infinity;
                    
                    paramEQBands.forEach(band => {
                      const distance = Math.abs(Math.log10(band.frequency) - Math.log10(freq));
                      if (distance < minDistance) {
                        minDistance = distance;
                        closestBand = band;
                      }
                    });
                    
                    if (closestBand) {
                      setSelectedBand(closestBand.id);
                    }
                  }}
                />
              </div>
              
              {/* Band Controls */}
              <div className="bg-zinc-800 rounded-md p-3 border border-zinc-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">Band {selectedBand}</h4>
                    {selectedBand && (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: paramEQBands.find(b => b.id === selectedBand)?.color || '#fff' }}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-6 px-2 text-xs ${paramEQBands.find(b => b.id === selectedBand)?.enabled ? 'text-white' : 'text-gray-500'}`}
                          onClick={() => selectedBand && toggleBandEnabled(selectedBand)}
                        >
                          {paramEQBands.find(b => b.id === selectedBand)?.enabled ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>
                    )}
                  </div>
                  {selectedBand && paramEQBands.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950"
                      onClick={() => selectedBand && removeParamEQBand(selectedBand)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                
                {selectedBand && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Frequency</span>
                        <span>{paramEQBands.find(b => b.id === selectedBand)?.frequency.toFixed(0)} Hz</span>
                      </div>
                      <Slider 
                        value={[paramEQBands.find(b => b.id === selectedBand)?.frequency || 1000]} 
                        min={20} 
                        max={20000} 
                        step={1} 
                        onValueChange={(values) => selectedBand && updateParamEQBand(selectedBand, 'frequency', values[0])}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Gain</span>
                        <span>{paramEQBands.find(b => b.id === selectedBand)?.gain.toFixed(1)} dB</span>
                      </div>
                      <Slider 
                        value={[paramEQBands.find(b => b.id === selectedBand)?.gain || 0]} 
                        min={-18} 
                        max={18} 
                        step={0.1} 
                        onValueChange={(values) => selectedBand && updateParamEQBand(selectedBand, 'gain', values[0])}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Q</span>
                        <span>{paramEQBands.find(b => b.id === selectedBand)?.q.toFixed(2)}</span>
                      </div>
                      <Slider 
                        value={[paramEQBands.find(b => b.id === selectedBand)?.q || 1]} 
                        min={0.1} 
                        max={10} 
                        step={0.1} 
                        onValueChange={(values) => selectedBand && updateParamEQBand(selectedBand, 'q', values[0])}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
