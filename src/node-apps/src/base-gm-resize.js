const gm = require("gm").subClass({ imageMagick: true });
const {
  getImageESCPosCommands,
  getBase64BufferFromFile,
  saveFile,
  addLineBreaks,
  addCutCommand,
  logImageStats,
} = require("./shared-functions");

// Function: Load GM Image
async function loadGMImage(base64Buffer) {
  return new Promise((resolve, reject) => {
    gm(base64Buffer, "image.bmp").toBuffer((err, buffer) => {
      if (err) {
        console.error("Error loading image with gm:", err);
        return reject(err);
      }
      resolve(buffer);
    });
  });
}

// Function: Process GM Image (Resize and Convert to PNG)
async function processGMImage(buffer, resizeWidth) {
  return new Promise((resolve, reject) => {
    gm(buffer)
      .resize(resizeWidth, null)
      .toBuffer("PNG", (err, processedBuffer) => {
        if (err) {
          console.error("Error processing image with gm:", err);
          return reject(err);
        }
        resolve(processedBuffer);
      });
  });
}

// Function: Identify GM Image Dimensions
async function identifyGMImage(gmImageBuffer) {
  return new Promise((resolve, reject) => {
    gm(gmImageBuffer).identify((err, imageInfo) => {
      if (err) {
        console.error("Error identifying image with gm:", err);
        return reject(err);
      }
      resolve(imageInfo);
    });
  });
}

// Function: Convert PNG to ESC/POS binary data
function convertForESCPOSFunction(imageData, width, height) {
  const widthBytes = Math.ceil(width / 8);

  let escPosData = [];
  for (let y = 0; y < height; y++) {
    let rowBytes = [];
    for (let x = 0; x < width; x += 8) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        if (x + bit < width) {
          const pixelIndex = (y * width + x + bit) * 4; // Assuming RGBA
          const r = imageData[pixelIndex];
          const g = imageData[pixelIndex + 1];
          const b = imageData[pixelIndex + 2];
          const grayscale = 0.3 * r + 0.59 * g + 0.11 * b;

          if (grayscale <= 128) {
            byte |= 1 << (7 - bit); // Set bit for black pixels
          }
        }
      }
      rowBytes.push(byte);
    }
    escPosData.push(Buffer.from(rowBytes));
  }

  return Buffer.concat(escPosData);
}

// Function: Generate ESC/POS commands for printing the image
(async function () {
  const targetWidth = 350;
  const base64Path = "images/signature/big-sig.b64";
  const base64Buffer = await getBase64BufferFromFile(base64Path);

  try {
    // Step 1: Load the GM image
    const gmImageBuffer = await loadGMImage(base64Buffer);

    // Step 2: Identify original image dimensions
    const originalImageInfo = await identifyGMImage(gmImageBuffer);
    const originalWidth = originalImageInfo.size.width;
    const originalHeight = originalImageInfo.size.height;

    logImageStats(
      "BEFORE", // Stage before resizing
      originalWidth,
      originalHeight,
      gmImageBuffer.length,
      9600 // Baud rate
    );

    const processedImageBuffer = await processGMImage(
      gmImageBuffer,
      targetWidth
    );

    //saveFile("output/resized-signature.png", processedImageBuffer); // Save resized PNG for inspection

    const imageInfo = await identifyGMImage(processedImageBuffer);
    const width = imageInfo.size.width;
    const height = imageInfo.size.height;

    const escPosImageData = convertForESCPOSFunction(
      processedImageBuffer,
      width,
      height
    );

    const escPosCommands = getImageESCPosCommands(
      escPosImageData,
      width,
      height
    );

    // Step 7: Add line breaks and cut commands
    const lineBreaks = addLineBreaks(2);
    const cutCommand = addCutCommand();

    // Step 8: Combine everything
    const finalPrintData = Buffer.concat([
      escPosCommands,
      lineBreaks,
      cutCommand,
    ]);

    logImageStats(
      "AFTER",
      width,
      height,
      finalPrintData.length,
      9600 // Baud rate
    );

    //fs.writeFileSync("output/final-print-data.bin", finalPrintData);
    //console.error("Final ESC/POS data saved to 'output/final-print-data.bin'");

    process.stdout.write(finalPrintData); // Send to printer
  } catch (err) {
    console.error("Error in image processing:", err);
  }
})();
