param (
    [string]$tag_name = "",
    [switch]$dryrun = $false
)

# Provide parameters
$release_uri = 'https://api.github.com/repos/kiwix/kiwix-js-windows/releases'
$github_token = Get-Content -Raw "$PSScriptRoot/github_token"

if ($tag_name -eq "") {
  $tag_name = Read-Host "`nEnter the tag name to use for this release"
}
if ($tag_name -NotMatch '^v\d+\.\d+\.\d+([EN-]|$)') {
  "`nTag name must be in the format " + '"v0.0.0[E][N][-text]"!' + "`n"
  exit
}
"`nCreating release for $tag_name..."
$base_tag = $tag_name -replace '^v([\d.EN]+).*', '$1'
$text_tag = $tag_name -replace '^v[\d.EN]+-?(.*)$', '$1'
if ($text_tag -eq '') { $text_tag = 'Windows' }
$release_title = "Kiwix JS $text_tag $base_tag UWP"
if ($text_tag -eq "Wikivoyage") { $release_title = "Wikivoyage by Kiwix $base_tag UWP" }
$flavour = ''
$init_params = Get-Content -Raw "$PSScriptRoot\..\www\js\init.js"
$file_version = ''
if ($init_params -match 'params\[[''"]fileVersion[''"]]\s*=\s*[''"]([^''"]+)') {
  $file_version = $matches[1] 
}
$zim = ''
$date = ''
if ($file_version) { 
  $zim = ($file_version -replace '\s\([^(]+\)\s*$', '') + '.zim'
  $date = $file_version -replace '^[^(]+\(([^(]+)\)\s*$', '$1'
}
"File Version: $file_version"
"Zim: $zim"
"Date: $date"
$branch = "master"
if ($text_tag -ne "Windows") { $branch = "Kiwix-JS-$text_tag" }
if ($base_tag -match '[EN]$') {
  $flavour = '_' + $matches[0]
  $title_flavour = 'Electron'
  if ($flavour -eq '_N') { 
    $title_flavour = 'NWJS'
    $branch = 'nwjs-en-top' 
  } 
  $release_title = $release_title -replace '([^\s]+)\sUWP$', ("$title_flavour Edition for Win7/Win8/Win10 " + '$1') 
}
"Text tag: $text_tag"
"Base tag: $base_tag"
"Branch: $branch"
"Release title: $release_title"
$release_body = Get-Content -Raw ("$PSScriptRoot/Kiwix_JS_" + $text_tag + $flavour + "_Release_Body.md")
$release_body = $release_body -replace '<<base_tag>>', "$base_tag"
$release_body = $release_body -replace '<<zim>>', "$zim"
$release_body = $release_body -replace '<<date>>', "$date"
# Set up release_params object - for API see https://docs.github.com/en/rest/reference/repos#releases
$release_params = @{
  Uri = $release_uri
  Method = 'POST'
  Headers = @{
    'Authorization' = "token $github_token"
    'Accept' = 'application/vnd.github.everest-preview+json'
  }
  Body = @{
    'tag_name' = $tag_name
    'target_commitish' = $branch
    'name' = $release_title
    'draft' = $true
    'body' = $release_body
  } | ConvertTo-Json
  ContentType = "application/json"
}

# Post to the release server
if (-Not $dryrun) { 
  $release = Invoke-RestMethod @release_params 
} else {
  "[DRYRUN] Release Body:`n$release_body"
}

