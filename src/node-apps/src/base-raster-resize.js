const Jimp = require("jimp");
const {
  getImageESCPosCommands,
  getBase64BufferFromFile,
  saveFile,
  addLineBreaks,
  addCutCommand,
  logImageStats,
} = require("./shared-functions");

// Function: Get Jimp Image
async function getJimpImage(base64Buffer) {
  return Jimp.read(base64Buffer);
}

async function processImage(jimpImage, resizeWidth) {
  if (resizeWidth > 0) {
    jimpImage.resize(resizeWidth, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR);
  }

  return jimpImage;
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

// Main function
(async function () {
  const targetWidth = 350;
  const base64Path = "images/signature/big-sig.b64";
  const base64Buffer = await getBase64BufferFromFile(base64Path);

  // Load the Jimp image
  const jimpImage = await getJimpImage(base64Buffer);

  logImageStats(
    "BEFORE",
    jimpImage.bitmap.width,
    jimpImage.bitmap.height,
    base64Buffer.length,
    9600
  );

  // Process the image (resize it if needed)
  const image = await processImage(jimpImage, targetWidth); // Set the targetWidth to fit or leave as 0

  // Convert Jimp image to ESC/POS data
  const escPosImageData = convertForESCPOSFunction(image);

  // Generate ESC/POS commands
  const escPosCommands = getImageESCPosCommands(
    escPosImageData,
    image.bitmap.width,
    image.bitmap.height
  );

  // Add line breaks and cut commands
  const lineBreaks = addLineBreaks(2);
  const cutCommand = addCutCommand();

  // Combine everything and send it to the printer
  const finalPrintData = Buffer.concat([
    escPosCommands,
    lineBreaks,
    cutCommand,
  ]);

  logImageStats(
    "BEFORE",
    image.bitmap.width,
    image.bitmap.height,
    finalPrintData.length,
    9600
  );

  process.stdout.write(finalPrintData); // Send to printer
})();
