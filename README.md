# Kiwix JS for PWA, Windows and Linux (Electron, NWJS, UWP)

Demos:&emsp;[&nbsp;[Instal PWA on Desktop](screenshots/Install-PWA.md)&nbsp;]&emsp;[&nbsp;[Install and use: Android](screenshots/Demo-OPFS_Chrome_Android.md)&nbsp;]&emsp;[&nbsp;[Install and use: Firefox Android](screenshots/Install-PWA_Firefox_Android.md)&nbsp;]&emsp;[&nbsp;[Picking a folder of archives](screenshots/Folder-Picking.md)&nbsp;]&emsp;[&nbsp;[File handling (desktop)](screenshots/Demo-FileHandling.md)&nbsp;]&emsp;[&nbsp;[Demo all OPFS features](screenshots/Demo-OPFS_all_features.md)&nbsp;]&emsp;[&nbsp;[Adding app to Edge sidebar](screenshots/Add-KiwixPWA-to-Edge-sidebar.md)&nbsp;]

![Kiwix JS Seven Wonders Montage trans](https://user-images.githubusercontent.com/4304337/218268736-2820050c-289f-4d4b-aef9-7e9f4f33c658.png)

**WikiMed by Kiwix is an offline reader for multilingual medical content from Wikipedia Project Medicine and MDWiki. It
makes medical knowledge available to people with limited or no Internet access. The software and the content are free for anyone to use.
The app comes packaged with WikiMed in English, but you can also download your choice of language (a ZIM archive, which can be downloaded in the app). There are different, multilingual editions of the WikiMed archives to choose from.** 

See **[WikiMed by Kiwix](https://kiwix.github.io/kiwix-js-pwa/wikimed)** for the latest release packages for various
Windows and Linux operating systems. We also have packaged apps of
**[Wikivoyage by Kiwix](https://kiwix.github.io/kiwix-js-pwa/wikivoyage)** (a complete travel guide) in English. For a
lighter download, or for older operating systems, you can download the base app
**[Kiwix JS for Windows and Linux](https://kiwix.github.io/kiwix-js-pwa/app)** (from which WikiMed by Kiwix is built)
and download your choice of archive or language in-app. 

If you are using **Windows 10 or 11**, then all three apps are conveniently available in the Microsoft Store. These versions are lighter
than the Electron versions, but *please note that the Store apps do not currently support Full-Text search* (only title search, which is
usually sufficient for Wikimedia apps):

If you are using **Windows 10 or 11**, then all three apps are conveniently available in the Microsoft Store:
**[Kiwix JS UWP](https://apps.microsoft.com/detail/9P8SLZ4J979J)**,
**[WikiMed by Kiwix](https://apps.microsoft.com/detail/9PHJSNP1CZ8J)**,
and **[Wikivoyage by Kiwix](https://apps.microsoft.com/detail/9N5SB90Q4JBJ)**.

The Store apps will automatically update when a new package is available (but note that it does not have Full-Text search). The
**[Electron versions](http://kiwix.github.io/kiwix-js-pwa/wikimed)** (Linux and Windows) will notify you when an update
is available (if you allow Internet access), and give you a download link.

*Don't like stores or packages?* We've got you covered! Launch Kiwix JS instantly by opening the installable, offline-capable PWA
(Progressive Web App) in your browser right now at **[pwa.kiwix.org](https://pwa.kiwix.org/)**. This works in any browser that supports Service Workers: modern Chrome, Edge, Firefox and Safari (note that on iOS devices, you must use Safari).

Get a free ZIM archive to use with the PWA from the [Configuration page](https://pwa.kiwix.org/www/index.html#downloads) of the app,
or you can preview a ZIM at [library.kiwix.org](https://library.kiwix.org) before you download one.
Once installed, bookmarked or added to your home screen, the PWA works even when your device is fully offline!
**[Take a look at our demo](screenshots/Install-PWA.md) that shows how quick and easy it is to install the PWA.**

## Browser support

We pride ourselves in maintaining support for old browsers and platforms, given that an important target audience for this app consists of
users in the developing world who may only have access to old devices with outdated software. We test the app frequently on older browsers
and operating systems. The app will usually detect which features don't work on a given browser, and disable them or work around them. However,
in some cases (e.g. Firefox <= 59), the app will set itself to Service Worker mode, but this mode will silently fail. If affected, please
try switching the app to Restricted mode (see Content injection mode in Configuration).

### Officially supported

* As a [Progressive Web App](https://pwa.kiwix.org) (PWA) on Linux, Windows, Android, iOS, macOS:

  + <img src="images/googlechrome-color.svg" width="20" /> Google Chrome / Chromium >= 59 (and many browsers based on Chromium, e.g. Opera, Samsung Internet)
  + <img src="images/microsoftedge-color.svg" width="20" /> Microsoft Edge (Chromium) >= 79
  + <img src="images/firefoxbrowser-color.svg" width="20" /> Mozilla Firefox >= 68 (but see note about Android`*`)
  + <img src="images/safari-color.svg" width="20" /> Apple Safari >= 11.3 for iOS and macOS (full-text search only works on iOS 15+)
  + <img src="images/edgelegacy-color.svg" width="22" /> Microsoft Edge Legacy 18 (Windows only)

* As an application implemented with the following frameworks:

  + <img src="images/electron-color.svg" width="27" /> Electron >= 1.8.0 (Ubuntu, Debian, Fedora, OpenSUSE, AppImage, Windows, macOS): [GitHub release](https://kiwix.github.io/kiwix-js-pwa/app)
    + Builds available for ia32, x86, x64, ARM64, M1/M2/M3
  + <img src="images/microsoftwindows-color.svg" width="20" /> Universal Windows Platform (UWP) >=10.0.10240: [Microsoft Store app](https://apps.microsoft.com/detail/9P8SLZ4J979J) or [GitHub release](https://kiwix.github.io/kiwix-js-pwa/app) - Windows 10/11 (Electron), Windows on ARM, Xbox, Windows 10 Mobile
  + <img src="images/nwjs-color.svg" width="20" /> NWJS >= 0.23.0 (Windows 7/8/10/11): [GitHub release](https://kiwix.github.io/kiwix-js-pwa/app/nwjs.html)
  + NWJS 0.14.7 (Windows XP/Vista only): [GitHub release](https://kiwix.github.io/kiwix-js-pwa/app/nwjs.html)

`*` With **Firefox on Android**, the app is only useable with files stored in the Origin Private File System. There is a Firefox bug whereby
the browser attempts to read the entire ZIM archive into memory if opening it from the user-visible file system.

### Deprecated

Although deprecated, we will keep support for as long as is practical:

* Internet Explorer 11 (Restricted mode only, no offline use of PWA)
* Edge Legacy <= 17 (Restricted mode only, no offline use of PWA)
* Firefox 45-67 (some versions require the user to switch manually to Restricted mode, and some are unable to display WebP images)
* Chromium 49-58 (some versions only run in Restricted mode)

## Reporting bugs and technical support

Please use this repository's [issue tracker](https://github.com/kiwix/kiwix-js-pwa/issues) to report any bugs you have found with the
software. Open a new ticket (after checking that the issue you identified doesn't have a ticket already). Please state clearly
the version number you are using (at the top of the Configuration page in the app), and which browser or platform you are using.

If you are having difficulties with the software, or would like to see a new feature, please also open a ticket. Alternatively, see the
Feedback section on the About page in the app for other ways of getting technical support for your issue. Feel free to get in contact
(see About page of app) if you would just like to provide feedback, or leave a review if you obtained the app from a Store. If you like
the app, please star this Repostiory (see top)!

## Technical information

This branch is for development of the WikiMed app for Electron, NWJS and Windows 10/11 Universal Windows Platform (UWP).
The latest code is usually on the main branch, but this is used for active development and may be several commits ahead of releases.
Installable and portable versions for Windows (XP/Vista/7/8/10/11), Linux (32bit and 64bit) and macOS (x64/M1/M2/M3 and legacy High
Sierra/Mojave) are available from [releases](https://github.com/kiwix/kiwix-js-pwa/releases/). Unstable
[nightly builds](https://download.kiwix.org/nightly/) of the Electron and NWJS apps are available together with a
[development deployment](https://kiwix.github.io/kiwix-js-pwa/), but code may be buggy and change rapidly. Additionally, nightly
Windows binaries are **unsigned**.

The code is based on [Kiwix JS](https://github.com/kiwix/kiwix-js), a lightweight HTML/JavaScript port of the
[Kiwix Offline reader](https://kiwix.org/). Significant development has gone into packaging this app for various frameworks, and to add
some features which are often backported upstream. The PWA can be installed as a fully integrated system app if opened in a modern
Chromium browser, and it uses the File System Access API and the File Handling API for a native-like experience in browsers supporting
those APIs. For more info about these APIs, see the bottom of this page:
[File System Access API and File Handling](screenshots/Install-PWA.md#file-system-access-api-and-file-handling).

The apps are also available in the WinGet Package Manager. You can sideload the UWP version (in Windows 10/11) by opening a Command
Prompt or PowerShell terminal and typing `winget install kiwix.kiwixjs` (this version will not auto-update, but it will let you know when
a new update is ready to install). Alternative sideloading instructions are available in the
[release notes](https://kiwix.github.io/kiwix-js-pwa/app). The Electron version can be installed with
`winget install kiwix.kiwixjs.electron`, or else by downloading a package from
[Releases](https://github.com/kiwix/kiwix-js-pwa/releases/). For testing, the Store, Electron and NWJS versions come packaged with a
mini archive of the top 100 Wikipedia articles (without images and with only the lede paragraph).

Some ZIM archives are very large indeed, so the underlyin limits of the File System can be a consideration. For most storage types
(including microSD cards) that are formatted as exFAT or NTFS, you can store even these very large files in the storage with no problem.
However, if you plan to store your ZIM file on an SD card formatted as **FAT32**, and you wish to use an archive larger than 4GB, then
you will need to split the ZIM: see
[file splitting instructions](https://github.com/kiwix/kiwix-js-pwa/tree/main/AppPackages#download-a-zim-archive-all-platforms).

A lot of development for this app happens upstream in the [Kiwix JS repository](https://kiwix.github.io/kiwix-js/) to which I contribute
actively. Without Kiwix JS, this app would be impossible, and huge thanks goes to the original developers of first the Evopedia app and
then Kiwix HTML5, which eventually became Kiwix JS. The port and further development of Kiwix JS PWA and other apps is by Geoffrey
Kantaris. I can be contacted by email: egk10 at cam ac uk.

## Contributing code

If you have coding experience and are interested in contributing to this project, we suggest you start by contributing to the upstream
[Kiwix JS repository](https://kiwix.github.io/kiwix-js/), as much of the code contributed there is subsequently ported to this repository.
Please see [CONTRIBUTING.md](https://github.com/kiwix/kiwix-js/blob/main/CONTRIBUTING.md) for details. If you wish to contribute to a specific
Kiwix JS PWA feature, then please open an issue on this repository explaining the feature or other code you aim to contribute and how you propose
this should be done. You should be comfortable creating PRs and have good knowledge of JavaScript. Follow the same
[contributing guidelines](https://github.com/kiwix/kiwix-js/blob/main/CONTRIBUTING.md) as for Kiwix JS.

We have now transitioned this app to ES6 code, which is transpiled by [rollup.js](https://rollupjs.org/) and [Babel](https://babeljs.io/) to code
that is compatible with older browsers. Brief instructions:

* Clone this repo and run `npm install` to get the Node dependencies;
* To serve the app with [Vite.js](https://vitejs.dev/), which includes Hot Module Replacement, run `npm run serve`;
* You MUST turn on the option to Bypass the app cache in Configuration under Troubleshooting and development. If the app loads in a disordered way,
you should still be able to access this setting so long as the app is in ServiceWorker mode (if it isn't turn it on under Content injection mode).
Refresh the app with Ctrl-R;
* Vite will watch for changes and will refresh the app when you make any and save them;
* To preview the bundled version of the app, run `npm run preview`, and Vite will build the app and open a browser window to view the bundled version;
* To fully build the app, run `npm run build`. The built app will be saved to a directory called `dist` in your cloned repo; 
* To run the app in the Electron framework, you can use `npm start`. This will run the unbundled app in the Electron version specified in `package.json`. See various
scripts to build the bundled version of the app for Electron in `package.json` (you can only build it for the OS you are currently on, though the Linux app can be built
on Windows with WSL).

## Other contributions / donations

If you like this project and would like to contribute financially towards keeping it running, you can make one-off or regular donations on the Kiwix
[Support page](https://www.kiwix.org/en/support/). Donations help pay for servers, coding certificates, maintenance, etc. If you would like to contribute
time and expertise rather than money, and you have good knowledge of a foreign language, you can help with [translations of Kiwix projects](https://translatewiki.net/wiki/Special:SearchTranslations?query=kiwix&language=en).
Alternatively, you can help improve Wikimedia projects by [making edits or corrections](https://en.wikipedia.org/wiki/Wikipedia:Contributing_to_Wikipedia)
to Wikipedia or Wikivoyage articles.

![ContactSheet-Kiwix-5x6_sphere@0 5x_masked](https://user-images.githubusercontent.com/4304337/204076458-d95cf440-294a-4655-bc59-2529b123708c.png)

## Privacy Policy

When installed, WikiMed Offline Medical Wikipedia is capable of working entirely offline. This application does not
collect or record any of your personal data, though if you installed it from a Store, the Store operator may collect
anonymous usage data (see below). The app only remembers your browsing history for the duration of a session (for the
purpose of returning to previously viewed pages). This history is lost on exiting the app with the optional exception
of the last-visited page.

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

Additionally, if you obtained this app from a vendor store (including extensions), then the Store operator may track your
usage of the app (e.g. download, install, uninstall, date and number/duration of sessions) for the purpose of providing
anonymous, aggregate usage statistics to developers. If this concerns you, you should check the relevant Store Privacy Policy
for further information.

**Builds of this app are available that do not use a Store or an online Service Worker.** Please see:

* [Releases](https://github.com/kiwix/kiwix-js-pwa/releases/)
* [NWJS version](https://kiwix.github.io/kiwix-js-pwa/app/nwjs.html) - this version is completely standalone
  and will never access servers unless you allow it to.
