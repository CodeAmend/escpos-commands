const sharp = require("sharp");
const bmpjs = require("bmp-js");
const {
  getBase64BufferFromFile,
  logImageStats,
  saveFile,
  createRasterBitImageCommands,
  getImageESCPosCommands,
} = require("./shared-functions"); // Assuming the shared functions are in this file

async function loadAndDecodeBMP(base64Path) {
  const base64Buffer = await getBase64BufferFromFile(base64Path);
  console.error(
    "First 100 characters of base64 data:",
    base64Buffer.toString("utf8").substring(0, 100)
  );
  const bmpData = bmpjs.decode(base64Buffer);
  console.error(`Original dimensions: ${bmpData.width}x${bmpData.height}`);
  return { bmpData, base64Buffer };
}

async function processImageWithSharp(bmpData, targetWidth) {
  let sharpImage = sharp(bmpData.data, {
    raw: { width: bmpData.width, height: bmpData.height, channels: 4 },
  });

  if (bmpData.width > targetWidth) {
    const aspectRatio = bmpData.height / bmpData.width;
    const newHeight = Math.round(targetWidth * aspectRatio);
    sharpImage = sharpImage.resize(targetWidth, newHeight, {
      kernel: sharp.kernel.lanczos3,
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    });
  }

  sharpImage = sharpImage.grayscale().normalize().threshold(200);

  const { data: processedImageBuffer, info } = await sharpImage
    .raw()
    .toBuffer({ resolveWithObject: true });
  await sharpImage.png().toFile("output/debug_sharp_processed.png");
  console.error(`Processed dimensions: ${info.width}x${info.height}`);

  return { processedImageBuffer, info };
}

function createESCPOSCommands(imageBuffer, width, height) {
  const commands = [];
  const bytesPerLine = Math.ceil(width / 8);

  // ESC @ - Initialize printer
  commands.push(Buffer.from([0x1b, 0x40]));

  // GS v 0 - Set raster bit image mode
  commands.push(Buffer.from([0x1d, 0x76, 0x30, 0x00]));

  // Set image dimensions
  commands.push(
    Buffer.from([
      bytesPerLine & 0xff,
      (bytesPerLine >> 8) & 0xff,
      height & 0xff,
      (height >> 8) & 0xff,
    ])
  );

  // Process image data
  for (let y = 0; y < height; y++) {
    const lineBuffer = Buffer.alloc(bytesPerLine);
    for (let x = 0; x < width; x++) {
      const pixelIndex = y * width + x;
      if (imageBuffer[pixelIndex] === 0) {
        // Black pixel
        const byteIndex = Math.floor(x / 8);
        const bitIndex = 7 - (x % 8);
        lineBuffer[byteIndex] |= 1 << bitIndex;
      }
    }
    commands.push(lineBuffer);
  }

  return Buffer.concat(commands);
}

function addLineBreaks(count) {
  return Buffer.from(Array(count).fill(0x0a));
}

function addCutCommand() {
  return Buffer.from([0x1d, 0x56, 0x41, 0x00]); // Full cut
}

async function main() {
  const targetWidth = 400;
  const base64Path = "images/signature/big-sig.b64";
  const baudRate = 9600;

  try {
    const { bmpData, base64Buffer } = await loadAndDecodeBMP(base64Path);
    logImageStats(
      "BEFORE",
      bmpData.width,
      bmpData.height,
      base64Buffer.length,
      baudRate
    );

    const { processedImageBuffer, info } = await processImageWithSharp(
      bmpData,
      targetWidth
    );

    const imageDataForEscPos = getImageESCPosCommands(
      processedImageBuffer,
      info.width,
      info.height
    );

    const escPosCommands = createRasterBitImageCommands(
      imageDataForEscPos,
      info.width,
      info.height
    );

    //const escPosCommands = createESCPOSCommands(
    //  processedImageBuffer,
    //  info.width,
    //  info.height
    //);

    saveFile("output/debug_escpos_commands.bin", escPosCommands);

    const lineBreaks = addLineBreaks(3);
    const cutCommand = addCutCommand();

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
      baudRate
    );

    process.stdout.write(finalPrintData);
  } catch (error) {
    console.error("Error processing signature:", error);
    process.exit(1);
  }
}

main();
