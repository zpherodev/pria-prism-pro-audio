
import React, { useRef, useEffect } from 'react';
import { Note, SnapValue, ToolType, DragMode, PianoRollLayoutType } from '@/types/pianoRoll';
import { LoopSettings } from '@/utils/persistenceUtils';
import { renderPianoRoll } from '@/utils/pianoRollUtils';
import { renderSheetPianoRoll, defaultSheetMusicSettings } from '@/utils/sheetPianoRollUtils';

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
  layoutType: PianoRollLayoutType;
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
  layoutType,
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

    if (layoutType === 'traditional') {
      canvas.width = Math.max(canvas.width, 1000);
      
      renderPianoRoll(
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
        snapValue
      );
    } else {
      // Sheet music style layout
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
          ...defaultSheetMusicSettings,
          pixelsPerBeat: 50 * zoom
        }
      );
    }
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
    layoutType
  ]);

  return (
    <canvas 
      ref={canvasRef} 
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onContextMenu={onContextMenu}
      className="min-w-full"
    />
  );
};
