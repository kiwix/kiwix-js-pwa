# $build = "win-x64"
$build = "win-ia32"
$version = "0.46.3"
$appBuild = "0.9.9.991N"
$ZIMbase = "wikipedia_en_100"
$target = "bld\nwjs\" + $build + "\kiwix_js_windows-" + $appBuild
$buildLocation = "node_modules\nwjs-builder-phoenix\caches\nwjs-v0.46.3-" + $build + ".zip-extracted\nwjs-v" + $version + "-" + $build + "\"
$fullTarget = $target + "-" + $build
# $fullTarget
$archiveFolder = $fullTarget + "\archives"
# Remove existing target
rm $fullTarget\* -Recurse
md $fullTarget
# Copy latest binary x64
cp $buildLocation\* $fullTarget -Recurse
cp .\package.json, .\pwabuilder-sw.js, .\index.html, .\CHANGELOG.md, .\LICENSE, .\www $fullTarget -Recurse
md $archiveFolder
cp ".\archives\$ZIMbase*.*", .\archives\README.md $archiveFolder