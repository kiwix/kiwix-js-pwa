# Installation Instructions (Windows 10 Tablet, PC, Mobile)

The easiest way to install Kiwix JS Windows is from the Microsoft Store:

https://www.microsoft.com/en-gb/store/p/kiwix-js/9p8slz4j979j

The second easiest way is to open a Command Prompt (Win key -> type "Command" or "Terminal" or "PowerShell") and at the commandline type `winget install kiwix`. If you don't
have [`winget`](https://docs.microsoft.com/en-us/windows/package-manager/winget/) yet, or wish to test a different build, then follow the instructions below. _Uninstall any
previous installation of Kiwix JS Windows before you follow this procedure_.

## Windows 10 Tablet / PC

Starting in Windows 10 version 2004, **sideloading is enabled by default** and you can install apps by double-clicking signed app packages.
On Windows 10 version 1909 and earlier, sideloading requires some additional configuration, as does sideloading unsigned packages.

* **Simple procedure**: Just try launching your package! The Kiwix JS Windows packages downloadable from [Releases](https://github.com/kiwix/kiwix-js-windows/releases/) are signed. Download the `.appxbundle` from the Assets section of a Release and launch it by double-clicking.
* If you wish to test an unsigned package, find an `.appxbundle` above inside `AppPackages/KiwixWebApp_x.x.x.x_[AnyCPU]_Test/` folders, and try to launch it by double-clicking.
* You may be prompted to allow sideloading, or you may need to enable it first on version 1909 or earlier: go to Settings -> Update and security -> For developers. If this doesn't work, follow procedure below.
* **You will need a ZIM archive to use the full features of this app** - [see below](#download-a-zim-archive-all-platforms).

**_If above procedure fails_**, the package may not be a signed one, or else you have an even older version of Windows 10. In this case, follow the more complex procedure below:

* Put your PC in Developer mode: Settings / Update and security / For developers (it is not enough to select "Sideload" for unsigned packages). Your device may need to download
*  a developer package, install it, and restart.
* Then, launch a PowerShell command window: press Windows key and type PowerShell, right-click and "Run as Administrator".
* Type the following command: `Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope CurrentUser`
* Accept the warnings and ensure the script finished correctly. (The above steps are one-time only: you shouldn't need to repeat them to install future builds.)
* Now go to the latest `AppPackages/KiwixWebApp_x.x.x.x_[AnyCPU]_Test/` folder above and download **all** the files in the folder and subfolder. You can either do this by cloning the repository, or you can use https://minhaskamal.github.io/DownGit to download a zipped version of the folder (recommended).
* Unzip in your downloads folder, or other accessible folder. Ensure the directory structure is intact.
* Now you can right-click `Add-AppDevPackage.ps1` and select `Run with PowerShell`. This is the simplest method to install the certificate and the app at the same time.
* If you see a red message flash, and the window closes, then go to your PowerShell terminal, navigate to the folder containing the script, and type `.\Add-AppDevPackage.ps1` (NB the `.\` is important). Observe and follow instructions to address the issue.

## Windows 10 Mobile

Download the .appx or .appxbundle (inside `AppPackages/KiwixWebApp_0.x.x.x_[AnyCPU]_Test/` folder above) and save it in your downloads folder, or other accessible folder, on the phone. NB DO NOT DOWNLOAD the .appxupload files you see above, as these are useless for installation. Instead of one of the packages above, you may prefer to use an .appxbundle from https://github.com/kiwix/kiwix-js-windows/releases (they are the same).

Enable Developer mode on your device (Settings / Updates and security / For developers). Open the File Explorer on the phone, navigate to the downloads folder and tap the KiwixWebApp bundle. You will be asked if you wish to install, but it then installs silently in the background. Be patient: it can take a minute or so for the Kiwix icon to appear in the All Apps list. You will also need to download a ZIM file to use with the app (see below).

## Download a ZIM archive (all platforms)

You will need a ZIM file to work with this app. For testing, it comes packaged either with the Ray Charles ZIM or the Top 100 Wikipedia (English) articles ZIM. You can download other ZIM archives from the setup page in the app (the download completes in the browser). Place the file in an accessible location on your device, and use the Rescan Storage button in the app to display buttons that let you pick the file or the file's folder.

Alternatively, you can download files from http://wiki.kiwix.org/wiki/Content_in_all_languages on a regular PC. Some ZIM files are very large (full English Wikipedia with images is over 90GB) -- we suggest you use BitTorrent to download these files: the app will provide you with a BitTorrent link for large files - just open the download Library in Configuration, browse for your ZIM and click on it: an information page with links will be shown.

### Splitting your ZIM archive (for FAT32 storage)

If you plan to store your ZIM file on an SD card or other drive formatted as **FAT32**, you may need to use a programme like
[File Splitter and Joiner](http://www.fastfilejoiner.com/) to split the file into 4GiB-1 chunks (chunks must be exactly 4,294,967,295 bytes **or less**). You will need to give a
file extension to each chunk in the right order following this pattern: `*.zimaa`, `*.zimab`, `*.zimac`, `...`, etc.). However, if your SD card is formatted as exFAT or NTFS,
you *do not need to do this*.
