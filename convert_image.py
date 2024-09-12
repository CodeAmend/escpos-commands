import sys
from PIL import Image

def convert_image_to_monochrome(image_path):
    # Open the image (supports various formats)
    img = Image.open(image_path)

    # Convert image to monochrome (1-bit pixels)
    img = img.convert('1')

    # Get image width and height
    width, height = img.size

    # Ensure the width is divisible by 8 (for byte alignment)
    if width % 8 != 0:
        width += 8 - (width % 8)

    # Convert image data to a list of bytes
    img_data = bytearray()
    
    # Iterate through each row of the image
    for y in range(height):
        row = []
        for x in range(0, width, 8):
            byte = 0
            for bit in range(8):
                if x + bit < img.size[0] and img.getpixel((x + bit, y)) == 0:
                    byte |= (1 << (7 - bit))
            row.append(byte)
        img_data.extend(row)

    # Return the image data as a string of hex bytes
    return ''.join(f'\\x{byte:02X}' for byte in img_data)

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python convert_image.py <path_to_image>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    image_data = convert_image_to_monochrome(image_path)
    print(image_data)

