// loadImage.js
const fs = require('fs');

function loadRaw(filePath, width, height) {
  const data = fs.readFileSync(filePath);
  const expectedSize = (width / 8) * height;
  if (data.length !== expectedSize) {
    throw new Error(`Raw data size mismatch: expected ${expectedSize}, got ${data.length}`);
  }
  return { width, height, data };
}

module.exports = { loadRaw };
