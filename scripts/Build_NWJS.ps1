$builds = @("win-x64", "win-ia32", "win-xp")
$version = "0.50.3"
$versionXP = "0.14.7"
$appBuild = "1.1.4N"
$ZIMbase = "wikipedia_en_100_maxi"
cd $PSScriptRoot
cd ..
foreach ($build in $builds) {
    "Building $build $version..."
    $OBuild = $build
    $sep = '-'
    if ($build -eq "win-xp") {
        $build = "win-ia32"
        $version = $versionXP
        $sep = '-XP-'
    }
    $target = "bld\nwjs\$build-$version\kiwix_js_windows$sep$appBuild"
    $fullTarget = "$target-$build"
    $buildLocation = "node_modules\nwjs-builder-phoenix\caches\nwjs-v$version-$build.zip-extracted\nwjs-v$version-$build\"
    $archiveFolder = "$fullTarget\archives"
    if (Test-Path $fullTarget -PathType container) {
        "Removing directory $fullTarget..."
        rm $fullTarget\* -Recurse
        rm $fullTarget
    }
    md $fullTarget
    # Copy latest binary x64
    cp $buildLocation\* $fullTarget -Recurse
    cp .\package.json, .\pwabuilder-sw.js, .\index.html, .\CHANGELOG.md, .\LICENSE, .\www $fullTarget -Recurse
    "Copying archive..."
    md $archiveFolder
    cp "archives\$ZIMbase*.*", "archives\README.md" $archiveFolder
    "Creating launchers..."
    $launcherStub = ".\bld\nwjs\$build-$version\Start Kiwix JS Windows"
    $foldername = "kiwix_js_windows$sep$appBuild-$build"
    # Batch file
    $batch = '@cd "' + $foldername + '"' + "`r`n" + '@start "Kiwix JS Windows" "nw.exe"' + "`r`n'"
    $batch > "$launcherStub.bat"
    # Shortcut
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$launcherStub.lnk")
    $Shortcut.TargetPath = '%windir%\explorer.exe'
    $Shortcut.Arguments = "$foldername\nw.exe"
    $Shortcut.IconLocation = '%windir%\explorer.exe,12'
    $Shortcut.Save()
    "Compressing folder..."
    Compress-Archive "bld\nwjs\$build-$version\*" "bld\nwjs\$foldername.zip"
    "Build $OBuild finished.`n"
}