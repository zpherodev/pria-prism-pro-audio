
import React, { useCallback, useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { PianoRollToolbar } from './pianoroll/PianoRollToolbar';
import { PianoRollCanvas } from './pianoroll/PianoRollCanvas';
import { usePianoRollState } from '@/hooks/usePianoRollState';
import { useAutomationState } from '@/hooks/useAutomationState';
import { Note, SheetMusicSettings } from '@/types/pianoRoll';
import { AutomationPanel } from './automation/AutomationPanel';
import { Button } from "@/components/ui/button";
import { PianoRollRows } from './pianoroll/PianoRollRows';
import { AutomationIntegration } from './pianoroll/AutomationIntegration';
import { handleMouseDown, handleMouseMove, handleMouseUp } from './pianoroll/PianoRollMouseHandlers';

interface PianoRollProps {
  duration: number;
  zoom: number;
  onZoomChange?: (zoom: number) => void;
  onNotePlayed?: (note: Note) => void;
}

const PianoRoll: React.FC<PianoRollProps> = ({ 
  duration, 
  zoom,
  onZoomChange,
  onNotePlayed 
}) => {
  const [sheetMusicSettings, setSheetMusicSettings] = useState<SheetMusicSettings>({
    beatsPerMeasure: 4,
    measuresPerRow: 8, // Show 8 measures per row
    totalRows: 4      // 4 rows like in the reference image
  });
  
  const {
    notes,
    setNotes,
    isDragging,
    setIsDragging,
    currentNote,
    setCurrentNote,
    dragMode,
    setDragMode,
    activeTool,
    setActiveTool,
    isPlaying,
    currentPosition,
    noteScheduler,
    snapValue,
    setSnapValue,
    loopSettings,
    setLoopSettings,
    dragStartX,
    setDragStartX,
    togglePlayback,
    resetPlayback,
    playNotePreview,
    toggleLoopMode,
    clearAllNotes,
    getSnapValueInSeconds,
    snapTimeToGrid
  } = usePianoRollState(duration);
  
  // Add automation state
  const {
    automationLanes,
    setAutomationLanes,
    getValueAtTime
  } = useAutomationState(duration);

  // Pass note played events to parent when notes are played in the piano roll
  useEffect(() => {
    if (onNotePlayed && isPlaying) {
      const notesInCurrentTimeWindow = notes.filter(note => 
        note.startTime <= currentPosition && 
        note.startTime + note.duration >= currentPosition
      );
      
      notesInCurrentTimeWindow.forEach(note => {
        onNotePlayed(note);
      });
    }
  }, [isPlaying, currentPosition, notes, onNotePlayed]);

  // Smaller key dimensions for better responsiveness
  const keyWidth = 40; // Reduced from 60
  const keyHeight = 16; // Reduced from 20
  const totalKeys = 88; // Piano standard
  const lowestKey = 21; // A0 in MIDI
  const keysPerRow = 24; // Each row shows 2 octaves (24 keys)

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.5, 10);
    if (onZoomChange) onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.5, 0.1);
    if (onZoomChange) onZoomChange(newZoom);
  };

  // Create mouse handlers with all required props
  const mouseHandlerProps = {
    keyWidth,
    keyHeight,
    totalKeys,
    lowestKey,
    keysPerRow,
    zoom,
    beatsPerMeasure: sheetMusicSettings.beatsPerMeasure,
    measuresPerRow: sheetMusicSettings.measuresPerRow,
    snapTimeToGrid,
    getSnapValueInSeconds,
    playNotePreview,
    setNotes,
    setCurrentNote,
    setIsDragging,
    setDragMode,
    setDragStartX,
    setLoopSettings,
    notes,
    activeTool,
    loopSettings,
    dragStartX,
    isDragging,
    currentNote,
    dragMode
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleMouseDown(e, mouseHandlerProps);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleMouseMove(e, mouseHandlerProps);
  };

  const handleCanvasMouseUp = useCallback(() => {
    handleMouseUp(mouseHandlerProps);
  }, [
    activeTool, 
    dragMode, 
    isDragging, 
    currentNote, 
    setNotes, 
    setIsDragging, 
    setCurrentNote, 
    setDragStartX, 
    setLoopSettings
  ]);

  // Handle imported MIDI notes
  const handleNotesImported = (importedNotes: Note[]) => {
    setNotes(importedNotes);
  };

  // Prevent context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };
  
  return (
    <div className="piano-roll-container flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <PianoRollToolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          snapValue={snapValue}
          setSnapValue={setSnapValue}
          isPlaying={isPlaying}
          togglePlayback={togglePlayback}
          resetPlayback={resetPlayback}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          loopEnabled={loopSettings.enabled}
          toggleLoopMode={toggleLoopMode}
          clearAllNotes={clearAllNotes}
          notes={notes}
          onNotesImported={handleNotesImported}
        />
      </div>
      
      {/* Piano Roll Rows */}
      <PianoRollRows
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
        rowCount={4} // 4 rows like in the reference image
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onContextMenu={handleContextMenu}
      />
      
      {/* Automation Integration (non-visual component) */}
      <AutomationIntegration
        isPlaying={isPlaying}
        currentPosition={currentPosition}
        notes={notes}
        automationLanes={automationLanes}
        getValueAtTime={getValueAtTime}
        noteScheduler={noteScheduler}
      />
      
      {/* Add automation panel */}
      <AutomationPanel
        lanes={automationLanes}
        onLanesChange={setAutomationLanes}
        zoom={zoom}
        duration={duration}
        currentPosition={currentPosition}
        snapValue={snapValue}
      />
    </div>
  );
};

export { PianoRoll };
