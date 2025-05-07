# TM-T88V ESC/POS Text & Page Mode Commands

Quick reference for Epson TM-T88V ESC/POS commands related to text and Page Mode. All measurements in dots (180 DPI, ~7.09 dots/mm). Printable width: 512 dots (72mm) for 80mm paper.

## Text Commands

- **ESC M (Select Font)**  
  Syntax: `ESC M n` (`1B 4D n`)  
  Selects font:  
  - `n=0`: Font A (12×24 dots, 42 columns).  
  - `n=1`: Font B (9×17 dots, 56 columns).

- **ESC SP (Set Right-Side Character Spacing)**  
  Syntax: `ESC SP n` (`1B 20 n`)  
  Adds `n` dots (0–255) to right of each character.  
  Default: `n=0`.  
  Increases width, no height change.

- **GS ! (Set Character Size)**  
  Syntax: `GS ! n` (`1D 21 n`)  
  Scales width/height (1× to 8×):  
  - Bits 0–2: Width (0=1×, 1=2×, ..., 7=8×).  
  - Bits 4–6: Height (0=1×, 1=2×, ..., 7=8×).  
  Example: `GS ! 0x11` → 2× width/height.  
  Font A: 12×24 (1×) to 96×192 (8×).  
  Font B: 9×17 (1×) to 72×136 (8×).  
  Reduces columns (e.g., Font A 42→~5 at 8×).


- **ESC - (Underline)**  
  Syntax: `ESC - n` (`1B 2D n`)  
  Underline: `n=0` (off), `n=1` (1-dot), `n=2` (2-dot).

- **ESC E (Bold)**  
  Syntax: `ESC E n` (`1B 45 n`)  
  Bold: `n=0` (off), `n=1` (on).

- **ESC G (Double-Strike)**  
  Syntax: `ESC G n` (`1B 47 n`)  
  Double-strike (like bold): `n=0` (off), `n=1` (on).

