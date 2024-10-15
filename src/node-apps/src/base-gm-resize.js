const gm = require("gm").subClass({ imageMagick: true });
const {
  getBase64BufferFromFile,
  saveFile,
  addLineBreaks,
  addCutCommand,
} = require("./shared-functions");

// Function: Load GM Image
async function loadGMImage(base64Buffer) {
  return new Promise((resolve, reject) => {
    gm(base64Buffer, "image.bmp").toBuffer((err, buffer) => {
      if (err) {
        console.error("Error loading image with gm:", err);
        return reject(err);
      }
      console.error("GM image loaded successfully.");
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
        console.error("GM image resized and converted to PNG successfully.");
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
      console.error("Image identified successfully.");
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

  console.error("ESC/POS data generated successfully.");
  return Buffer.concat(escPosData);
}

// Function: Generate ESC/POS commands for printing the image
function getImageESCPosCommands(imageBytes, width, height) {
  const density = 0x00;
  const widthBytes = Math.ceil(width / 8);

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

  console.error("ESC/POS header generated.");
  return Buffer.concat([escPosHeader, imageBytes]);
}
// Main function
(async function () {
  const targetWidth = 800;
  const base64Path = "images/signature/big-sig.b64";
  const base64Buffer = await getBase64BufferFromFile(base64Path);

  console.error("Base64 data size - BEFORE processing: ");
  console.error(`${(base64Buffer.length / 1024).toFixed(2)} kbytes`);

  try {
    // Step 1: Load the GM image
    const gmImageBuffer = await loadGMImage(base64Buffer);

    // Step 2: Process (resize) the image
    const processedImageBuffer = await processGMImage(
      gmImageBuffer,
      targetWidth
    );
    saveFile("output/resized-signature.png", processedImageBuffer); // Save resized PNG for inspection

    // Step 3: Identify the resized image dimensions
    const imageInfo = await identifyGMImage(processedImageBuffer);
    const width = imageInfo.size.width;
    const height = imageInfo.size.height;
    const channels = imageInfo.depth === 8 ? 3 : 4;

    console.error(`Resized image dimensions: ${width}x${height}`);
    console.error(
      `Resized image buffer size: ${(
        processedImageBuffer.length / 1024
      ).toFixed(2)} kbytes`
    );
    console.error(
      "Final image size (w * h * channels): ",
      ((width * height * channels) / 1024).toFixed(2),
      "kbytes"
    );

    // Step 4: Convert the resized image to ESC/POS binary data
    const escPosImageData = convertForESCPOSFunction(
      processedImageBuffer,
      width,
      height
    );

    console.error(
      `Length of resized image data for ESC/POS: ${(
        escPosImageData.length / 1024
      ).toFixed(2)} kbytes`
    );

    // Step 5: Generate ESC/POS commands
    const escPosCommands = getImageESCPosCommands(
      escPosImageData,
      width,
      height
    );

    // Step 6: Add line breaks and cut commands
    const lineBreaks = addLineBreaks(2);
    const cutCommand = addCutCommand();

    // Step 7: Combine everything
    const finalPrintData = Buffer.concat([
      escPosCommands,
      lineBreaks,
      cutCommand,
    ]);

    console.error("Final ESC/POS data size: ");
    console.error(`${(finalPrintData.length / 1024).toFixed(2)} kbytes`);

    // Step 8: Save the final data (optional) and send to the printer
    const fs = require("fs");
    fs.writeFileSync("output/final-print-data.bin", finalPrintData);
    console.error("Final ESC/POS data saved to 'output/final-print-data.bin'");

    process.stdout.write(finalPrintData); // Send to printer
  } catch (err) {
    console.error("Error in image processing:", err);
  }
})();
