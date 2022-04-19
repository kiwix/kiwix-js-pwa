# WikiMed Offline Medical Wikipedia for Electron and Universal Windows Platform

**Kiwix is an offline reader for multilingual content from Wikipedia, Project Gutenberg, TED Talks, Wikivoyage, Stackexchange, etc. It makes knowledge
available to people with limited or no Internet access. The software as well as the content is free for anyone to use. It requires an offline ZIM archive
(which can be downloaded in the app). There are also two apps that come with content: [WikiMed by Kiwix](https://kiwix.github.io/kiwix-js-windows/wikimed-uwp.html) and [Wikivoyage by Kiwix](https://kiwix.github.io/kiwix-js-windows/wikivoyage-uwp.html) (no extra download needed).**

*Try this app instantly by opening the installable PWA (Progressive Web App) in your browser at **[pwa.kiwix.org](https://pwa.kiwix.org/)**. Get a free ZIM archive to use with it from the [Configuration page](https://pwa.kiwix.org/www/index.html#downloads) of the app, or you can preview a ZIM at [library.kiwix.org](https://library.kiwix.org) before you download one.* Once installed or bookmarked, the PWA works offline!

This repository is for development of the Kiwix JS app for PWA, Electron, NWJS and Windows 10/11 Universal Windows Platform (UWP). The latest code is usually
on the master branch, but this is used for active development and may be several commits ahead of releases. Installable and portable versions for Windows
(XP/Vista/7/10/11) and Linux (32bit and 64bit) are available from [releases](https://github.com/kiwix/kiwix-js-windows/releases/).
Unstable [nightly builds](https://download.kiwix.org/nightly/) of the Electron and NWJS apps are available together with a [development deployment](https://kiwix.github.io/kiwix-js-windows/),
but code may be buggy and change rapidly.


This is a lightweight HTML/JavaScript port of the Kiwix Offline Wikipedia (and other Wiki) reader. The UWP version targets Windows 10/11 (x86, x64, ARM,
mobile, tablet, Xbox, Surface Hub, Holographic) while the NWJS and Electron versions also run on earlier Windows and Linux (see the respective
[releases](https://github.com/kiwix/kiwix-js-windows/releases/) for more information). The PWA should work with any browser that supports Service
Workers, but has only been tested on Edge Legacy, Edge Chromium, Firefox and Samsung Internet Browser. The PWA can be installed from a browser without
visiting a Store (using Chromium-based browsers) and will work offline.

Offline ZIM archives are available from the [Kiwix repository](https://library.kiwix.org), including full Wikipedia versions with or without images
in many different languages. This app is regularly tested fully on Wikimedia ZIM files, though a number of other ZIM file types work.

This began as a simple port of [Kiwix JS](https://github.com/kiwix/kiwix-js), the HTML5 web app provided upstream at https://github.com/kiwix/kiwix-js,
although significant development has been undertaken to add functionality and to make the app sit happily with the Universal Windows Platform, and more
recently Electron and NWJS, as well as to work as an installable PWA.

The easiest way to install WikiMed is from the Microsoft Store:

https://www.microsoft.com/en-gb/store/p/wikimed/9phjsnp1cz8j

It can also be installed (in Windows 10/11) by opening a Command Prompt or PowerShell terminal and typing `winget install kiwix`. The easiest way to sideload
the UWP app is with `winget install kiwix`, but alternative sideloading instructions are available in the [release notes](https://kiwix.github.io/kiwix-js-windows/kiwix-js-uwp.html).

**You will need a ZIM file to work with this app.** For testing, the Store, Electron and NWJS versions come packaged with an archive of Wikipedia articles
related to Climate Change (as a starter ZIM), while packaged aps of WikiMed and Wikivoyage are also available in the Store or from [Releases](https://github.com/kiwix/kiwix-js-windows/releases/).
Go to [WikiMed by Kiwix](https://kiwix.github.io/kiwix-js-windows/wikimed-uwp.html) or [Wikivoyage by Kiwix](https://kiwix.github.io/kiwix-js-windows/wikivoyage-uwp.html).
You can download other ZIM archives from the Configuration page in the app (the download completes in the browser).

Alternatively, you can download files from the [Kiwix repository](http://library.kiwix.org) on a regular PC. Some archives are very large indeed,
for example full English Wikipedia with images is currently around 90GB, and you should download this with a BitTorrent client (torrent links are
provided in the app). For most storage types (including microSD cards) that are formatted as exFAT or NTFS, you can store even these very large files
in the storage with no problem. However, if you plan to store your ZIM file on an SD card formatted as **FAT32**, and you wish to use an archive larger than
4GB, then you will need to split the ZIM: see [file splitting instructions](https://github.com/kiwix/kiwix-js-windows/tree/master/AppPackages#download-a-zim-archive-all-platforms).

A lot of development for this app happens upstream in the [Kiwix JS repository](https://kiwix.github.io/kiwix-js/) to which I ontribute actively.
Without Kiwix JS, this app would be impossible, and huge thanks goes to the original developers of first the Evopedia app and then Kiwix HTML5, which
eventually became Kiwix JS. The original source code runs almost "as is" on the UWP platform, which is testament to how well written that app is.
The port and further development of Kiwix JS Windows for Windows 10/11 (including Mobile) is by Geoffrey Kantaris. I can be contacted by email:
egk10 at cam ac uk.

# Contributing

If you have coding experience and are interested in contributing to this project, we suggest you start by contributing to the upstream Kiwix JS repository, as
much of the code contributed there is subsequently ported to this repository. Please see [CONTRIBUTING.md](https://github.com/kiwix/kiwix-js/blob/master/CONTRIBUTING.md) for details.
If you wish to contribute to a specific Kiwix JS Windows/Linux feature, then please open an issue on this repository explaining the feature or other code you
aim to contribute and how you propose to this should be done. You should be comfortable creating PRs and have good knowledge of JavaScript. Follow the same
[contributing guidelines](https://github.com/kiwix/kiwix-js/blob/master/CONTRIBUTING.md) as for Kiwix JS.

# Privacy Policy

WikiMed Offline Medical Wikipedia works offline, and does not collect or record any of your personal data. It
only remembers your browsing history for the duration of a session (for the purpose of returning to previously
viewed pages). This history is lost on exiting the app with the optional exception of the last-visited page.

If you access this app from a secure web server (e.g. the PWA server), it will only work offline if your browser is
capable of installing a Service Worker. If you install or bookmark the PWA version, then it will work offline, but
note that **by design** any PWA will periodically check the PWA server (in this case, https://pwa.kiwix.org/), if it
is available, to check for an updated Service Worker.

Electron versions of the app may access GitHub on each start of the app to check for an update. This applies to the installer
(setup) version for Windows, and to the AppImage version for Linux. Other versions for Electron or NWJS do not auto-upaate
(and do not access the server).

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

**If you believe your Internet access is insecure, or is being observed or censored, we recommend that you completely shut down your Internet access (Data or WiFi) before using the application.**

Additionally, if you obtained this app from a Vendor Store (including extensions), then the Store operator may
track your usage of the app (e.g. download, install, uninstall, date and number of sessions) for the purpose of
providing anonymous, aggregate usage statistics to developers. If this concerns you, you should check the relevant
Store Privacy Policy for further information.

**Builds of this app are available that do not use a Store or an online Service Worker.** Please see:

* [Releases](https://github.com/kiwix/kiwix-js-windows/releases/)
* [NWJS version](https://kiwix.github.io/kiwix-js-windows/kiwix-js-nwjs.html) - this version is completely standalone
  and will never self-update or access servers unless you allow it to.
