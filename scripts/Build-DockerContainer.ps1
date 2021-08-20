param (
    [string]$tag_name = "",
    [switch]$dryrun = $false
)

# DEV: To build the Docker container with a masnual dispatch (for testing only), provide an existing tag_name on master

# Provide parameters
$release_uri = 'https://api.github.com/repos/kiwix/kiwix-js-windows/actions/workflows/publish-docker.yaml/dispatches'
$github_token = Get-Content -Raw "$PSScriptRoot/github_token"

$init_params = Get-Content -Raw "$PSScriptRoot\..\www\js\init.js"
$pwabuilder = Get-Content -Raw "$PSScriptRoot\..\pwabuilder-sw.js"
$suggested_build = ''
$init_tag = ''
if ($init_params -match 'params\[[''"]version[''"]]\s*=\s*[''"]([^''"]+)') {
  $init_tag = $matches[1]
  $suggested_build = 'v' + $init_tag 
}
$pwabuilder_tag = ''
if ($pwabuilder -match 'appVersion\s*=\s*[''"]([^''"]+)') {
  $pwabuilder_tag = $matches[1]
  if ($pwabuilder_tag -ne $init_tag) {
    "`n*** WARNING: The tag in init.js [$init_tag] does not match the tag in pwabuilder-sw.js [$pwabuilder_tag]! ***"
    "Please correct before continuing.`n"
    exit
  }
}

if ($tag_name -eq "") {
  $tag_name = Read-Host "`nGive the tag name to use for the docker build, or Enter to accept suggested tag, or add any suffix to suggested tag [$suggested_build]"
  if ($tag_name -match '^[EN-]|^$') {
    $split = $suggested_build -imatch '^([v\d.]+)(.*)$'
    if ($split) {
      $tag_name = $matches[1] + $tag_name + $matches[2]
      # Clean up in case there was already a WikiMed or Wikivoyage suffix and we added one
      $tag_name = $tag_name -replace '(\-[^\d.-]+)\-[^\d.]+$', '$1'
    }
    "Tag name set to: $tag_name"
  }
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
"`nServer returned: $dispatch"
"`nAn empty dispatch is normal, and indicates that the command was accepted.`n"
