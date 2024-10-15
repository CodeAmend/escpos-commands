const sharp = require("sharp");
const bmp = require("bmp-js");
const {
  getBase64BufferFromFile,
  saveFile,
  addLineBreaks,
  addCutCommand,
  logImageStats,
  getImageESCPosCommands,
} = require("./shared-functions");

function decodeBMPToSharp(bmpBuffer) {
  const bmpData = bmp.decode(bmpBuffer); // Decode BMP
  console.error("BMP decoded successfully");

  const sharpImage = sharp(Buffer.from(bmpData.data), {
    raw: {
      width: bmpData.width,
      height: bmpData.height,
      channels: 4, // RGBA channels
    },
  });

  return { sharpImage, bmpData };
}

async function processImage(sharpImage, resizeWidth) {
  const resizeMethod = sharp.kernel.nearest;

  if (resizeWidth > 0) {
    sharpImage = sharpImage.resize({
      width: resizeWidth,
      kernel: resizeMethod,
    });
  }

  // Convert to grayscale and return raw format for ESC/POS conversion
  return sharpImage.threshold(128).raw().toBuffer({ resolveWithObject: true });
}

// Function: Convert Sharp image to ESC/POS binary data
function convertForESCPOSFunction(imageData, info) {
  const widthBytes = Math.ceil(info.width / 8);
  let escPosData = [];

  for (let y = 0; y < info.height; y++) {
    let rowBytes = [];
    for (let x = 0; x < info.width; x += 8) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        if (x + bit < info.width) {
          const pixelIndex = (y * info.width + x + bit) * info.channels;
          const pixelValue = imageData[pixelIndex];
          if (pixelValue <= 128) byte |= 1 << (7 - bit);
        }
      }
      rowBytes.push(byte);
    }
    escPosData.push(Buffer.from(rowBytes));
  }

  return Buffer.concat(escPosData);
}

// Main function
(async function () {
  const targetWidth = 400;
  const base64Path = "images/signature/big-sig.b64";
  const base64Buffer = await getBase64BufferFromFile(base64Path);

  // Step 1: Decode BMP to Sharp-compatible image
  const { sharpImage, bmpData } = decodeBMPToSharp(base64Buffer);

  logImageStats(
    "BEFORE",
    bmpData.width,
    bmpData.height,
    base64Buffer.length,
    9600 // Baud rate
  );

  // Process the image (resize it if needed)
  const { data: imageData, info } = await processImage(sharpImage, targetWidth);

  // Convert Sharp image to ESC/POS data
  const escPosImageData = convertForESCPOSFunction(imageData, info);

  // Generate ESC/POS commands
  const escPosCommands = getImageESCPosCommands(
    escPosImageData,
    info.width,
    info.height
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
    "AFTER",
    info.width,
    info.height,
    finalPrintData.length,
    9600 // Baud rate
  );

  // Output to stdout (for piping to printer)
  process.stdout.write(finalPrintData);
})();
