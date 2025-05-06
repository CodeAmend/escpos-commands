// template.js
const escpos = require('./commands-node');
const { convertImageToRasterData } = require('./imageProcessor');
const { siteLong } = require('./values');

(async () => {
  // Convert man.png to raster data (16x29)
  const { width, height, data } = await convertImageToRasterData('./images/man.png', 16, 29);

  const buffer = Buffer.concat([
    escpos.init(), // ESC @ (1B 40): Initialize
    Buffer.from([0x1B, 0x74, 0x00]), // ESC t 0: PC437 code page

    escpos.enterPageMode(),
    escpos.setPrintArea(0, 0, 500, 600), 

    // Icon at top-left
    escpos.setPosition(0, 0),
    escpos.rasterImage(width, height, data),

    // Text beside icon
    escpos.setPosition(20, 40),
    escpos.selectFont(1), // Font B
    escpos.printText("Next to Icon"),

    // Large 
    escpos.setPosition(0, 120),
    escpos.setCharacterSize(2, 2), // 2x2 size
    escpos.printText("Large Text"),

    // Small 20-char text 60 dots further
    escpos.setPosition(0, 200),
    escpos.setCharacterSize(1, 1), // Normal size
    escpos.selectFont(1), // Font B
    escpos.printText("Small Text 1234567890"),

    // Reverse Text
    escpos.setPosition(0, 280),
    escpos.reverseBackground(true),
    escpos.setCharacterSize(2, 2), // Normal size
    escpos.selectFont(1), // Font B
    escpos.printText("10 / 14"),

    // QR code on right
    escpos.setPosition(350, 0),
    escpos.qrcode(siteLong, 2, 3),

    escpos.printPageMode(),
    escpos.cut(),

    escpos.exitPageMode()
  ]);

  process.stdout.write(buffer); // Output to terminal
})();
