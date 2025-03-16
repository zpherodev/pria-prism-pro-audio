
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { PianoRollCanvas } from './PianoRollCanvas';
import { Note, SnapValue, ToolType, DragMode, SheetMusicSettings } from '@/types/pianoRoll';
import { LoopSettings } from '@/utils/persistenceUtils';

interface PianoRollRowsProps {
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
  rowCount: number;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export const PianoRollRows: React.FC<PianoRollRowsProps> = ({
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
  rowCount,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onContextMenu
}) => {
  // Generate the rows
  const pianoRollRows = Array.from({ length: rowCount }, (_, i) => i);
  
  return (
    <>
      {pianoRollRows.map((rowIndex) => (
        <ScrollArea 
          key={`piano-roll-row-${rowIndex}`} 
          className="border border-zinc-700 rounded-md bg-zinc-900"
        >
          <div className="w-full h-[200px] overflow-auto">
            <PianoRollCanvas
              notes={notes}
              isDragging={isDragging}
              currentNote={currentNote}
              dragMode={dragMode}
              activeTool={activeTool}
              currentPosition={currentPosition}
              snapValue={snapValue}
              loopSettings={loopSettings}
              dragStartX={dragStartX}
              zoom={zoom}
              sheetMusicSettings={sheetMusicSettings}
              rowIndex={rowIndex}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseLeave}
              onContextMenu={onContextMenu}
            />
          </div>
        </ScrollArea>
      ))}
    </>
  );
};
