import React, { useState, useCallback } from 'react';
import { MediaBin } from './editor/MediaBin';
import { Timeline } from './editor/Timeline';
import { Preview } from './editor/Preview';
import { EffectsPanel } from './editor/EffectsPanel';
import { PianoRoll } from './editor/PianoRoll';
import { HorizontalPiano } from './editor/HorizontalPiano';
import { useMidiMapping } from '@/hooks/useMidiMapping';
import { ChevronLeft, ChevronRight, Music, AudioWaveform } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Note } from '@/types/pianoRoll';

export const AudioEditor = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState<'midimap' | 'pianoroll'>('midimap');
  
  const {
    mappedSounds,
    startOctave,
    currentPlayingNote,
    currentInstrument,
    synthSettings,
    handleOctaveChange,
    mapSoundToNote,
    playMappedSound,
    stopAllSounds,
    playNoteFromPianoRoll,
    loadDefaultSounds,
    updateSynthSettings
  } = useMidiMapping();
  
  const handleNotePlayed = useCallback((note: Note) => {
    playNoteFromPianoRoll(note.key, note.velocity);
  }, [playNoteFromPianoRoll]);
  
  const handleSoundDrop = useCallback((midiNote: number, file: File) => {
    mapSoundToNote(midiNote, file);
  }, [mapSoundToNote]);
  
  const handleAudioBufferLoaded = (buffer: AudioBuffer) => {
    setAudioBuffer(buffer);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setAudioBuffer(null);
  };

  const handleLoadInstrument = (instrument: string) => {
    loadDefaultSounds(instrument);
  };

  const getGridClasses = () => {
    if (leftPanelCollapsed && rightPanelCollapsed) {
      return "grid-cols-[1fr_98fr_1fr]";
    } else if (leftPanelCollapsed) {
      return "grid-cols-[1fr_79fr_20fr]";
    } else if (rightPanelCollapsed) {
      return "grid-cols-[20fr_79fr_1fr]";
    } else {
      return "grid-cols-[20fr_60fr_20fr]";
    }
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className={`grid gap-4 ${getGridClasses()}`}>
        <div className={`panel flex flex-col ${leftPanelCollapsed ? "items-center" : ""}`}>
          {leftPanelCollapsed ? (
            <Button variant="ghost" size="icon" onClick={() => setLeftPanelCollapsed(false)} className="mb-2">
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Media Library</h3>
                <Button variant="ghost" size="icon" onClick={() => setLeftPanelCollapsed(true)} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-500">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <MediaBin 
                onFileSelect={handleFileSelect} 
                onLoadDefaultSounds={handleLoadInstrument}
                hasDefaultSounds={mappedSounds.length > 0}
              />
            </>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {activeTab === 'midimap' && (
            <div className="panel flex-grow">
              <Preview file={selectedFile} onAudioBufferLoaded={handleAudioBufferLoaded} />
            </div>
          )}
          
          <div className={`panel ${activeTab === 'pianoroll' ? 'flex-grow' : ''}`}>
            <Tabs 
              defaultValue="midimap" 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as 'midimap' | 'pianoroll')}
              className={activeTab === 'pianoroll' ? 'h-full flex flex-col' : ''}
            >
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="midimap" className="flex items-center gap-1">
                  <AudioWaveform className="h-4 w-4" />
                  MIDI Mapping
                </TabsTrigger>
                <TabsTrigger value="pianoroll" className="flex items-center gap-1">
                  <Music className="h-4 w-4" />
                  Piano Roll
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="midimap" className="flex-grow">
                <div className="space-y-4">
                  <HorizontalPiano 
                    startOctave={startOctave}
                    onOctaveChange={handleOctaveChange}
                    mappedSounds={mappedSounds}
                    onSoundSelect={playMappedSound}
                    onSoundDrop={handleSoundDrop}
                    currentPlayingNote={currentPlayingNote}
                  />
                  
                  <div className="mapped-sounds-list">
                    <h3 className="text-sm font-medium mb-2">Mapped Sounds</h3>
                    {mappedSounds.length === 0 ? (
                      <div className="text-sm text-zinc-500 text-center p-4 border border-dashed border-zinc-700 rounded-md">
                        No sounds mapped yet. Drag audio files onto piano keys or use the instrument preset buttons.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {mappedSounds.map(sound => {
                          const noteNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
                          const octave = Math.floor(sound.midiNote / 12) - 1;
                          const noteName = noteNames[sound.midiNote % 12] + octave;
                          
                          return (
                            <div 
                              key={sound.midiNote} 
                              className="flex justify-between items-center p-2 bg-zinc-800 rounded-md"
                              onClick={() => playMappedSound(sound.midiNote)}
                            >
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-6 w-6 bg-zinc-700">
                                  <Music className="h-3 w-3" />
                                </Button>
                                <div>
                                  <div className="text-xs font-medium">{noteName}</div>
                                  <div className="text-xs text-zinc-400 truncate max-w-32">{sound.fileName}</div>
                                </div>
                              </div>
                              <div className="text-xs text-zinc-400">
                                {sound.audioBuffer?.duration.toFixed(1)}s
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="pianoroll" className="flex-grow h-full">
                <PianoRoll 
                  duration={audioBuffer?.duration || 30} 
                  zoom={zoom}
                  onZoomChange={setZoom}
                  onNotePlayed={handleNotePlayed}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className={`panel flex flex-col ${rightPanelCollapsed ? "items-center" : ""}`}>
          {rightPanelCollapsed ? (
            <Button variant="ghost" size="icon" onClick={() => setRightPanelCollapsed(false)} className="mb-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Effects</h3>
                <Button variant="ghost" size="icon" onClick={() => setRightPanelCollapsed(true)} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-500">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <EffectsPanel 
                audioBuffer={audioBuffer} 
                synthSettings={synthSettings}
                currentInstrument={currentInstrument}
                onUpdateSynthSettings={updateSynthSettings}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
