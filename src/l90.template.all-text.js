const escpos = require('./commands-node');
const { siteLong } = require('./values');

const tests = [
  // Font A (0), 1x1, Normal (33 chars)
  {
    fontType: 0,
    fontW: 1,
    fontH: 1,
    lineHeight: 70, // Adjusted from 40
    bold: 0,
    underline: 0,
    chars: "CRASHxBLASTxBOOMxWHAMxPOWxZAPxKA", // 33 chars
    charLength: 33
  },
  // Font A (0), 2x2, Normal (16 chars)
  {
    fontType: 0,
    fontW: 2,
    fontH: 2,
    lineHeight: 140, // Adjusted from 80
    bold: 0,
    underline: 0,
    chars: "BANGxBOOMxCRASHxP", // 16 chars
    charLength: 16
  },
  // Font B (1), 1x1, Normal (44 chars)
  {
    fontType: 1,
    fontW: 1,
    fontH: 1,
    lineHeight: 70, // Adjusted from 34
    bold: 0,
    underline: 0,
    chars: "FLASHxBANGxCRASHxBOOMxZAPxKABOOMxPOWxWxxx", // 44 chars
    charLength: 44
  },
  // Font B (1), 2x2, Normal (22 chars)
  {
    fontType: 1,
    fontW: 2,
    fontH: 2,
    lineHeight: 140, // Adjusted from 68
    bold: 0,
    underline: 0,
    chars: "STARxMOONxSUNxCLOUDxxxx", // 22 chars
    charLength: 22
  },
  // Font A (0), 1x1, Bold+Underline (33 chars)
  {
    fontType: 0,
    fontW: 1,
    fontH: 1,
    lineHeight: 70, // Adjusted from 40
    bold: 1,
    underline: 1,
    chars: "CRASHxBLASTxBOOMxWHAMxPOWxZAPxKA", // 33 chars
    charLength: 33
  },
  // Font A (0), 2x2, Bold+Underline (16 chars)
  {
    fontType: 0,
    fontW: 2,
    fontH: 2,
    lineHeight: 140, // Adjusted from 80
    bold: 1,
    underline: 1,
    chars: "BANGxBOOMxCRASHxP", // 16 chars
    charLength: 16
  },
  // Font B (1), 1x1, Bold+Underline (44 chars)
  {
    fontType: 1,
    fontW: 1,
    fontH: 1,
    lineHeight: 70, // Adjusted from 34
    bold: 1,
    underline: 1,
    chars: "FLASHxBANGxCRASHxBOOMxZAPxKABOOMxPOWxWxxx", // 44 chars
    charLength: 44
  },
  // Font B (1), 2x2, Bold+Underline (22 chars)
  {
    fontType: 1,
    fontW: 2,
    fontH: 2,
    lineHeight: 140, // Adjusted from 68
    bold: 1,
    underline: 1,
    chars: "STARxMOONxSUNxCLOUDxxxx", // 22 chars
    charLength: 22
  }
];

(async () => {
  const buffers = tests.map(test => Buffer.concat([
    escpos.init(), // ESC @ (1B 40): Initialize
    Buffer.from([0x1B, 0x74, 0x00]), // ESC t 0: PC437 code page

    // Set first Print Area (left side)
    escpos.enterPageMode(),
    escpos.setPrintArea(0, 0, 420, 330), // Adjusted to 420 wide, 330 high

    // Print test string
    escpos.setPosition(0, test.lineHeight),
    escpos.setCharacterSize(test.fontW, test.fontH),
    escpos.setBold(test.bold),
    escpos.setUnderline(test.underline),
    escpos.selectFont(test.fontType),
    escpos.printText(test.chars),

    // Reset line height for details (Font B 1x1 default)
    escpos.setCharacterSize(1, 1), // GS ! 0x00: 1x1
    escpos.selectFont(1), // ESC M 1: Font B
    escpos.setBold(1), // ESC E 1: Bold
    escpos.setUnderline(0), // ESC - 0: No underline
    // Use default line height (34 dots for Font B 1x1)
    escpos.setPosition(0, test.lineHeight * 2),
    escpos.printText(`:Font: ${test.fontType} :W:${test.fontW} :H:${test.fontH} :LineHeight: ${test.lineHeight}`),
    escpos.setPosition(0, test.lineHeight * 2 + 34), // +34 dots
    escpos.printText(`:Bold: ${test.bold} :Underline: ${test.underline}`),
    escpos.setPosition(0, test.lineHeight * 2 + 68), // +68 dots (2 × 34)
    escpos.printText(`:CharLength: ${test.charLength}`),

    // Set second Print Area (right side - QR code)
    escpos.setPrintArea(420, 0, 156, 330), // 420–576 dots, 156 dots wide
    escpos.setPosition(420, 0),
    escpos.qrcode(siteLong, 2, 3), // Model 2, module size 3

    escpos.printPageMode(), // FF (0C)
    escpos.cut(), // GS V 0 (1D 56 00)
    escpos.exitPageMode() // ESC S (1B 53)
  ]));

  process.stdout.write(Buffer.concat(buffers)); // Output to terminal
})();
