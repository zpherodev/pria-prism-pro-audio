
export const drawPianoKeys = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  keyWidth: number,
  keyHeight: number,
  totalKeys: number,
  lowestKey: number
): void => {
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
};
