# ZIM file-type icons

`24x24.png` … `512x512.png` are the ZIM document icons from
[kiwix-desktop](https://github.com/kiwix/kiwix-desktop) (`resources/icons/kiwix/<size>/org.kiwix.desktop.x-zim.png`),
reused unchanged so that a ZIM looks the same whichever Kiwix reader is installed. Both projects are GPLv3.

They are installed by the deb and rpm packages into the hicolor icon theme, under the icon name
`org.kiwix.desktop.x-zim` declared in `org.kiwix.desktop.x-zim.xml` (see `build.linux.fpm` in `package.json`).

`../zim.ico` and `../zim.icns` are the same artwork converted for the Windows and macOS file associations,
which look them up by the `icon` field of each entry in `build.win.fileAssociations` / `build.mac.fileAssociations`.
