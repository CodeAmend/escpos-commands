const { Buffer } = require('buffer');
const { ESC, GS, DLE, EOT } = require('./values');

// Control code lookup
const controlCodes = {
  ESC: ESC, // 0x1B
  GS: GS,   // 0x1D
  DLE: DLE, // 0x10
  EOT: EOT  // 0x04
};

// Convert ASCII command array to Buffer
function toEscposBuffer(command) {
  const buffer = [];

  for (const item of command) {
    if (typeof item === 'number') {
      if (item < 0 || item > 255 || !Number.isInteger(item)) {
        throw new Error(`Invalid number: ${item} (must be integer 0-255)`);
      }
      buffer.push(item);
    } else if (typeof item === 'string') {
      if (controlCodes[item]) {
        buffer.push(controlCodes[item]);
      } else if (item.length === 1) {
        buffer.push(item.charCodeAt(0));
      } else {
        buffer.push(...Buffer.from(item, 'ascii')); // For QR code data
      }
    } else {
      throw new Error(`Invalid command item: ${item}`);
    }
  }

  return Buffer.from(buffer);
}

module.exports = { toEscposBuffer };
