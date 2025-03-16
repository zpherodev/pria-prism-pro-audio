
export interface Note {
  id: string;
  key: number; // MIDI note number (0-127)
  startTime: number; // In seconds
  duration: number; // In seconds
  velocity: number; // 0-127
}

export interface PianoRollProps {
  duration: number;
  zoom: number;
  onZoomChange?: (zoom: number) => void;
}

export type SnapValue = '1/32' | '1/16' | '1/8' | '1/4' | '1/2' | '1';

export type DragMode = 'create' | 'move' | 'resize' | 'loopStart' | 'loopEnd' | 'loopRegion';
export type ToolType = 'select' | 'pencil' | 'eraser' | 'loop';

export interface SheetMusicSettings {
  beatsPerMeasure: number;
  measuresPerRow: number;
  totalRows: number;
  rowSpacing?: number; // Added row spacing option
}
