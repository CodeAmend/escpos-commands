#!/bin/bash

# Source the commands
source commands-basic.sh

ver="1.0"
qrsize=10
img1="AA"
img2="C1"
img3="C2"


# Initialize the printer
init

# Print some text
text "Print test: $ver"
br 2

# Print an image from memory by ID
print_image_by_id $img1
br 4


# Header Section
text "Little Caesars"
br 1
text "Store #1234\n"
text "2125 Woodward Ave\n"
text "Detroit, MI 48201\n"
br 2

# Order Details
text "Order #01234\n"
text "Date: 09/30/2024\n"
text "Cashier: John Doe\n"
br 2

# Itemized Purchase Section
text "Qty  Description         Price\n"
br 1
text "1   Pepperoni Pizza    $10.00\n"
text "2   Crazy Bread        $5.00\n"
text "1   Soda               $2.00\n"
br 2

# Totals Section
text "Subtotal:            $17.00\n"
text "Tax (6%):            $1.02\n"
text "Total:               $18.02\n"
text "Payment:             Cash\n"
br 3



print_image_by_id $img2
br 3

text "Your Unique Code: ABCDE123456789\n"
text "Visit CallofDuty.com to redeem your code"
br 3


# Print a QR code
qrcode 2 $qrsize "https://www.littlecaesars.com"
br 2

text "* Promotion includes a gift with purchase Offer. Offer begins on 11/1/23 (redeemable, but not accessible until 11/10) and ends on 1/31/24. Offer Rewards vary, see Official Rules for all details. Open only to legal residents of the 50 US/DC, Canada (excl. QC), and Mexico who are 18 years or older. Complete a Qualifying Purchase (excluding tax as well as delivery and other fees) of $3.00 USD in the U.S., of $4.99 CAD in Canada, and of $35 MXN for Mexico at a participating Little Caesars location (by 12/31/23) to get an Offer code/register receipt and submit at CallofDuty.LittleCaesars.com to claim an Offer item, subject to verification. Excludes order-online-pay-in-store orders and purchases of gift cards. Activision account required to claim Offer items. Limit: up to 2 Offer claims/day. Max. 40 total hours Dual 2XP play/person (not limited to this Promotion). Offer items and Dual 2XP must be redeemed by 1/31/24. Promotion is subject to Official Rules at CallofDuty.LittleCaesars.com. See Official Rules for how to participate, entry periods, Offer items, all details, and restrictions. Void in QC & where prohibited. Msg&data rates may apply. Sponsor: Little Caesar Enterprises, Inc., 2125 Woodward Ave, Detroit, MI 48201 USA."
br 2

print_image_by_id $img3
br 6

# Cut the paper
cut 1

