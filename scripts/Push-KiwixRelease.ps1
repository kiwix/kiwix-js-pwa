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

    # Construct the filename if a tag was entered
    if ($tag) {
        $tagname = $filename
        $filename = dir "$PSScriptRoot/../AppPackages/*_$tagname*_Test/*_$tagname*.appx*"
        if ($filename -and $filename.count -eq 1) {
            "Setting file to $filename..."
        } elseif ($filename.count -ge 2) {
            "More than one file matches that tag!"
            return
        } else {
            "No package matching that tag was found. Aborting."
            return
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
                "Aborting upload because user cancelled."
                exit
            }
        }
        $keyfile = "$PSScriptRoot\ssh_key"
        $keyfile = $keyfile -ireplace '[\\/]', '/'
        if ($dryrun) {
            "C:\Program Files\Git\usr\bin\scp.exe -o StrictHostKeyChecking=no -i $keyfile $filename ci@download.kiwix.org:$target"
            "C:\Program Files\Git\usr\bin\ssh.exe -o StrictHostKeyChecking=no -i $keyfile ci@download.kiwix.org mv $target/$file $target/$newfilename"  
            "Aborting because this is a dry run."
            exit
        }
        # Uploading file
        # Move-Item $filename $originalpath/$newfilename
        & "C:\Program Files\Git\usr\bin\scp.exe" @('-o', 'StrictHostKeyChecking=no', '-i', "$keyfile", "$filename", "ci@download.kiwix.org:$target")
        & "C:\Program Files\Git\usr\bin\ssh.exe" @('-o', 'StrictHostKeyChecking=no', '-i', "$keyfile", 'ci@download.kiwix.org', "mv $target/$file $target/$newfilename")
        "Done."
    } else {
        "You can only upload a file of type .appx, .appxbundle or .appxupload"
        exit
    }
}
function Get-PushHelp {
@"
    Usage: .\Push-KiwixRelease FILENAME|TAG or ? [-dryrun] [-tag] [-yes] [-help] 
    
    Uploads a UWP app release to download.kiwix.org/releases/
    
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
