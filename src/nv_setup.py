# nv_setup.py

from printer_utils.image_processing import process_image_to_raster
from printer_utils.command_utils import construct_store_command, construct_delete_command, construct_check_memory_command
import sys

if __name__ == "__main__":
    image_path = 'printer_utils/images/small-icon.bmp'
    image_id = 1

    # Process the image to raster
    # width, height, img_data = process_image_to_raster(image_path)

    # Construct the command to upload the image to NV memory
    # store_command = construct_store_command(img_data, image_id)


    # For deleting or checking memory, you can simply call the respective functions:
    # check_command = construct_delete_command(image_id)

    check_command = construct_check_memory_command()

    sys.stdout.buffer.write(check_command)

