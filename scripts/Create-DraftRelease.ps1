[CmdletBinding()]
param (
    [string]$tag_name = "", # Tag name for the release, e.g., v1.3.0
    [switch]$dryrun = $false, # If set, will not create a release or upload assets
    [switch]$nobundle = $false, # If set, skips the bundling stage with rollup 
    [switch]$draftonly = $false, # If set, will create a draft release only with no assets attached
    [switch]$buildonly = $false, # If set, will build only and not create a release
    [switch]$buildalluwp = $false, # Will build both the legacy UWP and the Electron-based appx, incrementing the version number between the builds
    [switch]$buildstorerelease = $false, # If set, will build a Store release (UWP and Electron appxbundle)
    [switch]$skipsigning = $false, # Does not sign either the UWP appxbundle or the Electron Windows apps
    [string]$electronbuild = "", # Determines whether the Electron apps will be built 'local' or in the 'cloud'
    [switch]$portableonly = $false, # If set, only the portable electron build will be built. Implies local electron build.
    [string]$winonly = "", # Flag for the Electron build: if set to any value, will build only Windows Electron apps. Set to "appx" to build only the appx package for Electron.
    [switch]$nobranchcheck = $false, # If set, will not check that the current branch is correct for the type of app to build
    [switch]$updatewinget = $false, # If set, will update the winget manifest and create a PR
    [string]$wingetprompt = "", # Provide an override response (Y/N) to the winget prompt at the end of the script - for automation
    [switch]$help = $false # If invoked with -help, will display help on valid switches
)
# DEV: To build new icons, install electron-icon-builder, then
# electron-icon-builder --input=C:\Repos\kiwix-js-windows\bld\icon.png --output=./build_resources/
# then move icons in png into /build_resources/icons/

function Get-ReleaseHelp {
@"

    Usage: .\Create-DraftRelease [tag_name or ?] [-dryrun] [-nobundle] [-draftonly] [-buildonly]
        [-buildstorerelease] [-skipsigning] [-electronbuild local|cloud] [-portableonly] 
        [-winonly Y|appx] [-nobranchcheck] [-updatewinget] [-wingetprompt Y|N] [-help] 
    
    Optionally drafts a new release of the app on GitHub and/or builds and uploads binaries for a
    UWP, Electron or NWJS release of the app, or combinations thereof. If no parameters are provided,
    the script will operate in guided mode, prompting for a tag name and other parameters. It will
    then draft or build a release as appropriate. To run in automated contexts, ensure minimum
    parameters are provided to prevent any prompt (try first with -dryrun).

    To build the base app, check out main before running this script. To build the WikiMed or Wikivoyage
    apps, check out the appropriate branch before running this script and add -WikiMed or -Wikivoyage to
    the end of tag_name. To build Linux apps locally, the script will use Windows Subsystem for Linux.
    MacOS is not currently supported by this repository, but it is supported by electron-builder. 
    
    To create a release on GitHub, you must ensure that your GitHub token is available in a file named
    'github_token' in the same folder or set the variable `$GITHUB_TOKEN to the token. To build the
    Electron and NWJS apps, this script calls scripts Build-Electron.ps1 and Build-NWJS.ps1, which must be
    available in the same folder. Ensure the electron-builder dependency is installed with npm install.
    To build the UWP app, Visual Studio 2017 must be installed. To sign the UWP appxbundle and local
    Electron builds, you must ensure that your certificate and password are given in the environment
    variables CSC_LINK and CSC_KEY_PASSWORD (this is an electron-builder requirement).
    
    tag_name            Tag name for the release plus E or N modifiers, e.g.,
                        v1.2.0[-WikiMed|Wikivoyage] : will build the UWP app;
                        v1.2.0E[-WikiMed|Wikivoyage] : will build Electron apps
                        v1.2.0+E : will build the UWP app plus Electron
                        v1.2.0+E+N : will build the UWP app plus Electron and NWJS
                        v1.2.0E+N : will build Electron and NWJS apps only
                        v1.2.0N : will build NWJS apps only
    -dryrun             Will not create a release or upload assets, but will simulate all operations
    -nobundle           Skips the bundling stage with rollup 
    -draftonly          Will create a draft release only with no assets attached
    -buildonly          Will build only and not create a release
    -buildalluwp        Will build both the legacy UWP and the Electron-based appx, incrementing the
                        version number between the builds; there is no need to set the -buildstorerelease flag
                        if you use this option, as sensible defaults will be used
    -buildstorerelease  Will build a Store release (UWP and Electron appxbundle)
    -skipsigning        Does not sign or re-sign either the UWP appxbundle or the Electron Windows apps
    -electronbuild      Set to 'local' to build Electron apps locally, or 'cloud' to build on GitHub
    -portableonly       Only the portable electron build will be built (implies local electron build)
    -winonly            If set to any value, will build only Windows Electron apps; set to 'appx' to
                        build only the appx package for Electron
    -nobranchcheck      Will not check that the current branch is correct for the type of app to build
                        (i.e., WikiMed or Wikivoyage)
    -updatewinget       Will update the winget manifest and create a PR
    -wingetprompt       Provide an override response (Y/N) to the winget prompt at the end of the script
    -help or ?          Prints these instructions
    
"@
}

if ($help -or $tag_name -eq '?') {
  Get-ReleaseHelp
  exit
}

# Provide parameters
$release_uri = 'https://api.github.com/repos/kiwix/kiwix-js-windows/releases'
if ($GITHUB_TOKEN) {
  $github_token = $GITHUB_TOKEN
} else {
  $github_token = Get-Content -Raw "$PSScriptRoot/github_token"
}
$init_params = Get-Content -Raw "$PSScriptRoot\..\www\js\init.js"
$serviceworker = Select-String 'appVersion' "$PSScriptRoot\..\service-worker.js" -List

$file_tag = ''
if ($init_params -match 'params\[[''"]appVersion[''"]]\s*=\s*[''"]([^''"]+)') {
  $file_tag_numeric = $matches[1] -replace '[A-Za-z-]+$', ''
  $file_tag = 'v' + $matches[1] 
} else {
  "`n*** WARNING: App version is incorrectly set in init.js.`nPlease correct before continuing.`n"
  exit
}
if (-Not (Test-Path $PSScriptRoot/../node_modules -PathType Container)) {
  mv $PSScriptRoot/../node_modules_electron $PSScriptRoot/../node_modules
  if (-Not (Test-Path $PSScriptRoot/../node_modules -PathType Container)) { 
    "`n*** WARNING: Cannot find node_modules folder and cannot rename it!`n"
    exit
  }
  "`nWe renamed node_modules_electron to node_modules."
}

