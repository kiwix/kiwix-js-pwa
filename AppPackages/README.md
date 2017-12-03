# Installation Instructions (Windows 10 Mobile or PC required)
The easiest way to install Kiwix JS Windows is from the Microsoft Store:

https://www.microsoft.com/en-gb/store/p/kiwix-js/9p8slz4j979j
 
If you prefer not to use the Microsoft Store or wish to test a different build, please follow the
instructions below. Uninstall any previous installation of Kiwix JS Windows before you follow this
procedure:

## Windows 10 Mobile
Download the .appx or .appxbundle under AppPackages/KiwixWebApp_0.x.x.x_[AnyCPU]_Test/ and save it in
your downloads folder, or other accessible folder, on the phone. Enable Developer mode on your device
(Settings / Updates and security / For developers). Open the File Explorer on the phone, navigate
to the downloads folder and tap the KiwixWebApp bundle. You will be asked if you wish to install,
but it then installs silently in the background. Be patient: it can take a minute or so for the Kiwix
icon to appear in the All Apps list. You will also need to download a ZIM file to use with the app
(see below).

## Windows 10 Tablet / PC
You may be able to use the built-in App Installer. If the build is signed (builds intended for the 
Microsoft Store) and you have Windows 10 Fall Creators Update, then download the .appx or .appxbundle 
under AppPackages/KiwixWebApp_0.x.x.x_[AnyCPU]_Test/ and save it in your downloads folder, or other 
accessible folder. Open the folder, right-click the file and select "Open". The installer should load
and allow you to install the app.

If the above procedure fails, or for unsigned builds, then you will need to sideload with the PowerShell
script. First turn on Developer mode: Settings / Update and security / For developers. Download the full 
AppPackages/KiwixWebApp_0.x.x.x[_AnyCPU]_Test/ folder that you wish to test to your PC (you can use
https://minhaskamal.github.io/DownGit to do this). Open the folder in File Explorer, Right-click the
Add-AppDevPackage.ps1 inside the folder and choose to run with PowerShell. You may be prompted to install
the developer's certificate.

## Download a ZIM archive (all platforms)
You will need a ZIM file to work with this app. For testing, it comes packaged with the Ray Charles ZIM.
You can download other ZIM archives from the setup page in the app (the download completes in the browser).
Place the file in an accessible location on your device, and use the Rescan Storage button in the app to
display buttons that let you pick the file or the file's folder.

Alternatively, you can download files from http://wiki.kiwix.org/wiki/Content_in_all_languages on a regular
PC. The single non-indexed ZIM files work best. However, if you plan to store your ZIM file on an SD card 
formatted as FAT32, you will only be able to use the split files (.zimaa, .zimab, etc.) in the pre-indexed
archives. If your SD card is formatted as exFAT or NTFS, you can use either, but single file is easiest.                    