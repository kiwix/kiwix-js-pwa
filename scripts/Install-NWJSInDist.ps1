[CmdletBinding()]
param (
    [switch]$min = $false # Use the minified bundle (build-min) instead of the unminified one (build-src)
)
# Builds the app into dist, installs the NWJS manifest there, and leaves the user in dist, ready to run the NWJS SDK
$root = (Resolve-Path "$PSScriptRoot\..").Path
echo ""
# The build empties dist, which fails while an NWJS app launched from dist is still running
if (Get-Process -Name nw -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$root\dist\*" }) {
    Write-Warning "The NWJS app in dist is still running: please close it and try again"
    return
}
Set-Location $root
$buildScript = if ($min) { 'build-min' } else { 'build-src' }
"`nRunning npm run $buildScript..."
npm run $buildScript
if ($LASTEXITCODE -ne 0) {
    Write-Error "npm run $buildScript failed, so the NWJS app was not installed in dist"
    return
}
"`nCopying package.json.nwjs to dist\package.json..."
Copy-Item "$root\package.json.nwjs" "$root\dist\package.json" -Force
Set-Location "$root\dist"
"`nRunning npm install in dist..."
npm install
if ($LASTEXITCODE -ne 0) {
    "`nnpm install failed in dist"
    return
}
Write-Host "`nTo download the SDK and run the NWJS app, type ``npm start``" -ForegroundColor Green
