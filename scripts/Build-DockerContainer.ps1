param (
    [string]$tag_name = "",
    [switch]$dryrun = $false
)

# DEV: To build the Docker container with a masnual dispatch (for testing only), provide an existing tag_name on master

# Provide parameters
$release_uri = 'https://api.github.com/repos/kiwix/kiwix-js-windows/actions/workflows/publish-docker.yaml/dispatches'
$github_token = Get-Content -Raw "$PSScriptRoot/github_token"

if ($tag_name -eq "") {
    $tag_name = Read-Host "`nEnter the existing tag name to use for the manual docker build (e.g. 'v1.4.0')"
    if (-Not $dryrun) {
      $dryrun_check = Read-Host "Is this a dry run? [Y/N]"
      $dryrun = -Not ( $dryrun_check -imatch 'n' )
      If ($dryrun) {
        "Initiating dry run..."
      }
    }
}
if ($tag_name -NotMatch '^v\d+\.\d+\.\d+([EN-]|$)') {
    "`nTag name must be in the format " + '"v0.0.0[E][N][-text]"!' + "`n"
    exit
}

# Set up dispatch_params object - for API see https://docs.github.com/en/rest/reference/actions#create-a-workflow-dispatch-event
$dispatch_params = @{
    Uri = $release_uri
    Method = 'POST'
    Headers = @{
      'Authorization' = "token $github_token"
      'Accept' = 'application/vnd.github.v3+json'
    }
    Body = @{
      'ref' = "master"
      'inputs' = @{ 'version' = $tag_name }
    } | ConvertTo-Json
    ContentType = "application/json"
  }
  
  # Post to the release server
  if (-Not ($dryrun -or $buildonly -or $updatewinget)) { 
    $dispatch = Invoke-RestMethod @dispatch_params 
  } elseif (-Not $updatewinget) {
    "[DRYRUN] Dispatch parameters:`n$dispatch_params`n$tag_name"
    return
  }
"`nServer returned:`n$dispatch"