# Check that we appear to have created a release
if ($dryrun -or $release.assets_url -imatch '^https:') {
  "The draft release details were successfully created.`n"
  "Searching for assets..."
  if ($flavour -eq '_E') {
    # Package electron app
    "Building Electron app"
    if (-Not $dryrun) { npm run package-win }
    "Compressing release package for Electron..."
    $compressed_assets_dir = "$PSScriptRoot/../bld/electron/kiwix-js-windows-win32-ia32"
    $base_dir = "$PSScriptRoot/../bld/electron/"
    $compressed_archive = $base_dir + "Kiwix.JS.$text_tag.$base_tag.zip"
    $AddAppPackage = $base_dir + "Start*.*"
    "Compressing: $AddAppPackage, $compressed_assets_dir to $compressed_archive"
    if (-Not $dryrun) { "$AddAppPackage", "$compressed_assets_dir" | Compress-Archive -DestinationPath $compressed_archive -Force }
    $ReleaseBundle = ''
  } elseif ($flavour -eq '_N') {
    # Package NWJS app if necessary
    $base_dir = "$PSScriptRoot/../bld/nwjs"
    $stubs = @("$base_tag-win-ia32", "$base_tag-win-x64", "XP-$base_tag-win-ia32")
    $found = $true
    $NWJSAssets = @()
    $NWJSAssets = {$NWJSAssets}.Invoke()
    foreach ($stub in $stubs) {
      $NWJSAsset = "$base_dir/kiwix-js-windows-$stub.zip"
      $NWJSAssets.Add($NWJSAsset)
      if (-Not (Test-Path $NWJSAsset -PathType Leaf)) { $found = $false }
    }
    if (-Not $found) {
      "WARNING: One or more NWJS build(s) could not be found."
      if (-Not $dryrun) {
        "Building NWJS apps..."
        & $PSScriptRoot/Build-NWJS.ps1
      }
    }
  } else {
    $ReleaseBundle = dir "$PSScriptRoot/../AppPackages/*_$base_tag*_Test/*_$base_tag*.appx*"
    # Check the file exists and it's of the right type
    if ($ReleaseBundle -and ($ReleaseBundle.count -eq 1) -and (Test-Path $ReleaseBundle -PathType leaf) -and 
      ($ReleaseBundle -imatch '(.*)\.(?:appx|appxbundle|appxupload)$')) {
        "Setting main bundle file to $ReleaseBundle..."
    } elseif ($ReleaseBundle.count -ge 2) {
        "More than one file matches that tag!"
        return
    } else {
        "No package matching that tag was found. Aborting."
        "Tag yielded $ReleaseBundle"
        return
    }
    # ZIP the remaining assets
    "Compressing remaining assets..."
    $compressed_assets_dir = $ReleaseBundle -replace '[^/\\]+$', ''
    $compressed_archive = $compressed_assets_dir + "PowerShell.Installation.Script.KiwixWebAppWikiMed_$base_tag.0_Test.zip"
    $AddAppPackage = $compressed_assets_dir + "Add-AppDevPackage*.*"
    $cert_file = $ReleaseBundle -replace '\.[^.]+$', '.cer'
    "Compressing: $AddAppPackage, $cert_file"
    if (-Not $dryrun) { "$AddAppPackage", "$cert_file" | Compress-Archive -DestinationPath $compressed_archive -Force }
  }
  # Check the compressed file exists
  if ($dryrun -or (Test-Path $compressed_archive -PathType leaf)) {
    "Compression successful`n"
  } else {
    "There was an error compressing assets."
    return
  }
  # Upload the release
  $upload_assets = @($compressed_archive, $ReleaseBundle)
  if ($flavour -eq '_N') { $upload_assets = $NWJSAssets }
  $upload_uri = $release.upload_url -ireplace '\{[^{}]+}', '' 
  "Uploading assets to: $upload_uri..."
  
  ForEach($asset in $upload_assets) {
    if (-Not $asset) { Continue }
    $asset_name = $asset -replace '^.*[\\/]([^\\/]+)$', '$1'
    # Establish upload params
    $upload_params = @{
      Uri = $upload_uri + "?name=$asset_name"
      Method = 'POST'
      Headers = @{
        'Authorization' = "token $github_token"
        'Accept' = 'application/vnd.github.everest-preview+json'
      }
      # Body = [System.IO.File]::ReadAllBytes($upload_file)
      InFile = $asset
      ContentType = 'application/octet-stream'
    }
    "`nUpploading $asset..."
    # Upload asset to the release server
    # $upload = [System.IO.File]::ReadAllBytes($upload_file) | Invoke-RestMethod @upload_params
    if (-Not $dryrun) { $upload = Invoke-RestMethod @upload_params }
    if ($dryrun -or $upload.name -eq $asset_name) {
      if (-Not $dryrun) {
        "Upload successfully posted as " + $upload.url
        "Full details:"
        echo $upload
      } else {
        echo "DRYRUN with these upload parameters:`n" + @upload_params 
      }
    } else {
      "The upload appears to have failed!"
      if ($upload) {
        "The server returned:"
        echo $upload
      } else {
        "The server did not respond."
      }
      return
    }
  }
  "Creating permalink..."
  $permalinkFile = "$PSScriptRoot/../kiwix-js-uwp.html"
  if ($flavour -eq '_N') { $permalinkFile = $permalinkFile -replace 'uwp', 'nwjs' }
  $permalink = Get-Content -Raw $permalinkFile
  $permalink = $permalink -replace 'v[\d.EN]+[^"'']*', $tag_name
  "Looking for: $permalinkFile"
  if (-Not $dryrun) { Set-Content $permalinkFile $permalink }
  else { "`n[DRYRUN] would have written:`n$permalink`n" }
  "Cleaning up..."
  if (-Not $dryrun) { del $compressed_archive }
  "`nDone."
} else {
  "There was an error setting up the release!"
  if ($release) {
    "The server returned:"
    echo $release
  } else {
    "The server did not respond."
  }
}
