# Installing the Kiwix JS PWA

Simply visit **_[pwa.kiwix.org](https://pwa.kiwix.org)_** in a modern browser. Read more after the demo:

![Install-PWA demo](Install-PWA_demo.gif)

## Install in Chrome/Edge, bookmark in Firefox

In **Chromium browsers** (e.g. Chrome, Edge), you can install the PWA (Progressive Web App) as an offline-first app as in the demo above:
an "Install" button will show up in Configuration. **Firefox** doesn't support installing PWAs, but instead you can bookmark it and
(after your first visit) it will also work offline when you open the bookmark. This should work in any browser that supports
[Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API).

## So why bother installing the app?

Once it is installed, the app will have its own icon and will appear in the All Apps list (e.g. in Windows), or will have a desktop launcher (in Linux). It will run in a separate window from your browser. It also has the advantage that the app can then handle ZIM archives that you launch from the file system (e.g. by double-clicking the archive in File Explorer), as shown in the demo above.

## Accessing your ZIM files

In all browsers, you can simply open an archive using the File Picker on the Configuration page of the app. In all desktop browsers, you can drag-and-drop an archive into the app. If you have an archive made up of a set of split files (ending `.zimaa`, `.zimab`, `.zimac`, etc.), then you can drag-and-drop the whole set into the app, or, more conveniently in Chromium browsers, you can simply pick a folder that contains your archives (including any split archives).

## File System Access API and File Handling

In **Chromium browsers**, the app can take advantage of the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API), which can remember your selected archive or folder between app launches. If you install the app, it can also take advantage of the [File Handling API](https://web.dev/file-handling/). Together, these APIs provide a near-native experience.

When installed, the first time you launch a ZIM archive from the file system, you will be asked for permission to open this type of file (this prompt isn't shown in the demo above). If you grant this permission permanently (tick the check box), you won't be bothered by future permission prompts when opening a ZIM from anywhere on your PC.

When you open a ZIM archive or folder *from within the app* (from Configuration), you are asked for permission to access the file or the folder containing your ZIM archives. On next launch, the selected file or folder is remembered. When you click on the archive name, you are given a quick permissions prompt (just once per launch). This is a security feature of the API and can't currently be avoided.
