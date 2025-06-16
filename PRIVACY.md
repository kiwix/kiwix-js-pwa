## Kiwix PWA Privacy Policy

This Privacy Policy applies to the Kiwix JS Progressive Web App (Kiwix PWA) and versions of it packaged for the Electron, NWJS and UWP
frameworks that are published on Kiwix servers, and by official Kiwix accounts on GitHub and other third-party vendor stores ("app stores").
It also covers WikiMed by Kiwix and Wikivoyage by Kiwix, which are versions of Kiwix JS packaged with WikiMed, MDWiki, or Wikivoyage ZIM
archives respectively.

When installed, this application is capable of working entirely offline. It does not collect or record any of your personal data, though
if you installed it from a Store, the Store operator may collect anonymous usage data (see below). The app only remembers your browsing
history for the duration of a session (for the purpose of returning to previously viewed pages). This history is lost on exiting the
app with the optional exception of the last-visited page.

If you access this application from a secure web server (e.g. the PWA server), it will only work offline if your browser
is capable of installing a Service Worker. If you install or bookmark the PWA version in ServiceWorker mode, then it
will work offline, but note that **by design** any PWA will periodically check the PWA server (in this case, 
https://pwa.kiwix.org/), if it is available, to check for an updated Service Worker.

Versions of the app that are not installed via a Store or that are not PWAs, will offer to check the GitHub Releases API
for updates on startup, but this functionality is optional and can be kept off. Some Electron apps will also optionally
self-update (via the same API), if you allow them to check for updates. This applies to the installer (setup) version for
Windows, and to the AppImage version for Linux. More Electron packages, in the future, may also auto update as that functionality
is added. The Store version and the PWA also self-update, but this is not controllable within the app.

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

The Kiwix PWA server, like any server, retains access logs for security reasons, but these are erased when a new release
causes the container to be rebuilt (usually once per month, but may be longer).

**If you believe your Internet access is insecure, or is being observed or censored, we recommend that you completely shut
down your Internet access (Data or WiFi) before using the application.**

Additionally, if you obtained this app from a vendor store (including extensions), then the Store operator may track your
usage of the app (e.g. download, install, uninstall, date and number/duration of sessions) for the purpose of providing
anonymous, aggregate usage statistics to developers. If this concerns you, you should check the relevant Store Privacy Policy
for further information.
