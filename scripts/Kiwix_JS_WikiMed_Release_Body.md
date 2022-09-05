## Portable and installable builds for UWP and Electron

![WikiMed montage](https://user-images.githubusercontent.com/4304337/182706203-eca53649-8dea-44b9-ac4a-b08cc05c4252.png)

These custom apps are packaged with the <<date>> English-language WikiMed archive `<<zim>>`. They will run on 32bit and 64bit editions of Windows or Linux (tested on Ubuntu, Debian and OpenSUSE - but see instructions below). The Windows builds are **not compatible with Windows XP or Windows Vista**. If you need an app compatible with those old platforms, get [Kiwix JS Windows reader](https://kiwix.github.io/kiwix-js-windows/kiwix-js-nwjs.html) and download the latest WikiMed archive from within the app.

**MS Store status: IN CERTIFICATION**
**Winget status: IN CERTIFICATION**

Please choose the correct version (only the Store version will self update):

* **Windows**:
  - **Store app for Windows 10/11 (UWP)**
    + Install from the Microsoft Store: https://www.microsoft.com/store/apps/9PHJSNP1CZ8J (it will self-update automatically) - *recommended*
    + Or, on a PC, open a command prompt and run `winget install wikimed -s msstore` (self-updates)
    + Or, if you cannot use the Store, sideload a signed package with `winget install kiwix.wikimed` - this doesn't auto-update, but you can upgrade easily by running `winget upgrade` or `winget upgrade --all`
  - **Portable (Electron) - just unzip, no install needed**
    + Windows 7/8/10/11 - [WikiMed-by-Kiwix-<<base_tag>>-E.zip](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/WikiMed-by-Kiwix-<<base_tag>>-E.zip)
  - **Installable (Electron)**
    + Windows 7/8/10/11 - [WikiMed-by-Kiwix-Setup-<<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/WikiMed-by-Kiwix-Setup-<<numeric_tag>>-E.exe)
    + Alternatively, run `winget install kiwix.wikimed.electron` in a Windows 10/11 Terminal
* **Linux** (read important instructions below screenshot):
  - **Portable (Electron)**
    + AppImage 64bit (Ubuntu, Debian, OpenSUSE) - [WikiMed-by-Kiwix-<<numeric_tag>>-E.AppImage](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/WikiMed-by-Kiwix-<<numeric_tag>>-E.AppImage)
    + AppImage 32bit (Ubuntu, Debian, OpenSUSE) - [WikiMed-by-Kiwix-<<numeric_tag>>-E-i386.AppImage](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/WikiMed-by-Kiwix-<<numeric_tag>>-E-i386.AppImage)
  - **Installable (Electron)**
    + Deb package 64bit (Ubuntu, Debian) - [kiwix-js-wikimed_<<numeric_tag>>-E_amd64.deb](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/kiwix-js-wikimed_<<numeric_tag>>-E_amd64.deb)
    + Deb package 32bit (Ubuntu, Debian) - [kiwix-js-wikimed_<<numeric_tag>>-E_i386.deb](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/kiwix-js-wikimed_<<numeric_tag>>-E_i386.deb)

## Installation Instructions - Electron

* For the Windows Portable build, unzip the contents of the [WikiMed-by-Kiwix-<<base_tag>>-E.zip](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/WikiMed-by-Kiwix-<<base_tag>>-E.zip) archive to any folder, or to a flash drive / thumb drive, and double click on `Start WikiMed by Kiwix` or `Start WikiMed by Kiwix.bat`, or open the `kiwix-js-windows-win32-ia32` folder and double click on `WikiMed by Kiwix.exe`.
* For the Windows Setup (installable) build, simply download and launch. It will install itself, together with a shortcut in your shortcut menu, and run. When you want to update the app, just install a new version over it (it will uninstall the old one for you).
* For the Linux portable builds, download and save the correct AppImage file anywhere (e.g. your Desktop), and double-click it. If it doesn’t work, open Terminal and run `chmod a+x WikiMed-by-Kiwix*.AppImage` and then `./WikiMed-by-Kiwix*.AppImage`. If you have trouble with **Debian**, you may need to add the `--no-sandbox` switch to the command like this `./WikiMed-by-Kiwix*.AppImage --no-sandbox` (see https://github.com/electron/electron/issues/17972#issuecomment-516957971). With **OpenSUSE**, you may need to use these commandline switches instead: `./WikiMed-by-Kiwix*.AppImage --use-gl=disabled --disable-gpu-compositing`.¹
* For the Linux installable builds, download the correct `.deb` package. Open a terminal, `cd` to the directory containing the package, and type `sudo apt install ./kiwix-js-wikimed*.deb`. Once installed, on **Debian**, you may have to run the app by opening terminal and typing `kiwix-js-wikimed --no-sandbox`. On **Ubuntu**, you should be able to run it from its installed icon. When you want to update, just install the new version, and it will install over the old version. To install on **OpenSUSE**, it may be easiest to extract the files from the AppImage instead of using the Deb package. The executable is `kiwix-js-wikimed` and you may need to add the commandline switches `--use-gl=disabled --disable-gpu-compositing`.¹
* Windows: **Because the portable archive may not be commonly downloaded, you may face Windows SmartScreen issues** on first launch. Follow instructions to "Run anyway" if you trust this site. If you prefer, use the installable version [WikiMed-by-Kiwix-Setup-<<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/WikiMed-by-Kiwix-Setup-<<numeric_tag>>-E.exe) which is digitally signed.

¹ With many thanks to Jay Midura for documenting the switches needed for OpenSUSE.

## Release Notes

* This app is packaged with the <<date>> English-language WikiMed archive `<<zim>>`. The packaged archive is located in the `archives` folder (only accessible in the portable Windows version). See the readme in that folder if you wish to add a different archive as the packaged ZIM;
* You can download WikiMed in other languages from the Configuration page (see Known Issues below);
* It supports dark mode, and opening different navigable windows by right-clicking or ctrl-clicking a link (see Configuration);
* You can print by pressing Ctrl-P or using the print icon. If local printers are not available (after clicking on More options...) then print to PDF and use another app to print;
* You can open a new browsable window by right-clicking, middle-clicking or ctrl-clicking an article link (for UWP app, this only works in Service Worker mode);
* In title search, you can use wildcards `.*` or `.+` (this works best if you start the search with a normal alphanumeric string). You can include a more complex regular expression by enclosing it within `(?:my_regular_expression)`. See Configuration -> About for more details and limitations;
* You can search for any file in a ZIM by prefixing the namespace, e.g. `I/isaac.*newton` for images of Isaac Newton (or in no-namespace ZIMs `C/isaac.*newton.*webp`).

### Known Issues

* INCONSISTENCY: When printing in jQuery mode, all sections are opened before printing (if the user had closed any), whereas in SW mode, closed sections are not opened before printing;
* In the Electron version (not the UWP version): if you download an archive from within the app (from Configuration), you will be able to pick a download directory, and the download will start, but then there will be no further indication that a download is in progress. You will need to check the chosen download directory to see if the download has completed;
* Please see https://github.com/kiwix/kiwix-js-windows/issues for further known issues. If you find a new issue, please open a new issue on that page.

## Instructions for sideloading (UWP)

**New!** You can sideload the app easily by typing `winget install kiwix.wikimed` in a Command Prompt or PowerShell terminal (Windows 10 or 11).

For Windows Mobile or for sideloading manually, please download [KiwixWebAppWikiMed_<<base_tag>>.0_AnyCPU.appxbundle](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/KiwixWebAppWikiMed_<<base_tag>>.0_AnyCPU.appxbundle) and the zipped PowerShell script from Assets below. Then follow the detailed instructions at https://github.com/kiwix/kiwix-js-windows/tree/master/AppPackages#readme.
