
import React, { useEffect } from 'react';
import { Note } from '@/types/pianoRoll';
import { AutomationLane } from '@/types/automation';
import { NoteScheduler } from '@/utils/audioSynthesis';

interface AutomationIntegrationProps {
  isPlaying: boolean;
  currentPosition: number;
  notes: Note[];
  automationLanes: AutomationLane[];
  getValueAtTime: (laneId: string, time: number) => number;
  noteScheduler: NoteScheduler;
}

export const AutomationIntegration: React.FC<AutomationIntegrationProps> = ({
  isPlaying,
  currentPosition,
  notes,
  automationLanes,
  getValueAtTime,
  noteScheduler
}) => {
  // Apply velocity from automation to notes when playing
  useEffect(() => {
    if (isPlaying) {
      const velocityLane = automationLanes.find(lane => lane.type === 'velocity');
      if (!velocityLane) return;
      
      // Schedule notes with velocity from automation
      notes.forEach(note => {
        if (note.startTime >= currentPosition && 
            note.startTime < currentPosition + 1) {
          // Get velocity at note start time
          const velocity = getValueAtTime(velocityLane.id, note.startTime);
          // Update note velocity
          noteScheduler.updateNoteVelocity(note.id, Math.round(velocity));
        }
      });
      
      // Update tempo if needed
      const tempoLane = automationLanes.find(lane => lane.type === 'tempo');
      if (tempoLane) {
        const tempo = getValueAtTime(tempoLane.id, currentPosition);
        noteScheduler.setTempo(tempo);
      }
    }
  }, [isPlaying, currentPosition, notes, automationLanes, getValueAtTime, noteScheduler]);
  
  return null; // This is a behavior-only component with no UI
};
