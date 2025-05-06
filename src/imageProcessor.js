const sharp = require('sharp');

async function convertImageToRasterData(imagePath, width = 16, height = 29) {
  if (width % 8 !== 0) {
    throw new Error('Width must be a multiple of 8');
  }
  const { data, info } = await sharp(imagePath)
    .ensureAlpha() // Handle RGBA transparency
    .toColorspace('srgb') // Normalize to sRGB
    .grayscale() // Convert to grayscale
    .normalize() // Enhance contrast
    .resize({ width, height, fit: 'fill' }) // Force exact size
    .threshold(128) // Balanced threshold
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: imgWidth, height: imgHeight, channels } = info;
  if (imgWidth !== width || imgHeight !== height) {
    throw new Error(`Image size mismatch: expected ${width}x${height}, got ${imgWidth}x${imgHeight}`);
  }
  if (channels !== 1) {
    throw new Error(`Expected 1 channel (grayscale), got ${channels}`);
  }

  const bytesPerLine = width / 8;
  const raster = Buffer.alloc(bytesPerLine * height);

  for (let y = 0; y < height; y++) {
    for (let xByte = 0; xByte < bytesPerLine; xByte++) {
      let byte = 0x00;
      for (let bit = 0; bit < 8; bit++) {
        const x = xByte * 8 + bit;
        if (x >= width) continue;
        const pixel = data[y * width + x];
        if (pixel < 128) byte |= 0x80 >> bit; // Black for darker pixels
      }
      raster[y * bytesPerLine + xByte] = byte;
    }
  }

  return { width, height, data: raster };
}

module.exports = { convertImageToRasterData };
