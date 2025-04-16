#!/bin/bash

source commands-basic.sh

init
enter_page_mode
set_print_direction
define_page_area 0 0 576 400

set_position 0 0
text "Top line"

set_position 0 40
text "Middle line"

set_position 0 80
text "Bottom line"

exit_page_mode
cut

