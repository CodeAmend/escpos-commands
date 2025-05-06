// imageProcessor.js
const sharp = require('sharp');
const fs = require('fs');

async function convertImageToRasterBin(imagePath, outputBinPath, width = 384, height = 48) {
  const { data, info } = await sharp(imagePath)
    .resize({ width, height, fit: 'fill' }) // Force exact size
    .threshold(128) // Convert to B/W
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: imgWidth, height: imgHeight } = info;
  if (imgWidth !== width || imgHeight !== height) {
    throw new Error(`Image size mismatch: expected ${width}x${height}, got ${imgWidth}x${imgHeight}`);
  }

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

  // Save raster data to .bin file
  fs.writeFileSync(outputBinPath, raster);

  return { width, height, data: raster };
}

module.exports = { convertImageToRasterBin };
