
import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Music } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { MidiMappedSound } from '@/types/pianoRoll';
import { toast } from 'sonner';

interface HorizontalPianoProps {
  startOctave: number;
  onOctaveChange: (octave: number) => void;
  mappedSounds: MidiMappedSound[];
  onSoundSelect: (midiNote: number) => void;
  onSoundDrop: (midiNote: number, file: File) => void;
  currentPlayingNote?: number | null;
}

export const HorizontalPiano: React.FC<HorizontalPianoProps> = ({
  startOctave,
  onOctaveChange,
  mappedSounds,
  onSoundSelect,
  onSoundDrop,
  currentPlayingNote
}) => {
  const [draggedOverKey, setDraggedOverKey] = useState<number | null>(null);
  const keysRef = useRef<(HTMLDivElement | null)[]>([]);
  const keyboardListenerRef = useRef<((e: KeyboardEvent) => void) | null>(null);
  const keyStates = useRef<Set<string>>(new Set());
  
  // Piano key layout: 12 keys per octave, C through B
  const keyNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const isBlackKey = [false, true, false, true, false, false, true, false, true, false, true, false];
  
  // Show two octaves of keys
  const totalKeys = 24; // 2 octaves x 12 keys per octave
  const midiOffset = startOctave * 12 + 60; // Middle C (C4) is MIDI note 60
  
  // Calculate octave label based on standard piano range
  const getOctaveLabel = (octave: number) => {
    if (octave === -5) return "A0-B0";
    if (octave === 3) return "C8";
    return `${keyNames[0]}${octave + 4}-${keyNames[11]}${octave + 4}`;
  };
  
  // Handle octave navigation with expanded range
  const incrementOctave = () => {
    if (startOctave < 3) { // Up to C8
      onOctaveChange(startOctave + 1);
    }
  };
  
  const decrementOctave = () => {
    if (startOctave > -5) { // Down to A0
      onOctaveChange(startOctave - 1);
    }
  };
  
  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent, midiNote: number) => {
    e.preventDefault();
    setDraggedOverKey(midiNote);
  };
  
  const handleDragLeave = () => {
    setDraggedOverKey(null);
  };
  
  const handleDrop = (e: React.DragEvent, midiNote: number) => {
    e.preventDefault();
    setDraggedOverKey(null);
    
    // Check if files were dropped
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        onSoundDrop(midiNote, file);
        
        // Get note name (e.g., C4, F#3)
        const noteOctave = Math.floor(midiNote / 12) - 1;
        const noteName = keyNames[midiNote % 12] + noteOctave;
        
        toast.success(`Sound mapped to ${noteName}`);
      } else {
        toast.error('Please drop an audio file');
      }
    }
  };
  
  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond if no modal dialogs or text fields are active
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Don't handle repeated key events from key being held down
      if (keyStates.current.has(e.code)) {
        return;
      }
      
      keyStates.current.add(e.code);
      
      // Map computer keyboard to piano keys for first octave
      // Bottom row: Z-M for white keys, S-J for black keys
      const keyMap: Record<string, number> = {
        'z': 0, 's': 1, 'x': 2, 'd': 3, 'c': 4, 'v': 5, 
        'g': 6, 'b': 7, 'h': 8, 'n': 9, 'j': 10, 'm': 11,
        // Top row: Q-P for white keys, 2-0 for black keys (second octave)
        'q': 12, '2': 13, 'w': 14, '3': 15, 'e': 16, 'r': 17, 
        '5': 18, 't': 19, '6': 20, 'y': 21, '7': 22, 'u': 23
      };
      
      if (keyMap[e.key.toLowerCase()] !== undefined) {
        const midiNote = midiOffset + keyMap[e.key.toLowerCase()];
        onSoundSelect(midiNote);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Remove from active keys
      keyStates.current.delete(e.code);
    };
    
    keyboardListenerRef.current = handleKeyDown;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      if (keyboardListenerRef.current) {
        window.removeEventListener('keydown', keyboardListenerRef.current);
        window.removeEventListener('keyup', handleKeyUp);
      }
    };
  }, [midiOffset, onSoundSelect]);
  
  return (
    <div className="horizontal-piano-container">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">MIDI Mapping - {getOctaveLabel(startOctave)}</h3>
        <div className="flex items-center space-x-1">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={decrementOctave}
            disabled={startOctave <= -5}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={incrementOctave}
            disabled={startOctave >= 3}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="piano-keys-container flex h-16 mb-4 relative">
        {Array.from({ length: totalKeys }).map((_, i) => {
          const midiNote = midiOffset + i;
          const octaveIndex = Math.floor(i / 12);
          const noteIndex = i % 12;
          const mappedSound = mappedSounds.find(sound => sound.midiNote === midiNote);
          
          return (
            <div 
              key={`key-${midiNote}`}
              ref={ref => keysRef.current[i] = ref}
              className={`
                piano-key relative 
                ${isBlackKey[noteIndex] ? 'black-key' : 'white-key'} 
                ${isBlackKey[noteIndex] ? 'z-10 h-3/5 -mx-1.5 w-3' : 'h-full flex-1 min-w-6'} 
                ${draggedOverKey === midiNote ? 'border-2 border-amber-400' : ''}
                ${currentPlayingNote === midiNote ? 'bg-emerald-500' : 
                  isBlackKey[noteIndex] ? 'bg-zinc-800' : 'bg-white'}
                ${mappedSound ? 'mapped' : ''}
                transition-colors
              `}
              onDragOver={(e) => handleDragOver(e, midiNote)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, midiNote)}
              onClick={() => onSoundSelect(midiNote)}
            >
              {/* Display label on C notes, A4 (440Hz), and special keys */}
              {(noteIndex === 0 || 
                (noteIndex === 9 && octaveIndex === 0 && startOctave === 0) || 
                (noteIndex === 9 && startOctave === -5)) && (
                <div className={`key-label text-xs absolute bottom-1 ${isBlackKey[noteIndex] ? 'text-white' : 'text-zinc-800'} text-center w-full`}>
                  {keyNames[noteIndex]}{startOctave + 4 + octaveIndex}
                </div>
              )}
              {mappedSound && (
                <div className={`mapped-indicator absolute top-1 left-1/2 transform -translate-x-1/2 text-xs px-0.5 py-0.5 rounded ${isBlackKey[noteIndex] ? 'bg-zinc-600' : 'bg-zinc-200'}`}>
                  <Music className={`h-2 w-2 ${isBlackKey[noteIndex] ? 'text-white' : 'text-zinc-800'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="text-xs text-zinc-400 text-center">
        Drag audio files onto keys to map sounds. Click to preview. Use keyboard Z-M (bottom row) and Q-U (top row) to play.
      </div>
    </div>
  );
};
