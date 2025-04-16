// template.js
const escpos = require('./commands-node');

const buffer = Buffer.concat([
  escpos.init(),
  escpos.enterPageMode(),
  escpos.definePageArea(0, 0, 576, 400),

  escpos.setPosition(0, 50),
  escpos.text('Top line'),
  escpos.br(1),

  escpos.setPosition(0, 100),
  escpos.text('Middle line'),
  escpos.br(1),

  escpos.setPosition(0, 150),
  escpos.text('Bottom line'),
  escpos.br(2),

  escpos.exitPageMode(),
  escpos.cut()
]);

// Output binary to stdout (for piping to lp)
process.stdout.write(buffer);

