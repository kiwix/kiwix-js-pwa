# Kiwix JS for PWA, Electron, NWJS and Universal Windows Platform

![WikiMed montage](https://user-images.githubusercontent.com/4304337/182706203-eca53649-8dea-44b9-ac4a-b08cc05c4252.png)

**Kiwix is an offline reader for multilingual content from Wikipedia, Project Gutenberg, TED Talks, Wikivoyage, Stackexchange, etc. It
makes knowledge available to people with limited or no Internet access. The software and the content are free for anyone to use.
Get the app and download your choice of offline content (a ZIM archive, which can be downloaded in the app). There are hundreds of free
archives to choose from, on many different topics and subjects. Build a whole digital library of offline knowledge!** 

See [Kiwix JS for Windows and Linux](https://kiwix.github.io/kiwix-js-windows/kiwix-js-uwp.html) for the latest release for different
operating systems. We also have packaged apps of [WikiMed by Kiwix](https://kiwix.github.io/kiwix-js-windows/wikimed-uwp.html) (a
complete medical encyclopaedia), and [Wikivoyage by Kiwix](https://kiwix.github.io/kiwix-js-windows/wikivoyage-uwp.html) (a complete
travel guide) in English -- no extra download needed!

If you are using Windows 10 or 11, then all three apps are conveniently available in the Microsoft Store:
[Kiwix JS UWP](https://www.microsoft.com/store/apps/9P8SLZ4J979J), [WikiMed by Kiwix](https://www.microsoft.com/store/apps/9PHJSNP1CZ8J),
and [Wikivoyage by Kiwix](https://www.microsoft.com/store/apps/9N5SB90Q4JBJ). They will automatically update when a new package is
available. If you are using Linux, then the AppImage Electron package of Kiwix JS also (optionally) self-updates, as does the
installable Windows Electron package. All other apps can (optionally) notify you when a new version is available, and give you a download
link.

*Don't like stores or packages? We've got you covered! Launch this app instantly by opening the installable, offline-capable PWA
(Progressive Web App) in your browser right now at **[pwa.kiwix.org](https://pwa.kiwix.org/)**. Get a free ZIM archive to use with it
from the [Configuration page](https://pwa.kiwix.org/www/index.html#downloads) of the app, or you can preview a ZIM at
[library.kiwix.org](https://library.kiwix.org) before you download one. Once installed or bookmarked, the PWA works fully offline!*
**[Take a look at our demo](screenshots/Install-PWA.md) that shows how quick and easy it is to install the PWA.**

## Technical information

This repository is for development of the Kiwix JS app for PWA, Electron, NWJS and Windows 10/11 Universal Windows Platform (UWP).
The latest code is usually on the master branch, but this is used for active development and may be several commits ahead of releases.
Installable and portable versions for Windows (XP/Vista/7/10/11) and Linux (32bit and 64bit) are available from
[releases](https://github.com/kiwix/kiwix-js-windows/releases/). Unstable [nightly builds](https://download.kiwix.org/nightly/) of the
Electron and NWJS apps are available together with a [development deployment](https://kiwix.github.io/kiwix-js-windows/), but code may be
buggy and change rapidly.

This is a lightweight HTML/JavaScript port of the Kiwix Offline reader. The UWP version targets Windows 10/11 (x86, x64, ARM, mobile,
tablet, Xbox, Surface Hub, Holographic) while the NWJS and Electron versions also run on earlier Windows (all the way back to Windows XP)
and Linux: see the respective [releases](https://github.com/kiwix/kiwix-js-windows/releases/) for more information. The PWA should work
with any browser that supports Service Workers, but has only been tested on Edge Chromium, Edge Legacy, Firefox and Samsung Internet
Browser. The PWA uses the File System Access API and the File Handling API for a native-like experience in browsers supporting those
APIs. For more info about these APIs, see the bottom of this page:
[File System Access API and File Handling](screenshots/Install-PWA.md#file-system-access-api-and-file-handling).

Offline ZIM archives are available from the [Kiwix repository](https://library.kiwix.org), including full Wikipedia versions with or
without images in many different languages. This app is regularly tested fully on Wikimedia ZIM files, though a number of other ZIM file
types work. There is *preliminary* support for Zimit ZIMs from version 1.9.8 onwards, and Type 1 Zimit ZIMs are supported from 2.1.0
onwards.

This project began as a simple port of [Kiwix JS](https://github.com/kiwix/kiwix-js), the HTML5 web app provided upstream at
https://github.com/kiwix/kiwix-js, although significant development has been undertaken to add functionality and to make the app sit
happily with the Universal Windows Platform, and more recently Electron and NWJS, as well as to work as an installable PWA.

All three apps are available in the WinGet Package Manager. Install the UWP version (in Windows 10/11) by opening a Command Prompt or
PowerShell terminal and typing `winget install kiwix.kiwixjs` (this version will not auto-update, but it will let you know when a new
update is ready to install). Alternative sideloading instructions are available in the
[release notes](https://kiwix.github.io/kiwix-js-windows/kiwix-js-uwp.html). The Electron version can be installed with
`winget install kiwix.kiwixjs.electron`, or else by downloading a package from
[Releases](https://github.com/kiwix/kiwix-js-windows/releases/).

For testing, the Store, Electron and NWJS versions come packaged with an archive of Wikipedia articles related to Climate Change (as a
starter ZIM), while packaged aps of [WikiMed by Kiwix](https://kiwix.github.io/kiwix-js-windows/wikimed-uwp.html) and 
[Wikivoyage by Kiwix](https://kiwix.github.io/kiwix-js-windows/wikivoyage-uwp.html) are also available.

You can download archives in-app, or from the [Kiwix repository](http://library.kiwix.org) on a regular PC. Some archives are very large
indeed, for example full English Wikipedia with images is currently around 90GB, and you should download this with a BitTorrent client
(torrent and magnet links are provided in the app). For most storage types (including microSD cards) that are formatted as exFAT or NTFS,
you can store even these very large files in the storage with no problem. However, if you plan to store your ZIM file on an SD card
formatted as **FAT32**, and you wish to use an archive larger than 4GB, then you will need to split the ZIM: see
[file splitting instructions](https://github.com/kiwix/kiwix-js-windows/tree/master/AppPackages#download-a-zim-archive-all-platforms).

A lot of development for this app happens upstream in the [Kiwix JS repository](https://kiwix.github.io/kiwix-js/) to which I ontribute
actively. Without Kiwix JS, this app would be impossible, and huge thanks goes to the original developers of first the Evopedia app and
then Kiwix HTML5, which eventually became Kiwix JS. The original source code runs almost "as is" on the UWP platform, which is testament
to how well written that app is. The port and further development of Kiwix JS Windows for Windows 10/11 (including Mobile) is by Geoffrey
Kantaris. I can be contacted by email: egk10 at cam ac uk.

# Reporting bugs

Please use this repository's [issue tracker](https://github.com/kiwix/kiwix-js-windows/issues) to report any bugs you have found with the software. Open a new
issue (after checking that the issue you identified doesn't have an issue already). In all cases, please state clearly the version number you are using (see
the About page in the app), and which browser or platform you are using. Please read the
[Kiwix JS bug reporting guidelines](https://github.com/kiwix/kiwix-js/blob/master/REPORT_BUG.md) before opening your issue.

# Contributing code

If you have coding experience and are interested in contributing to this project, we suggest you start by contributing to the upstream [Kiwix JS repository](https://kiwix.github.io/kiwix-js/),
as much of the code contributed there is subsequently ported to this repository. Please see [CONTRIBUTING.md](https://github.com/kiwix/kiwix-js/blob/master/CONTRIBUTING.md) for details.
If you wish to contribute to a specific Kiwix JS Windows/Linux feature, then please open an issue on this repository explaining the feature or other code you
aim to contribute and how you propose this should be done. You should be comfortable creating PRs and have good knowledge of JavaScript. Follow the same
[contributing guidelines](https://github.com/kiwix/kiwix-js/blob/master/CONTRIBUTING.md) as for Kiwix JS.

# Other contributions / donations

If you like this project and would like to contribute financially towards keeping it running, you can make one-off or regular donations on the Kiwix
[Support page](https://www.kiwix.org/en/support/). Donations help pay for servers, coding certificates, maintenance, etc. If you would like to contribute
time and expertise rather than money, and you have good knowledge of a foreign language, you can help with [translations of Kiwix projects](https://translatewiki.net/wiki/Special:SearchTranslations?query=kiwix&language=en).
Alternatively, you can help improve Wikimedia projects by [making edits or corrections](https://en.wikipedia.org/wiki/Wikipedia:Contributing_to_Wikipedia)
to Wikipedia or Wikivoyage articles. 

# Privacy Policy

When installed, Kiwix JS Windows and Linux is capable of working entirely offline. This application does not collect or
record any of your personal data, though if you installed it from a Store, the Store operator may collect anonymous
usage data (see below). The app only remembers your browsing history for the duration of a session (for the purpose
of returning to previously viewed pages). This history is lost on exiting the app with the optional exception of the
last-visited page.

If you access this application from a secure web server (e.g. the PWA server), it will only work offline if your browser
is capable of installing a Service Worker. If you install or bookmark the PWA version in Service Worker mode, then it
will work offline, but note that **by design** any PWA will periodically check the PWA server (in this case, 
https://pwa.kiwix.org/), if it is available, to check for an updated Service Worker.

Versions of the app that are not installed via a Store or that are not PWAs, will offer to check the GitHub Releases API
for updates on startup, but this functionality is optional and can be kept off. Some Electron apps will also optionally
self-update (via the same API), if you allow them to check for updates. This applies to the installer (setup) version for
Windows, and to the AppImage version for Linux. The Store version and the PWA also self-update, but this is not 
controllable within the app.

By default, this application will remember your last-visited page between sessions using local stoarage or a cookie
that is accessible only on this device. If you are accessing sensitive information that you do not wish to be displayed
next time you open this app, we recommend that you turn this option off in the Configuration options.

This application only reads the archive files that you explicitly select on your device and files included in its own
package: it is not capable of reading any other files. It will only access the Kiwix archive download server if
you specifically request it to access the download library for ZIM archives on the Configuration page. If you run the
app as a PWA, it will cache its own code from the secure PWA server and then can be used offline. Some ZIM archives
contain active content (scripts) which may, in rare circumstances, attempt to contact external servers for incidental files
such as fonts. We block these with a Content Security Policy injected into articles, but in some cases, if the article already
has a CSP, ours may be overwritten. Note that scripts only run if you enable Service Worker mode in Configuration.

**If you believe your Internet access is insecure, or is being observed or censored, we recommend that you completely shut
down your Internet access (Data or WiFi) before using the application.**

Additionally, if you obtained this app from a Vendor Store (including extensions), then the Store operator may track your
usage of the app (e.g. download, install, uninstall, date and number/duration of sessions) for the purpose of providing
anonymous, aggregate usage statistics to developers. If this concerns you, you should check the relevant Store Privacy Policy
for further information.

**Builds of this app are available that do not use a Store or an online Service Worker.** Please see:

* [Releases](https://github.com/kiwix/kiwix-js-windows/releases/)
* [NWJS version](https://kiwix.github.io/kiwix-js-windows/kiwix-js-nwjs.html) - this version is completely standalone
  and will never access servers unless you allow it to.
