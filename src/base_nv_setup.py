import sys
from printer_utils.image_processing import process_image_to_raster
from commands_nv import construct_store_command

# from commands_nv import construct_store_command
# from commands_nv import construct_delete_command
# from commands_nv import construct_check_memory_command


if __name__ == "__main__":

    image_path = 'images/small-icon.bmp'
    image_id = 'AB'  # Image ID must be two ASCII characters

    width, height, img_data = process_image_to_raster(image_path)

    command_str = construct_store_command(img_data, image_id, width, height)

    # command_str = construct_delete_command(image_id)

    # command_str = construct_check_memory_command()

    # command_str = construct_print_command(image_id)

    sys.stdout.buffer.write(command_str)

