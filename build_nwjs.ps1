$build = "win-x64"
#$build = "win-ia32"
$version = "0.48.3"
#$version = "0.14.7"
$appBuild = "1.0.0N"
$ZIMbase = "wikipedia_en_100_maxi"
$target = "bld\nwjs\$build-$version\kiwix_js_windows-$appBuild"
$buildLocation = "node_modules\nwjs-builder-phoenix\caches\nwjs-v$version-$build.zip-extracted\nwjs-v$version-$build\"
$fullTarget = "$target-$build"
$archiveFolder = "$fullTarget\archives"
# Remove existing target
rm $fullTarget\* -Recurse
md $fullTarget
# Copy latest binary x64
cp $buildLocation\* $fullTarget -Recurse
cp .\package.json, .\pwabuilder-sw.js, .\index.html, .\CHANGELOG.md, .\LICENSE, .\www $fullTarget -Recurse
md $archiveFolder
cp ".\archives\$ZIMbase*.*", .\archives\README.md $archiveFolder