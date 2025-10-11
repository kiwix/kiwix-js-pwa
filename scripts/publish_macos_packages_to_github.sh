#!/bin/bash
# Script to publish macOS Electron packages to GitHub draft release
# This is similar to Publish-ElectronPackages.ps1 but for macOS packages only

set -e

echo "Searching for draft release matching version $INPUT_VERSION..."

# Extract base version (e.g., v3.7.8 from v3.7.8-E)
base_input=$(echo "$INPUT_VERSION" | sed -E 's/^(v[0-9.]+).*/\1/')

# Find draft release matching the version
release_json=$(curl -s \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/kiwix/kiwix-js-pwa/releases)

# Find the matching draft release
upload_url=$(echo "$release_json" | jq -r --arg base "$base_input" '.[] | select(.draft == true and (.tag_name | contains($base))) | .upload_url' | head -1 | sed 's/{[^}]*}//')

if [[ -z "$upload_url" ]]; then
  echo "ERROR: No draft release found matching version $INPUT_VERSION (base: $base_input)"
  echo "Available draft releases:"
  echo "$release_json" | jq -r '.[] | select(.draft == true) | .tag_name'
  exit 1
fi

echo "Found draft release. Upload URL: $upload_url"

# Upload all zip, blockmap, and yml files from dist/bld/Electron
for file in ./dist/bld/Electron/*.{zip,blockmap} ./dist/bld/Electron/latest-mac*.yml; do
  if [[ -f "$file" ]]; then
    # Extract filename and convert spaces to hyphens
    filename=$(basename "$file" | sed 's/ /-/g')

    # Determine content type based on file extension
    if [[ "$file" =~ \.zip$ ]]; then
      content_type="application/zip"
    elif [[ "$file" =~ \.yml$ ]]; then
      content_type="application/x-yaml"
    else
      content_type="application/octet-stream"
    fi

    echo ""
    echo "Uploading $filename to GitHub..."

    # Check if asset already exists and delete it
    asset_id=$(echo "$release_json" | jq -r --arg base "$base_input" --arg name "$filename" '.[] | select(.draft == true and (.tag_name | contains($base))) | .assets[] | select(.name == $name) | .id' | head -1)

    if [[ -n "$asset_id" ]]; then
      echo "Asset $filename already exists (ID: $asset_id), deleting..."
      curl -X DELETE \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/kiwix/kiwix-js-pwa/releases/assets/$asset_id"
      echo "Deleted existing asset"
    fi

    # Upload the file
    response=$(curl -X POST \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Content-Type: $content_type" \
      --data-binary @"$file" \
      "${upload_url}?name=${filename}")

    # Check if upload was successful
    upload_name=$(echo "$response" | jq -r '.name')
    if [[ "$upload_name" == "$filename" ]]; then
      echo "✓ Successfully uploaded $filename"
    else
      echo "ERROR: Failed to upload $filename"
      echo "Response: $response"
      exit 1
    fi
  fi
done

echo ""
echo "All macOS packages uploaded successfully to GitHub!"