- **ESC { (Upside-Down)**  
  Syntax: `ESC { n` (`1B 7B n`)  
  Upside-down text: `n=0` (off), `n=1` (on).  
  Page Mode only.

- **ESC V (90° Rotation)**  
  Syntax: `ESC V n` (`1B 56 n`)  
  Rotates text 90°: `n=0` (off), `n=1` (on).  
  Page Mode only.

- **ESC a (Alignment)**  
  Syntax: `ESC a n` (`1B 61 n`)  
  Aligns text: `n=0` (left), `n=1` (center), `n=2` (right).

- **ESC d (Print and Feed)**  
  Syntax: `ESC d n` (`1B 64 n`)  
  Prints and feeds `n` lines (0–255).


### special case functions (ONE or the other)
// Do not use this one with the other single functions such as underline and bold. It might be wise to chose one or the other so that both functions are not called by the same printer command set.
- **ESC ! (Master Font Settings)**
- There is no double height that exists on its own. 
- Its important to understand how a binary switch works to create this function
- If you use this function and put an underline function command next, it will be ignored, however, if you reverse the order, it will work. This is why we should choose one to use in the code base so there is no confustion.

## ESC ! (Master Font Settings)

Syntax: `ESC ! n` (`1B 21 n`)  
Sets multiple font attributes via 8-bit parameter `n` (0–255).  
**Bit Settings**:  
- Bit 0: Font select (0 = Font A [12×24 dots, 42 columns], 1 = Font B [9×17 dots, 56 columns]).  
- Bit 1: Unused (reserved, 0).  
- Bit 2: Unused (reserved, 0).  
- Bit 3: Bold (0 = off, 1 = on).  
- Bit 4: Double-height (0 = off, 1 = on).  
- Bit 5: Double-width (0 = off, 1 = on).  
- Bit 6: Unused (reserved, 0).  
- Bit 7: Underline (0 = off, 1 = on).  

**Multiple Options**: Combine attributes by setting bits to 1.  
**Bit Example**:  
- Bold + Underline: Bits 3, 7 = 1 → Binary `10001000` = `0x88` → `ESC ! 0x88`.  
- Font B + Bold + Double-width: Bits 0, 3, 5 = 1 → Binary `00101001` = `0x29` → `ESC ! 0x29`.  
- Font A + Double-height + Double-width + Underline: Bits 4, 5, 7 = 1 → Binary `10110000` = `0xB0` → `ESC ! 0xB0`.  

**Notes**:  
- Double-height/width reduces columns (e.g., Font A 42 → ~21 at double-width).  
- Ensure content fits 512-dot (72mm) printable width.  
- Test with TM-Utility.


Apologies for the mix-up. Below is the new section for QR Code, Barcode, and related functions (e.g., 2D codes like PDF417) for the Epson TM-T88V, formatted in raw Markdown as requested, focusing on ESC/POS commands relevant to these features.

## Barcode and 2D Code Commands

Commands for printing barcodes, QR codes, and other 2D codes (e.g., PDF417) on the TM-T88V. All measurements in dots (180 DPI, ~7.09 dots/mm). Max printable width: 512 dots (72mm) for 80mm paper.

- **GS w (Set Barcode Width)**  
  Syntax: `GS w n` (`1D 77 n`)  
  Sets barcode module width: `n` = 2–6 (dots, ~0.28–0.85mm).  
  Default: `n=3` (~0.42mm).  
  Smaller `n` saves space; larger `n` improves readability.

- **GS h (Set Barcode Height)**  
  Syntax: `GS h n` (`1D 68 n`)  
  Sets barcode height: `n` = 1–255 (dots, ~0.14–36mm).  
  Default: `n=162` (~22.85mm).  
  Adjust to fit layout or scanner requirements.

- **GS H (Select HRI Position)**  
  Syntax: `GS H n` (`1D 48 n`)  
  Sets Human-Readable Interpretation (HRI) position:  
  - `n=0`: None.  
  - `n=1`: Above barcode.  
  - `n=2`: Below barcode.  
  - `n=3`: Above and below.  
  HRI uses Font A/B (set via `ESC M`).

- **GS f (Select HRI Font)**  
  Syntax: `GS f n` (`1D 66 n`)  
  Sets HRI font: `n=0` (Font A, 12×24), `n=1` (Font B, 9×17).  
  Default: Font A.

- **GS k (Print Barcode)**  
  Syntax: `GS k m d1...dk NUL` (`1D 6B m d1...dk 00`) or `GS k m n d1...dn` (`1D 6B m n d1...dn`)  
  Prints barcode. Two formats:  
  - Format 1 (`m=0–6`): Data ends with `NUL` (ASCII 0).  
    - `m=0`: UPC-A (11–12 digits).  
    - `m=1`: UPC-E (6–8 digits).  
    - `m=2`: EAN13 (12–13 digits).  
    - `m=3`: EAN8 (7–8 digits).  
    - `m=4`: Code39 (variable length, alphanumeric).  
    - `m=5`: ITF (even-length digits).  
    - `m=6`: Codabar (variable length, specific chars).  
  - Format 2 (`m=65–73`): Length `n` (1–255 bytes) precedes data.  
    - `m=65`: UPC-A.  
    - `m=66`: UPC-E.  
    - `m=67`: EAN13.  
    - `m=68`: EAN8.  
    - `m=69`: Code39.  
    - `m=70`: ITF.  
    - `m=71`: Codabar.  
    - `m=72`: Code93 (variable length, ASCII).  
    - `m=73`: Code128 (variable length, with font switching `{A`, `{B`, `{C`).  
  Example: Code128 for “PQR123” → `GS k 73 7 123 80 81 82 49 50 51` (`7` = length, `123` = `{`, `80–82` = PQR, `49–51` = 123).

- **GS ( k (2D Codes: QR Code, PDF417)**  
  Syntax: `GS ( k pL pH cn fn [params]` (`1D 28 6B pL pH cn fn ...`)  
  Processes QR Code and PDF417. `pL pH` = parameter length (bytes). `cn=49` (2D codes). Functions:  

  - **Function 165 (QR Code: Select Model)**  
    Syntax: `GS ( k 04 00 31 41 n1 n2`  
    Selects QR model: `n1=49` (Model 1), `50` (Model 2, default), `51` (Micro QR). `n2=0`.  
    Example: `1D 28 6B 04 00 31 41 50 00` (Model 2).

  - **Function 167 (QR Code: Set Module Size)**  
    Syntax: `GS ( k 03 00 31 43 n`  
    Sets QR module size: `n=1–16` (dots, ~0.14–2.26mm).  
    Default: `n=3` (~0.42mm).  
    Example: `1D 28 6B 03 00 31 43 05` (~0.71mm, ~20mm QR).

  - **Function 169 (QR Code: Set Error Correction)**  
    Syntax: `GS ( k 03 00 31 45 n`  
    Sets error correction:  
    - `n=48`: Level L (7%).  
    - `n=49`: Level M (15%, default).  
    - `n=50`: Level Q (25%).  
    - `n=51`: Level H (30%).  
    Example: `1D 28 6B 03 00 31 45 49` (Level M).

  - **Function 180 (QR Code: Store Data)**  
    Syntax: `GS ( k pL pH 31 50 30 d1...dk`  
    Stores QR data: `pL pH` = length (k+3), `d1...dk` = data (1–7096 bytes).  
    Example: For “https://example.com” (20 chars): `pL=23`, `pH=0` → `1D 28 6B 17 00 31 50 30 ...` + ASCII data.

  - **Function 181 (QR Code: Print)**  
    Syntax: `GS ( k 03 00 31 51 30`  
    Prints stored QR code.  
    Example: `1D 28 6B 03 00 31 51 30`.

  - **Function 065–069 (PDF417: Configure)**  
    Similar to QR but for PDF417 (column/row settings, error correction).  
    Use `fn=65–69` for setup, `fn=80` to store data, `fn=81` to print.  
    Example: Set columns `GS ( k 03 00 31 66 n` (`n=0–30`).

**Notes**:  
- QR size depends on data length and module size (`fn=167`). Larger `n` or more data increases size (e.g., 14mm to 20mm with `n=5`).  
- Barcodes must fit 512-dot width; adjust `GS w` or data length.  
- Test with TM-Utility or ESC/POS emulator.  



## Page Mode Overview

Page Mode allows canvas-based printing, unlike Standard Mode’s sequential line-by-line output. It buffers all print data (text, graphics, barcodes) in a defined print area, enabling precise placement via coordinates. Use it for complex layouts requiring absolute positioning, rotated text, or mixed content (e.g., logos with text). Data is composed in memory and printed with `FF`, ensuring alignment but requiring careful management to stay within the 512-dot (72mm) printable width.

### Why Use Page Mode?
- **Precise Positioning**: Place text/graphics at exact coordinates (e.g., `ESC $` for absolute positioning).
- **Flexible Layouts**: Supports text rotation (`ESC V`, `ESC {`), multiple print directions (`ESC T`), and mixed content.
- **Complex Receipts**: Ideal for structured designs (e.g., tables, logos, or multi-column text).
- **Buffered Output**: Composes entire layout before printing, ensuring consistent alignment.

### How to Use Page Mode
1. Enter Page Mode with `ESC L`.
2. Set print area with `ESC W` (max 512 dots wide, height variable).
3. Define print direction with `ESC T` (e.g., left-to-right, top-left origin).
4. Position content using `ESC $` (absolute) or `ESC \` (relative).
5. Add text, graphics, or barcodes.
6. Print and eject with `FF`.
7. Exit to Standard Mode with `ESC S` if needed.

## Page Mode Commands

- **ESC L (Enter Page Mode)**  
  Syntax: `ESC L` (`1B 4C`)  
  Switches to Page Mode for canvas-based printing.

- **ESC S (Enter Standard Mode)**  
  Syntax: `ESC S` (`1B 53`)  
  Exits Page Mode, returns to Standard Mode.

- **ESC W (Set Print Area)**  
  Syntax: `ESC W xL xH yL yH dxL dxH dyL dyH` (`1B 57 ...`)  
  Sets print area (dots):  
  - `(xL xH, yL yH)`: Top-left corner (0,0 default).  
  - `(dxL dxH, dyL dyH)`: Width (≤512), height.  
  Example: `ESC W 0 0 0 0 0 2 0 0` → 512×0 dots (max width).

- **ESC T (Set Print Direction)**  
  Syntax: `ESC T n` (`1B 54 n`)  
  Sets print direction and origin:  
  - `n=0`: Left-to-right (0,0 top-left).  
  - `n=1`: Bottom-to-top (0,0 bottom-left).  
  - `n=2`: Right-to-left (0,0 bottom-right).  
  - `n=3`: Top-to-bottom (0,0 top-right).

- **ESC $ (Set Absolute Position)**  
  Syntax: `ESC $ nL nH` (`1B 24 nL nH`)  
  Sets horizontal position: `position = (nH × 256) + nL` dots.  
  Max 512 dots.  
  Relative to print area’s left edge.

- **ESC \ (Set Relative Position)**  
  Syntax: `ESC \ nL nH` (`1B 5C nL nH`)  
  Moves position relative to current: `offset = (nH × 256) + nL` dots.  
  Positive/negative for right/left.

- **FF (Print and Eject)**  
  Syntax: `FF` (`0C`)  
  Prints all data in Page Mode and ejects.

## Notes
- Fonts: Font A (12×24, 42 columns), Font B (9×17, 56 columns).  
- Margins: ~3.88mm (~27.5 dots) per side (fixed).  
- Page Mode: (0,0) is top-left of print area, set by `ESC W`.  
- Test with TM-Utility or ESC/POS emulator.  
- Refer to TM-T88V ESC/POS manual for full details.



### Character Sizes (Dots) for TM-T88V

- **Font A**: 12×24 dots (width × height, including 2-dot horizontal spacing).
- **Font B**: 9×17 dots (width × height, including 2-dot horizontal spacing).
- Resolution: 180 DPI (~7.09 dots/mm). 1 dot ≈ 0.141mm.
- Printable width: 512 dots (72mm) for 80mm paper.

### Text Size Functions


#### Font Choice:

1. Font A: Larger, more readable (1.69×3.39mm), but fewer characters per line (42 columns max).
- **GS ! (Set Character Size)**:
   - Syntax: `GS ! n` (`1D 21 n` in hex).
   - Parameter `n`: Bitmapped (0–255).
     - Bits 0–2: Width scale (0=1×, 1=2×, ..., 7=8×).
     - Bits 4–6: Height scale (0=1×, 1=2×, ..., 7=8×).
   - Example: `GS ! 0x11` → 2× width, 2× height.

   - Effects:
     - **Font A**:
       - Normal (1×): 12×24 dots.
       - 2× width/height: 24×48 dots.
       - 7× width/height: 84×168 dots.
     - **Font B**:
       - Normal (1×): 9×17 dots.
       - 2× width/height: 18×34 dots.
       - 7× width/height: 63×119 dots.
     - Column capacity decreases (e.g., Font A 42 columns at 1× → ~6 columns at 7×).
     - Text may wrap or clip if exceeding 512-dot width.


2. Font B: Smaller, more compact (1.27×2.40mm), fits more characters (56 columns max).


- **ESC SP (Set Right-Side Character Spacing)**:
   - Syntax: `ESC SP n` (`1B 20 n` in hex).
   - Parameter `n`: Dots (0–255) added to right of each character.

   - Effects:
     - Increases effective width (e.g., Font A 12 dots + `n` dots).
     - Does not affect height or column capacity directly.
     - Example: `ESC SP 2` adds 2 dots (~0.28mm) between characters.

**Notes**:
- Scaling applies to both fonts uniformly.
- Large scales (e.g., 7×) may cause layout issues in 512-dot width.
- Test layouts to ensure readability and fit.


#### Column-Based Layout:
Receipts are column-based, not pixel-based. Calculate text width by columns (e.g., 42 columns × 1.69mm = ~71mm for Font A).

#### Normal Mode
42 Chars wide for Font A, size w:1 h:1

#### Page Mode
41 Chars wide for Font A, size w:1 h:1

note: For some reason, it would cut off the lest character in page mode.


### UI/UX Specs:
Width: Max 72mm (512 dots). Plan for 42 columns (Font A) or 56 columns (Font B).
Height: Line height is ~3.39mm (Font A) or ~2.40mm (Font B) per text line.

Pixel-to-Dot Conversion: For design tools, 1 pixel ≈ 0.141mm (180 DPI).


## ASCII, Hex, and Binary in ESC/POS

**Overview**:  
ESC/POS commands use ASCII, hex, and binary for communication.  

- **ASCII**: Readable characters (e.g., `ESC` = code 27). Used in docs.  
- **Hex**: Two-digit byte representation (e.g., `1B` for `ESC`). Sent to printer.  
- **Binary**: 8-bit values (e.g., `00011011` for `1B`). Used for bit settings.  

**How It Works**:  
- Commands sent as hex bytes (e.g., `1B 21 88` for `ESC ! 0x88`).  
- Printer interprets hex as binary for bit settings (e.g., `0x88` = `10001000`, bold [bit 3], underline [bit 7]).  
- ASCII in docs (e.g., `ESC ! n`) converts to hex/binary for transmission.

**Conversion Example**:  
- Command: `ESC !` for bold + underline.  
- ASCII: `ESC` (27), `!` (33), `n` = `0x88`.  
- Hex: `1B 21 88`.  
- Binary: `00011011 00100001 10001000`.  

**Getting Binary (e.g., `0x88` = `10001000`)**:  
1. Identify desired attributes (e.g., bold [bit 3], underline [bit 7]).  
2. Set bits to 1: Bit 7 = 1, Bit 3 = 1, others 0 → `10001000`.  
3. Convert binary to hex:  
   - Split: `1000 1000`.  
   - Left 4 bits: `1000` = 8 (8×2^3).  
   - Right 4 bits: `1000` = 8 (8×2^3).  
   - Combine: `8 8` = `0x88`.  
4. Alternatively, calculate decimal: `2^7 (128) + 2^3 (8) = 136` → `0x88`.  
5. Send: `ESC ! 0x88` (`1B 21 88`).

**Confusion for Devs working with different data types**:  
- **ASCII vs. Hex**: Docs show `ESC M 0`, but send `1B 4D 00`. Sending ASCII literals fails.  
- **Bit Errors**: Misinterpreting `n` (e.g., decimal 88 vs. `0x88`) breaks commands.  
- **Hex Bytes**: `1B` is one byte, not ASCII `1` + `B`.  
- **Byte Order**: Multi-byte params (e.g., `nL nH`) need correct order.  
- **Debugging**: Use `hexdump -C` to check sent bytes.

**Tips**:  
- Code in hex (e.g., `byte[] cmd = {0x1B, 0x21, 0x88};`).  
- Use ASCII tables (`ESC` = `1B`) and binary for bits.  
- Test with ESC/POS emulator or TM-Utility.

