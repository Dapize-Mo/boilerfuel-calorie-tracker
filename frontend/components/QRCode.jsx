import { useEffect, useRef } from 'react';

// Minimal QR Code generator using canvas
// Uses the QR code encoding algorithm for alphanumeric mode
// Supports up to ~50 chars which is enough for our sync codes

// QR Code encoding tables
const EC_CODEWORDS_L = [7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30];
const ALIGNMENT_PATTERNS = [[], [6,18], [6,22], [6,26], [6,30], [6,34], [6,22,38], [6,24,42], [6,26,46], [6,28,50]];
const FORMAT_INFO = [0x77c4,0x72f3,0x7daa,0x789d,0x662f,0x6318,0x6c41,0x6976,0x5412,0x5125,0x5e7c,0x5b4b,0x45f9,0x40ce,0x4f97,0x4aa0,0x355f,0x3068,0x3f31,0x3a06,0x24b4,0x2183,0x2eda,0x2bed,0x1689,0x13be,0x1ce7,0x19d0,0x0762,0x0255,0x0d0c,0x083b];

// Simple QR code - generates a data URL for the QR image
export default function QRCode({ text, size = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !text) return;
    // Use a simple approach: encode text as a QR code pattern on canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    try {
      const modules = generateQR(text);
      const moduleCount = modules.length;
      const cellSize = Math.floor(size / (moduleCount + 8)); // +8 for quiet zone
      const offset = Math.floor((size - cellSize * moduleCount) / 2);

      canvas.width = size;
      canvas.height = size;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#000000';

      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (modules[r][c]) {
            ctx.fillRect(offset + c * cellSize, offset + r * cellSize, cellSize, cellSize);
          }
        }
      }
    } catch {
      // Fallback: just show text
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#000000';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(text, size / 2, size / 2);
    }
  }, [text, size]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ imageRendering: 'pixelated' }} />;
}

// ── QR Code generation (Version 1-3, Error Correction L, Byte mode) ──

function generateQR(text) {
  const data = new TextEncoder().encode(text);
  const dataLen = data.length;

  // Determine version (1-10)
  let version = 1;
  const capacities = [17, 32, 53, 78, 106, 134, 154, 192, 230, 271]; // L error correction byte mode
  for (let i = 0; i < capacities.length; i++) {
    if (dataLen <= capacities[i]) { version = i + 1; break; }
  }

  const moduleCount = 17 + version * 4;
  const modules = Array.from({ length: moduleCount }, () => new Array(moduleCount).fill(false));
  const reserved = Array.from({ length: moduleCount }, () => new Array(moduleCount).fill(false));

  // Place finder patterns
  placeFinder(modules, reserved, 0, 0);
  placeFinder(modules, reserved, moduleCount - 7, 0);
  placeFinder(modules, reserved, 0, moduleCount - 7);

  // Place timing patterns
  for (let i = 8; i < moduleCount - 8; i++) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
    reserved[6][i] = true;
    reserved[i][6] = true;
  }

  // Place alignment patterns (version 2+)
  if (version >= 2) {
    const positions = ALIGNMENT_PATTERNS[version - 1];
    if (positions) {
      for (const r of positions) {
        for (const c of positions) {
          if (reserved[r]?.[c]) continue;
          placeAlignment(modules, reserved, r, c);
        }
      }
    }
  }

  // Reserve format info areas
  for (let i = 0; i < 8; i++) {
    reserved[8][i] = true;
    reserved[8][moduleCount - 1 - i] = true;
    reserved[i][8] = true;
    reserved[moduleCount - 1 - i][8] = true;
  }
  reserved[8][8] = true;
  // Dark module
  modules[moduleCount - 8][8] = true;
  reserved[moduleCount - 8][8] = true;

  // Encode data
  const encoded = encodeData(data, version);

  // Place data bits
  placeData(modules, reserved, encoded, moduleCount);

  // Apply mask 0 (checkerboard) and format info
  applyMask(modules, reserved, moduleCount, 0);
  placeFormatInfo(modules, moduleCount, 0); // mask 0, EC level L

  return modules;
}

function placeFinder(modules, reserved, row, col) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const mr = row + r, mc = col + c;
      if (mr < 0 || mc < 0 || mr >= modules.length || mc >= modules.length) continue;
      if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
        modules[mr][mc] = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
      }
      reserved[mr][mc] = true;
    }
  }
}

function placeAlignment(modules, reserved, row, col) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const mr = row + r, mc = col + c;
      if (mr < 0 || mc < 0 || mr >= modules.length || mc >= modules.length) continue;
      modules[mr][mc] = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
      reserved[mr][mc] = true;
    }
  }
}

