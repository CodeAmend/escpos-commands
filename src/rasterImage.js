const sharp = require('sharp');
const { GS } = require('./values');

async function convertImageToRasterBuffer(imagePath) {
  const { data, info } = await sharp(imagePath)
    .resize({ width: 384 })            // Adjust width for printer
    .threshold(128)                    // Convert to B/W
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const bytesPerLine = Math.ceil(width / 8);
  const raster = Buffer.alloc(bytesPerLine * height);

  for (let y = 0; y < height; y++) {
    for (let xByte = 0; xByte < bytesPerLine; xByte++) {
      let byte = 0x00;
      for (let bit = 0; bit < 8; bit++) {
        const x = xByte * 8 + bit;
        if (x >= width) continue;
        const pixel = data[y * width + x];
        if (pixel === 0) byte |= 0x80 >> bit;
      }
      raster[y * bytesPerLine + xByte] = byte;
    }
  }

  const header = Buffer.from([
    GS, 0x76, 0x30, 0x00,
    bytesPerLine & 0xFF, (bytesPerLine >> 8) & 0xFF,
    height & 0xFF, (height >> 8) & 0xFF
  ]);

  return Buffer.concat([header, raster]);
}

module.exports = { convertImageToRasterBuffer };

