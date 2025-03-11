
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
  private activeNotes: Map<string, { oscillator: OscillatorNode; gain: GainNode }>;
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private currentPosition: number = 0;
  private playbackSpeed: number = 1.0;

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
  }

  public stopPlayback(): void {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    this.currentPosition = (this.audioContext.currentTime - this.startTime) * this.playbackSpeed + this.currentPosition;
    
    // Stop all active notes
    this.activeNotes.forEach((note, id) => {
      this.stopNote(id);
    });
  }

  public playNote(noteId: string, midiNote: number, velocity: number = 100): void {
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
    this.activeNotes.set(noteId, { oscillator, gain: gainNode });
  }

  public stopNote(noteId: string): void {
    const note = this.activeNotes.get(noteId);
    if (!note) return;
    
    const { gain } = note;
    const currentTime = this.audioContext.currentTime;
    
    // Release envelope
    gain.gain.linearRampToValueAtTime(0, currentTime + 0.1);
    
    // Remove from active notes after release
    setTimeout(() => {
      const noteToStop = this.activeNotes.get(noteId);
      if (noteToStop) {
        noteToStop.oscillator.stop();
        this.activeNotes.delete(noteId);
      }
    }, 100);
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
            this.playNote(note.id, note.key, note.velocity);
          } else {
            // Schedule the note to play in the future
            setTimeout(() => {
              if (this.isPlaying) {
                this.playNote(note.id, note.key, note.velocity);
              }
            }, noteStartTime * 1000);
          }
          
          // Schedule when to stop the note
          const noteDuration = note.duration;
          setTimeout(() => {
            this.stopNote(note.id);
          }, (noteStartTime + noteDuration) * 1000);
        }
      }
    });
  }
}
