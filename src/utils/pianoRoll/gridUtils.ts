
export const drawPianoRollGrid = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  keyWidth: number,
  pixelsPerSecond: number,
  snapInSeconds: number
): void => {
  // Background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(keyWidth, 0, canvas.width - keyWidth, canvas.height);
  
  const secondsVisible = canvas.width / pixelsPerSecond;
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
};
