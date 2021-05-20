## Portable and installable builds of Kiwix JS for Windows XP/Vista/7/8/10 and Linux

This is **not** the UWP/Microsoft Store build. If you are using Windows 10, we strongly recommend [the Kiwix JS UWP release](https://kiwix.github.io/kiwix-js-windows/kiwix-js-uwp.html), which will keep itself up-to-date automatically.

These portable and installable versions runs on the included [Electron platform](https://www.electronjs.org/) version 10.4.0 and [NWJS](https://nwjs.io/) 0.53.0 (Win7/8/10) or 0.14.7 (XP/Vista). They are packaged with the <<date>> sample ZIM of the top 100 Wikipedia articles in English, `<<zim>>`. The Windows builds run on any 32bit and 64bit i386/x64 machines (not ARM), while for Linux it is important to *choose the right build* (32bit or 64bit) for your machine (they have been tested on Ubuntu and Debian).

Choose the correct build:
* **Windows**:
  - **Portable** (just unzip, no install needed)
    + Windows 7/8/10 - [Kiwix JS Windows <<base_tag>>.zip](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/Kiwix.JS.Windows.<<base_tag>>.zip) (NWJS) - _recommended_
    + Windows XP/Vista - [Kiwix JS Windows <<base_tag>>.zip](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/Kiwix.JS.Windows.<<base_tag>>.zip) (NWJS)
  - **Installable** (signed NSIS installer)
    + Windows 7/8/10 - [Kiwix JS Windows Setup <<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/Kiwix.JS.PWA.Setup.<<numeric_tag>>-E.exe) (Electron)
* **Linux**:
  - **Portable**
    + AppImage 64bit (Ubuntu, Debian) - [Kiwix JS PWA-<<numeric_tag>>-E.AppImage](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/Kiwix.JS.PWA-<<numeric_tag>>-E.AppImage) (Electron)
    + AppImage 32bit (Ubuntu, Debian) - [Kiwix JS PWA-<<numeric_tag>>-E-i386.AppImage](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/Kiwix.JS.PWA-<<numeric_tag>>-E-i386.AppImage) (Electron)
  - **Installable**
    + Deb package 64bit (Ubuntu, Debian) - [kiwix-js-pwa_<<numeric_tag>>-E_amd64.deb](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/kiwix-js-pwa_<<numeric_tag>>-E_amd64.deb) (Electron)
    + Deb package 32bit (Ubuntu, Debian) - [kiwix-js-pwa_<<numeric_tag>>-E_i386.deb](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/kiwix-js-pwa_<<numeric_tag>>-E_i386.deb)

There is no installation required for the Portable versions. NONE of these builds auto-update (yet). Installation instructions are after the screenshot.

![image](https://user-images.githubusercontent.com/4304337/117862247-5a96df00-b28a-11eb-93f5-6483e8c2a608.png)

### Instructions:

* For the Windows Portable build, unzip the contents of the [Kiwix JS Windows <<base_tag>>.zip archive](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/Kiwix.JS.Windows.<<base_tag>>.zip) to any folder, or to a flash drive / thumb drive, and double click on `Start Kiwix JS Windows` or `Start Kiwix JS Windows via batch file.bat`, or open the `kiwix-js-windows-win32-ia32` folder and double click on `nw.exe`;
* For the Windows Setup (installable) build, simply download and launch. It will install itself, together with a shortcut in your shortcut menu, and run. When you want to update the app, uninstall it from "Add or Remove Programs".
* For the Linux portable builds, download and save the correct AppImage file anywhere (e.g. your Desktop), and double-click it. If it doesn't work, open Terminal and run `chmod a+x Kiwix.JS.WikiMed*.AppImage` and then `./Kiwix.JS.WikiMed*.AppImage`;
* For the Linux installable builds, download the correct `.deb` package and double-click to see if your graphical package manager can install it. If not, open a terminal, `cd` to the directory containing the package, and type `sudo apt install ./kiwix-js-pwa*.deb`
* Windows: **Because the portable archive may not be commonly downloaded, you may face Windows SmartScreen issues** on first launch. Follow instructions to "Run anyway" if you trust this site. If you prefer, use the installable version [Kiwix JS Windows Setup <<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/Kiwix.JS.WikiMed.Setup.<<numeric_tag>>-E.exe) which is digitally signed.

### Release Notes

* This app is packaged with a sample atchive of the <<date>> English-language top 100 Wikipedia articles (`<<zim>>`). The packaged archive is located in the `archives` folder (only accessible in the portable Windows version). See the readme in that folder if you wish to add a different archive as the packaged ZIM;
* You can download many different archives in multiple languages from the Configuration page;
* It supports dark mode, and opening different navigable windows by right-clicking or ctrl-clicking a link (see Configuration);
* You can print by pressing Ctrl-P or using the print icon. If local printers are not available (after clicking on More options...) then print to PDF and use another app to print.

### Known Issues

* REGRESSION: Due to a change in format, headings are always open in jQuery mode regardless of the "Open all sections" option in Configuration (the setting is respected in Service Worker mode)
* INCONSISTENCY: When printing in jQuery mode, all sections are opened before printing (if the user had closed any), whereas in SW mode, closed sections are not opened before printing
* On the XP build with some recent ZIMs (not the packaged one), __there is a CSS error in rendering the landing page of this ZIM__, due to the age of the Chromium build included in the runtime package. However, you can access all articles by __pressing a space in the search box__;
* If you download an archive from within the app (from Configuration), you will be able to pick a download directory, and the download will start, but then there will be no further indication that a download is in progress. You will need to check the chosen download directory to see if the download has completed.
* Please see https://github.com/kiwix/kiwix-js-windows/issues for further known issues. If you find a new issue, please open a new issue on that page.
