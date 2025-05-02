const { convertImageToRasterBuffer } = require('./rasterImage');
const escpos = require('./commands-node');

const { MODE, siteLong, siteShort } = require("./values");

(async () => {
  const imageBuf = await convertImageToRasterBuffer('./images/canvas-left-side2.png');

  const buffer = Buffer.concat([
    escpos.init(),
    escpos.setPosition(0, 0),
    imageBuf,
    escpos.lineFeed(3),
    escpos.cut()
  ]);

  // DO NOT console.log
  process.stdout.write(buffer);
})();
