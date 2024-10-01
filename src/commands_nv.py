def construct_store_command(image_data, image_id, width, height):
    # Check that image_id is exactly two ASCII characters long
    if len(image_id) != 2:
        raise ValueError("image_id must be exactly two ASCII characters.")

    # Validate key codes are within ASCII range 32–126
    if not (32 <= ord(image_id[0]) <= 126 and 32 <= ord(image_id[1]) <= 126):
        raise ValueError("Key codes must be ASCII characters between 32 and 126.")

    # Validate width and height limits for TM-T88V
    if not (1 <= width <= 8192):
        raise ValueError("Width must be between 1 and 8192 pixels.")
    if not (1 <= height <= 2304):
        raise ValueError("Height must be between 1 and 2304 pixels.")

    store_command = bytearray()

    # GS ( L
    store_command.extend(b'\x1D\x28\x4C')

    # Calculate pL and pH (Parameter Length)
    # Data length = 10 bytes (parameters) + 1 byte ('c') + length of image_data
    data_length = 10 + 1 + len(image_data)
    if not (12 <= data_length <= 65535):
        raise ValueError("Data length out of bounds for Function 67.")

    pL = data_length & 0xFF
    pH = (data_length >> 8) & 0xFF
    store_command.extend([pL, pH])

    # m and fn for Function 67 (defining NV graphics in raster format)
    store_command.extend(b'\x30\x43')  # m = 0x30 ('0'), fn = 0x43 ('C')

    # a (Tone of data)
    a = 0x30  # '0' for Monochrome (TM-T88V uses 48 or 52 for color tone)
    store_command.append(a)

    # kc1 and kc2 (Key codes from image_id)
    kc1 = ord(image_id[0])  # Convert first ASCII character to byte
    kc2 = ord(image_id[1])  # Convert second ASCII character to byte
    store_command.extend([kc1, kc2])

    # b (Number of colors)
    b = 0x01  # 1 for Monochrome (TM-T88V allows 1-4 in expanded mode)
    store_command.append(b)

    # xL, xH (Width in pixels)
    xL = width & 0xFF
    xH = (width >> 8) & 0xFF
    store_command.extend([xL, xH])

    # yL, yH (Height in pixels)
    yL = height & 0xFF
    yH = (height >> 8) & 0xFF
    store_command.extend([yL, yH])

    # [c d1...dk] - c for Color 1 in Monochrome, followed by image data
    c = 0x31  # '1' for Color 1 in Monochrome
    store_command.append(c)
    store_command.extend(image_data)

    return store_command

def construct_delete_command(image_id):
    # Check that image_id is exactly two characters long
    if len(image_id) != 2:
        raise ValueError("image_id must be exactly two ASCII characters.")

    delete_command = bytearray()

    # GS ( L - Delete NV Image command
    delete_command.extend(b'\x1D\x28\x4C')

    # pL and pH for delete command (always 5 bytes of data)
    pL = 5 & 0xFF
    pH = (5 >> 8) & 0xFF
    delete_command.extend([pL, pH])

    # m and fn for delete function (68 in this case)
    delete_command.extend(b'\x30\x44')  # m = 0x30 ('0'), fn = 0x44 ('D')

    # kc1 and kc2 (Key codes from image_id)
    kc1 = ord(image_id[0])  # Convert first ASCII character to byte
    kc2 = ord(image_id[1])  # Convert second ASCII character to byte
    delete_command.extend([kc1, kc2])

    return delete_command

def construct_check_memory_command():
    check_command = bytearray()

    # GS ( L - Check NV Memory command
    check_command.extend(b'\x1D\x28\x4C')

    # pL and pH for check memory command (always 2 bytes of data)
    pL = 2 & 0xFF
    pH = (2 >> 8) & 0xFF
    check_command.extend([pL, pH])

    # m and fn for checking memory
    check_command.extend(b'\x30\x45')  # m = 0x30 ('0'), fn = 0x45 ('E')

    return check_command

def construct_print_command(image_id):
    """
    Construct the ESC/POS command to print an NV image by its image ID.
    """
    if len(image_id) != 2:
        raise ValueError("image_id must be exactly two ASCII characters.")

    # GS ( L pL pH m fn a kc1 kc2
    print_command = bytearray()

    # GS ( L command
    print_command.extend(b'\x1D\x28\x4C')

    # Parameter length (4 bytes)
    pL = 6
    pH = 0
    print_command.extend([pL, pH])

    # m = 0x30, fn = 0x45 (print NV image)
    print_command.extend(b'\x30\x45')

    # kc1 and kc2 (key codes from the image_id)
    kc1 = ord(image_id[0])
    kc2 = ord(image_id[1])
    print_command.extend([kc1, kc2])

    #image scaling x and y dimensions
    print_command.extend(b'\x01\x01')


    return print_command
