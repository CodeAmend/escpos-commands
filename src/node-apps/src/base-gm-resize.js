const gm = require("gm").subClass({ imageMagick: true });
const {
  getBase64BufferFromFile,
  saveFile,
  addLineBreaks,
  addCutCommand,
} = require("./shared-functions");

// Function: Get GM Image and convert it to PNG
async function getGMImage(base64Buffer, resizeWidth) {
  return new Promise((resolve, reject) => {
    gm(base64Buffer, "image.bmp")
      .resize(resizeWidth, null)
      .toBuffer("PNG", (err, buffer) => {
        if (err) {
          console.error("Error processing image with gm:", err);
          return reject(err);
        }
        console.error("GM image resized and converted to PNG successfully.");
        resolve(buffer);
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
  const targetWidth = 350;
  const base64Path = "images/signature/big-sig.b64";
  const base64Buffer = await getBase64BufferFromFile(base64Path);

  console.error("ESC/POS data size - BEFORE resize: ");
  console.error(`${(base64Buffer.length / 1024).toFixed(2)} kbytes`);

  try {
    // Step 1: Process GM image and resize
    const gmImageBuffer = await getGMImage(base64Buffer, targetWidth);
    saveFile("output/resized-signature.png", gmImageBuffer); // Save resized PNG for inspection

    // Step 2: Identify the image dimensions using gm
    gm(gmImageBuffer).identify((err, imageInfo) => {
      if (err) {
        console.error("Error identifying image with gm:", err);
        throw err;
      }

      const width = imageInfo.size.width;
      const height = imageInfo.size.height;

      console.error(`Image dimensions: ${width}x${height}`);

      // Step 3: Convert the GM image buffer to ESC/POS data
      const escPosImageData = convertForESCPOSFunction(
        gmImageBuffer,
        width,
        height
      );

      // Step 4: Generate ESC/POS commands
      const escPosCommands = getImageESCPosCommands(
        escPosImageData,
        width,
        height
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

      console.error("ESC/POS data size - AFTER resize: ");
      console.error(`${(finalPrintData.length / 1024).toFixed(2)} kbytes`);

      process.stdout.write(finalPrintData); // Send to printer
    });
  } catch (err) {
    console.error("Error in image processing:", err);
  }
})();
