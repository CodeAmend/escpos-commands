const sharp = require("sharp");
const potrace = require("potrace");
const {
  getImageESCPosCommands,
  getBase64BufferFromFile,
  decodeBMP,
  //saveFile,
  resizeSVG,
  addLineBreaks,
  addCutCommand,
  logImageStats,
} = require("./shared-functions");

// Function: Convert BMP to PNG using sharp
async function convertBMPToPNG(bmpData) {
  const rawImageData = Buffer.from(bmpData.data);
  const pngBuffer = await sharp(rawImageData, {
    raw: {
      width: bmpData.width,
      height: bmpData.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
  return pngBuffer;
}

// Function: Convert PNG to SVG using Potrace
function convertPNGToSVG(pngBuffer) {
  return new Promise((resolve, reject) => {
    potrace.trace(pngBuffer, { threshold: 230 }, (err, svg) => {
      if (err) return reject("Error during PNG to SVG conversion: " + err);
      resolve(svg);
    });
  });
}

// Function: Convert PNG to ESC/POS binary data with manual inversion
async function convertPNGToEscPos(pngBuffer) {
  const png = await sharp(pngBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = png;
  const widthBytes = Math.ceil(info.width / 8);
  let escPosData = [];

  for (let y = 0; y < info.height; y++) {
    let rowBytes = [];
    for (let x = 0; x < info.width; x += 8) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        if (x + bit < info.width) {
          const pixelIndex = (y * info.width + (x + bit)) * info.channels;

          const r = data[pixelIndex]; // Red channel
          const g = data[pixelIndex + 1]; // Green channel
          const b = data[pixelIndex + 2]; // Blue channel
          const alpha = info.channels === 4 ? data[pixelIndex + 3] : 255; // Alpha channel (or 255 if no alpha)

          const grayscale = 0.3 * r + 0.59 * g + 0.11 * b;

          if (grayscale <= 128 && alpha > 128) {
            // Treat as white (bit remains 0)
          } else {
            // Treat as black (set the bit)
            byte |= 1 << (7 - bit);
          }
        }
      }
      rowBytes.push(byte);
    }
    escPosData.push(Buffer.from(rowBytes));
  }

  return Buffer.concat(escPosData);
}

// Main Sharp processing
(async function () {
  const base64Path = "images/signature/big-sig.b64";
  const base64Buffer = await getBase64BufferFromFile(base64Path);

  // Decode BMP and convert to PNG
  const bmpData = decodeBMP(base64Buffer);
  const pngBuffer = await convertBMPToPNG(bmpData);

  logImageStats(
    "BEFORE",
    bmpData.width,
    bmpData.height,
    pngBuffer.length,
    9600
  );

  // Convert PNG to SVG
  const svgData = await convertPNGToSVG(pngBuffer);

  // Resize the SVG
  const resizedSVG = resizeSVG(svgData, 200);

  // Convert the resized SVG back to PNG for ESC/POS conversion
  const resizedPNGBuffer = await sharp(Buffer.from(resizedSVG))
    .png()
    .toBuffer();

  // Extract dimensions of the resized PNG using sharp
  const resizedPNGInfo = await sharp(resizedPNGBuffer).metadata();

  // saveFile("output/resized-final.png", resizedPNGBuffer);

  // Convert resized PNG to ESC/POS data
  const escPosData = await convertPNGToEscPos(resizedPNGBuffer);

  // Generate ESC/POS commands
  const escPosCommands = getImageESCPosCommands(escPosData, 200, 200);

  const lineBreaks = addLineBreaks(2);
  const cutCommand = addCutCommand();
  const finalPrintData = Buffer.concat([
    escPosCommands,
    lineBreaks,
    cutCommand,
  ]);

  logImageStats(
    "AFTER",
    resizedPNGInfo.width,
    resizedPNGInfo.height,
    finalPrintData.length,
    9600
  );

  // Output the ESC/POS data for printing
  process.stdout.write(finalPrintData);
})();
