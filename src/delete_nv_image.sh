#!/bin/bash

# Check if an argument (image ID) is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <image-id>"
  exit 1
fi

# Convert image ID to a two-digit hexadecimal number
image_id=$1
image_id_hex=$(printf '%02X' "$image_id")

# ESC/POS command for deleting NV graphics by ID
# GS ( L with function 66 (\x42) is used to delete specified NV graphics
echo -ne "\x1D\x28\x4C\x04\x00\x30\x42${image_id_hex}" > /dev/ttyS0

echo "NV image with ID $image_id (hex $image_id_hex) deleted from printer."

