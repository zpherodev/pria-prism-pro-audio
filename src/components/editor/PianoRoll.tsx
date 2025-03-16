import React, { useCallback, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { PianoRollToolbar } from './pianoroll/PianoRollToolbar';
import { PianoRollCanvas } from './pianoroll/PianoRollCanvas';
import { usePianoRollState } from '@/hooks/usePianoRollState';
import { Note, SheetMusicSettings } from '@/types/pianoRoll';
import { Button } from "@/components/ui/button";

interface PianoRollProps {
  duration: number;
  zoom: number;
  onZoomChange?: (zoom: number) => void;
}

const PianoRoll: React.FC<PianoRollProps> = ({ 
  duration, 
  zoom,
  onZoomChange 
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

  // Fixed the math issue with cursor position
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    if (!canvas) return;
    
    // Get the row index from the canvas data attribute
    const rowIndex = parseInt(canvas.getAttribute('data-row-index') || '0', 10);
    
    // Handle right-click to erase notes
    if (e.button === 2) {
      e.preventDefault(); // Prevent context menu
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (x <= keyWidth) return; // Ignore right clicks on piano keys
      
      const pixelsPerSecond = zoom * 100;
      const beatsPerRow = sheetMusicSettings.beatsPerMeasure * sheetMusicSettings.measuresPerRow;
      const secondsPerBeat = 60 / 120; // Assuming 120 BPM
      const secondsPerRow = beatsPerRow * secondsPerBeat;
      const rowStartTime = rowIndex * secondsPerRow;
      
      // Find and remove the note under the cursor
      setNotes(prevNotes => prevNotes.filter(note => {
        const midiNoteOffset = note.key - lowestKey;
        const noteRowIndex = Math.floor(midiNoteOffset / keysPerRow);
        
        // Skip if note isn't in this row
        if (noteRowIndex !== rowIndex) return true;
        
        const keyOffsetInRow = midiNoteOffset % keysPerRow;
        const noteY = (keysPerRow - keyOffsetInRow - 1) * keyHeight + 20;
        
        // Calculate note position in this row
        const noteStartInRow = note.startTime - rowStartTime;
        const noteX = keyWidth + (noteStartInRow / secondsPerBeat) * (zoom * 40);
        const noteWidth = note.duration / secondsPerBeat * (zoom * 40);
        
        return !(
          x >= noteX && x <= noteX + noteWidth &&
          y >= noteY && y <= noteY + keyHeight
        );
      }));
      
      return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (x <= keyWidth) {
      // Calculate the correct MIDI note based on the row and position
      const keyIndex = Math.floor((y - 20) / keyHeight);
      const midiNote = lowestKey + (rowIndex * keysPerRow) + (keysPerRow - keyIndex - 1);
      playNotePreview(midiNote);
      return;
    }
    
    // Calculate time based on the position and row
    const beatsPerRow = sheetMusicSettings.beatsPerMeasure * sheetMusicSettings.measuresPerRow;
    const secondsPerBeat = 60 / 120; // Assuming 120 BPM
    const secondsPerRow = beatsPerRow * secondsPerBeat;
    const rowStartTime = rowIndex * secondsPerRow;
    
    const timeInRow = ((x - keyWidth) / (zoom * 40)) * secondsPerBeat;
    const time = rowStartTime + timeInRow;
    const snappedTime = snapTimeToGrid(time);
    
    // Calculate the correct MIDI note based on the row and position
    const keyIndex = Math.floor((y - 20) / keyHeight);
    const midiNote = lowestKey + (rowIndex * keysPerRow) + (keysPerRow - keyIndex - 1);
    
    // Handle loop tool
    if (loopSettings.enabled || activeTool === 'loop') {
      // Loop tool code remains the same, just with adjusted calculations
      if (activeTool === 'loop') {
        setIsDragging(true);
        setDragMode('loopRegion');
        setDragStartX(x);
        
        setLoopSettings(prev => ({
          ...prev,
          startTime: snappedTime,
          endTime: snappedTime + getSnapValueInSeconds() * 4
        }));
        
        return;
      }
    }
    
    if (activeTool === 'pencil') {
      const newNote: Note = {
        id: Date.now().toString(),
        key: midiNote,
        startTime: snappedTime,
        duration: getSnapValueInSeconds(),
        velocity: 100
      };
      
      setCurrentNote(newNote);
      setDragMode('resize');
      setIsDragging(true);
      
      playNotePreview(midiNote);
      
      setNotes(prev => [...prev, newNote]);
    } else if (activeTool === 'select') {
      // Find notes in the current row
      for (const note of notes) {
        const midiNoteOffset = note.key - lowestKey;
        const noteRowIndex = Math.floor(midiNoteOffset / keysPerRow);
        
        // Skip if note isn't in this row
        if (noteRowIndex !== rowIndex) continue;
        
        const keyOffsetInRow = midiNoteOffset % keysPerRow;
        const noteY = (keysPerRow - keyOffsetInRow - 1) * keyHeight + 20;
        
        // Calculate note position in this row
        const noteStartInRow = note.startTime - rowStartTime;
        const noteX = keyWidth + (noteStartInRow / secondsPerBeat) * (zoom * 40);
        const noteWidth = note.duration / secondsPerBeat * (zoom * 40);
        
        if (
          x >= noteX && x <= noteX + noteWidth &&
          y >= noteY && y <= noteY + keyHeight
        ) {
          setCurrentNote(note);
          
          if (x > noteX + noteWidth - 10) {
            setDragMode('resize');
          } else {
            setDragMode('move');
          }
          
          setIsDragging(true);
          
          setNotes(prev => prev.filter(n => n.id !== note.id));
          
          playNotePreview(note.key);
          break;
        }
      }
    } else if (activeTool === 'erase') {
      setNotes(prevNotes => prevNotes.filter(note => {
        const midiNoteOffset = note.key - lowestKey;
        const noteRowIndex = Math.floor(midiNoteOffset / keysPerRow);
        
        // Skip if note isn't in this row
        if (noteRowIndex !== rowIndex) return true;
        
        const keyOffsetInRow = midiNoteOffset % keysPerRow;
        const noteY = (keysPerRow - keyOffsetInRow - 1) * keyHeight + 20;
        
        // Calculate note position in this row
        const noteStartInRow = note.startTime - rowStartTime;
        const noteX = keyWidth + (noteStartInRow / secondsPerBeat) * (zoom * 40);
        const noteWidth = note.duration / secondsPerBeat * (zoom * 40);
        
        return !(
          x >= noteX && x <= noteX + noteWidth &&
          y >= noteY && y <= noteY + keyHeight
        );
      }));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !e.currentTarget) return;
    
    const canvas = e.currentTarget;
    const rowIndex = parseInt(canvas.getAttribute('data-row-index') || '0', 10);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const beatsPerRow = sheetMusicSettings.beatsPerMeasure * sheetMusicSettings.measuresPerRow;
    const secondsPerBeat = 60 / 120; // Assuming 120 BPM
    const secondsPerRow = beatsPerRow * secondsPerBeat;
    const rowStartTime = rowIndex * secondsPerRow;
    
    // Handle loop tool with fixed math
    if (activeTool === 'loop') {
      const timeInRow = ((x - keyWidth) / (zoom * 40)) * secondsPerBeat;
      const time = rowStartTime + timeInRow;
      const snappedTime = snapTimeToGrid(time);
      
      if (dragMode === 'loopRegion') {
        if (dragStartX !== null) {
          const dragStartTimeInRow = ((dragStartX - keyWidth) / (zoom * 40)) * secondsPerBeat;
          const dragStartTime = rowStartTime + dragStartTimeInRow;
          
          if (snappedTime >= dragStartTime) {
            setLoopSettings(prev => ({
              ...prev,
              startTime: Math.min(dragStartTime, prev.startTime),
              endTime: Math.max(snappedTime, dragStartTime)
            }));
          } else {
            setLoopSettings(prev => ({
              ...prev,
              startTime: Math.min(snappedTime, dragStartTime),
              endTime: Math.max(dragStartTime, prev.endTime)
            }));
          }
        }
      }
      return;
    }
    
    if (dragMode === 'resize' && currentNote) {
      const timeInRow = ((x - keyWidth) / (zoom * 40)) * secondsPerBeat;
      const time = rowStartTime + timeInRow;
      const snappedTime = snapTimeToGrid(time);
      const newDuration = Math.max(getSnapValueInSeconds() / 2, snappedTime - currentNote.startTime);
      
      setCurrentNote(prev => {
        if (!prev) return null;
        return { ...prev, duration: newDuration };
      });
    } else if (dragMode === 'move' && currentNote) {
      const timeInRow = ((x - keyWidth) / (zoom * 40)) * secondsPerBeat;
      const time = rowStartTime + timeInRow;
      const snappedTime = snapTimeToGrid(time);
      
      setCurrentNote(prev => {
        if (!prev) return null;
        return { ...prev, startTime: Math.max(0, snappedTime) };
      });
    }
  };

  const handleMouseUp = useCallback(() => {
    if (activeTool === 'loop' && dragMode === 'loopRegion') {
      setLoopSettings(prev => ({
        ...prev,
        enabled: true
      }));
    } else if (isDragging && currentNote) {
      setNotes(prev => {
        if (dragMode === 'resize' || dragMode === 'move') {
          const overlapIndex = prev.findIndex(note => 
            note.key === currentNote.key && 
            note.id !== currentNote.id &&
            ((currentNote.startTime >= note.startTime && currentNote.startTime < note.startTime + note.duration) ||
             (currentNote.startTime + currentNote.duration > note.startTime && currentNote.startTime + currentNote.duration <= note.startTime + note.duration) ||
             (currentNote.startTime <= note.startTime && currentNote.startTime + currentNote.duration >= note.startTime + note.duration))
          );
          
          if (overlapIndex >= 0) {
            return prev;
          }
          
          return [...prev, currentNote];
        }
        return prev;
      });
    }
    
    setIsDragging(false);
    setCurrentNote(null);
    setDragStartX(null);
  }, [activeTool, dragMode, isDragging, currentNote, setNotes, setIsDragging, setCurrentNote, setDragStartX, setLoopSettings]);

  // Prevent context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // Generate the rows
  const pianoRollRows = Array.from({ length: 4 }, (_, i) => i);
  
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
        />
      </div>
      
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
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onContextMenu={handleContextMenu}
            />
          </div>
        </ScrollArea>
      ))}
    </div>
  );
};

export { PianoRoll };
