const fs = require("fs");
const util = require("util");
const Jimp = require("jimp");

// Function to read base64-encoded image and return raw buffer
async function getBase64BufferFromFile(filePath) {
  const readFile = util.promisify(fs.readFile);
  const data = await readFile(filePath, "utf8");
  const base64Data = data.replace(/^data:image\/bmp;base64,/, ""); // Remove base64 prefix if it exists
  return Buffer.from(base64Data, "base64"); // Return raw binary buffer
}

// Function to process and resize the image
async function getJimpImage(base64Buffer) {
  const image = await Jimp.read(base64Buffer);
  return image;
}

async function processImage(jimpImage, resizeWidth) {
  // Only resize if a resize width is specified
  if (resizeWidth > 0) {
    jimpImage.resize(resizeWidth, Jimp.AUTO, Jimp.RESIZE_BICUBIC);
  }

  return jimpImage; // Return the Jimp image object
}

// Function to convert processed image to raw image data for ESC/POS
function convertForESCPOSFunction(image) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  let imageData = [];

  // Convert image to monochrome (1-bit) raster format row by row
  for (let y = 0; y < height; y++) {
    let rowBytes = [];
    for (let x = 0; x < width; x += 8) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        if (x + bit < width) {
          const color = image.getPixelColor(x + bit, y);
          const rgba = Jimp.intToRGBA(color);
          const grayscale = 0.3 * rgba.r + 0.59 * rgba.g + 0.11 * rgba.b;
          if (grayscale < 128) {
            byte |= 1 << (7 - bit); // Set the bit for dark pixels
          }
        }
      }
      rowBytes.push(byte);
    }
    imageData.push(Buffer.from(rowBytes));
  }

  return Buffer.concat(imageData); // Return the raw image data as a single buffer
}

// Function to generate ESC/POS commands for printing the image
function getImageESCPosCommands(imageBytes, width, height) {
  const density = 0x00; // Single density mode
  const widthBytes = Math.ceil(width / 8); // Width in bytes (1 byte = 8 pixels)

  // ESC/POS header for raster graphics printing
  const escPosHeader = Buffer.from([
    0x1d,
    0x76,
    0x30,
    density, // Command for raster graphics
    widthBytes % 256, // Width low byte
    widthBytes / 256, // Width high byte
    height % 256, // Height low byte
    height / 256, // Height high byte
  ]);

  // Combine the ESC/POS header and the image data
  return Buffer.concat([escPosHeader, imageBytes]);
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
  // ESC/POS cut command: 0x1D 0x56 0x42 0x00
  return Buffer.from([0x1d, 0x56, 0x42, 0x00]); // Partial cut
}

// Test the function
(async function test() {
  const base64Path = "../images/signature/big-sig.b64"; // Adjust the path to your image
  const targetWidth = 512; // Set to 512 for receipt printers or 0 to keep the original size

  // Step 1: Get the base64 buffer from the file
  const base64Buffer = await getBase64BufferFromFile(base64Path);

  // Step 2: Get library image
  const jimpImage = await getJimpImage(base64Buffer); // Set the targetWidth to fit or leave as 0

  console.error("ESC/POS data size - BEFORE resize: ");
  console.error(`${(base64Buffer.length / 1024).toFixed(2)} kbytes`);
  console.error(`w x h: ${jimpImage.bitmap.width}x${jimpImage.bitmap.height}`);
  console.error("\n");

  // Step 3: Process the image (resize it if needed)
  const image = await processImage(jimpImage, targetWidth); // Set the targetWidth to fit or leave as 0

  // Step 4: Convert the processed image to ESC/POS-compatible data
  const escposImageData = convertForESCPOSFunction(image);

  // Step 5: Output the ESC/POS data to stdout
  const escposImageCommands = getImageESCPosCommands(
    escposImageData,
    image.bitmap.width,
    image.bitmap.height
  );

  // Step 6: Add line breaks and cut command after the image data
  const lineBreaks = addLineBreaks(2); // Add 5 line breaks
  const cutCommand = addCutCommand(); // Add cut command

  // Step 7: Combine the image commands, line breaks, and cut command
  const finalPrintData = Buffer.concat([
    escposImageCommands,
    lineBreaks,
    cutCommand,
  ]);

  console.error("ESC/POS data size - AFTER  resize: ");
  console.error(`${(finalPrintData.length / 1024).toFixed(2)} kbytes`);
  console.error(`w x h: ${image.bitmap.width}x${image.bitmap.height}`);
  console.error("\n");

  process.stdout.write(finalPrintData);
})();
