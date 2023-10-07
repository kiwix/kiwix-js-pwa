# Installing the Kiwix JS PWA on Firefox for Android

Simply visit **_[pwa.kiwix.org](https://pwa.kiwix.org)_** in Firefox on Android. Read more after the demo:

<img src="Install-PWA_Firefox_Android.gif" width="360px" />

See also: [&ensp;[Install PWA and use OPFS in Chrome for Android](Demo-OPFS_Chrome_Android.md)&ensp;]

## Firefox can install PWAs on Android

**Firefox** supports installing PWAs on Android (but not on Desktop). This is useful because the app runs in its own dedicated session and has
its own icon in your Home Screen.

## Accessing your ZIM files

As shown in the Demo, Firefox for Android works best when using the Origin Private File System. Loading larger archives from the user-visible File System can be slow and glitchy on Firefox for Android, because the browser attempts to load the whole file into memory. So you are limited
to files that will fit in the OPFS.

On Chromium browsers, there is a larger quota for the OPFS.

See also: [&ensp;[Install PWA and use OPFS in Chrome for Android](Demo-OPFS_Chrome_Android.md)&ensp;]
