# ZIM file-type icons

`16x16.png` … `256x256.png` are copies of the app's own `Square44x44Logo.altform-unplated_*`
assets in `../appx`: the outlined Kiwix, which reads on both light and dark backgrounds, and is
already what Windows shows for a ZIM (the APPX file association falls back to the app logo).
Copying them here rather than pointing the build at `../appx` keeps the file-type icon free to
diverge from the app icon, which is what a generic ZIM icon would eventually mean
(see the Kiwix-wide discussion of a single, app-agnostic ZIM icon).

Sizes follow what exists as real artwork, not what the icon theme could hold: 64 and 128 have no
unplated source, and scaling 256 down beats scaling 48 up.

`org.kiwix.desktop.x-zim.xml` is the shared-mime-info definition installed by the deb and rpm.
It deliberately declares no `<icon>`, so these PNGs are installed under the name derived from the
MIME type, `application-org.kiwix.desktop.x-zim`, which kiwix-desktop's own `<icon>` declaration
takes precedence over wherever both apps are installed. It names that same icon as its
`<generic-icon>`, because otherwise the default `application-x-generic` in the desktop's own theme
(Yaru on Ubuntu) is found before GTK ever reaches hicolor. See `build.deb.fpm` / `build.rpm.fpm`
in `package.json`.

`../zim.ico` and `../zim.icns` are generated from these PNGs with electron-builder's own icon
converter, for the Windows and macOS associations, which look them up by the `icon` field of each
entry in `build.win.fileAssociations` / `build.mac.fileAssociations`. To regenerate them, delete
both files first — the converter treats an existing one as an already-converted source and
returns it untouched. Then run this with Node from the repository root. It converts to each format
in turn, and copies the `icon.ico` or `icon.icns` the converter writes into its output directory
back here as `zim.ico` or `zim.icns`:

```js
const { convertIcon } = require('app-builder-lib/out/util/iconConverter.js');
const fs = require('fs');
(async () => {
    for (const format of ['ico', 'icns']) {
        const outDir = fs.mkdtempSync(require('os').tmpdir() + '/zim-');
        const { icons } = await convertIcon({ sources: ['electron_icons/zim'], fallbackSources: [], roots: [process.cwd()], format, outDir });
        fs.copyFileSync(icons[0].file, 'electron_icons/zim.' + format);
    }
})();
```
