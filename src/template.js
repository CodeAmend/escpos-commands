// template.js
const escpos = require('./commands-node');
const { siteLong, siteShort } = require('./values');

const lineHeight = 40;
const mult = 1;

const qrXpos = 350;
const qrYpos = -0;

(async () => {
  const buffer = Buffer.concat([
    escpos.init(),
    Buffer.from([0x1B, 0x74, 0x00]), // PC437 code page
    escpos.enterPageMode(),
    escpos.setPrintArea(0, 0, 384, 600),
    escpos.selectFont(1), // Font B
    escpos.setCharacterSize(2, 2), // 2x size
    escpos.setJustification('center'),
    escpos.setPosition(10, 60),
    escpos.printText("Header"),
    escpos.selectPrintMode({ bold: true }),
    escpos.setPosition(10, 120),
    escpos.printText("Bold Text"),
    escpos.setUnderline(true),
    escpos.setPosition(10, 180),
    escpos.printText("Underlined"),
    escpos.printPageMode(),
    escpos.cut(),
    escpos.exitPageMode()
  ]);
  process.stdout.write(buffer);
})();
