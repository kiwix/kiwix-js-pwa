# Rewrites app manifests to ensure they contain the correct archive and version numbers as given in init.js

[CmdletBinding()]
param (
    [switch]$dryrun = $false
)

# Get the appVersion and archive from init.js
$init_params = Get-Content -Raw "$PSScriptRoot\..\www\js\init.js"
$VERSION = ''
if ($init_params -match 'params\[[''"]appVersion[''"]]\s*=\s*[''"]([^''"]+)') {
    $VERSION = $matches[1]
    $NUMERICVERSION = $VERSION -replace '[-A-Z]+$', ''
}
$FILE = ''
if ($init_params -match 'params\[[''"]packagedFile[''"]]\s*=\s*[^|]+[^''"]*[''"]([^''"]+)') {
    $FILE = $matches[1] 
    ## If the file doesn't match a ZIM archive, empty it
    if ($FILE -notmatch '\.zim$') {
        $FILE = ''
    }
}

if ($VERSION -ne '') {

    "`nUpdating appxmanifests..."
    $FileList = ls *.appxmanifest
    ForEach ($Manifest in $FileList) {
        "Rewriting  $Manifest..."
        $FileContent = (Get-Content $Manifest -Raw)
        $FileContent = $FileContent -ireplace '(<Identity\sName="[^"]+"\sVersion=")[^"]+', "`${1}$NUMERICVERSION.0"
        $FileContent = $FileContent -replace '\s+$', ''
        if (!$dryrun) {
            $FileContent | Set-Content -encoding "utf8BOM" $Manifest
        } else {
            echo "[DRYRUN] Would have written modified $Manifest"
        }
    }

    "`nUpdating jsproj files..."
    $FileList = ls *.jsproj
    ForEach ($Manifest in $FileList) {
        "Rewriting $Manifest..."
        $FileContent = (Get-Content $Manifest -Raw)
        ## Remove any packaged file
        $FileContent = $FileContent -ireplace '<Content\sInclude="archives\\[^.]+\.zim[^"]*"\s+/>\s*', ""
        if ($FILE) {
            $FileContent = $FileContent -ireplace '(<ItemGroup>)(\s+)(?=<Content\sInclude=)', "`${1}`${2}<Content Include=`"archives`\$FILE`" />`${2}"
        }
        $FileContent = $FileContent -replace '\s+$', ''
        if (!$dryrun) {
            $FileContent | Set-Content -encoding "utf8BOM" $Manifest
        } else {
            echo "[DRYRUN] Would have written modified $Manifest"
        }
    }
    "`nDone.`n"
} else {
    "No valid VERSION or FILENAME were found. Manifests were unchanged.`n"
}