import { Note, SnapValue } from '@/types/pianoRoll';
import { LoopSettings } from '@/utils/persistenceUtils';

export interface SheetMusicGridSettings {
  beatsPerMeasure: number;
  measuresPerRow: number;
  totalRows: number;
  pixelsPerBeat: number;
  rowSpacing?: number; // Optional spacing between rows
  rowIndex?: number;   // Added row index for multi-row support
}

export const defaultSheetMusicSettings = {
  beatsPerMeasure: 4,
  measuresPerRow: 4,
  totalRows: 4,
  pixelsPerBeat: 40, // Reduced from 50 to make keys smaller
  rowIndex: 0
};

export const renderSheetPianoRoll = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  notes: Note[],
  currentPosition: number,
  zoom: number,
  loopSettings: LoopSettings,
  activeTool: string,
  isDragging: boolean,
  currentNote: Note | null,
  dragStartX: number | null,
  dragMode: string,
  snapValue: SnapValue,
  gridSettings: SheetMusicGridSettings = defaultSheetMusicSettings
): void => {
  const keyWidth = 40; // Reduced from 60 to make keys smaller
  const keyHeight = 16; // Reduced from 20 to make keys smaller
  const totalKeys = 88; // Piano standard
  const lowestKey = 21; // A0 in MIDI
  const keysPerRow = 24; // Show 2 octaves per row like in the reference image
  
  const { beatsPerMeasure, measuresPerRow, totalRows, pixelsPerBeat, rowSpacing = 20, rowIndex = 0 } = gridSettings;
  
  // Set canvas width and height based on grid settings
  const measureWidth = beatsPerMeasure * pixelsPerBeat;
  const rowWidth = measureWidth * measuresPerRow;
  const rowHeight = keyHeight * keysPerRow;
  
  // No need for spacing in single row view
  const totalRowHeight = rowHeight;
  
  canvas.width = rowWidth + keyWidth;
  canvas.height = totalRowHeight;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ------------------- Calculate the actual time range for this row -------------------
  const beatsPerRow = beatsPerMeasure * measuresPerRow;
  const secondsPerBeat = 60 / 120; // Assuming 120 BPM
  const secondsPerRow = beatsPerRow * secondsPerBeat;
  
  const rowStartTime = rowIndex * secondsPerRow;
  const rowEndTime = (rowIndex + 1) * secondsPerRow;
  
  // Background for main note area
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(keyWidth, 0, rowWidth, rowHeight);
  
  // Add row number indicator
  ctx.fillStyle = '#555';
  ctx.font = '12px serif';
  ctx.fillText(`Row ${rowIndex + 1}`, 5, 15);
  
  // Draw time markers at the top
  ctx.fillStyle = '#333';
  ctx.fillRect(keyWidth, 0, rowWidth, 20);
  
  for (let i = 0; i <= measuresPerRow; i++) {
    const x = keyWidth + i * measureWidth;
    const second = rowStartTime + (i * beatsPerMeasure * secondsPerBeat);
    
    ctx.fillStyle = '#ddd';
    ctx.font = '10px Arial';
    if (i < measuresPerRow) {
      ctx.fillText(`${second.toFixed(1)}s`, x + 5, 15);
      
      // Add measure numbers
      ctx.fillStyle = '#aaa';
      ctx.font = '12px serif';
      const measureNumber = (rowIndex * measuresPerRow) + i + 1;
      ctx.fillText(`${measureNumber}`, x + measureWidth/2 - 5, 15);
    }
  }
  
  // Draw staff lines (5 lines like in real sheet music)
  const staffLineSpacing = rowHeight / 10;
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 0.5;
  
  for (let line = 0; line < 5; line++) {
    const y = 20 + staffLineSpacing + line * staffLineSpacing * 2;
    ctx.beginPath();
    ctx.moveTo(keyWidth, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Draw horizontal grid lines (for each key)
  for (let i = 0; i <= keysPerRow; i++) {
    const y = i * keyHeight + 20; // +20 for time markers
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(keyWidth, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Draw vertical grid lines (for beats and measures)
  for (let measure = 0; measure <= measuresPerRow; measure++) {
    const measureX = keyWidth + measure * measureWidth;
    
    // Draw measure line
    ctx.strokeStyle = '#666';
    ctx.lineWidth = measure === 0 ? 2 : 1; // Thicker line at start
    ctx.beginPath();
    ctx.moveTo(measureX, 0);
    ctx.lineTo(measureX, rowHeight);
    ctx.stroke();
    
    // Draw beat lines within each measure
    for (let beat = 1; beat < beatsPerMeasure; beat++) {
      const beatX = measureX + beat * pixelsPerBeat;
      
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(beatX, 0);
      ctx.lineTo(beatX, rowHeight);
      ctx.stroke();
    }
  }
  
  // Draw piano keys for this row
  for (let i = 0; i < keysPerRow; i++) {
    const keyIndex = keysPerRow - i - 1; // Reverse to match piano layout
    const midiNote = (rowIndex * keysPerRow) + keyIndex + lowestKey;
    const isBlackKey = [1, 3, 6, 8, 10].includes(midiNote % 12);
    const y = i * keyHeight + 20; // +20 for time markers
    
    ctx.fillStyle = isBlackKey ? '#222' : '#eee';
    ctx.fillRect(0, y, keyWidth, keyHeight);
    
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(0, y, keyWidth, keyHeight);
    ctx.stroke();
    
    if (midiNote % 12 === 0) {
      const octave = Math.floor(midiNote / 12) - 1;
      ctx.fillStyle = '#999';
      ctx.font = '10px sans-serif';
      ctx.fillText(`C${octave}`, 5, y + 12);
    }
  }
  
  // Check if playhead is in this row's time range
  if (currentPosition >= rowStartTime && currentPosition < rowEndTime) {
    // Calculate position within this row
    const rowRelativePosition = currentPosition - rowStartTime;
    const playheadX = keyWidth + (rowRelativePosition / secondsPerBeat) * pixelsPerBeat;
    
    // Draw playhead
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, rowHeight);
    ctx.stroke();
    
    // Add a playhead position indicator
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.moveTo(playheadX - 5, 0);
    ctx.lineTo(playheadX + 5, 0);
    ctx.lineTo(playheadX, 5);
    ctx.closePath();
    ctx.fill();
  }
  
  // ------------------- Draw loop region if it intersects with this row -------------------
  if (loopSettings.enabled || activeTool === 'loop') {
    const loopStartInRowRange = loopSettings.startTime >= rowStartTime && loopSettings.startTime < rowEndTime;
    const loopEndInRowRange = loopSettings.endTime > rowStartTime && loopSettings.endTime <= rowEndTime;
    const loopSpansRow = loopSettings.startTime < rowStartTime && loopSettings.endTime > rowEndTime;
    
    if (loopStartInRowRange || loopEndInRowRange || loopSpansRow) {
      ctx.setLineDash([5, 5]);
      
      let loopStartX = keyWidth;
      let loopEndX = keyWidth + rowWidth;
      
      if (loopStartInRowRange) {
        const rowRelativeStart = loopSettings.startTime - rowStartTime;
        loopStartX = keyWidth + (rowRelativeStart / secondsPerBeat) * pixelsPerBeat;
      }
      
      if (loopEndInRowRange) {
        const rowRelativeEnd = loopSettings.endTime - rowStartTime;
        loopEndX = keyWidth + (rowRelativeEnd / secondsPerBeat) * pixelsPerBeat;
      }
      
      // Draw loop region
      ctx.fillStyle = 'rgba(100, 100, 255, 0.15)';
      ctx.fillRect(loopStartX, 0, loopEndX - loopStartX, rowHeight);
      
      // Draw start line if in this row
      if (loopStartInRowRange) {
        ctx.strokeStyle = '#6464ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(loopStartX, 0);
        ctx.lineTo(loopStartX, rowHeight);
        ctx.stroke();
      }
      
      // Draw end line if in this row
      if (loopEndInRowRange) {
        ctx.strokeStyle = '#6464ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(loopEndX, 0);
        ctx.lineTo(loopEndX, rowHeight);
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
    }
  }
  
  // ------------------- Filter and draw notes that belong to this row -------------------
  const rowNotes = notes.filter(note => {
    // Check if the note starts or ends in this row's time range
    return (note.startTime >= rowStartTime && note.startTime < rowEndTime) ||
           (note.startTime + note.duration > rowStartTime && note.startTime + note.duration <= rowEndTime) ||
           (note.startTime <= rowStartTime && note.startTime + note.duration >= rowEndTime);
  });
  
  rowNotes.forEach(note => {
    // Calculate position within row
    let startX = keyWidth;
    let endX = keyWidth + rowWidth;
    
    if (note.startTime >= rowStartTime) {
      const rowRelativeStart = note.startTime - rowStartTime;
      startX = keyWidth + (rowRelativeStart / secondsPerBeat) * pixelsPerBeat;
    }
    
    if (note.startTime + note.duration <= rowEndTime) {
      const rowRelativeEnd = (note.startTime + note.duration) - rowStartTime;
      endX = keyWidth + (rowRelativeEnd / secondsPerBeat) * pixelsPerBeat;
    }
    
    const width = endX - startX;
    
    // Calculate which key in the row this note belongs to
    const midiNoteOffset = note.key - lowestKey;
    const rowOffset = Math.floor(midiNoteOffset / keysPerRow);
    
    // Skip if not in current row range
    if (rowIndex !== rowOffset) {
      return;
    }
    
    const keyOffsetInRow = midiNoteOffset % keysPerRow;
    
    // Position in row - inverting to match piano layout (higher notes at top)
    const y = (keysPerRow - keyOffsetInRow - 1) * keyHeight + 20; // +20 for time markers
    
    // Create note
    const noteHeight = keyHeight - 2;
    const radius = noteHeight / 2;
    
    ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
    
    // Draw rounded note
    ctx.beginPath();
    ctx.moveTo(startX + radius, y);
    ctx.lineTo(startX + width - radius, y);
    ctx.quadraticCurveTo(startX + width, y, startX + width, y + radius);
    ctx.lineTo(startX + width, y + noteHeight - radius);
    ctx.quadraticCurveTo(startX + width, y + noteHeight, startX + width - radius, y + noteHeight);
    ctx.lineTo(startX + radius, y + noteHeight);
    ctx.quadraticCurveTo(startX, y + noteHeight, startX, y + noteHeight - radius);
    ctx.lineTo(startX, y + radius);
    ctx.quadraticCurveTo(startX, y, startX + radius, y);
    ctx.fill();
    
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw velocity bar
    const velocityWidth = 2 + (note.velocity / 127) * 3;
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(startX, y, velocityWidth, noteHeight);
  });
  
  // ------------------- Draw current note being edited -------------------
  if (isDragging && currentNote) {
    const noteInRowRange = (currentNote.startTime >= rowStartTime && currentNote.startTime < rowEndTime) ||
                          (currentNote.startTime + currentNote.duration > rowStartTime && 
                           currentNote.startTime + currentNote.duration <= rowEndTime);
                          
    const midiNoteOffset = currentNote.key - lowestKey;
    const rowOffset = Math.floor(midiNoteOffset / keysPerRow);
    
    // Only draw current note if it belongs to this row in both time and key range
    if (noteInRowRange && rowIndex === rowOffset) {
      let startX = keyWidth;
      let endX = keyWidth + rowWidth;
      
      if (currentNote.startTime >= rowStartTime) {
        const rowRelativeStart = currentNote.startTime - rowStartTime;
        startX = keyWidth + (rowRelativeStart / secondsPerBeat) * pixelsPerBeat;
      }
      
      if (currentNote.startTime + currentNote.duration <= rowEndTime) {
        const rowRelativeEnd = (currentNote.startTime + currentNote.duration) - rowStartTime;
        endX = keyWidth + (rowRelativeEnd / secondsPerBeat) * pixelsPerBeat;
      }
      
      const width = endX - startX;
      const keyOffsetInRow = midiNoteOffset % keysPerRow;
      
      // Position in row
      const y = (keysPerRow - keyOffsetInRow - 1) * keyHeight + 20; // +20 for time markers
      
      // Create note
      const noteHeight = keyHeight - 2;
      const radius = noteHeight / 2;
      
      ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
      
      // Draw rounded note for the current note being edited
      ctx.beginPath();
      ctx.moveTo(startX + radius, y);
      ctx.lineTo(startX + width - radius, y);
      ctx.quadraticCurveTo(startX + width, y, startX + width, y + radius);
      ctx.lineTo(startX + width, y + noteHeight - radius);
      ctx.quadraticCurveTo(startX + width, y + noteHeight, startX + width - radius, y + noteHeight);
      ctx.lineTo(startX + radius, y + noteHeight);
      ctx.quadraticCurveTo(startX, y + noteHeight, startX, y + noteHeight - radius);
      ctx.lineTo(startX, y + radius);
      ctx.quadraticCurveTo(startX, y, startX + radius, y);
      ctx.fill();
      
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
};

export const getPositionFromSheetMusicCoordinates = (
  x: number,
  y: number,
  keyWidth: number,
  rowHeight: number,
  gridSettings: SheetMusicGridSettings,
  secondsPerBeat: number = 0.5 // Assuming 120 BPM
): { time: number; key: number } => {
  const { beatsPerMeasure, measuresPerRow, pixelsPerBeat } = gridSettings;
  
  const rowIndex = Math.floor(y / rowHeight);
  const beatsPerRow = beatsPerMeasure * measuresPerRow;
  
  // Calculate time
  const rowTime = rowIndex * beatsPerRow * secondsPerBeat;
  const xPosition = x - keyWidth;
  const beatPosition = xPosition / (pixelsPerBeat * 1); // Assuming zoom = 1
  const time = rowTime + beatPosition * secondsPerBeat;
  
  // Calculate key
  const keysPerRow = Math.floor(rowHeight / 20); // Assuming keyHeight = 20
  const keyIndexInRow = Math.floor((y % rowHeight) / 20);
  const key = 21 + (88 - keysPerRow - rowIndex * keysPerRow) + keyIndexInRow; // 21 is A0
  
  return { time, key };
};

export const getSnapValueInBeats = (snapValue: SnapValue): number => {
  switch (snapValue) {
    case '1/32': return 1/8;
    case '1/16': return 1/4;
    case '1/8': return 1/2;
    case '1/4': return 1;
    case '1/2': return 2;
    case '1': return 4;
    default: return 1/2;
  }
};
