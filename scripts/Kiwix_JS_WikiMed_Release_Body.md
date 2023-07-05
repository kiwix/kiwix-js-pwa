## Portable and installable builds for UWP and Electron

WikiMed by Kiwix is an offline medical encyclopaedia with content curated by [MDwiki](https://mdwiki.org/) and Wikipedia's WikiProject Medicine. Containing more than 55,000 medical and health-related articles, it makes medical knowledge available to people with limited Internet access or anyone who needs quick reference access to in-depth medical information. Other languages can be downloaded within the app.

![WikiMed montage](https://user-images.githubusercontent.com/4304337/182706203-eca53649-8dea-44b9-ac4a-b08cc05c4252.png)

These custom apps are packaged with the <<date>> English-language WikiMed archive `<<zim>>`. They will run on 32bit and 64bit editions of Windows or Linux (tested on Ubuntu, Debian, Fedora and OpenSUSE). The Windows builds are **not compatible with Windows XP or Windows Vista**. If you need an app compatible with those old platforms, get [Kiwix JS Windows reader](https://kiwix.github.io/kiwix-js-windows/kiwix-js-nwjs.html) and download the latest WikiMed archive from within the app.

**MS Store status: IN CERTIFICATION**
**Winget status: IN CERTIFICATION**

Please choose the correct version:

* **Linux** (installation instructions below):
  - **Portable (Electron)**
    + AppImage 64bit (Ubuntu, Debian, Fedora, OpenSUSE) - [WikiMed-by-Kiwix-<<numeric_tag>>-E.AppImage](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/WikiMed-by-Kiwix-<<numeric_tag>>-E.AppImage)
    + AppImage 32bit (Ubuntu, Debian, Fedora, OpenSUSE) - [WikiMed-by-Kiwix-<<numeric_tag>>-E-i386.AppImage](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/WikiMed-by-Kiwix-<<numeric_tag>>-E-i386.AppImage)
  - **Installable (Electron)**
    + Deb package 64bit (Ubuntu, Debian) - [kiwix-js-wikimed_<<numeric_tag>>-E_amd64.deb](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/kiwix-js-wikimed_<<numeric_tag>>-E_amd64.deb)
    + Deb package 32bit (Ubuntu, Debian) - [kiwix-js-wikimed_<<numeric_tag>>-E_i386.deb](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/kiwix-js-wikimed_<<numeric_tag>>-E_i386.deb)

* **Windows**:
  - **Store app for Windows 10/11 (UWP)** - _recommended_ (self-updates)
    + Install from the Microsoft Store: https://www.microsoft.com/store/apps/9PHJSNP1CZ8J
    + Or, on a PC, open a command prompt and run `winget install wikimed -s msstore`
    + Or, if you cannot use the Store, sideload a signed package with `winget install kiwix.wikimed` - upgrade easily by running `winget upgrade kiwix.wikimed`
  - **Installable (Electron)**
    + Windows 10/11 64bit - [WikiMed-by-Kiwix-<<numeric_tag>>-E.appx](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/WikiMed-by-Kiwix-<<numeric_tag>>-E.appx) - new, modern install / uninstall
    + Windows 7/8/10/11 32bit (also runs on 64bit) - [WikiMed-by-Kiwix-Setup-<<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/WikiMed-by-Kiwix-Setup-<<numeric_tag>>-E.exe)
    + Alternatively, run `winget install kiwix.wikimed.electron` in a Windows 10/11 Terminal
  - **Portable (Electron) - just unzip, no install needed**
    + Windows 7/8/10/11 - [WikiMed-by-Kiwix-<<base_tag>>-E.zip](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/WikiMed-by-Kiwix-<<base_tag>>-E.zip)

## Installation Instructions - Electron

* For the Windows 64bit or 32bit installable builds, simply download and launch. It will install itself, together with a shortcut in your shortcut menu, and run. When you want to update the app, just install a new version over it (it will uninstall the old one for you).
* For the Windows Portable build, unzip the contents of the [WikiMed-by-Kiwix-<<base_tag>>-E.zip](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/WikiMed-by-Kiwix-<<base_tag>>-E.zip) archive to any folder, or to a flash drive / thumb drive, and double click on `Start WikiMed by Kiwix` or `Start WikiMed by Kiwix.bat`, or open the `kiwix-js-windows-win32-ia32` folder and double click on `WikiMed by Kiwix.exe`.
* **For the Linux _portable_ builds,** download and save the correct AppImage file anywhere (e.g. your Desktop), and double-click it. If it doesn’t work, open a terminal and run `chmod a+x WikiMed-by-Kiwix*.AppImage` and then `./WikiMed-by-Kiwix*.AppImage`.
  + On **_Debian_**, if you you have issues running the AppImage on older versions of the OS, you can try adding the `--no-sandbox` switch to the command (see https://github.com/electron/electron/issues/17972#issuecomment-516957971). This is not necessary on recent versions.
  + On **OpenSUSE** you may need to install Chrome in order to get the dependencies necessary to run the AppImage (because Electron apps run Chrome internally). With **_older_** versions of OpenSUSE, you may additionally need to use these commandline switches: `./WikiMed-by-Kiwix*.AppImage --use-gl=disabled --disable-gpu-compositing`,¹ but this is no longer necessary in recent versions.
* **For the Linux _installable_ builds:**
  + **_Debian/Ubuntu_**: download the correct `.deb` package. Open a terminal, `cd` to the directory containing the package, and type `sudo apt-get update` followed by `chmod a+x ./kiwix-js-wikimed*.deb`, then`sudo apt install ./kiwix-js-wikimed*.deb`. To run the app from the command line, rather than from its installed icon, simply type `kiwix-js-wikimed` in terminal. On **Debian**, if you receive the error `libgbm.so.1: cannot open shared object file`, please run `sudo apt install libgbm-dev`. On older versions of Debian, you may have to add `--no-sandbox` to the command line when running the app, i.e. `kiwix-js-wikimed --no-sandbox`. When you want to update, just install the new version, and it will install over the old version.
  + For **OpenSUSE** and **Fedora**, it may be easiest to extract the files from the AppImage instead of using the Deb package. The executable is `kiwix-js-wikimed`and on older versions of OpenSUSE you may need to add the commandline switches `--use-gl=disabled --disable-gpu-compositing`.¹
* Windows portable version: If you get a Windows Smartscreen notification on first launch of the zipped portable app, follow instructions to "Run anyway" if you trust this site. If you prefer, use the executable version (ending `.exe`) which is digitally signed.

¹ With many thanks to Jay Midura for documenting the switches needed for OpenSUSE.

## Release Notes

* This app is packaged with the <<date>> English-language WikiMed archive `<<zim>>`. The packaged archive is located in the `archives` folder (only accessible in the portable Windows version). See the readme in that folder if you wish to add a different archive as the packaged ZIM;
* You can download WikiMed in other languages from the Configuration page (see Known Issues below);
* It supports dark mode, and opening different navigable windows by right-clicking or ctrl-clicking a link (see Configuration);
* You can print by pressing Ctrl-P or using the print icon. If local printers are not available (after clicking on More options...) then print to PDF and use another app to print;
* You can open a new browsable window by right-clicking, middle-clicking or ctrl-clicking an article link (for UWP app, this only works in Service Worker mode);
* There is support for Full-Screen mode in most browsers and frameworks, and orientation locking in some mobile browsers (e.g. Android).
* Electron versions of the app now support Full-Text searching;
* In title search, you can use wildcards `.*` or `.+` (this works best if you start the search with a normal alphanumeric string). You can include a more complex regular expression by enclosing it within `(?:my_regular_expression)`. See Configuration -> About for more details and limitations;
* You can search for any file in a ZIM by prefixing the namespace, e.g. `I/isaac.*newton` for images of Isaac Newton (or in no-namespace ZIMs `C/isaac.*newton.*webp`).

### Known Issues

* **Printing**: In Electron apps, no preview is available prior to printing: we recommend you print to PDF first and then print the PDF, or use the PWA instead for printing (which has print preview). Before printing, ensure all sections you want to print are open (if you closed them).
* Please see https://github.com/kiwix/kiwix-js-windows/issues for further known issues. If you find a new issue, please open a new issue on that page.

## Instructions for sideloading (UWP)

You can sideload the app easily by typing `winget install kiwix.wikimed` in a Command Prompt or PowerShell terminal (Windows 10 or 11). This will download and install the Electron-based appx. If you want to install the legacy UWP appxbundle based on EdgeHTML, then simply download the appxbundle (see below) and double click it. The app installer should launch and will let you install it.

For Windows Mobile or for sideloading manually, please download [KiwixWebAppWikiMed_<<base_tag>>.0_AnyCPU.appxbundle](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/KiwixWebAppWikiMed_<<base_tag>>.0_AnyCPU.appxbundle) and the zipped PowerShell script from Assets below. Then follow the detailed instructions at https://github.com/kiwix/kiwix-js-windows/tree/main/AppPackages#readme.
