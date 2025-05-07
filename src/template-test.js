const escpos = require('./commands-node');
const { convertImageToRasterData } = require('./imageProcessor');
const { siteLong } = require('./values');

const tests = [
  // Font A (0), 1x1, Normal (28 chars)
  {
    fontType: 0,
    fontW: 1,
    fontH: 1,
    lineHeight: 40,
    bold: 0,
    underline: 0,
    chars: "CRASHxBLASTxBOOMxWHAMxPOWxZA",
    charLength: 28
  },
  // Font A (0), 2x2, Normal (14 chars)
  {
    fontType: 0,
    fontW: 2,
    fontH: 2,
    lineHeight: 80,
    bold: 0,
    underline: 0,
    chars: "BANGxBOOMxCRAS",
    charLength: 14
  },
  // Font B (1), 1x1, Normal (38 chars)
  {
    fontType: 1,
    fontW: 1,
    fontH: 1,
    lineHeight: 30,
    bold: 0,
    underline: 0,
    chars: "FLASHxBANGxCRASHxBOOMxZAPxKABOOMxPOWxW",
    charLength: 38
  },
  // Font B (1), 2x2, Normal (19 chars)
  {
    fontType: 1,
    fontW: 2,
    fontH: 2,
    lineHeight: 60,
    bold: 0,
    underline: 0,
    chars: "STARxMOONxSUNxCLOUD",
    charLength: 19
  },
  // Font A (0), 1x1, Bold+Underline (28 chars)
  {
    fontType: 0,
    fontW: 1,
    fontH: 1,
    lineHeight: 40,
    bold: 1,
    underline: 1,
    chars: "CRASHxBLASTxBOOMxWHAMxPOWxZA",
    charLength: 28
  },
  // Font A (0), 2x2, Bold+Underline (14 chars)
  {
    fontType: 0,
    fontW: 2,
    fontH: 2,
    lineHeight: 80,
    bold: 1,
    underline: 1,
    chars: "BANGxBOOMxCRAS",
    charLength: 14
  },
  // Font B (1), 1x1, Bold+Underline (38 chars)
  {
    fontType: 1,
    fontW: 1,
    fontH: 1,
    lineHeight: 30,
    bold: 1,
    underline: 1,
    chars: "FLASHxBANGxCRASHxBOOMxZAPxKABOOMxPOWxW",
    charLength: 38
  },
  // Font B (1), 2x2, Bold+Underline (19 chars)
  {
    fontType: 1,
    fontW: 2,
    fontH: 2,
    lineHeight: 60,
    bold: 1,
    underline: 1,
    chars: "STARxMOONxSUNxCLOUD",
    charLength: 19
  }
];

(async () => {
  const { width, height, data } = await convertImageToRasterData('./images/man.png', 16, 29);

  const buffers = tests.map(test => Buffer.concat([
    escpos.init(), // ESC @ (1B 40): Initialize
    Buffer.from([0x1B, 0x74, 0x00]), // ESC t 0: PC437 code page

    // Set first Print Area (left side)
    escpos.enterPageMode(),
    escpos.setPrintArea(0, 0, 345, 600),

    // Print test string
    escpos.setPosition(0, test.lineHeight),
    escpos.setCharacterSize(test.fontW, test.fontH),
    escpos.setBold(test.bold),
    escpos.setUnderline(test.underline),
    escpos.selectFont(test.fontType),
    escpos.printText(test.chars),

    // Print details
    escpos.setCharacterSize(1, 1),
    escpos.selectFont(1),
    escpos.setBold(1),
    escpos.setUnderline(0),
    escpos.printText(`\n:Font: ${test.fontType} :W:${test.fontW} :H:${test.fontH} :LineHeight: ${test.lineHeight}`),
    escpos.printText(`\n:Bold: ${test.bold} :Underline: ${test.underline}`),
    escpos.printText(`\n:CharLength: ${test.charLength}`),

    // Set second Print Area (right side - qrcode)
    escpos.setPrintArea(350, 0, 200, 600),
    escpos.setPosition(350, 0),
    escpos.qrcode(siteLong, 2, 3),

    escpos.printPageMode(),
    escpos.cut(),
    escpos.exitPageMode()
  ]));

  process.stdout.write(Buffer.concat(buffers)); // Output to terminal
})();
