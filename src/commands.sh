#!/bin/bash

init() {
  echo -en "\x1B@"
}

text() {
  if [ $# -ne 1 ]; then
    echo -e "$(color 31)$(base $0)$(end_color) Usage: $(color 34)<text>$(end_color)"
    exit 1
  fi

  echo -ne "\x1BA\x00\x1BM\x00$1"
}

br() {
  # Default to 1 line break
  local lines="${1:-1}"

  for (( i=0; i<$lines; i++ )); do
    echo -ne '\n'
  done
}


cut() {
  # Default to 1 (full cut)
  local cut_type="${1:-1}"

  if [[ "$cut_type" -eq 1 ]]; then
    echo -ne '\x1D\x56\x00'  # Full cut
  else
    echo -ne '\x1D\x56\x01'  # Partial cut
  fi
}

qrcode() {
  local model="$1"
  local size="$2"
  local data="$3"

  # QR Code Commands
  echo -ne "\x1D\x28\x6B\x03\x00\x31\x41${model}"  # Set QR code model
  echo -ne "\x1D\x28\x6B\x03\x00\x31\x43${size}"   # Set QR code size
  echo -ne "\x1D\x28\x6B\x03\x00\x31\x45\x31"      # Set error correction (medium)

  local length=$(printf '\x%02X' $((${#data}+3)))  # Calculate length of data
  echo -ne "\x1D\x28\x6B${length}\x00\x31\x50\x30${data}"  # Store data
  echo -ne '\x1D\x28\x6B\x03\x00\x31\x51\x30'      # Print the QR code
}

# Prints an image stored in printer memory by ID
print_image_by_id() {
  local image_id="$1"

  # ESC/POS command to print an image from memory
  echo -ne "\x1C\x70${image_id}\x00"  # ESC (0x1C) 'p' image print command
}

