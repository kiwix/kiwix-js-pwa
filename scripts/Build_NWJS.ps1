$builds = @("win-x64", "win-ia32", "win-xp")
$version = "0.50.2"
$versionXP = "0.14.7"
$appBuild = "1.1.3N"
$ZIMbase = "wikipedia_en_100_maxi"
cd $PSScriptRoot
cd ..
foreach ($build in $builds) {
    $target = "bld\nwjs\$build-$version\kiwix_js_windows-$appBuild"
    $fullTarget = "$target-$build"
    if ($build -eq "win-xp") {
        $build = "win-ia32"
        $version = $versionXP
    }
    $buildLocation = "node_modules\nwjs-builder-phoenix\caches\nwjs-v$version-$build.zip-extracted\nwjs-v$version-$build\"
    $archiveFolder = "$fullTarget\archives"
    # Remove existing target
    rm $fullTarget\* -Recurse
    md $fullTarget
    # Copy latest binary x64
    cp $buildLocation\* $fullTarget -Recurse
    cp .\package.json, .\pwabuilder-sw.js, .\index.html, .\CHANGELOG.md, .\LICENSE, .\www $fullTarget -Recurse
    md $archiveFolder
    cp "archives\$ZIMbase*.*", "archives\README.md" $archiveFolder
}