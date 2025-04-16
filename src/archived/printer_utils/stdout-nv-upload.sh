#!/bin/bash

# Check if the image file exists
IMAGE_PATH="$1"
if [[ ! -f "$IMAGE_PATH" ]]; then
  echo "Error: Image file not found at $IMAGE_PATH"
  exit 1
fi

# Function 67 parameters for TM-T88V
pL="\x0C"  # Data length low byte (can be calculated based on the image size)
pH="\x00"  # Data length high byte (can be calculated based on the image size)
m="\x30"   # Mode for NV bit image
fn="\x43"  # Function number 67
kc1="\x41"  # ASCII character 'A' (first part of the key)
kc2="\x42"  # ASCII character 'B' (second part of the key)

# Function to calculate the data length (pL, pH) based on the image size
function calculate_data_length() {
    local image_width=$1
    local image_height=$2
    local bytes_per_row=$(( (image_width + 7) / 8 ))  # Calculate bytes per row (raster format)
    local total_data_size=$(( bytes_per_row * image_height + 10 ))  # Total size including ESC/POS overhead

    pL=$(printf '\\x%02x' $((total_data_size & 0xff)))  # Low byte
    pH=$(printf '\\x%02x' $(((total_data_size >> 8) & 0xff)))  # High byte
}

# Get the width and height of the image using the 'file' command
image_info=$(file "$IMAGE_PATH")
image_width=$(echo "$image_info" | grep -oP '\d+(?= x \d+)')  # Extract width
image_height=$(echo "$image_info" | grep -oP '(?<=x )\d+')  # Extract height

# Ensure the width does not exceed printer's maximum width (384 pixels for TM-T88V)
if [[ "$image_width" -gt 384 ]]; then
  echo "Error: Image width exceeds the printer's maximum width (384 pixels)"
  exit 1
fi

# Calculate the pL and pH based on image size
calculate_data_length "$image_width" "$image_height"

# Function to generate ESC/POS data to store the image in NV memory
function generate_escpos() {
    local image_path="$1"

    # ESC/POS GS ( L command for defining an NV bit image
    echo -en "\x1d\x28\x4c$pL$pH$m$fn$kc1$kc2"

    # Placeholder for image data (convert image to raster format or use external tool)
    # In real usage, you would convert BMP to ESC/POS compatible raster format here
    echo -en "$(cat "$image_path" | xxd -p | tr -d '\n')"

    # Optionally include cut command
    echo -en "\x1d\x56\x42\x00"  # Full cut command
}

# Output the generated ESC/POS commands to stdout
generate_escpos "$IMAGE_PATH"

