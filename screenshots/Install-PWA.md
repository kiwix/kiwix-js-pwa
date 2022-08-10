# Installing the Kiwix JS PWA

In **Chromium browsers** (e.g. Chrome, Edge), you can install the PWA (Progressive Web App) as an offline-first app. It will have its own icon and will show up in the All Apps list (e.g. in Windows), or will have a desktop launcher (in Linux). **Firefox** doesn't support installing PWAs, but instead you can bookmark it and (after your first visit) it will also work offline when you open the bookmark.

Installing in a Chromium browser has the advantage that the app can then handle ZIM archives that you launch from the file system (e.g. by double-clicking the archive in File Explorer), as shown in the demo below.

## Demo: installing the PWA in Windows 11

![Install-PWA demo](Install-PWA_demo.gif)

## File Access permissions

[**Chromium browsers only:**] The app takes advantage of the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API), and the [File Handling API](https://web.dev/file-handling/). The first time you launch a ZIM archive from the file system, you will be asked for permission to open this type of file. If you grant this permission permanently, you won't be bothered by future permission prompts when opening a ZIM this way (from File Explorer). When you open a ZIM archive from within the app, however (from Configuration), you are asked for permission to access the file, or the folder containing your ZIM archives, each time that you re-launch the app (just once for each launch). This is a security feature of the API. An alternative to both of these is to use drag-and-drop to launch your archive.

**Firefox** does not support these APIs, but it does support **drag-and-drop** (as do all desktop browsers), which can give you a very similar experience. When you drag-and-drop an archive into the app, you won't be bothered by permission prompts. In all browsers, you can of course simply open an archive with the file picker on the Configuration page of the app.
