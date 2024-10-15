const sharp = require("sharp");
const potrace = require("potrace");
const {
  getImageESCPosCommands,
  getBase64BufferFromFile,
  decodeBMP,
  resizeSVG,
  addLineBreaks,
  addCutCommand,
  logImageStats,
  convertForESCPOSFunction, // Import the shared function
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

  console.error("Debug: Resized PNG buffer length:", resizedPNGBuffer.length);

  // Extract dimensions and data of the resized PNG using sharp
  const { data, info } = await sharp(resizedPNGBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Convert resized PNG to ESC/POS data using the shared function
  const escPosData = convertForESCPOSFunction(
    data,
    info.width,
    info.height,
    info.channels
  );

  // Generate ESC/POS commands
  const escPosCommands = getImageESCPosCommands(
    escPosData,
    info.width,
    info.height
  );
  const lineBreaks = addLineBreaks(2);
  const cutCommand = addCutCommand();
  const finalPrintData = Buffer.concat([
    escPosCommands,
    lineBreaks,
    cutCommand,
  ]);

  logImageStats("AFTER", info.width, info.height, finalPrintData.length, 9600);

  // Output the ESC/POS data for printing
  process.stdout.write(finalPrintData);
})();
