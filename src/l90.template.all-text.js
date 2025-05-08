const escpos = require('./commands-node');
const { siteLong } = require('./values');

const tests = [
  // Font A (0), 1x1, Normal 
  {
    fontType: 0,
    fontW: 1,
    fontH: 1,
    lineHeight: 40,
    bold: 0,
    underline: 0,
    chars: "CRASHxBLASTxBOOMxWHAMxPOWxZAPxKA",
    charLength: 35
  },
  // Font A (0), 2x2, Normal
  {
    fontType: 0,
    fontW: 2,
    fontH: 2,
    lineHeight: 80,
    bold: 0,
    underline: 0,
    chars: "BANGxBOOMxCRASHx",
    charLength: 17
  },
  // Font B (1), 1x1, Normal
  {
    fontType: 1,
    fontW: 1,
    fontH: 1,
    lineHeight: 35,
    bold: 0,
    underline: 0,
    chars: "FLASHxBANGxCRASHxBOOMxZAPxKABOOMxPOWxWHAMx",
    charLength: 46
  },
  // Font B (1), 2x2, Normal (23 chars)
  {
    fontType: 1,
    fontW: 2,
    fontH: 2,
    lineHeight: 70,
    bold: 0,
    underline: 0,
    chars: "STARxMOONxSUNxCLOUDxR",
    charLength: 23
  },
  // Font A (0), 1x1, Bold+Underline (35 chars)
  {
    fontType: 0,
    fontW: 1,
    fontH: 1,
    lineHeight: 40,
    bold: 1,
    underline: 1,
    chars: "CRASHxBLASTxBOOMxWHAMxPOWxZAPxKA",
    charLength: 35
  },
  // Font A (0), 2x2, Bold+Underline (17 chars)
  {
    fontType: 0,
    fontW: 2,
    fontH: 2,
    lineHeight: 80,
    bold: 1,
    underline: 1,
    chars: "BANGxBOOMxCRASHxR",
    charLength: 17
  },
  // Font B (1), 1x1, Bold+Underline (46 chars)
  {
    fontType: 1,
    fontW: 1,
    fontH: 1,
    lineHeight: 35,
    bold: 1,
    underline: 1,
    chars: "FLASHxBANGxCRASHxBOOMxZAPxKABOOMxPOWxWHAMx",
    charLength: 46
  },
  // Font B (1), 2x2, Bold+Underline (23 chars)
  {
    fontType: 1,
    fontW: 2,
    fontH: 2,
    lineHeight: 70,
    bold: 1,
    underline: 1,
    chars: "STARxMOONxSUNxCLOUDxR",
    charLength: 23
  }
];

(async () => {
  const buffers = tests.map(test => Buffer.concat([
    escpos.init(), // ESC @ (1B 40): Initialize
    Buffer.from([0x1B, 0x74, 0x00]), // ESC t 0: PC437 code page

    // Set first Print Area (left side)
    escpos.enterPageMode(),
    escpos.setPrintArea(0, 0, 578, 330),

    // Print test string
    escpos.setPosition(0, test.lineHeight),
    escpos.setCharacterSize(test.fontW, test.fontH),
    escpos.setBold(test.bold),
    escpos.setUnderline(test.underline),
    escpos.selectFont(test.fontType),
    escpos.printText(test.chars),

    // Reset line height for details (Font B 1x1 default)
    escpos.setCharacterSize(1, 1),
    escpos.selectFont(1), // Font B
    escpos.setBold(1), // Bold
    escpos.setUnderline(0), // No underline

    escpos.setPosition(0, test.lineHeight * 3),
    escpos.printText(`:Font: ${test.fontType} :W:${test.fontW} :H:${test.fontH} :LineHeight: ${test.lineHeight}`),
    escpos.setPosition(0, test.lineHeight * 3 + 34),
    escpos.printText(`:Bold: ${test.bold} :Underline: ${test.underline}`),
    escpos.setPosition(0, test.lineHeight * 3 + 68),
    escpos.printText(`:CharLength: ${test.chars.length}`),

    escpos.setPosition(420, 0),
    escpos.qrcode(siteLong, 2, 3), // Model 2, module size 3

    escpos.printPageMode(),
    escpos.cut(),
    escpos.exitPageMode()
  ]));

  process.stdout.write(Buffer.concat(buffers)); // Output to terminal
})();
