from printer_utils.image_processing import process_image_to_raster
from printer_utils.command_utils import construct_store_command, construct_delete_command, construct_check_memory_command
import sys

if __name__ == "__main__":
    # Set the image path and image ID as two ASCII characters
    image_path = 'printer_utils/images/small-icon.bmp'
    image_id = 'AB'  # Image ID must be two ASCII characters

    # Process the image to raster
    width, height, img_data = process_image_to_raster(image_path)

    # Construct the command to upload the image to NV memory using the updated image_id format
    store_command = construct_store_command(img_data, image_id, width, height)

    # Write the store command to stdout (or send to printer)
    sys.stdout.buffer.write(store_command)

    # Alternatively, if you want to delete or check memory, you can call the respective functions:

    # For deleting the image from NV memory by its image ID
    delete_command = construct_delete_command(image_id)
    # sys.stdout.buffer.write(delete_command)

    # For checking NV memory on the printer
    check_command = construct_check_memory_command()
    # sys.stdout.buffer.write(check_command)

