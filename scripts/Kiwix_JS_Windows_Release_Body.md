## This is the Windows 10/11 UWP app for Windows desktop/mobile/ARM

Please choose the correct version:

* For **Windows 10/11**: install from the Microsoft Store: https://www.microsoft.com/store/apps/9P8SLZ4J979J (it will self-update automatically), or open a command prompt and run `winget install kiwix`; you can also sideload it (see instructions below)
* For **Windows 7/8/10/11** or **Linux (Ubuntu, Debian, OpenSUSE)** 32bit/64bit desktop only: use the portable or installable [NWJS/Electron versions](https://kiwix.github.io/kiwix-js-windows/kiwix-js-electron.html) (NB these do not self-update yet)
* For **Windows XP** or **Windows Vista**: use the older [NWJS release](https://kiwix.github.io/kiwix-js-windows/kiwix-js-nwjs.html)

This UWP app includes a small sample ZIM archve with a collection of the 100 most popular Wikipedia articles `<<zim>>` (<<date>>) together with the changes listed in the [CHANGELOG](https://github.com/kiwix/kiwix-js-windows/blob/master/CHANGELOG.md).

**Status of Store App: IN CERTIFICATION**

If you prefer not to use the Microsoft Store or wish to test a [different build](https://github.com/kiwix/kiwix-js-windows/tree/master/AppPackages), please follow the instructions below the screenshot.

![image](https://user-images.githubusercontent.com/4304337/119402976-99d71e00-bcd5-11eb-8bf4-dfa6c12e68aa.png)

## Manual Installation: Windows 10/11 Tablet / PC

**New!** You can sideload the app easily by typing `winget install kiwix` in a Command Prompt or PowerShell terminal. If you don't yet have [`winget`](https://docs.microsoft.com/en-us/windows/package-manager/winget/), use these manual instructions:

**Uninstall any previous installation of Kiwix JS Windows (UWP) before you follow this procedure**.

Download the signed bundle [KiwixWebApp_<<base_tag>>.0_AnyCPU.appxbundle](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/KiwixWebApp_<<base_tag>>.0_AnyCPU.appxbundle) and run/launch it (depending on the browser, you may need to single-click or double-click the file or "download complete" notification).  The App Installer should open and ask you whether you wish to install (it may also ask you if you wish to allow sideloading apps: if so, answer yes). If you are satisfied that the app is trusted, click Install.

On slightly older versions of Windows 10, you may need to enable sideloading of apps beforehand: go to Settings / Update and security / For developers and select "Sideload apps". You may be asked to reboot.

If the above procedures fail, or the App Installer is not available, then download and unzip into a folder the `PowerShell.Installation.Script...` from Assets, place the `.appxbundle` in the same folder, and follow PowerShell Installation instructions [here](https://github.com/kiwix/kiwix-js-windows/tree/master/AppPackages#windows-10-tablet--pc) (except that you don't need to download further files, all the needed ones are included in the zip file `PowerShell.Installation.Script...`).

In case you are still unable to sideload, try the [Electron or NWJS releases](https://kiwix.github.io/kiwix-js-windows/kiwix-js-electron.html).

## Manual Installation: Windows 10 Mobile

**Uninstall any previous installation of Kiwix JS Windows (UWP) before you follow this procedure**.

Download [KiwixWebApp_<<base_tag>>.0_AnyCPU.appxbundle](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/KiwixWebApp_<<base_tag>>.0_AnyCPU.appxbundle) to your downloads folder, or other accessible folder, on the phone. Enable Developer mode on your device (Settings / Updates and security / For developers). 

Open the File Explorer on the phone, navigate to the downloads folder and tap the KiwixWebApp bundle. You will be asked if you wish to install, but it then installs silently in the background. Be patient: it can take a minute or so for the Kiwix icon to appear in the All Apps list. You will also need to download a ZIM file to use with the app (see below).

## Download a ZIM archive (all platforms)

You will need a ZIM file to do anything useful with this app. For testing, it only comes packaged with an archive of the top 100 Wikipedia articles in English. You can download other ZIM archives from the Configuration page in the app (the download completes in the browser). Place the file in an accessible location on your device, and use the Select Storage button in the app to rescan storage and display buttons that let you pick the file or the file's folder.

Alternatively, you can download ZIM archives from http://wiki.kiwix.org/wiki/Content_in_all_languages on a regular PC and (if you are using an external device like a mobile) transfer them to your device with a USB cable.