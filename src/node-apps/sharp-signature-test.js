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
    console.error("BMP Decoded successfully");
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

    console.error("BMP successfully converted to PNG");
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

// Function to resize the SVG by modifying the width and height attributes
function resizeSVG(svgData, targetWidth) {
  const svgString = svgData.toString();

  // Extract the viewBox attribute to maintain the aspect ratio
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
  let newSvgString;

  if (viewBoxMatch) {
    const viewBoxValues = viewBoxMatch[1].split(" ");
    const originalWidth = parseFloat(viewBoxValues[2]); // viewBox width
    const originalHeight = parseFloat(viewBoxValues[3]); // viewBox height
    const aspectRatio = originalHeight / originalWidth;

    // Calculate the new height while maintaining the aspect ratio
    const targetHeight = targetWidth * aspectRatio;

    // Replace width and height attributes or add them if they don't exist
    newSvgString = svgString
      .replace(/(width="[^"]*")/, `width="${targetWidth}"`)
      .replace(/(height="[^"]*")/, `height="${targetHeight}"`);
  } else {
    console.error("SVG does not have a viewBox attribute, cannot resize.");
    throw new Error("SVG missing viewBox attribute");
  }

  return newSvgString;
}

// Convert SVG to PNG for viewing after resize
async function convertSVGToPNG(svgData, fileName) {
  try {
    const pngBuffer = await sharp(Buffer.from(svgData)).png().toBuffer();

    fs.writeFileSync(fileName, pngBuffer);
    console.error(`SVG resized and converted to PNG: ${fileName}`);
    return pngBuffer;
  } catch (error) {
    console.error("Error converting SVG to PNG:", error);
    throw error;
  }
}

// Function to convert the final PNG to ESC/POS binary data
async function convertPNGToEscPos(pngBuffer) {
  const png = await sharp(pngBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = png;
  const widthBytes = Math.ceil(info.width / 8); // Width in bytes (8 pixels per byte)

  let escPosData = [];

  console.error(
    `Image Width: ${info.width}, Image Height: ${info.height}, Channels: ${info.channels}`
  );

  // Loop through the image height and convert each pixel row to ESC/POS binary format
  for (let y = 0; y < info.height; y++) {
    let rowBytes = [];
    for (let x = 0; x < info.width; x += 8) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        if (x + bit < info.width) {
          const pixelIndex = (y * info.width + (x + bit)) * info.channels;

          // Extract RGB(A) values
          const r = data[pixelIndex];
          const g = data[pixelIndex + 1];
          const b = data[pixelIndex + 2];
          const alpha = info.channels === 4 ? data[pixelIndex + 3] : 255;

          // Convert the pixel to grayscale (ignore transparency)
          const grayscale = 0.3 * r + 0.59 * g + 0.11 * b;

          // Invert colors: When the pixel is lighter, treat it as black and vice versa
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

  // ESC/POS header for raster graphics printing
  const density = 0x30; // Single density mode
  const escPosHeader = Buffer.from([
    0x1d,
    0x76,
    0x30,
    density, // Command for raster graphics
    widthBytes % 256, // Width low byte
    Math.floor(widthBytes / 256), // Width high byte
    info.height % 256, // Height low byte
    Math.floor(info.height / 256), // Height high byte
  ]);

  return Buffer.concat([escPosHeader, ...escPosData]);
}

// Function to check image channels
async function checkImageChannels(pngBuffer) {
  const { info } = await sharp(pngBuffer)
    .raw() // Raw pixel data output
    .toBuffer({ resolveWithObject: true });

  // Info contains the number of channels
  console.error(`Image width: ${info.width}`);
  console.error(`Image height: ${info.height}`);
  console.error(`Image has ${info.channels} channels`);

  if (info.channels === 3) {
    console.error("The image is RGB.");
  } else if (info.channels === 4) {
    console.error("The image is RGBA (includes alpha channel).");
  } else {
    console.error(
      `The image has an unexpected number of channels: ${info.channels}`
    );
  }
}

// Save a file to disk
function saveFile(filename, data) {
  fs.writeFileSync(filename, data);
  console.error(`Saved file: ${filename}`);
}

// Main function to handle the entire flow
(async function () {
  const base64Path = "../images/signature/big-sig.b64"; // Your base64 file path
  const base64Buffer = await getBase64BufferFromFile(base64Path);

  // Step 1: Decode the BMP data using bmp-js
  const bmpData = decodeBMP(base64Buffer);

  // Step 2: Convert the decoded BMP to PNG using sharp
  const pngBuffer = await convertBMPToPNG(bmpData);
  saveFile("output/preprocessed-signature.png", pngBuffer); // Save PNG for inspection

  // Step 3: Convert the PNG buffer to SVG using Potrace
  const svgData = await convertPNGToSVG(pngBuffer);
  saveFile("output/signature-output.svg", svgData); // Save SVG for inspection

  // Step 4: Resize the SVG (keeping it as SVG)
  const resizedSVG = resizeSVG(svgData, 512); // Resize the SVG to 512px width
  saveFile("output/resized-signature.svg", resizedSVG); // Save resized SVG

  // Step 5: Convert the resized SVG to PNG and save it to see the final result
  const resizedPNGBuffer = await convertSVGToPNG(
    resizedSVG,
    "output/resized-final.png"
  );

  await checkImageChannels(resizedPNGBuffer);

  // Step 6: Convert the resized PNG to ESC/POS binary data
  const escPosData = await convertPNGToEscPos(resizedPNGBuffer);

  // Output the ESC/POS data for printing
  process.stdout.write(escPosData);
})();
