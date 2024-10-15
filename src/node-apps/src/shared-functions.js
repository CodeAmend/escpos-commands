const fs = require("fs");
const util = require("util");
const bmp = require("bmp-js");

// Shared Function: To read base64-encoded image and return raw buffer
async function getBase64BufferFromFile(filePath) {
  const readFile = util.promisify(fs.readFile);
  const data = await readFile(filePath, "utf8");
  const base64Data = data.replace(/^data:image\/bmp;base64,/, ""); // Remove base64 prefix if it exists
  return Buffer.from(base64Data, "base64"); // Return raw binary buffer
}

// Shared Function: To decode BMP using bmp-js
function decodeBMP(bmpBuffer) {
  try {
    const bmpData = bmp.decode(bmpBuffer);
    console.error("BMP Decoded successfully");
    return bmpData;
  } catch (error) {
    console.error("Error decoding BMP:", error);
    throw error;
  }
}

// Shared Function: Save file
function saveFile(filename, data) {
  fs.writeFileSync(filename, data);
  console.error(`Saved file: ${filename}`);
}

// Function to resize SVG (kept in shared since both approaches need resizing)
function resizeSVG(svgData, targetWidth) {
  const svgString = svgData.toString();
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
  let newSvgString;

  if (viewBoxMatch) {
    const viewBoxValues = viewBoxMatch[1].split(" ");
    const originalWidth = parseFloat(viewBoxValues[2]);
    const originalHeight = parseFloat(viewBoxValues[3]);
    const aspectRatio = originalHeight / originalWidth;
    const targetHeight = targetWidth * aspectRatio;

    newSvgString = svgString
      .replace(/(width="[^"]*")/, `width="${targetWidth}"`)
      .replace(/(height="[^"]*")/, `height="${targetHeight}"`);
  } else {
    throw new Error("SVG missing viewBox attribute");
  }

  return newSvgString;
}

// Function to add line breaks
function addLineBreaks(numLines) {
  let lineBreaks = "";
  for (let i = 0; i < numLines; i++) {
    lineBreaks += "\n";
  }
  return Buffer.from(lineBreaks);
}

// Function to add a cut command
function addCutCommand() {
  return Buffer.from([0x1d, 0x56, 0x42, 0x00]); // Partial cut command
}

// Function: Generate ESC/POS commands for printing the image
// Uses the ESC * command (1B 2A)
function getImageESCPosCommands(imageBytes, width, height) {
  const density = 0x00; // Single density mode
  const widthBytes = Math.ceil(width / 8); // Width in bytes (1 byte = 8 pixels)

  // ESC/POS command to set double-width and double-height mode
  const setDoubleSizeCommand = Buffer.from([0x1d, 0x21, 0x30]); // GS ! n (n=0x30 means double-width and double-height)

  // ESC/POS header for raster graphics printing
  const escPosHeader = Buffer.from([
    0x1d,
    0x76,
    0x30,
    density, // Density for single-density raster graphics
    widthBytes % 256, // Width low byte
    Math.floor(widthBytes / 256), // Width high byte
    height % 256, // Height low byte
    Math.floor(height / 256), // Height high byte
  ]);

  // Combine the commands: Set double-size mode, print image, then reset the size
  return Buffer.concat([setDoubleSizeCommand, escPosHeader, imageBytes]);
}

// Uses the GS v 0 command (1D 76 30 00)
function createRasterBitImageCommands(imageBuffer, width, height) {
  const commands = [];
  const bytesPerLine = Math.ceil(width / 8);

  // ESC @ - Initialize printer
  commands.push(Buffer.from([0x1b, 0x40]));

  // GS v 0 - Set raster bit image mode
  commands.push(Buffer.from([0x1d, 0x76, 0x30, 0x00]));

  // Set image dimensions (little-endian)
  commands.push(
    Buffer.from([
      bytesPerLine & 0xff,
      (bytesPerLine >> 8) & 0xff,
      height & 0xff,
      (height >> 8) & 0xff,
    ])
  );

  // Process image data
  for (let y = 0; y < height; y++) {
    const lineBuffer = Buffer.alloc(bytesPerLine);
    for (let x = 0; x < width; x++) {
      const pixelIndex = y * width + x;
      if (imageBuffer[pixelIndex] === 0) {
        // Black pixel
        const byteIndex = Math.floor(x / 8);
        const bitIndex = 7 - (x % 8);
        lineBuffer[byteIndex] |= 1 << bitIndex;
      }
    }
    commands.push(lineBuffer);
  }

  return Buffer.concat(commands);
}

function createGraphicsModeCommands(imageData, width, height, channels = 4) {
  console.error(
    `Debug: Image dimensions: ${width}x${height}, Channels: ${channels}`
  );

  let escPosData = [];
  let blackPixelCount = 0;
  let whitePixelCount = 0;

  for (let y = 0; y < height; y++) {
    let rowBytes = [];
    for (let x = 0; x < width; x += 8) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        if (x + bit < width) {
          const pixelIndex = (y * width + x + bit) * channels;
          let pixelValue;

          if (channels === 1) {
            pixelValue = imageData[pixelIndex];
          } else {
            const r = imageData[pixelIndex];
            const g = imageData[pixelIndex + 1];
            const b = imageData[pixelIndex + 2];
            const alpha = channels === 4 ? imageData[pixelIndex + 3] : 255;

            // Calculate grayscale value
            pixelValue = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

            // If pixel is transparent, treat it as white
            if (alpha < 128) {
              pixelValue = 255;
            }
          }

          if (pixelValue <= 128) {
            byte |= 1 << (7 - bit);
            blackPixelCount++;
          } else {
            whitePixelCount++;
          }
        }
      }
      rowBytes.push(byte);
    }
    escPosData.push(Buffer.from(rowBytes));
  }

  console.error(
    `Debug: Black pixels: ${blackPixelCount}, White pixels: ${whitePixelCount}`
  );
  return Buffer.concat(escPosData);
}

const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
};

// Logger function with stage (before/after)
function logImageStats(stage, width, height, dataLength, baudRate) {
  console.error("");
  console.error(`${colors.cyan}${stage}${colors.reset} resize:`);
  console.error(
    `Dimensions: ${colors.yellow}${width}x${height}${colors.reset}`
  );
  console.error(
    `Bytes: ${colors.magenta}${(dataLength / 1024).toFixed(2)}kb${
      colors.reset
    }\n`
  );

  // Calculate time to print over the given baud rate
  const totalBits = dataLength * 10; // 10 bits per byte (8 data bits + 1 start bit + 1 stop bit)
  const timeToPrintInSeconds = totalBits / baudRate;

  console.error(
    `Time to print at ${baudRate} baud: ${
      colors.magenta
    }${timeToPrintInSeconds.toFixed(2)} seconds${colors.reset}`
  );
  console.error();
}

// Export shared functions
module.exports = {
  createGraphicsModeCommands,
  createRasterBitImageCommands,
  getImageESCPosCommands,
  getBase64BufferFromFile,
  decodeBMP,
  saveFile,
  resizeSVG,
  addLineBreaks,
  addCutCommand,
  logImageStats,
};
