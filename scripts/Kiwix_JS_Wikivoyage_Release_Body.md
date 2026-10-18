## Portable and installable builds for UWP and Electron

Wikivoyage by Kiwix is an offline travel guide featuring more than 33,000 destinations worldwide. It contains the English-language content, including images, of the [Wikivoyage](https://www.wikivoyage.org/) online wiki, Wikipedia's official sister site. Other languages can be downloaded within the app.

![Wikivoyage_refresh](https://github.com/kiwix/kiwix-js-pwa/assets/4304337/c7c45ba6-169f-4e2e-95d7-aa5343ac3461)

These custom apps are packaged with the <<date>> English-language Wikivoyage archive `<<zim>>`. They run on Windows (64bit, 32bit and ARM64), Linux (64bit, 32bit and ARM64, tested on Ubuntu, Debian, Fedora and OpenSUSE) and macOS (Apple Silicon and Intel). The Windows builds are **not compatible with Windows XP or Windows Vista**. If you need an app compatible with those old platforms, get [Kiwix JS Windows reader](https://kiwix.github.io/kiwix-js-pwa/app/nwjs.html) and download the latest Wikivoyage archive from within the app.

**Updates:** only the Microsoft Store app is updated automatically (by the Store). The other packages do not update themselves, because each one contains the whole archive. If you allow the app to access the Internet, it will tell you when a new release is available: download it from the release page and install it over the old version, or upgrade it with winget if you installed it that way.

**MS Store status: IN CERTIFICATION**
**Winget status: IN CERTIFICATION**

Please choose the correct version:

* **Linux** (installation instructions below):
  - **Portable (Electron)**
    + AppImage 64bit (Ubuntu, Debian, Fedora, OpenSUSE) - [Wikivoyage-by-Kiwix-<<numeric_tag>>-E.AppImage](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>-Wikivoyage/Wikivoyage-by-Kiwix-<<numeric_tag>>-E.AppImage)
    + AppImage ARM64 for Linux on ARM only (Ubuntu, Debian, Fedora, OpenSUSE, Raspberry Pi OS 64-bit on Pi 3 or later) - [Wikivoyage-by-Kiwix-<<numeric_tag>>-E-arm64.AppImage](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>-Wikivoyage/Wikivoyage-by-Kiwix-<<numeric_tag>>-E-arm64.AppImage) 
    + AppImage 32bit (Ubuntu, Debian, Fedora, OpenSUSE) - [Wikivoyage-by-Kiwix-<<numeric_tag>>-E-i386.AppImage](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>-Wikivoyage/Wikivoyage-by-Kiwix-<<numeric_tag>>-E-i386.AppImage)
  - **Installable (Electron)**
    + Deb package 64bit (Ubuntu, Debian) - [kiwix-js-wikivoyage_<<numeric_tag>>-E_amd64.deb](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>-Wikivoyage/kiwix-js-wikivoyage_<<numeric_tag>>-E_amd64.deb)
  
* **Windows**:
  - **Store app for Windows 10/11** - _recommended_ (updated automatically by the Store)
    + Install from the Microsoft Store: https://apps.microsoft.com/detail/9N5SB90Q4JBJ
    + Or, on a PC, open a command prompt and run `winget install wikivoyage -s msstore`
  - **Installable (Electron)** - _does not update itself_
    + Windows 10/11 Web installer (auto selects correct package, supports 64bit, 32bit, Windows on ARM64): [Wikvoyage-by-Kiwix-Web-Setup-<<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>-Wikivoyage/Wikivoyage-by-Kiwix-Web-Setup-<<numeric_tag>>-E.exe)
    + Windows 10/11 64bit modern MSIX install / uninstall: [Wikivoyage-by-Kiwix-<<numeric_tag>>-E.appx](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>-Wikivoyage/Wikivoyage-by-Kiwix-<<numeric_tag>>-E.appx) - or run `winget install kiwix.wikivoyage`, and later `winget upgrade kiwix.wikivoyage` to upgrade it
    + Windows 10/11 standalone 32bit installer (also runs on 64bit): [Wikivoyage-by-Kiwix-Setup-<<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>-Wikivoyage/Wikivoyage-by-Kiwix-Setup-<<numeric_tag>>-E.exe)
    + Windows 7/8/8.1 standalone 32bit installer: [Wikivoyage-by-Kiwix-Win7-Setup-<<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>-Wikivoyage/Wikivoyage-by-Kiwix-Win7-Setup-<<numeric_tag>>-E.exe)
    + Alternatively, run `winget install kiwix.wikivoyage.electron` in a Windows 10/11 Terminal to install the 32bit installer, and later `winget upgrade kiwix.wikivoyage.electron` to upgrade it
  - **Portable (Electron) - just unzip, no install needed**
    + Windows 10/11 32bit (also runs on 64bit): [Wikivoyage-by-Kiwix-<<base_tag>>-E.zip](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>-Wikivoyage/Wikivoyage-by-Kiwix-<<base_tag>>-E.zip) (for Win7/8/8.1, please use the Win7 installer above)

* **macOS** (signed and notarized by Apple - _see installation instructions below_):
  - **Disk images (Electron)**
    + macOS 12+ (Monterey or later) Apple Silicon (M1/M2/M3): [Wikivoyage-by-Kiwix-<<numeric_tag>>-E-macOS-arm64.dmg](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>-Wikivoyage/Wikivoyage-by-Kiwix-<<numeric_tag>>-E-macOS-arm64.dmg) - *recommended for Apple Silicon Macs*
    + macOS 12+ (Monterey or later) Intel (x64): [Wikivoyage-by-Kiwix-<<numeric_tag>>-E-macOS-x64.dmg](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>-Wikivoyage/Wikivoyage-by-Kiwix-<<numeric_tag>>-E-macOS-x64.dmg)
    + macOS 10.13-11 (High Sierra, Mojave, Big Sur) Intel (x64): [Wikivoyage-by-Kiwix-<<numeric_tag>>-E-macOS-HighSierra.dmg](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>-Wikivoyage/Wikivoyage-by-Kiwix-<<numeric_tag>>-E-macOS-HighSierra.dmg)

## Installation Instructions - Electron

### Windows
* For the Windows Web installer, simply download and launch. It will select the correct architecture automatically and install itself, together with a shortcut in yourshortcut menu. When you want to update the app, just install a new version over it (it will uninstall the old one for you). **Please note that the Web installer needs Web access during the installation.** If this is a problem, then use the standalone installer.
* For the Windows Portable build, unzip the contents of the [Wikivoyage-by-Kiwix-<<base_tag>>-E.zip](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>-Wikivoyage/Wikivoyage-by-Kiwix-<<base_tag>>-E.zip) archive to any folder, or to a flash drive / thumb drive, and double click on `Start Wikivoyage by Kiwix` or `Start Wikivoyage by Kiwix.bat`, or open the `kiwix-js-pwa-win32-ia32` folder and double click on `Wikivoyage by Kiwix.exe`.
* For Windows 7/8/8.1, due to the deprecation of Chromium on these platforms, we now only provide one option: a standalone installer built with the last version of Electron that supported Chrome on Windows 7+. This is also a 32bit package (but will run on 64bit).
* **Microsoft Defender SmartScreen warning:** If you get a Smartscreen notification when downloading an `.exe`, or on first launch of the zipped portable apps, follow instructions to "Run anyway" if you trust this site. Additionally, when you first download an `.exe` installer, you may get a warning in your downloads "Kiwix-JS-Electron isn't commonly downloaded". If you see this, click on the file and choose "Keep anyway". A second screen may then popup telling you the publisher. So long as it's kiwix, then click on "Show more" and allow the app. If you prefer, use one of the appx versions (ending `.appx` or `.appxbundle`) as this format runs in a secure, isolated container.

### Linux
* **For the Linux _portable_ builds,** download and save the correct AppImage file anywhere (e.g. your Desktop), and double-click it. If it doesn’t work, open a terminal and run `chmod a+x Wikivoyage-by-Kiwix*.AppImage` and then `./Wikivoyage-by-Kiwix*.AppImage`.
  + On recent Linux (notably Ubuntu) you may need to install fuse2 by typing `sudo apt install libfuse2` (see [here](https://www.omgubuntu.co.uk/2023/04/appimages-libfuse2-ubuntu-23-04)).
  + On older **_Debian_**, you may need to add the `--no-sandbox` switch to the command (see https://github.com/electron/electron/issues/17972#issuecomment-516957971). This is not necessary on recent versions.
  + On **_OpenSUSE_**, you may need to install Chrome in order to get the dependencies necessary to run the AppImage (because Electron apps run Chrome internally). With **_older_** versions of OpenSUSE, you may additionally need to use these commandline switches: `./Wikivoyage-by-Kiwix*.AppImage --use-gl=disabled --disable-gpu-compositing`,¹ but this is no longer necessary in recent versions.
* **For the Linux _installable_ builds:**
  + **_Debian/Ubuntu_**: download the correct `.deb` package. Open a terminal, `cd` to the directory containing the package, and type `sudo apt-get update` followed by `chmod a+x ./kiwix-js-wikivoyage*.deb`, then `sudo apt install ./kiwix-js-wikivoyage*.deb`. To run the app from the command line, rather than from its installed icon, simply type `kiwix-js-wikivoyage` in terminal. On **Debian**, if you receive the error `libgbm.so.1: cannot open shared object file`, please run `sudo apt install libgbm-dev`. On older versions of Debian, you may have to add `--no-sandbox` to the command line when running the app, i.e. `kiwix-js-wikivoyage --no-sandbox`. When you want to update, just install the new version, and it will install over the old version.
  + For **OpenSUSE** and **Fedora**, it may be easiest to extract the files from the AppImage instead of using the Deb package. The executable is `kiwix-js-wikivoyage` and on older versions of OpenSUSE you may need to add the commandline switches `--use-gl=disabled --disable-gpu-compositing`.¹

### Apple Mac
* **For macOS builds**: download the correct disk image (`.dmg`) for your Mac's architecture and macOS version (Apple Silicon, Intel, or the High Sierra build for macOS 10.13 to 11). Double-click it to open, then drag **Wikivoyage by Kiwix** onto the **Applications** shortcut in the window that appears. **No Terminal commands are needed.**
  + **If you do not have administrator rights** on the Mac (a work, school or hosted machine), dropping the app on the Applications shortcut will ask for an administrator password. Instead, open a second Finder window on your home folder (press ⇧⌘H) or the Desktop, and drag the **Wikivoyage by Kiwix** app icon out of the disk image window into it. It runs exactly the same way from there, and no password is needed. Note that it is the app _inside_ the disk image that you need to drag: copying the `.dmg` file itself somewhere else does not install anything.
  + **Please do drag it somewhere first**, rather than running it straight from the disk image. An app run from the disk image needs the image to stay mounted, and macOS runs a freshly downloaded app from a temporary, randomised location until you move it with the Finder.
  + **The first time you launch**, macOS will ask whether you are sure you want to open an app downloaded from the Internet, and will confirm that "Apple checked it for malicious software and none was detected". Click **Open**. You will only see this once: macOS will not ask again on subsequent launches.
  + **Security note:** these builds are **signed with a Developer ID Application certificate and notarized by Apple**. If macOS instead tells you the app is damaged, or that the developer cannot be verified, then you do not have an official release build - please download again from the Assets on this page.
  + **Architecture Selection:**
    + **Apple Silicon Macs** (M1/M2/M3/M4) on **macOS 12 Monterey or later**: Use the ARM64 image for optimal performance
    + **Intel Macs** on **macOS 12 Monterey or later**: Use the x64 image
    + **macOS 10.13 to 11 (High Sierra to Big Sur)**: Use the HighSierra image. This is built with an older version of Electron so that it still runs on these systems, and it also runs on Apple Silicon Macs via Rosetta. macOS will refuse to open the ARM64 or x64 versions on these systems
    + If unsure, click the Apple menu > About This Mac - it shows both your macOS version and, in the processor information, "Apple M1/M2/M3/M4" (Apple Silicon) or "Intel"
* **Troubleshooting:** If you encounter issues, ensure you're using the correct architecture version for your Mac. The ARM64 version provides significantly better performance on Apple Silicon Macs. Note that **nightly builds are deliberately not signed**, and need extra steps to run: see [Running unsigned macOS builds](https://github.com/kiwix/kiwix-js-pwa/tree/main/AppPackages#running-unsigned-macos-builds-nightlies-and-test-builds).

¹ With many thanks to Jay Midura for documenting the switches needed for OpenSUSE.

## Release Notes

* This app is packaged with the <<date>> English-language Wikivoyage archive `<<zim>>`. The packaged archive is located in the `archives` folder (where this is accessible). See the readme in that folder if you wish to add a different archive as the packaged ZIM;
* You can download Wikivoyage in other languages from the Configuration page (see Known Issues below);
* It supports dark mode, and opening different navigable windows by right-clicking or ctrl-clicking a link (see Configuration);
* You can print by pressing Ctrl-P or using the print icon. If local printers are not available (after clicking on More options...) then print to PDF and use another app to print;
* You can open a new browsable window by right-clicking, middle-clicking or ctrl-clicking an article link (not available in every mode, see option in Configuration);
* There is support for Full-Screen mode in most browsers and frameworks, and orientation locking in some mobile browsers (e.g. Android).
* Electron versions of the app (and the UWP) support Full-Text searching;
* In title search, you can use wildcards `.*` or `.+` (this works best if you start the search with a normal alphanumeric string). You can include a more complex regular expression by enclosing it within `(?:my_regular_expression)`. See Configuration -> About for more details and limitations;
* You can search for any file in a ZIM by prefixing the namespace, e.g. `I/isaac.*newton` for images of Isaac Newton (or in no-namespace ZIMs `C/isaac.*newton.*webp`).

### Known Issues

* **Printing**: In Electron apps, no preview is available prior to printing: we recommend you print to PDF first and then print the PDF, or open the Wikivoyage archive in the [Kiwix JS PWA](https://pwa.kiwix.org/) for printing (which has print preview). Before printing, ensure all sections you want to print are open (if you closed them).
* Please see https://github.com/kiwix/kiwix-js-pwa/issues for further known issues. If you find a new issue, please open a new issue on that page.

## Instructions for sideloading (UWP)

You can sideload the app easily by typing `winget install kiwix.wikivoyage` in a Command Prompt or PowerShell terminal (Windows 10 or 11). This will download and install the Electron-based appx. If you want to install the legacy UWP appx based on EdgeHTML, then simply download the appx (see below) and double click it. The app installer should launch and will let you install it.

For Windows Mobile or for sideloading manually, please download [KiwixWebAppWikivoyage_<<base_tag>>.0_AnyCPU.appx](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>-Wikivoyage/KiwixWebAppWikivoyage_<<base_tag>>.0_AnyCPU.appx) and (for desktop systems) the zipped PowerShell script from Assets below. Then follow the detailed instructions at https://github.com/kiwix/kiwix-js-pwa/tree/main/AppPackages#readme.
