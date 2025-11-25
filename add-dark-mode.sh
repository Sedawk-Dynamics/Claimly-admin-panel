#!/bin/bash

# This script adds dark mode classes to common patterns in the admin frontend pages

# Function to add dark mode classes to common elements
add_dark_mode() {
  local file=$1
  
  # Backup the file
  cp "$file" "$file.bak"
  
  # Common replacements for dark mode
  sed -i 's/className="bg-white /className="bg-white dark:bg-dark-900 /g' "$file"
  sed -i 's/className="text-gray-900"/className="text-gray-900 dark:text-white"/g' "$file"
  sed -i 's/className="text-gray-600"/className="text-gray-600 dark:text-gray-400"/g' "$file"
  sed -i 's/className="text-gray-700"/className="text-gray-700 dark:text-gray-300"/g' "$file"
  sed -i 's/className="text-gray-500"/className="text-gray-500 dark:text-gray-400"/g' "$file"
  sed -i 's/className="border-gray-200"/className="border-gray-200 dark:border-dark-800"/g' "$file"
  sed -i 's/className="bg-gray-50 /className="bg-gray-50 dark:bg-dark-950 /g' "$file"
  sed -i 's/className="bg-red-50 /className="bg-red-50 dark:bg-red-950\/30 /g' "$file"
  sed -i 's/className="text-red-700"/className="text-red-700 dark:text-red-400"/g' "$file"
  sed -i 's/className="border-red-200"/className="border-red-200 dark:border-red-800"/g' "$file"
  
  echo "Updated $file with dark mode classes"
}

# Process all page files
for file in src/pages/*.tsx; do
  if [ "$file" != "src/pages/Login.tsx" ]; then  # Skip Login as it's already updated
    add_dark_mode "$file"
  fi
done

echo "Dark mode classes added to all pages!"
