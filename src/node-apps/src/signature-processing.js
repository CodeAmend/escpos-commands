const sharp = require("sharp");
const bmpjs = require("bmp-js");
const {
  getBase64BufferFromFile,
  logImageStats,
  saveFile,
  createRasterBitImageCommands,
  addLineBreaks,
  addCutCommand,
} = require("./shared-functions");

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

    const escPosCommands = createRasterBitImageCommands(
      processedImageBuffer,
      info.width,
      info.height
    );

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
