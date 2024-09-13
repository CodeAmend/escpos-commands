#!/bin/bash

# Source the commands
source src/commands.sh

ver=1
qrsize=15
imageid=1

# Initialize the printer
init

# Print some text
# text "Print test: $ver"
# br 2

# Print a QR code
# qrcode 2 $qrsize "https://example.com"
# br 2

# Print an image from memory by ID
print_image_by_id $imageid
# br 2

# Cut the paper
# cut

