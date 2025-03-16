
import { Note } from '@/types/pianoRoll';
import { AutomationLane } from '@/types/automation';

export interface LoopSettings {
  enabled: boolean;
  startTime: number;
  endTime: number;
}

// Save notes to local storage
export const saveNotesToLocalStorage = (notes: Note[]): void => {
  localStorage.setItem('piano-roll-notes', JSON.stringify(notes));
};

// Load notes from local storage
export const loadNotesFromLocalStorage = (): Note[] => {
  const notesJson = localStorage.getItem('piano-roll-notes');
  return notesJson ? JSON.parse(notesJson) : [];
};

// Save loop settings to local storage
export const saveLoopSettingsToLocalStorage = (settings: LoopSettings): void => {
  localStorage.setItem('piano-roll-loop-settings', JSON.stringify(settings));
};

// Load loop settings from local storage
export const loadLoopSettingsFromLocalStorage = (): LoopSettings | null => {
  const settingsJson = localStorage.getItem('piano-roll-loop-settings');
  return settingsJson ? JSON.parse(settingsJson) : null;
};

// Save automation lanes to local storage
export const saveAutomationLanesToLocalStorage = (lanes: AutomationLane[]): void => {
  localStorage.setItem('piano-roll-automation-lanes', JSON.stringify(lanes));
};

// Load automation lanes from local storage
export const loadAutomationLanesFromLocalStorage = (): AutomationLane[] => {
  const lanesJson = localStorage.getItem('piano-roll-automation-lanes');
  return lanesJson ? JSON.parse(lanesJson) : [];
};
