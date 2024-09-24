#!/usr/bin/env python3
import sys
import os

# CUPS provides arguments about the job
job_id = sys.argv[1]
user = sys.argv[2]
title = sys.argv[3]
num_copies = sys.argv[4]
options = sys.argv[5]

# Create a directory to store print jobs
os.makedirs("/tmp/cups_intercepted_jobs", exist_ok=True)

# Write the print data to a file
with open(f"/tmp/cups_intercepted_jobs/job_{job_id}.raw", "wb") as f:
    f.write(sys.stdin.buffer.read())

# Send success response to CUPS
sys.exit(0)

