## This is the WikiMed UWP release (for Store or manual installation)

It contains the <<date>> release of the WikiMed ZIM together with the changes detailed in the [CHANGELOG](https://github.com/kiwix/kiwix-js-windows/blob/Kiwix-JS-WikiMed/CHANGELOG.md).

**Status of store app: IN CERTIFICATION**

https://www.microsoft.com/store/apps/9PHJSNP1CZ8J

If you prefer not to use the Microsoft Store or wish to test a different build, please follow the
instructions below the screenshot.

![image](https://user-images.githubusercontent.com/4304337/102692331-8c8ba400-420a-11eb-9f70-37e6880b9ccf.png)

## Manual Installation: Windows 10 Tablet / PC

**Uninstall any previous installation of Kiwix JS WikiMed before you follow this procedure**.

Download the signed bundle [KiwixWebAppWikiMed_<<base_tag>>.0_AnyCPU.appxbundle](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/KiwixWebAppWikiMed_<<base_tag>>.0_AnyCPU.appxbundle) and run/launch it (depending on the browser, you may need to single-click or double-click the file or "download complete" notification).  The App Installer should open and ask you whether you wish to install (it may also ask you if you wish to allow sideloading apps: if so, answer yes). If you are satisfied that the app is trusted, click Install.

On slightly older versions of Windows 10, you may need to enable sideloading of apps beforehand: go to Settings / Update and security / For developers and select "Sideload apps". You may be asked to reboot.

If the above procedures fail, or the App Installer is not available, then download and unzip into a folder the `Powershell_Installation_Script...` from Assets, place the `.appxbundle` in the same folder, and follow Powershell Installation instructions [here](https://github.com/kiwix/kiwix-js-windows/tree/master/AppPackages#windows-10-tablet--pc) (except that you don't need to download further files, all the needed ones are included in the zip file `PowerShell_Installation_Script...`).

## Manual Installation: Windows 10 Mobile

 **Uninstall any previous installation of Kiwix JS WikiMed before you follow this procedure**.

Download [KiwixWebAppWikiMed_<<base_tag>>.0_AnyCPU.appxbundle](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>-WikiMed/KiwixWebAppWikiMed_<<base_tag>>.0_AnyCPU.appxbundle) to your downloads folder, or other accessible folder, on the device. Enable Developer mode on your device (Settings / Updates and security / For developers). 

Open the File Explorer on the phone, navigate to the downloads folder and tap the KiwixWebAppWikiMed bundle. You will be asked if you wish to install, but it then installs silently in the background. Be patient: it can take a minute or so for the WikiMed icon to appear in the All Apps list.