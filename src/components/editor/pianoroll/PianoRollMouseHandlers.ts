
import { Note, SnapValue, DragMode, ToolType } from '@/types/pianoRoll';
import { LoopSettings } from '@/utils/persistenceUtils';

export interface MouseHandlerProps {
  keyWidth: number;
  keyHeight: number;
  totalKeys: number;
  lowestKey: number;
  keysPerRow: number;
  zoom: number;
  beatsPerMeasure: number;
  measuresPerRow: number;
  snapTimeToGrid: (time: number) => number;
  getSnapValueInSeconds: () => number;
  playNotePreview: (midiNote: number) => void;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  setCurrentNote: React.Dispatch<React.SetStateAction<Note | null>>;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  setDragMode: React.Dispatch<React.SetStateAction<DragMode>>;
  setDragStartX: React.Dispatch<React.SetStateAction<number | null>>;
  setLoopSettings: React.Dispatch<React.SetStateAction<LoopSettings>>;
  notes: Note[];
  activeTool: ToolType;
  loopSettings: LoopSettings;
  dragStartX: number | null;
  isDragging: boolean;
  currentNote: Note | null;
  dragMode: DragMode;
}

export const handleMouseDown = (
  e: React.MouseEvent<HTMLCanvasElement>,
  props: MouseHandlerProps
) => {
  const canvas = e.currentTarget;
  if (!canvas) return;
  
  // Get the row index from the canvas data attribute
  const rowIndex = parseInt(canvas.getAttribute('data-row-index') || '0', 10);
  
  // Fixed start octave note (C3 = MIDI 60)
  const startOctaveNote = 60;
  
  // Handle right-click to erase notes
  if (e.button === 2) {
    e.preventDefault(); // Prevent context menu
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (x <= props.keyWidth) return; // Ignore right clicks on piano keys
    
    const pixelsPerSecond = props.zoom * 100;
    const beatsPerRow = props.beatsPerMeasure * props.measuresPerRow;
    const secondsPerBeat = 60 / 120; // Assuming 120 BPM
    const secondsPerRow = beatsPerRow * secondsPerBeat;
    const rowStartTime = rowIndex * secondsPerRow;
    
    // Find and remove the note under the cursor
    props.setNotes(prevNotes => prevNotes.filter(note => {
      // Check if note is in this row's time range
      const noteStartsInRow = note.startTime >= rowStartTime && note.startTime < rowStartTime + secondsPerRow;
      const noteEndsInRow = note.startTime + note.duration > rowStartTime && 
                            note.startTime + note.duration <= rowStartTime + secondsPerRow;
      const noteSpansRow = note.startTime < rowStartTime && note.startTime + note.duration > rowStartTime + secondsPerRow;
      
      if (!noteStartsInRow && !noteEndsInRow && !noteSpansRow) return true;
      
      // Check if note is in the fixed octave range
      if (note.key < startOctaveNote || note.key >= startOctaveNote + props.keysPerRow) return true;
      
      // Calculate key position
      const keyOffsetInRow = note.key - startOctaveNote;
      const noteY = (props.keysPerRow - keyOffsetInRow - 1) * props.keyHeight + 20;
      
      // Calculate note position in this row
      const noteStartInRow = Math.max(0, note.startTime - rowStartTime);
      const noteX = props.keyWidth + (noteStartInRow / secondsPerBeat) * (props.zoom * 40);
      const noteEndInRow = Math.min(secondsPerRow, note.startTime + note.duration - rowStartTime);
      const noteDurationInRow = noteEndInRow - noteStartInRow;
      const noteWidth = noteDurationInRow / secondsPerBeat * (props.zoom * 40);
      
      return !(
        x >= noteX && x <= noteX + noteWidth &&
        y >= noteY && y <= noteY + props.keyHeight
      );
    }));
    
    return;
  }
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  if (x <= props.keyWidth) {
    // Fixed start octave note (C3 = MIDI 60)
    // Calculate the correct MIDI note based on the key index in the fixed octave range
    const keyIndex = Math.floor((y - 20) / props.keyHeight);
    const midiNote = startOctaveNote + (props.keysPerRow - keyIndex - 1);
    props.playNotePreview(midiNote);
    return;
  }
  
  // Calculate time based on the position and row
  const beatsPerRow = props.beatsPerMeasure * props.measuresPerRow;
  const secondsPerBeat = 60 / 120; // Assuming 120 BPM
  const secondsPerRow = beatsPerRow * secondsPerBeat;
  const rowStartTime = rowIndex * secondsPerRow;
  
  const timeInRow = ((x - props.keyWidth) / (props.zoom * 40)) * secondsPerBeat;
  const time = rowStartTime + timeInRow;
  const snappedTime = props.snapTimeToGrid(time);
  
  // Calculate the correct MIDI note based on the key index in the fixed octave range
  const keyIndex = Math.floor((y - 20) / props.keyHeight);
  const midiNote = startOctaveNote + (props.keysPerRow - keyIndex - 1);
  
  // Handle loop tool
  if (props.loopSettings.enabled || props.activeTool === 'loop') {
    // Loop tool code remains the same, just with adjusted calculations
    if (props.activeTool === 'loop') {
      props.setIsDragging(true);
      props.setDragMode('loopRegion');
      props.setDragStartX(x);
      
      props.setLoopSettings(prev => ({
        ...prev,
        startTime: snappedTime,
        endTime: snappedTime + props.getSnapValueInSeconds() * 4
      }));
      
      return;
    }
  }
  
  if (props.activeTool === 'pencil') {
    const newNote: Note = {
      id: Date.now().toString(),
      key: midiNote,
      startTime: snappedTime,
      duration: props.getSnapValueInSeconds(),
      velocity: 100
    };
    
    props.setCurrentNote(newNote);
    props.setDragMode('resize');
    props.setIsDragging(true);
    
    props.playNotePreview(midiNote);
    
    props.setNotes(prev => [...prev, newNote]);
  } else if (props.activeTool === 'select') {
    // Find notes in the current row's time and octave range
    for (const note of props.notes) {
      // Check if note is in this row's time range
      const noteStartsInRow = note.startTime >= rowStartTime && note.startTime < rowStartTime + secondsPerRow;
      const noteEndsInRow = note.startTime + note.duration > rowStartTime && 
                           note.startTime + note.duration <= rowStartTime + secondsPerRow;
      const noteSpansRow = note.startTime < rowStartTime && note.startTime + note.duration > rowStartTime + secondsPerRow;
      
      if (!noteStartsInRow && !noteEndsInRow && !noteSpansRow) continue;
      
      // Check if note is in the fixed octave range
      if (note.key < startOctaveNote || note.key >= startOctaveNote + props.keysPerRow) continue;
      
      // Calculate key position
      const keyOffsetInRow = note.key - startOctaveNote;
      const noteY = (props.keysPerRow - keyOffsetInRow - 1) * props.keyHeight + 20;
      
      // Calculate note position in this row
      const noteStartInRow = Math.max(0, note.startTime - rowStartTime);
      const noteX = props.keyWidth + (noteStartInRow / secondsPerBeat) * (props.zoom * 40);
      const noteEndInRow = Math.min(secondsPerRow, note.startTime + note.duration - rowStartTime);
      const noteDurationInRow = noteEndInRow - noteStartInRow;
      const noteWidth = noteDurationInRow / secondsPerBeat * (props.zoom * 40);
      
      if (
        x >= noteX && x <= noteX + noteWidth &&
        y >= noteY && y <= noteY + props.keyHeight
      ) {
        props.setCurrentNote(note);
        
        if (x > noteX + noteWidth - 10) {
          props.setDragMode('resize');
        } else {
          props.setDragMode('move');
        }
        
        props.setIsDragging(true);
        
        props.setNotes(prev => prev.filter(n => n.id !== note.id));
        
        props.playNotePreview(note.key);
        break;
      }
    }
  } else if (props.activeTool === 'eraser') {
    props.setNotes(prevNotes => prevNotes.filter(note => {
      // Check if note is in this row's time range
      const noteStartsInRow = note.startTime >= rowStartTime && note.startTime < rowStartTime + secondsPerRow;
      const noteEndsInRow = note.startTime + note.duration > rowStartTime && 
                           note.startTime + note.duration <= rowStartTime + secondsPerRow;
      const noteSpansRow = note.startTime < rowStartTime && note.startTime + note.duration > rowStartTime + secondsPerRow;
      
      if (!noteStartsInRow && !noteEndsInRow && !noteSpansRow) return true;
      
      // Check if note is in the fixed octave range
      if (note.key < startOctaveNote || note.key >= startOctaveNote + props.keysPerRow) return true;
      
      // Calculate key position
      const keyOffsetInRow = note.key - startOctaveNote;
      const noteY = (props.keysPerRow - keyOffsetInRow - 1) * props.keyHeight + 20;
      
      // Calculate note position in this row
      const noteStartInRow = Math.max(0, note.startTime - rowStartTime);
      const noteX = props.keyWidth + (noteStartInRow / secondsPerBeat) * (props.zoom * 40);
      const noteEndInRow = Math.min(secondsPerRow, note.startTime + note.duration - rowStartTime);
      const noteDurationInRow = noteEndInRow - noteStartInRow;
      const noteWidth = noteDurationInRow / secondsPerBeat * (props.zoom * 40);
      
      return !(
        x >= noteX && x <= noteX + noteWidth &&
        y >= noteY && y <= noteY + props.keyHeight
      );
    }));
  }
};

