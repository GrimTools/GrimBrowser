const Jimp = require('jimp');
const SRC = 'C:/Users/User/Downloads/chatgpt grim reaper.png';
const OUT = 'C:/Users/User/Downloads/GrimBrowser/src/icons/grim.png';
(async () => {
  const img = await Jimp.read(SRC);
  const w = img.bitmap.width, h = img.bitmap.height, d = img.bitmap.data;
  const idx = (x, y) => (y * w + x) * 4;
  const lum = (x, y) => { const i = idx(x, y); return 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]; };
  const T = 78;
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) { stack.push([x, 0], [x, h - 1]); }
  for (let y = 0; y < h; y++) { stack.push([0, y], [w - 1, y]); }
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const p = y * w + x;
    if (seen[p]) continue; seen[p] = 1;
    if (lum(x, y) >= T) continue;
    d[idx(x, y) + 3] = 0;
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  let minX=w, minY=h, maxX=0, maxY=0;
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) { if (d[idx(x,y)+3] > 10) { if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; } }
  const pad = 12;
  minX=Math.max(0,minX-pad); minY=Math.max(0,minY-pad); maxX=Math.min(w-1,maxX+pad); maxY=Math.min(h-1,maxY+pad);
  img.crop(minX, minY, maxX-minX+1, maxY-minY+1);
  await img.writeAsync(OUT);
  console.log('Done. Content cropped to', (maxX-minX+1)+'x'+(maxY-minY+1));
})().catch(e => console.error('ERR', e.message));
