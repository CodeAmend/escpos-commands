// generateBin.js
const { convertImageToRasterBin } = require('./imageProcessor');

// Parse command-line arguments
const args = process.argv.slice(2);
if (args.length !== 4) {
  console.error('Usage: node generateBin.js <inputImagePath> <outputBinPath> <width> <height>');
  console.error('Example: node generateBin.js icon.png images/icon.bin 384 48');
  process.exit(1);
}

const [inputImagePath, outputBinPath, width, height] = args;

// Convert width and height to numbers
const widthNum = parseInt(width, 10);
const heightNum = parseInt(height, 10);

if (isNaN(widthNum) || isNaN(heightNum) || widthNum <= 0 || heightNum <= 0) {
  console.error('Width and height must be positive integers');
  process.exit(1);
}

if (widthNum % 8 !== 0) {
  console.error('Width must be a multiple of 8');
  process.exit(1);
}

(async () => {
  try {
    await convertImageToRasterBin(inputImagePath, outputBinPath, widthNum, heightNum);
    console.log(`Created ${outputBinPath} (${widthNum}x${heightNum})`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
})();
