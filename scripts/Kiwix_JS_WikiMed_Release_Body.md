## Portable and installable builds for Electron and UWP

WikiMed by Kiwix is an offline medical encyclopaedia with content curated by Wikipedia's WikiProject Medicine. Containing more than 67,000 medical and health-related articles, it makes medical knowledge available to people with limited Internet access or anyone who needs quick reference access to in-depth medical information. Other languages can be downloaded within the app.

![WikiMed montage](https://user-images.githubusercontent.com/4304337/182706203-eca53649-8dea-44b9-ac4a-b08cc05c4252.png)

These custom apps are packaged with the <<date>> English-language WikiMed archive `<<zim>>`. They will run on 32bit and 64bit editions of Windows or Linux (tested on Ubuntu, Debian, Fedora and OpenSUSE), and experimentally on macOS. The Windows builds are **not compatible with Windows XP or Windows Vista**. If you need an app compatible with those old platforms, get [Kiwix JS Windows reader](https://kiwix.github.io/kiwix-js-pwa/app/nwjs.html) and download the latest WikiMed archive from within the app.

**MS Store status: IN CERTIFICATION**
**Winget status: IN CERTIFICATION**

Please choose the correct version:

* **Linux** (installation instructions below):
  - **Portable (Electron)**
    + AppImage 64bit (Ubuntu, Debian, Fedora, OpenSUSE): [WikiMed-by-Kiwix-<<numeric_tag>>-E.AppImage](https://s3.eu-west-2.wasabisys.com/org-kiwix-download.branded-apps/WikiMed/v<<base_tag>>/WikiMed%20by%20Kiwix-<<numeric_tag>>-E.AppImage)
    + AppImage ARM64 for Linux on ARM only (Ubuntu, Debian, Fedora, OpenSUSE): [WikiMed-by-Kiwix-<<numeric_tag>>-E-arm64.AppImage](https://s3.eu-west-2.wasabisys.com/org-kiwix-download.branded-apps/WikiMed/v<<base_tag>>/WikiMed%20by%20Kiwix-<<numeric_tag>>-E-arm64.AppImage)
    + AppImage 32bit (Ubuntu, Debian, Fedora, OpenSUSE): [WikiMed-by-Kiwix-<<numeric_tag>>-E-i386.AppImage](https://s3.eu-west-2.wasabisys.com/org-kiwix-download.branded-apps/WikiMed/v<<base_tag>>/WikiMed%20by%20Kiwix-<<numeric_tag>>-E-i386.AppImage)
  - **Installable (Electron)**
    + Deb package 64bit (Ubuntu, Debian): [kiwix-js-wikimed_<<numeric_tag>>-E_amd64.deb](https://s3.eu-west-2.wasabisys.com/org-kiwix-download.branded-apps/WikiMed/v<<base_tag>>/kiwix-js-wikimed_<<numeric_tag>>-E_amd64.deb)

* **Windows**:
  - **Store app for Windows 10/11** - _recommended_ (self-updates)
    + Install from the Microsoft Store: https://apps.microsoft.com/detail/9PHJSNP1CZ8J
    + Or, on a PC, open a command prompt and run `winget install wikimed -s msstore`
    + Or, if you cannot use the Store, sideload a signed package with `winget install kiwix.wikimed` - upgrade easily by running `winget upgrade kiwix.wikimed`
  - **Installable (Electron)**
    + Windows 10/11 Web installer (auto selects correct package, supports 64bit, 32bit, Windows on ARM64): [WikiMed-by-Kiwix-Web-Setup-<<numeric_tag>>-E.exe](https://s3.eu-west-2.wasabisys.com/org-kiwix-download.branded-apps/WikiMed/v<<base_tag>>/WikiMed%20by%20Kiwix%20Web%20Setup%20<<numeric_tag>>-E.exe)
    + Windows 10/11 64bit modern MSIX install / uninstall: [WikiMed-by-Kiwix-<<numeric_tag>>-E.appx](https://s3.eu-west-2.wasabisys.com/org-kiwix-download.branded-apps/WikiMed/v<<base_tag>>/WikiMed%20by%20Kiwix%20<<numeric_tag>>-E.appx)
    + Alternatively, run `winget install kiwix.wikimed.electron` in a Windows 10/11 Terminal
  - **Portable (Electron) - just unzip, no install needed**
    + Windows 10/11 32bit (also runs on 64bit): [WikiMed-by-Kiwix-<<numeric_tag>>-E.zip](https://s3.eu-west-2.wasabisys.com/org-kiwix-download.branded-apps/WikiMed/v<<base_tag>>/WikiMed-by-Kiwix-<<numeric_tag>>-E.zip)
    + Windows 7/8/8.1 32bit (also runs on 64bit): [WikiMed-by-Kiwix-Win7-<<numeric_tag>>-E.zip](https://s3.eu-west-2.wasabisys.com/org-kiwix-download.branded-apps/WikiMed/v<<base_tag>>/WikiMed-by-Kiwix-Win7-<<numeric_tag>>-E.zip)

* **macOS** (Experimental, unsigned - _follow instructions below to run for first time_):
  - **Disk images (Electron)** - *experimental*
    + macOS 12+ (Monterey or later) Apple Silicon (M1/M2/M3): [WikiMed-by-Kiwix-<<numeric_tag>>-E-macOS-arm64.dmg](https://s3.eu-west-2.wasabisys.com/org-kiwix-download.branded-apps/WikiMed/v<<base_tag>>/WikiMed%20by%20Kiwix-<<numeric_tag>>-E-macOS-arm64.dmg) - *recommended for Apple Silicon Macs*
    + macOS 12+ (Monterey or later) Intel (x64): [WikiMed-by-Kiwix-<<numeric_tag>>-E-macOS-x64.dmg](https://s3.eu-west-2.wasabisys.com/org-kiwix-download.branded-apps/WikiMed/v<<base_tag>>/WikiMed%20by%20Kiwix-<<numeric_tag>>-E-macOS-x64.dmg)
    + macOS 10.13-11 (High Sierra, Mojave, Big Sur) Intel (x64): [WikiMed-by-Kiwix-<<numeric_tag>>-E-macOS-HighSierra.dmg](https://s3.eu-west-2.wasabisys.com/org-kiwix-download.branded-apps/WikiMed/v<<base_tag>>/WikiMed%20by%20Kiwix-<<numeric_tag>>-E-macOS-HighSierra.dmg)

## Installation Instructions - Electron

### Windows
* For the Windows Web installer, simply download and launch. It will select the correct architecture automatically and install itself, together with a shortcut in your shortcut menu. When you want to update the app, just install a new version over it (it will uninstall the old one for you). **Please note that the Web installer needs Web access during the installation.** If this is a problem, use the portable zip instead.
* For the Windows Portable build, unzip the contents of the [WikiMed-by-Kiwix-<<numeric_tag>>-E.zip](https://s3.eu-west-2.wasabisys.com/org-kiwix-download.branded-apps/WikiMed/v<<base_tag>>/WikiMed-by-Kiwix-<<numeric_tag>>-E.zip) archive to any folder, or to a flash drive / thumb drive, and double click on `Start WikiMed by Kiwix` or `Start WikiMed by Kiwix.bat`, or open the `kiwix-js-pwa-win32-ia32` folder and double click on `WikiMed by Kiwix.exe`.
* For Windows 7/8/8.1, due to the deprecation of Chromium on these platforms, we provide a portable zip built with the last version of Electron that supported Chrome on Windows 7+. This is a 32bit package (but will run on 64bit). Unzip and use the launcher scripts as described above.
* **Microsoft Defender SmartScreen warning:** If you get a Smartscreen notification when downloading an `.exe`, or on first launch of the zipped portable apps, follow instructions to "Run anyway" if you trust this site. Additionally, when you first download an `.exe` installer, you may get a warning in your downloads "Kiwix-JS-Electron isn't commonly downloaded". If you see this, click on the file and choose "Keep anyway". A second screen may then popup telling you the publisher. So long as it's kiwix, then click on "Show more" and allow the app. If you prefer, use one of the appx versions (ending `.appx` or `.appxbundle`) as this format runs in a secure, isolated container.

### Linux
* **For the Linux _portable_ builds,** download and save the correct AppImage file anywhere (e.g. your Desktop), and double-click it. If it doesn't work, open a terminal and run `chmod a+x WikiMed-by-Kiwix*.AppImage` and then `./WikiMed-by-Kiwix*.AppImage`.
  + On recent Linux (notably Ubuntu) you may need to install fuse2 by typing `sudo apt install libfuse2` (see [here](https://www.omgubuntu.co.uk/2023/04/appimages-libfuse2-ubuntu-23-04)).
  + On older **_Debian_**, you may need to add the `--no-sandbox` switch to the command (see https://github.com/electron/electron/issues/17972#issuecomment-516957971). This is not necessary on recent versions.
  + On **_OpenSUSE_**, you may need to install Chrome in order to get the dependencies necessary to run the AppImage (because Electron apps run Chrome internally). With **_older_** versions of OpenSUSE, you may additionally need to use these commandline switches: `./WikiMed-by-Kiwix*.AppImage --use-gl=disabled --disable-gpu-compositing`,¹ but this is no longer necessary in recent versions.
* **For the Linux _installable_ builds:**
  + **_Debian/Ubuntu_**: download the correct `.deb` package. Open a terminal, `cd` to the directory containing the package, and type `sudo apt-get update` followed by `chmod a+x ./kiwix-js-wikimed*.deb`, then `sudo apt install ./kiwix-js-wikimed*.deb`. To run the app from the command line, rather than from its installed icon, simply type `kiwix-js-wikimed` in terminal. On **Debian**, if you receive the error `libgbm.so.1: cannot open shared object file`, please run `sudo apt install libgbm-dev`. On older versions of Debian, you may have to add `--no-sandbox` to the command line when running the app, i.e. `kiwix-js-wikimed --no-sandbox`. When you want to update, just install the new version, and it will install over the old version.
  + For **OpenSUSE** and **Fedora**, it may be easiest to extract the files from the AppImage instead of using the Deb package. The executable is `kiwix-js-wikimed` and on older versions of OpenSUSE you may need to add the commandline switches `--use-gl=disabled --disable-gpu-compositing`.¹

### Apple Mac
* **For macOS builds**: If you trust this Repository, download the correct disk image (`.dmg`) for your Mac architecture and macOS version (Apple Silicon, Intel, or the High Sierra build for macOS 10.13 to 11). **These builds are unsigned and require additional steps to run**:
    1. **Remove the quarantine flag from the disk image, before you open it** (macOS passes the flag on to anything you copy out of a quarantined image):
       - Open Terminal (Applications > Utilities > Terminal)
       - Run the following command:
       ```bash
       xattr -d com.apple.quarantine ~/Downloads/WikiMed*.dmg
       ```
    2. **Open the disk image** by double-clicking it, then drag **WikiMed by Kiwix** onto the **Applications** shortcut beside it. If you do not have administrator rights on the machine, drag it to your home folder or the Desktop instead - it runs the same way from either
    3. **Launch** the app by double-clicking it - it should now open normally. If macOS still refuses, clear all extended attributes from the copy you dragged out, giving the folder you actually dragged it to: `xattr -cr /Applications/WikiMed\ by\ Kiwix.app` (or, for example, `xattr -cr ~/Desktop/WikiMed\ by\ Kiwix.app`)
  + **Architecture Selection:**
    + **Apple Silicon Macs** (M1/M2/M3) on **macOS 12 Monterey or later**: Use the ARM64 version for optimal performance
    + **Intel Macs** on **macOS 12 Monterey or later**: Use the x64 version
    + **macOS 10.13-11 (High Sierra, Mojave to Big Sur)**: Use the HighSierra version. This is built with an older version of Electron so that it still runs on these systems, and it also runs (slowly) on Apple Silicon Macs via Rosetta. macOS will refuse to open the ARM64 or x64 versions on these systems
    + If unsure, click the Apple menu > About This Mac - it shows both your macOS version and, in the processor information, "Apple M1/M2/M3" (Apple Silicon) or "Intel"
  + **Security Note:** These are experimental unsigned builds. macOS will initially block them for security reasons. The Terminal command above is required for first launch. Future launches will work normally after completing these steps once.
* **Troubleshooting:** If you encounter issues, ensure you're using the correct architecture version for your Mac. The ARM64 version provides significantly better performance on Apple Silicon Macs. _If you do not wish to install an unsigned app, please visit https://pwa.kiwix.org in a Chromium browser, install the PWA from Configuration, and then download the MDWiki or WikiMed archive in-app._

¹ With many thanks to Jay Midura for documenting the switches needed for OpenSUSE.

## Release Notes

* This app is packaged with the <<date>> English-language WikiMed archive `<<zim>>`. The packaged archive is located in the `archives` folder (where this is accessible). See the readme in that folder if you wish to add a different archive as the packaged ZIM;
* You can download WikiMed in other languages from the Configuration page;
* It supports dark mode, and opening different navigable windows by right-clicking or ctrl-clicking a link (see Configuration);
* You can print by pressing Ctrl-P or using the print icon (but see Known Issues below). If local printers are not available (after clicking on More options...) then print to PDF and use another app to print;
* You can open a new browsable window by middle-clicking, ctrl-clicking or long-pressing an article link (not available in every mode, see option in Configuration);
* There is support for Full-Screen mode in most browsers and frameworks, and orientation locking in some mobile browsers (e.g. Android).
* Electron versions of the app now support Full-Text searching;
* In title search, you can use wildcards `.*` or `.+` (this works best if you start the search with a normal alphanumeric string). You can include a more complex regular expression by enclosing it within `(?:my_regular_expression)`. See Configuration -> About for more details and limitations;
* You can search for any file in a ZIM by prefixing the namespace, e.g. `I/isaac.*newton` for images of Isaac Newton (or in no-namespace ZIMs `C/isaac.*newton.*webp`).

### Known Issues

* **Printing**: In Electron apps, no preview is available prior to printing: we recommend you print to PDF first and then print the PDF, or use the PWA instead for printing (which has print preview). Before printing, ensure all sections you want to print are open (if you closed them).
* Please see https://github.com/kiwix/kiwix-js-pwa/issues for further known issues. If you find a new issue, please open a new issue on that page.

## Instructions for sideloading (UWP)

You can sideload the app easily by typing `winget install kiwix.wikimed` in a Command Prompt or PowerShell terminal (Windows 10 or 11). This will download and install the Electron-based appx. If you want to install the legacy UWP appx based on EdgeHTML, then simply download the appx (see below) and double click it. The app installer should launch and will let you install it.

For Windows Mobile or for sideloading manually, please download [KiwixWebAppWikiMed_<<base_tag>>.0_AnyCPU.appx](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>-WikiMed/KiwixWebAppWikiMed_<<base_tag>>.0_AnyCPU.appx) and the zipped PowerShell script from Assets below. Then follow the detailed instructions at https://github.com/kiwix/kiwix-js-pwa/tree/main/AppPackages#readme.
