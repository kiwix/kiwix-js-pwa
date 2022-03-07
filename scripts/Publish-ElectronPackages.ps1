# Publish Kiwix Electron packages to Kiwix download server

$target = "/data/download/release/kiwix-js-electron"

if ($CRON_LAUNCHED) {
    "`nThis script was launched by the Github Cron prccess"
    $current_date = $(Get-Date -Format "yyyy-MM-dd")
    $target = "/data/download/nightly/$current_date"
}

"`nUploading packages to https://download.kiwix.org$target/ ...`n"
& "C:\Program Files\Git\usr\bin\ssh.exe" @('-o', 'StrictHostKeyChecking=no', '-i', "$keyfile", 'ci@download.kiwix.org', "mkdir -p $target")
ls bld/Electron/*.* | % {
    if ($_ -match '\.(AppImage|deb|rpm)$') {
        & "C:\Program Files\Git\usr\bin\scp.exe" @('-o', 'StrictHostKeyChecking=no', '-i', "$keyfile", "$_", "ci@download.kiwix.org:$target")
        "Copied $_ to $target"
    }
}
""
