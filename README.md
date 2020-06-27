# Kiwix JS for Windows

[There is a browser-based deployment of this app [here](https://kiwix.github.io/kiwix-js-windows/www/), 
but you will need a ZIM file for testing.]

This repository is for development of the Kiwix JS app for Windows 10 Universal Windows Platform.
Latest development code is on the [master-dev](https://github.com/kiwix/kiwix-js-windows/tree/master-dev/) branch.

This is a port of the Kiwix Offline Wikipedia (and other Wiki) reader for UWP on Windows 10.
It enables offline reading of a ZIM file downloaded from the Kiwix repository, including full
Wikipedia versions with or without images in many different languages. It has only been tested 
fully on Wikimedia ZIM files to date, though many Stackexchange ZIMs also work.

This began as a simple port of Kiwix JS, the HTML5 web app provided on this git-hub repository, although
significant development has been undertaken to add functionality and to make the app sit happily
with the Universal Windows Platform. This port is primarily intended for Windows Mobile, but it
should run as a UWP Store App on any Windows 10 platform: x86, x64, ARM, on Mobile, tablets, Xbox,
Surface Hub, Holographic and PC. It has been tested on Lumia 950XL (Mobile), Tablet/PC x64 
(Windows 10), and a Windows 10 Mobile VM.

The UWP app is currently installable from the Microsoft Store at:

[https://www.microsoft.com/en-gb/store/p/kiwix-js/9p8slz4j979j](https://www.microsoft.com/en-gb/store/p/kiwix-js/9p8slz4j979j)

However, if you prefer not to use the Store, or want to test a specific release, available packages are located under 
Releases: https://github.com/kiwix/kiwix-js-windows/releases. Installation instructions for the standalone app (Kiwix JS) 
are provided on the Master branch: https://github.com/kiwix/kiwix-js-windows/tree/master. 

You will need a ZIM file to work with this app. For testing, it comes packaged with the Ray Charles ZIM.
You can download other ZIM archives from the setup page in the app (the download completes in the browser).
Place the file in an accessible location on your device, and use the Rescan Storage button in the app to
display buttons that let you pick the file or the file's folder.

Alternatively, you can download files from [https://wiki.kiwix.org/wiki/Content_in_all_languages](http://wiki.kiwix.org/wiki/Content_in_all_languages) on a regular
PC. The single non-indexed ZIM files work best. However, if you plan to store your ZIM file on an SD card 
formatted as FAT32, you will only be able to use the split files (.zimaa, .zimab, etc.) in the pre-indexed
archives. If your SD card is formatted as exFAT or NTFS, you can use either, but single file is easiest.

You can also run the app in your browser if you prefer, either from the file:// protocol or from your own
local server. There is a test deployment at: [https://kiwix.github.io/kiwix-js-windows/www/](https://kiwix.github.io/kiwix-js-windows/www/), but note that
you will need a ZIM file, and some functionality is limited (e.g. accessing the Kiwix servers in the app
is blocked by CORS, and you have to pick a file each time you access the app in browser context).

The authors of the HTML5 app for Kiwix did all the work. Their source code runs almost "as is" on
the UWP platform, which is testament to how well written their app is. This port and further development 
for Windows 10 (Mobile) is by Geoffrey Kantaris. I can be contacted by email: egk10 at cam ac uk.

# Privacy Policy

Kiwix JS Windows works offline, and does not collect or record any of your personal data. It
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
