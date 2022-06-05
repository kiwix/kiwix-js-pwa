# Updates the app version in all required places according to the custom value

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
}

if ($VERSION -match '^v?[\d.]') {
    $VERSION = $VERSION -replace '^v', ''
    "`nSetting App Version to $VERSION in service-worker.js and init.js ..."
    (Get-Content ./service-worker.js) -replace '(appVersion\s*=\s*["''])[^"'']+', "`${1}$VERSION" | Set-Content -encoding "utf8BOM" ./service-worker.js
    (Get-Content ./www/js/init.js) -replace '(appVersion..\s*=\s*["''])[^"'']+', "`${1}$VERSION" | Set-Content -encoding "utf8BOM" ./www/js/init.js
    $PackageJson = Get-Content -Raw ./package.json
    $PackageJsonNW = Get-Content -Raw ./package.json.nwjs
    $nwVersion = $PackageJsonNW -match '"build":\s\{[^"]+"nwVersion":\s"([^"'']+)'
    $nwVersion = $matches[1]
    $CustomVersion = $VERSION -replace '^([^-]+).*', '$1-E'
    "Setting App Version to $CustomVersion in package.json ...`n"
    $PackageJson = $PackageJson -replace '("version":\s+")[^"]+', "`${1}$CustomVersion"
    # Remove extra whitespace
    $PackageJson = $PackageJson -replace '\s+$', ''
    # DEV: don't set BOM, as Linux tools crash with it
    Set-Content ./package.json $PackageJson
    if ($nwVersion) {
        $CustomVersion = $CustomVersion -creplace '-E', '-N'
        "Setting package.json.nwjs to $CustomVersion ..."
        $PackageJsonNW = $PackageJsonNW -replace '("version":\s+")[^"]+', "`${1}$CustomVersion"
        $PackageJsonNW = $PackageJsonNW -replace '\s+$', ''
        # DEV: don't set BOM, as Linux tools crash with it
        Set-Content ./package.json.nwjs $PackageJsonNW
        $BuildNWJSScript = Get-Content -Raw ./scripts/Build-NWJS.ps1
        "Setting App Version to $CustomVersion in Build-NWJS.ps1 ..."
        $BuildNWJSScript = $BuildNWJSScript -replace '(appBuild\s*=\s*["''])[^"'']+', ("`${1}$CustomVersion")
        "Setting NWJS build to $nwVersion in Build-NWJS.ps1 ..."
        $BuildNWJSScript = $BuildNWJSScript -replace '(version10\s*=\s*["''])[^"'']+', "`${1}$nwVersion"
        $BuildNWJSScript = $BuildNWJSScript -replace '\s+$', ''
        Set-Content -encoding "utf8BOM" ./scripts/Build-NWJS.ps1 $BuildNWJSScript
    }
} else {
    "No valid INPUT_VERSION or TAG_VERSION were provided. File version numbers were unchanged.`n"
}