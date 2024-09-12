
color() {
    local color_code="$1"
    echo "\033[0;${color_code}m"
}

end_color() {
    echo "\033[0m"
}

base() {
  echo "$(basename $0)"
}

