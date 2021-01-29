## This is the Windows 10 UWP app (Store or manual installation)

**This release is intended for the Microsoft Store.** It includes a small sample ZIM archve with a collection of the 100 most popular Wikipedia articles `<<zim>>` (<<date>>) together with the changes listed in the [CHANGELOG](https://github.com/kiwix/kiwix-js-windows/blob/master/CHANGELOG.md). **If you are running an older version of Windows (XP/Vista/7/8), then you can use the [NWJS release instead](https://kiwix.github.io/kiwix-js-windows/kiwix-js-nwjs.html).** If you are running Windows 10, then it is easiest to install this app from the Store here:

https://www.microsoft.com/store/apps/9P8SLZ4J979J 

**Status of Store App: IN CERTIFICATION**

If you prefer not to use the Microsoft Store or wish to test a [different build](https://github.com/kiwix/kiwix-js-windows/tree/master/AppPackages), please follow the instructions below the screenshot.

![image](https://user-images.githubusercontent.com/4304337/100858968-91203080-3486-11eb-88c9-baa7f7f7d97d.png)


## Manual Installation: Windows 10 Tablet / PC

**Uninstall any previous installation of Kiwix JS Windows (UWP) before you follow this procedure**.

Download the signed bundle [KiwixWebApp_<<base_tag>>.0_AnyCPU.appxbundle](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/KiwixWebApp_<<base_tag>>.0_AnyCPU.appxbundle) and run/launch it (depending on the browser, you may need to single-click or double-click the file or "download complete" notification).  The App Installer should open and ask you whether you wish to install (it may also ask you if you wish to allow sideloading apps: if so, answer yes). If you are satisfied that the app is trusted, click Install.

On slightly older versions of Windows 10, you may need to enable sideloading of apps beforehand: go to Settings / Update and security / For developers and select "Sideload apps". You may be asked to reboot.

If the above procedures fail, or the App Installer is not available, then download and unzip into a folder the `PowerShell.Installation.Script...` from Assets, place the `.appxbundle` in the same folder, and follow PowerShell Installation instructions [here](https://github.com/kiwix/kiwix-js-windows/tree/master/AppPackages#windows-10-tablet--pc) (except that you don't need to download further files, all the needed ones are included in the zip file `PowerShell.Installation.Script...`).

In case you are still unable to sideload, try the [NWJS release](https://kiwix.github.io/kiwix-js-windows/kiwix-js-nwjs.html) if you cannot use the Store.

## Manual Installation: Windows 10 Mobile

 **Uninstall any previous installation of Kiwix JS Windows (UWP) before you follow this procedure**.

Download [KiwixWebApp_<<base_tag>>.0_AnyCPU.appxbundle](https://github.com/kiwix/kiwix-js-windows/releases/download/v<<base_tag>>/KiwixWebApp_<<base_tag>>.0_AnyCPU.appxbundle) to your downloads folder, or other accessible folder, on the phone. Enable Developer mode on your device (Settings / Updates and security / For developers). 

Open the File Explorer on the phone, navigate to the downloads folder and tap the KiwixWebApp bundle. You will be asked if you wish to install, but it then installs silently in the background. Be patient: it can take a minute or so for the Kiwix icon to appear in the All Apps list. You will also need to download a ZIM file to use with the app (see below).

## Download a ZIM archive (all platforms)

You will need a ZIM file to work with this app. For testing, it comes packaged with an archive of the top 100 Wikipedia articles in English.
You can download other ZIM archives from the Configuration page in the app (the download completes in the browser). Place the file in an accessible location on your device, and use the Select Storage button in the app to rescan storage and display buttons that let you pick the file or the file's folder.

Alternatively, you can download ZIM archives from http://wiki.kiwix.org/wiki/Content_in_all_languages on a regular PC and (if you are using an external device like a mobile) transfer them to your device with a USB cable.