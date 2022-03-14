# Publish Kiwix Electron packages to Kiwix download server

$target = "/data/download/release/kiwix-js-electron"
$keyfile = "$PSScriptRoot\ssh_key"
$keyfile = $keyfile -ireplace '[\\/]', '/'

if ($INPUT_TARGET -eq "nightly") {
    "`nUser manually requested a nightly build..."
    $CRON_LAUNCHED = "1"
}

if ($CRON_LAUNCHED) {
    "`nThis script was launched by the Github Cron prccess"
    $current_date = $(Get-Date -Format "yyyy-MM-dd")
    $target = "/data/download/nightly/$current_date"
}

"`nUploading packages to https://download.kiwix.org$target/ ...`n"
& "C:\Program Files\Git\usr\bin\ssh.exe" @('-o', 'StrictHostKeyChecking=no', '-i', "$keyfile", 'ci@download.kiwix.org', "mkdir -p $target")
if ((Get-Content ./package.json) -match 'nwVersion') {
    $Packages = $(ls bld/NWJS/*.*)
} else {
    $packages = $(ls bld/Electron/*.*)
}
$Packages | % {
    $file = $_
    if ($file -match '\.(exe|zip|msix)$') {
        $directory = $file -replace '^(.+[\\/])[^\\/]+$', '$1'
        $filename = $file -replace '^.+[\\/]([^\\/]+)$', '$1'
        # Convert all spaces and hyphens to underscore
        $filename = $filename -replace '[\s-]', '_'
        $filename = $filename -creplace '_N([_.])', '_NWJS$1'
        # Swap architecture and release number, and remove redundant -win
        $filename = $filename -replace '(windows(?:_XP)?)(.+)_win(_ia32[^.]*)', '$1$3$2'
        # Convert filename to lowercase
        $filename = $filename.ToLower()
        # Convert back appname to hyphens
        $filename = $filename -replace 'kiwix_js_(electron|windows)', 'kiwix-js-$1'
        # Fix Windows Setup version so that it is clear it is a Windows executable
        $filename = $filename -replace 'electron_setup', 'electron_win_setup'
        # Convert back the exceptions and remove the -E
        $filename = (($filename -creplace '_xp([_.])', '-XP$1') -creplace '_nwjs([_.])', '_NWJS$1') -creplace '_e([_.])', '$1'
        # Remove the version number
        $filename = $filename -replace '_[0-9.]+(-_.)', '$1'
        # Put back together
        $renamed_file = "$directory$filename"
        if ($file -ne $renamed_file) {
            mv $file $renamed_file
        }
        # Replace absolute path with relative, and normalize to forward slashes
        $renamed_file = $renamed_file -replace '^.*?([\\/]bld)', '.$1' -replace '[\\/]', '/'
        & "C:\Program Files\Git\usr\bin\scp.exe" @('-o', 'StrictHostKeyChecking=no', '-i', "$keyfile", "$renamed_file", "ci@download.kiwix.org:$target")
        "Copied $renamed_file to $target"
    }
}
""
