#!/bin/bash

image_file=$1
image_id=$2

# Convert image ID to two-digit hex
image_id_hex=$(printf '%02X' $image_id)

# Ensure image and ID are provided
if [ -z "$image_file" ] || [ -z "$image_id" ]; then
  echo "Usage: $0 <image-file> <image-id>"
  exit 1
fi

# Call Python script to convert the image to ESC/POS format
image_data=$(python3 convert_image_to_escpos.py "$image_file")

# Calculate data length for the ESC/POS command
data_length=$(printf '%04X' $((${#image_data}/2 + 10)))

# Send the ESC/POS command for defining NV graphics
# This uses GS ( L with function 67 (\x43) for NV graphics
echo -ne "\x1D\x28\x4C${data_length:2:2}${data_length:0:2}\x30\x43${image_id_hex}\x01\x01${image_data}"

