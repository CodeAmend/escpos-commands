#!/bin/bash

# Source the commands
source commands.sh

ver=1
qrsize=15
imageid="AA"

# Initialize the printer
init

# Print some text
# text "Print test: $ver"
text "Hello World!"
br 2

# Print a QR code
# qrcode 2 $qrsize "https://example.com"
# br 2

# Print an image from memory by ID
print_image_by_id $imageid
br 5

# Cut the paper
# cut

