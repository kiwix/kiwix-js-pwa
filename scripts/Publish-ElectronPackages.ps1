# Publish Kiwix Electron packages to a GitHub draft release and/or to Kiwix download server
[CmdletBinding()]
param (
    [string]$test = "",
    [switch]$dryrun = $false,
    [switch]$githubonly = $false,
    [string]$tag = ""
)
if ($tag) {
    # If user overrode the INPUT_VERSION, use it
    $INPUT_VERSION = $tag
}
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

if ((Get-Content ./package.json) -match 'nwVersion') {
    $Packages = $(ls bld/NWJS/*.*)
} else {
    $packages = $(ls bld/Electron/*.*)
}

if (-not $CRON_LAUNCHED) {
    "`nChecking for a draft publishing target on GitHub..."
    if (-not $GITHUB_TOKEN) {
        $GITHUB_TOKEN = Get-Content -Raw "$PSScriptRoot/github_token"
    }
    $draft_release_params = @{
        Uri = "https://api.github.com/repos/kiwix/kiwix-js-windows/releases"
        Method = 'GET'
        Headers = @{
        'Authorization' = "token $GITHUB_TOKEN"
        'Accept' = 'application/vnd.github.v3+json'
        }
        ContentType = "application/json"
    }
    $releases = Invoke-RestMethod @draft_release_params
    $release_found = $false
    $release = $null
    $releases | Where-Object { $release_found -eq $False } | % {
        $release = $_
        if (($release.draft -eq $true) -and ($release.tag_name -eq $INPUT_VERSION) ) {
            $release_found = $true
        }
    }
    if ($release_found) {
        if ($dryrun) {
            $release_json = $release | ConvertTo-Json
            "[DRYRUN:] Draft release found: `n$release_json"
        }
        $upload_uri = $release.upload_url -ireplace '\{[^{}]+}', '' 
        "`nUploading assets to: $upload_uri..."
        ForEach($asset in $packages) {
            if (-Not $asset) { Continue }
            if (-Not ($asset -match '\.(exe|zip|msix)$')) { Continue }
            # Replace backslash with forward slash
            $asset_name = $asset -replace '^.*[\\/]([^\\/]+)$', '$1'
            # Replace spaces with hyphens
            $asset_name = $asset_name -replace '\s', '-';
            # Establish upload params
            $upload_params = @{
                Uri = $upload_uri + "?name=$asset_name"
                Method = 'POST'
                Headers = @{
                    'Authorization' = "token $GITHUB_TOKEN"
                    'Accept' = 'application/vnd.github.v3+json'
                }
                # Body = [System.IO.File]::ReadAllBytes($upload_file)
                InFile = $asset
                ContentType = 'application/octet-stream'
            }
            "`n*** Uploading $asset..."
            # Upload asset to the release server
            # $upload = [System.IO.File]::ReadAllBytes($upload_file) | Invoke-RestMethod @upload_params
            if (-Not $dryrun) {
                # Disable progress because it causes high CPU usage on large files, and slows down upload
                $ProgressPreference = 'SilentlyContinue'
                $upload = Invoke-RestMethod @upload_params
            }
            if ($dryrun -or $upload.name -eq ($asset_name -replace '\s', '.')) {
                if (-Not $dryrun) {
                    "Upload successfully posted as " + $upload.url
                    "Full details:"
                    echo $upload
                } else {
                    echo "DRYRUN with these upload parameters:`n" + @upload_params 
                }
            } else {
                "`nI'm sorry, this upload appears to have failed! Please upload manually or try again..."
                if ($upload) {
                    "`nThe server returned:"
                    echo $upload
                } else {
                    "The server did not respond."
                }
            }
        }
    } else {
        "No draft release matching the tag $INPUT_VERSION was found."
    }

}  

if (-not $githubonly) {
    "`nUploading packages to https://download.kiwix.org$target/ ...`n"
    & "C:\Program Files\Git\usr\bin\ssh.exe" @('-o', 'StrictHostKeyChecking=no', '-i', "$keyfile", 'ci@download.kiwix.org', "mkdir -p $target")

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
            # Change underscore to hyphen in win type and remove redundant E
            $filename = ($filename -creplace '_xp([_.])', '-xp$1') -creplace '_e([_.])', '$1'
            # Move nwjs
            $filename = $filename -replace '-windows(.*)_nwjs', '-nwjs_win$1'
            # Change ia32 to i386
            $filename = $filename -replace 'ia32', 'i386'
            if ($CRON_LAUNCHED) {
                # Remove the version number
                $filename = $filename -replace '_[0-9.]+([-_.])', '$1'
            }
            # Put back together
            $renamed_file = "$directory$filename"
            if ($test) {
                "`n$file was renamed to $renamed_file"
            } else {
                # Rename the file
                if ($file -ne $renamed_file) {
                    mv $file $renamed_file
                }
                # Replace absolute path with relative, and normalize to forward slashes
                $renamed_file = $renamed_file -replace '^.*?([\\/]bld)', '.$1' -replace '[\\/]', '/'
                "Copying $renamed_file to $target..."
                & "C:\Program Files\Git\usr\bin\scp.exe" @('-o', 'StrictHostKeyChecking=no', '-i', "$keyfile", "$renamed_file", "ci@download.kiwix.org:$target")
            }
        }
    }
}
""
