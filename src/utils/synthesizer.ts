
/**
 * Advanced audio synthesis utilities for creating and modifying sounds in real-time
 */

export interface OscillatorSettings {
  type: OscillatorType;
  detune: number;
  gain: number;
  octaveShift: number;
}

export interface EnvelopeSettings {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface FilterSettings {
  type: BiquadFilterType;
  frequency: number;
  Q: number;
  gain: number;
  enabled: boolean;
}

export interface LFOSettings {
  type: OscillatorType;
  frequency: number; 
  depth: number;
  target: 'frequency' | 'amplitude' | 'filter';
  enabled: boolean;
}

export interface SynthesizerSettings {
  oscillators: OscillatorSettings[];
  envelope: EnvelopeSettings;
  filter: FilterSettings;
  lfo: LFOSettings;
  masterGain: number;
}

// Default settings for different instrument types
export const DEFAULT_SYNTH_SETTINGS: Record<string, SynthesizerSettings> = {
  PIANO: {
    oscillators: [
      { type: 'sine', detune: 0, gain: 0.8, octaveShift: 0 },
      { type: 'triangle', detune: 4, gain: 0.3, octaveShift: 0 }
    ],
    envelope: { attack: 0.005, decay: 0.2, sustain: 0.6, release: 0.4 },
    filter: {
      type: 'lowpass',
      frequency: 2000,
      Q: 1,
      gain: 0,
      enabled: true
    },
    lfo: {
      type: 'sine',
      frequency: 0.5,
      depth: 0,
      target: 'amplitude',
      enabled: false
    },
    masterGain: 0.7
  },
  BASS: {
    oscillators: [
      { type: 'sawtooth', detune: 0, gain: 0.7, octaveShift: 0 },
      { type: 'sine', detune: 0, gain: 0.4, octaveShift: -1 }
    ],
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.3 },
    filter: {
      type: 'lowpass',
      frequency: 800,
      Q: 2,
      gain: 0,
      enabled: true
    },
    lfo: {
      type: 'sine',
      frequency: 6,
      depth: 50,
      target: 'filter',
      enabled: true
    },
    masterGain: 0.8
  },
  DRUMS: {
    oscillators: [
      { type: 'sine', detune: 0, gain: 1.0, octaveShift: 0 },
      { type: 'triangle', detune: 0, gain: 0.3, octaveShift: 0 }
    ],
    envelope: { attack: 0.001, decay: 0.2, sustain: 0.0, release: 0.1 },
    filter: {
      type: 'lowpass',
      frequency: 300,
      Q: 1,
      gain: 0,
      enabled: true
    },
    lfo: {
      type: 'sine',
      frequency: 0,
      depth: 0,
      target: 'frequency',
      enabled: false
    },
    masterGain: 1.0
  },
  GUITAR: {
    oscillators: [
      { type: 'sawtooth', detune: 0, gain: 0.7, octaveShift: 0 },
      { type: 'triangle', detune: 10, gain: 0.3, octaveShift: 0 }
    ],
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.7, release: 0.3 },
    filter: {
      type: 'lowpass',
      frequency: 3000,
      Q: 1,
      gain: 0,
      enabled: true
    },
    lfo: {
      type: 'sine',
      frequency: 5,
      depth: 5,
      target: 'frequency',
      enabled: true
    },
    masterGain: 0.7
  }
};

export class Synthesizer {
  private audioContext: AudioContext;
  private settings: SynthesizerSettings;
  private activeNotes: Map<number, {
    oscillators: OscillatorNode[],
    gains: GainNode[],
    mainGain: GainNode,
    filter: BiquadFilterNode,
    lfo?: OscillatorNode,
    lfoGain?: GainNode
  }>;
  
  constructor(audioContext: AudioContext, instrument: string = 'PIANO') {
    this.audioContext = audioContext;
    this.settings = { ...DEFAULT_SYNTH_SETTINGS[instrument] };
    this.activeNotes = new Map();
  }

  /**
   * Update the synthesizer settings
   */
  updateSettings(settings: Partial<SynthesizerSettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    // Update any active notes with new settings
    this.activeNotes.forEach((note, midiNote) => {
      this.updateActiveNote(midiNote, note);
    });
  }

