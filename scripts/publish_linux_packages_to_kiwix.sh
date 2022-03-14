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
        # Convert spaces and hyphens to underscores
        filename=$(sed 's/\s/_/g' <<<"$filename")
        filename=$(sed 's/-/_/g' <<<"$filename")
        # Remove unneeded elements
        filename=$(sed -E 's/_E([_.])/\1/' <<<"$filename")
        # Convert to all lowercase
        filename="${filename,,}"
        # Restore hyphens in app name and architecture
        filename=$(sed 's/kiwix_js_electron/kiwix-js-electron/' <<<"$filename")
        filename=$(sed 's/x86_64/x86-64/' <<<"$filename")
        # Normalize 64bit naming convention
        filename=$(sed 's/amd64/x86-64/' <<<"filename")
        # Remove spurious dot
        filename=$(sed -E 's/\.(i686|x86)/_\1/' <<<"$filename")
        # Swap order of architecture and release number
        filename=$(sed -E 's/(electron)(.+)(_(i[36]86|x86)[^.]*)/\1\3\2/' <<<"$filename")
        # Delete release number other than SHA
        filename=$(sed -E 's/_[0-9.]+([-_.])/\1/' <<<"$filename")
        # Put it all together
        renamed_file="$directory$filename"
        if [[ "$file" != "$renamed_file" ]]; then
            mv "$file" "$renamed_file"
        fi
        echo "Copying $renamed_file to $target"
        scp -o StrictHostKeyChecking=no -i ./scripts/ssh_key "$renamed_file" ci@download.kiwix.org:$target
    fi
done