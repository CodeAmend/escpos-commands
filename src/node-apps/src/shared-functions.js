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

const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
};

// Logger function with stage (before/after)
function logImageStats(stage, width, height, dataLength, baudRate) {
  console.log("");
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
  console.log();
}

// Export shared functions
module.exports = {
  getImageESCPosCommands,
  getBase64BufferFromFile,
  decodeBMP,
  saveFile,
  resizeSVG,
  addLineBreaks,
  addCutCommand,
  logImageStats,
};
