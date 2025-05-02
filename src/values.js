const siteShort = "https://littlecaesars.com";
const siteLong = "https://littlecaesars.com?orderId=1f2c9a6b-9824-4d63-a7d5-72b6323fbd1f&inventoryId=6a58c3d1-82b9-43d7-b241-2c93e44e2eb3&otherId=e5a3798a-bf56-4555-8702-313a4cb27263";


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

module.exports = { ESC, GS, MODE, siteLong, siteShort }
