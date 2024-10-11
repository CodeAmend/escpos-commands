const fs = require("fs");
const util = require("util");
const bmp = require("bmp-js");
const potrace = require("potrace");
const sharp = require("sharp");

// Function to read base64-encoded image and return raw buffer
async function getBase64BufferFromFile(filePath) {
  const readFile = util.promisify(fs.readFile);
  const data = await readFile(filePath, "utf8");
  const base64Data = data.replace(/^data:image\/bmp;base64,/, ""); // Remove base64 prefix if it exists
  return Buffer.from(base64Data, "base64"); // Return raw binary buffer
}

// Function to decode BMP using bmp-js
function decodeBMP(bmpBuffer) {
  try {
    const bmpData = bmp.decode(bmpBuffer);
    console.log("BMP Decoded successfully");
    return bmpData;
  } catch (error) {
    console.error("Error decoding BMP:", error);
    throw error;
  }
}

// Function to convert decoded BMP to PNG using sharp
async function convertBMPToPNG(bmpData) {
  try {
    const rawImageData = Buffer.from(bmpData.data);

    const pngBuffer = await sharp(rawImageData, {
      raw: {
        width: bmpData.width,
        height: bmpData.height,
        channels: 4, // BMP typically has RGBA channels
      },
    })
      .png()
      .toBuffer();

    console.log("BMP successfully converted to PNG");
    return pngBuffer;
  } catch (error) {
    console.error("Error converting BMP to PNG:", error);
    throw error;
  }
}

// Function to convert PNG to SVG using Potrace
function convertPNGToSVG(pngBuffer) {
  return new Promise((resolve, reject) => {
    potrace.trace(
      pngBuffer,
      {
        optTolerance: 0.2, // better curve following of pixels
        threshold: 230,
        //invert: true,
        turnPolicy: potrace.Potrace.TURNPOLICY_MINORITY,
      },
      (err, svg) => {
        if (err) {
          return reject("Error during PNG to SVG conversion: " + err);
        }
        resolve(svg);
      }
    );
  });
}

// Invert the PNG colors manually using Sharp
async function invertPNGColors(pngBuffer) {
  return sharp(pngBuffer)
    .negate() // Invert colors manually here
    .toBuffer();
}

// Save a file to disk
function saveFile(filename, data) {
  fs.writeFileSync(filename, data);
  console.log(`Saved file: ${filename}`);
}

// Main function to decode BMP and convert to SVG
(async function () {
  const base64Path = "../images/signature/big-sig.b64"; // Your base64 file path
  const base64Buffer = await getBase64BufferFromFile(base64Path);

  // Step 1: Decode the BMP data using bmp-js
  const bmpData = decodeBMP(base64Buffer);

  // Step 2: Convert the decoded BMP to PNG using sharp
  const pngBuffer = await convertBMPToPNG(bmpData);
  saveFile("preprocessed-signature.png", pngBuffer); // Save PNG for inspection

  // Step 3: Convert the PNG buffer to SVG using Potrace
  const svgData = await convertPNGToSVG(pngBuffer);
  saveFile("signature-output.svg", svgData); // Save SVG for inspection
})();
