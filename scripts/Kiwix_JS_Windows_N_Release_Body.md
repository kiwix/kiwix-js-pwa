## This is a portable build of Kiwix JS NWJS for any 32bit or 64bit edition of Windows

This is **not** the UWP/Microsoft Store build. If you are using **Windows 10**, you may prefer to use [the release for the Microsoft Store](https://kiwix.github.io/kiwix-js-windows/kiwix-js-uwp.html), which is smaller and faster to load. This version runs on the [NWJS platform](https://nwjs.io/) (which is very similar to ElectronJS, but supports older versions of Windows). The package does **not** auto-update (whereas the Store version does). Please choose the correct build as follows:

For Windows XP or Windows Vista: [`kiwix_js_windows-XP-<<base_tag>>-win-ia32.zip`](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/kiwix_js_windows-XP-<<base_tag>>-win-ia32.zip)
For Windows 7,8,10 32bit: [`kiwix_js_windows-<<base_tag>>-win-ia32.zip`](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/kiwix_js_windows-<<base_tag>>-win-ia32.zip)
For Windows 7,8,10 64bit: [`kiwix_js_windows-<<base_tag>>-win-x64.zip`](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/kiwix_js_windows-<<base_tag>>-win-x64.zip)

If you have a modern Windows and do not know if your system is 64bit or 32bit, choose the 32bit (ia32) build.

The non-XP builds are based on NWJS 0.53.0 x64 or ia32 (x86).

The XP/Vista build is based on a legacy LTS release of NWJS 0.14.7 ia32.

There is no installation required: the app is fully portable. Simply unzip it in the folder of your choice and click `Start Kiwix JS Windows`. More detailed instructions are after the screenshot.

![image](https://user-images.githubusercontent.com/4304337/103398221-a5158b80-4b33-11eb-8476-05e8f1e245e8.png)

### Instructions

* Do not attempt to run the 64bit build on a 32bit machine; if in doubt, use a 32bit (ia32) build (this works on both machine types);
* Use the links above, or expand "Assets" below, download the zipped build that you require (not the source code) and unzip its contents to any folder, or to a flash drive / thumb drive;
* Either double click on one of the shortcuts `Start Kiwix JS Windows`, or open the `kiwix_js_windows-<<base_tag>>-...` folder and double click on `nw.exe`. If one of the shortcuts doesn't work, try the other one.

### Release Notes

* This app is packaged with `<<zim>>` (<<date>>) for testing purposes. The packaged archive is located in the `archives` folder. See the readme in that folder;
* You can open new dynamic, browsable article tabs or windows with right-click, ctrl-click, etc., on an internal link (or right-click on the page itself to open current article in new tab);
* The app is compatible with new ZIMs that are compressed with zstandard and containing WebP images, and also with no-namespace ZIMs, while remaining backwardly compatible with xz compression;
* If a different archive is picked, it will be remembered and launched automatically on startup;
* Service Worker mode is only operational in builds for modern Windows;
* In modern versions of Windows, you can print by pressing Ctrl-P or using the print icon. If local printers are not available (after clicking on More options...) then print to PDF and use another app to print.

### Known Issues

* On the XP build with some recent ZIMs (not the packaged one), __there is a CSS error in rendering the landing page of this ZIM__, due to the age of the Chromium build included in the runtime package. However, you can access all articles by __pressing a space in the search box__;
* If you download an archive from within the app (from Configuration), you will be able to pick a download directory, and the download will start, but then there will be no further indication that a download is in progress. You will need to check the chosen download directory to see if the download has completed.
