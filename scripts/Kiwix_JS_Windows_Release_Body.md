## Portable and installable builds for UWP, PWA, NWJS and Electron

This app comes packaged with a small sample ZIM archve containing a collection of summary articles from Wikipedia on the topic of Climate Change (`<<zim>>`, <<date>>). For what's new, see the changes listed in the [CHANGELOG](https://github.com/kiwix/kiwix-js-windows/blob/master/CHANGELOG.md). Builds are provided for 32bit and 64bit editions of Windows and Linux (tested on Ubuntu, Debian and OpenSUSE - but see instructions below). ARM is supported via the UWP app.

**Status of Store App: IN CERTIFICATION**

Please choose the correct version (those marked [**AUTO-UPDATE**] will self-update automatically when there is a new version):

* **Windows**:
  - **Store app for Windows 10/11 (UWP)**
    + Install from the Microsoft Store: https://www.microsoft.com/store/apps/9P8SLZ4J979J [**AUTO-UPDATE**] - *recommended*
    + Or, on a PC, open a command prompt and run `winget install kiwix.kiwixjs`; you can also sideload it (see instructions below)
  - **Portable (NWJS) - just unzip, no install needed**
    + Windows XP or Vista: [kiwix_js_windows-XP-<<base_tag>>N-win-ia32.zip](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/kiwix_js_windows-XP-<<base_tag>>N-win-ia32.zip)
    + Windows 7/8/10/11: [kiwix_js_windows-<<base_tag>>N-win-ia32.zip](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/kiwix_js_windows-<<base_tag>>N-win-ia32.zip)
  - **Installable (Electron)**
    + Windows 7/8/10/11 - [Kiwix-JS-Electron-Setup-<<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/Kiwix-JS-Electron-Setup-<<numeric_tag>>-E.exe) [**AUTO-UPDATE**]
    + Alternatively, run `winget install kiwix.kiwixjs.electron` in a Windows 10/11 Terminal [**AUTO-UPDATE**]
* **Linux** (read important instructions below screenshot):
  - **Portable (Electron)**
    + AppImage 64bit (Ubuntu, Debian, OpenSUSE) - [Kiwix-JS-Electron-<<numeric_tag>>-E.AppImage](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/Kiwix-JS-Electron-<<numeric_tag>>-E.AppImage) [**AUTO-UPDATE**]
    + AppImage 32bit (Ubuntu, Debian, OpenSUSE) - [Kiwix-JS-Electron-<<numeric_tag>>-E-i386.AppImage](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/Kiwix-JS-Electron-<<numeric_tag>>-E-i386.AppImage) [**AUTO-UPDATE**]
  - **Installable (Electron)**
    + Deb package 64bit (Ubuntu, Debian) - [kiwix-js-electron_<<numeric_tag>>-E_amd64.deb](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/kiwix-js-electron_<<numeric_tag>>-E_amd64.deb)
    + Deb package 32bit (Ubuntu, Debian) - [kiwix-js-electron_<<numeric_tag>>-E_i386.deb](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/kiwix-js-electron_<<numeric_tag>>-E_i386.deb)
    + RPM package 64bit OpenSUSE) - [kiwix-js-electron-<<numeric_tag>>-E.x86_64.rpm](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/kiwix-js-electron-<<numeric_tag>>-E.x86_64.rpm)
    + RPM package 32bit (OpenSUSE) - [kiwix-js-electron-<<numeric_tag>>-E.i686.rpm](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/kiwix-js-electron-<<numeric_tag>>-E.i686.rpm)

* **Any modern OS (PWA)**
  + Try out our new **installable PWA** (Progressive Web App) simply by visiting https://pwa.kiwix.org/ [**AUTO-UPDATE**]. No store or download required! It works offline once the app has cached its code, and in Chrome/Edge/Chromium, you can install it right from within the app (in Firefox you can bookmark it).

Full installation instructions are after the screenshot.

