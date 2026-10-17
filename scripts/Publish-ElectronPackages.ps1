# Publish Kiwix Electron packages to a GitHub draft release and/or to Kiwix download server
[CmdletBinding()]
param (
    [string]$test = "", # Allows user to test a single package
    [switch]$dryrun = $false,
    [switch]$githubonly = $false,
    [switch]$portableonly = $false, # If true, will only publish the portable package to GitHub, does not affect download.kiwix.org publishing
    [string]$tag = "",
    [string]$overridetarget = "" # Set this to "nightly" to force publication to the nightly folder on download.kiwix.org
)
if ($tag) {
    # If user overrode the INPUT_VERSION, use it
    $INPUT_VERSION = $tag
}
if ($overridetarget) {
    # If user overrode the INPUT_TARGET, use it
    $INPUT_TARGET = $overridetarget
}
$target = "/data/kiwix/release/kiwix-js-electron"
$win_target = "/data/kiwix/release/kiwix-js-windows" # In future, consider changing to kiwix-js-pwa
$keyfile = "$PSScriptRoot\ssh_key"
$keyfile = $keyfile -ireplace '[\\/]', '/'

if ($INPUT_TARGET -eq "nightly") {
    "`nUser manually requested a nightly build..."
    $CRON_LAUNCHED = "1"
}

if ($CRON_LAUNCHED) {
    "`nThis script was launched by the Github Cron prccess"
    $current_date = $(Get-Date -Format "yyyy-MM-dd")
    $target = "/data/kiwix/nightly/$current_date"
}

# Which build this is. $publish_dir and $publish_extra steer publish-github-release.cjs at the
# same artefacts the download.kiwix.org sync picks up further down.
$publish_dir = 'dist/bld/Electron'
$publish_extra = @()
$package_glob = @('dist/bld/Electron/*.*')
if ((Get-Content ./package.json) -match 'nwVersion') { # NWJS
    # NWJS is not built by electron-builder and has no updater, so there are no channel
    # files and nothing belongs on the -E release
    $publish_dir = 'dist/bld/NWJS'
    $publish_extra = @('--no-channel')
    $package_glob = @('dist/bld/NWJS/*.*')
} elseif ((Get-Content ./package.json) -match '"22\.3\.25"') { # Windows 7 version (Electron)
    # This job shares the Electron output directory, so restrict the publish to its own
    # artefacts. Its channel file is renamed to latest-win7.yml, which the filter also matches.
    $publish_extra = @('--only', 'Win7')
    $package_glob = @('dist/bld/Electron/*Win7*.*')
} else {
    $package_glob += @('dist/bld/Electron/nsis-web/*.exe', 'dist/bld/Electron/nsis-web/*.nsis.7z')
}

if (-not $CRON_LAUNCHED) {
    # GitHub publishing is delegated to publish-github-release.cjs, which routes every
    # artefact to the human release, to the -E auto-update channel release, or to both,
    # and rewrites the channel ymls to match. Keeping that logic in one place is what
    # stops the local and CI paths drifting apart. The download.kiwix.org sync below is
    # unaffected and still works from $Packages.
    if (-not $Env:GH_TOKEN -and -not $Env:GITHUB_TOKEN) {
        # Preserve the existing local auth route: gh reads GH_TOKEN or GITHUB_TOKEN
        if ($GITHUB_TOKEN) {
            $Env:GH_TOKEN = $GITHUB_TOKEN
        } elseif (Test-Path "$PSScriptRoot/github_token") {
            $Env:GH_TOKEN = (Get-Content -Raw "$PSScriptRoot/github_token").Trim()
        }
    }
    # Only pass --version when we actually have one: nightlies and plain rebuilds leave it
    # blank, and the script then falls back to the version in package.json, which is the
    # field electron-builder named the artefacts after
    $publish_args = @('--dir', $publish_dir, '--skip-if-no-draft') + $publish_extra
    if ($INPUT_VERSION) { $publish_args = @('--version', $INPUT_VERSION) + $publish_args }
    if ($portableonly) {
        # This path publishes a single portable zip and emits no update metadata
        $publish_args += @('--only', '\.zip$', '--no-channel')
    }
    if ($test) {
        $publish_args += @('--only', [regex]::Escape((Split-Path $test -Leaf)), '--no-channel')
    }
    if (-not $dryrun) { $publish_args += '--upload' }
    "`nPublishing packages to GitHub..."
    & node "$PSScriptRoot/publish-github-release.cjs" @publish_args
    if ($LASTEXITCODE -ne 0) { throw "publish-github-release.cjs failed with exit code $LASTEXITCODE" }
}

