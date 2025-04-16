# printer_utils/image_processing.py

from PIL import Image, ImageOps

def process_image_to_raster(image_path):
    """Converts an image to raster format '1'"""
    img = Image.open(image_path).convert('1')
    width, height = img.size

    # Ensure width is divisible by 8 and pads if necessary
    if width % 8 != 0:
        new_width = width + (8 - (width % 8))
        img = ImageOps.expand(img, border=(0, 0, new_width - width, 0), fill=1)
        width = new_width

    # Convert to raster
    img_data = bytearray()
    for y in range(height):
        for x in range(0, width, 8):
            byte = 0
            for bit in range(8):
                pixel = img.getpixel((x + bit, y))
                if pixel == 0:  # Black pixel
                    byte |= (1 << (7 - bit))
            img_data.append(byte)

    return width, height, img_data

