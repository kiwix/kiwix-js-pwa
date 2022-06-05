# Rewrites the draft release on the server to enable Electron cloud building
# Automatic if $INPUT_VERSION is provided, or else explicitly set $from and $to

[CmdletBinding()]
param (
    [switch]$dryrun = $false,
    [string]$from = '',
    [string]$to = ''
)
if ($INPUT_TARGET -eq "nightly") {
    $CRON_LAUNCHED = "1"
}

if ($INPUT_VERSION) {
    $from = $INPUT_VERSION
    if ($from -match '^v[0-9.]+(-WikiMed|-Wikivoyage)?$') {
        $to = $from -replace '^(v[0-9.]+)(.*)$', '$1-E'
    } elseif ($from -cmatch '^v[0-9.]+-E') {
        $to = $from -creplace '-E', ''
    }
}

if (-not $CRON_LAUNCHED) {
    if (-not ($from -and $to)) {
        "`nFrom and To inputs were not provided or could not be determeined automatically!"
        exit 0
    } else {
        "Rewriting draft version from $from to $to..."
    }
    "`nChecking for a draft publishing target on GitHub..."
    if (-not $GITHUB_TOKEN) {
        $GITHUB_TOKEN = Get-Content -Raw "$PSScriptRoot/github_token"
    }
    $draft_release_params = @{
        Uri = "https://api.github.com/repos/kiwix/kiwix-js-windows/releases"
        Method = 'GET'
        Headers = @{
            'Authorization' = "token $GITHUB_TOKEN"
            'Accept' = 'application/vnd.github.v3+json'
        }
        ContentType = "application/json"
    }
    $releases = Invoke-RestMethod @draft_release_params
    $release_found = $false
    $release = $null
    $base_input = $INPUT_VERSION -replace '^(v[0-9.]+).*', '$1'
    $releases | Where-Object { $release_found -eq $False } | % {
        $release = $_
        if (($release.draft -eq $true) -and ($release.tag_name -match $base_input)) {
            $release_found = $true
        }
    }
    if ($release_found) {
        if ($dryrun) {
            $release_json = $release | ConvertTo-Json
            "[DRYRUN:] Draft release found: `n$release_json"
        }
        $release_body_json = @{
            'tag_name' = "$to"
            'draft' = $true
          } | ConvertTo-Json
          # Explicitly encode as UTF8 (or else it will fail with UTF8 characters)
          # $release_body_json = ([System.Text.Encoding]::UTF8.GetBytes($release_body_json))
          
        $release_params = @{
            Uri = $release.url
            Method = 'POST'
            Headers = @{
              'Authorization' = "token $GITHUB_TOKEN"
              'Accept' = 'application/vnd.github.v3+json'
            }
            Body = $release_body_json
            ContentType = "application/json"
          }
          # Post to the release server
          if (-Not $dryrun) { 
            $release = Invoke-RestMethod @release_params
            # Change the INPUT_VERSION
            Set-Variable 'INPUT_VERSION' $to -Scope Global
            "Posted rewrite request to server and setting INPUT_VERSION to $INPUT_VERSION...`n"
          } else {
            "[DRYRUN] Release Body:`n" + ($release_params | ConvertTo-Json)
          }
          
    } else {
        "No draft release matching the tag $INPUT_VERSION was found."
    }
}  

