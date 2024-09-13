#!/bin/bash

# Arguments
bmp_file="$1"
image_id="$2"

# Ensure both the image file path and image ID are provided
if [[ -z "$bmp_file" || -z "$image_id" ]]; then
  echo "Usage: $0 <path_to_image> <image_id>"
  exit 1
fi

# Convert the image ID to a two-digit hex
image_id_hex=$(printf '%02X' "$image_id")

# Call the Python script to convert the image to monochrome and get the image data
image_data=$(python3 convert_image_to_escpos.py "$bmp_file")

# Check if the conversion was successful
if [[ -z "$image_data" ]]; then
  echo "Error: Could not generate image data."
  exit 1
fi

# The length of the image data in hex (adjust as needed)
data_length=$(printf '%04X' $(((${#image_data} / 4) + 10)))

# Output the ESC/POS command to the terminal (stdout) instead of the printer
echo -ne "\x1D\x28\x4C${data_length:2:2}${data_length:0:2}\x30\x31${image_id_hex}\x01\x01${image_data}"

