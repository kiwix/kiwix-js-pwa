# How to add Kiwix JS PWA to the Edge sidebar

This is a new feature of the Microsoft Edge browser. Simply enable the sidebar in Settings, then go to https://pwa.kiwix.org, click the plus sign in
the sidebar, then "Add current page". More info after the demo.

![Add Kiwix PWA to Edge sidebar](Add-KiwixPWA-to-Edge-sidebar_demo.gif)

## For best results

You may need to adjust the width of the bar so that all the icons fit. You can also reduce the size of the UI in Configuration if you'd like a snugger
fit. Please note that the current icon is white, which means it is more visible if the Edge theme is set to "Dark". We are looking into adding an
outline to the favicon that is used in order to make it more visible in light mode.

Please note that due to a [Chromium bug](https://bugs.chromium.org/p/chromium/issues/detail?id=1368818#c13) (which also affects extensions),
folder picking is not available in the sidebar, so please simply pick the file you want to load rather than picking a folder of archives.
