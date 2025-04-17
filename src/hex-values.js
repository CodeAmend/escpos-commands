
// -- ESC/POS control constants --
const ESC = 0x1B;
const GS  = 0x1D;

const MODE = {
  SMALL:   0x01,
  BOLD:    0x08,
  HEIGHT:  0x10,
  WIDTH:   0x20,
  UNDER:   0x80,
};

function hexAddition(hexArray) {
    return hexArray.reduce(( acc, val) => acc | val, 0)
}

module.exports = { ESC, GS, MODE }
