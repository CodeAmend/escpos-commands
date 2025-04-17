
// -- ESC/POS control constants --
const ESC = 0x1B;
const GS  = 0x1D;

const FONT_MODES = {
  SIZE_1:   0x00,
  SIZE_2:   0x01,
  BOLD_OFF: 0x00,
  BOLD_ON:  0x08,
  HEIGHT_OFF: 0x00,
  HEIGHT_ON:  0x10,
  WIDTH_OFF:  0x00,
  WIDTH_ON:   0x20,
  UNDER_OFF:  0x00,
  UNDER_ON:   0x80,
};


module.exports = { ESC, GS, FONT_MODES }
