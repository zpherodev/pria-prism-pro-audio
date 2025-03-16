
import { Note } from '@/types/pianoRoll';

export const drawNotes = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  keyWidth: number,
  keyHeight: number,
  lowestKey: number,
  pixelsPerSecond: number,
  notes: Note[],
  isDragging: boolean,
  currentNote: Note | null
): void => {
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
};
