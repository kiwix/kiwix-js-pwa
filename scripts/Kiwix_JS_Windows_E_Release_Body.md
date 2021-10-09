## Portable and installable builds of Kiwix JS for Windows XP/Vista/7/8/10/11 and Linux

This is **not** the UWP/Microsoft Store build. If you are using Windows 10 or 11, we strongly recommend [the Kiwix JS UWP release](https://kiwix.github.io/kiwix-js-windows/kiwix-js-uwp.html), which will keep itself up-to-date automatically. These portable and installable versions run on the included [Electron platform](https://www.electronjs.org/) version 10.4.0 and [NWJS](https://nwjs.io/) 0.57.0 (Win7/8/10/11) or 0.14.7 (XP/Vista).

They are packaged with the <<date>> sample ZIM of the top 100 Wikipedia articles in English, `<<zim>>`. These builds will run on 32bit and 64bit editions of Windows or Linux (tested on Ubuntu, Debian and OpenSUSE - but see instructions below).

Choose the correct build:

* **Windows**:
  - **Portable** (just unzip, no install needed)
    + Windows 7/8/10/11 - [kiwix_js_windows-<<numeric_tag>>N-win-ia32.zip](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/kiwix_js_windows-<<numeric_tag>>N-win-ia32.zip) (NWJS) - _recommended_
    + Windows XP/Vista - [kiwix_js_windows-XP-<<numeric_tag>>N-win-ia32.zip](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/kiwix_js_windows-XP-<<numeric_tag>>N-win-ia32.zip) (NWJS)
  - **Installable** (signed NSIS installer)
    + Windows 7/8/10/11 - [Kiwix JS Windows Setup <<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/Kiwix.JS.PWA.Setup.<<numeric_tag>>-E.exe) (Electron)
    + Alternatively, run `winget install kiwix-electron` in a Windows 10/11 Terminal / Cmd / PowerShell prompt
* **Linux**:
  - **Portable**
    + AppImage 64bit (Ubuntu, Debian, OpenSUSE) - [Kiwix JS PWA-<<numeric_tag>>-E.AppImage](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/Kiwix.JS.PWA-<<numeric_tag>>-E.AppImage) (Electron)
    + AppImage 32bit (Ubuntu, Debian, OpenSUSE) - [Kiwix JS PWA-<<numeric_tag>>-E-i386.AppImage](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/Kiwix.JS.PWA-<<numeric_tag>>-E-i386.AppImage) (Electron)
  - **Installable**
    + Deb package 64bit (Ubuntu, Debian) - [kiwix-js-pwa_<<numeric_tag>>-E_amd64.deb](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/kiwix-js-pwa_<<numeric_tag>>-E_amd64.deb) (Electron)
    + Deb package 32bit (Ubuntu, Debian) - [kiwix-js-pwa_<<numeric_tag>>-E_i386.deb](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/kiwix-js-pwa_<<numeric_tag>>-E_i386.deb) (Electron)

There is no installation required for the Portable versions. NONE of these builds auto-update (yet). Installation instructions are after the screenshot.

![image](https://user-images.githubusercontent.com/4304337/117862247-5a96df00-b28a-11eb-93f5-6483e8c2a608.png)

### Instructions:

* For the Windows Portable build, unzip the contents of the [kiwix_js_windows-<<base_tag>>-win-ia32.zip](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/kiwix_js_windows-<<numeric_tag>>N-win-ia32.zip) archive (or the XP version if you're using that) to any folder, or to a flash drive / thumb drive, and double click on `Start Kiwix JS Windows` or `Start Kiwix JS Windows via batch file.bat`, or open the `kiwix_js_windows-...` folder and double click on `nw.exe`;
* For the Windows Setup (installable) build, simply download and launch. It will install itself, together with a shortcut in your shortcut menu, and run. When you want to update the app, just install a new version over it (it will uninstall the old one for you).
* For the Linux portable builds, download and save the correct AppImage file anywhere (e.g. your Desktop), and double-click it. If it doesn’t work, open Terminal and run `chmod a+x Kiwix.JS.PWA*.AppImage` and then `./Kiwix.JS.PWA*.AppImage`. On **Debian**, you will probably need to add the `--no-sandbox` switch to the command like this `./Kiwix.JS.PWA*.AppImage --no-sandbox` (see https://github.com/electron/electron/issues/17972#issuecomment-516957971). On **OpenSUSE**, you may need to use these commandline switches instead: `./Kiwix.JS.WikiMed*.AppImage --use-gl=disabled --disable-gpu-compositing`.¹
* For the Linux installable builds, download the correct `.deb` package. Open a terminal, `cd` to the directory containing the package, and type `sudo apt install ./kiwix-js-pwa*.deb`. Once installed, on **Debian**, you may have to run the app by opening terminal and typing `kiwix-js-pwa --no-sandbox`. On **Ubuntu**, you should be able to run it from its installed icon. When you want to update, just install the new version, and it will install over the old version.  To install on **OpenSUSE**, it may be easiest to extract the files from the AppImage instead of using the Deb package. The executable is `kiwix-js-wikimed` and you may need to add the commandline switches `--use-gl=disabled --disable-gpu-compositing`.¹
* Windows: **Because the portable archive may not be commonly downloaded, you may face Windows SmartScreen issues** on first launch. Follow instructions to "Run anyway" if you trust this site. If you prefer, use the installable version [Kiwix JS Windows Setup <<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/Kiwix.JS.PWA.Setup.<<numeric_tag>>-E.exe) which is digitally signed.

¹ With many thanks to Jay Midura for documenting the switches needed for OpenSUSE.

### Release Notes

* This app is packaged with a sample atchive of the <<date>> English-language top 100 Wikipedia articles (`<<zim>>`). The packaged archive is located in the `archives` folder (only accessible in the portable Windows version). See the readme in that folder if you wish to add a different archive as the packaged ZIM;
* You can download many different archives in multiple languages from the Configuration page;
* It supports dark mode, and opening different navigable windows by right-clicking or ctrl-clicking a link (see Configuration);
* You can print by pressing Ctrl-P or using the print icon. If local printers are not available (after clicking on More options...) then print to PDF and use another app to print;
* You can open a new browsable window by right-clicking, middle-clicking or ctrl-clicking an article link;
* In title search, you can use wildcards `.*` or `.+` (this works best if you start the search with a normal alphanumeric string). You can include a more complex regular expression by enclosing it within `(?:my_regular_expression)`. See Configuration -> About for more details and limitations.

### Known Issues

* REGRESSION: Due to a change in format, headings are always open in jQuery mode regardless of the "Open all sections" option in Configuration (the setting is respected in Service Worker mode);
* INCONSISTENCY: When printing in jQuery mode, all sections are opened before printing (if the user had closed any), whereas in SW mode, closed sections are not opened before printing, if they were closed;
* On the XP build with some recent ZIMs (not the packaged one), __there is a CSS error in rendering the landing page of this ZIM__, due to the age of the Chromium build included in the runtime package. However, you can access all articles by __pressing a space in the search box__;
* If you download an archive from within the app (from Configuration), you will be able to pick a download directory, and the download will start, but then there will be no further indication that a download is in progress. You will need to check the chosen download directory to see if the download has completed;
* Image manipulation (e.g. saving image to disk) does not currently work with the NWJS app;
* Please see https://github.com/kiwix/kiwix-js-windows/issues for further known issues. If you find a new issue, please open a new issue on that page.
