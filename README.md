# Kiwix JS Wikivoyage for Windows

*There is a browser-based deployment and **[installable Progressive Web App (PWA)](https://pwa.kiwix.org/)** version of this app at
https://pwa.kiwix.org/, but you will need a ZIM file for testing. A [development deployment](https://kiwix.github.io/kiwix-js-windows/)
is also available, but code may be buggy and change rapidly, and it is not recommended to install this as a PWA.*

This repository is for development of the Kiwix JS app for Windows 10 Universal Windows Platform, PWA, Electron and NWJS.
Latest development code is usually on the [master-dev](https://github.com/kiwix/kiwix-js-windows/tree/master-dev/) branch.

[ Microsoft Store link: https://www.microsoft.com/store/apps/9N5SB90Q4JBJ ] 

This is a version of the Kiwix Offline Wikimedia reader for UWP on Windows 10 that has been packaged with
a Wikivoyage archive. If you are interested in the development of Kiwix JS, or want to install it without
the packaged archive, please switch back to the Master branch: https://github.com/kiwix/kiwix-js-windows/tree/master

This app enables offline reading of the packaged ZIM archive, although many other ZIM files may be
downloaded from the Kiwix repository, including full Wikipedia versions with or without images
in many different languages. The underlying app has only been tested fully on Wikimedia ZIM files to date.

However, if you prefer not to use the Store, or want to test a specific release, available packages are located under
Releases: https://github.com/kiwix/kiwix-js-windows/releases/. Installation instructions for the standalone app (Kiwix JS)
are provided on the Master branch: https://github.com/kiwix/kiwix-js-windows/tree/master. Electron and NWJS versions are also available from Releases,
and a PWA version can be installed by visiting https://pwa.kiwix.org/.

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

When installed, Wikivoyage by Kiwix works offline, and does not collect or record any of your personal data. It
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
