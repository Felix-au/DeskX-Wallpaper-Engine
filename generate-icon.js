// Generate a proper .ico file for the DeskX: Wallpaper Engine executable
// Creates a 256x256 PNG-based ICO with a "DX" logo icon

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Skip generation if custom logo already exists
const icoPath = path.join(__dirname, 'assets', 'DeskXLogo.ico');
if (fs.existsSync(icoPath)) {
  console.log('DeskXLogo.ico already exists — skipping icon generation.');
  process.exit(0);
}

function createPNGBuffer(size, drawFn) {
  const pixels = Buffer.alloc(size * size * 4, 0);
  drawFn(pixels, size);

  // Build raw scanlines with filter byte
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const si = (y * size + x) * 4;
      const di = y * (size * 4 + 1) + 1 + x * 4;
      raw[di]     = pixels[si];
      raw[di + 1] = pixels[si + 1];
      raw[di + 2] = pixels[si + 2];
      raw[di + 3] = pixels[si + 3];
    }
  }

  const compressed = zlib.deflateSync(raw);

  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeB = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData) >>> 0, 0);
    return Buffer.concat([len, typeB, data, crc]);
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c;
}
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return c ^ 0xFFFFFFFF;
}

// Draw the DeskX logo — rounded rectangle with "DX" lettermark
function drawIcon(pixels, size) {
  const cx = size / 2, cy = size / 2;
  const pad = size * 0.08;
  const cornerR = size * 0.18;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      // Rounded rectangle SDF
      const rx = Math.abs(x - cx) - (cx - pad - cornerR);
      const ry = Math.abs(y - cy) - (cy - pad - cornerR);
      const dist = Math.sqrt(Math.max(rx, 0) ** 2 + Math.max(ry, 0) ** 2) +
                   Math.min(Math.max(rx, ry), 0) - cornerR;

      if (dist < 1.5) {
        // Inside the rounded rect — gradient fill
        const nx = (x - pad) / (size - pad * 2);
        const ny = (y - pad) / (size - pad * 2);
        const gradT = nx * 0.6 + ny * 0.4;

        // Deep purple to vivid blue gradient
        const r = Math.floor(65 + gradT * 60);
        const g = Math.floor(20 + gradT * 50);
        const b = Math.floor(160 + gradT * 95);

        // Anti-alias edge
        const aa = Math.min(1, Math.max(0, 1 - dist));
        pixels[i]     = r;
        pixels[i + 1] = g;
        pixels[i + 2] = b;
        pixels[i + 3] = Math.floor(aa * 255);

        // ── Draw "DX" lettermark ──
        // Normalized coords within the rounded rect
        const lx = (x - pad) / (size - pad * 2); // 0..1
        const ly = (y - pad) / (size - pad * 2); // 0..1

        const letterTop = 0.25, letterBot = 0.75;
        const weight = 0.075; // stroke weight

        if (ly >= letterTop && ly <= letterBot) {
          let isLetter = false;

          // "D" — left half (lx: 0.12 to 0.48)
          const dLeft = 0.14, dRight = 0.46;
          const dMidX = (dLeft + dRight) / 2;
          const dMidY = (letterTop + letterBot) / 2;
          const dRadX = (dRight - dLeft) / 2;
          const dRadY = (letterBot - letterTop) / 2;

          // D: vertical bar on the left
          if (lx >= dLeft && lx <= dLeft + weight && ly >= letterTop && ly <= letterBot) {
            isLetter = true;
          }
          // D: top horizontal
          if (ly >= letterTop && ly <= letterTop + weight && lx >= dLeft && lx <= dMidX + weight) {
            isLetter = true;
          }
          // D: bottom horizontal
          if (ly >= letterBot - weight && ly <= letterBot && lx >= dLeft && lx <= dMidX + weight) {
            isLetter = true;
          }
          // D: right arc (elliptical)
          const eX = (lx - dMidX) / (dRadX * 0.85);
          const eY = (ly - dMidY) / (dRadY);
          const ellipse = eX * eX + eY * eY;
          if (ellipse <= 1.0 && ellipse >= (1 - weight * 5.5) && lx > dMidX) {
            isLetter = true;
          }

          // "X" — right half (lx: 0.54 to 0.88)
          const xLeft = 0.54, xRight = 0.88;
          const xWidth = xRight - xLeft;
          const xHeight = letterBot - letterTop;

          const nlx = (lx - xLeft) / xWidth;   // 0..1 within X bounds
          const nly = (ly - letterTop) / xHeight; // 0..1 within X bounds

          if (lx >= xLeft && lx <= xRight) {
            // Diagonal \ stroke
            if (Math.abs(nlx - nly) < weight * 2.2) {
              isLetter = true;
            }
            // Diagonal / stroke
            if (Math.abs(nlx - (1 - nly)) < weight * 2.2) {
              isLetter = true;
            }
          }

          if (isLetter && dist < 0) {
            // White letter with slight transparency for depth
            pixels[i]     = 255;
            pixels[i + 1] = 255;
            pixels[i + 2] = 255;
            pixels[i + 3] = Math.floor(aa * 240);
          }
        }
      } else if (dist < size * 0.04) {
        // Outer glow
        const glow = 1 - dist / (size * 0.04);
        pixels[i]     = 90;
        pixels[i + 1] = 50;
        pixels[i + 2] = 220;
        pixels[i + 3] = Math.floor(glow * glow * 60);
      }
    }
  }
}

// Build ICO file with multiple PNG sizes
function buildICO(pngBuffers) {
  // ICO header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);     // reserved
  header.writeUInt16LE(1, 2);     // type: ICO
  header.writeUInt16LE(pngBuffers.length, 4);

  // Each directory entry: 16 bytes
  const entries = [];
  let dataOffset = 6 + pngBuffers.length * 16;

  for (const { size, png } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;  // width (0 = 256)
    entry[1] = size >= 256 ? 0 : size;  // height
    entry[2] = 0;    // color palette
    entry[3] = 0;    // reserved
    entry.writeUInt16LE(1, 4);   // color planes
    entry.writeUInt16LE(32, 6);  // bits per pixel
    entry.writeUInt32LE(png.length, 8);   // data size
    entry.writeUInt32LE(dataOffset, 12);  // data offset
    entries.push(entry);
    dataOffset += png.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers.map(p => p.png)]);
}

// Generate
const sizes = [16, 32, 48, 64, 128, 256];
const pngBuffers = sizes.map(size => ({
  size,
  png: createPNGBuffer(size, drawIcon),
}));

const icoBuffer = buildICO(pngBuffers);
const outPath = path.join(__dirname, 'assets', 'DeskXLogo.ico');
fs.writeFileSync(outPath, icoBuffer);
console.log(`ICO generated: ${outPath} (${icoBuffer.length} bytes, ${sizes.length} sizes)`);

// Also save 256px PNG as app icon
const png256 = pngBuffers.find(p => p.size === 256).png;
fs.writeFileSync(path.join(__dirname, 'assets', 'DeskXLogo.png'), png256);
console.log('PNG icon saved: assets/DeskXLogo.png');
