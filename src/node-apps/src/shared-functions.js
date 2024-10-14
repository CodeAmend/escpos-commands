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

// Export shared functions
module.exports = {
  getBase64BufferFromFile,
  decodeBMP,
  saveFile,
  resizeSVG,
  addLineBreaks,
  addCutCommand,
};
