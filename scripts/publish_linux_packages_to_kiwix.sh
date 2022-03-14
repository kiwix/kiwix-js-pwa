#!/bin/bash
# Script to upload Linux packages to download.kiwix.org
target="/data/download/release/kiwix-js-electron"
if [[ ${INPUT_TARGET} = "nightly" ]]; then
    CRON_LAUNCHED="1"
fi
if [[ "qq${CRON_LAUNCHED}" != "qq" ]]; then
    echo "This script was launched by the GitHub Cron proces"
    CURRENT_DATE=$(date +'%Y-%m-%d')
    target="/data/download/nightly/$CURRENT_DATE"
fi
echo "Uploading packages to https://download.kiwix.org$target/"
ssh -o StrictHostKeyChecking=no -i ./scripts/ssh_key ci@download.kiwix.org mkdir -p $target
for file in ./bld/Electron/* ; do
    if [[ "$file" =~ \.(AppImage|deb|rpm)$ ]]; then
        directory=$(sed -E 's/[^\/]+$//' <<<"$file")
        filename=$(sed -E 's/[^/]+\///g' <<<"$file")
        filename=$(sed 's/\s/-/g' <<<"$filename")
        filename=$(sed 's/_/-/g' <<<"$filename")
        # Convert to all lowercase
        filename="${filename,,}"
        renamed_file="$directory$filename"
        renamed_file=$(sed 's/-e-/-E-/' <<<"$renamed_file")
        # Normalize 64bit naming convention
        renamed_file=$(sed 's/amd64/x86-64/' <<<"$renamed_file")
        # Remove spurious dot
        renamed_file=$(sed -E 's/\.(i686|x86)/-\1/' <<<"$renamed_file")
        # Swap order of architecture and release number
        renamed_file=$(sed -E 's/(electron)(.+)(-(i[36]86|x86)[^.]*)/\1\3\2/' <<<"$renamed_file")
        if [[ "$file" != "$renamed_file" ]]; then
            mv "$file" "$renamed_file"
        fi
        scp -o StrictHostKeyChecking=no -i ./scripts/ssh_key "$renamed_file" ci@download.kiwix.org:$target
        echo "Copied $renamed_file to $target"
    fi
done