/**
 * Simple audio synthesis utility for piano roll playback
 */

// Map MIDI note numbers to frequencies
export const midiToFrequency = (midiNote: number): number => {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

// Create and configure a simple oscillator
export const createOscillator = (
  audioContext: AudioContext,
  frequency: number,
  type: OscillatorType = 'sine',
  gainValue: number = 0.5
): { oscillator: OscillatorNode; gain: GainNode } => {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = gainValue;
  
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  
  return { oscillator, gain };
};

// Create a simple envelope for the sound
export const applyEnvelope = (
  gainNode: GainNode,
  audioContext: AudioContext,
  attackTime: number = 0.01,
  decayTime: number = 0.1,
  sustainLevel: number = 0.7,
  releaseTime: number = 0.2
): void => {
  const currentTime = audioContext.currentTime;
  
  // Attack
  gainNode.gain.setValueAtTime(0, currentTime);
  gainNode.gain.linearRampToValueAtTime(1, currentTime + attackTime);
  
  // Decay to sustain level
  gainNode.gain.linearRampToValueAtTime(
    sustainLevel,
    currentTime + attackTime + decayTime
  );
};

// Play a single note
export const playNote = (
  audioContext: AudioContext,
  midiNote: number,
  duration: number = 0.5,
  oscillatorType: OscillatorType = 'sine'
): void => {
  const frequency = midiToFrequency(midiNote);
  const { oscillator, gain } = createOscillator(audioContext, frequency, oscillatorType);
  
  applyEnvelope(gain, audioContext);
  
  oscillator.start();
  
  // Stop the note after the specified duration
  setTimeout(() => {
    const currentTime = audioContext.currentTime;
    gain.gain.linearRampToValueAtTime(0, currentTime + 0.1);
    setTimeout(() => oscillator.stop(), 100);
  }, duration * 1000);
};

// Playback scheduler for piano roll
export class NoteScheduler {
  private audioContext: AudioContext;
  private activeNotes: Map<string, { oscillator: OscillatorNode; gain: GainNode; endTime: number; velocity: number }>;
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private currentPosition: number = 0;
  private playbackSpeed: number = 1.0;
  private cleanupInterval: number | null = null;
  private tempo: number = 120;

  constructor() {
    this.audioContext = new AudioContext();
    this.activeNotes = new Map();
  }

  public startPlayback(position: number = 0): void {
    if (this.isPlaying) return;
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.isPlaying = true;
    this.currentPosition = position;
    this.startTime = this.audioContext.currentTime;
    
    // Start cleanup interval to ensure notes stop properly
    if (!this.cleanupInterval) {
      this.cleanupInterval = window.setInterval(() => this.cleanupExpiredNotes(), 100);
    }
  }

  private cleanupExpiredNotes(): void {
    const now = this.audioContext.currentTime;
    this.activeNotes.forEach((note, id) => {
      if (note.endTime <= now) {
        this.stopNote(id);
      }
    });
  }

  public stopPlayback(): void {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    this.currentPosition = (this.audioContext.currentTime - this.startTime) * this.playbackSpeed + this.currentPosition;
    
    // Stop all active notes
    this.activeNotes.forEach((note, id) => {
      this.stopNote(id);
    });
    
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  public playNote(noteId: string, midiNote: number, velocity: number = 100, duration: number = 0.5): void {
    if (this.activeNotes.has(noteId)) {
      this.stopNote(noteId);
    }
    
    const frequency = midiToFrequency(midiNote);
    const gain = (velocity / 127) * 0.7; // Scale velocity to gain
    
    const { oscillator, gain: gainNode } = createOscillator(
      this.audioContext,
      frequency,
      'triangle',
      gain
    );
    
    applyEnvelope(gainNode, this.audioContext, 0.01, 0.1, 0.7, 0.2);
    
    oscillator.start();
    const endTime = this.audioContext.currentTime + duration;
    this.activeNotes.set(noteId, { oscillator, gain: gainNode, endTime, velocity });
    
    // Automatically schedule note to stop
    gainNode.gain.setValueAtTime(gainNode.gain.value, endTime - 0.1);
    gainNode.gain.linearRampToValueAtTime(0, endTime);
    oscillator.stop(endTime + 0.1);
  }

  public updateNoteVelocity(noteId: string, velocity: number): void {
    const note = this.activeNotes.get(noteId);
    if (!note) return;
    
    const newGain = (velocity / 127) * 0.7; // Scale velocity to gain
    const currentTime = this.audioContext.currentTime;
    
    note.velocity = velocity;
    note.gain.gain.setValueAtTime(note.gain.gain.value, currentTime);
    note.gain.gain.linearRampToValueAtTime(newGain, currentTime + 0.05);
  }

  public stopNote(noteId: string): void {
    const note = this.activeNotes.get(noteId);
    if (!note) return;
    
    const { gain, oscillator } = note;
    const currentTime = this.audioContext.currentTime;
    
    // Release envelope
    gain.gain.cancelScheduledValues(currentTime);
    gain.gain.setValueAtTime(gain.gain.value, currentTime);
    gain.gain.linearRampToValueAtTime(0, currentTime + 0.1);
    
    try {
      // Stop oscillator after release
      oscillator.stop(currentTime + 0.2);
    } catch (e) {
      // Oscillator might have already stopped
      console.log("Note already stopped");
    }
    
    // Remove from active notes
    this.activeNotes.delete(noteId);
  }

  public get currentTime(): number {
    if (!this.isPlaying) return this.currentPosition;
    return (this.audioContext.currentTime - this.startTime) * this.playbackSpeed + this.currentPosition;
  }

  public setPosition(position: number): void {
    this.currentPosition = position;
    if (this.isPlaying) {
      this.startTime = this.audioContext.currentTime;
    }
  }

  public setTempo(bpm: number): void {
    const newTempo = Math.max(40, Math.min(240, bpm));
    const tempoRatio = newTempo / this.tempo;
    
    if (this.isPlaying) {
      // Adjust playback speed proportionally to tempo change
      this.playbackSpeed = this.playbackSpeed * tempoRatio;
      
      // Update current position before changing tempo
      this.currentPosition = this.currentTime;
      this.startTime = this.audioContext.currentTime;
    }
    
    this.tempo = newTempo;
  }

  public setPlaybackSpeed(speed: number): void {
    if (this.isPlaying) {
      // Update current position before changing speed
      this.currentPosition = this.currentTime;
      this.startTime = this.audioContext.currentTime;
    }
    this.playbackSpeed = speed;
  }

  public get playing(): boolean {
    return this.isPlaying;
  }

  public scheduleNotes(notes: any[], startTime: number, endTime: number): void {
    if (!this.isPlaying) return;
    
    const currentTime = this.currentTime;
    
    notes.forEach(note => {
      // Check if the note should be played in this time window
      if (note.startTime <= endTime && note.startTime + note.duration >= startTime) {
        // Note should be played if it's not already playing
        if (!this.activeNotes.has(note.id)) {
          // Calculate when to play the note
          const noteStartTime = Math.max(0, note.startTime - currentTime);
          
          if (noteStartTime <= 0) {
            // Play immediately if the note should already be playing
            this.playNote(note.id, note.key, note.velocity, note.duration);
          } else {
            // Schedule the note to play in the future
            setTimeout(() => {
              if (this.isPlaying) {
                this.playNote(note.id, note.key, note.velocity, note.duration);
              }
            }, noteStartTime * 1000);
          }
        }
      }
    });
  }
  
  // Clean up resources when done
  public dispose(): void {
    this.stopPlayback();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.activeNotes.clear();
    this.audioContext.close();
  }
}
