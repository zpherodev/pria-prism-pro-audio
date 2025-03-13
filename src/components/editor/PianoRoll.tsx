
import React, { useCallback, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { PianoRollToolbar } from './pianoroll/PianoRollToolbar';
import { PianoRollCanvas } from './pianoroll/PianoRollCanvas';
import { usePianoRollState } from '@/hooks/usePianoRollState';
import { Note, PianoRollLayoutType, SheetMusicSettings } from '@/types/pianoRoll';
import { Button } from "@/components/ui/button";
import { Grid, Rows3 } from 'lucide-react';

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
  const [layoutType, setLayoutType] = useState<PianoRollLayoutType>('sheet-music');
  const [sheetMusicSettings, setSheetMusicSettings] = useState<SheetMusicSettings>({
    beatsPerMeasure: 4,
    measuresPerRow: 8, // Show 8 measures per row like in the reference image
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

  const keyWidth = 60;
  const keyHeight = 20;
  const totalKeys = 88; // Piano standard
  const lowestKey = 21; // A0 in MIDI

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.5, 10);
    if (onZoomChange) onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.5, 0.1);
    if (onZoomChange) onZoomChange(newZoom);
  };
  
  const toggleLayout = () => {
    setLayoutType(prevLayout => 
      prevLayout === 'traditional' ? 'sheet-music' : 'traditional'
    );
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    if (!canvas) return;
    
    // Handle right-click to erase notes
    if (e.button === 2) {
      e.preventDefault(); // Prevent context menu
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (x <= keyWidth) return; // Ignore right clicks on piano keys
      
      const pixelsPerSecond = zoom * 100;
      
      // Find and remove the note under the cursor
      setNotes(prevNotes => prevNotes.filter(note => {
        const noteX = keyWidth + note.startTime * pixelsPerSecond;
        const noteY = canvas.height - (note.key - lowestKey + 1) * keyHeight;
        const noteWidth = note.duration * pixelsPerSecond;
        
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
      const keyIndex = Math.floor((canvas.height - y) / keyHeight);
      const midiNote = lowestKey + keyIndex;
      playNotePreview(midiNote);
      return;
    }
    
    const pixelsPerSecond = zoom * 100;
    const time = (x - keyWidth) / pixelsPerSecond;
    const snappedTime = snapTimeToGrid(time);
    const keyIndex = Math.floor((canvas.height - y) / keyHeight);
    const midiNote = lowestKey + keyIndex;
    
    if (loopSettings.enabled || activeTool === 'loop') {
      const loopStartX = keyWidth + loopSettings.startTime * pixelsPerSecond;
      const loopEndX = keyWidth + loopSettings.endTime * pixelsPerSecond;
      const handleSize = 10;
      const handleY = 10;
      
      if (
        Math.abs(x - loopStartX) <= handleSize &&
        Math.abs(y - handleY) <= handleSize
      ) {
        setIsDragging(true);
        setDragMode('loopStart');
        return;
      }
      
      if (
        Math.abs(x - loopEndX) <= handleSize &&
        Math.abs(y - handleY) <= handleSize
      ) {
        setIsDragging(true);
        setDragMode('loopEnd');
        return;
      }
    }
    
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
      for (const note of notes) {
        const noteX = keyWidth + note.startTime * pixelsPerSecond;
        const noteY = canvas.height - (note.key - lowestKey + 1) * keyHeight;
        const noteWidth = note.duration * pixelsPerSecond;
        
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
        const noteX = keyWidth + note.startTime * pixelsPerSecond;
        const noteY = canvas.height - (note.key - lowestKey + 1) * keyHeight;
        const noteWidth = note.duration * pixelsPerSecond;
        
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
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pixelsPerSecond = zoom * 100;
    
    if (activeTool === 'loop') {
      if (dragMode === 'loopStart') {
        const time = (x - keyWidth) / pixelsPerSecond;
        const snappedTime = snapTimeToGrid(time);
        
        if (snappedTime < loopSettings.endTime) {
          setLoopSettings(prev => ({
            ...prev,
            startTime: Math.max(0, snappedTime)
          }));
        }
      } else if (dragMode === 'loopEnd') {
        const time = (x - keyWidth) / pixelsPerSecond;
        const snappedTime = snapTimeToGrid(time);
        
        if (snappedTime > loopSettings.startTime) {
          setLoopSettings(prev => ({
            ...prev,
            endTime: snappedTime
          }));
        }
      } else if (dragMode === 'loopRegion') {
        const time = (x - keyWidth) / pixelsPerSecond;
        const snappedTime = snapTimeToGrid(time);
        
        if (dragStartX !== null) {
          const dragStartTime = ((dragStartX - keyWidth) / pixelsPerSecond);
          
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
      const time = (x - keyWidth) / pixelsPerSecond;
      const snappedTime = snapTimeToGrid(time);
      const newDuration = Math.max(getSnapValueInSeconds() / 2, snappedTime - currentNote.startTime);
      
      setCurrentNote(prev => {
        if (!prev) return null;
        return { ...prev, duration: newDuration };
      });
    } else if (dragMode === 'move' && currentNote) {
      const time = (x - keyWidth) / pixelsPerSecond;
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
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleLayout}
          className="flex items-center gap-1"
        >
          {layoutType === 'traditional' 
            ? <><Rows3 className="h-4 w-4" /> Sheet Music</> 
            : <><Grid className="h-4 w-4" /> Traditional</>}
        </Button>
      </div>
      
      <ScrollArea className="border border-zinc-700 rounded-md bg-zinc-900">
        <div className={`w-full ${layoutType === 'sheet-music' ? 'h-[600px]' : 'h-[400px]'} overflow-auto`}>
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
            layoutType={layoutType}
            sheetMusicSettings={sheetMusicSettings}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={handleContextMenu}
          />
        </div>
      </ScrollArea>
    </div>
  );
};

export { PianoRoll };
