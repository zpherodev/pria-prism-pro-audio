
import React, { useRef, useEffect } from 'react';
import { Note, SnapValue, ToolType, DragMode, SheetMusicSettings } from '@/types/pianoRoll';
import { LoopSettings } from '@/utils/persistenceUtils';
import { renderSheetPianoRoll } from '@/utils/sheetPianoRollUtils';

interface PianoRollCanvasProps {
  notes: Note[];
  isDragging: boolean;
  currentNote: Note | null;
  dragMode: DragMode;
  activeTool: ToolType;
  currentPosition: number;
  snapValue: SnapValue;
  loopSettings: LoopSettings;
  dragStartX: number | null;
  zoom: number;
  sheetMusicSettings: SheetMusicSettings;
  rowIndex?: number; // Added rowIndex for multi-row support
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export const PianoRollCanvas: React.FC<PianoRollCanvasProps> = ({
  notes,
  isDragging,
  currentNote,
  dragMode,
  activeTool,
  currentPosition,
  snapValue,
  loopSettings,
  dragStartX,
  zoom,
  sheetMusicSettings,
  rowIndex = 0, // Default to first row if not specified
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onContextMenu
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sheet music style layout with improved spacing
    renderSheetPianoRoll(
      ctx,
      canvas,
      notes,
      currentPosition,
      zoom,
      loopSettings,
      activeTool,
      isDragging,
      currentNote,
      dragStartX,
      dragMode,
      snapValue,
      {
        beatsPerMeasure: sheetMusicSettings.beatsPerMeasure,
        measuresPerRow: sheetMusicSettings.measuresPerRow,
        totalRows: 1, // Always render just 1 row per canvas
        pixelsPerBeat: 40 * zoom, // Reduced from 50 to make keys smaller
        rowSpacing: 20, // Reduced spacing between rows
        rowIndex: rowIndex // Pass the row index to render the correct segment
      }
    );
  }, [
    zoom, 
    notes, 
    currentPosition, 
    isDragging, 
    currentNote, 
    loopSettings, 
    activeTool, 
    dragStartX, 
    dragMode,
    snapValue,
    sheetMusicSettings,
    rowIndex
  ]);

  return (
    <canvas 
      ref={canvasRef} 
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onContextMenu={onContextMenu}
      className="min-w-100 max-w-900"
      data-row-index={rowIndex} // Add data attribute to identify the row
    />
  );
};
