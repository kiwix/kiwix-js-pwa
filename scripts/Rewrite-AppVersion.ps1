# Sets the App Version Number if $INPUT_VERSION is provided
# Script is intended to be run by a GitHub Action
if ($INPUT_VERSION) {
    $VERSION = $INPUT_VERSION
} else {
    $VERSION = $TAG_VERSION
}
if ($VERSION -match '^v?[\d.]') {
    $VERSION = $VERSION -replace '^v', ''
    "Setting App Version to $VERSION in service-worker.js and init.js ..."
    (Get-Content ./service-worker.js) -replace '(appVersion\s*=\s*["''])[^"'']+', "`${1}$VERSION" | Set-Content -encoding "utf8BOM" ./service-worker.js
    (Get-Content ./www/js/init.js) -replace '(appVersion..\s*=\s*["''])[^"'']+', "`${1}$VERSION" | Set-Content -encoding "utf8BOM" ./www/js/init.js
    "Setting App Version to $VERSION-E in package.json ...`n"
    (Get-Content ./package.json) -replace '(version[''"]:\s*["''])[^"'']+', "`${1}$VERSION-E" | Set-Content ./package.json
} else {
    "No valid INPUT_VERSION or TAG_VERSION were provided. File version numbers were unchanged.`n"
}