param (
    [switch]$only32bit = $false
)
$builds = @("win-ia32", "win-xp")
if (-Not $only32bit) {
    $builds += "win-x64"
    "Caller requested 32bit and 64bit build"
} else {
    "Caller requested 32bitonly build"
}
$version10 = "0.55.0" # <<< value updated automatically from package.json if launched from Create-DraftRelease
$versionXP = "0.14.7"
$appBuild = "1.7.2N" # <<< value updated auotmatically from package.json if launched form Create-DraftRelease
# $ZIMbase = "wikipedia_en_100"
# Check that the dev has included the correct archive in this branch
$init_params = Get-Content -Raw "$PSScriptRoot\..\www\js\init.js"
$PackagedArchive = $init_params -imatch 'params\[.packagedFile.][^;]+?[''"]([^\s]+?\.zim)[''"];'
$archiveExists = $false
if ($PackagedArchive) { 
    $PackagedArchive = $matches[1]
    "`nSearching for packaged archive $PackagedArchive..."
    $archiveExists = Test-Path "$PSScriptRoot\..\archives\$PackagedArchive" -PathType Leaf
}
if (-Not $archiveExists) {
    "`n***** WARNING: PACKAGED ARCHIVE $PackagedArchive COULD NOT BE FOUND IN ARCHIVE FOLDER!!! *****"
    "Please place the requested package in this folder and run script again.`n"
    return
}
"Found."

foreach ($build in $builds) {
    $version = $version10
    $OBuild = $build
    $sep = '-'
    if ($build -eq "win-xp") {
        $build = "win-ia32"
        $version = $versionXP
        $sep = '-XP-'
    }
    "`nBuilding $build $version..."
    $folderTarget = "$PSScriptRoot\..\bld\nwjs\$build-$version"
    $target = "$folderTarget\kiwix_js_windows$sep$appBuild"
    $fullTarget = "$target-$build"
    $ZipLocation = "$PSScriptRoot\..\node_modules\nwjs-builder-phoenix\caches\nwjs-v$version-$build.zip"
    $UnzipLocation = "$ZipLocation-extracted\"
    $buildLocation = "$ZipLocation-extracted\nwjs-v$version-$build\"
    if (-Not (Test-Path $buildLocation -PathType Container)) {
        # We need to download and/or unzip the release, as it is not available
        if (-Not (Test-Path $ZipLocation -PathType Leaf)) {
            $serverFile = "https://dl.nwjs.io/v$version/nwjs-v$version-$build.zip"
            "Downloading $serverFile"
            Invoke-WebRequest -Uri $serverFile -OutFile $ZipLocation
        }
        "Unzipping archive $ZipLocation"
        Expand-Archive $ZipLocation $UnzipLocation
        if (-Not (Test-Path $buildLocation -PathType Container)) {
            "There was an error! The unzipped folder $buildLocation could not be found!"
            return
        }
    }
    $archiveFolder = "$fullTarget\archives"
    if (Test-Path $folderTarget -PathType Container) {
        "Removing directory $folderTarget..."
        rm $folderTarget\* -Recurse
        rm $folderTarget
    }
    md $fullTarget
    # Copy latest binary x64
    cp $buildLocation\* $fullTarget -Recurse
    $root = $PSScriptRoot -replace 'scripts.*$', ''
    cp $root\package.json, $root\pwabuilder-sw.js, $root\index.html, $root\CHANGELOG.md, $root\LICENSE, $root\www $fullTarget -Recurse
    "Copying archive..."
    md $archiveFolder
    cp "$root\archives\$PackagedArchive", "$root\archives\*.txt", "$root\archives\README.md" $archiveFolder
    "Creating launchers..."
    $launcherStub = $PSScriptRoot -replace 'scripts.*$', "bld\nwjs\$build-$version\Start Kiwix JS Windows"
    $foldername = "kiwix_js_windows$sep$appBuild-$build"
    # Batch file
    $batch = '@cd "' + $foldername + '"' + "`r`n" + '@start "Kiwix JS Windows" "nw.exe"' + "`r`n"
    $batch > "$launcherStub.bat"
    # Shortcut
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$launcherStub.lnk")
    $Shortcut.TargetPath = '%windir%\explorer.exe'
    $Shortcut.Arguments = "$foldername\nw.exe"
    $Shortcut.IconLocation = '%windir%\explorer.exe,12'
    $Shortcut.Save()
    # Zip everything up
    $ZipBuild = "$PSScriptRoot\..\bld\nwjs\$foldername.zip"
    if (Test-Path $ZipBuild -PathType Leaf) {
        "Deleting old Zip build $ZipBuild..."
        del $ZipBuild
    }
    "Compressing folder..."
    Compress-Archive "$PSScriptRoot\..\bld\nwjs\$build-$version\*" "$PSScriptRoot\..\bld\nwjs\$foldername.zip" -Force
    "Build $OBuild finished.`n"
}

