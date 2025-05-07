const escpos = require('./commands-node');
const { siteLong } = require('./values');

const tests = [
  // Font A (0), 1x1, Normal (28 chars)
  {
    fontType: 0,
    fontW: 1,
    fontH: 1,
    lineHeight: 40, // Adjusted from 30
    bold: 0,
    underline: 0,
    chars: "CRASHxBLASTxBOOMxWHAMxPOWxZA", // 28 chars
    charLength: 28
  },
  // Font A (0), 2x2, Normal (14 chars)
  {
    fontType: 0,
    fontW: 2,
    fontH: 2,
    lineHeight: 80, // Same as original
    bold: 0,
    underline: 0,
    chars: "BANGxBOOMxCRAS", // 14 chars
    charLength: 14
  },
  // Font B (1), 1x1, Normal (38 chars)
  {
    fontType: 1,
    fontW: 1,
    fontH: 1,
    lineHeight: 34, // Adjusted from 30
    bold: 0,
    underline: 0,
    chars: "FLASHxBANGxCRASHxBOOMxZAPxKABOOMxPOWxW", // 38 chars
    charLength: 38
  },
  // Font B (1), 2x2, Normal (19 chars)
  {
    fontType: 1,
    fontW: 2,
    fontH: 2,
    lineHeight: 68, // Adjusted from 60
    bold: 0,
    underline: 0,
    chars: "STARxMOONxSUNxCLOUD", // 19 chars
    charLength: 19
  },
  // Font A (0), 1x1, Bold+Underline (28 chars)
  {
    fontType: 0,
    fontW: 1,
    fontH: 1,
    lineHeight: 40, // Adjusted from 30
    bold: 1,
    underline: 1,
    chars: "CRASHxBLASTxBOOMxWHAMxPOWxZA", // 28 chars
    charLength: 28
  },
  // Font A (0), 2x2, Bold+Underline (14 chars)
  {
    fontType: 0,
    fontW: 2,
    fontH: 2,
    lineHeight: 80, // Same as original
    bold: 1,
    underline: 1,
    chars: "BANGxBOOMxCRAS", // 14 chars
    charLength: 14
  },
  // Font B (1), 1x1, Bold+Underline (38 chars)
  {
    fontType: 1,
    fontW: 1,
    fontH: 1,
    lineHeight: 34, // Adjusted from 30
    bold: 1,
    underline: 1,
    chars: "FLASHxBANGxCRASHxBOOMxZAPxKABOOMxPOWxW", // 38 chars
    charLength: 38
  },
  // Font B (1), 2x2, Bold+Underline (19 chars)
  {
    fontType: 1,
    fontW: 2,
    fontH: 2,
    lineHeight: 68, // Adjusted from 60
    bold: 1,
    underline: 1,
    chars: "STARxMOONxSUNxCLOUD", // 19 chars
    charLength: 19
  }
];

(async () => {
  const buffers = tests.map(test => Buffer.concat([
    escpos.init(), // ESC @ (1B 40): Initialize
    Buffer.from([0x1B, 0x74, 0x00]), // ESC t 0: PC437 code page

    // Set first Print Area (left side)
    escpos.enterPageMode(),
    escpos.setPrintArea(0, 0, 345, 330), // Adjusted to 576 wide, 330 high

    // Print test string
    escpos.setPosition(0, test.lineHeight),
    escpos.setCharacterSize(test.fontW, test.fontH),
    escpos.setBold(test.bold),
    escpos.setUnderline(test.underline),
    escpos.selectFont(test.fontType),
    escpos.printText(test.chars),

    // Print details
    escpos.setCharacterSize(1, 1), // GS ! 0x00: 1x1
    escpos.selectFont(1), // ESC M 1: Font B
    escpos.setBold(1), // ESC E 1: Bold
    escpos.setUnderline(0), // ESC - 0: No underline
    escpos.setPosition(0, test.lineHeight * 2),
    escpos.printText(`:Font: ${test.fontType} :W:${test.fontW} :H:${test.fontH} :LineHeight: ${test.lineHeight}`),
    escpos.setPosition(0, test.lineHeight * 3),
    escpos.printText(`:Bold: ${test.bold} :Underline: ${test.underline}`),
    escpos.setPosition(0, test.lineHeight * 4),
    escpos.printText(`:CharLength: ${test.charLength}`),

    // Set second Print Area (right side - QR code)
    escpos.setPrintArea(350, 0, 226, 330), // 350–576 dots, 226 dots wide
    escpos.setPosition(350, 0),
    escpos.qrcode(siteLong, 2, 3), // Model 2, module size 3

    escpos.printPageMode(), // FF (0C)
    escpos.cut(), // GS V 0 (1D 56 00)
    escpos.exitPageMode() // ESC S (1B 53)
  ]));

  process.stdout.write(Buffer.concat(buffers)); // Output to terminal
})();
