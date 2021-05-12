## This is a portable build of Kiwix JS WikiMed Electron Edition for Windows 7/8/10 and Linux

**Includes updated articles on COVID-19 current as of <<date>> (see screenshot)**

This is **not** the UWP/Microsoft Store build. If you are using Windows 10, you may prefer to use [the WikiMed release for the Microsoft Store](https://kiwix.github.io/kiwix-js-windows/wikimed-uwp.html), which will keep itself up-to-date automatically. This portable version runs on the included [Electron platform](https://www.electronjs.org/) version 10.4.0. This build will run on 32bit and 64bit editions of Windows or Linux (tested on Ubuntu and Debian). The Windows build is not compatible with Windows XP or Windows Vista. If you need an app compatible with those old platforms, get [Kiwix JS Windows reader](https://kiwix.github.io/kiwix-js-windows/kiwix-js-nwjs.html) and download the latest WikiMed archive from within the app.

* Choose the correct build:
  - **Portable** Win7/8/10 32bit/64bit (just unzip, no install needed) - [Kiwix JS WikiMed <<base_tag>>.zip](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/Kiwix.JS.WikiMed.<<base_tag>>.zip)
  - **Installer** Win7/8/10 32bit/64bit - [Kiwix JS WikiMed Setup <<numeric_tag>>-E.exe](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/Kiwix.JS.WikiMed.Setup.<<numeric_tag>>-E.exe)
  - Linux 64bit AMD (Ubuntu, Debian) - [Kiwix JS WikiMed-<<numeric_tag>>-E.AppImage](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/Kiwix.JS.WikiMed-<<base_tag>>.AppImage)
  - Linux 32bit i386 (Ubuntu, Debian) - [Kiwix JS WikiMed-<<numeric_tag>>-E-i386.AppImage](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/Kiwix.JS.WikiMed-<<numeric_tag>>-E-i386.AppImage)

There is no installation required for the Portable versions, or you can install the Setup version (on Windows) if you prefer. It does NOT auto-update (yet). **Warning: the download is 1.2GB (it includes the full WikiMed archive).** See instructions for unzipping and launching below the screenshot.

![imagen](https://user-images.githubusercontent.com/4304337/118011859-5df0a000-b348-11eb-911c-4bb70acd6f2a.png)

If you intend to use this app with other archives than WikiMed, then download the generic [Kiwix JS Windows reader](https://kiwix.github.io/kiwix-js-windows/kiwix-js-nwjs.html), which is a much smaller download, or install the small functional [Store version of the reader](https://kiwix.github.io/kiwix-js-windows/kiwix-js-uwp.html) which keeps itself up-to-date.

### Instructions:

* For the Windows Portable build, unzip the contents of the [Kiwix JS WikiMed <<base_tag>>.zip archive](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/Kiwix.JS.WikiMed.<<base_tag>>.zip) to any folder, or to a flash drive / thumb drive, and double click on `Start Kiwix JS WikiMed` or `Start Kiwix JS WikiMed via batch file.bat`, or open the `kiwix-js-windows-win32-ia32` folder and double click on `kiwix-js-windows.exe`;
* For the Windows Setup (installable) build, simply download and launch. It will install itself, together with a shortcut in your shortcut menu, and run. When you want to update the app, uninstall it from "Add or Remove Programs".
* For the Linux builds (which are both portable), download and save the correct AppImage file anywhere (e.g. your Desktop), and double-click it. If it doesn't work, open Terminal and run `chmod a+x Kiwix.JS.WikiMed*.AppImage` and then `./Kiwix.JS.WikiMed*.AppImage`;
* Windows: **Because the portable archive may not be commonly downloaded, you may face Windows SmartScreen issues** on first launch. Follow instructions to "Run anyway" if you trust this site. If you prefer, use the installable version [Kiwix JS WikiMed-<<numeric_tag>>-E-i386.AppImage](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/Kiwix.JS.WikiMed-<<numeric_tag>>-E-i386.AppImage) which is digitally signed.

### Release Notes

* This app is packaged with the <<date>> English-language WikiMed archive `<<zim>>`. The packaged archive is located in the `archives` folder (only accessible in the portable Windows version). See the readme in that folder if you wish to add a different archive as the packaged ZIM;
* You can download WikiMed in other languages from the Configuration page;
* It supports dark mode, and opening different navigable windows by right-clicking or ctrl-clicking a link (see Configuration);
* You can print by pressing Ctrl-P or using the print icon. If local printers are not available (after clicking on More options...) then print to PDF and use another app to print.

### Known Issues

* REGRESSION: Due to a change in format, headings are always open in jQuery mode regardless of the "Open all sections" option in Configuration (the setting is respected in Service Worker mode)
* INCONSISTENCY: When printing in jQuery mode, all sections are opened before printing (if the user had closed any), whereas in SW mode, closed sections are not opened before printing
* Please see https://github.com/kiwix/kiwix-js-windows/issues for further known issues. If you find a new issue, please open a new issue on that page.
