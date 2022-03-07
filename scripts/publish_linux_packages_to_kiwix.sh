#!/bin/bash
# Script to upload Linux packages to download.kiwix.org
target="/data/download/release/kiwix-js-electron"
if [[ "qq${CRON_LAUNCHED}" != "qq" ]]; then
    echo "This script was launched by the GitHub Cron proces"
    CURRENT_DATE=$(date +'%Y-%m-%d')
    target="/data/download/nightly/$CURRENT_DATE"
fi
echo "Uploading packages to https://download.kiwix.org/$target/"
ssh -o StrictHostKeyChecking=no -i ./scripts/ssh_key ci@download.kiwix.org mkdir -p $target
for file in ./bld/Electron/* ; do
    if [[ $file =~ \.(AppImage|deb|rpm)$ ]]; then
        scp -o StrictHostKeyChecking=no -i ./scripts/ssh_key $file ci@download.kiwix.org:$target
        echo "Copied $file to $target"
    fi
done