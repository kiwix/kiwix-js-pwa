# This is a utility script which helps developers choose sensible values for updating the online implementations
# of this app while testing and developing code in a specific branch. It checks app.js and service-worker.js for consistency,
# and checks that that the underlying branch of a PR has been checked out (rather than the PR itself). It then calls the
# GitHub REST API for dispatching the workflow using the provided values.
#
# IMPORTANT: Ensure that your personal github token is in your local copy of the '/scripts' directory, saved as 'github_token'
#
# You may run this script with commandline switches -machine_name (this could be 'dev'), the -branch_name, and -dryrun (this
# will show the changes that would be made if run without the -dryrun switch). Alternatively, if you do not provide these
# values, you will be prompted with sensible defaults.

# Prevents execution with unrecognized switches
[CmdletBinding()]
param (
    [string]$machine_name = "",
    [string]$target = "",
    [string]$branch_name = "",
    [switch]$dryrun = $false
)

# Provide parameters
$release_uri = 'https://api.github.com/repos/kiwix/kiwix-js-pwa/actions/workflows/publish-docker.yaml/dispatches'

$app_params = Select-String 'appVersion' "$PSScriptRoot\..\www\js\init.js" -List
$serviceworker = Select-String 'appVersion' "$PSScriptRoot\..\service-worker.js" -List
$suggested_build = ''
$app_tag = ''
if ($app_params -match 'params\[[''"]appVersion[''"]]\s*=\s*[''"]([^''"]+)') {
  $app_tag = $matches[1]
} else {
  "*** WARNING: App version is incorrectly set in init.js.`nPlease correct before continuing.`n"
  exit
}
$sw_tag = ''
if ($serviceworker -match 'appVersion\s*=\s*[''"]([^''"]+)') {
  $sw_tag = $matches[1]
  if ($sw_tag -ne $app_tag) {
    "`n*** WARNING: The version in init.js [$app_tag] does not match the version in service-worker.js [$sw_tag]! ***"
    "Please correct before continuing.`n"
    exit
  } else {
    "`nVersion in init.js: $app_tag"
    "Version in service-worker.js: $sw_tag`n"
  }
} else {
  "`n*** WARNING: App version is incorrectly set in service-worker.js.`nPlease correct before continuing.`n"
  exit
}

if (Test-Path $PSScriptRoot/github_token -PathType Leaf) {
  $github_token = Get-Content -Raw "$PSScriptRoot/github_token"
} else {
  Write-Warning "Missing file github_token! Please add it to $PSScriptRoot to run this script.`n"
  $github_token = $false
}

if ($machine_name -eq "") {
  if (-Not $dryrun) {
    $dryrun_check = Read-Host "Is this a dry run? [Y/N]"
    $dryrun = -Not ( $dryrun_check -imatch 'n' )
    If ($dryrun) {
      "[DRYRUN]: Initiating dry run...`n"
    }
  }
}

if ($target -eq "") {
  $target = Read-Host "Which implementation (ghpages or docker) do you wish to update? Enter to accept suggested [ghpages]"
}

if (-Not $target) {
  $target = "ghpages"
}

# If the target doesn't match "docker" or "ghpages", then show an error and exit
if ($target -ne "docker" -and $target -ne "ghpages") {
  ""
  Write-Warning "Target must be either 'docker' or 'ghpages'."
  ""
  exit
}


if ($machine_name -eq "") {
  # If target is ghpages, use 'dev-' as suggested prefix; if it is docker, use 'interim-'
  $suggested_build = $target -eq "ghpages" ? 'dev-' + $app_tag : 'interim-' + $app_tag

  $machine_name = Read-Host "`nGive the name to use for the docker build, or Enter to accept suggested name [$suggested_build]"
  
  if (-Not $machine_name) { 
    $machine_name = $suggested_build
    $warning_message = "Please note that ""$app_tag"" will be used as the appVersion. If you want to change that, press Ctrl-C and re-run this script entering a build number matching 9.9.9."
  } elseif ($machine_name -match '^v?[\d.]+') {
    $warning_message = "*** Please be aware that you have entered a release tag matching the format 9.9.9* [$machine_name], and so it will be used as the appVersion of the container " +
      "and will be visible to users. If this is NOT want you want, press Ctrl-C to abort this script, and re-run with the suggested build number." 
  }
  if ($warning_message) {
    ""
    Write-Warning $warning_message
  }
}

if ($branch_name -eq "") {
  $suggested_branch = &{ git branch --show-current }
  $branch_name = Read-Host "`nGive the branch name to use of the docker build, or Enter to accept [$suggested_branch]"
  if (-Not $branch_name) { $branch_name = $suggested_branch }
  if ($branch_name -imatch '^pr/\d+') {
    "`nWARNING: You appear to have indicated a PR. Please check out the underlying branch to use this script,`nor else run it again and give the branch name at the prompt.`n"
    return
  }

}

"`nMachine name set to: $machine_name"
"Target set to: $target"
"Branch name set to: $branch_name"

if (-Not $dryrun -and -Not $github_token) {
  "`nSupply token to continue.`n"
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
      'ref' = $branch_name
      'inputs' = @{ 
        'version' = $machine_name
        'target' = $target
      }
    } | ConvertTo-Json
    ContentType = "application/json"
}

$dispatch_f = ($dispatch_params | Format-List | Out-String);
"`nDispatch parameters:`n$dispatch_f"
  
# Post to the release server
if (-Not $dryrun) { 
  Invoke-RestMethod @dispatch_params 
  "`nCheck for any error message above. An empty dispatch is normal, and indicates that the command was accepted.`n"
} else {
  "[DRYRUN]: Complete.`n"
}
