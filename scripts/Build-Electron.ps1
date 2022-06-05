# This script is intended to be run by Create-DraftRelease, and must be dot-sourced (run with `. ./Build-Electron.ps1` or `. /path/to/Build-Electron.ps1`)
# because it modifies variables needed in Create-DraftRelease
$base_dir = "$PSScriptRoot/../bld/electron/"
"`nSelected base_tag: $base_tag"
if ($electronbuild -eq "") {
  ""
  $electronbuild_check = Read-Host "Do you want to build Electron packages on GitHub instead of locally? [Y/N]"
  $electronbuild_check = -Not ( $electronbuild_check -imatch 'n' )
  if ($electronbuild_check) {
    "`nSelecting cloud build"
    $electronbuild = 'cloud'
  } else {
    "`nSelecting local build"
    $electronbuild = 'local'
  }
}
if ($electronbuild -eq "cloud") {
  $branch_name = &{ git branch --show-current }
  "Setting the build branch to: $branch_name"
  $release_uri = 'https://api.github.com/repos/kiwix/kiwix-js-windows/actions/workflows/build-electron.yml/dispatches'
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
        'target' = 'release'
        'version' = $original_release_tag_name
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
    "[DRYRUN]: Cloudbuild dispatched.`n"
  }
}
# Package installer electron app for Windows
"`nChecking for installer package for Windows..."
$alt_tag = $text_tag -ireplace 'Windows', 'Electron'
$comp_electron_archive = $base_dir + "Kiwix-JS-Electron-$base_tag.zip"
$unpacked_folder = $base_dir + "win-ia32-unpacked"
$WinInstaller = $base_dir + "Kiwix JS $alt_tag Setup $numeric_tag-E.exe"
if ($alt_tag -imatch 'WikiMed|Wikivoyage') {
  $comp_electron_archive = $base_dir + "$text_tag-by-Kiwix-$base_tag.zip"
  $WinInstaller = $base_dir + "$alt_tag.by.Kiwix.Setup.$numeric_tag-E.exe"
}
if ($electronbuild -eq "local" -and (-not $portableonly)) {
  if (-Not (Test-Path $WinInstaller -PathType Leaf)) {
    "No package found: building $WinInstaller..."
    if (-Not $dryrun) {
      npm run dist-win
      if (Test-Path $WinInstaller -PathType Leaf) {
        "Successfully built."
      } else {
        "Oh no! The Windows installer build failed!"
      }
    }
  } else {
    "Package found."
  }
}
# Build portable app if not in cloud
if (-Not (($electronbuild -eq 'cloud') -or $old_windows_support -or (Test-Path $comp_electron_archive -PathType Leaf))) {
  # Package portable electron app for Windows
  "Building portable Electron app for Windows"
  # Line below uses electron-packager, but not necessary if we run the setup version first above
  # if (-Not $dryrun) { npm run package-win }
  "Compressing release package for Electron..."
  $foldername = "kiwix-js-windows-win32-ia32"
  $compressed_assets_dir = $base_dir + $foldername
  # Find the executable filename in the folder
  $executable = (ls "$unpacked_folder/*.exe") -replace '^.*[/\\]([^/\\]+)$', '$1' 
  "Processing executable: $executable"
  # Rename the compressed assets folder
  if (-Not $dryrun) { 
    if (Test-Path $compressed_assets_dir -PathType Container) {
      rm -r $compressed_assets_dir
    }
    # PowerShell bug: you have to make the directory before you can cleanly copy another folder's contents into it!
    mkdir $compressed_assets_dir
    cp -r "$unpacked_folder\*" $compressed_assets_dir
  }
  "Creating launchers..."
  $launcherStub = "$base_dir\Start Kiwix JS Electron"
  # Batch file
  $batch = '@cd "' + $foldername + '"' + "`r`n" + '@start "Kiwix JS Electron" "' + $executable + '"' + "`r`n"
  if ($text_tag -match 'WikiMed|Wikivoyage') {
    $launcherStub = "$base_dir\Start $text_tag by Kiwix"
    $batch = '@cd "' + $foldername + '"' + "`r`n" + '@start "' + $text_tag + ' by Kiwix" "' + $executable + '"' + "`r`n"
  }
  if (-Not $dryrun) {
    $batch > "$launcherStub.bat"
    # Shortcut
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$launcherStub.lnk")
    $Shortcut.TargetPath = '%windir%\explorer.exe'
    $Shortcut.Arguments = "$foldername\$executable"
    $Shortcut.IconLocation = '%windir%\explorer.exe,12'
    $Shortcut.Save()
  } else {
    "Would have written batch file:"
    "$batch"
  }
  $AddAppPackage = $base_dir + "Start*Kiwix*.*"
  "Compressing: $AddAppPackage, $compressed_assets_dir to $comp_electron_archive"
  if (-Not $dryrun) { "$AddAppPackage", "$compressed_assets_dir" | Compress-Archive -DestinationPath $comp_electron_archive -Force }
}
if ($electronbuild -eq "local" -and (-not $portableonly)) {
  # Package Electron app for Linux
  "`nChecking for Electron packages for Linux..."
  $LinuxBasePackage = $base_dir + "Kiwix JS $alt_tag-$numeric_tag-E"
  if ($alt_tag -imatch 'Wikivoyage|WikiMed') {
    $LinuxBasePackage = $base_dir + "$alt_tag by Kiwix-$numeric_tag-E"
  }
  $DebBasePackage = $base_dir + $package_name + "_$numeric_tag-E"
  $RPMBasePackage = $base_dir + $package_name + "-$numeric_tag-E"
  $AppImageArchives = @("$LinuxBasePackage.AppImage", ($LinuxBasePackage + "-i386.AppImage"),
    ("$DebBasePackage" + "_i386.deb"), ("$DebBasePackage" + "_amd64.deb"))
  if ($alt_tag -notmatch 'WikiMed|Wikivoyage') {
    $RPMArchives = @("$RPMBasePackage.x86_64.rpm", "$RPMBasePackage.i686.rpm");
    $AppImageArchives += $RPMArchives  
  }
    "Processing $AppImageArchives"
  foreach ($AppImageArchive in $AppImageArchives) {
    if (-Not (Test-Path $AppImageArchive -PathType Leaf)) {
      "No packages found: building $AppImageArchive..."
      # To get docker to start, you might need to run below commands as admin
      # net stop com.docker.service
      # taskkill /IM "Docker Desktop.exe" /F
      # net start com.docker.service
      # runas /noprofile /user:Administrator "net stop com.docker.service; taskkill /IM 'Docker Desktop.exe' /F; net start com.docker.service"
      $repo_dir = ($PSScriptRoot -replace '[\\/]scripts[\\/]*$', '')
      # "Using docker command:"
      # "docker run -v $repo_dir\:/project -w /project electronuserland/builder npm run dist-linux"
      "Using electron-builder in wsl:"
      "wsl sh -c 'npm run dist-linux'"
      if (-Not $dryrun) {
        # docker run -v $repo_dir\:/project -w /project electronuserland/builder npm run dist-linux
        cd $repo_dir
        rm -r $base_dir/linux-unpacked
        rm -r $base_dir/linux-ia32-unpacked
        wsl sh -c "npm run dist-linux"
        # Alternatively build with wsl
        # wsl . ~/.bashrc; npm run dist-linux
        # docker $build_command
      }
    } else {
      "Linux Electron package $AppImageArchive is available"
    }
  }
}
if ($old_windows_support -and ($electronbuild -eq 'local')) {
  "`nSupport for XP and Vista was requested."
  "Searching for archives..."
  $nwjs_base = $PSScriptRoot -ireplace 'kiwix-js-windows.scripts.*$', 'kiwix-js-windows-nwjs'
  "NWJS base directory: " + $nwjs_base
  $nwjs_archives_path = "$nwjs_base/bld/nwjs/kiwix_js_windows*$numeric_tag" + "N-win-ia32.zip"
  "NWJS archives path: " + $nwjs_archives_path
  $nwjs_archives = dir $nwjs_archives_path
  if (-Not ($nwjs_archives.count -eq 2)) {
    "`nBuilding portable 32bit NWJS archives to add to Electron release for XP and Vista..."
    "Updating Build-NWJS script with required tags..."
    $nw_json = Get-Content -Raw "$nwjs_base/package.json"
    $script_body = Get-Content -Raw ("$nwjs_base/scripts/Build-NWJS.ps1")
    $json_nwVersion = ''
    if ($nw_json -match '"build":\s*\{[^"]*"nwVersion":\s*"([^"]+)') {
      $json_nwVersion = $matches[1]
    }
    if ($json_nwVersion) {
      "Updating Build-NWJS with NWJS version from package.json: $json_nwVersion"
      $script_body = $script_body -ireplace '(\$version10\s*=\s*")[^"]+', "`${1}$json_nwVersion" 
    }
    $script_body = $script_body -ireplace '(appBuild\s*=\s*")[^"]+', ("`${1}$numeric_tag" + "N")
    $script_body = $script_body -replace '\s+$', "`n"
    if ($dryrun) {
      "[DRYRUN] would have written:`n"
      $script_body
    } else {
      Set-Content "$nwjs_base/scripts/Build-NWJS.ps1" $script_body
    }
    if (-Not $dryrun) {
      "Building..."
      & $nwjs_base/scripts/Build-NWJS.ps1 -only32bit
    } else {
      "Build command: $nwjs_base/scripts/Build-NWJS.ps1 -only32bit"
    }
    "Verifying build..."
    $nwjs_archives = dir $nwjs_archives_path
    if ($nwjs_archives.count -eq 2) {
      "NWJS packages were correclty built."
      $found = $true
    } else {
      "Oh no! The NWJS package build failed."
    }
  } else {
    "NWJS packages found."
    $found = $true
  }
}