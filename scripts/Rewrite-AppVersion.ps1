# Sets the App Version Number if $INPUT_VERSION is provided, or sets up a nightly version if launched by CRON
# Script is intended to be run by a GitHub Action, but an input can be provided for testing

[CmdletBinding()]
param (
    [string]$customversion = ''
)

if ($customversion) {
    "`nUser set custom input version: $customversion"
    $INPUT_VERSION = $customversion
}

if ($INPUT_VERSION) {
    $VERSION = $INPUT_VERSION
} elseif ($TAG_VERSION) {
    $VERSION = $TAG_VERSION
} elseif ($CRON_LAUNCHED) {
    $app_params = Select-String 'appVersion' "$PSScriptRoot\..\www\js\init.js" -List
    if ($app_params -match 'params\[[''"]appVersion[''"]]\s*=\s*[''"]([^''"]+)') {
        $app_tag = $matches[1]
        $COMMIT_ID = $(git rev-parse --short HEAD)
        $VERSION = "v$app_tag-$COMMIT_ID"   
    } else {
        "`nCould not construct a valid nightly version number."
    }
}
if ($VERSION -match '^v?[\d.]') {
    $VERSION = $VERSION -replace '^v', ''
    "`nSetting App Version to $VERSION in service-worker.js and init.js ..."
    (Get-Content ./service-worker.js) -replace '(appVersion\s*=\s*["''])[^"'']+', "`${1}$VERSION" | Set-Content -encoding "utf8BOM" ./service-worker.js
    (Get-Content ./www/js/init.js) -replace '(appVersion..\s*=\s*["''])[^"'']+', "`${1}$VERSION" | Set-Content -encoding "utf8BOM" ./www/js/init.js
    $PackageJson = Get-Content -Raw ./package.json
    $nwVersion = $PackageJson -match '"build":\s\{[^"]+"nwVersion":\s"([^"'']+)'
    if ($nwVersion) {
        $nwVersion = $matches[1]
        $BuildNWJSScript = Get-Content -Raw ./scripts/Build-NWJS.ps1
        "Setting App Version to $VERSION" + "N in Build-NWJS.ps1 ..."
        $BuildNWJSScript = $BuildNWJSScript -replace '(appBuild\s*=\s*["''])[^"'']+', ("`${1}$VERSION" + "N")
        "Setting NWJS build to $nwVersion in Build-NWJS.ps1 ..."
        $BuildNWJSScript = $BuildNWJSScript -replace '(version10\s*=\s*["''])[^"'']+', "`${1}$nwVersion"
        Set-Content -encoding "utf8BOM" ./scripts/Build-NWJS.ps1 $BuildNWJSScript
    }
    "Setting App Version to $VERSION (N or -E) in package.json ...`n"
    if ($nwVersion) {
        $CustomVersion = $VERSION + 'N'
    } else {
        $CustomVersion = "$VERSION-E"
    }
    $PackageJson = $PackageJson -replace '("version":\s+")[^"]+', "`${1}$CustomVersion"
    Set-Content ./package.json $PackageJson
} else {
    "No valid INPUT_VERSION or TAG_VERSION were provided. File version numbers were unchanged.`n"
}