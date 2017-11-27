# Kiwix JS for Windows
Development of the Kiwix JS app for Windows 10 Universal Windows Platform

This is a port of the Kiwix Offline Wikipedia (and other Wiki) reader for UWP on Windows 10.
It enables offline reading of a ZIM file downloaded from the Kiwix repository, including full
Wikipedia versions with or without images in many different languages. It has only been tested 
fully on Wikimedia ZIM files to date.

This began as a simple port of the HTML5 web app provided on this git-hub repository, although
significant development has been undertaken to add functionality and to make the app sit happily
with the Universal Windows Platform. This port is primarily intended for Windows Mobile, but it
should run as a UWP Store App on any Windows 10 platform: x86, x64, ARM, on Mobile, tablets, Xbox,
Surface Hub, Holographic and PC. It has been tested on Lumia 950XL (Mobile), Tablet/PC x64 
(Windows 10), and a Windows 10 Mobile VM.

If you would like to test the current build on a Windows Mobile device running Windows 10 Mobile,
download the .appxbundle under AppPackages/KiwixWebApp_0.x.x.x_Test/ and save it in your
downloads folder, or other accessible folder, on the phone. Enable Developer mode on your device
(Settings / Updates and security / For developers). Open the File Explorer on the phone, navigate
to the downloads folder and tap the KiwixWebApp bundle. You will be asked if you wish to install,
but it then installs silently in the background. Be patient: it can take a minute or so for the Kiwix
icon to appear in the All Apps list. You will also need to download a ZIM file to use with the app
(see below).

Installation on a Windows 10 PC involves sideloading with the PowerShell script. Download the full 
AppPackages/KiwixWebApp_0.x.x.x_Test/ folder to your PC (you can use https://minhaskamal.github.io/DownGit
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

The app is currently undergoing certification for the Windows Store.

The authors of the HTML5 app for Kiwix did all the work. Their source code runs almost "as is" on
the UWP platform, which is testament to how well written their app is. This port and further development 
for Windows 10 (Mobile) is by Geoffrey Kantaris. I can be contacted by email: egk10 at cam ac uk.

# Privacy Policy
Short answer:

	Kiwix JS Windows works entirely offline unless you specifically request otherwise on the Configuration page.
	We do not collect any of your personal data and don't even know what you are doing with this application.

Longer answer:

	Kiwix JS Windows will only access the Kiwix download server if you specifically request it to find and display
	download links for ZIM archives on the Configuration page.
    
	You can disable even this Internet access with an option on the same page. If you nevertheless believe your
	Internet access can be watched and/or if you are extremely cautious, you should shut down your 3G and WiFi
	access before using the application.
    
	This application only reads the archive files of your device: it is not capable of reading any other files.
                    