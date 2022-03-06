#!/bin/bash

# Script to upload Linux packages to download.kiwix.org
target="/data/download/release/kiwix-js-electron"
echo "Uploading the files to https://download.kiwix.org/$target/"
echo "ssh -o StrictHostKeyChecking=no -i ./scripts/ssh_key ci@download.kiwix.org mkdir -p $target"
for file in ./bld/Electron/* ; do
    if [[ $file =~ \.(AppImage|deb|rpm)$ ]]; then
        echo "scp -r -p -o StrictHostKeyChecking=no -i $file ci@download.kiwix.org:$target"
        echo "Copied $file to $target"
    fi
done