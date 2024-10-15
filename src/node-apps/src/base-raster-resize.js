const Jimp = require("jimp");
const {
  getBase64BufferFromFile,
  saveFile,
  addLineBreaks,
  addCutCommand,
} = require("./shared-functions");

// Function: Get Jimp Image
async function getJimpImage(base64Buffer) {
  return Jimp.read(base64Buffer);
}

async function processImage(jimpImage, resizeWidth) {
  // Only resize if a resize width is specified
  if (resizeWidth > 0) {
    jimpImage.resize(resizeWidth, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR);
  }

  return jimpImage; // Return the Jimp image object
}

// Function: Convert Jimp to ESC/POS binary data
function convertForESCPOSFunction(image) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const widthBytes = Math.ceil(width / 8);

  let imageData = [];
  for (let y = 0; y < height; y++) {
    let rowBytes = [];
    for (let x = 0; x < width; x += 8) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        if (x + bit < width) {
          const color = image.getPixelColor(x + bit, y);
          const { r, g, b } = Jimp.intToRGBA(color);
          const grayscale = 0.3 * r + 0.59 * g + 0.11 * b;
          if (grayscale <= 128) byte |= 1 << (7 - bit);
        }
      }
      rowBytes.push(byte);
    }
    imageData.push(Buffer.from(rowBytes));
  }

  return Buffer.concat(imageData);
}

// Function: Generate ESC/POS commands for printing the image
function getImageESCPosCommands(imageBytes, width, height) {
  const density = 0x00;
  const widthBytes = Math.ceil(width / 8);

  // ESC/POS header for raster graphics printing
  const escPosHeader = Buffer.from([
    0x1d,
    0x76,
    0x30,
    density,
    widthBytes % 256,
    Math.floor(widthBytes / 256),
    height % 256,
    Math.floor(height / 256),
  ]);

  // Combine the ESC/POS header and the image data
  return Buffer.concat([escPosHeader, imageBytes]);
}

// Main function
(async function () {
  const targetWidth = 350;
  const base64Path = "images/signature/big-sig.b64";
  const base64Buffer = await getBase64BufferFromFile(base64Path);

  // Step 1: Load the Jimp image
  const jimpImage = await getJimpImage(base64Buffer);

  console.error("BEFORE resize:");
  console.error(`W x H: ${jimpImage.bitmap.width}x${jimpImage.bitmap.height}`);
  console.error(`Bytes: ${(base64Buffer.length / 1024).toFixed(2)}kb\n\n`);

  // Step 2: Process the image (resize it if needed)
  const image = await processImage(jimpImage, targetWidth); // Set the targetWidth to fit or leave as 0

  // Step 3: Convert Jimp image to ESC/POS data
  const escPosImageData = convertForESCPOSFunction(image);

  // Step 4: Generate ESC/POS commands
  const escPosCommands = getImageESCPosCommands(
    escPosImageData,
    image.bitmap.width,
    image.bitmap.height
  );

  // Step 5: Add line breaks and cut commands
  const lineBreaks = addLineBreaks(2);
  const cutCommand = addCutCommand();

  // Step 6: Combine everything and send it to the printer
  const finalPrintData = Buffer.concat([
    escPosCommands,
    lineBreaks,
    cutCommand,
  ]);

  console.error("AFTER resize:");
  console.error(`W x H: ${image.bitmap.width}x${image.bitmap.height}`);
  console.error(`Bytes: ${(finalPrintData.length / 1024).toFixed(2)}kb\n`);
  console.error("Time to print 9600 baud:");
  // Calculate time to print over 9600 baud
  const totalBits = finalPrintData.length * 10; // 10 bits per byte (8 data bits + 1 start bit + 1 stop bit)
  const baudRate = 9600;
  const timeToPrintInSeconds = totalBits / baudRate;

  console.error("Time to print at 9600 baud:");
  console.error(`${timeToPrintInSeconds.toFixed(2)} seconds`);

  process.stdout.write(finalPrintData); // Send to printer
})();
