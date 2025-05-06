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
    escpos.setPosition(50, 50),
    escpos.rasterImage(width, height, data),

    escpos.selectFont(1), // Font B
    escpos.setCharacterSize(2, 2), // 2x size
    escpos.reverseBackground(true),
    escpos.setJustification('left'),

    escpos.setPosition(5, 60),
    escpos.printText(" P "),
    escpos.setCharacterSize(1, 1), // 2x size
    escpos.reverseBackground(false),
    escpos.printText(" Damon | #1004488 "),

    escpos.setPosition(5, 130),
    escpos.setCharacterSize(2, 2), // 2x size
    escpos.reverseBackground(false),
    escpos.printText("ST CR ULT SUPREME"),

    escpos.setPosition(5, 175),
    escpos.setCharacterSize(1, 1), // 2x size
    escpos.printText("SAUCE: XX CHZ: XX PEP: XX IS: XX B: XX"),
    escpos.setPosition(5, 215),
    escpos.printText("SAUCE: XX CHZ: XX PEP: XX IS: XX B: XX"),

    escpos.setPosition(5, 285),
    escpos.setCharacterSize(2, 2), // 2x size
    escpos.reverseBackground(true),
    escpos.printText("  9  "),
    escpos.reverseBackground(false),
    escpos.printText("  9225  "),

    escpos.setPosition(350, 0),
    escpos.qrcode(siteLong, 2, 3),

    escpos.printPageMode(),
    escpos.cut(),

    escpos.exitPageMode()
  ]);

  process.stdout.write(buffer); // Output to terminal
})();
