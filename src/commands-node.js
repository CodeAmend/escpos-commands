// commands-node.js
const { Buffer } = require('buffer');
const { ESC, GS } = require('./values');

// Helper to split a number into low and high bytes (L+H format)
const getLH = (n) => {
  const L = (n | 0) % 256;
  return [L, ((n | 0) - L) / 256];
};

// -- Init printer --
function init() {
  // ESC @
  return Buffer.from([ESC, 0x40]);
}

function lineFeed(lines = 1) {
  return Buffer.alloc(lines, 0x0A); // LF
}

function cut(full = true) {
  return Buffer.from([GS, 0x56, full ? 0x00 : 0x01]);
}

function printText(str) {
  return Buffer.from(str, 'ascii');
}

// Set Reverse Background
function reverseBackground(isOn) {
  // GS B n
  return Buffer.from([GS, 0x42, isOn ? 0x01 : 0x00]);
}

function qrcode(data, model = 2, size = 4) {
  const storeLen = data.length + 3;
  const pLow = storeLen & 0xFF;
  const pHigh = storeLen >> 8;

  return Buffer.concat([
    Buffer.from([GS, 0x28, 0x6B, 3, 0, 49, 65, model]), // Model
    Buffer.from([GS, 0x28, 0x6B, 3, 0, 49, 67, size]),  // Size
    Buffer.from([GS, 0x28, 0x6B, 3, 0, 49, 69, 48]),    // Error correction
    Buffer.from([GS, 0x28, 0x6B, pLow, pHigh, 49, 80, 48]),
    Buffer.from(data, 'ascii'),
    Buffer.from([GS, 0x28, 0x6B, 3, 0, 49, 81, 48])     // Print QR
  ]);
}

function enterPageMode() {
  // ESC L
  // Note: CR not included; add if required by printer
  return Buffer.from([ESC, 0x4C]);
}

function printPageMode() {
  // ESC FF: Print buffer and stay in page mode
  return Buffer.from([ESC, 0x0C]);
}

function printAndExitPageMode() {
  // FF: Print buffer and return to standard mode
  return Buffer.from([0x0C]);
}

function exitPageMode() {
  // ESC @: Exit page mode without printing (clears buffer)
  return Buffer.from([ESC, 0x40]);
}

function definePageArea(x, y, width, height) {
  // ESC W: Set page mode print area
  const [xL, xH] = getLH(x);
  const [yL, yH] = getLH(y);
  const [dxL, dxH] = getLH(width);
  const [dyL, dyH] = getLH(height);
  return Buffer.from([ESC, 0x57, xL, xH, yL, yH, dxL, dxH, dyL, dyH]);
}

function setPosition(x, y) {
  // ESC $ (horizontal) + GS $ (vertical)
  const [xL, xH] = getLH(x);
  const [yL, yH] = getLH(y);
  return Buffer.concat([
    Buffer.from([ESC, 0x24, xL, xH]), // Horizontal
    Buffer.from([GS, 0x24, yL, yH])   // Vertical
  ]);
}

function setLeftPrintPosition(left) {
  // ESC $: Set absolute horizontal print position
  const [nL, nH] = getLH(left);
  return Buffer.from([ESC, 0x24, nL, nH]);
}

function setAbsoluteVerticalPrintPosition(height) {
  // GS $: Set absolute vertical print position (page mode)
  const [nL, nH] = getLH(height);
  return Buffer.from([GS, 0x24, nL, nH]);
}

function setMotionUnits(x, y) {
  // GS P: Set horizontal and vertical motion units
  if (x < 0 || x > 255 || isNaN(x)) {
    throw new Error(`Horizontal motion unit must be between 0-255 (${x})`);
  }
  if (y < 0 || y > 255 || isNaN(y)) {
    throw new Error(`Vertical motion unit must be between 0-255 (${y})`);
  }
  return Buffer.from([GS, 0x50, x | 0, y | 0]);
}

function resetMotionUnits() {
  // GS P 0 0: Reset motion units to default
  return Buffer.from([GS, 0x50, 0, 0]);
}

function setLeftMargin(left) {
  // GS L: Set left margin (standard mode, uses motion units)
  const [nL, nH] = getLH(left);
  return Buffer.from([GS, 0x4C, nL, nH]);
}

function setPrintWidth(width) {
  // GS W: Set print width (standard mode, uses motion units)
  const [nL, nH] = getLH(width);
  return Buffer.from([GS, 0x57, nL, nH]);
}

function setRelativeVerticalPrintPosition(height) {
  // GS \: Set relative vertical print position (page mode)
  if (height < -32768 || height > 32767 || isNaN(height)) {
    throw new Error("Height must be in range [-32768, 32767]");
  }
  const [nL, nH] = getLH(height);
  return Buffer.from([GS, 0x5C, nL, nH]);
}

function setPrintDirection(directionCode) {
  // ESC T: Set print direction in page mode (0-3)
  if (directionCode < 0 || directionCode > 3 || isNaN(directionCode)) {
    throw new Error(`Direction code must be in range [0-3] (${directionCode})`);
  }
  return Buffer.from([ESC, 0x54, directionCode]);
}

// For raster image printing
function rasterImage(width, height, imgData) {
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
  definePageArea,
  setPosition,
  setLeftPrintPosition,
  setAbsoluteVerticalPrintPosition,
  setMotionUnits,
  resetMotionUnits,
  setLeftMargin,
  setPrintWidth,
  setRelativeVerticalPrintPosition,
  setPrintDirection,
  rasterImage
};
