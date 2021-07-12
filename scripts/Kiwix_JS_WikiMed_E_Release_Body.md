## Portable and installable builds of Kiwix JS WikiMed Electron Edition for Windows 7/8/10/11 and Linux

This is **not** the UWP/Microsoft Store build. If you are using Windows 10 or 11, we strongly recommend [the WikiMed release for the Microsoft Store](https://kiwix.github.io/kiwix-js-windows/wikimed-uwp.html), which will keep itself up-to-date automatically. These portable and installable versions run on the included [Electron platform](https://www.electronjs.org/) version 10.4.0. 

These builds are packaged with the <<date>> English-language WikiMed archive `<<zim>>`. They will run on 32bit and 64bit editions of Windows or Linux (tested on Ubuntu, Debian and OpenSUSE - but see instructions below). The Windows build is **not compatible with Windows XP or Windows Vista**. If you need an app compatible with those old platforms, get [Kiwix JS Windows reader](https://kiwix.github.io/kiwix-js-windows/kiwix-js-nwjs.html) and download the latest WikiMed archive from within the app.

Choose the correct build (**warning: the download is at least 1.2GB**):

* **Windows**:
  - **Portable** (just unzip, no install needed)
    + Win7/8/10/11 - [Kiwix JS WikiMed <<base_tag>>.zip](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/Kiwix.JS.WikiMed.<<base_tag>>.zip)
  - **Installable**
    + Win7/8/10/11 - [Kiwix JS WikiMed Setup <<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/Kiwix.JS.WikiMed.Setup.<<numeric_tag>>-E.exe)
* **Linux**
  - **Portable**
    + AppImage 64bit (Ubuntu, Debian, OpenSUSE) - [Kiwix JS WikiMed-<<numeric_tag>>-E.AppImage](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/Kiwix.JS.WikiMed-<<numeric_tag>>-E.AppImage)
    + AppImage 32bit (Ubuntu, Debian, OpenSUSE) - [Kiwix JS WikiMed-<<numeric_tag>>-E-i386.AppImage](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/Kiwix.JS.WikiMed-<<numeric_tag>>-E-i386.AppImage)
  - **Installable**
    + Deb package 64bit (Ubuntu, Debian) - [kiwix-js-wikimed_<<numeric_tag>>-E_amd64.deb](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/kiwix-js-wikimed_<<numeric_tag>>-E_amd64.deb)
    + Deb package 32bit (Ubuntu, Debian) - [kiwix-js-wikimed_<<numeric_tag>>-E_i386.deb](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/kiwix-js-wikimed_<<numeric_tag>>-E_i386.deb)

There is no installation required for the Portable versions. NONE of these builds auto-update (yet). Installation instructions are after the screenshot.

![imagen](https://user-images.githubusercontent.com/4304337/118011859-5df0a000-b348-11eb-911c-4bb70acd6f2a.png)

### Instructions:

* For the Windows Portable build, unzip the contents of the [Kiwix JS WikiMed <<base_tag>>.zip archive](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/Kiwix.JS.WikiMed.<<base_tag>>.zip) archive to any folder, or to a flash drive / thumb drive, and double click on `Start Kiwix JS WikiMed` or `Start Kiwix JS WikiMed.bat`, or open the `kiwix-js-windows-win32-ia32` folder and double click on `kiwix-js-windows.exe`.
* For the Windows Setup (installable) build, simply download and launch. It will install itself, together with a shortcut in your shortcut menu, and run. When you want to update the app, just install a new version over it (it will uninstall the old one for you).
* For the Linux potable builds, download and save the correct AppImage file anywhere (e.g. your Desktop), and double-click it. If it doesn't work, open Terminal and run `chmod a+x Kiwix.JS.WikiMed*.AppImage` and then `./Kiwix.JS.WikiMed*.AppImage`. On **Debian**, you will probably need to add the `--no-sandbox` switch to the command like this `./Kiwix.JS.WikiMed*.AppImage --no-sandbox` (see https://github.com/electron/electron/issues/17972#issuecomment-516957971). On **OpenSUSE**, you may need to use these commandline switches instead: `./Kiwix.JS.WikiMed*.AppImage --use-gl=disabled --disable-gpu-compositing`.¹
* For the Linux installable builds, download the correct `.deb` package and double-click to see if your graphical package manager can install it. If not, open a terminal, `cd` to the directory containing the package, and type `sudo apt install ./kiwix-js-wikimed*.deb`. Once installed, on **Debian**, you may have to run the app by opening terminal and typing `kiwix-js-wikimed --no-sandbox`. On **Ubuntu**, you should be able to run it from its installed icon. When you want to update, just install the new version, and it will install over the old version. To install on **OpenSUSE**, it may be easiest to extract the files from the AppImage instead of using the Deb package. The executable is `kiwix-js-wikimed` and you may need to add the commandline switches `--use-gl=disabled --disable-gpu-compositing`.¹
* Windows: **Because the portable archive may not be commonly downloaded, you may face Windows SmartScreen issues** on first launch. Follow instructions to "Run anyway" if you trust this site. If you prefer, use the installable version [Kiwix JS WikiMed Setup <<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/Kiwix.JS.WikiMed.Setup.<<numeric_tag>>-E.exe) which is digitally signed.

¹ With many thanks to Jay Midura for documenting the switches needed for OpenSUSE.

### Release Notes

* This app is packaged with the <<date>> English-language WikiMed archive `<<zim>>`. The packaged archive is located in the `archives` folder (only accessible in the portable Windows version). See the readme in that folder if you wish to add a different archive as the packaged ZIM;
* You can download WikiMed in other languages from the Configuration page (see Known Issues below);
* It supports dark mode, and opening different navigable windows by right-clicking or ctrl-clicking a link (see Configuration);
* You can print by pressing Ctrl-P or using the print icon. If local printers are not available (after clicking on More options...) then print to PDF and use another app to print;
* You can open a new browsable window by right-clicking, middle-clicking or ctrl-clicking an article link;
* In title search, you can use wildcards `.*` or `.+` *so long as the search starts with a normal alphanumeric string* - you cannot start with a wildcard. You can include a more complex regular expression by enclosing it within `(?:my_regular_expression)`. If you use wildcards or an enclosed regex, *the entire string must be a valid regular expression or it will not run*. If you do not use wildcards or a regex, the string will be treated as a simple string that will match the beginning of a title. Title search is pseudo-case-insensitive (it is best to use all lowercase), but the number of case combinations attempted is necessarily limited.

### Known Issues

* REGRESSION: Due to a change in format, headings are always open in jQuery mode regardless of the "Open all sections" option in Configuration (the setting is respected in Service Worker mode);
* INCONSISTENCY: When printing in jQuery mode, all sections are opened before printing (if the user had closed any), whereas in SW mode, closed sections are not opened before printing;
* If you download an archive from within the app (from Configuration), you will be able to pick a download directory, and the download will start, but then there will be no further indication that a download is in progress. You will need to check the chosen download directory to see if the download has completed;
* Please see https://github.com/kiwix/kiwix-js-windows/issues for further known issues. If you find a new issue, please open a new issue on that page.
