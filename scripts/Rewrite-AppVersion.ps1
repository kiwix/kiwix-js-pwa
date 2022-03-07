# Sets the App Version Number if $INPUT_VERSION is provided, or sets up a nightly version if launched by CRON
# Script is intended to be run by a GitHub Action
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
    "Setting App Version to $VERSION-E in package.json ...`n"
    (Get-Content ./package.json) -replace '(version[''"]:\s*["''])[^"'']+', "`${1}$VERSION-E" | Set-Content ./package.json
} else {
    "No valid INPUT_VERSION or TAG_VERSION were provided. File version numbers were unchanged.`n"
}