# Enumerated only now, after the GitHub publish, because that step renames artefacts whose
# names contain spaces (see normaliseNames in publish-github-release.cjs). Globbing earlier
# would leave this loop holding paths that no longer exist. The renaming is invisible to the
# rules below, which collapse spaces and hyphens to underscores alike.
$Packages = @()
if ($test) {
    $Packages = @($test)
} else {
    foreach ($glob in $package_glob) {
        $glob_dir = Split-Path $glob -Parent
        if (Test-Path $glob_dir) {
            $Packages += @(Get-ChildItem $glob -ErrorAction SilentlyContinue)
        } else {
            Write-Warning "Build directory not found: $glob_dir"
        }
    }
}

if (-not $githubonly) {
    "`nUploading packages to https://master.download.kiwix.org$target/ ...`n"
    if (-Not $dryrun) {
        echo "mkdir $target" | & "C:\Program Files\Git\usr\bin\sftp.exe" @('-P', '30322', '-o', 'StrictHostKeyChecking=no', '-i', "$keyfile", 'kiwix-js-pwa@master.download.kiwix.org')
        # echo "mkdir $win_target" | & "C:\Program Files\Git\usr\bin\sftp.exe" @('-P', '30322', '-o', 'StrictHostKeyChecking=no', '-i', "$keyfile", 'kiwix-js-pwa@master.download.kiwix.org')
    }
    $Packages | % {
        $file = $_
        if ($file -match '\.(exe|zip|msix|appx|7z)$') {
            $directory = $file -replace '^(.+[\\/])[^\\/]+$', '$1'
            $filename = $file -replace '^.+[\\/]([^\\/]+)$', '$1'
            # Convert all spaces and hyphens to underscore
            $filename = $filename -replace '[\s-]', '_'
            $filename = $filename -creplace '_N([_.])', '_NWJS$1'
            # Swap architecture and release number, and remove redundant -win
            $filename = $filename -replace '(windows(?:_XP)?)(.+)_win(_(?:ia32|x64)[^.]*)', '$1$3$2'
            # Convert filename to lowercase
            $filename = $filename.ToLower()
            # Convert back appname to hyphens
            $filename = $filename -replace 'kiwix_js_(electron|windows)', 'kiwix-js-$1'
            # Fix Windows Portable version so that it is clear it is portable for Windows
            $filename = $filename -replace 'electron(?!_(?:setup|win7|web))(.+\.exe)$', 'electron_win_portable$1'
            # Fix Windows Setup version so that it is clear it is a Windows executable
            $filename = $filename -replace 'electron_setup', 'electron_win_setup'
            # Fix Windows Web Setup version so that it is clear it is a Windows executable
            $filename = $filename -replace 'electron_web_setup', 'electron_win_web_setup'
            # Fix Windows appx version so that it is clear it is a Windows 64bit executable
            $filename = $filename -replace 'electron(.+\.appx)$', 'electron_x86-64$1'
            # Change underscore to hyphen in win type and remove redundant E
            $filename = ($filename -creplace '_xp([_.])', '-xp$1') -creplace '_e([_.])', '$1'
            # Move nwjs
            $filename = $filename -replace '-windows(.*)_nwjs', '-nwjs_win$1'
            # Change ia32 to i386
            $filename = $filename -replace 'ia32', 'i386'
            if ($CRON_LAUNCHED) {
                # Remove the version number
                $filename = $filename -replace '_[0-9.]+([-_.])', '$1'
                # Remove any REV ID
                $filename = $filename -replace '_[0-9a-f]{7}([_.])', '$1'
                # Add the date
                $filename = $filename -replace '(\.[^.]+)$', ('_' + $current_date + '$1')
            }
            # Put back together
            $renamed_file = "$directory$filename"
            if ($test -or $dryrun) {
                "`n$file was renamed to $renamed_file"
            } else {
                # Rename the file
                if ($file -ne $renamed_file) {
                    "`nRenaming $file to $renamed_file..."
                    mv $file $renamed_file
                }
                # Replace absolute path with relative, and normalize to forward slashes
                $renamed_file = $renamed_file -replace '^.*?([\\/]bld)', './dist$1' -replace '[\\/]', '/'
                "Copying $renamed_file to $target..."
                & "C:\Program Files\Git\usr\bin\scp.exe" @('-P', '30322', '-o', 'StrictHostKeyChecking=no', '-i', "$keyfile", "$renamed_file", "kiwix-js-pwa@master.download.kiwix.org:$target")
                # DEV: Note that the package is currently uploaded in Push-KiwixRelease, so we don't need to upload it here at this point in time
                # if (!$CRON_LAUNCHED -and $renamed_file -match '\.appx$') {
                #     "Also copying $renamed_file to $win_target..."
                #     $renamed_win_file = $renamed_file -replace 'electron_x86-64', 'windows'
                #     mv $renamed_file $renamed_win_file
                #     & "C:\Program Files\Git\usr\bin\scp.exe" @('-P', '30322', '-o', 'StrictHostKeyChecking=no', '-i', "$keyfile", "$renamed_win_file", "kiwix-js-pwa@master.download.kiwix.org:$win_target")
                # }
            }
        }
    }
}
""
