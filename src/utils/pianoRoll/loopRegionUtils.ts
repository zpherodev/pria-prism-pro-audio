
import { LoopSettings } from '@/utils/persistenceUtils';

export const drawLoopRegion = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  keyWidth: number,
  pixelsPerSecond: number,
  loopSettings: LoopSettings,
  activeTool: string,
  isDragging: boolean,
  dragMode: string,
  dragStartX: number | null
): void => {
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
};
