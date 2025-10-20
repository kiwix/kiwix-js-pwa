## Portable and installable builds for UWP, PWA, Electron and NWJS

Kiwix is an offline browser of archival content from Wikipedia, Project Gutenberg, TED Talks, Wikivoyage, Stackexchange, and many other sources. It makes knowledge available to people with limited or no Internet access. The software as well as the content is free for anyone to use. It requires at least one offline ZIM archive (which can be downloaded in the app).

![Kiwix JS Seven Wonders Montage trans](https://user-images.githubusercontent.com/4304337/218414297-a087c014-fe79-4a3d-a60a-87690732dc91.png)

To use this app, download your choice of free content in-app from the Download Library on the Configuration page. For what's new, see the changes listed in the [CHANGELOG](https://github.com/kiwix/kiwix-js-pwa/blob/main/CHANGELOG.md). Builds are provided for 32bit and 64bit editions of Windows, Linux (tested on Ubuntu, Debian, Fedora and OpenSUSE), and experimentally on macOS.

**MS Store status: IN CERTIFICATION**
**Winget status: IN CERTIFICATION**

Please choose the correct version (those marked [**AUTO**] will self-update automatically when there is a new version):

* **Any modern OS (PWA)**
  + Try out our **installable PWA** (Progressive Web App) simply by visiting https://pwa.kiwix.org/ [**AUTO**]. Incredibly light, no store or download required, no heavy framework! It works offline once the app has cached its code, and in Chrome/Edge/Chromium, you can install it right from within the app. On Android (Chrome and Firefox), we strongly recommend you enable the Private File System option (when you click Select Storage), as it is much faster, and you can download archives directly into this storage. On iOS (Safari), you can add the PWA to your home screen - NB on iOS only you must use Safari because Apple currently bans Service Workers in other browsers. In Firefox Android you can install the app from the browser menu. In Firefox >= 143 on Windows you can add the app to the taskbar using an icon in the address bar, and it will gain its own icon and dedicated window.

* **Linux** (see installation instructions below screenshot):
  - **Portable (Electron)** - *recommended*
    + AppImage 64bit (Ubuntu, Debian, Fedora, OpenSUSE): [Kiwix-JS-Electron-<<numeric_tag>>-E.AppImage](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-<<numeric_tag>>-E.AppImage) [**AUTO**]
    * AppImage ARM64 for Linux on ARM only (Ubuntu, Debian, Fedora, opnSUSE): [Kiwix-JS-Electron-<<numeric_tag>>-E-arm64.AppImage](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-<<numeric_tag>>-E-arm64.AppImage) [**AUTO**]
    + AppImage 32bit (Ubuntu, Debian, Fedora, OpenSUSE): [Kiwix-JS-Electron-<<numeric_tag>>-E-i386.AppImage](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-<<numeric_tag>>-E-i386.AppImage) [**AUTO**]
  - **Installable (Electron)**
    + Deb package 64bit (Ubuntu, Debian): [kiwix-js-electron_<<numeric_tag>>-E_amd64.deb](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/kiwix-js-electron_<<numeric_tag>>-E_amd64.deb)
    + Deb package 32bit (Ubuntu, Debian): [kiwix-js-electron_<<numeric_tag>>-E_i386.deb](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/kiwix-js-electron_<<numeric_tag>>-E_i386.deb)
    + RPM package 64bit (Fedora, OpenSUSE): [kiwix-js-electron-<<numeric_tag>>-E.x86_64.rpm](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/kiwix-js-electron-<<numeric_tag>>-E.x86_64.rpm)
    + RPM package 32bit (Fedora, OpenSUSE): [kiwix-js-electron-<<numeric_tag>>-E.i686.rpm](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/kiwix-js-electron-<<numeric_tag>>-E.i686.rpm)

* **Windows**:
  - **Store app for Windows 10/11 (UWP)** - *recommended* [**AUTO**]
    + Install from the Microsoft Store: https://apps.microsoft.com/detail/9P8SLZ4J979J
    + Or, on a PC, open a Terminal (or command prompt) and run `winget install 'kiwix js' -s msstore`
    + Or, if you cannot use the Store, sideload a signed package with `winget install kiwix.kiwixjs` - this doesn't auto-update, but you can upgrade easily by running `winget upgrade kiwix.kiwixjs`
  - **Installable (Electron)**
    + Windows 10/11 Web installer (auto selects correct package, supports 64bit, 32bit, Windows on ARM64): [Kiwix-JS-Electron-Web-Setup-<<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-Web-Setup-<<numeric_tag>>-E.exe) [**AUTO**]
    + Windows 10/11 64bit modern MSIX install / uninstall - [Kiwix-JS-Electron-<<numeric_tag>>-E.appx](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-<<numeric_tag>>-E.appx) - *recommended*
    + Windows 7/8/8.1+ standalone 32bit: [Kiwix-JS-Electron-Win7-Setup-<<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-Win7-Setup-<<numeric_tag>>-E.exe)    
    + Windows 10/11 standalone 32bit (also runs on 64bit): [Kiwix-JS-Electron-Setup-<<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-Setup-<<numeric_tag>>-E.exe) [**AUTO**]
    + Alternatively, run `winget install kiwix.kiwixjs.electron` in a Windows 10/11 Terminal [**AUTO**]
  - **Portable - no install needed**
    + **_WARNING:_** Windows **XP** or **Vista** **only** (legacy version): [kiwix_js_windows-XP-<<base_tag>>-N-win-ia32.zip](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/kiwix_js_windows-XP-<<base_tag>>-N-win-ia32.zip) - **do not use this with modern Windows!**
    + Windows 10/11 32bit (also runs on 64bit): self-contained **portable** version, no unzip needed - [Kiwix-JS-Electron-<<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-<<numeric_tag>>-E.exe) (if you find this version slow to launch, try the Setup version above, or a zipped version below)
    + [Electron] Windows 10/11 64bit: just unzip to any drive or folder - [Kiwix-JS-Electron-<<numeric_tag>>-E.zip](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-<<numeric_tag>>-E.zip) (for 32bit or Win7+, plese use the Win7 installer above)
    + [NWJS] Windows 10/11 64bit: just unzip to any drive or folder - [kiwix_js_windows-<<base_tag>>-N-win-x64.zip](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/kiwix_js_windows-<<base_tag>>-N-win-x64.zip)

* **macOS** (Experimental, unsigned - _follow instructions below to run for first time_):
  - **Portable (Electron)** - *experimental*
    + macOS 10.15+ Apple Silicon (M1/M2/M3): [Kiwix-JS-Electron-<<numeric_tag>>-macOS-arm64.zip](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-<<numeric_tag>>-macOS-arm64.zip) - *recommended for Apple Silicon Macs*
    + macOS 10.15+ Intel (x64): [Kiwix-JS-Electron-<<numeric_tag>>-macOS-x64.zip](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-<<numeric_tag>>-macOS-x64.zip)
    + macOS 10.13 High Sierra / 10.14 Mojave Intel (x64): [Kiwix-JS-Electron-<<numeric_tag>>-macOS-HighSierra.zip](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-<<numeric_tag>>-macOS-HighSierra.zip)

![Kiwix-Zimit-montage](https://user-images.githubusercontent.com/4304337/173221055-08fd27ba-5990-4e13-9286-c11e4595d43a.png)

## Installation Instructions

### Windows
* The Windows **Web installer** (Windows 10/11 only) will select the correct architecture automatically and install itself, together with a shortcut in your shortcut menu. It auto-updates, but if you want to update it manually, then just install a new version over it (it will uninstall the old one for you). **Please note that it needs Web access during the installation.** If this is a problem, then use the correct standalone installer for your architecture.
* For the Windows 10/11 Portable builds (64bit only), the executable version (ending `.exe`) can just be run, but it may be a bit slow to start up because it decompresses itself each time it runs. For a faster experience, use one of the zipped versions: unzip the contents of the package to any folder, or to a thumb drive, and double click on `Start Kiwix JS [Electron/Windows]` or `Start Kiwix JS [Electron/Windows].bat`.
* For Windows 7/8/8.1, due to the deprecation of Chromium on these platforms, we only provide one option: a standalone installer built with the last version of Electron that supported Chrome on Windows 7+. This is also a 32bit package (but will run on 64bit).
* **Microsoft Defender SmartScreen warning:** If you get a Smartscreen notification when downloading an `.exe`, or on first launch of the zipped portable apps, follow instructions to "Run anyway" if you trust this site. Additionally, when you first download an `.exe` installer, you may get a warning in your downloads "Kiwix-JS-Electron isn't commonly downloaded". If you see this, click on the file and choose "Keep anyway". A second screen may then popup telling you the publisher. So long as it's Kiwix, then click on "Sow more" and allow the app. If you prefer, use one of the appx versions (ending `.appx` or `.appxbundle`) as this format runs in a secure, isolated container.

### Linux
* **For the Linux _portable_ builds**, download and save the correct AppImage file anywhere (e.g. your Desktop). Make it executable by opening a terminal and running `chmod +x Kiwix-JS-Electron*.AppImage` and then `./Kiwix-JS-Electron*.AppImage`. If there are issues, see below. The AppImage will autoupdate.
  + On recent Linux (notably Ubuntu) you may need to install fuse2 by typing `sudo apt install libfuse2` (see [here](https://www.omgubuntu.co.uk/2023/04/appimages-libfuse2-ubuntu-23-04)).
  + On older **_Debian_**, you may need to add the `--no-sandbox` switch to the command (see https://github.com/electron/electron/issues/17972#issuecomment-516957971).
  + On **_OpenSUSE_**, you may need to install Chrome in order to get the dependencies necessary to run the AppImage (because Electron apps run Chrome internally). With **_older_** versions of OpenSUSE, you may additionally need to use these commandline switches: `./Kiwix-JS-Electron*.AppImage --use-gl=disabled --disable-gpu-compositing`,¹ but this is no longer necessary in recent versions.
  + On **_ChromeOS_**, you need to run the AppImage in the Debian-based VM (Crostini). Download the appropriate AppImage for your Chromebook (the standard AppImage if it uses an Intel Celeron, or the ARM64 version if it has an ARM chip). Move this file to you Linux Files. Do `chmod +x` on the file. Then run with `./Kiwix-JS-Electron-x.x.x-E.AppImage`. If you get errors about missing fuse and libnss3, simply install these manually: `sudo apt-get install fuse` and `sudo apt-get install libnss3`.
* **For the Linux _installable_ builds:**
  + **_Debian/Ubuntu_**: download the correct `.deb` package. Open a terminal, `cd` to the directory containing the package, and type `sudo apt-get update` followed by `chmod a+x ./kiwix-js-electron*.deb`, then `sudo apt install ./kiwix-js-electron*.deb`. To run the app from the command line, rather than from its installed icon, simply type `kiwix-js-electron` in terminal. On **Debian**, if you receive the error `libgbm.so.1: cannot open shared object file`, please run `sudo apt install libgbm-dev`. On older versions of Debian, you may have to add `--no-sandbox` to the command line when running the app, i.e. `kiwix-js-electron --no-sandbox`. When you want to update, just install the new version, and it will install over the old version.
  + **_Fedora_**: download the correct `.rpm` package. You should be able to install it by opening the File manager, locating the package, and double-clicking it. Alternatively, open a terminal and `cd` to the directory with the package, and then type `sudo rpm --install ./kiwix-js-electron-*.rpm` (you may need to do `chmod a+x kiwix-js-electron-*.rpm` first). After install, you should find Kiwix JS Electron in your app list, and you can launch it from there. To upgrade, locate the newly downloaded package in terminal and type `sudo rpm --upgrade ./kiwix.js.electron-*.rpm` (ensure you specify the correct package number in place of `*` if you have more than one). If you find the app is stuck looking for an old sample package after upgrade, please just press the Reset button next to the version number at the top of Configuration.
  + **_OpenSUSE_**: download the correct `.rpm` package. You may get a better installation experience if you first install Chrome or another Chromium browser, as the Electron app has the same dependencies as Chrome. Then open a Terminal with superuser privileges, navigate to the directory containing the `.rpm` package, and type `zypper install  kiwix-js-electron-*.rpm` (you may need to do `chmod a+x kiwix-js-electron-*.rpm` first). If you are informed about missing dependencies, try "Solution 2: break kiwix-js-electron... by ignoring some of its dependencies'. You will also be warned that the app is not signed. You can ignore this, if you trust this repository. See above for commandline switches in older versions of OpenSUSE.

### Apple Mac
* **For macOS builds**: If you trust this Repository, download the correct ZIP file for your Mac architecture (Apple Silicon, Intel, or High Sierra/Mojave). _Safari will automatically extract the ZIP file upon download, while Chrome and Firefox will download the ZIP file without extracting it._ **These builds are unsigned and require additional steps to run**:
    1. **Remove quarantine flag from ZIP** (Chrome/Firefox users only - Safari users skip to step 2):
       - Open Terminal (Applications > Utilities > Terminal)
       - Run the following command:
       ```bash
       xattr -d com.apple.quarantine ~/Downloads/Kiwix-JS-Electron-*.zip
       ```
       - Then extract the ZIP file by double-clicking it
    2. **Safari users only**: The app (`Kiwix JS Electron.app`) will already be extracted in your Downloads folder, but you need to remove the quarantine flag (not necessary if you did Step 1):
       ```bash
       xattr -d com.apple.quarantine ~/Downloads/Kiwix\ JS\ Electron.app
       ```
    3. **Launch** the app by double-clicking it - it should now open normally
  + **Architecture Selection:**
    + **Apple Silicon Macs** (M1/M2/M3): Use the ARM64 version for optimal performance
    + **Intel Macs**: Use the x64 version
    + If unsure of your Mac's architecture, click the Apple menu > About This Mac - look for "Apple M1/M2/M3" (Apple Silicon) or "Intel" in the processor information
  + **Security Note:** These are experimental unsigned builds. macOS will initially block them for security reasons. The Terminal command above is required for first launch. Future launches will work normally after completing these steps once.
* **Troubleshooting:** If you encounter issues, ensure you're using the correct architecture version for your Mac. The ARM64 version provides significantly better performance on Apple Silicon Macs.  _If you do not wish to install an unsigned app, please visit https://pwa.kiwix.org in a Chromium browser, and install the PWA from Configuration._

¹ With many thanks to Jay Midura for documenting the switches needed for OpenSUSE.

## Release Notes

* You can download many different archives in multiple languages from the Configuration page.
* For a seamless experience in the **PWA**, try out the **Origin Private File System**: you won't have to answer permission prompts. On **Android**, this is also much, much faster. There is no advantage to using the OPFS in the Electron app, however. 
* There is full support for reading Zimit classic (and preliminary support for Zimit 2) archives in the PWA and Electron apps (also modern NWJS app, but see **Known Issues** below), and legacy support in the older UWP app. If your browser cannot use the full support, it will fall back to legacy support and/or very limited support in Restricted mode.
* The app natively supports dark mode for Wikimedia, Gutenberg and Stack Exchange ZIMs (see Configuration). For Zimit archives in particular, we recommend you try the new DarkReader plugin (you can enable this from Configuration in ServiceWorker mode only).
* You can print by pressing Ctrl-P or using the print icon. If local printers are not available (after clicking on More options...) then print to PDF and use another app to print. Printing works best with Wikimedia ZIMs.
* You can open a new browsable window by middle-clicking, ctrl-clicking or long-pressing an article link (not available in every mode, see option in Configuration).
* There is support for Full-Screen mode in most browsers and frameworks, and orientation locking in some mobile browsers (e.g. Android).
* Electron versions of the app (and the PWA) now support Full-Text searching.
* You can open the ZIM's article index by typing a space in the search box. Sometimes you may need to search the URL index instead: to open this, type **_space /_** (a space followed by a forward slash) in the search box. In older ZIMs, you will find articles under the `A/` namespace and images under the `I/` namespace, but in newer ZIMs almost all content is under the `C/` namesapce.
* In title search, you can use wildcards `.*` or `.+` (this works best if you start the search with a normal alphanumeric string). You can include a more complex regular expression by enclosing it within `(?:my_regular_expression)`. See Configuration -> About for more details and limitations.
* You can search for any file in a ZIM by prefixing the namespace, e.g. `C/isaac.*newton.*webp` in recent ZIMs where all content is in the `C` namespace, or `I/isaac.*newton` in older ZIMs where images are in the `I` namespace and articles in the `A` namespace.

### Known Issues

* **Opening/closing headers**: In the latest Wikipedia ZIMs, opening and closing of headers is now, by design, only enabled if you transform the style to mobile in Configuration -> Display Style (mobile, desktop).
* **Printing**: In Electron apps, no preview is available prior to printing: we recommend you print to PDF first and then print the PDF, or use the PWA instead for printing (which has print preview). Before printing, ensure all sections you want to print are open (if you closed them). It is not possible to print Zimit-based articles in Firefox.
* **There are various issues with the NWJS app** - we recommend you use the Electron app instead (except on Windowx XP):
  - PDFs in Zimit-based archives are blocked from viewing in the NWJS app.
  - If you download an archive from within the NWJS app (from Configuration), you will be able to pick a download directory, and the download will start, but then there will be no further indication that a download is in progress. You will need to check the chosen download directory to see if the download has completed.
  - The NWJS app for Windows 7/8/10/11 will occasionally crash and exit when running in ServiceWorker mode. For now, it is recommended to use this app only in Restricted mode until this issue is resolved.
  - In the NWJS app only, YouTube-based videos in **Zimit archives** do not play with sound (this does not affect other archives such as TED Talks or Khan Academy).
  - Image manipulation (e.g. saving image to disk) does not currently work with the NWJS app.
* On the **XP build** with some recent ZIMs __there is a CSS error in rendering image-heavy landing pages__, due to the age of the Chromium build included in the runtime package. However, you can access all articles by __pressing a space in the search box__.
* Please see https://github.com/kiwix/kiwix-js-pwa/issues for further known issues. If you find a problem not reported there, please open a new issue on that page.

## Instructions for sideloading (UWP)

You can sideload the UWP app easily by typing `winget install kiwix.kiwixjs` in a Command Prompt or PowerShell terminal (Windows 10/11). This will download and install the Electron-based appx. If you want to install the legacy UWP appxbundle based on EdgeHTML, then simply download the appxbundle (see below) and double click it. The app installer should launch and will let you install it.

For Windows Mobile or for sideloading manually, please download [KiwixWebApp_<<base_tag>>.0_AnyCPU.appxbundle](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/KiwixWebApp_<<base_tag>>.0_AnyCPU.appxbundle) and the zipped PowerShell script from Assets below. Then follow the detailed instructions at https://github.com/kiwix/kiwix-js-pwa/tree/main/AppPackages#readme.