# Publish Kiwix Electron packages to Kiwix download server

$target = "/data/download/release/kiwix-js-electron"
$keyfile = "$PSScriptRoot\ssh_key"
$keyfile = $keyfile -ireplace '[\\/]', '/'

if ($CRON_LAUNCHED) {
    "`nThis script was launched by the Github Cron prccess"
    $current_date = $(Get-Date -Format "yyyy-MM-dd")
    $target = "/data/download/nightly/$current_date"
}

"`nUploading packages to https://download.kiwix.org$target/ ...`n"
& "C:\Program Files\Git\usr\bin\ssh.exe" @('-o', 'StrictHostKeyChecking=no', '-i', "$keyfile", 'ci@download.kiwix.org', "mkdir -p $target")
ls bld/Electron/*.* | % {
    $file = $_
    if ($file -match '\.(exe|zip|msix)$') {
        $renamed_file = $file -replace '\s', '-'
        if ($file -ne $renamed_file) {
            mv $file $renamed_file
        }
        $renamed_file = $renamed_file -replace '^.*?([\\/]bld)', '.$1'
        & "C:\Program Files\Git\usr\bin\scp.exe" @('-o', 'StrictHostKeyChecking=no', '-i', "$keyfile", "$renamed_file", "ci@download.kiwix.org:$target")
        "Copied $renamed_file to $target"
    }
}
""