![image](https://user-images.githubusercontent.com/4304337/119402976-99d71e00-bcd5-11eb-8bf4-dfa6c12e68aa.png)

## Installation Instructions - NWJS/Electron

* For the Windows Portable build, unzip the contents of the [kiwix_js_windows-<<base_tag>>N-win-ia32.zip](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/kiwix_js_windows-<<numeric_tag>>N-win-ia32.zip) archive (or the XP version if you're using that) to any folder, or to a flash drive / thumb drive, and double click on `Start Kiwix JS Windows` or `Start Kiwix JS Windows via batch file.bat`, or open the `kiwix_js_windows-...` folder and double click on `nw.exe`;
* For the Windows Setup (installable) build, simply download and launch. It will install itself, together with a shortcut in your shortcut menu, and run. It auto-updates, but if you want to update it manually, then just install a new version over it (it will uninstall the old one for you).
* For the Linux portable builds, download and save the correct AppImage file anywhere (e.g. your Desktop), and double-click it. If it doesn’t work, open Terminal and run `chmod a+x Kiwix-JS-Electron*.AppImage` and then `./Kiwix-JS-Electron*.AppImage`. This version will auto-update. If you have issues running it on **Debian**, you can try adding the `--no-sandbox` switch to the command like this `./Kiwix.JS.Electron*.AppImage --no-sandbox` (see https://github.com/electron/electron/issues/17972#issuecomment-516957971). On older versions of **OpenSUSE**, you may need to use these commandline switches instead: `./Kiwix.JS.Electron*.AppImage --use-gl=disabled --disable-gpu-compositing`.¹
* For the Linux installable builds:
  + _Debian/Ubuntu_: download the correct `.deb` package. Open a terminal, `cd` to the directory containing the package, and type `sudo apt install ./kiwix-js-electron*.deb`. Once installed, on **Debian**, you may have to run the app by opening terminal and typing `kiwix-js-electron --no-sandbox`. On **Ubuntu**, you should be able to run it from its installed icon. When you want to update, just install the new version, and it will install over the old version. 
  + _OpenSUSE_: download the correct `.rpm` package. You probably won't be able to install this with the File manager due to a dependency issue. Instead, open a Terminal with superuser privileges, navigate to the directory containing the `.rpm` package, and type `zypper install  kiwix-js-electron-*.rpm`. You may be informed about a missing dependency `libuuid`. It is safe to ignore this dependency, the app will still correctly install and run. Choose "Solution 2: break kiwix-js-electron... by ignoring some of its dependencies'. You will also be warned that the app is not signed. You can ignore this, if you trust this repository. On older versions of OpenSUSE, when you run the app, you may need to add the commandline switches `--use-gl=disabled --disable-gpu-compositing`, but this appears to be resolved recently.¹
* Windows: If you get a Windows Smartscreen notification on first launch of the portable app, follow instructions to "Run anyway" if you trust this site. If you prefer, use the installable version [Kiwix-JS-Electron-Setup-<<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/Kiwix-JS-Electron-Setup-<<numeric_tag>>-E.exe) which is digitally signed.

¹ With many thanks to Jay Midura for documenting the switches needed for OpenSUSE.

## Release Notes

* This app is packaged with a sample archive of summary articles on Climate Change from Wikipedia, `<<zim>>`, dated <<date>>. Apart from the landing page, this archive has no images in articles, and only the lede (summary) of each article is included in order to minimize download size. The packaged archive is located in the `archives` folder (where this is accessible). See the readme in that folder if you wish to add a different archive as the packaged ZIM;
* You can download many different archives in multiple languages from the Configuration page;
* It supports dark mode, and opening different navigable windows by right-clicking or ctrl-clicking a link (see Configuration);
* You can print by pressing Ctrl-P or using the print icon. If local printers are not available (after clicking on More options...) then print to PDF and use another app to print;
* You can open a new browsable window by right-clicking, middle-clicking or ctrl-clicking an article link (not available in every mode, see option in Configuration);
* In title search, you can use wildcards `.*` or `.+` (this works best if you start the search with a normal alphanumeric string). You can include a more complex regular expression by enclosing it within `(?:my_regular_expression)`. See Configuration -> About for more details and limitations.

### Known Issues

* INCONSISTENCY: When printing in jQuery mode, all sections are opened before printing (if the user had closed any), whereas in SW mode, closed sections are not opened before printing, if they were closed;
* On the XP build with some recent ZIMs __there is a CSS error in rendering the landing page of this ZIM__, due to the age of the Chromium build included in the runtime package. However, you can access all articles by __pressing a space in the search box__;
* In the Electron and NWJS apps, If you download an archive from within the app (from Configuration), you will be able to pick a download directory, and the download will start, but then there will be no further indication that a download is in progress. You will need to check the chosen download directory to see if the download has completed;
* Image manipulation (e.g. saving image to disk) does not currently work with the NWJS app;
* Please see https://github.com/kiwix/kiwix-js-windows/issues for further known issues. If you find a new issue, please open a new issue on that page.

## Instructions for sideloading (UWP)

### Windows 10/11 Desktop/Tablet

**New!** You can sideload the app easily by typing `winget install kiwix.kiwixjs` in a Command Prompt or PowerShell terminal. If you don't yet have [`winget`](https://docs.microsoft.com/en-us/windows/package-manager/winget/), use these manual instructions:

**Uninstall any previous installation of Kiwix JS Windows before you follow this procedure**.

Download the signed app bundle [KiwixWebApp_<<base_tag>>.0_AnyCPU.appxbundle](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/KiwixWebApp_<<base_tag>>.0_AnyCPU.appxbundle) and run/launch it (depending on the browser, you may need to single-click or double-click the file or "download complete" notification). The App Installer should open and ask you whether you wish to install (it may also ask you if you wish to allow sideloading apps: if so, answer yes). If you are satisfied that the app is trusted, click Install.

On slightly older versions of Windows 10, you may need to enable sideloading of apps beforehand: go to Settings / Update and security / For developers and select "Sideload apps". You may be asked to reboot.

If the above procedures fail, or the App Installer is not available, then download and unzip into a folder the `PowerShell.Installation.Script...` from Assets, place the `.appxbundle` in the same folder, and follow PowerShell Installation instructions [here](https://github.com/kiwix/kiwix-js-windows/tree/master/AppPackages#windows-10-tablet--pc) (except that you don't need to download further files, all the needed ones are included in the zip file `PowerShell.Installation.Script...`).

In case you are still unable to sideload, try the PWA, NWJS or Electron versions above.

### Windows 10 Mobile

**Uninstall any previous installation of Kiwix JS Windows before you follow this procedure**.

Download [KiwixWebApp_<<base_tag>>.0_AnyCPU.appxbundle](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/KiwixWebApp_<<base_tag>>.0_AnyCPU.appxbundle) to your downloads folder, or other accessible folder, on the phone. Enable Developer mode on your device (Settings / Updates and security / For developers).

Open the File Explorer on the phone, navigate to the downloads folder and tap the KiwixWebApp bundle. You will be asked if you wish to install, but it then installs silently in the background. Be patient: it can take a minute or so for the Kiwix JS Windows icon to appear in the All Apps list.
