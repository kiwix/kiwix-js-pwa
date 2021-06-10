# Kiwix JS for PWA and Universal Windows Platform

*There is a browser-based deployment and **[installable Progressive Web App (PWA)](https://pwa.kiwix.org/)** version of this app at https://pwa.kiwix.org/, but you will need a
[ZIM file](https://wiki.kiwix.org/wiki/Content_in_all_languages) for testing. A [development deployment](https://kiwix.github.io/kiwix-js-windows/) is also available, but code
may be buggy and change rapidly.*

**Kiwix is an offline reader for multilingual content from Wikipedia, Project Gutenberg, TED Talks, Wikivoyage, Stackexchange, etc. It makes knowledge available to people with limited or no Internet access. The software as well as the content is free for anyone to use. It requires a ZIM offline archive (which can be downloaded in the app).**

This repository is for development of the Kiwix JS app for Windows 10 Universal Windows Platform (UWP), PWA, Electron and NWJS.
The latest code is usually on the master branch, but this is used for active development and may be several commits ahead of releases.

This is a lightweight HTML/JavaScript port of the Kiwix Offline Wikipedia (and other Wiki) reader. The UWP version targets Windows 10 (x86, x64, ARM, mobile, tablet, Xbox,
Surface Hub, Holographic) while the NWJS and Electron versions also run on earlier Windows and Linux (see the respective
[releases](https://github.com/kiwix/kiwix-js-windows/releases/) for more information). The PWA should work with any browser that supports Service Workers, but has only been
tested on Edge Legacy, Edge Chromium and Firefox. The PWA can be installed from a browser without visiting a Store (using Chromium-based browsers) and will work offline.

Offline ZIM archives are available from the [Kiwix repository](https://wiki.kiwix.org/wiki/Content_in_all_languages), including full Wikipedia versions with or without images
in many different languages. This app is regularly tested fully on Wikimedia ZIM files, though a number of other ZIM file types work.

This began as a simple port of [Kiwix JS](https://github.com/kiwix/kiwix-js), the HTML5 web app provided upstream at https://github.com/kiwix/kiwix-js, although significant
development has been undertaken to add functionality and to make the app sit happily with the Universal Windows Platform, and more recently Electron and NWJS, as well as to work
as an installable PWA. The port runs as a UWP Store App on Windows 10 and Windows 10 Mobile, but it should also run on any Windows 10 platform: x86, x64, ARM, on Mobile,
tablets, Xbox, Surface Hub, Holographic and PC.

The UWP app is currently installable from the Microsoft Store at:

[https://www.microsoft.com/en-gb/store/p/kiwix-js/9p8slz4j979j](https://www.microsoft.com/en-gb/store/p/kiwix-js/9p8slz4j979j)

It can also be installed (in Windows 10) by opening a Command Prompt or PowerShell terminal and typing `winget install kiwix`. Electron and NWJS versions, compatible with older Windows and Linux, are available from [Releases](https://github.com/kiwix/kiwix-js-windows/releases/). The PWA version can be installed by visiting https://pwa.kiwix.org/. The easiest way to sideload the UWP app is with `winget install kiwix`, but alternative sideloading instructions are available at https://github.com/kiwix/kiwix-js-windows/tree/master/AppPackages.

You will need a ZIM file to work with this app. For testing, the Store version comes packaged with an archive of the top 100 Wikipedia pages in English
(with pictures) as a starter ZIM, while packaged aps of WikiMed and Wikivoyage are also available in the Store or from [Releases](https://github.com/kiwix/kiwix-js-windows/releases/). You can download other ZIM archives from the Configuration page in the app (the download completes in the browser).
Place the file in an accessible location on your device, and use the Select Storage button in the app to display buttons that
let you pick the file or the file's folder (if you do not see such buttons, look under Expert Settings in Config to enable the file picking UI).

Alternatively, you can download files from the [Kiwix repository](http://wiki.kiwix.org/wiki/Content_in_all_languages)
on a regular PC. If you plan to store your ZIM file on an SD card formatted as FAT32, and you wish to use an archive larger than 4GB, then you will need
to split the ZIM: see [file splitting instructions](https://github.com/kiwix/kiwix-js-windows/tree/master/AppPackages#download-a-zim-archive-all-platforms).
If your SD card is formatted as exFAT or NTFS, you do not need to split the ZIM archive.

You can also run the app from your own File system, either from the file:// protocol (in some browsers) or from your own local server. Some functionality is limited
in these contexts (e.g. you have to authorize access to a file each time you access the app in browser context). The PWA version in Chromium browsers (including Edge) uses the
File System Access API which means you only have to give permission with a single click.

A lot of development for this app happens upstream in the [Kiwix JS repository](https://kiwix.github.io/kiwix-js/) to which I ontribute actively.
Without Kiwix JS, this app would be impossible, and huge thanks goes to the original developers of first the Evopedia app and then Kiwix HTML5, which
eventually became Kiwix JS. The original source code runs almost "as is" on the UWP platform, which is testament to how well written that app is.
The port and further development of Kiwix JS Windows for Windows 10 (including Mobile) is by Geoffrey Kantaris. I can be contacted by email:
egk10 at cam ac uk.

# Privacy Policy

When installed, Kiwix JS Windows works offline, and does not collect or record any of your personal data. It
only remembers your browsing history for the duration of a session (for the purpose of returning to previously
viewed pages). This history is lost on exiting the app with the optional exception of the last-visited page.

If you access this app from a secure web server (e.g. the PWA server), it will only work offline if your browser is
capable of installing a Service Worker. If you install or bookmark the PWA version, then it will work offline, but
note that **by design** any PWA will periodically check the PWA server (in this case, https://pwa.kiwix.org/), if it
is available, to check for an updated Service Worker.

By default, this application will remember your last-visited page between sessions using local stoarage or a cookie
that is accessible only by this app on this device. If you are accessing sensitive information that you do
not wish to be displayed next time you open this app, we recommend that you turn this option off in the Configuration options.

This application only reads the archive files that you explicitly select on your device and files included in
its own package: it is not capable of reading any other files. It will only access the Kiwix download server if
you specifically request it to access the download library for ZIM archives on the Configuration page. If you
run the app as a PWA, it will cache its own code from the secure PWA server and then can be used offline.
Some ZIM archives contain active content (scripts) which may, in rare circumstances, attempt to
contact external servers for incidental files such as fonts. These scripts will only run if you enable Service
Worker mode in Configuration.

**If you believe your Internet access is insecure, or is being observed or censored, we recommend that you completely
shut down your Internet access (Data or WiFi) before using the application.**

Additionally, if you obtained this app from a Vendor Store (including extensions), then the Store operator may
track your usage of the app (e.g. download, install, uninstall, date and number of sessions) for the purpose of
providing anonymous, aggregate usage statistics to developers. If this concerns you, you should check the relevant
Store Privacy Policy for further information.

**Builds of this app are available that do not use a Store or an online Service Worker.** Please see:

* [Releases](https://github.com/kiwix/kiwix-js-windows/releases/)
* [NWJS version](https://kiwix.github.io/kiwix-js-windows/kiwix-js-nwjs.html) - this version is completely standalone
  and will never self-update