export const handleMouseMove = (
  e: React.MouseEvent<HTMLCanvasElement>,
  props: MouseHandlerProps
) => {
  if (!props.isDragging || !e.currentTarget) return;
  
  const canvas = e.currentTarget;
  const rowIndex = parseInt(canvas.getAttribute('data-row-index') || '0', 10);
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const beatsPerRow = props.beatsPerMeasure * props.measuresPerRow;
  const secondsPerBeat = 60 / 120; // Assuming 120 BPM
  const secondsPerRow = beatsPerRow * secondsPerBeat;
  const rowStartTime = rowIndex * secondsPerRow;
  
  // Handle loop tool with fixed math
  if (props.activeTool === 'loop') {
    const timeInRow = ((x - props.keyWidth) / (props.zoom * 40)) * secondsPerBeat;
    const time = rowStartTime + timeInRow;
    const snappedTime = props.snapTimeToGrid(time);
    
    if (props.dragMode === 'loopRegion') {
      if (props.dragStartX !== null) {
        const dragStartTimeInRow = ((props.dragStartX - props.keyWidth) / (props.zoom * 40)) * secondsPerBeat;
        const dragStartTime = rowStartTime + dragStartTimeInRow;
        
        if (snappedTime >= dragStartTime) {
          props.setLoopSettings(prev => ({
            ...prev,
            startTime: Math.min(dragStartTime, prev.startTime),
            endTime: Math.max(snappedTime, dragStartTime)
          }));
        } else {
          props.setLoopSettings(prev => ({
            ...prev,
            startTime: Math.min(snappedTime, dragStartTime),
            endTime: Math.max(dragStartTime, prev.endTime)
          }));
        }
      }
    }
    return;
  }
  
  if (props.dragMode === 'resize' && props.currentNote) {
    const timeInRow = ((x - props.keyWidth) / (props.zoom * 40)) * secondsPerBeat;
    const time = rowStartTime + timeInRow;
    const snappedTime = props.snapTimeToGrid(time);
    const newDuration = Math.max(props.getSnapValueInSeconds() / 2, snappedTime - props.currentNote.startTime);
    
    props.setCurrentNote(prev => {
      if (!prev) return null;
      return { ...prev, duration: newDuration };
    });
  } else if (props.dragMode === 'move' && props.currentNote) {
    const timeInRow = ((x - props.keyWidth) / (props.zoom * 40)) * secondsPerBeat;
    const time = rowStartTime + timeInRow;
    const snappedTime = props.snapTimeToGrid(time);
    
    props.setCurrentNote(prev => {
      if (!prev) return null;
      return { ...prev, startTime: Math.max(0, snappedTime) };
    });
  }
};

export const handleMouseUp = (
  props: MouseHandlerProps
) => {
  if (props.activeTool === 'loop' && props.dragMode === 'loopRegion') {
    props.setLoopSettings(prev => ({
      ...prev,
      enabled: true
    }));
  } else if (props.isDragging && props.currentNote) {
    props.setNotes(prev => {
      if (props.dragMode === 'resize' || props.dragMode === 'move') {
        const overlapIndex = prev.findIndex(note => 
          note.key === props.currentNote!.key && 
          note.id !== props.currentNote!.id &&
          ((props.currentNote!.startTime >= note.startTime && props.currentNote!.startTime < note.startTime + note.duration) ||
           (props.currentNote!.startTime + props.currentNote!.duration > note.startTime && note.startTime + note.duration <= note.startTime + note.duration) ||
           (props.currentNote!.startTime <= note.startTime && props.currentNote!.startTime + props.currentNote!.duration >= note.startTime + note.duration))
        );
        
        if (overlapIndex >= 0) {
          return prev;
        }
        
        return [...prev, props.currentNote];
      }
      return prev;
    });
  }
  
  props.setIsDragging(false);
  props.setCurrentNote(null);
  props.setDragStartX(null);
};
