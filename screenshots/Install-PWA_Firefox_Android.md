# Installing the PWA and using the OPFS on Firefox for Android

Simply visit **_[pwa.kiwix.org](https://pwa.kiwix.org)_** in Firefox on Android. Read more after the demo:

_(be patient while the demo loads)_

<img src="Install-PWA_Firefox_Android.gif" width="360px" />

See also: [&ensp;[Install PWA and use OPFS in Chrome for Android](Demo-OPFS_Chrome_Android.md)&ensp;]

## Firefox can install PWAs on Android

**Firefox** supports installing PWAs on Android (but not on Desktop). This is worthwhile because the app runs in its own dedicated session and has
its own icon in your Home Screen.

## Accessing your ZIM files

As shown in the Demo, Firefox for Android works best when using the Origin Private File System. Loading larger archives from the user-visible File System
can be slow and glitchy on Firefox for Android, because the browser attempts to load the whole file into memory. So you are generally limited to files
that will fit in the OPFS.

Firefox currently limits the maximum size of the OPFS to ~10GB. On Chromium browsers, there is usually a much larger quota (limited only by the amount
of free space in your storage).

See also: [&ensp;[Install PWA and use OPFS in Chrome for Android](Demo-OPFS_Chrome_Android.md)&ensp;]
