#!/bin/bash

# Loop through all text files in the ./GreekTexts directory
for filename in ./GreekTexts/*.txt; do
  # Extract the base name from each file to use in the JSON payload
  base_filename=$(basename "$filename")
  echo "Processing $base_filename"

  # Run the curl command for each file
  curl -X POST -H "Content-Type: application/json" \
  -d "{\"filePath\": \"GreekTexts/$base_filename\"}" \
  http://localhost:3000/insert
done
