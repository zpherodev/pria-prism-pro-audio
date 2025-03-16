
export const drawPlayhead = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  keyWidth: number,
  pixelsPerSecond: number,
  currentPosition: number
): void => {
  // Draw playhead
  const playheadX = keyWidth + currentPosition * pixelsPerSecond;
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX, canvas.height);
  ctx.stroke();
};
