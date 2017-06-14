# KiwixJS
Port of the Kiwix HTML5 app for Windows 10 Universal Windows Platform

This is a port of the Kiwix Offline Wikipedia (and other Wikis) reader for UWP on Windows 10.
It enables offline reading of a ZIM file downloaded from the Kiwix repository, including full
Wikipedia versions with or without images in many different languages.

This is a simple port of the HTML5 web app provided by Kiwix here: https://github.com/kiwix/
It is primarily intended for Windows Mobile, but if possible I aim to make it available as a UWP
Store App which will run on any Windows 10 platform: x86, x64, ARM.

If you would like to test the current build on a Windows Mobile device running Windows 10 Mobile,
download the .appxbundle under KiwixWebApp/AppPackages/KiwixWebApp_0.x.x.x_Test/ and save it in your
downloads folder, or other accessible folder, on the phone. Enable Developer mode on your device
(Settings / Updates and security / For developers). Open the File Explorer on the phone, navigate
to the downloads folder and tap the KiwixWebApp bundle. You will be asked if you wish to install.

Installation on a Windows 10 PC involves sideloading with the PowerShell script. Download the full 
KiwixWebApp/AppPackages/KiwixWebApp_0.x.x.x_Test/ folder to your PC. Turn on Developer mode (Settings /
Update and security / For developers). Right-click Add-AppDevPackage.ps1 inside the folder and run with
PowerShell. You may be prompted to install a developer's certificate.

The authors of the HTML5 app for Kiwix did all the work. Their source code runs almost "as is" on
the UWP platform. This initial port for Windows 10 (Mobile) is by Geoffrey Kantaris. If you need to,
you can contact me at this email: egk10 at cam ac uk.
