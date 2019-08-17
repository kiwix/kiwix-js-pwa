# Installation Instructions (Windows 10 Mobile or PC required)
The easiest way to install Kiwix JS Windows is from the Microsoft Store:

https://www.microsoft.com/en-gb/store/p/kiwix-js/9p8slz4j979j
 
If you prefer not to use the Microsoft Store or wish to test a different build, please follow the
instructions below. Uninstall any previous installation of Kiwix JS Windows before you follow this
procedure:

## Windows 10 Mobile
Download the .appx or .appxbundle under AppPackages/KiwixWebApp_0.x.x.x_[AnyCPU]_Test/ and save it in
your downloads folder, or other accessible folder, on the phone. NB DO NOT DOWNLOAD the .appxupload files
you see above, as these are useless for installation. Instead of one of the packages above,
you may prefer to use an .appxbundle from https://github.com/kiwix/kiwix-js-windows/releases (they are
the same). Enable Developer mode on your device (Settings / Updates and security / For developers). 
Open the File Explorer on the phone, navigate to the downloads folder and tap the KiwixWebApp bundle.
You will be asked if you wish to install, but it then installs silently in the background. Be patient:
it can take a minute or so for the Kiwix icon to appear in the All Apps list. You will also need to download
a ZIM file to use with the app (see below).

## Windows 10 Tablet / PC
You must first put your PC in Developer mode: Settings / Update and security / For developers. It is not enough
to select "Sideload", as these packages require "Developer mode". Your device may need to download a developer
package, install it, and restart.

Then, launch a PowerShell command window: press Windows key and type PowerShell, right-click and "Run as Administrator".
Type the following command:

`Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope CurrentUser`

Accept the warnings and ensure the script finished correctly. (The above steps are one-time only: you shouldn't need
to repeat them to install future builds.)

Now go to the latest `AppPackages/KiwixWebApp_0.x.x.x_[AnyCPU]_Test/` folder above and download **all** the files
in the folder and subfolder. You can either do this by cloning the repository, or you can use
https://minhaskamal.github.io/DownGit to download a zipped version of the folder (recommended). Unzip in your downloads folder,
or other accessible folder. Ensure the directory structure is intact.

Now you can right-click `Add-AppDevPackage.ps1` and select `Run with PowerShell`. This is the simplest method to install the
certificate and the app at the same time. If you see a red message flash, and the window closes, then go to your PowerShell
terminal, navigate to the folder containing the script, and type `.\Add-AppDevPackage.ps1` (NB the `.\` is important). Observe
and follow instructions to address the issue.

## Download a ZIM archive (all platforms)
You will need a ZIM file to work with this app. For testing, it comes packaged with the Ray Charles ZIM.
You can download other ZIM archives from the setup page in the app (the download completes in the browser).
Place the file in an accessible location on your device, and use the Rescan Storage button in the app to
display buttons that let you pick the file or the file's folder.

Alternatively, you can download files from http://wiki.kiwix.org/wiki/Content_in_all_languages on a regular
PC. The single non-indexed ZIM files work best. However, if you plan to store your ZIM file on an SD card 
formatted as FAT32, you will only be able to use the split files (.zimaa, .zimab, etc.) in the pre-indexed
archives. If your SD card is formatted as exFAT or NTFS, you can use either, but single file is easiest.                    
