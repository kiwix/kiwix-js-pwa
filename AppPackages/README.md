# Installation Instructions (Windows 10 Mobile or PC required)
The easiest way to install Kiwix JS Windows is from the Microsoft Store:
https://www.microsoft.com/en-gb/store/p/kiwix-js/9p8slz4j979j
 
If you prefer not to use the Microsoft Store, please follow the instructions below. Uninstall any
previous installation of Kiwix JS Windows before you follow this procedure:

If you would like to test the current build on a Windows Mobile device running Windows 10 Mobile,
download the .appxbundle under AppPackages/KiwixWebApp_0.x.x.x_AnyCPU_Test/ and save it in your
downloads folder, or other accessible folder, on the phone. Enable Developer mode on your device
(Settings / Updates and security / For developers). Open the File Explorer on the phone, navigate
to the downloads folder and tap the KiwixWebApp bundle. You will be asked if you wish to install,
but it then installs silently in the background. Be patient: it can take a minute or so for the Kiwix
icon to appear in the All Apps list. You will also need to download a ZIM file to use with the app
(see below).

Installation on a Windows 10 PC involves sideloading with the PowerShell script. Download the full 
AppPackages/KiwixWebApp_0.x.x.x_AnyCPU_Test/ folder to your PC (you can use https://minhaskamal.github.io/DownGit
to do this). Turn on Developer mode (Settings / Update and security / For developers). Open the folder
in File Explorer, Right-click the Add-AppDevPackage.ps1 inside the folder and choose to run with PowerShell.
You may be prompted to install the developer's certificate.

You will need a ZIM file to work with this app. For testing, it comes packaged with the Ray Charles ZIM.
You can download other ZIM archives from the setup page in the app (the download completes in the browser).
Place the file in an accessible location on your device, and use the Rescan Storage button in the app to
display buttons that let you pick the file or the file's folder.

Alternatively, you can download files from http://wiki.kiwix.org/wiki/Content_in_all_languages on a regular
PC. The single non-indexed ZIM files work best. However, if you plan to store your ZIM file on an SD card 
formatted as FAT32, you will only be able to use the split files (.zimaa, .zimab, etc.) in the pre-indexed
archives. If your SD card is formatted as exFAT or NTFS, you can use either, but single file is easiest.                    