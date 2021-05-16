## This is the Wikivoyage UWP release (for Store or Manual installation)

It contains the <<date>> release of the Wikivoyage archive `<<zim>>` together with the changes detailed in the [CHANGELOG](https://github.com/kiwix/kiwix-js-windows/blob/Kiwix-JS-Wikivoyage/CHANGELOG.md). **If you are running an older version of Windows (XP/Vista/7/8)** then we recommend the [NWJS release](https://kiwix.github.io/kiwix-js-windows/kiwix-js-nwjs.html) (separate archive download required for NWJS version). If you are running **Windows 10**, then it is easiest to install this app from the Store here:

https://www.microsoft.com/store/apps/9N5SB90Q4JBJ

**Status of Store App: IN CERTIFICATION**

The Store version will keep itself up-to-date, but if you prefer not to use the Microsoft Store or wish to test a different build, please follow the instructions below the screenshot.

![image](https://user-images.githubusercontent.com/4304337/118415611-46484d00-b6a3-11eb-8586-11b23e3391be.png)

## Manual Installation: Windows 10 Tablet / PC

**Uninstall any previous installation of Wikivoyage by Kiwix before you follow this procedure**:

Download the signed app bundle [KiwixWebAppWikivoyage_<<base_tag>>.0_AnyCPU.appxbundle](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-Wikivoyage/KiwixWebAppWikivoyage_<<base_tag>>.0_AnyCPU.appxbundle) and run/launch it (depending on the browser, you may need to single-click or double-click the file or "download complete" notification). The App Installer should open and ask you whether you wish to install (it may also ask you if you wish to allow sideloading apps: if so, answer yes). If you are satisfied that the app is trusted, click Install.

On slightly older versions of Windows 10, you may need to enable sideloading of apps beforehand: go to Settings / Update and security / For developers and select "Sideload apps". You may be asked to reboot.

If the above procedures fail, or the App Installer is not available, then download and unzip into a folder the `PowerShell.Installation.Script...` from Assets, place the `.appxbundle` in the same folder, and follow Powershell Installation instructions [here](https://github.com/kiwix/kiwix-js-windows/tree/master/AppPackages#windows-10-tablet--pc) (except that you don't need to download further files, all the needed ones are included in the zip file `Powershell_Installation_Script...`).

## Manual Installation: Windows 10 Mobile

Download [KiwixWebAppWikivoyage_<<base_tag>>.0_AnyCPU.appxbundle](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-Wikivoyage/KiwixWebAppWikivoyage_<<base_tag>>.0_AnyCPU.appxbundle) to your downloads folder, or other accessible folder, on the phone. Enable Developer mode on your device (Settings / Updates and security / For developers). 

Open the File Explorer on the phone, navigate to the downloads folder and tap the KiwixWebAppWikivoyage bundle. You will be asked if you wish to install, but it then installs silently in the background. Be patient: it can take a minute or so for the Wikivoyage icon to appear in the All Apps list.