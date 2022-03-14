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
        $renamed_file = $file -replace '\s', '-'
        $renamed_file = $renamed_file -replace '_', '-'
        $renamed_file = $renamed_file -creplace '-N-', '-NWJS-'
        # Swap architecture and release number, and remove redundant -win
        $renamed_file = $renamed_file -replace '(windows(?:-XP)?)([^\\/]+)-win(-ia32[^.]*)', '$1$3$2'
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
