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
if ($tag_name -NotMatch '^v\d+\.\d+\.\d+') {
  "`nTag name must be in the format " + '"v0.0.0[-text]"!' + "`n"
  exit
}
"`nCreating release for $tag_name..."
$base_tag = $tag_name -replace '^v([\d.]+).*', '$1'
$text_tag = $tag_name -replace '^v[\d.]+-?(.*)$', '$1'
if ($text_tag -eq "") { $text_tag = "Windows" }
$branch = "master"
if ($text_tag -ne "Windows") { $branch = "Kiwix-JS-$text_tag" }
$release_title = "Kiwix JS $text_tag $base_tag UWP"
if ($text_tag -eq "Wikivoyage") { $release_title = "Wikivoyage by Kiwix $base_tage UWP" }
$text_tag
$release_title
$release_body = Get-Content -Raw ("$PSScriptRoot/Kiwix_JS_" + $text_tag + "_Release_Body.md")
$release_body = $release_body -replace '<<base_tag>>', "$base_tag"
# Set up release_params object
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
if (-Not $dryrun) { $release = Invoke-RestMethod @release_params }

# Check that we appear to have created a release
if ($dryrun -or $release.assets_url -imatch '^https:') {
  "The draft release details were successfully created.`n"
  "Searching for assets..."
  $AppxBundle = dir "$PSScriptRoot/../AppPackages/*_$base_tag*_Test/*_$base_tag*.appx*"
  # Check the file exists and it's of the right type
  if ($AppxBundle -and ($AppxBundle.count -eq 1) -and (Test-Path $AppxBundle -PathType leaf) -and 
    ($AppxBundle -imatch '(.*)\.(?:appx|appxbundle|appxupload)$')) {
      "Setting main bundle file to $AppxBundle..."
  } elseif ($AppxBundle.count -ge 2) {
      "More than one file matches that tag!"
      return
  } else {
      "No package matching that tag was found. Aborting."
      return
  }
  # ZIP the remaining assets
  "Compressing remaining assets..."
  $compressed_assets_dir = $AppxBundle -replace '[^/\\]+$', ''
  $compressed_archive = $compressed_assets_dir + "PowerShell.Installation.Script.KiwixWebAppWikiMed_$base_tag.0_Test.zip"
  $AddAppPackage = $compressed_assets_dir + "Add-AppDevPackage*.*"
  $cert_file = $AppxBundle -replace '\.[^.]+$', '.cer'
  "Compressing: $AddAppPackage, $cert_file"
  if (-Not $dryrun) { "$AddAppPackage", "$cert_file" | Compress-Archive -DestinationPath $compressed_archive -Force }
  # Check the compressed file exists
  if ($dryrun -or (Test-Path $compressed_archive -PathType leaf)) {
    "Compression successful`n"
  } else {
    "There was an error compressing assets."
    return
  }

  $upload_assets = @($compressed_archive, $AppxBundle)
  $upload_uri = $release.upload_url -ireplace '\{[^{}]+}', '' 
  "Uploading assets to: $upload_uri..."
  
  ForEach($asset in $upload_assets) {
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
