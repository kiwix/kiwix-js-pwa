[CmdletBinding()]
param (
    [string]$tag_name = "",
    [switch]$dryrun = $false,
    [switch]$buildstorerelease = $false,
    [switch]$skipsigning = $false,
    [switch]$draftonly = $false,
    [switch]$buildonly = $false,
    [switch]$updatewinget = $false,
    [string]$respondtowingetprompt = "" # Provide an override response (Y/N) to the winget prompt at the end of the script - for automation
)
# DEV: To build Electron packages for all platforms and NWJS for XP and Vista in a single release, use, e.g., "v1.3.0E+N" (Electron + NWJS)
# DEV: To build UWP + Electron in a single release (for WikiMed or Wikivoyage), use "v1.3.0+E" (plus Electron)
# DEV: To build UWP + Electron + NWJS packages in a single release, use "v1.3.0+E+N"

# DEV: To build new icons, use
# electron-icon-builder --input=C:\Users\geoff\Source\Repos\kiwix-js-windows\bld\icon.png --output=./bld/
# then move icons in png into /bld/icons/

# Provide parameters
$release_uri = 'https://api.github.com/repos/kiwix/kiwix-js-windows/releases'
$github_token = Get-Content -Raw "$PSScriptRoot/github_token"

$init_params = Get-Content -Raw "$PSScriptRoot\..\www\js\init.js"
$serviceworker = Select-String 'appVersion' "$PSScriptRoot\..\service-worker.js" -List

$file_tag = ''
if ($init_params -match 'params\[[''"]appVersion[''"]]\s*=\s*[''"]([^''"]+)') {
  $file_tag = 'v' + $matches[1] 
} else {
  "`n*** WARNING: App version is incorrectly set in init.js.`nPlease correct before continuing.`n"
  exit
}
if (-Not (Test-Path $PSScriptRoot/../node_modules -PathType Container)) {
  "`n*** WARNING: Cannot find node_modules folder: perhaps you renamed it?`n"
  exit
}

