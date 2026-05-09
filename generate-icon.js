// Generate a proper .ico file for the Wallpaper Engine executable
// Creates a 256x256 PNG-based ICO with a diamond gradient icon

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

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

// Draw a diamond gradient with glow
function drawIcon(pixels, size) {
  const cx = size / 2, cy = size / 2;
  const radius = size * 0.38;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - cx, dy = y - cy;

      // Diamond shape (rotated square)
      const diamondDist = Math.abs(dx) + Math.abs(dy);
      const t = Math.max(0, 1 - diamondDist / radius);

      if (t > 0) {
        // Purple-to-blue gradient
        const gradT = (dx + dy + radius * 2) / (radius * 4);
        const r = Math.floor(100 + gradT * 80);
        const g = Math.floor(50 + gradT * 60);
        const b = Math.floor(180 + gradT * 75);

        // Smooth edges
        const edgeSoft = Math.min(1, t * 8);
        const alpha = Math.floor(edgeSoft * 255);

        // Inner highlight
        const highlight = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / (radius * 0.5));
        const hBoost = highlight * 60;

        pixels[i]     = Math.min(255, r + hBoost);
        pixels[i + 1] = Math.min(255, g + hBoost);
        pixels[i + 2] = Math.min(255, b + hBoost);
        pixels[i + 3] = alpha;
      } else {
        // Outer glow
        const glowDist = diamondDist - radius;
        const glowRadius = size * 0.08;
        if (glowDist < glowRadius) {
          const glow = 1 - glowDist / glowRadius;
          pixels[i]     = 124;
          pixels[i + 1] = 92;
          pixels[i + 2] = 255;
          pixels[i + 3] = Math.floor(glow * glow * 80);
        }
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
const outPath = path.join(__dirname, 'assets', 'icon.ico');
fs.writeFileSync(outPath, icoBuffer);
console.log(`ICO generated: ${outPath} (${icoBuffer.length} bytes, ${sizes.length} sizes)`);

// Also save 256px PNG as app icon
const png256 = pngBuffers.find(p => p.size === 256).png;
fs.writeFileSync(path.join(__dirname, 'assets', 'icon.png'), png256);
console.log('PNG icon saved: assets/icon.png');