  /**
   * Convert MIDI note to frequency
   */
  private midiToFrequency(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Play a note with the current synthesizer settings
   */
  playNote(midiNote: number, velocity: number = 1): void {
    // Stop the note if it's already playing
    if (this.activeNotes.has(midiNote)) {
      this.stopNote(midiNote);
    }

    const baseFrequency = this.midiToFrequency(midiNote);
    const now = this.audioContext.currentTime;
    
    // Create main gain for the note
    const mainGain = this.audioContext.createGain();
    mainGain.gain.value = 0; // Start at 0, will be controlled by envelope
    
    // Create filter
    const filter = this.audioContext.createBiquadFilter();
    filter.type = this.settings.filter.type;
    filter.frequency.value = this.settings.filter.frequency;
    filter.Q.value = this.settings.filter.Q;
    if (this.settings.filter.type === 'peaking' || this.settings.filter.type === 'lowshelf' || this.settings.filter.type === 'highshelf') {
      filter.gain.value = this.settings.filter.gain;
    }
    
    // Create oscillators
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    
    this.settings.oscillators.forEach(osc => {
      // Calculate actual frequency with octave shift
      const actualFrequency = baseFrequency * Math.pow(2, osc.octaveShift);
      
      // Create oscillator
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = osc.type;
      oscillator.frequency.value = actualFrequency;
      oscillator.detune.value = osc.detune;
      
      // Create gain for this oscillator
      const oscGain = this.audioContext.createGain();
      oscGain.gain.value = osc.gain * velocity * this.settings.masterGain;
      
      // Connect oscillator -> oscGain -> filter -> mainGain -> destination
      oscillator.connect(oscGain);
      oscGain.connect(filter);
      
      // Add to arrays
      oscillators.push(oscillator);
      gains.push(oscGain);
      
      // Start the oscillator
      oscillator.start();
    });
    
    // Connect filter -> mainGain -> destination
    filter.connect(mainGain);
    mainGain.connect(this.audioContext.destination);
    
    // Create and connect LFO if enabled
    let lfo: OscillatorNode | undefined;
    let lfoGain: GainNode | undefined;
    
    if (this.settings.lfo.enabled && this.settings.lfo.depth > 0) {
      lfo = this.audioContext.createOscillator();
      lfo.type = this.settings.lfo.type;
      lfo.frequency.value = this.settings.lfo.frequency;
      
      lfoGain = this.audioContext.createGain();
      lfoGain.gain.value = this.settings.lfo.depth;
      
      lfo.connect(lfoGain);
      
      // Connect LFO to the appropriate target
      switch (this.settings.lfo.target) {
        case 'amplitude':
          lfoGain.connect(mainGain.gain);
          break;
        case 'frequency':
          oscillators.forEach(osc => {
            lfoGain.connect(osc.frequency);
          });
          break;
        case 'filter':
          lfoGain.connect(filter.frequency);
          break;
      }
      
      lfo.start();
    }
    
    // Apply envelope to mainGain
    const { attack, decay, sustain, release } = this.settings.envelope;
    
    mainGain.gain.cancelScheduledValues(now);
    mainGain.gain.setValueAtTime(0, now);
    mainGain.gain.linearRampToValueAtTime(velocity, now + attack);
    mainGain.gain.linearRampToValueAtTime(velocity * sustain, now + attack + decay);
    
    // Store active note
    this.activeNotes.set(midiNote, {
      oscillators,
      gains,
      mainGain,
      filter,
      lfo,
      lfoGain
    });
  }

  /**
   * Update an active note with new settings
   */
  private updateActiveNote(midiNote: number, note: {
    oscillators: OscillatorNode[],
    gains: GainNode[],
    mainGain: GainNode,
    filter: BiquadFilterNode,
    lfo?: OscillatorNode,
    lfoGain?: GainNode
  }): void {
    // Update filter settings
    note.filter.type = this.settings.filter.type;
    note.filter.frequency.value = this.settings.filter.frequency;
    note.filter.Q.value = this.settings.filter.Q;
    
    if (this.settings.filter.type === 'peaking' || this.settings.filter.type === 'lowshelf' || this.settings.filter.type === 'highshelf') {
      note.filter.gain.value = this.settings.filter.gain;
    }
    
    // Update oscillator and gain settings
    this.settings.oscillators.forEach((oscSettings, i) => {
      if (i < note.oscillators.length) {
        const baseFrequency = this.midiToFrequency(midiNote);
        const actualFrequency = baseFrequency * Math.pow(2, oscSettings.octaveShift);
        
        note.oscillators[i].type = oscSettings.type;
        note.oscillators[i].frequency.value = actualFrequency;
        note.oscillators[i].detune.value = oscSettings.detune;
        
        // Update gain
        note.gains[i].gain.value = oscSettings.gain * this.settings.masterGain;
      }
    });
    
    // Update LFO settings if present
    if (note.lfo && note.lfoGain) {
      note.lfo.type = this.settings.lfo.type;
      note.lfo.frequency.value = this.settings.lfo.frequency;
      note.lfoGain.gain.value = this.settings.lfo.depth;
    }
  }

  /**
   * Stop playing a note
   */
  stopNote(midiNote: number): void {
    const note = this.activeNotes.get(midiNote);
    if (!note) return;
    
    const now = this.audioContext.currentTime;
    const release = this.settings.envelope.release;
    
    // Apply release envelope
    note.mainGain.gain.cancelScheduledValues(now);
    note.mainGain.gain.setValueAtTime(note.mainGain.gain.value, now);
    note.mainGain.gain.linearRampToValueAtTime(0, now + release);
    
    // Stop and disconnect everything after release time
    setTimeout(() => {
      // Stop oscillators
      note.oscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {
          // Oscillator might have already been stopped
        }
      });
      
      // Stop LFO if it exists
      if (note.lfo) {
        try {
          note.lfo.stop();
          note.lfo.disconnect();
        } catch (e) {
          // LFO might have already been stopped
        }
      }
      
      // Disconnect all nodes
      note.gains.forEach(gain => gain.disconnect());
      note.filter.disconnect();
      note.mainGain.disconnect();
      if (note.lfoGain) note.lfoGain.disconnect();
      
      // Remove from active notes
      this.activeNotes.delete(midiNote);
    }, release * 1000);
  }

  /**
   * Stop all playing notes
   */
  stopAllNotes(): void {
    const noteIds = Array.from(this.activeNotes.keys());
    noteIds.forEach(noteId => this.stopNote(noteId));
  }

  /**
   * Get current settings
   */
  getSettings(): SynthesizerSettings {
    return { ...this.settings };
  }
  
  /**
   * Set current instrument preset
   */
  setInstrument(instrument: string): void {
    if (instrument in DEFAULT_SYNTH_SETTINGS) {
      this.settings = { ...DEFAULT_SYNTH_SETTINGS[instrument] };
    }
  }
}
