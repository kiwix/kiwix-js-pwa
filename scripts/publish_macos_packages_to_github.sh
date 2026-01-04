#!/bin/bash
# Script to publish macOS Electron packages to GitHub draft release
# This is similar to Publish-ElectronPackages.ps1 but for macOS packages only

set -e

echo "Searching for draft release matching version $INPUT_VERSION..."

# Extract base version (e.g., v3.7.8 from v3.7.8-E)
base_input=$(echo "$INPUT_VERSION" | sed -E 's/^(v[0-9.]+).*/\1/')

# Find draft release matching the version using gh CLI
tag_name=$(gh release list --repo kiwix/kiwix-js-pwa --json tagName,isDraft --jq ".[] | select(.isDraft == true and (.tagName | contains(\"$base_input\"))) | .tagName" | head -1)

if [[ -z "$tag_name" ]]; then
  echo "ERROR: No draft release found matching version $INPUT_VERSION (base: $base_input)"
  echo "Available draft releases:"
  gh release list --repo kiwix/kiwix-js-pwa --json tagName,isDraft --jq '.[] | select(.isDraft == true) | .tagName'
  exit 1
fi

echo "Found draft release: $tag_name"

# Upload all zip, blockmap, and yml files from dist/bld/Electron
for file in ./dist/bld/Electron/*.{zip,blockmap} ./dist/bld/Electron/latest-mac*.yml; do
  if [[ -f "$file" ]]; then
    # Extract original filename
    original_filename=$(basename "$file")
    # Convert spaces to hyphens for new filename
    new_filename=$(echo "$original_filename" | sed 's/ /-/g')

    # Only rename if the filename contains spaces
    if [[ "$original_filename" != "$new_filename" ]]; then
      new_file="./dist/bld/Electron/$new_filename"
      echo "Renaming: $original_filename -> $new_filename"
      mv "$file" "$new_file"
      file="$new_file"
    fi

    echo ""
    echo "Uploading $(basename "$file") to GitHub..."

    # Upload the file using gh CLI (--clobber replaces if exists)
    if gh release upload "$tag_name" "$file" --repo kiwix/kiwix-js-pwa --clobber; then
      echo "✓ Successfully uploaded $(basename "$file")"
    else
      echo "ERROR: Failed to upload $(basename "$file")"
      exit 1
    fi
  fi
done

echo ""
echo "All macOS packages uploaded successfully to GitHub!"
