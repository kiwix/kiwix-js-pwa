## Portable and installable builds for UWP, PWA, Electron and NWJS

Kiwix is an offline browser of archival content from Wikipedia, Project Gutenberg, TED Talks, Wikivoyage, Stackexchange, and many other sources. It makes knowledge available to people with limited or no Internet access. The software as well as the content is free for anyone to use. It requires at least one offline ZIM archive (which can be downloaded in the app).

![Kiwix JS Seven Wonders Montage trans](https://user-images.githubusercontent.com/4304337/218414297-a087c014-fe79-4a3d-a60a-87690732dc91.png)

To use this app, download your choice of free content in-app from the Download Library on the Configuration page. For what's new, see the changes listed in the [CHANGELOG](https://github.com/kiwix/kiwix-js-pwa/blob/main/CHANGELOG.md). Builds are provided for 32bit and 64bit editions of Windows and Linux (tested on Ubuntu, Debian, Fedora and OpenSUSE).

**MS Store status: IN CERTIFICATION**
**Winget status: IN CERTIFICATION**

Please choose the correct version (those marked [**AUTO**] will self-update automatically when there is a new version):

* **Any modern OS (PWA)**
  + Try out our **installable PWA** (Progressive Web App) simply by visiting https://pwa.kiwix.org/ [**AUTO**]. Incredibly light, no store or download required, no heavy framework! It works offline once the app has cached its code, and in Chrome/Edge/Chromium, you can install it right from within the app (in Firefox you can bookmark it). On iOS (Safari), you can add it to your home screen - NB on iOS only you must use Safari because Apple bans Service Workers in other browsers. 

* **Linux** (see installation instructions below screenshot):
  - **Portable (Electron)** - *recommended*
    + AppImage 64bit (Ubuntu, Debian, Fedora, OpenSUSE): [Kiwix-JS-Electron-<<numeric_tag>>-E.AppImage](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-<<numeric_tag>>-E.AppImage) [**AUTO**]
    + AppImage 32bit (Ubuntu, Debian, Fedora, OpenSUSE): [Kiwix-JS-Electron-<<numeric_tag>>-E-i386.AppImage](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-<<numeric_tag>>-E-i386.AppImage) [**AUTO**]
  - **Installable (Electron)**
    + Deb package 64bit (Ubuntu, Debian): [kiwix-js-electron_<<numeric_tag>>-E_amd64.deb](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/kiwix-js-electron_<<numeric_tag>>-E_amd64.deb)
    + Deb package 32bit (Ubuntu, Debian): [kiwix-js-electron_<<numeric_tag>>-E_i386.deb](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/kiwix-js-electron_<<numeric_tag>>-E_i386.deb)
    + RPM package 64bit (Fedora, OpenSUSE): [kiwix-js-electron-<<numeric_tag>>-E.x86_64.rpm](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/kiwix-js-electron-<<numeric_tag>>-E.x86_64.rpm)
    + RPM package 32bit (Fedora, OpenSUSE): [kiwix-js-electron-<<numeric_tag>>-E.i686.rpm](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/kiwix-js-electron-<<numeric_tag>>-E.i686.rpm)

* **Windows**:
  - **Store app for Windows 10/11 (UWP)** - *recommended* [**AUTO**]
    + Install from the Microsoft Store: https://www.microsoft.com/store/apps/9P8SLZ4J979J
    + Or, on a PC, open a Terminal (or command prompt) and run `winget install 'kiwix js' -s msstore`
    + Or, if you cannot use the Store, sideload a signed package with `winget install kiwix.kiwixjs` - this doesn't auto-update, but you can upgrade easily by running `winget upgrade kiwix.kiwixjs`
  - **Installable (Electron)**
    + Windows 10/11 64bit - [Kiwix-JS-Electron-<<numeric_tag>>-E.appx](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-<<numeric_tag>>-E.appx) - new, modern install / uninstall
    + Windows 7/8/10/11: [Kiwix-JS-Electron-Setup-<<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-Setup-<<numeric_tag>>-E.exe) [**AUTO**]
    + Alternatively, run `winget install kiwix.kiwixjs.electron` in a Windows 10/11 Terminal [**AUTO**]
  - **Portable - no install needed**
    + **_WARNING:_** Windows **XP** or **Vista** **only** (legacy version): [kiwix_js_windows-XP-<<base_tag>>-N-win-ia32.zip](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/kiwix_js_windows-XP-<<base_tag>>-N-win-ia32.zip) - **do not use this with modern Windows!**
    + Windows 7/8/10/11: self-contained **portable** version, no unzip needed - [Kiwix-JS-Electron-<<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-<<numeric_tag>>-E.exe) (if you find this version slow to launch, try the Setup version above, or a zipped version below)
    + [Electron] Windows 7/8/10/11: just unzip to any drive or folder - [Kiwix-JS-Electron-<<numeric_tag>>-E.zip](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/Kiwix-JS-Electron-<<numeric_tag>>-E.zip)
    + [NWJS] Windows 7/8/10/11: just unzip to any drive or folder - [kiwix_js_windows-<<base_tag>>-N-win-ia32.zip](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/kiwix_js_windows-<<base_tag>>-N-win-ia32.zip)

![Kiwix-Zimit-montage](https://user-images.githubusercontent.com/4304337/173221055-08fd27ba-5990-4e13-9286-c11e4595d43a.png)

## Installation Instructions - Electron/NWJS

* For the Windows 64bit or 32bit installable builds, simply download and launch. It will install itself, together with a shortcut in your shortcut menu, and run. It auto-updates, but if you want to update it manually, then just install a new version over it (it will uninstall the old one for you).
* For the Windows Portable builds, the executable version (ending `.exe`) can just be run, but it may be a bit slow to start up. For a faster experience, use one of the zipped versions: unzip the contents of either the Electron or the NWJS packages to any folder, or to a thumb drive, and double click on `Start Kiwix JS [Electron/Windows]` or `Start Kiwix JS [Electron/Windows].bat`.
* **For the Linux _portable_ builds,** download and save the correct AppImage file anywhere (e.g. your Desktop), and double-click it. If it doesn’t work, open a terminal and run `chmod a+x Kiwix-JS-Electron*.AppImage` and then `./Kiwix-JS-Electron*.AppImage`. This version will auto-update.
  + On **_Debian_**, if you have issues running the AppImage on older versions of the OS, you can try adding the `--no-sandbox` switch to the command (see https://github.com/electron/electron/issues/17972#issuecomment-516957971). This is not necessary on recent versions.
  + On **_OpenSUSE_**, you may need to install Chrome in order to get the dependencies necessary to run the AppImage (because Electron apps run Chrome internally). With **_older_** versions of OpenSUSE, you may additionally need to use these commandline switches: `./WikiMed-by-Kiwix*.AppImage --use-gl=disabled --disable-gpu-compositing`,¹ but this is no longer necessary in recent versions.
* **For the Linux _installable_ builds:**
  + **_Debian/Ubuntu_**: download the correct `.deb` package. Open a terminal, `cd` to the directory containing the package, and type `sudo apt-get update` followed by `chmod a+x ./kiwix-js-electron*.deb`, then `sudo apt install ./kiwix-js-electron*.deb`. To run the app from the command line, rather than from its installed icon, simply type `kiwix-js-electron` in terminal. On **Debian**, if you receive the error `libgbm.so.1: cannot open shared object file`, please run `sudo apt install libgbm-dev`. On older versions of Debian, you may have to add `--no-sandbox` to the command line when running the app, i.e. `kiwix-js-electron --no-sandbox`. When you want to update, just install the new version, and it will install over the old version.
  + **_Fedora_**: download the correct `.rpm` package. You should be able to install it by opening the File manager, locating the package, and double-clicking it. Alternatively, open a terminal and `cd` to the directory with the package, and then type `sudo rpm --install ./kiwix-js-electron-*.rpm` (you may need to do `chmod a+x kiwix-js-electron-*.rpm` first). After install, you should find Kiwix JS Electron in your app list, and you can launch it from there. To upgrade, locate the newly downloaded package in terminal and type `sudo rpm --upgrade ./kiwix.js.electron-*.rpm` (ensure you specify the correct package number in place of `*` if you have more than one). If you find the app is stuck looking for an old sample package after upgrade, please just press the Reset button next to the version number at the top of Configuration.
  + **_OpenSUSE_**: download the correct `.rpm` package. You may get a better installation experience if you first install Chrome or another Chromium browser, as the Electron app has the same dependencies as Chrome. Then open a Terminal with superuser privileges, navigate to the directory containing the `.rpm` package, and type `zypper install  kiwix-js-electron-*.rpm` (you may need to do `chmod a+x kiwix-js-electron-*.rpm` first). If you are informed about missing dependencies, try "Solution 2: break kiwix-js-electron... by ignoring some of its dependencies'. You will also be warned that the app is not signed. You can ignore this, if you trust this repository. See above for commandline switches in older versions of OpenSUSE.
* Windows (zipped apps): If you get a Windows Smartscreen notification on first launch of the zipped portable apps, follow instructions to "Run anyway" if you trust this site. If you prefer, use one of the executable versions (ending `.exe`) which are digitally signed.

¹ With many thanks to Jay Midura for documenting the switches needed for OpenSUSE.

## Release Notes

* You can download many different archives in multiple languages from the Configuration page.
* There is full support for reading Zimit archives in the PWA and Electron apps (also modern NWJS app, but see **Known Issues** below), and legacy support in the older UWP app. If your browser cannot use the full support, it will fall back to legacy support and/or very limited support in JQuery mode.
* The app natively supports dark mode for Wikimedia, Gutenberg and Stack Exchange ZIMs (see Configuration). For Zimit archives in particular, we recommend you try the new DarkReader plugin (you can enable this from Configuration in ServiceWorker mode only).
* You can print by pressing Ctrl-P or using the print icon. If local printers are not available (after clicking on More options...) then print to PDF and use another app to print. Printing works best with Wikimedia ZIMs.
* You can open a new browsable window by right-clicking, middle-clicking or ctrl-clicking an article link (not available in every mode, see option in Configuration).
* There is support for Full-Screen mode in most browsers and frameworks, and orientation locking in some mobile browsers (e.g. Android).
* Electron versions of the app (and the PWA) now support Full-Text searching.
* You can open the ZIM's article index by typing a space in the search box. Sometimes you may need to search the URL index instead: to open this, type **_space /_** (a space followed by a forward slash) in the search box. In older ZIMs, you will find articles under the `A/` namespace and images under the `I/` namespace, but in newer ZIMs almost all content is under the `C/` namesapce.
* In title search, you can use wildcards `.*` or `.+` (this works best if you start the search with a normal alphanumeric string). You can include a more complex regular expression by enclosing it within `(?:my_regular_expression)`. See Configuration -> About for more details and limitations.
* You can search for any file in a ZIM by prefixing the namespace, e.g. `C/isaac.*newton.*webp` in recent ZIMs where all content is in the `C` namespace, or `I/isaac.*newton` in older ZIMs where images are in the `I` namespace and articles in the `A` namespace.

### Known Issues

* **Printing**: In Electron apps, no preview is available prior to printing: we recommend you print to PDF first and then print the PDF, or use the PWA instead for printing (which has print preview). Before printing, ensure all sections you want to print are open (if you closed them). It is not possible to print Zimit-based articles in Firefox.
* **There are various issues with the NWJS app** - we recommend you use the Electron app instead (except on Windowx XP):
  - PDFs in Zimit-based archives are blocked from viewing in the NWJS app.
  - If you download an archive from within the NWJS app (from Configuration), you will be able to pick a download directory, and the download will start, but then there will be no further indication that a download is in progress. You will need to check the chosen download directory to see if the download has completed.
  - The NWJS app for Windows 7/8/10/11 will occasionally crash and exit when running in ServiceWorker mode. For now, it is recommended to use this app only in JQuery mode until this issue is resolved.
  - In the NWJS app only, YouTube-based videos in **Zimit archives** do not play with sound (this does not affect other archives such as TED Talks or Khan Academy).
  - Image manipulation (e.g. saving image to disk) does not currently work with the NWJS app.
* On the **XP build** with some recent ZIMs __there is a CSS error in rendering image-heavy landing pages__, due to the age of the Chromium build included in the runtime package. However, you can access all articles by __pressing a space in the search box__.
* Please see https://github.com/kiwix/kiwix-js-pwa/issues for further known issues. If you find a problem not reported there, please open a new issue on that page.

## Instructions for sideloading (UWP)

You can sideload the UWP app easily by typing `winget install kiwix.kiwixjs` in a Command Prompt or PowerShell terminal (Windows 10/11). This will download and install the Electron-based appx. If you want to install the legacy UWP appxbundle based on EdgeHTML, then simply download the appxbundle (see below) and double click it. The app installer should launch and will let you install it.

For Windows Mobile or for sideloading manually, please download [KiwixWebApp_<<base_tag>>.0_AnyCPU.appxbundle](https://github.com/kiwix/kiwix-js-pwa/releases/download/v<<base_tag>>/KiwixWebApp_<<base_tag>>.0_AnyCPU.appxbundle) and the zipped PowerShell script from Assets below. Then follow the detailed instructions at https://github.com/kiwix/kiwix-js-pwa/tree/main/AppPackages#readme.