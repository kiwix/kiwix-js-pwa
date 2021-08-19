## This is the Wikivoyage UWP release for Windows desktop/mobile/ARM

Please choose the correct version:

* For **Windows 10/11**: install from the Microsoft Store: https://www.microsoft.com/store/apps/9N5SB90Q4JBJ (it will self-update automatically), or open a command prompt and run `winget install wikivoyage`; you can also sideload it (see instructions below)
* For **Windows 7/8/10/11** or **Linux (Ubuntu, Debian, OpenSUSE)** 32bit/64bit desktop only: use the portable or installable [NWJS/Electron versions](https://kiwix.github.io/kiwix-js-windows/kiwix-js-electron.html) and download the Wikivoyage archive separately from within the app
* For **Windows XP** or **Windows Vista**: use the older [NWJS release](https://kiwix.github.io/kiwix-js-windows/kiwix-js-nwjs.html) and download the Wikivoyage archive separately from within the app

This UWP app contains the <<date>> release of the Wikivoyage ZIM together with the changes detailed in the [CHANGELOG](https://github.com/kiwix/kiwix-js-windows/blob/Kiwix-JS-Wikivoyage/CHANGELOG.md).

**Status of Store App: IN CERTIFICATION**

If you prefer not to use the Microsoft Store or wish to test a different build, please follow the instructions below the screenshot.

![image](https://user-images.githubusercontent.com/4304337/118415611-46484d00-b6a3-11eb-8586-11b23e3391be.png)

## Manual Installation: Windows 10/11 Tablet / PC

**New!** You can sideload the app easily by typing `winget install wikivoyage` in a Command Prompt or PowerShell terminal. If you don't yet have [`winget`](https://docs.microsoft.com/en-us/windows/package-manager/winget/), use these manual instructions:

**Uninstall any previous installation of Wikivoyage by Kiwix before you follow this procedure**.

Download the signed app bundle [KiwixWebAppWikivoyage_<<base_tag>>.0_AnyCPU.appxbundle](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-Wikivoyage/KiwixWebAppWikivoyage_<<base_tag>>.0_AnyCPU.appxbundle) and run/launch it (depending on the browser, you may need to single-click or double-click the file or "download complete" notification). The App Installer should open and ask you whether you wish to install (it may also ask you if you wish to allow sideloading apps: if so, answer yes). If you are satisfied that the app is trusted, click Install.

On slightly older versions of Windows 10, you may need to enable sideloading of apps beforehand: go to Settings / Update and security / For developers and select "Sideload apps". You may be asked to reboot.

If the above procedures fail, or the App Installer is not available, then download and unzip into a folder the `PowerShell.Installation.Script...` from Assets, place the `.appxbundle` in the same folder, and follow PowerShell Installation instructions [here](https://github.com/kiwix/kiwix-js-windows/tree/master/AppPackages#windows-10-tablet--pc) (except that you don't need to download further files, all the needed ones are included in the zip file `PowerShell.Installation.Script...`).

In case you are still unable to sideload, try the [Electron or NWJS releases](https://kiwix.github.io/kiwix-js-windows/kiwix-js-electron.html) and download Wikivoyage separately from within the app.

## Manual Installation: Windows 10 Mobile

**Uninstall any previous installation of Wikivoyage by Kiwix before you follow this procedure**.

Download [KiwixWebAppWikivoyage_<<base_tag>>.0_AnyCPU.appxbundle](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-Wikivoyage/KiwixWebAppWikivoyage_<<base_tag>>.0_AnyCPU.appxbundle) to your downloads folder, or other accessible folder, on the phone. Enable Developer mode on your device (Settings / Updates and security / For developers). 

Open the File Explorer on the phone, navigate to the downloads folder and tap the KiwixWebAppWikivoyage bundle. You will be asked if you wish to install, but it then installs silently in the background. Be patient: it can take a minute or so for the Wikivoyage icon to appear in the All Apps list.
