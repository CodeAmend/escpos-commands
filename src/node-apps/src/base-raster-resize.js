const Jimp = require("jimp");
const {
  convertForESCPOSFunction,
  getImageESCPosCommands,
  getBase64BufferFromFile,
  addLineBreaks,
  addCutCommand,
  logImageStats,
  //saveFile,
} = require("./shared-functions");

// Function: Get Jimp Image
async function getJimpImage(base64Buffer) {
  return Jimp.read(base64Buffer);
}

async function processImage(jimpImage, resizeWidth) {
  if (resizeWidth > 0) {
    jimpImage.resize(resizeWidth, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR);
  }

  jimpImage.grayscale().contrast(1);

  return jimpImage;
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

  const processedImage = await processImage(jimpImage, targetWidth);
  const {
    bitmap: { data: bData, width: bWidth, height: bHeight },
  } = processedImage;
  console.error("Debug: Processed image dimensions:", bWidth, "x", bHeight);

  // Convert Jimp image to ESC/POS data
  const escPosImageData = convertForESCPOSFunction(bData, bWidth, bHeight, 4);

  // Generate ESC/POS commands
  const escPosCommands = getImageESCPosCommands(
    escPosImageData,
    bWidth,
    bHeight
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

  logImageStats("BEFORE", bWidth, bHeight, finalPrintData.length, 9600);

  process.stdout.write(finalPrintData); // Send to printer
})();
