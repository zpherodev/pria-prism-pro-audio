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

  // Initialize AudioContext and Synthesizer
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
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
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
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
    if (!audioContextRef.current || !synthesizerRef.current) return;
    
    const instrument = DEFAULT_INSTRUMENTS[instrumentKey as keyof typeof DEFAULT_INSTRUMENTS];
    if (!instrument) {
      toast.error(`Unknown instrument: ${instrumentKey}`);
      return;
    }
    
    // Set the current instrument and update the synthesizer
    setCurrentInstrument(instrumentKey);
    synthesizerRef.current.setInstrument(instrumentKey);
    setSynthSettings(synthesizerRef.current.getSettings());
    
    toast.success(`Loaded ${instrument.name} synthesizer`);
  }, []);

  // Map a sound file to a MIDI note (still keeps sample capability)
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

  // Play a mapped sound (sample or synthesized)
  const playMappedSound = useCallback((midiNote: number) => {
    if (!audioContextRef.current) return;
    
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
      
      // Clean up when finished
      source.onended = () => {
        audioSourcesRef.current.delete(midiNote);
        setCurrentPlayingNote(prev => prev === midiNote ? null : prev);
      };
    } else if (synthesizerRef.current) {
      // No sample found, use the synthesizer
      synthesizerRef.current.playNote(midiNote, 1.0);
      setCurrentPlayingNote(midiNote);
      
      // Clear the current playing note after a reasonable time (2 seconds)
      setTimeout(() => {
        setCurrentPlayingNote(prev => prev === midiNote ? null : prev);
      }, 2000);
    }
  }, [mappedSounds]);

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
    
    setCurrentPlayingNote(null);
  }, []);

  // Play a mapped sound when a MIDI note is received from the piano roll
  const playNoteFromPianoRoll = useCallback((note: number, velocity: number) => {
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
        
        // Clear the current playing note after the note is expected to complete
        const releaseTime = synthSettings?.envelope.release || 0.5;
        setTimeout(() => {
          setCurrentPlayingNote(prev => prev === note ? null : prev);
        }, (releaseTime + 1) * 1000); // Add 1 second buffer
      }
    } else {
      // Note off
      if (synthesizerRef.current) {
        synthesizerRef.current.stopNote(note);
      }
    }
  }, [mappedSounds, playMappedSound, synthSettings]);

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
