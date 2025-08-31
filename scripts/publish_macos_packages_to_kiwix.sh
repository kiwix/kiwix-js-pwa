#!/bin/bash
# Script to upload macOS packages to download.kiwix.org
target="/data/download/release/kiwix-js-electron"
if [[ ${INPUT_TARGET} = "nightly" ]]; then
    CRON_LAUNCHED="1"
fi
if [[ "qq${CRON_LAUNCHED}" != "qq" ]]; then
    echo "This script was launched by the GitHub Cron process"
    CURRENT_DATE=$(date +'%Y-%m-%d')
    target="/data/download/nightly/$CURRENT_DATE"
fi
echo "Uploading macOS packages to https://download.kiwix.org$target/"
echo "mkdir ${target}" | sftp -P 30022 -o StrictHostKeyChecking=no -i ./scripts/ssh_key ci@master.download.kiwix.org
for file in ./dist/bld/Electron/* ; do
    if [[ "$file" =~ \.zip$ ]]; then
        directory=$(sed -E 's/[^\/]+$//' <<<"$file")
        filename=$(sed -E 's/[^/]+\///g' <<<"$file")
        # Convert spaces to underscores and standardize naming
        filename=$(sed 's/[[:space:]]/_/g' <<<"$filename")
        # Remove unneeded elements and standardize format
        filename=$(sed -E 's/_E([_.])/\1/' <<<"$filename")
        # Convert to all lowercase (compatible with older bash)
        filename=$(echo "$filename" | tr '[:upper:]' '[:lower:]')
        # Restore hyphens in app name
        filename=$(sed 's/kiwix_js_electron/kiwix-js-electron/' <<<"$filename")
        # Handle architecture naming for macOS
        filename=$(sed 's/-darwin-x64/-macos-x64/' <<<"$filename")
        filename=$(sed 's/-darwin-arm64/-macos-arm64/' <<<"$filename")
        filename=$(sed 's/-mac\.zip/-macos.zip/' <<<"$filename")
        if [[ "qq${CRON_LAUNCHED}" != "qq" ]]; then 
            # For nightly builds, create a standardized filename with date
            # Extract architecture if present (arm64 or x64)
            arch=""
            if [[ "$filename" =~ arm64 ]]; then
                arch="_arm64"
            elif [[ "$filename" =~ x64 ]]; then
                arch="_x64"
            fi
            # Create nightly filename format: kiwix-js-electron_macos[_arch]_YYYY-MM-DD.zip
            filename="kiwix-js-electron_macos${arch}_${CURRENT_DATE}.zip"
        fi
        echo "Renaming $file to $filename"
        # Put it all together
        renamed_file="$directory$filename"
        if [[ "$file" != "$renamed_file" ]]; then
            mv "$file" "$renamed_file"
        fi
        echo "Copying $renamed_file to $target"
        scp -P 30022 -o StrictHostKeyChecking=no -i ./scripts/ssh_key "$renamed_file" ci@master.download.kiwix.org:$target
    fi
done