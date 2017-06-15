# KiwixJS
Port of the Kiwix HTML5 app for Windows 10 Universal Windows Platform

This is a port of the Kiwix Offline Wikipedia (and other Wiki) reader for UWP on Windows 10.
It enables offline reading of a ZIM file downloaded from the Kiwix repository, including full
Wikipedia versions with or without images in many different languages. It has only been tested 
on Wikipedia ZIM files to date.

This is a simple port of the HTML5 web app provided on this git-hub repository. This port is
primarily intended for Windows Mobile, but it will run as a UWP Store App on any Windows 10
platform: x86, x64, ARM, on Mobile, tablets, Xbox, holographic and PC.

If you would like to test the current build on a Windows Mobile device running Windows 10 Mobile,
download the .appxbundle under AppPackages/KiwixWebApp_0.x.x.x_Test/ and save it in your
downloads folder, or other accessible folder, on the phone. Enable Developer mode on your device
(Settings / Updates and security / For developers). Open the File Explorer on the phone, navigate
to the downloads folder and tap the KiwixWebApp bundle. You will be asked if you wish to install,
but it then installs silently in the background. Be patient: it can take a minute or so for the Kiwix
icon to appear in the All Apps list

Installation on a Windows 10 PC involves sideloading with the PowerShell script. Download the full 
AppPackages/KiwixWebApp_0.x.x.x_Test/ folder to your PC. Turn on Developer mode (Settings /
Update and security / For developers). Open the folder in File Explorer, Right-click the
Add-AppDevPackage.ps1 inside the folder and choose to run with PowerShell. You may be prompted to
install the developer's certificate.

Our intention is to make this app available in the Windows Store, when ready.

The authors of the HTML5 app for Kiwix did all the work. Their source code runs almost "as is" on
the UWP platform. This initial port for Windows 10 (Mobile) is by Geoffrey Kantaris. I can be contacted
by email: egk10 at cam ac uk.
