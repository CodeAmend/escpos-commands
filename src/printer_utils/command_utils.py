# printer_utils/command_utils.py

def construct_store_command(image_data, image_id):
    store_command = bytearray()
    store_command.extend(b'\x1D\x28\x4C')  # GS ( L - Store NV Image command
    store_command.extend([len(image_data) & 0xFF, (len(image_data) >> 8) & 0xFF])  # Data length
    store_command.extend([image_id])  # Image ID
    store_command.extend(image_data)  # Add the rasterized image data
    return store_command

def construct_delete_command(image_id):
    delete_command = bytearray()
    delete_command.extend(b'\x1D\x28\x4C\x04\x00\x30\x42')  # GS ( L - Delete command
    delete_command.extend([image_id])  # Image ID
    return delete_command

def construct_check_memory_command():
    check_command = b'\x1D\x69\x02'  # GS i 2 - Check memory status
    return check_command

