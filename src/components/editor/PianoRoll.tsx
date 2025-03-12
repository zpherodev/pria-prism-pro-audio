
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Pencil, Trash2, Play, Pause, SkipBack, Eraser, Music4 } from 'lucide-react';
import { NoteScheduler } from '@/utils/audioSynthesis';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

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

type SnapValue = '1/32' | '1/16' | '1/8' | '1/4' | '1/2' | '1';

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
  const [activeTool, setActiveTool] = useState<'select' | 'pencil' | 'erase'>('pencil');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [noteScheduler] = useState(() => new NoteScheduler());
  const [lastFrameTime, setLastFrameTime] = useState(0);
  const [snapValue, setSnapValue] = useState<SnapValue>('1/8');
  const animationFrameRef = useRef<number | null>(null);
  
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

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      noteScheduler.stopPlayback();
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    } else {
      noteScheduler.startPlayback(currentPosition);
      setIsPlaying(true);
      // Start animation frame for playhead
      if (!animationFrameRef.current) {
        const animate = () => {
          setCurrentPosition(noteScheduler.currentTime);
          animationFrameRef.current = requestAnimationFrame(animate);
        };
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    }
  }, [isPlaying, currentPosition, noteScheduler]);

  const resetPlayback = useCallback(() => {
    if (isPlaying) {
      togglePlayback();
    }
    setCurrentPosition(0);
    noteScheduler.setPosition(0);
  }, [isPlaying, togglePlayback, noteScheduler]);

  // Play notes on click (piano keyboard)
  const playNotePreview = useCallback((midiNote: number) => {
    const noteId = `preview-${midiNote}`;
    noteScheduler.playNote(noteId, midiNote);
    // Stop note after 500ms
    setTimeout(() => noteScheduler.stopNote(noteId), 500);
  }, [noteScheduler]);

  // Update playhead and schedule notes
  useEffect(() => {
    if (isPlaying) {
      const now = Date.now();
      if (lastFrameTime && now - lastFrameTime > 100) {
        // Schedule notes in 1-second window ahead
        const lookAheadTime = currentPosition + 1;
        noteScheduler.scheduleNotes(notes, currentPosition, lookAheadTime);
      }
      setLastFrameTime(now);
    }
  }, [isPlaying, currentPosition, notes, noteScheduler, lastFrameTime]);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      noteScheduler.stopPlayback();
    };
  }, [noteScheduler]);

  // Get snap value in seconds
  const getSnapValueInSeconds = useCallback(() => {
    switch (snapValue) {
      case '1/32': return 0.125;
      case '1/16': return 0.25;
      case '1/8': return 0.5;
      case '1/4': return 1;
      case '1/2': return 2;
      case '1': return 4;
      default: return 0.5;
    }
  }, [snapValue]);

  // Snap time to grid
  const snapTimeToGrid = useCallback((time: number): number => {
    const snapInSeconds = getSnapValueInSeconds();
    return Math.round(time / snapInSeconds) * snapInSeconds;
  }, [getSnapValueInSeconds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = Math.max(duration * zoom * 100, 1000);
    canvas.height = totalKeys * keyHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(keyWidth, 0, canvas.width - keyWidth, canvas.height);
    
    ctx.fillStyle = '#333';
    const pixelsPerSecond = zoom * 100;
    const secondsVisible = canvas.width / pixelsPerSecond;
    
    // Draw time grid
    const snapInSeconds = getSnapValueInSeconds();
    const smallestGridDivision = snapInSeconds / 4; // Draw finer grid lines
    
    for (let time = 0; time <= secondsVisible; time += smallestGridDivision) {
      const x = keyWidth + time * pixelsPerSecond;
      
      // Determine line style based on grid position
      const isMeasure = time % 4 < 0.001; // Assuming 4/4 time signature
      const isBeat = time % 1 < 0.001;
      const isSnapLine = time % snapInSeconds < 0.001;
      
      if (isMeasure) {
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
      } else if (isBeat) {
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
      } else if (isSnapLine) {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
      } else {
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 0.5;
      }
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
      
      if (isBeat) {
        ctx.fillStyle = '#888';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${time.toFixed(1)}s`, x + 2, 10);
      }
    }

    // Draw piano keys and horizontal grid lines
    for (let i = 0; i < totalKeys; i++) {
      const midiNote = lowestKey + i;
      const isBlackKey = [1, 3, 6, 8, 10].includes(midiNote % 12);
      const y = canvas.height - (i + 1) * keyHeight;
      
      ctx.fillStyle = isBlackKey ? '#222' : '#eee';
      ctx.fillRect(0, y, keyWidth, keyHeight);
      
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(0, y, keyWidth, keyHeight);
      ctx.stroke();

      ctx.strokeStyle = isBlackKey ? '#1a1a1a' : '#2a2a2a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(keyWidth, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
      
      if (midiNote % 12 === 0) {
        const octave = Math.floor(midiNote / 12) - 1;
        ctx.fillStyle = '#999';
        ctx.font = '10px sans-serif';
        ctx.fillText(`C${octave}`, 5, y + 12);
      }
    }

    // Draw playhead
    const playheadX = keyWidth + currentPosition * pixelsPerSecond;
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, canvas.height);
    ctx.stroke();

    // Draw current note being created/resized/moved
    if (isDragging && currentNote) {
      const x = keyWidth + currentNote.startTime * pixelsPerSecond;
      const y = canvas.height - (currentNote.key - lowestKey + 1) * keyHeight;
      const width = currentNote.duration * pixelsPerSecond;
      
      ctx.fillStyle = 'rgba(239, 68, 68, 0.5)'; // Red for current note
      ctx.fillRect(x, y, width, keyHeight);
      
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(x, y, width, keyHeight);
      ctx.stroke();
    }

    // Draw all notes
    notes.forEach(note => {
      const x = keyWidth + note.startTime * pixelsPerSecond;
      const y = canvas.height - (note.key - lowestKey + 1) * keyHeight;
      const width = note.duration * pixelsPerSecond;
      
      ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
      ctx.fillRect(x, y, width, keyHeight);
      
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(x, y, width, keyHeight);
      ctx.stroke();
      
      const velocityWidth = 2 + (note.velocity / 127) * 3;
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(x, y, velocityWidth, keyHeight);
    });
  }, [zoom, duration, notes, currentPosition, isDragging, currentNote, getSnapValueInSeconds, snapTimeToGrid]);

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
      playNotePreview(midiNote);
      return;
    }
    
    const pixelsPerSecond = zoom * 100;
    const time = (x - keyWidth) / pixelsPerSecond;
    const snappedTime = snapTimeToGrid(time);
    const keyIndex = Math.floor((canvas.height - y) / keyHeight);
    const midiNote = lowestKey + keyIndex;
    
    if (activeTool === 'pencil') {
      // Create a new note
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
      
      // Play the note as feedback
      playNotePreview(midiNote);
      
      // Immediately add the note to the array so it's visible
      setNotes(prev => [...prev, newNote]);
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
          setCurrentNote(note);
          
          // If near the right edge, set resize mode, otherwise move mode
          if (x > noteX + noteWidth - 10) {
            setDragMode('resize');
          } else {
            setDragMode('move');
          }
          
          setIsDragging(true);
          
          // Remove the current note from the array while dragging
          setNotes(prev => prev.filter(n => n.id !== note.id));
          
          // Play the note as feedback
          playNotePreview(note.key);
          break;
        }
      }
    } else if (activeTool === 'erase') {
      // Erase notes at current position
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
    
    if (dragMode === 'resize') {
      // Get the current end position
      const time = (x - keyWidth) / pixelsPerSecond;
      const snappedTime = snapTimeToGrid(time);
      const newDuration = Math.max(getSnapValueInSeconds() / 2, snappedTime - currentNote.startTime);
      
      setCurrentNote(prev => {
        if (!prev) return null;
        return { ...prev, duration: newDuration };
      });
    } else if (dragMode === 'move') {
      // Move the entire note
      const time = (x - keyWidth) / pixelsPerSecond;
      const snappedTime = snapTimeToGrid(time);
      
      setCurrentNote(prev => {
        if (!prev) return null;
        return { ...prev, startTime: Math.max(0, snappedTime) };
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && currentNote) {
      // Add the note back to the array with updated properties
      setNotes(prev => {
        if (dragMode === 'resize' || dragMode === 'move') {
          // Check if this note overlaps with any existing ones
          const overlapIndex = prev.findIndex(note => 
            note.key === currentNote.key && 
            note.id !== currentNote.id &&
            ((currentNote.startTime >= note.startTime && currentNote.startTime < note.startTime + note.duration) ||
             (currentNote.startTime + currentNote.duration > note.startTime && currentNote.startTime + currentNote.duration <= note.startTime + note.duration) ||
             (currentNote.startTime <= note.startTime && currentNote.startTime + currentNote.duration >= note.startTime + note.duration))
          );
          
          if (overlapIndex >= 0) {
            // There's an overlap, so don't add the note
            return prev;
          }
          
          return [...prev, currentNote];
        }
        return prev;
      });
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
              title="Pencil Tool" 
              onClick={() => setActiveTool('pencil')} 
              className={activeTool === 'pencil' ? 'bg-blue-800/20' : ''}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              title="Erase Tool" 
              onClick={() => setActiveTool('erase')} 
              className={activeTool === 'erase' ? 'bg-blue-800/20' : ''}
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="bg-zinc-700 hover:bg-zinc-600 flex items-center gap-1 text-xs"
              >
                <Music4 className="h-3 w-3 mr-1" />
                Snap: {snapValue}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem 
                onClick={() => setSnapValue('1/32')}
                className={snapValue === '1/32' ? 'bg-blue-900/20' : ''}
              >
                1/32 Note
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSnapValue('1/16')}
                className={snapValue === '1/16' ? 'bg-blue-900/20' : ''}
              >
                1/16 Note
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSnapValue('1/8')}
                className={snapValue === '1/8' ? 'bg-blue-900/20' : ''}
              >
                1/8 Note
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSnapValue('1/4')}
                className={snapValue === '1/4' ? 'bg-blue-900/20' : ''}
              >
                1/4 Note
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSnapValue('1/2')}
                className={snapValue === '1/2' ? 'bg-blue-900/20' : ''}
              >
                1/2 Note
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSnapValue('1')}
                className={snapValue === '1' ? 'bg-blue-900/20' : ''}
              >
                Whole Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex bg-editor-panel rounded-md overflow-hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              title="Reset" 
              onClick={resetPlayback} 
              className="bg-zinc-700 hover:bg-zinc-600"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              title={isPlaying ? "Pause" : "Play"}
              onClick={togglePlayback} 
              className="bg-zinc-600 hover:bg-zinc-500"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
            <Trash2 className="h-4 w-4 mr-1" /> Clear All
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
