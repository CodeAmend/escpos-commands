#!/bin/bash

# Initialize printer
init() {
  echo -ne "\x1B@"
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

# Print image from memory by ID
print_image_by_id() {
  local image_id="$1"
  
  # Ensure image_id is two characters long
  if [ ${#image_id} -ne 2 ]; then
    echo "Error: image_id must be exactly two ASCII characters."
    return 1
  fi

  # Get ASCII values of the two characters
  local kc1=$(printf "%d" "'${image_id:0:1}")  # First character
  local kc2=$(printf "%d" "'${image_id:1:1}")  # Second character

  # Print the command to print image by its ID
  echo -ne "\x1C\x70\x$(printf '%02X' $kc1)\x$(printf '%02X' $kc2)\x00"
}


