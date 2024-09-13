#!/bin/bash

# Source the required files
source ./src/commands.sh
source ./src/helpers.sh

# Function to send commands to the printer
send_to_printer() {
    echo -ne "$1" > /dev/ttyS0
}

# Initialize the printer
send_to_printer "$(init)"

# Print some text
send_to_printer "$(text 'Hello, ESC/POS Printer!')"
send_to_printer "$(br 2)"

# Print a QR code
send_to_printer "$(qrcode 2 5 'https://example.com')"
send_to_printer "$(br 2)"

# # Print an image from memory (assuming you've already transferred an image)
# send_to_printer "$(print_image_by_id 1)"
# send_to_printer "$(br 2)"

# Cut the paper
send_to_printer "$(cut)"

echo "Test print job sent to the printer."
