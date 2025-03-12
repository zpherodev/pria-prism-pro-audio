
/**
 * Utility functions for persisting piano roll notes in local storage
 */

export interface StorableNote {
  id: string;
  key: number;
  startTime: number;
  duration: number;
  velocity: number;
}

export interface LoopSettings {
  enabled: boolean;
  startTime: number;
  endTime: number;
}

export const saveNotesToLocalStorage = (notes: StorableNote[]): void => {
  try {
    localStorage.setItem('pianoRollNotes', JSON.stringify(notes));
  } catch (error) {
    console.error('Failed to save notes to local storage:', error);
  }
};

export const loadNotesFromLocalStorage = (): StorableNote[] => {
  try {
    const notesJson = localStorage.getItem('pianoRollNotes');
    if (!notesJson) return [];
    
    return JSON.parse(notesJson) as StorableNote[];
  } catch (error) {
    console.error('Failed to load notes from local storage:', error);
    return [];
  }
};

export const saveLoopSettingsToLocalStorage = (settings: LoopSettings): void => {
  try {
    localStorage.setItem('pianoRollLoopSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save loop settings to local storage:', error);
  }
};

export const loadLoopSettingsFromLocalStorage = (): LoopSettings | null => {
  try {
    const settingsJson = localStorage.getItem('pianoRollLoopSettings');
    if (!settingsJson) return null;
    
    return JSON.parse(settingsJson) as LoopSettings;
  } catch (error) {
    console.error('Failed to load loop settings from local storage:', error);
    return null;
  }
};
