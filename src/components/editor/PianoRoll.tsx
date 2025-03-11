
import React, { useRef, useEffect, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Note, Trash2 } from 'lucide-react';

interface Note {
  id: string;
  key: number; // MIDI note number (0-127)
  startTime: number; // In seconds
  duration: number; // In seconds
  velocity: number; // 0-127
}

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [dragMode, setDragMode] = useState<'create' | 'move' | 'resize'>('create');
  const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'erase'>('draw');
  
  // Calculate dimensions
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

  // Render piano keys and grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = Math.max(duration * zoom * 100, 1000);
    canvas.height = totalKeys * keyHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the grid - vertical lines for time divisions
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(keyWidth, 0, canvas.width - keyWidth, canvas.height);
    
    // Draw time markers
    ctx.fillStyle = '#333';
    const pixelsPerSecond = zoom * 100;
    const secondsVisible = canvas.width / pixelsPerSecond;
    const timeStep = zoom > 1 ? 0.25 : zoom > 0.5 ? 0.5 : 1;
    
    for (let time = 0; time <= secondsVisible; time += timeStep) {
      const x = keyWidth + time * pixelsPerSecond;
      ctx.strokeStyle = time % 1 === 0 ? '#555' : '#333';
      ctx.lineWidth = time % 1 === 0 ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
      
      if (time % 1 === 0) {
        ctx.fillStyle = '#888';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${time}s`, x + 2, 10);
      }
    }

    // Draw piano keys
    for (let i = 0; i < totalKeys; i++) {
      const midiNote = lowestKey + i;
      const isBlackKey = [1, 3, 6, 8, 10].includes(midiNote % 12);
      const y = canvas.height - (i + 1) * keyHeight;
      
      // Draw white key background
      ctx.fillStyle = isBlackKey ? '#222' : '#eee';
      ctx.fillRect(0, y, keyWidth, keyHeight);
      
      // Draw key borders
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(0, y, keyWidth, keyHeight);
      ctx.stroke();

      // Draw horizontal grid lines
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(keyWidth, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
      
      // Label C keys (C1, C2, etc.)
      if (midiNote % 12 === 0) {
        const octave = Math.floor(midiNote / 12) - 1;
        ctx.fillStyle = '#999';
        ctx.font = '10px sans-serif';
        ctx.fillText(`C${octave}`, 5, y + 12);
      }
    }

    // Draw notes
    notes.forEach(note => {
      const x = keyWidth + note.startTime * pixelsPerSecond;
      const y = canvas.height - (note.key - lowestKey + 1) * keyHeight;
      const width = note.duration * pixelsPerSecond;
      
      // Note body
      ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
      ctx.fillRect(x, y, width, keyHeight);
      
      // Note border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(x, y, width, keyHeight);
      ctx.stroke();
      
      // Velocity indicator
      const velocityWidth = 2 + (note.velocity / 127) * 3;
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(x, y, velocityWidth, keyHeight);
    });

  }, [zoom, duration, notes]);

  // Handle mouse interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (x <= keyWidth) {
      // Clicked on piano keys - play the note
      const keyIndex = Math.floor((canvas.height - y) / keyHeight);
      const midiNote = lowestKey + keyIndex;
      console.log(`Play note: ${midiNote}`);
      return;
    }
    
    // Convert coordinates to musical parameters
    const pixelsPerSecond = zoom * 100;
    const time = (x - keyWidth) / pixelsPerSecond;
    const keyIndex = Math.floor((canvas.height - y) / keyHeight);
    const midiNote = lowestKey + keyIndex;
    
    if (activeTool === 'draw') {
      // Start creating a new note
      const newNote: Note = {
        id: Date.now().toString(),
        key: midiNote,
        startTime: time,
        duration: 0.5,
        velocity: 100
      };
      
      setCurrentNote(newNote);
      setDragMode('resize');
      setIsDragging(true);
    } else if (activeTool === 'select') {
      // Check if we clicked on an existing note
      for (const note of notes) {
        const noteX = keyWidth + note.startTime * pixelsPerSecond;
        const noteY = canvas.height - (note.key - lowestKey + 1) * keyHeight;
        const noteWidth = note.duration * pixelsPerSecond;
        
        if (
          x >= noteX && x <= noteX + noteWidth &&
          y >= noteY && y <= noteY + keyHeight
        ) {
          // Clicked on a note - start moving or resizing
          setCurrentNote(note);
          
          // If near the edge, we're resizing
          if (x > noteX + noteWidth - 10) {
            setDragMode('resize');
          } else {
            setDragMode('move');
          }
          
          setIsDragging(true);
          break;
        }
      }
    } else if (activeTool === 'erase') {
      // Remove note if clicked on it
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
    if (!isDragging || !currentNote || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pixelsPerSecond = zoom * 100;
    
    if (dragMode === 'create' || dragMode === 'resize') {
      // Updating note duration
      const time = (x - keyWidth) / pixelsPerSecond;
      const newDuration = Math.max(0.1, time - currentNote.startTime);
      
      setCurrentNote(prev => {
        if (!prev) return null;
        return { ...prev, duration: newDuration };
      });
    } else if (dragMode === 'move') {
      // Moving the note
      const time = (x - keyWidth) / pixelsPerSecond;
      // Calculate time difference from the note's start
      const deltaTime = time - currentNote.startTime;
      
      setCurrentNote(prev => {
        if (!prev) return null;
        return { ...prev, startTime: Math.max(0, prev.startTime + deltaTime) };
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && currentNote) {
      if (dragMode === 'create') {
        // Add the new note
        setNotes(prev => [...prev, currentNote]);
      } else if (dragMode === 'move' || dragMode === 'resize') {
        // Update the existing note
        setNotes(prev => 
          prev.map(note => 
            note.id === currentNote.id ? currentNote : note
          )
        );
      }
    }
    
    setIsDragging(false);
    setCurrentNote(null);
  };

  const clearAllNotes = () => {
    setNotes([]);
  };

  return (
    <div className="piano-roll-container flex flex-col gap-2">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Piano Roll</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-editor-panel rounded-md overflow-hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              title="Select Tool" 
              onClick={() => setActiveTool('select')} 
              className={activeTool === 'select' ? 'bg-blue-800/20' : ''}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                <path d="M3.5 2C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13C3.77614 13 4 12.7761 4 12.5V2.5C4 2.22386 3.77614 2 3.5 2ZM5.5 4C5.22386 4 5 4.22386 5 4.5V10.5C5 10.7761 5.22386 11 5.5 11C5.77614 11 6 10.7761 6 10.5V4.5C6 4.22386 5.77614 4 5.5 4ZM7 6.5C7 6.22386 7.22386 6 7.5 6C7.77614 6 8 6.22386 8 6.5V8.5C8 8.77614 7.77614 9 7.5 9C7.22386 9 7 8.77614 7 8.5V6.5ZM9.5 4C9.22386 4 9 4.22386 9 4.5V10.5C9 10.7761 9.22386 11 9.5 11C9.77614 11 10 10.7761 10 10.5V4.5C10 4.22386 9.77614 4 9.5 4ZM11 2.5C11 2.22386 11.2239 2 11.5 2C11.7761 2 12 2.22386 12 2.5V12.5C12 12.7761 11.7761 13 11.5 13C11.2239 13 11 12.7761 11 12.5V2.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              title="Draw Tool" 
              onClick={() => setActiveTool('draw')} 
              className={activeTool === 'draw' ? 'bg-blue-800/20' : ''}
            >
              <Note className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              title="Erase Tool" 
              onClick={() => setActiveTool('erase')} 
              className={activeTool === 'erase' ? 'bg-blue-800/20' : ''}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex bg-editor-panel rounded-md overflow-hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              title="Zoom Out" 
              onClick={handleZoomOut} 
              className="bg-zinc-700 hover:bg-zinc-600"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              title="Zoom In" 
              onClick={handleZoomIn} 
              className="bg-zinc-600 hover:bg-zinc-500"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={clearAllNotes} 
            className="bg-red-900/30 hover:bg-red-900/50 text-red-500 h-8 text-xs"
          >
            Clear Notes
          </Button>
        </div>
      </div>
      
      <ScrollArea className="border border-zinc-700 rounded-md bg-zinc-900">
        <div className="w-full h-[400px] overflow-auto">
          <canvas 
            ref={canvasRef} 
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="min-w-full"
          />
        </div>
      </ScrollArea>
    </div>
  );
};

export { PianoRoll };
