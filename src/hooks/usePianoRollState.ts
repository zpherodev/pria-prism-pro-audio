
import { useState, useEffect, useRef, useCallback } from 'react';
import { Note, SnapValue, ToolType, DragMode } from '@/types/pianoRoll';
import { LoopSettings, saveNotesToLocalStorage, loadNotesFromLocalStorage, saveLoopSettingsToLocalStorage, loadLoopSettingsFromLocalStorage } from '@/utils/persistenceUtils';
import { NoteScheduler } from '@/utils/audioSynthesis';
import { getSnapValueInSeconds, snapTimeToGrid } from '@/utils/pianoRollUtils';

export const usePianoRollState = (duration: number) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [dragMode, setDragMode] = useState<DragMode>('create');
  const [activeTool, setActiveTool] = useState<ToolType>('pencil');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [noteScheduler] = useState(() => new NoteScheduler());
  const [lastFrameTime, setLastFrameTime] = useState(0);
  const [snapValue, setSnapValue] = useState<SnapValue>('1/8');
  const animationFrameRef = useRef<number | null>(null);
  const [loopSettings, setLoopSettings] = useState<LoopSettings>({
    enabled: false,
    startTime: 0,
    endTime: 4
  });
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  
  // Load saved notes and loop settings
  useEffect(() => {
    const savedNotes = loadNotesFromLocalStorage();
    if (savedNotes.length > 0) {
      setNotes(savedNotes);
    }
    
    const savedLoopSettings = loadLoopSettingsFromLocalStorage();
    if (savedLoopSettings) {
      setLoopSettings(savedLoopSettings);
    }
  }, []);
  
  // Save notes when they change
  useEffect(() => {
    saveNotesToLocalStorage(notes);
  }, [notes]);
  
  // Save loop settings when they change
  useEffect(() => {
    saveLoopSettingsToLocalStorage(loopSettings);
  }, [loopSettings]);
  
  // Toggle playback
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
      if (!animationFrameRef.current) {
        const animate = () => {
          const newPosition = noteScheduler.currentTime;
          
          if (loopSettings.enabled && newPosition >= loopSettings.endTime) {
            noteScheduler.setPosition(loopSettings.startTime);
            setCurrentPosition(loopSettings.startTime);
          } else {
            setCurrentPosition(newPosition);
          }
          
          animationFrameRef.current = requestAnimationFrame(animate);
        };
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    }
  }, [isPlaying, currentPosition, noteScheduler, loopSettings]);

  // Reset playback position
  const resetPlayback = useCallback(() => {
    if (isPlaying) {
      togglePlayback();
    }
    setCurrentPosition(0);
    noteScheduler.setPosition(0);
  }, [isPlaying, togglePlayback, noteScheduler]);

  // Preview a note
  const playNotePreview = useCallback((midiNote: number) => {
    const noteId = `preview-${midiNote}`;
    noteScheduler.playNote(noteId, midiNote);
    setTimeout(() => noteScheduler.stopNote(noteId), 500);
  }, [noteScheduler]);

  // Schedule notes for playback
  useEffect(() => {
    if (isPlaying) {
      const now = Date.now();
      if (lastFrameTime && now - lastFrameTime > 100) {
        const lookAheadTime = currentPosition + 1;
        noteScheduler.scheduleNotes(notes, currentPosition, lookAheadTime);
      }
      setLastFrameTime(now);
    }
  }, [isPlaying, currentPosition, notes, noteScheduler, lastFrameTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      noteScheduler.stopPlayback();
    };
  }, [noteScheduler]);

  // Toggle loop mode
  const toggleLoopMode = useCallback(() => {
    setLoopSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  // Clear all notes
  const clearAllNotes = useCallback(() => {
    setNotes([]);
    saveNotesToLocalStorage([]);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Spacebar to toggle play/pause
      if (e.code === 'Space' && !e.repeat && !e.target) {
        e.preventDefault();
        togglePlayback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlayback]);

  return {
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
    setCurrentPosition,
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
    getSnapValueInSeconds: () => getSnapValueInSeconds(snapValue),
    snapTimeToGrid: (time: number) => snapTimeToGrid(time, snapValue)
  };
};
