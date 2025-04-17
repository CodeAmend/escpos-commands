// template.js
const escpos = require('./commands-node');

const siteShort = "https://littlecaesars.com"

const siteLong = "https://littlecaesars.com?orderId=1f2c9a6b-9824-4d63-a7d5-72b6323fbd1f&inventoryId=6a58c3d1-82b9-43d7-b241-2c93e44e2eb3&otherId=e5a3798a-bf56-4555-8702-313a4cb27263"

const tx = 30;

const buffer = Buffer.concat([
    escpos.init(),

    escpos.enterPageMode(),

    escpos.definePageArea(0, 0, 576, 425),

    escpos.setPosition(0, tx*1),
    escpos.text('I want a'),

    escpos.setPosition(0, tx*2),
    escpos.text('canvas image'),

    escpos.setPosition(0, tx*3),
    escpos.text('over here.'),

    escpos.setPosition(315, 0),
    escpos.qrcode(siteLong, 1, 4),

    escpos.exitPageMode(),

    escpos.br(4),

    escpos.cut()
]);

// Output binary to stdout (for piping to lp)
process.stdout.write(buffer);

