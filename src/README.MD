# Prerequisites

1. Node.js: Install from nodejs.org.

2. Epson TM-T88V: Connected via USB or network, with ESC/POS support.

3. Bash commands linux or mac terminal.



#### Clone Repository:
git clone 



#### Install Dependencies:
npm install


#### Find Printer Port:

Check connected printers:

lpstat -p -d



## Understand Key Functions (commands-node.js)


init(): Resets printer (ESC @, 1B 40).

printText(str): Prints ASCII text.

setPosition(x, y): Sets print position in page mode (x, y in dots).

enterPageMode(): Enters page mode (ESC L, 1B 4C) for buffered layout.

setPrintArea(x, y, width, height): Defines print area (e.g., 384x300 dots).

printPageMode(): Prints buffered content (ESC FF, 1B 0C).

qrcode(data, model, size): Prints QR code (e.g., siteLong, Model 2, Size 3).

cut(): Cuts paper (GS V, 1D 56 00, full cut).

exitPageMode(): Exits page mode, clears buffer (ESC @, 1B 40).

2. Using template.js

Purpose: Combines commands to print text or QR codes in page mode.

Example: Prints "TL", "TR", "BL", "BR" at corners or a QR code.

How it Works:

Buffers commands (e.g., init, setPosition, printText, qrcode).

Outputs to stdout via process.stdout.write(buffer).

Modify: Edit template.js to add text, positions, or QR codes. Example:

escpos.setPosition(10, 60);
escpos.printText("Hi");

3. Terminal Commands


Debug Output:

node template.js | hexdump -C

Shows ESC/POS commands (e.g., 1B 40 for init, 1D 28 6B for QR).


Print to Printer:

node template.js > lp





TM-T88V Notes


Resolution: 203 DPI, 512 dots (~72mm) wide.

Example

Print "Hi" and a QR code:

```ts
// template.js
const escpos = require('./commands-node');
const { siteLong } = require('./values');

(async () => {
  const buffer = Buffer.concat([
    escpos.init(),
    Buffer.from([0x1B, 0x74, 0x00]),
    escpos.enterPageMode(),
    escpos.setPrintArea(0, 0, 384, 300),
    escpos.setPosition(10, 60),
    escpos.printText("Hi"),
    escpos.setPosition(92, 100),
    escpos.qrcode(siteLong, 2, 3),
    escpos.printPageMode(),
    escpos.cut(),
    escpos.exitPageMode()
  ]);
  process.stdout.write(buffer);
})();
```

Run:

node template.js > lp

Debug:

node template.js | hexdump -C

Support


Epson Manual: Check TM-T88V ESC/POS documentation.



Issues: Verify printer port, buffer, or firmware. Contact Epson support if needed.
