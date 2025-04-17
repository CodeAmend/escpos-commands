// escpos-utils.js
const { Buffer } = require('buffer');
const { ESC, GS } = require('./hex-values');

// -- Init printer --
function init() {
  return Buffer.from([ESC, 0x40]); // ESC @
}

function br(lines = 1) {
  return Buffer.alloc(lines, 0x0A); // LF
}

function cut(full = true) {
  return Buffer.from([GS, 0x56, full ? 0x00 : 0x01]);
}

function text(str) {
  return Buffer.from(str, 'ascii');
}

function qrcode(data, model = 2, size = 4) {
  const storeLen = data.length + 3;
  const pL = storeLen & 0xFF;
  const pH = storeLen >> 8;

  return Buffer.concat([
    Buffer.from([GS, 0x28, 0x6B, 3, 0, 49, 65, model]), // Model
    Buffer.from([GS, 0x28, 0x6B, 3, 0, 49, 67, size]),  // Size
    Buffer.from([GS, 0x28, 0x6B, 3, 0, 49, 69, 48]),    // Error correction
    Buffer.from([GS, 0x28, 0x6B, pL, pH, 49, 80, 48]),
    Buffer.from(data, 'ascii'),
    Buffer.from([GS, 0x28, 0x6B, 3, 0, 49, 81, 48])     // Print QR
  ]);
}

function enterPageMode() {
  return Buffer.from([ESC, 0x4C]);
}

function exitPageMode() {
  return Buffer.from([0x0C]); // FF
}

function definePageArea(x, y, width, height) {
  return Buffer.from([
    ESC, 0x57,
    x & 0xFF, x >> 8,
    y & 0xFF, y >> 8,
    width & 0xFF, width >> 8,
    height & 0xFF, height >> 8
  ]);
}

function setPosition(x, y) {
  return Buffer.concat([
    Buffer.from([ESC, 0x24, x & 0xFF, x >> 8]),       // Horizontal (ESC $)
    Buffer.from([GS,  0x24, y & 0xFF, y >> 8])        // Vertical (GS $)
  ]);
}

module.exports = {
  init,
  br,
  cut,
  text,
  qrcode,
  enterPageMode,
  exitPageMode,
  definePageArea,
  setPosition
};
