
# Provide parameters
$tag_name = "v9.8.8-test"
$release_title = "My new release!"
$release_body = "This is a test release. Please delete."
$upload_assets = @('PowerShell.Installation.Script.KiwixWebApp_0.0.0.0_Test.zip')
$release_uri = 'https://api.github.com/repos/kiwix/kiwix-js-windows/releases'
$github_token = Get-Content "$PSScriptRoot/github_token" -Raw

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
    'name' = $release_title
    'draft' = $true
    'body' = $release_body
  } | ConvertTo-Json
  ContentType = "application/json"
}

# Post to the release server
$release = Invoke-RestMethod @release_params

# Check that we appear to have created a release
if ($release.assets_url -imatch '^https:') {
  $upload_uri = $release.upload_url -ireplace '\{[^{}]+}', '' 
  "Uploading assets to: $upload_uri..."
  $upload_file = "$PSScriptRoot\" + $upload_assets[0]
  # Establish upload params
  $upload_params = @{
    Uri = $upload_uri + "?name=" + $upload_assets[0]
    Method = 'POST'
    Headers = @{
      'Authorization' = "token $github_token"
      'Accept' = 'application/vnd.github.everest-preview+json'
    }
    # Body = [System.IO.File]::ReadAllBytes($upload_file)
    InFile = $upload_file
    ContentType = 'application/octet-stream'
  }
  echo $upload_params
  # Upload asset to the release server
  # $upload = [System.IO.File]::ReadAllBytes($upload_file) | Invoke-RestMethod @upload_params
  $upload = Invoke-RestMethod @upload_params
  if ($upload.url -imatch '^https:') {
    "`nUpload successfully posted as " + $upload.url
    "`nFull details:"
    echo $upload
    "Done."
  } else {
    "The upload appears to have failed. The response was:"
    echo $upload
  }
} else {
  "There was an error setting up the release! The server returned:\n\n$release"
}
