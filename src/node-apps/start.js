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
async function processImage(base64Buffer, resizeWidth) {
  const image = await Jimp.read(base64Buffer);

  if (resizeWidth > 0) {
    image.resize(resizeWidth, Jimp.AUTO); // Resize to target width, maintain aspect ratio
  }

  return image; // Return the Jimp image object
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

// Test the function
(async function test() {
  const resize = 0;
  const base64Path = "../images/signature/big-sig.b64";

  // Step 1: Get the base64 buffer from the file
  const base64Buffer = await getBase64BufferFromFile(base64Path);

  // Step 2: Process the image (resize it if needed)
  const image = await processImage(base64Buffer, undefined || resize); // Resize to 300px width

  // Step 3: Convert the processed image to ESC/POS-compatible data
  const escposData = convertForESCPOSFunction(image);

  // Step 4: Output the ESC/POS data to stdout
  process.stdout.write(escposData);

  console.log(
    `Processed image with dimensions: ${image.bitmap.width}x${image.bitmap.height}`
  );
  console.log(`ESC/POS image data size: ${escposData.length} bytes`);
})();
