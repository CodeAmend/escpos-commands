const sharp = require("sharp");
const potrace = require("potrace");
const {
  getBase64BufferFromFile,
  decodeBMP,
  saveFile,
  resizeSVG,
  addLineBreaks,
  addCutCommand,
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

  const density = 0x00; // Single density mode
  const escPosHeader = Buffer.from([
    0x1d,
    0x76,
    0x30,
    density,
    widthBytes % 256,
    Math.floor(widthBytes / 256),
    info.height % 256,
    Math.floor(info.height / 256),
  ]);

  return Buffer.concat([escPosHeader, ...escPosData]);
}

// Main Sharp processing
(async function () {
  const base64Path = "images/signature/big-sig.b64";
  const base64Buffer = await getBase64BufferFromFile(base64Path);

  const bmpData = decodeBMP(base64Buffer);
  const pngBuffer = await convertBMPToPNG(bmpData);
  saveFile("output/preprocessed-signature.png", pngBuffer);

  const svgData = await convertPNGToSVG(pngBuffer);
  saveFile("output/signature-output.svg", svgData);

  const resizedSVG = resizeSVG(svgData, 200);
  saveFile("output/resized-signature.svg", resizedSVG);

  const resizedPNGBuffer = await sharp(Buffer.from(resizedSVG))
    .png()
    .toBuffer();
  saveFile("output/resized-final.png", resizedPNGBuffer);

  const escPosData = await convertPNGToEscPos(resizedPNGBuffer);

  // Add line breaks and cut commands
  const lineBreaks = addLineBreaks(2);
  const cutCommand = addCutCommand();
  const finalPrintData = Buffer.concat([escPosData, lineBreaks, cutCommand]);

  // Output the ESC/POS data for printing
  process.stdout.write(finalPrintData);
})();
