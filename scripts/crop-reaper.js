const Jimp = require('jimp');
const P = 'C:/Users/User/Downloads/GrimBrowser/src/icons/grim.png';
(async () => {
  const img = await Jimp.read(P);
  const w = img.bitmap.width, h = img.bitmap.height, d = img.bitmap.data;
  const col = new Array(w).fill(0);
  for (let x = 0; x < w; x++) { let c = 0; for (let y = 0; y < h; y++) if (d[(y*w+x)*4+3] > 20) c++; col[x] = c; }
  const gapT = Math.max(2, Math.floor(h * 0.01));
  let x = 0;
  while (x < w && col[x] <= gapT) x++;
  const start = x;
  while (x < w && col[x] > gapT) x++;
  const gapStart = x;
  let g = x; while (g < w && col[g] <= gapT) g++;
  const gapWidth = g - gapStart;
  let minY = h, maxY = 0;
  for (let xx = start; xx < gapStart; xx++) for (let y = 0; y < h; y++) if (d[(y*w+xx)*4+3] > 20) { if (y<minY)minY=y; if (y>maxY)maxY=y; }
  const pad = 6;
  const cx = Math.max(0, start-pad), cy = Math.max(0, minY-pad);
  const cw = Math.min(w-cx, (gapStart-start)+2*pad), ch = Math.min(h-cy, (maxY-minY)+2*pad);
  img.crop(cx, cy, cw, ch);
  await img.writeAsync(P);
  console.log('Reaper cropped to', cw+'x'+ch, '| gap after reaper was', gapWidth+'px wide');
})().catch(e => console.error('ERR', e.message));
