# Opening a ZIM from the File System (desktop browsers only)

Simply visit **_[pwa.kiwix.org](https://pwa.kiwix.org)_** in a dekstop browser and install. More info after the demo:

![File handling demo](File_handling.gif)

See also: [&ensp;[Install PWA](Install-PWA.md)&ensp;]  [&ensp;[Folder picking](Folder-Picking.md)&ensp;]  [&ensp;[Demo of all OPFS features](Demo-OPFS_all_features.md)&ensp;]

## How do I install the PWA?

In Chromium browsers (Chrome, Edge, Brave, etc.), an Install button will show in Configuration. In Safari on macOS you can use File ->
Add to Dock, and in Firefox (desktop), you can bookmark the app. The demo shows file handling in a Chromium browser on Linux, but it's
exactly the same process on Windows and macOS. For Firefox and Safari, see "What about Firefox and Safari?" below.

## The File Handling API is available on Chromium desktop browsers

Currently file handling as shown in the demo can only be used on modern **Chromium browsers** in Linux, macOS and Windows (not yet on mobile).
You will need to give permission the first time that you open a ZIM from the file system. For the best experience, be sure to tick the box
allowing the app to always open ZIM files.

## What about Firefox and Safari?

In all browsers, you can drag and drop a file from the file exploer, with very similar effect to the File Handling API. However, you might
find it more convenient to put all your ZIM archives in one folder and [open the folder](Folder-Picking.md) from within the app. Then you
can very quickly switch between archives. For a really seamless experience, consider using the [Private File system](Demo-OPFS_all_features.md)
on (Firefox and Chromium) browsers. 

## Why don't my files show the Kiwix icon?

Due to the fear of Web Apps fishing and spoofing by registering themselves for common file types such as Word, Excel, etc.,
Chromium browsers have not yet implemented file system icons, though they intend to do so. You can follow progress on this issue in
[#486](https://github.com/kiwix/kiwix-js-pwa/issues/486).

## Help, another app opens, or the app starts but doesn't open the ZIM!

This can sometimes happen with the installed PWA, if you have another app installed that handles ZIM files. You can usually fix this by right
clicking the file, choose Properties, and click the "Change" button next to "Opens with" (in Windows), or under the "Open with" tab in Linux.
Choose "Kiwix JS PWA Edition" under the list of suggested apps. Then click "Apply" (Windows) or "Set as Default" (Linux).

See also: [&ensp;[Install PWA](Install-PWA.md)&ensp;]  [&ensp;[Folder picking](Folder-Picking.md)&ensp;]  [&ensp;[Demo of all OPFS features](Demo-OPFS_all_features.md)&ensp;]
