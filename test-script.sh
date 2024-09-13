#!/bin/bash

# Source the commands
source src/commands.sh

# Initialize the printer
init

# Print some text
text "Hello, ESC/POS Printer!"
br 2

# Print a QR code
qrcode 2 5 "https://example.com"
br 2

# Print an image from memory by ID
print_image_by_id 1
br 2

# Cut the paper
cut

