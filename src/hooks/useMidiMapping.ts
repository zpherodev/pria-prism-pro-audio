import { useState, useCallback, useRef, useEffect } from 'react';
import { MidiMappedSound } from '@/types/pianoRoll';
import { toast } from 'sonner';
import { Synthesizer, SynthesizerSettings } from '@/utils/synthesizer';

// Define the default instrument mappings
const DEFAULT_INSTRUMENTS = {
  PIANO: {
    name: 'Piano',
    baseMidiNote: 60, // Middle C (C4)
  },
  BASS: {
    name: 'Bass',
    baseMidiNote: 36, // C2
  },
  DRUMS: {
    name: 'Drums',
    baseMidiNote: 36, // Standard MIDI mapping for kick drum
  },
  GUITAR: {
    name: 'Guitar',
    baseMidiNote: 48, // C3
  }
};

export const useMidiMapping = () => {
  const [mappedSounds, setMappedSounds] = useState<MidiMappedSound[]>([]);
  const [startOctave, setStartOctave] = useState(0); // Starting at C4 (middle C)
  const [currentPlayingNote, setCurrentPlayingNote] = useState<number | null>(null);
  const [currentInstrument, setCurrentInstrument] = useState<string>('PIANO');
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthesizerRef = useRef<Synthesizer | null>(null);
  const audioSourcesRef = useRef<Map<number, AudioBufferSourceNode>>(new Map());
  const [synthSettings, setSynthSettings] = useState<SynthesizerSettings | null>(null);
  const contextClosedRef = useRef<boolean>(false);
  const activeNotesRef = useRef<Set<number>>(new Set());

  // Initialize AudioContext and Synthesizer
  useEffect(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      try {
        audioContextRef.current = new AudioContext();
        contextClosedRef.current = false;
      } catch (e) {
        console.error("Failed to create AudioContext:", e);
        return;
      }
    }
    
    if (!synthesizerRef.current && audioContextRef.current) {
      synthesizerRef.current = new Synthesizer(audioContextRef.current, currentInstrument);
      setSynthSettings(synthesizerRef.current.getSettings());
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
      
      // Stop all synthesizer notes
      if (synthesizerRef.current) {
        synthesizerRef.current.stopAllNotes();
      }
      
      // Only close the AudioContext if it hasn't been closed already
      if (audioContextRef.current && !contextClosedRef.current) {
        try {
          audioContextRef.current.close();
          contextClosedRef.current = true;
        } catch (e) {
          console.error("Error closing AudioContext:", e);
        }
      }
    };
  }, [currentInstrument]);

  // Handle octave changes with expanded range
  const handleOctaveChange = useCallback((octave: number) => {
    // Standard piano has 88 keys (A0 to C8)
    // Allow octave range from -5 (A0) to 3 (C8)
    if (octave >= -5 && octave <= 3) {
      setStartOctave(octave);
    }
  }, []);

  // Load default instrument sound (now uses the synthesizer)
  const loadDefaultSounds = useCallback(async (instrumentKey: string) => {
    // Safety check - make sure it's a valid instrument key
    if (!DEFAULT_INSTRUMENTS[instrumentKey as keyof typeof DEFAULT_INSTRUMENTS]) {
      toast.error(`Unknown instrument: ${instrumentKey}`);
      return;
    }

    // If AudioContext is closed, create a new one
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      try {
        audioContextRef.current = new AudioContext();
        contextClosedRef.current = false;
        
        // We need to create a new synthesizer since the context is new
        synthesizerRef.current = new Synthesizer(audioContextRef.current, instrumentKey);
        setSynthSettings(synthesizerRef.current.getSettings());
        setCurrentInstrument(instrumentKey);
        
        toast.success(`Loaded ${DEFAULT_INSTRUMENTS[instrumentKey as keyof typeof DEFAULT_INSTRUMENTS].name} synthesizer`);
        return;
      } catch (e) {
        console.error("Failed to create AudioContext:", e);
        toast.error("Failed to initialize audio. Please refresh the page.");
        return;
      }
    }
    
    // Resume the context if needed
    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (e) {
        console.error("Failed to resume AudioContext:", e);
      }
    }
    
    // Stop any currently playing notes
    stopAllSounds();
    
    try {
      // Update the synthesizer with the new instrument
      if (synthesizerRef.current) {
        synthesizerRef.current.setInstrument(instrumentKey);
        setSynthSettings(synthesizerRef.current.getSettings());
      } else if (audioContextRef.current) {
        // Create a new synthesizer if needed
        synthesizerRef.current = new Synthesizer(audioContextRef.current, instrumentKey);
        setSynthSettings(synthesizerRef.current.getSettings());
      }
      
      // Update the current instrument
      setCurrentInstrument(instrumentKey);
      
      toast.success(`Loaded ${DEFAULT_INSTRUMENTS[instrumentKey as keyof typeof DEFAULT_INSTRUMENTS].name} synthesizer`);
    } catch (e) {
      console.error("Error loading instrument:", e);
      toast.error("Failed to load instrument. Please try again.");
    }
  }, []);

  // Map a sound file to a MIDI note (still keeps sample capability)
  const mapSoundToNote = useCallback(async (midiNote: number, file: File) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      try {
        audioContextRef.current = new AudioContext();
        contextClosedRef.current = false;
      } catch (e) {
        console.error("Failed to create AudioContext:", e);
        return false;
      }
    }
    
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

  // Play a mapped sound (sample or synthesized)
  const playMappedSound = useCallback((midiNote: number) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      try {
        audioContextRef.current = new AudioContext();
        contextClosedRef.current = false;
        
        // Recreate synthesizer with new context
        if (!synthesizerRef.current) {
          synthesizerRef.current = new Synthesizer(audioContextRef.current, currentInstrument);
          setSynthSettings(synthesizerRef.current.getSettings());
        }
      } catch (e) {
        console.error("Failed to create AudioContext:", e);
        return;
      }
    }
    
    // Resume the audio context if it's suspended (needed for browsers with autoplay restrictions)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(err => {
        console.error("Failed to resume AudioContext:", err);
      });
    }
    
    // Find the mapped sound sample for this note if it exists
    const sound = mappedSounds.find(s => s.midiNote === midiNote);
    
    if (sound && sound.audioBuffer) {
      // Play the mapped sample
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
      activeNotesRef.current.add(midiNote);
      
      // Clean up when finished
      source.onended = () => {
        audioSourcesRef.current.delete(midiNote);
        activeNotesRef.current.delete(midiNote);
        setCurrentPlayingNote(prev => prev === midiNote ? null : prev);
      };
    } else if (synthesizerRef.current) {
      // No sample found, use the synthesizer
      synthesizerRef.current.playNote(midiNote, 1.0);
      setCurrentPlayingNote(midiNote);
      activeNotesRef.current.add(midiNote);
      
      // Clear the current playing note after a reasonable time (2 seconds)
      setTimeout(() => {
        // Only clear if this note hasn't been stopped already
        if (activeNotesRef.current.has(midiNote)) {
          synthesizerRef.current?.stopNote(midiNote);
          activeNotesRef.current.delete(midiNote);
          setCurrentPlayingNote(prev => prev === midiNote ? null : prev);
        }
      }, 2000);
    }
  }, [mappedSounds, currentInstrument]);

  // Stop all playing sounds
  const stopAllSounds = useCallback(() => {
    // Stop sample-based sounds
    audioSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Ignore errors if source already stopped
      }
    });
    audioSourcesRef.current.clear();
    
    // Stop synthesizer sounds
    if (synthesizerRef.current) {
      synthesizerRef.current.stopAllNotes();
    }
    
    // Clear active notes tracking
    activeNotesRef.current.clear();
    setCurrentPlayingNote(null);
  }, []);

  // Play a mapped sound when a MIDI note is received from the piano roll
  const playNoteFromPianoRoll = useCallback((note: number, velocity: number) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      try {
        audioContextRef.current = new AudioContext();
        contextClosedRef.current = false;
        
        // Recreate synthesizer with new context
        if (!synthesizerRef.current) {
          synthesizerRef.current = new Synthesizer(audioContextRef.current, currentInstrument);
          setSynthSettings(synthesizerRef.current.getSettings());
        }
      } catch (e) {
        console.error("Failed to create AudioContext:", e);
        return;
      }
    }
    
    // Resume the audio context if it's suspended
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(err => {
        console.error("Failed to resume AudioContext:", err);
      });
    }
    
    if (velocity > 0) {
      // First check if there's a sample mapped
      const sound = mappedSounds.find(s => s.midiNote === note);
      
      if (sound && sound.audioBuffer) {
        // Use the mapped sample
        playMappedSound(note);
      } else if (synthesizerRef.current) {
        // No sample found, use the synthesizer with velocity
        synthesizerRef.current.playNote(note, velocity / 127);
        setCurrentPlayingNote(note);
        activeNotesRef.current.add(note);
      }
    } else {
      // Note off
      if (synthesizerRef.current) {
        synthesizerRef.current.stopNote(note);
        activeNotesRef.current.delete(note);
        setCurrentPlayingNote(prev => prev === note ? null : prev);
      }
    }
  }, [mappedSounds, playMappedSound, currentInstrument]);

  // Update synthesizer settings
  const updateSynthSettings = useCallback((newSettings: Partial<SynthesizerSettings>) => {
    if (!synthesizerRef.current) return;
    
    synthesizerRef.current.updateSettings(newSettings);
    setSynthSettings(synthesizerRef.current.getSettings());
  }, []);

  return {
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
  };
};
