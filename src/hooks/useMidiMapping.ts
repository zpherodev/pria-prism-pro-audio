
import { useState, useCallback, useRef, useEffect } from 'react';
import { MidiMappedSound } from '@/types/pianoRoll';

export const useMidiMapping = () => {
  const [mappedSounds, setMappedSounds] = useState<MidiMappedSound[]>([]);
  const [startOctave, setStartOctave] = useState(0); // Starting at C4 (middle C)
  const [currentPlayingNote, setCurrentPlayingNote] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourcesRef = useRef<Map<number, AudioBufferSourceNode>>(new Map());

  // Initialize AudioContext
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    return () => {
      // Clean up active audio sources on unmount
      audioSourcesRef.current.forEach(source => {
        try {
          source.stop();
        } catch (e) {
          // Ignore errors if source already stopped
        }
      });
      audioSourcesRef.current.clear();
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Handle octave changes with expanded range
  const handleOctaveChange = useCallback((octave: number) => {
    // Standard piano has 88 keys (A0 to C8)
    // Allow octave range from -5 (A0) to 3 (C8)
    if (octave >= -5 && octave <= 3) {
      setStartOctave(octave);
    }
  }, []);

  // Map a sound file to a MIDI note
  const mapSoundToNote = useCallback(async (midiNote: number, file: File) => {
    if (!audioContextRef.current) return;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      setMappedSounds(prev => {
        // Remove any existing mapping for this note
        const filtered = prev.filter(sound => sound.midiNote !== midiNote);
        
        // Add the new mapping
        return [...filtered, {
          midiNote,
          audioBuffer,
          filePath: URL.createObjectURL(file),
          fileName: file.name
        }];
      });
      
      return true;
    } catch (error) {
      console.error('Failed to decode audio file:', error);
      return false;
    }
  }, []);

  // Play a mapped sound
  const playMappedSound = useCallback((midiNote: number) => {
    if (!audioContextRef.current) return;
    
    // Find the mapped sound for this note
    const sound = mappedSounds.find(s => s.midiNote === midiNote);
    if (!sound || !sound.audioBuffer) return;
    
    // Stop any currently playing instance of this note
    const existingSource = audioSourcesRef.current.get(midiNote);
    if (existingSource) {
      try {
        existingSource.stop();
      } catch (e) {
        // Ignore errors if source already stopped
      }
    }
    
    // Create a new source
    const source = audioContextRef.current.createBufferSource();
    source.buffer = sound.audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    // Start playing
    source.start();
    audioSourcesRef.current.set(midiNote, source);
    setCurrentPlayingNote(midiNote);
    
    // Clean up when finished
    source.onended = () => {
      audioSourcesRef.current.delete(midiNote);
      setCurrentPlayingNote(prev => prev === midiNote ? null : prev);
    };
  }, [mappedSounds]);

  // Stop all playing sounds
  const stopAllSounds = useCallback(() => {
    audioSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Ignore errors if source already stopped
      }
    });
    audioSourcesRef.current.clear();
    setCurrentPlayingNote(null);
  }, []);

  // Play a mapped sound when a MIDI note is received from the piano roll
  const playNoteFromPianoRoll = useCallback((note: number, velocity: number) => {
    if (velocity > 0) {
      playMappedSound(note);
    }
  }, [playMappedSound]);

  return {
    mappedSounds,
    startOctave,
    currentPlayingNote,
    handleOctaveChange,
    mapSoundToNote,
    playMappedSound,
    stopAllSounds,
    playNoteFromPianoRoll
  };
};
