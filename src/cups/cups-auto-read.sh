#!/bin/bash

# Capture job details from CUPS
job_id="$1"
user="$2"
title="$3"
num_copies="$4"
options="$5"

# Directory to store print jobs
intercept_dir="/tmp/cups_intercepted_jobs"
mkdir -p "$intercept_dir"

# Save the print job data
cat > "$intercept_dir/job_${job_id}.raw"

# Exit successfully to inform CUPS
exit 0

