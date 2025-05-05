// template.js
const escpos = require('./commands-node');
const { siteLong } = require('./values');

const lineHeight = 40;
const mult = 1;

(async () => {
  const buffer = Buffer.concat([
    escpos.init(), // ESC @ (1B 40): Initialize

    Buffer.from([0x1B, 0x74, 0x00]), // ESC t 0: PC437 code page

    escpos.enterPageMode(), // ESC L (1B 4C): Enter page mode

    escpos.setPrintArea(0, 0, 550, 550), // ESC W: Print area (384x100 dots)

    escpos.setPosition(350, 0),
    escpos.qrcode(siteLong, 2, 3),

    escpos.setPosition(0, lineHeight * 1),
    escpos.printText("TL"),

    escpos.setPosition(0, lineHeight * 6),
    escpos.printText("BL"),


    escpos.printPageMode(), // ESC FF (1B 0C): Print all
    escpos.cut(), // GS V (1D 56 00): Full cut
    escpos.exitPageMode() // ESC @ (1B 40): Exit page mode
  ]);

  process.stdout.write(buffer); // Output to terminal
})();
