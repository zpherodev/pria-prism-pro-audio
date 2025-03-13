import { Note, SnapValue } from '@/types/pianoRoll';
import { LoopSettings } from '@/utils/persistenceUtils';

export interface SheetMusicGridSettings {
  beatsPerMeasure: number;
  measuresPerRow: number;
  totalRows: number;
  pixelsPerBeat: number;
}

export const defaultSheetMusicSettings = {
  beatsPerMeasure: 4,
  measuresPerRow: 4,
  totalRows: 4,
  pixelsPerBeat: 50
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
  const keyWidth = 60;
  const keyHeight = 20;
  const totalKeys = 88; // Piano standard
  const lowestKey = 21; // A0 in MIDI
  const keysPerRow = 24; // Show 2 octaves per row like in the reference image
  
  const { beatsPerMeasure, measuresPerRow, totalRows, pixelsPerBeat } = gridSettings;
  
  // Set canvas width and height based on grid settings
  const measureWidth = beatsPerMeasure * pixelsPerBeat * zoom;
  const rowWidth = measureWidth * measuresPerRow;
  const rowHeight = keyHeight * keysPerRow;
  
  canvas.width = rowWidth + keyWidth;
  canvas.height = rowHeight * totalRows;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ------------------- Render grid for each row -------------------
  for (let row = 0; row < totalRows; row++) {
    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(keyWidth, row * rowHeight, rowWidth, rowHeight);
    
    // Draw time markers at the top of each row
    ctx.fillStyle = '#333';
    ctx.fillRect(keyWidth, row * rowHeight, rowWidth, 20);
    
    for (let i = 0; i <= measuresPerRow; i++) {
      const x = keyWidth + i * measureWidth;
      const second = i * beatsPerMeasure / 2; // Assuming 120 BPM
      
      ctx.fillStyle = '#999';
      ctx.font = '10px Arial';
      if (i < measuresPerRow) {
        ctx.fillText(`${second.toFixed(1)}s`, x + 5, row * rowHeight + 15);
      }
    }
    
    // Draw horizontal grid lines (for each key)
    for (let i = 0; i <= keysPerRow; i++) {
      const y = row * rowHeight + i * keyHeight + 20; // +20 for time markers
      
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
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(measureX, row * rowHeight);
      ctx.lineTo(measureX, (row + 1) * rowHeight);
      ctx.stroke();
      
      // Draw beat lines within each measure
      for (let beat = 1; beat < beatsPerMeasure; beat++) {
        const beatX = measureX + beat * pixelsPerBeat * zoom;
        
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(beatX, row * rowHeight);
        ctx.lineTo(beatX, (row + 1) * rowHeight);
        ctx.stroke();
      }
    }
    
    // Draw piano keys for this row
    for (let i = 0; i < keysPerRow; i++) {
      const keyIndex = keysPerRow - i - 1; // Reverse to match piano layout
      const midiNote = (row * keysPerRow) + keyIndex + lowestKey;
      const isBlackKey = [1, 3, 6, 8, 10].includes(midiNote % 12);
      const y = row * rowHeight + i * keyHeight + 20; // +20 for time markers
      
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
  }
  
  // ------------------- Calculate current row and position -------------------
  const beatsPerRow = beatsPerMeasure * measuresPerRow;
  const secondsPerBeat = 60 / 120; // Assuming 120 BPM
  const secondsPerRow = beatsPerRow * secondsPerBeat;
  
  const currentRow = Math.min(Math.floor(currentPosition / secondsPerRow), totalRows - 1);
  const rowPosition = currentPosition % secondsPerRow;
  const rowPositionPixels = keyWidth + (rowPosition / secondsPerBeat) * pixelsPerBeat * zoom;
  
  // Draw playhead
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rowPositionPixels, currentRow * rowHeight);
  ctx.lineTo(rowPositionPixels, (currentRow + 1) * rowHeight);
  ctx.stroke();
  
  // ------------------- Draw loop region if enabled -------------------
  if (loopSettings.enabled || activeTool === 'loop') {
    // Calculate rows and positions for loop start/end
    const loopStartRow = Math.min(Math.floor(loopSettings.startTime / secondsPerRow), totalRows - 1);
    const loopEndRow = Math.min(Math.floor(loopSettings.endTime / secondsPerRow), totalRows - 1);
    
    const loopStartRowPosition = loopSettings.startTime % secondsPerRow;
    const loopEndRowPosition = loopSettings.endTime % secondsPerRow;
    
    const loopStartX = keyWidth + (loopStartRowPosition / secondsPerBeat) * pixelsPerBeat * zoom;
    const loopEndX = keyWidth + (loopEndRowPosition / secondsPerBeat) * pixelsPerBeat * zoom;
    
    ctx.setLineDash([5, 5]);
    
    // If loop is entirely within one row
    if (loopStartRow === loopEndRow) {
      ctx.fillStyle = 'rgba(100, 100, 255, 0.15)';
      ctx.fillRect(
        loopStartX, 
        loopStartRow * rowHeight, 
        loopEndX - loopStartX, 
        rowHeight
      );
      
      ctx.strokeStyle = '#6464ff';
      ctx.lineWidth = 2;
      
      // Start line
      ctx.beginPath();
      ctx.moveTo(loopStartX, loopStartRow * rowHeight);
      ctx.lineTo(loopStartX, (loopStartRow + 1) * rowHeight);
      ctx.stroke();
      
      // End line
      ctx.beginPath();
      ctx.moveTo(loopEndX, loopStartRow * rowHeight);
      ctx.lineTo(loopEndX, (loopStartRow + 1) * rowHeight);
      ctx.stroke();
    } else {
      // Loop spans multiple rows
      // First row (partial)
      ctx.fillStyle = 'rgba(100, 100, 255, 0.15)';
      ctx.fillRect(
        loopStartX, 
        loopStartRow * rowHeight, 
        rowWidth + keyWidth - loopStartX, 
        rowHeight
      );
      
      // Middle rows (if any)
      for (let row = loopStartRow + 1; row < loopEndRow; row++) {
        ctx.fillRect(
          keyWidth, 
          row * rowHeight, 
          rowWidth, 
          rowHeight
        );
      }
      
      // Last row (partial)
      ctx.fillRect(
        keyWidth, 
        loopEndRow * rowHeight, 
        loopEndX - keyWidth, 
        rowHeight
      );
      
      // Draw start line
      ctx.strokeStyle = '#6464ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(loopStartX, loopStartRow * rowHeight);
      ctx.lineTo(loopStartX, (loopStartRow + 1) * rowHeight);
      ctx.stroke();
      
      // Draw end line
      ctx.beginPath();
      ctx.moveTo(loopEndX, loopEndRow * rowHeight);
      ctx.lineTo(loopEndX, (loopEndRow + 1) * rowHeight);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  }
  
  // ------------------- Draw notes -------------------
  notes.forEach(note => {
    // Calculate which row this note belongs to
    const noteStartRow = Math.min(Math.floor(note.startTime / secondsPerRow), totalRows - 1);
    const noteEndRow = Math.min(Math.floor((note.startTime + note.duration) / secondsPerRow), totalRows - 1);
    
    // Calculate position within row
    const noteStartRowPosition = note.startTime % secondsPerRow;
    const noteEndRowPosition = (note.startTime + note.duration) % secondsPerRow;
    
    // Calculate which key in the row this note belongs to
    const midiNoteOffset = note.key - lowestKey;
    const rowOffset = Math.floor(midiNoteOffset / keysPerRow);
    const keyOffsetInRow = midiNoteOffset % keysPerRow;
    
    // Draw note for each row it spans
    for (let row = noteStartRow; row <= noteEndRow; row++) {
      // Skip if this note doesn't belong to this row
      const noteRowOffset = rowOffset - row;
      if (noteRowOffset < 0 || noteRowOffset >= totalRows) continue;
      
      let startX, width;
      
      if (row === noteStartRow && row === noteEndRow) {
        // Note starts and ends on the same row
        startX = keyWidth + (noteStartRowPosition / secondsPerBeat) * pixelsPerBeat * zoom;
        width = ((noteEndRowPosition - noteStartRowPosition) / secondsPerBeat) * pixelsPerBeat * zoom;
      } else if (row === noteStartRow) {
        // Note starts on this row but continues to next
        startX = keyWidth + (noteStartRowPosition / secondsPerBeat) * pixelsPerBeat * zoom;
        width = rowWidth - (startX - keyWidth);
      } else if (row === noteEndRow) {
        // Note ends on this row but started on previous
        startX = keyWidth;
        width = (noteEndRowPosition / secondsPerBeat) * pixelsPerBeat * zoom;
      } else {
        // Note spans the entire row
        startX = keyWidth;
        width = rowWidth;
      }
      
      // Position in row - inverting to match piano layout (higher notes at top)
      const y = row * rowHeight + (keysPerRow - keyOffsetInRow - 1) * keyHeight + 20; // +20 for time markers
      
      ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
      ctx.fillRect(startX, y, width, keyHeight);
      
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(startX, y, width, keyHeight);
      ctx.stroke();
      
      // Draw velocity bar
      const velocityWidth = 2 + (note.velocity / 127) * 3;
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(startX, y, velocityWidth, keyHeight);
    }
  });
  
  // ------------------- Draw current note being edited -------------------
  if (isDragging && currentNote) {
    const noteStartRow = Math.min(Math.floor(currentNote.startTime / secondsPerRow), totalRows - 1);
    const noteEndRow = Math.min(Math.floor((currentNote.startTime + currentNote.duration) / secondsPerRow), totalRows - 1);
    
    const noteStartRowPosition = currentNote.startTime % secondsPerRow;
    const noteEndRowPosition = (currentNote.startTime + currentNote.duration) % secondsPerRow;
    
    const midiNoteOffset = currentNote.key - lowestKey;
    const rowOffset = Math.floor(midiNoteOffset / keysPerRow);
    const keyOffsetInRow = midiNoteOffset % keysPerRow;
    
    for (let row = noteStartRow; row <= noteEndRow; row++) {
      // Skip if this note doesn't belong to this row
      const noteRowOffset = rowOffset - row;
      if (noteRowOffset < 0 || noteRowOffset >= totalRows) continue;
      
      let startX, width;
      
      if (row === noteStartRow && row === noteEndRow) {
        startX = keyWidth + (noteStartRowPosition / secondsPerBeat) * pixelsPerBeat * zoom;
        width = ((noteEndRowPosition - noteStartRowPosition) / secondsPerBeat) * pixelsPerBeat * zoom;
      } else if (row === noteStartRow) {
        startX = keyWidth + (noteStartRowPosition / secondsPerBeat) * pixelsPerBeat * zoom;
        width = rowWidth - (startX - keyWidth);
      } else if (row === noteEndRow) {
        startX = keyWidth;
        width = (noteEndRowPosition / secondsPerBeat) * pixelsPerBeat * zoom;
      } else {
        startX = keyWidth;
        width = rowWidth;
      }
      
      const y = row * rowHeight + (keysPerRow - keyOffsetInRow - 1) * keyHeight + 20; // +20 for time markers
      
      ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.fillRect(startX, y, width, keyHeight);
      
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(startX, y, width, keyHeight);
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
