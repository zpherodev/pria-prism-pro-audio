
import { Note, SnapValue } from '@/types/pianoRoll';
import { LoopSettings } from '@/utils/persistenceUtils';
import { getSnapValueInSeconds } from './pianoRoll/snapUtils';
import { drawPianoRollGrid } from './pianoRoll/gridUtils';
import { drawPianoKeys } from './pianoRoll/keyboardUtils';
import { drawLoopRegion } from './pianoRoll/loopRegionUtils';
import { drawPlayhead } from './pianoRoll/playheadUtils';
import { drawNotes } from './pianoRoll/noteUtils';

export { getSnapValueInSeconds, snapTimeToGrid } from './pianoRoll/snapUtils';

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

  const pixelsPerSecond = zoom * 100;
  const snapInSeconds = getSnapValueInSeconds(snapValue);
  
  // Draw grid
  drawPianoRollGrid(ctx, canvas, keyWidth, pixelsPerSecond, snapInSeconds);

  // Draw piano keys
  drawPianoKeys(ctx, canvas, keyWidth, keyHeight, totalKeys, lowestKey);
  
  // Draw loop region and drag region
  drawLoopRegion(ctx, canvas, keyWidth, pixelsPerSecond, loopSettings, activeTool, isDragging, dragMode, dragStartX);

  // Draw playhead
  drawPlayhead(ctx, canvas, keyWidth, pixelsPerSecond, currentPosition);

  // Draw notes and current note
  drawNotes(ctx, canvas, keyWidth, keyHeight, lowestKey, pixelsPerSecond, notes, isDragging, currentNote);
};
