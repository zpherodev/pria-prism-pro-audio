
import { Note, SnapValue } from '@/types/pianoRoll';
import { LoopSettings } from '@/utils/persistenceUtils';

export const getSnapValueInSeconds = (snapValue: SnapValue): number => {
  switch (snapValue) {
    case '1/32': return 0.125;
    case '1/16': return 0.25;
    case '1/8': return 0.5;
    case '1/4': return 1;
    case '1/2': return 2;
    case '1': return 4;
    default: return 0.5;
  }
};

export const snapTimeToGrid = (time: number, snapValue: SnapValue): number => {
  const snapInSeconds = getSnapValueInSeconds(snapValue);
  return Math.round(time / snapInSeconds) * snapInSeconds;
};

export const renderPianoRoll = (
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
  snapValue: SnapValue
): void => {
  const keyWidth = 60;
  const keyHeight = 20;
  const totalKeys = 88; // Piano standard
  const lowestKey = 21; // A0 in MIDI

  canvas.width = Math.max(canvas.width, 1000);
  canvas.height = totalKeys * keyHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(keyWidth, 0, canvas.width - keyWidth, canvas.height);
  
  ctx.fillStyle = '#333';
  const pixelsPerSecond = zoom * 100;
  const secondsVisible = canvas.width / pixelsPerSecond;
  
  const snapInSeconds = getSnapValueInSeconds(snapValue);
  const smallestGridDivision = snapInSeconds / 4;

  // Draw grid
  for (let time = 0; time <= secondsVisible; time += smallestGridDivision) {
    const x = keyWidth + time * pixelsPerSecond;
    
    const isMeasure = time % 4 < 0.001;
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

  // Draw piano keys
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
  
  // Draw loop region
  if (loopSettings.enabled || activeTool === 'loop') {
    const loopStartX = keyWidth + loopSettings.startTime * pixelsPerSecond;
    const loopEndX = keyWidth + loopSettings.endTime * pixelsPerSecond;
    
    ctx.fillStyle = 'rgba(100, 100, 255, 0.15)';
    ctx.fillRect(loopStartX, 0, loopEndX - loopStartX, canvas.height);
    
    ctx.strokeStyle = '#6464ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(loopStartX, 0);
    ctx.lineTo(loopStartX, canvas.height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(loopEndX, 0);
    ctx.lineTo(loopEndX, canvas.height);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    const handleSize = 10;
    const handleY = 10;
    
    ctx.fillStyle = '#6464ff';
    ctx.fillRect(loopStartX - handleSize/2, handleY - handleSize/2, handleSize, handleSize);
    
    ctx.fillRect(loopEndX - handleSize/2, handleY - handleSize/2, handleSize, handleSize);
  }

  // Draw playhead
  const playheadX = keyWidth + currentPosition * pixelsPerSecond;
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX, canvas.height);
  ctx.stroke();

  // Draw current note being edited
  if (isDragging && currentNote) {
    const x = keyWidth + currentNote.startTime * pixelsPerSecond;
    const y = canvas.height - (currentNote.key - lowestKey + 1) * keyHeight;
    const width = currentNote.duration * pixelsPerSecond;
    
    ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.fillRect(x, y, width, keyHeight);
    
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x, y, width, keyHeight);
    ctx.stroke();
  }
  
  // Draw drag region for loop tool
  if (isDragging && activeTool === 'loop' && dragMode === 'loopRegion' && dragStartX !== null) {
    const currentX = (dragStartX - keyWidth) / pixelsPerSecond;
    
    const startX = keyWidth + Math.min(currentX, loopSettings.startTime) * pixelsPerSecond;
    const endX = keyWidth + Math.max(currentX, loopSettings.endTime) * pixelsPerSecond;
    
    ctx.fillStyle = 'rgba(100, 100, 255, 0.25)';
    ctx.fillRect(startX, 0, endX - startX, canvas.height);
    
    ctx.strokeStyle = '#6464ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.rect(startX, 0, endX - startX, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw notes
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
};
