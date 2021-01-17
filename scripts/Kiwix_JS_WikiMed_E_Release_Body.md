## This is a portable build of Kiwix JS WikiMed Electron Edition for any 32bit or 64bit Windows 7/8/10

**Includes updated articles on COVID-19 current as of <<date>> (see screenshot)**

This is **not** the UWP/Microsoft Store build. If you are using Windows 10, you may prefer to use [the WikiMed release for the Microsoft Store](https://kiwix.github.io/kiwix-js-windows/wikimed-uwp.html), which will keep itself up-to-date automatically. This portable version runs on the included [Electron platform](https://www.electronjs.org/) version 10.3.0. This build will run on 32bit and 64bit editions of Windows. It is not compatible with Windows XP or Windows Vista. If you need an app compatible with those old platforms, get [Kiwix JS Windows reader](https://kiwix.github.io/kiwix-js-windows/kiwix-js-nwjs.html) and download the latest WikiMed archive from within the app.

There is no installation required: the app is fully portable. **Warning: the download is 1.2GB (it includes the full WikiMed archive).** See instructions for unzipping and launching below the screenshot.

![image](https://user-images.githubusercontent.com/4304337/98874889-03e35080-2473-11eb-9a0c-60a5ab3a2645.png)

If you intend to use this app with other archives than WikiMed, then download the generic [Kiwix JS Windows reader](https://kiwix.github.io/kiwix-js-windows/kiwix-js-nwjs.html), which is a much smaller download, or install the small functional [Store version of the reader](https://kiwix.github.io/kiwix-js-windows/kiwix-js-uwp.html) which keeps itself up-to-date.

### Instructions:

* Download [Kiwix JS WikiMed <<base_tag>>.zip](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/Kiwix.JS.WikiMed.<<base_tag>>.zip), or open Assets below and download the zipped file (not the source code). Unzip the contents of the archive to any folder, or to a flash drive / thumb drive;
* Double click on `Start Kiwix JS WikiMed`, or that doesn't work, use the provided batch file `Start Kiwix JS WikiMed via batch file.bat`, or open the `kiwix-js-windows-win32-ia32` folder and double click on `kiwix-js-windows.exe`;
* **Because the archive may not be commonly downloaded, you may face Windows SmartScreen issues** on first launch. Follow instructions to "Run anyway" if you trust this site. The app was made using Electron Packager version 15.2.0, and the `electron.exe` binary (renamed `kiwix-js-window.exe` with the Kiwix icon). You will not be asked again on subsequent launches.

### Release Notes

* This app is packaged with the <<date>> English-language WikiMed archive `<<zim>>`. The packaged archive is located in the `archives` folder. See the readme in that folder if you wish to add a different archive as the packaged ZIM;
* You can download WikiMed in other languages from the Configuration page;
* It supports dark mode, and opening a page in a separate browser window (see Configuration);
* You can print by pressing Ctrl-P or using the print icon. If local printers are not available (after clicking on More options...) then print to PDF and use another app to print.

### Known Issues

* REGRESSION: Due to a change in format, headings are always open in jQuery mode regardless of the "Open all sections" option in Configuration (the setting is respected in Service Worker mode)
* INCONSISTENCY: When printing in jQuery mode, all sections are opened before printing (if the user had closed any), whereas in SW mode, closed sections are not opened before printing
* Please see https://github.com/kiwix/kiwix-js-windows/issues for further known issues. If you find a new issue, please open a new issue on that page.
