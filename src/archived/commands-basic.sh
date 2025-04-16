#!/bin/bash

box_full=$'\xDB'      # █ 
box_medium=$'\xB2'    # ▒
box_square=$'\xFE'    # ■
check=$'\xFB'         # √
cross=$'\xAF'         # ¯
arrow_right=$'\x1A'   # → 
arrow_left=$'\x1B'    # ←
arrow_up=$'\x18'      # ↑
arrow_down=$'\x19'    # ↓
corner_ul=$'\xDA'     # ╔
corner_ur=$'\xBF'     # ╗
corner_ll=$'\xC0'     # ╚
corner_lr=$'\xD9'     # ╝
vertical=$'\xB3'      # │
horizontal=$'\xC4'    # ─
tee_left=$'\xB4'      # ┤
tee_right=$'\xC3'     # ├
tee_up=$'\xC1'        # ┴
tee_down=$'\xC2'      # ┬
plus=$'\xC5'          # ┼


# Initialize printer
init() {
  echo -ne "\x1B@"
  echo -ne "\x1B\x61\x01"  # Center alignment
}


# Print text: "message" [align]
text() {
  local message="$1"
  echo -ne "$message"
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

set_print_direction() {
  echo -ne "\x1B\x54\x00"  # ESC T 0 = Left to right, top to bottom
}

enter_page_mode() {
  echo -ne "\x1B\x4C"  # ESC L
}

exit_page_mode() {
  echo -ne "\x0C"  # FF
}


# set_position() {
#   local x="$1" y="$2"

#   local xL=$(printf '%02X' $((x & 0xFF)))
#   local xH=$(printf '%02X' $((x >> 8)))
#   local yL=$(printf '%02X' $((y & 0xFF)))
#   local yH=$(printf '%02X' $((y >> 8)))

#   echo -ne "\x1B\x24"
#   printf "%b" "$(printf '\\x%s\\x%s\\x%s\\x%s' "$xL" "$xH" "$yL" "$yH")"
# }

define_page_area() {
  local x="$1"
  local y="$2"
  local width="$3"
  local height="$4"

  local xL=$((x & 0xFF))
  local xH=$((x >> 8))
  local yL=$((y & 0xFF))
  local yH=$((y >> 8))
  local wL=$((width & 0xFF))
  local wH=$((width >> 8))
  local hL=$((height & 0xFF))
  local hH=$((height >> 8))

  printf "\x1B\x57"  # ESC W
  printf "\\x%02X\\x%02X\\x%02X\\x%02X\\x%02X\\x%02X\\x%02X\\x%02X" \
    "$xL" "$xH" "$yL" "$yH" "$wL" "$wH" "$hL" "$hH" | xargs printf
}

set_position() {
  local x="$1"
  local y="$2"

  local xL=$((x & 0xFF))
  local xH=$((x >> 8))
  local yL=$((y & 0xFF))
  local yH=$((y >> 8))

  # ESC $ for X (horizontal)
  printf "\x1B\x24"
  printf "\\x%02X\\x%02X" "$xL" "$xH" | xargs printf

  # GS $ for Y (vertical)
  printf "\x1D\x24"
  printf "\\x%02X\\x%02X" "$yL" "$yH" | xargs printf
}

