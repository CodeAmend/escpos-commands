# printer_utils/command_utils.py
def construct_store_command(image_data, image_id, width, height):
    # Check that image_id is exactly two characters long
    if len(image_id) != 2:
        raise ValueError("image_id must be exactly two ASCII characters.")

    store_command = bytearray()

    # GS ( L
    store_command.extend(b'\x1D\x28\x4C')

    # Calculate pL and pH (Parameter Length)
    # Data length = 10 bytes (parameters) + 1 byte ('c') + length of image_data
    data_length = 10 + 1 + len(image_data)
    pL = data_length & 0xFF
    pH = (data_length >> 8) & 0xFF
    store_command.extend([pL, pH])

    # m and fn
    store_command.extend(b'\x30\x43')  # m = 0x30 ('0'), fn = 0x43 ('C')

    # a (Tone of data)
    a = 0x30  # '0' for Monochrome
    store_command.append(a)

    # kc1 and kc2 (Key codes from image_id)
    kc1 = ord(image_id[0])  # Convert first ASCII character to byte
    kc2 = ord(image_id[1])  # Convert second ASCII character to byte
    store_command.extend([kc1, kc2])

    # b (Number of colors)
    b = 0x01  # 1 for Monochrome
    store_command.append(b)

    # xL, xH (Width in pixels)
    xL = width & 0xFF
    xH = (width >> 8) & 0xFF
    store_command.extend([xL, xH])

    # yL, yH (Height in pixels)
    yL = height & 0xFF
    yH = (height >> 8) & 0xFF
    store_command.extend([yL, yH])

    # [c d1...dk]
    c = 0x31  # '1' for Color 1 in Monochrome
    store_command.append(c)
    store_command.extend(image_data)

    return store_command

