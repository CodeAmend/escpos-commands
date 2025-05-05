// commands-node.js
const { Buffer } = require('buffer');
const { ESC, GS } = require('./values');

// Helper to split a number into low and high bytes (L+H format)
const getLH = (n) => {
  const L = (n | 0) % 256;
  return [L, ((n | 0) - L) / 256];
};

// Initialize printer
function init() {
  // ESC @ (1B 40): Reset printer to default settings
  return Buffer.from([ESC, 0x40]);
}

// Advance paper by specified lines
function lineFeed(lines = 1) {
  // LF (0A): Line feed
  return Buffer.alloc(lines, 0x0A);
}

// Cut paper (full or partial)
function cut(full = true) {
  // GS V (1D 56): Paper cut
  return Buffer.from([GS, 0x56, full ? 0x00 : 0x01]);
}

// Print ASCII text
function printText(str) {
  // Direct ASCII text
  return Buffer.from(str, 'ascii');
}

// Enable/disable reverse background (white on black)
function reverseBackground(isOn) {
  // GS B (1D 42): Reverse printing
  return Buffer.from([GS, 0x42, isOn ? 0x01 : 0x00]);
}

// Print QR code
function qrcode(data, model = 2, size = 4) {
  // GS ( k (1D 28 6B): QR code
  const storeLen = data.length + 3;
  const pLow = storeLen & 0xFF;
  const pHigh = storeLen >> 8;

  return Buffer.concat([
    Buffer.from([GS, 0x28, 0x6B, 3, 0, 49, 65, model]), // Model
    Buffer.from([GS, 0x28, 0x6B, 3, 0, 49, 67, size]),  // Size
    Buffer.from([GS, 0x28, 0x6B, 3, 0, 49, 69, 48]),    // Error correction
    Buffer.from([GS, 0x28, 0x6B, pLow, pHigh, 49, 80, 48]), // Store data
    Buffer.from(data, 'ascii'), // QR code data
    Buffer.from([GS, 0x28, 0x6B, 3, 0, 49, 81, 48])     // Print QR
  ]);
}

// Enter page mode
function enterPageMode() {
  // ESC L (1B 4C): Switch to page mode
  return Buffer.from([ESC, 0x4C]);
}

// Print buffer and stay in page mode
function printPageMode() {
  // ESC FF (1B 0C): Print data in page mode
  return Buffer.from([ESC, 0x0C]);
}

// Print buffer and exit to standard mode
function printAndExitPageMode() {
  // FF (0C): Print and return to standard mode
  return Buffer.from([0x0C]);
}

// Exit page mode without printing
function exitPageMode() {
  // ESC @ (1B 40): Exit page mode and clear buffer
  return Buffer.from([ESC, 0x40]);
}

// Set page mode print area
function setPrintArea(x, y, width, height) {
  // ESC W (1B 57): Set printing area in page mode
  const [xL, xH] = getLH(x);
  const [yL, yH] = getLH(y);
  const [dxL, dxH] = getLH(width);
  const [dyL, dyH] = getLH(height);
  return Buffer.from([ESC, 0x57, xL, xH, yL, yH, dxL, dxH, dyL, dyH]);
}

// Set absolute position (horizontal and vertical)
function setPosition(x, y) {
  // ESC $ (1B 24) + GS $ (1D 24): Set position
  const [xL, xH] = getLH(x);
  const [yL, yH] = getLH(y);
  return Buffer.concat([
    Buffer.from([ESC, 0x24, xL, xH]), // Horizontal
    Buffer.from([GS, 0x24, yL, yH])   // Vertical
  ]);
}

// Set absolute horizontal print position
function setLeftPrintPosition(left) {
  // ESC $ (1B 24): Absolute horizontal position
  const [nL, nH] = getLH(left);
  return Buffer.from([ESC, 0x24, nL, nH]);
}

// Set absolute vertical print position (page mode)
function setAbsoluteVerticalPrintPosition(height) {
  // GS $ (1D 24): Absolute vertical position
  const [nL, nH] = getLH(height);
  return Buffer.from([GS, 0x24, nL, nH]);
}

// Set relative vertical print position (page mode)
function setRelativeVerticalPrintPosition(height) {
  // GS \ (1D 5C): Relative vertical position
  if (height < -32768 || height > 32767 || isNaN(height)) {
    throw new Error('Height must be in range [-32768, 32767]');
  }
  const [nL, nH] = getLH(height);
  return Buffer.from([GS, 0x5C, nL, nH]);
}

// Set print direction in page mode
function setPrintDirection(directionCode) {
  // ESC T (1B 54): Set print direction (0-3)
  if (directionCode < 0 || directionCode > 3 || isNaN(directionCode)) {
    throw new Error(`Direction code must be in range [0-3] (${directionCode})`);
  }
  return Buffer.from([ESC, 0x54, directionCode]);
}

// Set horizontal and vertical motion units
function setMotionUnits(x, y) {
  // GS P (1D 50): Set motion units
  if (x < 0 || x > 255 || isNaN(x)) {
    throw new Error(`Horizontal motion unit must be between 0-255 (${x})`);
  }
  if (y < 0 || y > 255 || isNaN(y)) {
    throw new Error(`Vertical motion unit must be between 0-255 (${y})`);
  }
  return Buffer.from([GS, 0x50, x | 0, y | 0]);
}

// Reset motion units to default
function resetMotionUnits() {
  // GS P 0 0 (1D 50 00 00): Reset motion units
  return Buffer.from([GS, 0x50, 0, 0]);
}

// Set left margin (standard mode)
function setLeftMargin(left) {
  // GS L (1D 4C): Set left margin
  const [nL, nH] = getLH(left);
  return Buffer.from([GS, 0x4C, nL, nH]);
}

// Set print width (standard mode)
function setPrintWidth(width) {
  // GS W (1D 57): Set printing width
  const [nL, nH] = getLH(width);
  return Buffer.from([GS, 0x57, nL, nH]);
}

// Print raster image
function rasterImage(width, height, imgData) {
  // GS v 0 (1D 76 30): Raster bit image
  const widthBytes = width / 8;
  const widthLow = widthBytes & 0xFF;
  const widthHigh = (widthBytes >> 8) & 0xFF;
  const heightLow = height & 0xFF;
  const heightHigh = (height >> 8) & 0xFF;
  return Buffer.concat([
    Buffer.from([GS, 0x76, 0x30, 0x00, widthLow, widthHigh, heightLow, heightHigh]),
    Buffer.from(imgData)
  ]);
}

module.exports = {
  init,
  lineFeed,
  cut,
  printText,
  reverseBackground,
  qrcode,
  enterPageMode,
  printPageMode,
  printAndExitPageMode,
  exitPageMode,
  setPrintArea,
  setPosition,
  setLeftPrintPosition,
  setAbsoluteVerticalPrintPosition,
  setRelativeVerticalPrintPosition,
  setPrintDirection,
  setMotionUnits,
  resetMotionUnits,
  setLeftMargin,
  setPrintWidth,
  rasterImage
};
