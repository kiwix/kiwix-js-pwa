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
        # Convert to all lowercase
        filename="${filename,,}"
        # Restore hyphens in app name
        filename=$(sed 's/kiwix_js_electron/kiwix-js-electron/' <<<"$filename")
        # Handle architecture naming for macOS
        filename=$(sed 's/-darwin-x64/-macos-x64/' <<<"$filename")
        filename=$(sed 's/-darwin-arm64/-macos-arm64/' <<<"$filename")
        filename=$(sed 's/-mac\.zip/-macos.zip/' <<<"$filename")
        if [[ "qq${CRON_LAUNCHED}" != "qq" ]]; then 
            # Delete release number other than SHA if there is a SHA for nightly builds
            filename=$(sed -E 's/_[0-9.]+([-_.])/\1/' <<<"$filename")
            # Add date to filename
            filename=$(sed -E "s/[^_]+(\.[^.]+)$/$CURRENT_DATE\1/" <<<"$filename")
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