$sw_tag = ''
if ($serviceworker -match 'appVersion\s*=\s*[''"]([^''"]+)') {
  $sw_tag = 'v' + $matches[1]
  if ($sw_tag -ne $file_tag) {
    Write-Host "`n*** WARNING: The version in init.js [$file_tag] does not match the version in service-worker.js [$sw_tag]! ***" -ForegroundColor Red
    "Please correct before continuing.`n"
    exit 1
  } else {
    Write-Host "`nVersion in init.js: $file_tag" -ForegroundColor Cyan
    Write-Host "Version in service-worker.js: $sw_tag" -ForegroundColor Cyan
  }
} else {
  "`n*** WARNING: App version is incorrectly set in service-worker.js.`nPlease correct before continuing.`n"
  exit
}

# Set overrides if user requested building both legacy and Electron-based UWP apps
if ($buildalluwp) {
  $buildonly = $true
  $buildstorerelease = $true
  $plus_electron = $true
  $electronbuild = 'local'
  $winonly = 'appx'
}

if ($tag_name -eq "") {
  "`nTip: You can type '-WikiMed' or '-Wikivoyage' to modify given tag, or simply add modifying suffixes:"
  "E = Electron; N = NWJS; +E = UWP + Electron; E+N = Electron + NWJS; +E+N = UWP + Electron + NWJS"
  $tag_name = Read-Host "`nEnter the tag name for this release, Enter to accept suggested tag, or use modifiers above [$file_tag]"
  if ($tag_name -match '^[+EN-]|^$') {
    $split = $file_tag -imatch '^([v\d.]+)(.*)$'
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
  if ($draftonly) {
    "Creating a draft release only with no assets attached."
  } elseif (-Not ($buildonly -or $updatewinget)) {
    $buildonly_check = Read-Host "Do you wish to Build only, or build and Release? [B/R]"
    $buildonly = -Not ( $buildonly_check -imatch 'r' )
    If ($buildonly) {
      "Packages will be built, but not uploaded for release."
    }
  }
}
if ($tag_name -NotMatch '^v\d+\.\d+\.\d+([+EN-]|$)') {
  "`nTag name must be in the format " + '"v0.0.0[E][N][-text]"!' + "`n"
  exit
}
if ($updatewinget) {
  "`nUpdating winget repository only..."
} else {
  "`nCreating release for $tag_name...`n"
}
$tag_name = $tag_name -creplace '-E', 'E'
$base_tag = $tag_name -creplace '^v([\d.EN]+).*', '$1'
$text_tag = $tag_name -creplace '^v[\d.EN+]+-?(.*)$', '$1'
$numeric_tag = $base_tag -creplace "([\d.]+)[EN]", '$1'
$old_windows_support = $tag_name -cmatch '\+N'
$plus_electron = $tag_name -cmatch '\+E'
if ($buildalluwp) { $plus_electron = $true }
if ($text_tag -eq '') { $text_tag = 'Windows' }
# Put the dash back in the tag name
if (-not $plus_electron) {
  $tag_name = $tag_name -replace '-?([EN])', '-$1'
  $base_tag = $base_tag -replace '-?([EN])', '-$1'
}
$release_title = "Kiwix JS $text_tag $base_tag UWP"
if ($text_tag -imatch 'Wikivoyage|WikiMed') { $release_title = "$text_tag by Kiwix UWP $base_tag" }
$flavour = ''
$file_version = ''
if ($init_params -match 'params\[[''"]fileVersion[''"]]\s*=\s*(?:getSetting\([''"]fileVersion[''"]\)\s*\|\|\s*)?[''"]([^''"]+)') {
  $file_version = $matches[1] 
}
$zim = ''
$date = ''
if ($file_version) { 
  $zim = ($file_version -replace '\s\([^(]+\)\s*$', '')
  $date = $file_version -replace '^[^(]+\(([^(]+)\)\s*$', '$1'
}
"File Version: $file_version"
"Zim: $zim"
"Date: $date"
$branch = "main"
$release_tag_name = $tag_name
if ($tag_name -cmatch 'E\+N') {
  $title_flavour = 'Electron and NWJS'
  $release_title = $release_title -replace 'Windows\s', ''
  $release_tag_name = $tag_name -creplace '\+N', ''
}
if ($tag_name -match '\+E') {
  $title_flavour = 'UWP/PWA/Electron'
  $release_title = "Kiwix JS Windows/Linux $base_tag"
  if ($text_tag -imatch 'Wikivoyage|WikiMed') { $release_title = "$text_tag by Kiwix (Windows/Linux) $base_tag" }
  $release_tag_name = $tag_name -creplace '\+E', ''
}
if ($tag_name -match '\+E\+N') {
  # NB previous rule will already have matched
  $title_flavour = 'UWP/PWA/Electron/NWJS'
  $release_tag_name = $tag_name -creplace '\+E\+N', ''
}
if ($text_tag -ne "Windows") { $branch = "Kiwix-JS-$text_tag" }
if ($base_tag -match '[EN]$') {
  $flavour = '_' + $matches[0]
  $title_flavour = 'Electron'
  if ($flavour -eq '_N') { 
    $title_flavour = 'NWJS'
    $branch = 'nwjs-en-top' 
  }
  $release_title = $release_title -replace '([^\s]+)\sUWP$', ("$title_flavour (Windows/Linux) " + '$1')
  if ($flavour -eq '_N') { $release_title = $release_title -replace 'Edition\s(for\s)', '$1XP/Vista/' } 
}
# Get package name
$json_object = Get-Content -Raw "$PSScriptRoot/../package.json"
$package_name = '' 
if ($json_object -imatch '"name":\s"([\w]+-[^"]+)') {
	$package_name = $matches[1]
}
"Tag name: $tag_name"
"Release tag name: $release_tag_name"
"Text tag: $text_tag"
"Base tag: $base_tag"
"Numeric tag: $numeric_tag"
"Flavour: $flavour"
"Branch: $branch"
"Release title: $release_title"
"Package name: $package_name"
# Check that the numeric part of the tag matches the version set in the app's source code
if ($numeric_tag -ne $file_tag_numeric) {
  Write-Host "`nError! The numeric part of the tag you entered [$numeric_tag] does not match the version set in the app's source code [$file_tag_numeric]!" -ForegroundColor Red
  Write-Host "Please run Set-AppVersion if you wish to change the appversion, and try again.`n" -ForegroundColor Red
  exit 1
}
# Check that the user is on the correct branch for the type of app they wish to build
$actual_branch = git rev-parse --abbrev-ref HEAD
if ($branch -ne $actual_branch) {
  Write-Host "`nError! The branch you are on [$actual_branch] does not match the type of app you wish to build [$branch]!" -ForegroundColor Red
  if (-not $nobranchcheck) { 
    Write-Host "Please switch to the correct branch and try again.`n" -ForegroundColor Red
    exit 1
  } else {
    Write-Host "Continuing anyway as you have specified the -nobranchcheck option.`n" -ForegroundColor Yellow
  }
}

# Determine type of Electron build if any
if (($flavour -match '_E') -or $plus_electron) {
  if ($portableonly) { $electronbuild = 'local' }
  if ($electronbuild -eq "" -and -not $updatewinget) {
    ""
    $electronbuild_check = Read-Host "Do you want to build Electron packages on GitHub instead of locally? [Y/N]"
    $electronbuild_check = -Not ( $electronbuild_check -imatch 'n' )
    if ($electronbuild_check) {
      "`nSelecting cloud build..."
      $electronbuild = 'cloud'
    } else {
      "`nSelecting local build..."
      $electronbuild = 'local'
    }
  }
  if (-Not ($release_tag_name -cmatch '-E$') -and ($electronbuild -eq 'cloud')) {
    $original_release_tag_name = $release_tag_name
    $release_tag_name = $release_tag_name -creplace '-?E$|-WikiMed|-Wikivoyage', ''
    $release_tag_name = $release_tag_name + '-E' 
    "Changing release tag name to $release_tag_name"
  }
} else {
  $electronbuild = 'local'
}

# Create the Draft Release text
$release_body = Get-Content -Raw ("$PSScriptRoot/Kiwix_JS_" + $text_tag + $flavour + "_Release_Body.md")
$release_body = $release_body -replace '<<base_tag>>', "$base_tag"
$release_body = $release_body -replace '<<numeric_tag>>', "$numeric_tag"
$release_body = $release_body -replace '<<zim>>', "$zim"
$release_body = $release_body -replace '<<date>>', "$date"
# Set up release_params object - for API see https://docs.github.com/en/rest/reference/repos#releases
$release_body_json = @{
  'tag_name' = "$release_tag_name"
  'target_commitish' = $branch
  'name' = $release_title
  'draft' = $true
  'body' = $release_body
} | ConvertTo-Json
# Explicitly encode as UTF8 (or else it will fail with UTF8 characters)
$release_body_json = ([System.Text.Encoding]::UTF8.GetBytes($release_body_json))
$release_params = @{
  Uri = $release_uri
  Method = 'POST'
  Headers = @{
    'Authorization' = "token $github_token"
    'Accept' = 'application/vnd.github.v3+json'
  }
  Body = $release_body_json
  ContentType = "application/json"
}

# We should have enough information to find the release URL
if ($updatewinget) {
  if (-Not $flavour -and $release_body -match 'https:[^)]+?\.(?:appx(?!bundle))') {
    $package_urls = @($matches[0])
  } 
  if ($release_body -match 'https:[^)]+?\.(?:exe)') {
    $package_urls += $matches[0]
  } else {
    "`nUnable to find the package URL!"
    return
  }
  "`nThe package URLS are: $package_urls"
  foreach ($package_url in $package_urls) {
    $UrlsWithOverride = ""
    if ($text_tag -notmatch 'Windows') {
      $package_id = 'Kiwix.' + $text_tag
    } else {
      $package_id = 'Kiwix.' +  'KiwixJS'
    }
    if ($package_url -match '\.appx') { 
      $winget_version = $numeric_tag + '.0'
      $UrlsWithOverride = '"' + "$package_url|Neutral" + '"'
    }
    if ($package_url -match '\.exe') {
      $package_id = $package_id + '.Electron'
      $winget_version = $numeric_tag + '-E'
      $UrlsWithOverride = '"' + "$package_url|x86|machine" + '" "' + "$package_url|x86|user" + '"'
    }
    if (-Not $dryrun) {
      "`nSubmitting to winget-pkg repository..."
      & wingetcreate.exe update $package_id --version "$winget_version" --urls $UrlsWithOverride -s -t $github_token
    } else {
      "`n[DRYRUN:] & wingetcreate.exe update $package_id -v $winget_version -u $UrlsWithOverride -s -t $github_token"
    }
  }
  "`nDone."
  return
}

# Post to the release server
if (-Not ($dryrun -or $buildonly)) { 
  $release = Invoke-RestMethod @release_params 
} elseif (-Not $buildonly) {
  "[DRYRUN] Release Body:`n$release_body"
}

if (-Not $nobundle) {
  "`nBuilding production bundle with rollup..."
  if (-Not $dryrun) {
    & npm run build-min 
  } else {
    "[DRYRUN] & npm run build"
  }
} else {
  "`nSkipping production bundle build..."
}

# Check that we appear to have created a release
if ($dryrun -or $buildonly -or $release.assets_url -imatch '^https:') {
  if (-Not $buildonly) { "The draft release details were successfully created." }
  "`nUpdating release version in package.json"
  $json_object = $json_object -replace '("version": ")[^"]+', ("`${1}" + $base_tag -replace '-?([EN])(?=-|$)', '-$1')
  if ($plus_electron) {
    $json_object = $json_object -replace '("version": ")[^"]+', ("`${1}$base_tag" + "-E")
  }
  $json_object = $json_object -replace '\s*$', "`n"
  if ($dryrun) {
    "[DRYRUN] would have written new package.json"
    # $json_object
  } else {
    # Remove extraneous new lines before saving
    $json_object = $json_object -replace '\s+$', ''
    Set-Content "$PSScriptRoot/../package.json" $json_object
  }
  if ($draftonly) {
    "`nDraft only switch was set, so we will not upload assets. Please do so manually."
    if ($original_release_tag_name) {
      "*** WARNING: The Release Tag Name was changed to enable Electron cloud building! ***"
      "Be sure to change it back to $original_release_tag_name before publishing!"
    }
    "Done."
    return
  }
  "`nSearching for assets..."
  $AppImageArchives = @()
  if ($flavour -eq '_E') {
    "Building Electron packages..."
    $base_tag_origin = $base_tag
    $base_tag = $base_tag -replace '^([0-9.]+).*', '$1-E'
    . $PSScriptRoot/Build-Electron.ps1 # Note that we are dot-sourcing this, so that variables will be available in this scope
    $base_tag = $base_tag_origin
  } elseif ($flavour -eq '_N') {
    # Package NWJS app if necessary
    $base_dir = "$PSScriptRoot/../dist/bld/nwjs"
    $stubs = @("$base_tag-win-ia32", "$base_tag-win-x64", "XP-$base_tag-win-ia32")
    $found = $true
    $NWJSAssets = @()
    $NWJSAssets = {$NWJSAssets}.Invoke()
    foreach ($stub in $stubs) {
      $NWJSAsset = "$base_dir/kiwix_js_windows-$stub.zip"
      $NWJSAssets.Add($NWJSAsset)
      if (-Not (Test-Path $NWJSAsset -PathType Leaf)) { $found = $false }
      if (-Not $found) { "Unable to locate $NWJSAsset..." }
    }
    if ((-Not $found) -and ($electronbuild -eq 'local')) {
      "One or more NWJS build(s) could not be found."
      "`nBuilding..."
      "Updating Build-NWJS script with required tag..."
      $script_body = Get-Content -Raw ("$PSScriptRoot/Build-NWJS.ps1")
      $script_body = $script_body -ireplace '(appBuild\s*=\s*")[^"]+', "`${1}$base_tag"
      $json_nwVersion = ''
      $nwjson_object = Get-Content -Raw "$PSScriptRoot/../package.json.nwjs"
      if ($nwjson_object -match '"build":\s*\{[^"]*"nwVersion":\s*"([^"]+)') {
        $json_nwVersion = $matches[1]
      }
      if ($json_nwVersion) {
        "Updating Build-NWJS with NWJS version from package.json: $json_nwVersion"
        $script_body = $script_body -ireplace '(\$version10\s*=\s*")[^"]+', "`${1}$json_nwVersion" 
      }
      $script_body = $script_body -replace '\s+$', "`n"
      if ($dryrun) {
        "[DRYRUN] would have written:`n"
        $script_body
      } else {
        Set-Content -encoding "utf8BOM" "$PSScriptRoot/Build-NWJS.ps1" $script_body
        "Building NWJS packages..."
        cp "$PSScriptRoot/../package.json.nwjs" "$PSScriptRoot/../dist/package.json"
        & $PSScriptRoot/Build-NWJS.ps1
        $found = $true
      }
    }
  } else {
    # We need to check for UWP assets - let's see what type the user last built
    $appxmanifest = Get-Content -Raw $PSScriptRoot/../package.appxmanifest
    $projstub = $text_tag
    if ($text_tag -eq "Windows") { $projstub = "" }
    if (-Not ($appxmanifest -match "Publisher=['`"]CN=Association\sKiwix")) {
      if ($buildstorerelease) {
      "`n** App manifest is correctly associated with the MS Store..."
      } else {
        "`n**WARNING: The app manifest needs to be modified for release of the app on GitHub!"
        "If you want to build for the MS Store, exit and re-run this script with the flag -buildstorerelease`n"
        $rename_check = Read-Host "Would you like to set the app for a GitHub release? [Y/N]"
        $rename_check = -Not ( $rename_check -imatch 'n' )
        if ($rename_check -and (-not $dryrun)) {
          mv $PSScriptRoot/../dist/KiwixWebApp$projstub.jsproj $PSScriptRoot/../dist/KiwixWebApp$projstub-msstore.jsproj
          mv $PSScriptRoot/../dist/package.appxmanifest $PSScriptRoot/../dist/package-msstore.appxmanifest
          mv $PSScriptRoot/../dist/KiwixWebApp$projstub-github.jsproj $PSScriptRoot/../dist/KiwixWebApp$projstub.jsproj
          mv $PSScriptRoot/../dist/package-github.appxmanifest $PSScriptRoot/../dist/package.appxmanifest
          $appxmanifest = Get-Content -Raw $PSScriptRoot/../dist/package.appxmanifest
          if (-Not ($appxmanifest -match "Publisher=['`"]CN=Association\sKiwix")) {
            "`bSomething went wrong! We were not able to associate the app with a GitHub release!"
            return
          }
        } elseif (-Not $dryrun) {
          return
        } else { "App would either rename manifests or exit now if not dryrun.`n" }
      }
    } else {
      "`nBe aware that the version you are building is good for public release on GitHub, but not for upload to the Microsoft Store."
      "To create a valid appxupload, please associate the app with the Store in Visual Studio.`n"
    } 
    # Let's check if we have the assets
    $ReleaseBundle = dir "$PSScriptRoot/../dist/AppPackages/*_$base_tag*_Test/*_$base_tag*.appx*"
    # Check the file exists and it's of the right type
    if ($ReleaseBundle -and ($ReleaseBundle.count -eq 1) -and (Test-Path $ReleaseBundle -PathType leaf) -and 
      ($ReleaseBundle -imatch '\.(?:appx|appxbundle|appxupload)$')) {
        "`nYou should delete this bundle unless you are very sure that it was built with the correct certificate!"
        $deleteBundle = Read-Host "WARNING: There is already an existing UWP release package! Delete (recommended)? [Y/N]"
        $deleteBundle = -Not ( $deleteBundle -imatch 'n' )
        If ((-Not $dryrun) -and $deleteBundle) {
          rm $ReleaseBundle
          $ReleaseBundle = ""
        }
    }
    if (-Not $ReleaseBundle) {
      "`nBuilding UWP app..."
      if (-Not ($appxmanifest -match "Version=['`"]$numeric_tag\.0['`"]")) {
        "The requested release version does not match the version in package.appxmanifest"
        "Updating..."
        $appxmanifest = $appxmanifest -replace "(\sVersion=['`"])\d+\.\d+\.\d+(\.0['`"])", "`${1}$numeric_tag`${2}"
        if (-Not $dryrun) {
          Set-Content -encoding "utf8BOM" $PSScriptRoot/../dist/package.appxmanifest $appxmanifest
        } else {
          "[DRYRUN] Would have written package.appxmanifest:"
          "$appxmanifest"
        }
      }
      # Check for the existence of the requested packaged archive
      $packagedFile = (Select-String 'packagedFile' "dist\www\js\init.js" -List) -ireplace "^.+['`"]([^'`"]+\.zim)['`"].+", '$1'
      if ($packagedFile -and ! (Test-Path "dist\archives\$packagedFile" -PathType Leaf)) {
        # File not in archives
        $downloadArchiveChk = Read-Host "`nWe could not find the packaged archive, do you wish to download it? Y/N"
        $downloadArchiveChk = $downloadArchiveChk -imatch 'y'
        if (!$downloadArchiveChk) {
          "We cannot continue without the archive, aborting..."
          exit 1
        }
        # Generalize the name and download it
        if (-not $dryrun) {
          $packagedFileGeneric = $packagedFile -replace '_[0-9-]+(\.zim)', '$1'
          Write-Host "`nDownloading https://download.kiwix.org/zim/$packagedFileGeneric"
          Invoke-WebRequest "https://download.kiwix.org/zim/$packagedFileGeneric" -OutFile "dist\archives\$packagedFile"
        } else {
          "[DRYRUN] Would have downloade $packagedFile..."
        }
      }
      ls dist\archives
      if ($packagedFile -and (Test-Path "dist\archives\$packagedFile" -PathType Leaf)) {
        Write-Host "`nFile $packagedFile now available in 'archives'.`n" -ForegroundColor Green
      } elseif (-not $dryrun) {
        Write-Host "`nError! We could not obtain the requested archive $packagedFile!`n" -ForegroundColor Red
        exit 1
      }
      # Adding BOM to procution bundle
      $bundleFile = "$PSScriptRoot/../dist/www/js/bundle.min.js"
      $bundle = Get-Content -encoding "UTF8" $bundleFile
      if ($bundle -match "^(?!\xEF\xBB\xBF)") { 
          Write-Host "Adding missing BOM to production bundle!`n" -ForegroundColor Yellow
          if (-not $dryrun) {
            $bundle | Set-Content -encoding "utf8BOM" $bundleFile 
          } else {
            "[DRYRUN] Would have added BOM to $bundleFile"
          }
      }
      
      if (-not $dryrun) {
        $projstub = $text_tag
        if ($text_tag -eq "Windows") { $projstub = "" }
        $buildmode = "SideloadOnly"
        if ($buildstorerelease) { $buildmode = "StoreUpload" }
        # We have to rename node_modules or else msbuild won't run due to rogue dependency versions
        ren $PSScriptRoot/../node_modules node_modules_electron
        cmd.exe /c " `"C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\Common7\Tools\VsDevCmd.bat`" && msbuild.exe dist/KiwixWebApp$projstub.jsproj /p:Configuration=Release /p:UapAppxPackageBuildMode=$buildmode"
        ren $PSScriptRoot/../node_modules_electron node_modules
        if ($rename_check) {
          "`nReverting changes to UWP manifests..."
          mv $PSScriptRoot/../dist/KiwixWebApp$projstub.jsproj $PSScriptRoot/../dist/KiwixWebApp$projstub-github.jsproj
          mv $PSScriptRoot/../dist/package.appxmanifest $PSScriptRoot/../dist/package-github.appxmanifest
          mv $PSScriptRoot/../dist/KiwixWebApp$projstub-msstore.jsproj $PSScriptRoot/../dist/KiwixWebApp$projstub.jsproj
          mv $PSScriptRoot/../dist/package-msstore.appxmanifest $PSScriptRoot/../dist/package.appxmanifest
        }
      }
    }  
    # If we are releasing the MS Store version we have to copy it from a different location
    if ($buildstorerelease) {
      if (-Not ($appxmanifest -match "Publisher=['`"]CN=Association\sKiwix")) {
        "Using Store release becuase buildstorerelease flag was set."
        $UploadBundle = dir "$PSScriptRoot/../dist/bin/Release/Upload/*_$base_tag.0/*_$base_tag*.appx*"
        "$UploadBundle"
        if ($UploadBundle -and ($UploadBundle.count -eq 1) -and (Test-Path $UploadBundle -PathType leaf) -and ($UploadBundle -imatch '\.(?:appx|appxbundle|appxupload)$')) {
          $ReleaseFolder = dir "$PSScriptRoot/../dist/AppPackages/*_$base_tag*_Test"
          if ($ReleaseFolder -and (Test-Path $ReleaseFolder -PathType Container)) {
            "Copying signed archive $UploadBundle to release folder..."
            if (-Not $dryrun) { cp $UploadBundle $ReleaseFolder }
          } else {
            "WARNING: Could not find release folder!"
          }
        } else {
          "WARNING: Could not find the upload bundle, so we will use the test release..."
        }
      } else {
        "WARNING: You requested a release valid for the MS Store, but the app manifest is not associated with the Store! We cannot build a Store release."
        "Please associate the app with the MS Store in Visual Studio, save the manifest, and try again."
        if (-Not $dryrun) { return }
        else { "`nApp would exit now if not dryrun.`n" }
      }
      if (-Not $buildonly) {
        "** You can use the appxupload to submit to the Store, but we won't release..."
        $buildonly = $true
        $forced_buildonly = $true
      }
    }
    $ReleaseBundle = dir "$PSScriptRoot/../dist/AppPackages/*_$base_tag*_Test/*_$base_tag*.appx*"
    # Check the file exists and it's of the right type
    if ($ReleaseBundle -and ($ReleaseBundle.count -eq 1) -and (Test-Path $ReleaseBundle -PathType leaf) -and 
      ($ReleaseBundle -imatch '\.(?:appx|appxbundle|appxupload)$')) {
        "Setting main bundle file to $ReleaseBundle..."
    } elseif ($ReleaseBundle.count -ge 2) {
        "More than one file matches that tag!"
        return
    } elseif (-Not $dryrun) {
        Write-Host "`nNo package matching that tag was found! Aborting." -ForegroundColor Red
        Write-Host "Tag yielded: $ReleaseBundle " + ($ReleaseBundle -or $false) -ForegroundColor Yellow
        exit 1
    }
    if ($skipsigning) {
      "`nWARNING: Signing was skipped because user specified the -skipsigning flag. Be sure the bundle is signed!"
    } elseif (-Not $buildstorerelease) {
      "Signing app package for release on GitHub..."
      $pfxpwd = Get-Content -Raw $PSScriptRoot\secret_kiwix.p12.pass
      if (-Not $dryrun) {
        cmd.exe /c " `"C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\Common7\Tools\VsDevCmd.bat`" && SignTool sign /fd SHA256 /a /f `"$PSScriptRoot\kiwix2022.pfx`" /p $pfxpwd /tr http://timestamp.digicert.com /td SHA256 `"$ReleaseBundle`" "
      } else {
        'cmd.exe /c " "C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\Common7\Tools\VsDevCmd.bat" && SignTool sign /fd SHA256 /a /f ' + $PSScriptRoot + '\kiwix2022.pfx /p ' + $pfxpwd + ' /tr http://timestamp.digicert.com  /td SHA256 ' + $ReleaseBundle + ' "'
      }
    }
    # ZIP the remaining assets
    "`nCompressing remaining assets..."
    $compressed_assets_dir = $ReleaseBundle -replace '[^/\\]+$', ''
    $compressed_assets_base = $compressed_assets_dir -replace '^.*[\\/]([^\\/]+)[\\/]', '$1'
    $compressed_archive = $compressed_assets_dir + "PowerShell.Installation.Script.$compressed_assets_base.zip"
    $AddAppPackage = $compressed_assets_dir + "Add-AppDevPackage*.*"
    $cert_file = $ReleaseBundle -replace '\.[^.]+$', '.cer'
    "Compressing: $AddAppPackage, $cert_file"
    if (-Not $dryrun) { "$AddAppPackage", "$cert_file" | Compress-Archive -DestinationPath $compressed_archive -Force }
    # Check the compressed file exists
    if ($dryrun -or $found -or (Test-Path $compressed_archive -PathType leaf)) {
      "Compression successful`n"
    } else {
      "There was an error compressing assets."
      return
    }
  }
  # Build any extras requested
  if ($plus_electron) {
    "Building add-on: Electron packages..."
    $base_tag_origin = $base_tag
    $numeric_tag_origin = $numeric_tag
    $base_tag = $base_tag -replace '^([0-9.]+).*', '$1-E'
    # If we are building both the legacy and Electron-based UWP apps, we need to increment the build number for the Electron version
    if ($buildalluwp) {
      if ($base_tag -match '(^.*\.)([0-9]+)(.*$)') {
        if ($matches[2]) {
            $base_tag = $matches[1] + ($matches[2] / 1 + 1) + $matches[3]
        }
      }
      if ($numeric_tag -match '(^.*\.)([0-9]+)(.*$)') {
        if ($matches[2]) {
            $numeric_tag = $matches[1] + ($matches[2] / 1 + 1) + $matches[3]
        }
      }
      # If the old and new numeric_tags match
      if ($numeric_tag -ne $numeric_tag_origin) {
        "`nBuilding the Electron UWP app with version $base_tag...`n"
        "Setting appVersion in package.json to $base_tag..."
        $json_object = $json_object -replace '("version": ")[^"]+', "`${1}$base_tag"
        if ($dryrun) {
          "[DRYRUN] would have written new package.json"
          # $json_object
        } else {
          # This will get copied to the dist folder by the Build-Electron script
          Set-Content "$PSScriptRoot/../package.json" $json_object
        }
      } else {
        Write-Host "`nUnable to auto-build Electron UWP app because the version $numeric_tag is the same as that of the legacy UWP app!`n" -ForegroundColor Red
        exit 1
      }      
    }
    . $PSScriptRoot/Build-Electron.ps1
    $base_tag = $base_tag_origin
    $numeric_tag = $numeric_tag_origin
  } 
  if ($forced_buildonly) {
    "`nBecause your app package was not valid for release on GitHub, we have not uploaded it."
    "You will need to delete any draft release that was created and aborted as part of this run."
    "Your appxupload is valid for release on the Microsoft Store."
    "`nDone."
    return
  } elseif ($buildonly) {
    "`nThe buildonly option was set, so no draft release was created."
    "Please upload and release your packages manually, or re-run this script without the buildonly switch."
    "`nDone."
    return
  }
  # Upload the release
  if ($flavour -eq '') { $upload_assets = @($compressed_archive, $ReleaseBundle) }
  if ($flavour -eq '_N') { $upload_assets = $NWJSAssets }
  # if ($flavour -eq '_E') { 
  #   if ($old_windows_support) {
  #     $upload_assets = ($AppImageArchives += $nwjs_archives)  
  #   } else {
  #     $upload_assets = ($AppImageArchives += $comp_electron_archive)
  #   }
  #   $upload_assets += $WinInstaller
  # }
  if (($flavour -eq '_E') -or $plus_electron) {
    $upload_assets += $AppImageArchives
    if ($electronbuild -eq 'local' -and (-not $portableonly)) { $upload_assets += $WinInstaller }
    if ($old_windows_support) {
      $upload_assets += $nwjs_archives
    } else {
      $upload_assets += $comp_electron_archive
    }
  }
  $upload_uri = $release.upload_url -ireplace '\{[^{}]+}', '' 
  "`nUploading assets to: $upload_uri..."
  
  ForEach($asset in $upload_assets) {
    if (-Not $asset) { Continue }
    # Replace backslash with forward slash
    $asset_name = $asset -replace '^.*[\\/]([^\\/]+)$', '$1'
    # Replace spaces with hyphens
    $asset_name = $asset_name -replace '\s', '-';
    # Establish upload params
    $upload_params = @{
      Uri = $upload_uri + "?name=$asset_name"
      Method = 'POST'
      Headers = @{
        'Authorization' = "token $github_token"
        'Accept' = 'application/vnd.github.v3+json'
      }
      # Body = [System.IO.File]::ReadAllBytes($upload_file)
      InFile = $asset
      ContentType = 'application/octet-stream'
    }
    "`n*** Uploading $asset..."
    # Upload asset to the release server
    # $upload = [System.IO.File]::ReadAllBytes($upload_file) | Invoke-RestMethod @upload_params
    if (-Not $dryrun) {
      # Disable progress because it causes high CPU usage on large files, and slows down upload
      $ProgressPreference = 'SilentlyContinue'
      $upload = Invoke-RestMethod @upload_params
    }
    if ($dryrun -or $upload.name -eq ($asset_name -replace '\s', '.')) {
      if (-Not $dryrun) {
        "Upload successfully posted as " + $upload.url
        "Full details:"
        echo $upload
      } else {
        echo "DRYRUN with these upload parameters:`n" + @upload_params 
      }
    } else {
      "`nI'm sorry, this upload appears to have failed! Please upload manually or try again..."
      if ($upload) {
        "`nThe server returned:"
        echo $upload
      } else {
        "The server did not respond."
      }
    }
  }
  "`nCreating permalink..."
  $permalinkFile = "$PSScriptRoot/../kiwix-js-uwp.html"
  $permalinkFile2 = ""
  $permalinkFile3 = ""
  if ($tag_name -imatch 'WikiMed') { $permalinkFile = $permalinkFile -replace 'kiwix-js-uwp', 'wikimed-uwp' }
  if ($tag_name -imatch 'Wikivoyage') { $permalinkFile = $permalinkFile -replace 'kiwix-js-uwp', 'wikivoyage-uwp' }
  if ($flavour -eq '_N') { $permalinkFile = $permalinkFile -replace 'uwp', 'nwjs' }
  if ($tag_name -match 'E\+N') { $permalinkFile2 = $permalinkFile -replace 'uwp', 'nwjs' }
  if ($flavour -eq '_E') { $permalinkFile = $permalinkFile -replace 'uwp', 'electron' }
  if ($plus_electron) { $permalinkFile3 = $permalinkFile -replace 'uwp', 'electron' }
  "Looking for: $permalinkFile"
  foreach ($file in @($permalinkFile, $permalinkFile2, $permalinkFile3)) {
    if ($file) {
      $permalink = Get-Content -Raw $file
      $permalink = $permalink -replace 'v[\d.EN]{5,}', "v$base_tag"
      $permalink = $permalink -replace '\s*$', "`n"
      if (-Not $dryrun) { Set-Content $file $permalink }
      else { "`n[DRYRUN] would have written:`n$permalink`n" }
    }
  }
  "Cleaning up..."
  if ((-Not ($dryrun -or $old_windows_support)) -and $compressed_archive ) { del $compressed_archive }
  "`nDone.`n"
  if ($original_release_tag_name) {
    "*** WARNING: The Release Tag Name was changed to enable Electron cloud building! ***"
    if ($wingetprompt -imatch 'N') {
      "Be sure to change it back to $original_release_tag_name before publishing!`n"
    } else {
      $revert_release_tag_check = Read-Host "Would you like to revert the draft tag to ${original_release_tag_name}?`nWARNING WAIT TILL ALL BUILDS HAVE FINISHED BEFORE ANSWERING Yes! (Y/N)"
      $revert_release_tag_check = $revert_release_tag_check -imatch 'y'
      if ($revert_release_tag_check) {
        "Changing tag from $release_tag_name to $original_release_tag_name..."
        if (-not $dryrun) {
          & $PSScriptRoot/Rewrite-DraftReleaseTag -from $release_tag_name -to $original_release_tag_name
        } else {
          & $PSScriptRoot/Rewrite-DraftReleaseTag -dryrun -from $release_tag_name -to $original_release_tag_name
        }
      } else {
        "We did NOT change the release tag! Be sure to do it before publishing!"
      }
    }
    $release_tag_name = $original_release_tag_name
  }
  # Now update winget manifest if we are not building NWJS or Electron
  if ($flavour -eq '' -or $flavour -eq '_E') {
    if ($wingetprompt) {
      $wingetcreate_check = $wingetprompt
    } else {
      $wingetcreate_check = Read-Host "Would you like to update the WinGet repository with these new builds?`nWARNING: be sure you have published the draft release (if in doubt answer N)! [Y/N]"
    }
    $wingetcreate_check = $wingetcreate_check -imatch 'y'
    if ($original_release_tag_name -and (-not $wingetprompt) -and (-not $revert_release_tag_check)) {
      $check = Read-Host "Did you change the Release Tag Name? (Y/N)"
      if ($check -imatch 'N') {
        "You must change the Tag name!"
        $wingetcreate_check = $false
      }
    }
    if ($wingetcreate_check) {
      "`nUpdating WinGet repository..."
      cd $PSScriptRoot\..
      pwd
      if (-Not $dryrun) { 
        & .\scripts\Create-DraftRelease.ps1 -updatewinget -tag_name $release_tag_name
      } else {
        & .\scripts\Create-DraftRelease.ps1 -dryrun -updatewinget -tag_name $release_tag_name
      }
    } else {
      "You can update the WinGet repository manually by running 'Create-DraftRelease -updatewinget'"
    }
  }
} else {
  "There was an error setting up the release!"
  if ($release) {
    "The server returned:"
    echo $release
  } else {
    "The server did not respond or could not process the command correctly."
    "$release_body_json"
  }
}