function encodeData(data, version) {
  const totalCodewords = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346];
  const ecCodewords = EC_CODEWORDS_L[version - 1];
  const dataCodewords = totalCodewords[version - 1] - ecCodewords;

  const bits = [];
  // Mode indicator: byte mode = 0100
  bits.push(0, 1, 0, 0);
  // Character count (8 bits for v1-9, 16 for v10+)
  const countBits = version <= 9 ? 8 : 16;
  for (let i = countBits - 1; i >= 0; i--) bits.push((data.length >> i) & 1);
  // Data
  for (const byte of data) {
    for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
  }
  // Terminator
  while (bits.length < dataCodewords * 8 && bits.length < dataCodewords * 8) bits.push(0);
  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);
  // Pad codewords
  let pad = 0;
  while (bits.length < dataCodewords * 8) {
    const padByte = pad % 2 === 0 ? 0xEC : 0x11;
    for (let i = 7; i >= 0; i--) bits.push((padByte >> i) & 1);
    pad++;
  }

  // Convert to codewords
  const codewords = [];
  for (let i = 0; i < bits.length; i += 8) {
    let val = 0;
    for (let j = 0; j < 8; j++) val = (val << 1) | (bits[i + j] || 0);
    codewords.push(val);
  }

  // Generate EC codewords using Reed-Solomon
  const ecCodes = reedSolomon(codewords, ecCodewords);

  // Interleave (for v1-9 single block, just concatenate)
  const allBits = [];
  for (const cw of [...codewords, ...ecCodes]) {
    for (let i = 7; i >= 0; i--) allBits.push((cw >> i) & 1);
  }
  return allBits;
}

// Simplified Reed-Solomon for QR Code (GF(256) with 0x11d)
function reedSolomon(data, ecCount) {
  const gfExp = new Array(256);
  const gfLog = new Array(256);
  let val = 1;
  for (let i = 0; i < 255; i++) {
    gfExp[i] = val;
    gfLog[val] = i;
    val <<= 1;
    if (val >= 256) val ^= 0x11d;
  }
  gfExp[255] = gfExp[0];

  const gfMul = (a, b) => {
    if (a === 0 || b === 0) return 0;
    return gfExp[(gfLog[a] + gfLog[b]) % 255];
  };

  // Generator polynomial
  let gen = [1];
  for (let i = 0; i < ecCount; i++) {
    const next = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j];
      next[j + 1] ^= gfMul(gen[j], gfExp[i]);
    }
    gen = next;
  }

  // Division
  const result = new Array(ecCount).fill(0);
  const msg = [...data, ...result];
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

function placeData(modules, reserved, bits, moduleCount) {
  let bitIdx = 0;
  for (let col = moduleCount - 1; col >= 1; col -= 2) {
    if (col === 6) col = 5; // Skip timing column
    for (let i = 0; i < moduleCount; i++) {
      for (let j = 0; j < 2; j++) {
        const c = col - j;
        const r = ((Math.floor((moduleCount - 1 - col + (col < 6 ? 1 : 0)) / 2)) % 2 === 0)
          ? moduleCount - 1 - i : i;
        if (r < 0 || r >= moduleCount || c < 0 || c >= moduleCount) continue;
        if (reserved[r][c]) continue;
        if (bitIdx < bits.length) {
          modules[r][c] = bits[bitIdx] === 1;
          bitIdx++;
        }
      }
    }
  }
}

function applyMask(modules, reserved, moduleCount, maskPattern) {
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (reserved[r][c]) continue;
      let shouldFlip = false;
      switch (maskPattern) {
        case 0: shouldFlip = (r + c) % 2 === 0; break;
        case 1: shouldFlip = r % 2 === 0; break;
        case 2: shouldFlip = c % 3 === 0; break;
        case 3: shouldFlip = (r + c) % 3 === 0; break;
        default: shouldFlip = (r + c) % 2 === 0;
      }
      if (shouldFlip) modules[r][c] = !modules[r][c];
    }
  }
}

function placeFormatInfo(modules, moduleCount, maskPattern) {
  const formatBits = FORMAT_INFO[maskPattern]; // EC level L = 01, mask pattern
  for (let i = 0; i < 15; i++) {
    const bit = (formatBits >> (14 - i)) & 1;
    // Around top-left finder
    if (i < 6) modules[8][i] = !!bit;
    else if (i < 8) modules[8][i + 1] = !!bit;
    else if (i < 9) modules[8 - (i - 8)][8] = !!bit;
    else modules[14 - i][8] = !!bit;
    // Other copy
    if (i < 8) modules[moduleCount - 1 - i][8] = !!bit;
    else modules[8][moduleCount - 15 + i] = !!bit;
  }
}
