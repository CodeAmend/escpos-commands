const escpos = require('./commands-node');
const { siteLong } = require('./values');

const lineHeight = 40;

(async () => {
  const buffer = Buffer.concat([
    escpos.init(), // ESC @ (1B 40): Initialize
    Buffer.from([0x1B, 0x74, 0x00]), // ESC t 0: PC437 code page

    // Enter Page Mode
    escpos.enterPageMode(),
    // Set Print Area (0,0,576,330): 576 dots wide, 330 dots high
    escpos.setPrintArea(0, 0, 576, 330),

    // Left Area: Stack 11 lines of 35-char text (Font A, 1x1)
    escpos.setCharacterSize(1, 1), // GS ! 0x00: 1x1
    escpos.selectFont(0), // ESC M 0: Font A
    escpos.setBold(0), // ESC E 0: No bold
    escpos.setUnderline(0), // ESC - 0: No underline
    // Line 1: y=30
    escpos.setPosition(0, lineHeight * 1),
    escpos.printText("CRASHxBLASTxBOOMxWHAMxPOWxZAPxKA"),
    // Line 2: y=60
    escpos.setPosition(0, lineHeight * 2),
    escpos.printText("CRASHxBLASTxBOOMxWHAMxPOWxZAPxKA"),
    // Line 3: y=90
    escpos.setPosition(0, lineHeight * 3),
    escpos.printText("CRASHxBLASTxBOOMxWHAMxPOWxZAPxKA"),
    // Line 4: y=120
    escpos.setPosition(0, lineHeight * 4),
    escpos.printText("CRASHxBLASTxBOOMxWHAMxPOWxZAPxKA"),
    // Line 5: y=150
    escpos.setPosition(0, lineHeight * 5),
    escpos.printText("CRASHxBLASTxBOOMxWHAMxPOWxZAPxKA"),
    // Line 6: y=180
    escpos.setPosition(0, lineHeight * 6),
    escpos.printText("CRASHxBLASTxBOOMxWHAMxPOWxZAPxKA"),
    // Line 7: y=210
    escpos.setPosition(0, lineHeight * 7),
    escpos.printText("CRASHxBLASTxBOOMxWHAMxPOWxZAPxKA"),
    // Line 8: y=240
    escpos.setPosition(0, lineHeight * 8),
    escpos.printText("CRASHxBLASTxBOOMxWHAMxPOWxZAPxKA"),
    // Line 9: y=270
    escpos.setPosition(0, lineHeight * 9),
    escpos.printText("CRASHxBLASTxBOOMxWHAMxPOWxZAPxKA"),
    // Line 10: y=300
    escpos.setPosition(0, lineHeight * 10),
    escpos.printText("CRASHxBLASTxBOOMxWHAMxPOWxZAPxKA"),
    // Line 11: y=330
    escpos.setPosition(0, lineHeight * 11),
    escpos.printText("CRASHxBLASTxBOOMxWHAMxPOWxZAPxKA"),

    // Right Area: QR Code at x=420
    escpos.setPrintArea(420, 0, 156, 330), // 420–576 dots, 156 dots wide
    escpos.setPosition(420, 0),
    escpos.qrcode(siteLong, 2, 3), // Model 2, module size 3

    // Print and Exit
    escpos.printPageMode(), // FF (0C)
    escpos.cut(), // GS V 0 (1D 56 00)
    escpos.exitPageMode() // ESC S (1B 53)
  ]);

  process.stdout.write(buffer); // Output to terminal
})();
