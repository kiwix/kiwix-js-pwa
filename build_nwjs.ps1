$build = "win-x64"
$target = "bld\nwjs\" + $build + "\kiwix_js_windows-0.9.99N"
$X64Location = "node_modules\nwjs-builder-phoenix\caches\nwjs-v0.46.3-win-x64.zip-extracted\nwjs-v0.46.3-win-x64"
$fullTarget = $target + "-" + $build
# $fullTarget
$archiveFolder = $fullTarget + "\archives"
# Remove existing target
rm $fullTarget -Recurse
# md $fullTarget
# Copy latest binary x64
cp $X64Location $fullTarget -Recurse
cp .\package.json, .\pwabuilder-sw.js, .\index.html, .\CHANGELOG.md, .\LICENSE, .\www $fullTarget -Recurse
md $archiveFolder
cp .\archives\wikip*.*, .\archives\README.md $archiveFolder