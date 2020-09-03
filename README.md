# WikiMed Offline Medical Wikipedia

[There is a browser-based deployment of this app [here](https://kiwix.github.io/kiwix-js-windows/www/), 
but you will need a ZIM file for testing.]

This repository is for development of the Kiwix JS app for Windows 10 Universal Windows Platform.
Latest development code is on the [master-dev](https://github.com/kiwix/kiwix-js-windows/tree/master-dev/) branch.

This is a version of the Kiwix JS Offline Wikimedia reader for UWP on Windows 10 that has been packaged with
a WikiMed archive. If you are interested in the development of Kiwix JS, or want to install it without
the packaged archive, please switch back to the Master branch: https://github.com/kiwix/kiwix-js-windows/tree/master.

This app enables offline reading of the packaged ZIM archive, although many other ZIM files may be
downloaded from the Kiwix repository, including WikiMed versions with or without images
in many different languages. The underlying app has only been tested fully on Wikimedia ZIM files to date.

The easiest way to install WikiMed is from the Microsoft Store:

https://www.microsoft.com/en-gb/store/p/wikimed/9phjsnp1cz8j

However, if you prefer not to use the Store, or want to test a specific release, available packages are located under 
Releases: https://github.com/kiwix/kiwix-js-windows/releases. Installation instructions for the standalone app (Kiwix JS) 
are provided on the Master branch: https://github.com/kiwix/kiwix-js-windows/tree/master. 

# Privacy Policy

WikiMed Offline Medical Wikipedia works offline, and does not collect or record any of your personal data. It
only remembers your browsing history for the duration of a session (for the purpose of returning to previously
viewed pages). This history is lost on exiting the app and is not recorded in any way.                     

By default, this application will remember your last-visited page between sessions using a local cookie
that is accessible only by this app on this device. If you are accessing sensitive information that you do
not wish to be displayed next time you open this app, we recommend that you [turn this option off](file:///C:/Users/geoff/Source/Repos/kiwix-js-windows-wikimed/www/index.html#privacy) in the Configuration options.            

This application only reads the archive files that you explicitly select on your device and files included in
its own package: it is not capable of reading any other files. It will only access the Kiwix download server if
you specifically request it to find and display download links for ZIM archives on the Configuration page.
However, some ZIM archives contain active content (scripts) which may, in rare circumstances, attempt to
contact external servers for incidental files such as fonts. These scripts will only run if you enable Service
Worker mode in Configuration. Nevertheless, if you believe your Internet access is insecure, or is being
observed or censored, we recommend that you completely shut down your Internet (Data or WiFi) access before
using the application.                     

Additionally, if you obtained this app from a Vendor Store (including extensions), then the Store operator may
track your usage of the app (e.g. download, install, uninstall, date and number of sessions) for the purpose of
providing anonymous, aggregate usage statistics to developers. If this concerns you, you should check the
relevant Store Privacy Policy for further information. **Builds of this app are available that do not use a
Store. Please see [Releases](https://github.com/kiwix/kiwix-js-windows/releases)**. 
