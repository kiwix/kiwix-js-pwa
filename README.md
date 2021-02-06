# Kiwix JS for PWA and Universal Windows Platform

*There is a browser-based deployment and **(installable Progressive Web App (PWA))[https://pwa.kiwix.org/]** version of this app at
https://pwa.kiwix.org/, but you will need a ZIM file for testing.* A [development deployment](https://kiwix.github.io/kiwix-js-windows/)
is also available, but code may be buggy and change rapidly, and it is not recommended to install this as a PWA. 

This repository is for development of the Kiwix JS app for Windows 10 Universal Windows Platform, PWA, Electron and NWJS.
Latest development code is usually on the [master-dev](https://github.com/kiwix/kiwix-js-windows/tree/master-dev/) branch.

This is a port of the Kiwix Offline Wikipedia (and other Wiki) reader for UWP and related app technologies on Windows 10.
The NWJS and Electron versions of the app also run on earlier Windows (see the respective [releases](https://github.com/kiwix/kiwix-js-windows/releases/)
for more information). The app enables offline reading of a ZIM file downloaded from the Kiwix repository, including full
Wikipedia versions with or without images in many different languages. It is regularly tested fully on Wikimedia ZIM files,
though a number of other ZIM file types work (e.g. Stackexchange ZIMs).

This began as a simple port of Kiwix JS, the HTML5 web app provided upstream at https://github.com/kiwix/kiwix-js, although
significant development has been undertaken to add functionality and to make the app sit happily
with the Universal Windows Platform, and more recently Electron and NWJS, as well as to work as an installable PWA.
The port runs as a UWP Store App on Windows 10 and Windows 10 Mobile, but it should also run on any Windows 10 platform: x86, x64, ARM, on Mobile, tablets, Xbox,
Surface Hub, Holographic and PC. It has only been tested on Lumia 950XL (Mobile), Tablet/PC x64 (Windows 10), and a Windows 10 Mobile VM.

The UWP app is currently installable from the Microsoft Store at:

[https://www.microsoft.com/en-gb/store/p/kiwix-js/9p8slz4j979j](https://www.microsoft.com/en-gb/store/p/kiwix-js/9p8slz4j979j)

However, if you prefer not to use the Store, or want to test a specific release, available packages are located under
Releases: https://github.com/kiwix/kiwix-js-windows/releases/. Installation instructions for the standalone app (Kiwix JS)
are provided on the Master branch: https://github.com/kiwix/kiwix-js-windows/tree/master. Electron and NWJS versions are also available from Releases,
and a PWA version can be installed by visiting https://pwa.kiwix.org/.

You will need a ZIM file to work with this app. For testing, the Store version comes packaged with an archive of the top 100 Wikipedia pages in English
(with pictures) as a starter ZIM, while packaged aps of WikiMed and Wikivoyage are also available in the Store or from [Releases](https://github.com/kiwix/kiwix-js-windows/releases/). You can download other ZIM archives from the setup page in the app (the download completes in the browser).
Place the file in an accessible location on your device, and use the Rescan Storage button in the app to display buttons that
let you pick the file or the file's folder (if you do not see such buttons, look under Expert Settings in Config to enable the file picking UI).

Alternatively, you can download files from [https://wiki.kiwix.org/wiki/Content_in_all_languages](http://wiki.kiwix.org/wiki/Content_in_all_languages)
on a regular PC. If you plan to store your ZIM file on an SD card formatted as FAT32, and you wish to use an archive larger than 4GB, then you will need
to split the ZIM: see [file splitting instructions](https://github.com/kiwix/kiwix-js-windows/tree/master/AppPackages#download-a-zim-archive-all-platforms).
If your SD card is formatted as exFAT or NTFS, you do not need to split the ZIM archive.

You can also run the app in your browser if you prefer, either from the file:// protocol or from your own local server. There is a release deployment at:
[https://pwa.kiwix.org/](https://pwa.kiwix.org/), but note that you will need a ZIM file, and some functionality is limited (e.g. you have to authorize
access to a file each time you access the app in browser context). If you install the PWA from that page and you are using Chrome or new Edge
(Chromium), then you will not need to pick a file each time you start the app, but you will be prompted to authorize file access with a simple click.

A lot of development for this app happens upstream in the [Kiwix JS repository](https://kiwix.github.io/kiwix-js/) to which I ontribute actively.
Without Kiwix JS, this app would be impossible, and huge thanks goes to the original developers of first the Evopedia app and then Kiwix HTML5, which
eventually became Kiwix JS. The original source code runs almost "as is" on the UWP platform, which is testament to how well written that app is.
The port and further development of Kiwix JS Windows for Windows 10 (including Mobile) is by Geoffrey Kantaris. I can be contacted by email:
egk10 at cam ac uk.

# Privacy Policy

When installed, Kiwix JS Windows works offline, and does not collect or record any of your personal data. It
only remembers your browsing history for the duration of a session (for the purpose of returning to previously
viewed pages). This history is lost on exiting the app and is not recorded in any way.

If you access this app from a secure web server (e.g. the PWA server), it will only work offline if your browser is
capable of installing a Service Worker. If you install or bookmark the PWA version, then it will work offline, but
note that **by design** any PWA will periodically check the PWA server (in this case, https://pwa.kiwix.org/), if it
is available, to check for an updated Service Worker.

By default, this application will remember your last-visited page between sessions using local stoarage or a cookie
that is accessible only by this app on this device. If you are accessing sensitive information that you do
not wish to be displayed next time you open this app, we recommend that you turn this option off in the Configuration options.

This application only reads the archive files that you explicitly select on your device and files included in
its own package: it is not capable of reading any other files. It will only access the Kiwix download server if
you specifically request it to find and display download links for ZIM archives on the Configuration page.
However, some ZIM archives contain active content (scripts) which may, in rare circumstances, attempt to
contact external servers for incidental files such as fonts. These scripts will only run if you enable Service
Worker mode in Configuration.

**If you believe your Internet access is insecure, or is being observed or censored, we recommend that you completely
shut down your Internet (Data or WiFi) access before using the application.**

Additionally, if you obtained this app from a Vendor Store (including extensions), then the Store operator may
track your usage of the app (e.g. download, install, uninstall, date and number of sessions) for the purpose of
providing anonymous, aggregate usage statistics to developers. If this concerns you, you should check the relevant
Store Privacy Policy for further information.

**Builds of this app are available that do not use a Store or an online Service Worker.** Please see:

* [Releases](https://github.com/kiwix/kiwix-js-windows/releases/)
* [NWJS version](https://kiwix.github.io/kiwix-js-windows/kiwix-js-nwjs.html) - this version is completely standalone
  and will never self-update
