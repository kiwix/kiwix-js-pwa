#!/bin/bash
# Script to publish macOS Electron packages to GitHub draft release
# This is similar to Publish-ElectronPackages.ps1 but for macOS packages only

set -e

echo "Searching for draft release matching version $INPUT_VERSION..."

# Extract base version (e.g., v3.7.8 from v3.7.8-E). The workflow input is legitimately
# blank on a nightly or a plain rebuild, in which case fall back to the version in
# package.json - the field electron-builder named these artefacts after, so it cannot
# disagree with them. Without this an empty base_input matches every draft indiscriminately.
version="${INPUT_VERSION:-$(node -p "require('./package.json').version")}"
base_input=$(echo "$version" | sed -E 's/^v?([0-9.]+[0-9]).*/v\1/')
echo "Resolved base version: $base_input"

# Find draft release matching the version using gh CLI.
# The "-E" auto-update release created by publish-github-release.cjs is a draft too, and its
# tag contains the base version, so it has to be excluded explicitly - `gh release list`
# returns newest first, so it would otherwise win the `head -1` and swallow the macOS
# artefacts that belong on the human release. An exact match on the base tag is preferred,
# with the substring match kept as a fallback for branded tags (vX.Y.Z-WikiMed).
drafts=$(gh release list --repo kiwix/kiwix-js-pwa --json tagName,isDraft --jq ".[] | select(.isDraft == true) | .tagName" | grep -v "^${base_input}-E$" || true)
tag_name=$(echo "$drafts" | grep -Fx -- "$base_input" | head -1)
if [[ -z "$tag_name" ]]; then
  tag_name=$(echo "$drafts" | grep -F -- "$base_input" | head -1)
fi

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