$sw_tag = ''
if ($serviceworker -match 'appVersion\s*=\s*[''"]([^''"]+)') {
  $sw_tag = 'v' + $matches[1]
  if ($sw_tag -ne $file_tag) {
    "`n*** WARNING: The version in init.js [$file_tag] does not match the version in service-worker.js [$sw_tag]! ***"
    "Please correct before continuing.`n"
    exit
  } else {
    "`nVersion in init.js: $file_tag"
    "Version in service-worker.js: $sw_tag"
  }
} else {
  "`n*** WARNING: App version is incorrectly set in service-worker.js.`nPlease correct before continuing.`n"
  exit
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
  } elseif (-Not ($buildonly -or $dryrun -or $updatewinget)) {
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
$base_tag = $tag_name -replace '^v([\d.EN]+).*', '$1'
$text_tag = $tag_name -replace '^v[\d.EN+]+-?(.*)$', '$1'
$numeric_tag = $base_tag -replace "([\d.]+)[EN]", '$1'
$old_windows_support = $tag_name -match '\+N'
$plus_electron = $tag_name -match '\+E'
if ($text_tag -eq '') { $text_tag = 'Windows' }
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
$branch = "master"
$release_tag_name = $tag_name
if ($tag_name -match 'E\+N') {
  $title_flavour = 'Electron and NWJS'
  $release_title = $release_title -replace 'Windows\s', ''
  $release_tag_name = $tag_name -replace '\+N', ''
}
if ($tag_name -match '\+E') {
  $title_flavour = 'UWP/PWA/Electron'
  $release_title = "Kiwix JS $text_tag/Linux $base_tag"
  $release_tag_name = $tag_name -replace '\+E', ''
}
if ($tag_name -match '\+E\+N') {
  $title_flavour = 'UWP/PWA/Electron/NWJS'
  $release_title = "Kiwix JS $text_tag/Linux $base_tag"
  $release_tag_name = $tag_name -replace '\+E\+N', ''
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

# Post to the release server
if (-Not ($dryrun -or $buildonly -or $updatewinget)) { 
  $release = Invoke-RestMethod @release_params 
} elseif (-Not $updatewinget) {
  "[DRYRUN] Release Body:`n$release_body"
}

# We should have enough information to find the release URL
if ($updatewinget) {
  if (-Not $flavour -and $release_body -match 'https:[^)]+?\.(?:appxbundle)') {
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
    if ($text_tag -notmatch 'Windows') {
      $package_id = 'Kiwix.' + $text_tag
    } else {
      $package_id = 'Kiwix.' +  'KiwixJS'
    }
    if ($package_url -match '\.appxbundle') { 
      $winget_version = $numeric_tag + '.0'
    }
    if ($package_url -match '\.exe') {
      $package_id = $package_id + '.Electron'
      $winget_version = $numeric_tag + '-E'
    }
    if (-Not $dryrun) {
      "`nSubmitting to winget-pkg repository..."
      & wingetcreate.exe update -i $package_id -v "$winget_version" -u $package_url -s -t $github_token
    } else {
      "`n[DRYRUN:] & wingetcreate.exe update -i $package_id -v $winget_version -u $package_url -s -t $github_token"
    }
}
  
  "`nDone."
  return
}

# Check that we appear to have created a release
if ($dryrun -or $buildonly -or $release.assets_url -imatch '^https:') {
  if (-Not $buildonly) { "The draft release details were successfully created." }
  "`nUpdating release version in package.json"
  $json_object = $json_object -replace '("version": ")[^"]+', ("`${1}" + $base_tag -replace 'E(?=-|$)', '-E')
  if ($plus_electron) {
    $json_object = $json_object -replace '("version": ")[^"]+', ("`${1}$base_tag" + "-E")
  }
  $json_object = $json_object -replace '\s*$', "`n"
  if ($dryrun) {
    "[DRYRUN] would have written:`n"
    $json_object
  } else {
    Set-Content "$PSScriptRoot/../package.json" $json_object
  }
  if ($draftonly) {
    "`nDraft only switch was set, so we will not upload assets. Please do so manually."
    "Done."
    return
  }
  "Searching for assets..."
  $AppImageArchives = @()
  if ($flavour -eq '_E') {
    "Building Electron packages..."
    . $PSScriptRoot/Build-Electron.ps1 # Note that we are dot-sourcing this, so that variables will be available in this scope
  } elseif ($flavour -eq '_N') {
    # Package NWJS app if necessary
    $base_dir = "$PSScriptRoot/../bld/nwjs"
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
    if (-Not $found) {
      "One or more NWJS build(s) could not be found."
      "`nBuilding..."
      "Updating Build-NWJS script with required tag..."
      $script_body = Get-Content -Raw ("$PSScriptRoot/Build-NWJS.ps1")
      $script_body = $script_body -ireplace '(appBuild\s*=\s*")[^"]+', "`${1}$base_tag"
      $json_nwVersion = ''
      if ($json_object -match '"build":\s*\{[^"]*"nwVersion":\s*"([^"]+)') {
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
        Set-Content "$PSScriptRoot/Build-NWJS.ps1" $script_body
        "Building NWJS packages..."
        & $PSScriptRoot/Build-NWJS.ps1
        $found = $true
      }
    }
  } else {
    # We need to check for UWP assets - let's see what type the user last built
    $appxmanifest = Get-Content -Raw $PSScriptRoot/../package.appxmanifest
    if (-Not ($appxmanifest -match "Publisher=['`"]CN=Association\sKiwix")) {
      if ($buildstorerelease) {
      "`n** App manifest is correctly associated with the MS Store..."
      } else {
        "`n**WARNING: The app manifest is not correct for building an app for release on GitHub! Please associate the app with 'Association Kiwix' in Visual Studio and try again"
        "or else run this script with the flag -buildstorerelease`n"
        if (-Not $dryrun) { return }
        else { "App would exit now if not dryrun.`n" }
      }
    } else {
      "`nBe aware that the version you are building is good for public release on GitHub, but not for upload to the Microsoft Store."
      "To create a valid appxupload, please associate the app with the Store in Visual Studio.`n"
    } 
    # Let's check if we have the assets
    $ReleaseBundle = dir "$PSScriptRoot/../AppPackages/*_$base_tag*_Test/*_$base_tag*.appx*"
    # Check the file exists and it's of the right type
    if ($ReleaseBundle -and ($ReleaseBundle.count -eq 1) -and (Test-Path $ReleaseBundle -PathType leaf) -and 
      ($ReleaseBundle -imatch '\.(?:appx|appxbundle|appxupload)$')) {
      "`nUWP app packages were found."
    } else {
      "`nBuilding UWP app..."
      if (-Not ($appxmanifest -match "Version=['`"]$numeric_tag\.0['`"]")) {
        "The requested release version does not match the version in package.appxmanifest"
        "Updating..."
        $appxmanifest = $appxmanifest -replace "(\sVersion=['`"])\d+\.\d+\.\d+(\.0['`"])", "`${1}$numeric_tag`${2}"
        if (-Not $dryrun) {
          Set-Content $PSScriptRoot/../package.appxmanifest $appxmanifest
        } else {
          "[DRYRUN] Would have written package.appxmanifest:"
          "$appxmanifest"
        }
      }
      if (-Not $dryrun) {
        $projstub = $text_tag
        if ($text_tag -eq "Windows") { $projstub = "" }
        $buildmode = "SideloadOnly"
        if ($buildstorerelease) { $buildmode = "StoreUpload" }
        # We have to rename node_modules or else msbuild won't run due to rogue dependency versions
        ren $PSScriptRoot/../node_modules node_modules_electron
        cmd.exe /c " `"C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\Common7\Tools\VsDevCmd.bat`" && msbuild.exe KiwixWebApp$projstub.jsproj /p:Configuration=Release /p:UapAppxPackageBuildMode=$buildmode"
        ren $PSScriptRoot/../node_modules_electron node_modules
      }
    }
    # If we are releasing the MS Store version we have to copy it from a different location
    if ($buildstorerelease) {
      if (-Not ($appxmanifest -match "Publisher=['`"]CN=Association\sKiwix")) {
        "Using Store release becuase buildstorerelease flag was set."
        $UploadBundle = dir "$PSScriptRoot/../bin/Release/Upload/*_$base_tag.0/*_$base_tag*.appx*"
        "$UploadBundle"
        if ($UploadBundle -and ($UploadBundle.count -eq 1) -and (Test-Path $UploadBundle -PathType leaf) -and ($UploadBundle -imatch '\.(?:appx|appxbundle|appxupload)$')) {
          $ReleaseFolder = dir "$PSScriptRoot/../AppPackages/*_$base_tag*_Test"
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
    $ReleaseBundle = dir "$PSScriptRoot/../AppPackages/*_$base_tag*_Test/*_$base_tag*.appx*"
    # Check the file exists and it's of the right type
    if ($ReleaseBundle -and ($ReleaseBundle.count -eq 1) -and (Test-Path $ReleaseBundle -PathType leaf) -and 
      ($ReleaseBundle -imatch '\.(?:appx|appxbundle|appxupload)$')) {
        "Setting main bundle file to $ReleaseBundle..."
    } elseif ($ReleaseBundle.count -ge 2) {
        "More than one file matches that tag!"
        return
    } elseif (-Not $dryrun) {
        "No package matching that tag was found. Aborting."
        "Tag yielded: $ReleaseBundle " + ($ReleaseBundle -or $false)
        return
    }
    if ($skipsigning) {
      "`nWARNING: Signing was skipped because user specified the -skipsigning flag. Be sure the bundle is signed!"
    } elseif (-Not $buildstorerelease) {
      "Signing app package for release on GitHub..."
      $pfxpwd = Get-Content -Raw $PSScriptRoot\secret_kiwix.p12.pass
      if (-Not $dryrun) {
        cmd.exe /c " `"C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\Common7\Tools\VsDevCmd.bat`" && SignTool sign /fd SHA256 /a /f `"$PSScriptRoot\..\kiwix2021-5.pfx`" /p $pfxpwd /tr http://timestamp.digicert.com /td SHA256 `"$ReleaseBundle`" "
      } else {
        'cmd.exe /c " "C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\Common7\Tools\VsDevCmd.bat" && SignTool sign /fd SHA256 /a /f ' + $PSScriptRoot + '\..\kiwix2021-5.pfx /p ' + $pfxpwd + ' /tr http://timestamp.digicert.com  /td SHA256 ' + $ReleaseBundle + ' "'
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
    $base_tag = $base_tag -replace '^([\d.]+)', '$1E'
    . $PSScriptRoot/Build-Electron.ps1
    $base_tag = $base_tag_origin
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
  if ($flavour -eq '_E') { 
    if ($old_windows_support) {
      $upload_assets = ($AppImageArchives += $nwjs_archives)  
    } else {
      $upload_assets = ($AppImageArchives += $comp_electron_archive)
    }
    $upload_assets += $WinInstaller
  }
  if ($plus_electron) {
    $upload_assets += $AppImageArchives
    $upload_assets += $WinInstaller
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
        'Accept' = 'application/vnd.github.everest-preview+json'
      }
      # Body = [System.IO.File]::ReadAllBytes($upload_file)
      InFile = $asset
      ContentType = 'application/octet-stream'
    }
    "`nUploading $asset..."
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
  # Now update winget manifest if we are not building NWJS or Electron
  if ($flavour -eq '' -or $flavour -eq '_E') {
    if ($respondtowingetprompt) {
      $wingetcreate_check = $respondtowingetprompt
    } else {
      $wingetcreate_check = Read-Host "Would you like to update the WinGet repository with these new builds?`nWARNING: be sure you have published the draft release (if in doubt answer N)! [Y/N]"
    }
    $wingetcreate_check = $wingetcreate_check -imatch 'y'
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
