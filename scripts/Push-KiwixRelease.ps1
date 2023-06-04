param (
    [string]$filename = "",
    [switch]$tag = $false,
    [switch]$dryrun = $false,
    [switch]$yes = $false,
    [switch]$help = $false
)

function Main {

    # Deal with cases where no directory or filename is entered
    if (($filename -eq "") -and (!$help)) { 
        $filename = Read-Host "Enter the filename to upload to download.kiwix.org/releases/ or ? for help"
        if ($filename -eq "") {
            exit
        }
        ' '
    }

    # Check whether user asked for help
    if (($filename -eq "?") -or ($help)) {
        Get-PushHelp
        exit
    }

    # Download the file from GitHub if a tag was entered
    if ($tag) {
        $tagname = $filename
        # Check if a Github Token is available
        if (-Not $GITHUB_TOKEN) {
            $GITHUB_TOKEN = Get-Content -Raw "$PSScriptRoot/github_token"
        }
        if (-Not $GITHUB_TOKEN) {
            Write-Host "'nError! Please ensure your github_token is available in $PSScriptRoot!`n" -ForegroundColor Red
            exit 1
        }
        $release_params = @{
            Uri = "https://api.github.com/repos/kiwix/kiwix-js-windows/releases"
            Method = 'GET'
            Headers = @{
                'Authorization' = "token $GITHUB_TOKEN"
                'Accept' = 'application/vnd.github.v3+json'
            }
            ContentType = "application/json"
        }
        $releases = Invoke-RestMethod @release_params
        # $releasesJson = $releases | ConvertTo-Json
        # "$releasesJson"
        $release_found = $false
        $release = $null
        "Tag_name is $tagname"
        $base_input = $tagname -replace '^(v[0-9.]+).*', '$1'
        $numeric_tagname = $base_input -replace '^v', ''
        "Base_input should be: $base_input"
        $releases | Where-Object { $release_found -eq $False } | % {
            $release = $_
            # "*** Release tag_name: $release.tag_name"
            if ($release.tag_name -eq $base_input) {
                $release_found = $true
            }
        }
        if ($release_found) {
            if ($dryrun) {
                $release_json = $release | ConvertTo-Json
                "`n[DRYRUN:] Release found: `n$release_json"
            }
        } else {
            Write-Warning "No release matching $tag_name was found on the server!"
            exit 1
        }
        $asset_found = $false
        $asset = $null
        $assets = $release.assets
        $assets | Where-Object { $asset_found -eq $false } | % {
            $asset = $_
            if ($asset.name -imatch '\.appxbundle$') {
                $asset_found = $true
            }
        }
        if ($asset_found) {
            if ($dryrun) {
                $asset_json = $asset | ConvertTo-Json
                "`n[DRYRUN:] Asset found: `n$asset_json"
            }
        } else {
            Write-Warning "No asset matching an appxbundle was found on the server!"
            exit 1
        }
        if ($asset.browser_download_url) {
            $download_url = $asset.browser_download_url 
            "`nDownloading $download_url"
            if (!$dryrun) {
                Invoke-WebRequest $download_url -OutFile $asset.name
            }
        } else {
            Write-Warning "Could not get the download URL for the asset!"
            "$asset_json"
            exit 1
        }
        # We should finally have the file!
        # $filename = dir "$PSScriptRoot/../dist/AppPackages/*_$tagname*_Test/*_$tagname*.appx*"
        $filename = dir "*_$numeric_tagname*.appx*"
        if ($filename -and $filename.count -eq 1) {
            "Setting file to $filename..."
        } elseif ($filename.count -ge 2) {
            "More than one file matches that tag!"
            exit 1
        } else {
            "No package matching that tag was found. Perhaps the download failed?"
            if ($dryrun) {
                exit 1
            }
        }
    }

    # If the path is a file of the right type, ask for confirmation 
    if ((Test-Path $filename -PathType leaf) -and ($filename -imatch '(.*)\.(?:appx|appxbundle|appxupload)$')) {
        $newfilename = $filename -ireplace '^.*\\[^\d]+([\d.]+?)\.0_[^\d]+?(\.appx(?:bundle|upload))$', 'kiwix-js-windows_$1$2'
        $filename = $filename -ireplace '[\\/]', '/'
        $file = $filename -ireplace '^.*/([^/]+$)', '$1'
        $target = '/data/download/release/kiwix-js-windows'
        "$filename is ready to upload to $target ..."
        if ($dryrun) { "DRY RUN: no upload will be made" }
        if (! $yes) {
            $response = Read-Host "Do you wish to proceed? Y/N"
            if ($response -ne "Y") {
                Write-Warning "Aborting upload because user cancelled."
            }
        }
        if ($yes -or $response -eq "Y") {
            $keyfile = "$PSScriptRoot\ssh_key"
            $keyfile = $keyfile -ireplace '[\\/]', '/'
            if ($dryrun) {
                "C:\Program Files\Git\usr\bin\scp.exe -P 30022 -o StrictHostKeyChecking=no -i $keyfile $filename ci@master.download.kiwix.org:$target"
                "echo 'rename $target/$file $target/$newfilename' | C:\Program Files\Git\usr\bin\sftp.exe -P 30022 -o StrictHostKeyChecking=no -i $keyfile ci@master.download.kiwix.org"
            } else {
                # Uploading file
                & "C:\Program Files\Git\usr\bin\scp.exe" @('-P', '30022', '-o', 'StrictHostKeyChecking=no', '-i', "$keyfile", "$filename", "ci@master.download.kiwix.org:$target")
                echo "rename $target/$file $target/$newfilename" | & "C:\Program Files\Git\usr\bin\sftp.exe" @('-P', '30022', '-o', 'StrictHostKeyChecking=no', '-i', "$keyfile", 'ci@master.download.kiwix.org')
                Write-Host "`nDone.`n" -ForegroundColor Green
            }
        }
        $response = $null
        if (-Not $yes -and $asset_found) {
            if ($dryrun) {
                "[DRYRUN:] No file will be deleted, you can answer this question as you wish"
            }
            ""
            $response = Read-Host "Do you wish to delete $filename that we downloaded? Y/N"
            if (!$dryrun -and ($response -eq "Y")) {
                "Deleting..."
                del $filename
            } else {
                "[DRYRUN:] No files were deleted"
            }
        }
        Write-Host "`nAll operations successfully finished.`n" -ForegroundColor Green
    } else {
        "You can only upload a file of type .appx, .appxbundle or .appxupload"
        exit
    }
}
function Get-PushHelp {
@"
    Usage: .\Push-KiwixRelease FILENAME|TAG or ? [-dryrun] [-tag] [-yes] [-help] 
    
    Uploads a UWP app release to download.kiwix.org/releases/. If a tag is entered,
    the script attempts to download the file from GitHub releases before uploading.
    For download to work, ensure you have your GitHub access token in .\scripts\github_token
    To upload to the Kiwix server, ensure you have the ssh_key in .\scripts\ssh_key
    
    FILENAME|TAG    the filename to upload (must be .appx, .appxupload, .appxbundle),
        or ?        or the TAG name (if -tag is set), or ? for help
    -dryrun         tests that the file exists and is of the right type, but does not
                    upload it
    -tag            indicates that a tag name has been supplied rather than a file
    -yes            skip confirmation of upload 
    -help           prints these instructions
    
"@
}

Main
