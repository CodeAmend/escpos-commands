const sharp = require("sharp");
const bmp = require("bmp-js");
const {
  getBase64BufferFromFile,
  saveFile,
  addLineBreaks,
  addCutCommand,
} = require("./shared-functions");

// Function: Decode BMP using bmp-js and pass the raw image to Sharp
function decodeBMPToSharp(bmpBuffer) {
  const bmpData = bmp.decode(bmpBuffer); // Decode BMP
  console.error("BMP decoded successfully");

  // Use Sharp to handle the raw image data
  return sharp(Buffer.from(bmpData.data), {
    raw: {
      width: bmpData.width,
      height: bmpData.height,
      channels: 4, // RGBA channels
    },
  });
}

// Function: Process and resize image using Sharp
async function processImage(sharpImage, resizeWidth) {
  const resizeMethod = sharp.kernel.nearest;

  if (resizeWidth > 0) {
    sharpImage = sharpImage.resize({
      width: resizeWidth,
      kernel: resizeMethod,
    }); // Resize image to target width
  }

  // Convert to grayscale and return raw format for ESC/POS conversion
  return sharpImage
    .threshold(128) // Apply threshold to make it black and white (monochrome)
    .raw() // Get raw image data for custom processing
    .toBuffer({ resolveWithObject: true });
}

// Function: Convert Sharp image to ESC/POS binary data
function convertForESCPOSFunction(imageData, info) {
  const widthBytes = Math.ceil(info.width / 8); // Calculate width in bytes
  let escPosData = [];

  for (let y = 0; y < info.height; y++) {
    let rowBytes = [];
    for (let x = 0; x < info.width; x += 8) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        if (x + bit < info.width) {
          const pixelIndex = (y * info.width + x + bit) * info.channels;
          const pixelValue = imageData[pixelIndex]; // Get the grayscale value
          if (pixelValue <= 128) byte |= 1 << (7 - bit); // Set bit if dark
        }
      }
      rowBytes.push(byte);
    }
    escPosData.push(Buffer.from(rowBytes));
  }

  return Buffer.concat(escPosData);
}

// Function: Generate ESC/POS commands for printing the image
function getImageESCPosCommands(imageBytes, width, height) {
  const density = 0x00; // Single density mode
  const widthBytes = Math.ceil(width / 8); // Width in bytes (1 byte = 8 pixels)

  // ESC/POS command to set double-width and double-height mode
  const setDoubleSizeCommand = Buffer.from([0x1d, 0x21, 0x30]); // GS ! n (n=0x30 means double-width and double-height)

  // ESC/POS header for raster graphics printing
  const escPosHeader = Buffer.from([
    0x1d,
    0x76,
    0x30,
    density, // Density for single-density raster graphics
    widthBytes % 256, // Width low byte
    Math.floor(widthBytes / 256), // Width high byte
    height % 256, // Height low byte
    Math.floor(height / 256), // Height high byte
  ]);

  // ESC/POS command to reset to normal size after printing
  //const resetSizeCommand = Buffer.from([0x1d, 0x21, 0x00]); // GS ! n (n=0x00 means normal size)

  // Combine the commands: Set double-size mode, print image, then reset the size
  return Buffer.concat([
    setDoubleSizeCommand,
    escPosHeader,
    imageBytes,
    //resetSizeCommand,
  ]);
}

// Main function
(async function () {
  const targetWidth = 400;
  const base64Path = "images/signature/big-sig.b64";
  const base64Buffer = await getBase64BufferFromFile(base64Path);

  // Step 1: Decode BMP to Sharp-compatible image
  const sharpImage = decodeBMPToSharp(base64Buffer);

  // Log image size before resize
  console.error("ESC/POS data size - BEFORE resize: ");
  console.error(`${(base64Buffer.length / 1024).toFixed(2)} kbytes`);

  // Step 2: Process the image (resize it if needed)
  const { data: imageData, info } = await processImage(sharpImage, targetWidth);

  // Step 3: Convert Sharp image to ESC/POS data
  const escPosImageData = convertForESCPOSFunction(imageData, info);

  // Step 4: Generate ESC/POS commands
  const escPosCommands = getImageESCPosCommands(
    escPosImageData,
    info.width,
    info.height
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

  // Log the final image size after resize
  console.error("ESC/POS data size - AFTER  resize: ");
  console.error(`${(finalPrintData.length / 1024).toFixed(2)} kbytes`);
  console.error(`w x h: ${info.width}x${info.height}`);
  console.error("\n");

  // Output to stdout (for piping to printer)
  process.stdout.write(finalPrintData);
})();
