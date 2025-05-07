// template.js
const escpos = require('./commands-node');
const { convertImageToRasterData } = require('./imageProcessor');
const { siteLong } = require('./values');

// escpos.printText("ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOP"),
// escpos.printText("abcdefghijklmnopqrstuvwxyzabcdefghijklmnop"),
// escpos.printText("123456789z123456789z123456789z123456789z12"),

const fontType = 0;
const fontW = 2;
const fontH = 2;
const lineH = 80; 
const chars = "123456789z1234"
// const chars = "123456789z123456789z123456789z123456789"
// const chars = "123456789z123456789z123456789"
const textModeOptions = { bold: false };
const modeName = "NORM";

// const chars = "123456789z123456789";
const charLength = chars.length;

(async () => {
  // Convert man.png to raster data (16x29)
  const { width, height, data } = await convertImageToRasterData('./images/man.png', 16, 29);

  const buffer = Buffer.concat([
    escpos.init(), // ESC @ (1B 40): Initialize
    Buffer.from([0x1B, 0x74, 0x00]), // ESC t 0: PC437 code page

    // Set first Print Area (left side)
    escpos.enterPageMode(),
    escpos.setPrintArea(0, 0, 345, 600), 

    // Line Height is 40 Font 0 w:1 h:1
    escpos.setPosition(0, 40),
    escpos.setCharacterSize(1, 1), 
    escpos.selectFont(0),
    escpos.printText("Hello! I want this to wrap and not go through the QRCode."),


    // Set second Print Area (right side - qrcode)
    escpos.setPrintArea(350, 0, 200, 600), 

    escpos.setPosition(350, 0),
    escpos.qrcode(siteLong, 2, 3),

    escpos.printPageMode(),
    escpos.cut(),

    escpos.exitPageMode()
  ]);

  process.stdout.write(buffer); // Output to terminal
})();
