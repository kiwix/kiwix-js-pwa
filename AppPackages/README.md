# Installation Instructions (Windows/Linux)

The easiest way to install the UWP app on Windows 10/11 is from the Microsoft Store:

https://www.microsoft.com/en-gb/store/p/kiwix-js/9p8slz4j979j

There are portable and installable versions for Linux (Ubuntu, Debian, OpenSUSE), and Windows XP/Vista/7/8/10/11 available from https://kiwix.github.io/kiwix-js-pwa/kiwix-js-electron.html. The Store and Electron Setup and AppImage versions are self-updating. The `zip`, `deb` and `rpm` versions do not self-update.

There is a PWA version at https://pwa.kiwix.org/ which can be installed as an offline app in any Chromium browser (Chrome, Edge) -- see Install button in
Configuration. In Firefox, the app can be bookmarked, and will work offline, but it cannot be installed.

# Sideloading Instructions (Windows 10/11 and Mobile)

You can now sideload the app easily by opening a Command Prompt (Win key -> type "Command" or "Terminal" or "PowerShell") and at the commandline type
`winget install kiwix.kiwixjs`. If you don't have [`winget`](https://docs.microsoft.com/en-us/windows/package-manager/winget/) yet, or wish to test a
different build, then follow the instructions below. _Uninstall any previous installation of Kiwix JS Windows before you follow this procedure_.

## Windows 10/11 Tablet / PC

Starting in Windows 10 version 2004, **sideloading is enabled by default** and you can install apps by double-clicking signed app packages.
On Windows 10 version 1909 and earlier, sideloading requires some additional configuration, as does sideloading unsigned packages.

* **Simple procedure**: Just try launching your package! The Kiwix JS Windows packages downloadable from [Releases](https://github.com/kiwix/kiwix-js-pwa/releases/) are signed. Download the `.appxbundle` from the Assets section of a Release and launch it by double-clicking.
* If you wish to test an unsigned package, find an `.appxbundle` above inside `AppPackages/KiwixWebApp_x.x.x.x_[AnyCPU]_Test/` folders, and try to launch it by double-clicking.
* You may be prompted to allow sideloading, or you may need to enable it first on version 1909 or earlier: go to Settings -> Update and security -> For developers. If this doesn't work, follow procedure below.
* **You will need a ZIM archive to use the full features of this app** - [see below](#download-a-zim-archive-all-platforms).

**_If above procedure fails_**, the package may not be a signed one, or else you have an even older version of Windows 10. In this case, follow the more complex procedure below:

* Put your PC in Developer mode: Settings / Update and security / For developers (it is not enough to select "Sideload" for unsigned packages). Your device may need to download a developer package, install it, and restart.
* Then, launch a PowerShell command window: press Windows key and type PowerShell, right-click and "Run as Administrator".
* Type the following command: `Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope CurrentUser`
* Accept the warnings and ensure the script finished correctly. (The above steps are one-time only: you shouldn't need to repeat them to install future builds.)
* Follow ONE of the following procedures:
  + EITHER if you got the bundle from Releases, then also download the corresponding file `PowerShell.Installation.Script.KiwixWebApp_x.x.x.x_Test.zip` from the Release. Unzip this and put the appxbundle in the same folder where you unzipped the files.
  + OR if you want a bundle from above, then go to `AppPackages/KiwixWebApp_x.x.x.x_[AnyCPU]_Test/` folder above and download **all** the files in the folder and subfolder. You can either do this by cloning the repository, or you can use https://minhaskamal.github.io/DownGit to download a zipped version of the folder (recommended). Unzip in your downloads folder, or other accessible folder. Ensure the directory structure is intact.
* Now you can right-click `Add-AppDevPackage.ps1` and select `Run with PowerShell`. This is the simplest method to install the certificate and the app at the same time.
* If you see a red message flash, and the window closes, then go to your PowerShell terminal, navigate to the folder containing the script, and type `.\Add-AppDevPackage.ps1` (NB the `.\` is important). Observe and follow instructions to address the issue.

## Windows 10 Mobile

Download the .appx or .appxbundle from [Releases](https://github.com/kiwix/kiwix-js-pwa/releases), or open an `AppPackages/KiwixWebApp_0.x.x.x_[AnyCPU]_Test/` folder above, and save it in your downloads folder, or other accessible folder, on the phone. NB DO NOT DOWNLOAD the .appxupload files you see above, as these are useless for installation.

Enable Developer mode on your device (Settings / Updates and security / For developers). Open the File Explorer on the phone, navigate to the downloads folder and tap the KiwixWebApp bundle. You will be asked if you wish to install, but it then installs silently in the background. Be patient: it can take a minute or so for the Kiwix icon to appear in the All Apps list. You will also need to download a ZIM file to use with the app (see below).

## Download a ZIM archive (all platforms)

You will need a ZIM file to work with this app. For testing, it comes packaged either with the Ray Charles ZIM or the Top 100 Wikipedia (English) articles ZIM. You can download other ZIM archives from the setup page in the app (the download completes in the browser). Place the file in an accessible location on your device, and use the Rescan Storage button in the app to display buttons that let you pick the file or the file's folder.

Alternatively, you can download files from https://library.kiwix.org on a regular PC. Some ZIM files are very large (full English Wikipedia with images is over 90GB) -- we suggest you
use BitTorrent to download these files: the app will provide you with a BitTorrent file or a Magnet link for large files - just open the download Library in Configuration, browse for
your ZIM and click on it: an information page with links will be shown. Generally the BitTorrent file is a bit more efficient than the Magnet link, especially for files that are not
frequently downloaded via BitTorrent.

### Splitting your ZIM archive (for FAT32 storage)

**NB If your SD card or hard drive is formatted as exFAT or NTFS, you *do not need to do this procedure!***

If you plan to store a large ZIM file > 4GB on an SD card or other drive formatted as **FAT32** (most are not), then you may need to use a programme like (on Windows)
[File Splitter and Joiner](http://www.fastfilejoiner.com/), or (on Linux) `split` (see below), to split the file into 4GiB-1 chunks. Chunks must be exactly 4,294,967,295 bytes
**or any number less than this**. You will need to give a file extension to each chunk in the right order following this pattern: `*.zimaa`, `*.zimab`, `*.zimac`, `...`, etc.).

On both Linux and Windows 11 WSL (Windows Subsystem for Linux), you can use the `split` command in a Terminal. Open a Terminal / launch WSL, and type
`split --bytes=4000M wikipedia_en_all_maxi_2021-12.zim wikipedia_en_all_maxi_2021-12.zim` (adapt the name of the ZIM archive accordingly),
and the file will be split into the correct parts (if you have sufficient disk space).
