// template.js
const escpos = require('./src/commands-node');
const { siteLong, siteShort } = require('./src/values');

const lineHeight = 40;
const mult = 1;

const qrXpos = 350;
const qrYpos = -0;

(async () => {
  const buffer = Buffer.concat([
    escpos.init(),
    Buffer.from([0x1B, 0x74, 0x00]), // PC437 code page

    escpos.enterPageMode(),

    escpos.setPrintArea(0, 0, 500, 600),

    escpos.selectFont(1), // Font B
    escpos.setCharacterSize(2, 2), // 2x size
    escpos.reverseBackground(true),
    escpos.setJustification('left'),
    escpos.setPosition(10, 60),
    escpos.printText("Header"),

    // escpos.selectFont(1), // Font B
    // escpos.setCharacterSize(2, 7), // 2x size
    // escpos.setJustification('center'),
    // escpos.setPosition(10, 220),
    // escpos.printText("Header"),

    // escpos.selectTextMode({ bold: true }),
    // escpos.setPosition(10, 180),
    // escpos.printText("Bold Text"),

    // escpos.setUnderline(true),
    // escpos.setPosition(10, 220),
    // escpos.printText("Underlined"),

    escpos.setPosition(350, 0),
    escpos.qrcode(siteLong, 2, 3),

    escpos.printPageMode(),
    escpos.cut(),
    escpos.exitPageMode()
  ]);
  process.stdout.write(buffer);
})();
