#!/bin/bash

# Initialize printer
init() {
  echo -ne "\x1B@"
  echo -ne "\x1B\x61\x01"  # Center alignment
}

# Print text
text() {
  if [ $# -ne 1 ]; then
    return 1
  fi
  echo -ne "\x1BA\x00\x1BM\x00$1"
}

# Line breaks
br() {
  local lines="${1:-1}"
  for (( i=0; i<$lines; i++ )); do
    echo -ne '\n'
  done
}

# Cut the paper
cut() {
  local cut_type="${1:-1}"
  if [[ "$cut_type" -eq 1 ]]; then
    echo -ne '\x1D\x56\x00'  # Full cut
  else
    echo -ne '\x1D\x56\x01'  # Partial cut
  fi
}

# QR Code printing
qrcode() {
  local model="$1"
  local size="$2"
  local data="$3"

  echo -ne "\x1D\x28\x6B\x03\x00\x31\x41\x$(printf '%02X' $model)"
  echo -ne "\x1D\x28\x6B\x03\x00\x31\x43\x$(printf '%02X' $size)"
  echo -ne "\x1D\x28\x6B\x03\x00\x31\x45\x31"

  local data_length=$((${#data} + 3))
  echo -ne "\x1D\x28\x6B\x$(printf '%02X' $((data_length & 0xFF)))\x$(printf '%02X' $((data_length >> 8)))\x31\x50\x30$data"
  echo -ne '\x1D\x28\x6B\x03\x00\x31\x51\x30'
}

print_image_by_id() {
  local image_id="$1"
  
  # Ensure image_id is two characters long
  if [ ${#image_id} -ne 2 ]; then
    echo "Error: image_id must be exactly two ASCII characters."
    return 1
  fi

  # Get ASCII values of the two characters
  local kc1=$(printf "%02X" "'${image_id:0:1}")  # ASCII code of first character
  local kc2=$(printf "%02X" "'${image_id:1:1}")  # ASCII code of second character

  # Construct the command
  # GS ( L pL pH m fn a kc1 kc2
  echo -ne "\x1D\x28\x4C\x06\x00\x30\x45"
  echo -ne "\x$kc1"
  echo -ne "\x$kc2"
  echo -ne "\x01\x01"
}

print_image() {
  local pathToByteData="$1"
  local width="$2"

  # Read the BMP file in binary mode
  local byteData=$(xxd -p -c 1 "$pathToByteData")

  # Calculate height based on byte data length and width
  local height=$(($(stat -f %z "$pathToByteData") / width))

  # ESC/POS command for raster bit image mode
  local esc_pos_cmd=$(echo -ne '\x1D\x76\x30\x00')

  # Width and height in bytes (in pixels)
  local width_bytes=$(printf "%02x" $((width / 8)))
  local height_bytes=$(printf "%02x" $height)

  # Send ESC/POS command for printing the image
  echo -ne "$esc_pos_cmd"
  echo -ne "\x00$width_bytes\x00$height_bytes\x00"
  
  # Send the image byte data as raw binary
  cat "$pathToByteData"
}


#!/bin/bash

print_image_file() {
  local pathToBmpFile="$1"
  
  # Read the BMP file header to get width and height
  local width=$(xxd -p -s 18 -l 4 "$pathToBmpFile" | xxd -r -p | od -An -t u4)
  local height=$(xxd -p -s 22 -l 4 "$pathToBmpFile" | xxd -r -p | od -An -t u4)

  # ESC/POS command for raster bit image mode
  local esc_pos_cmd=$(echo -ne '\x1D\x76\x30\x00')

  # Width in bytes (1 byte = 8 pixels)
  local width_bytes=$(printf "%02x" $((width / 8)))

  # Height in bytes
  local height_bytes=$(printf "%02x" $height)

  # Send ESC/POS command
  echo -ne "$esc_pos_cmd"
  echo -ne "\x00$width_bytes\x00$height_bytes\x00"

  # Read BMP file's pixel data (skipping the BMP header) and send it
  dd if="$pathToBmpFile" bs=1 skip=54 | lp -d EPSON_TM_T88V
}

