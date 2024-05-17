# Changelog

## In-progress release 3.2.7 / 3.2.8-Wikivoyage

* FEATURE: Wikipedia/Wikivoyage previews when hovering over, tabbing into or long-pressing a ZIM link
* FEATURE: Security dialogue on opening non-packaged ZIM for first time in ServiceWorker mode 
* ENHANCEMENT: Support building separate Windows 7 32bit Electron packages
* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2024-05`
* UPDATE: Reworked Wikivoyage custom landing page
* DOCUMENTATION: Add information about ZIM security to About
* DOCUMENTATION: Add information about Persistent Permissions to About
* FIX: Cached last page sometimes overwrites new ZIM landing page when switching from Restricted mode
* FIX: Bug which would reload the current ZIM archive if user accidentally initiated drag-drop
* FIX: No source verification for archives included in package
* FIX: Bug with placement of popovers which didn't take into account the font zoom factor
* FIX: Catch uncaught file verification exception
* FIX: Remove legacy "Scanning for archives" block
* REGRESSION: Fix inability to reload packaged archive in WikiMed and Wikivoyage apps
* DEV: Avoid incorrect and redundant uploads to Kiwix download server
* DEV: Fix build scripts
* DEV: Update publishing templates
* DEPENDENCIES: Bump Electron to 29.3.1 for 64bit builds
* DEPENDENCIES: Bump ejs to 3.1.10

## Release 3.2.1 / 3.2.2-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2024-04`
* UPDATE: Rename JQuery mode to Restricted mode
* FIX: Bug which forced all images to manual display in some non-Wikimedia ZIMs
* FIX: Go straight to article view on launch if persistent permissions are granted
* DEPENDENCIES: Bump Vite to v4.5.3

## Release 3.1.3 / 3.1.4-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2024-03`
* FIX: Reduce flash of incorrect style with Zimit-style ZIMs displayed with darkReader
* FIX: Issue with Create-DraftRelease script
* FIX: Issue preventing app from detecting new updates on GitHub in some circumstances
* FIX: Display of open/close marker with h5 and h6 headings in Wikimedia ZIMs
* INFO: Mention ARM architecture in in-app user info
* REGRESSION: Incompatibility with IE11 and Edge Mobile that prevented running on WM10
* DEV: Remove jQuery from app.js
* DEPENDENCIES: Bump Electron Builder to v24.13.3
* DEPENDENCIES: Bump Electron Updater to v6.2.1

## Release 3.0.5 / 3.0.6-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2024-02`
* ENHANCEMENT: Dark mode tri-state switch now turns on before turning to auto (should be less confusing)
* ENHANCEMENT: Added ability to set the localhost server port in the UI of the Electron app
* BUILD: Support Windows on ARM and Linux on ARM for the Electron app
* FIX: Broken "unclicking" of config and about buttons and return-to-article link
* FIX: Ensure legacy archive warning and other content warnings remain displayed until dismissed
* KNOWN ISSUE: Turning DarkReader on or off may not take effect until the NEXT article is loaded
* FIX: Use of standard dark and invert styles with any archive (but usually DarkReader is best for Zimit)
* FIX: Add preview link for all archives that can be displayed in library.kiwix.org
* FIX: (partial) Switching themes no longer attempt to jump back to the article immediately
* REGRESSION: Failure to open new windows in UWP app (desktop)
* DEV: Updates to buid script
* DEV: Deprecate 32bit deb packages for packaged apps
* DEV: Warn instead of throwing if the ZIM `minorVersion` is greater than 2
* DEV: Laumch wingetcreate correctly from PowerShell
* DEPENDENCIES: ViteJS updated to v4.5.2

## Release 2.9.5 / 2.9.6-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2024-01`
* BUILD: Support Windows on ARM and Linux on ARM for the Electron app
* ENHANCEMENT: Added ability to set the localhost server port in the UI of the Electron app
* FIX: Pinch-to-zoom now works in the Electron app
* FIX: Blank landing page after opening article in new window or tab 
* FIX: Finding path of packaged archive with new Electron app architecture
* FIX: Opening article in new window or tab for non-Zimit archives
* FIX: Detection of apps installed from the Microsoft Store
* FIX: Accidental disabling of assetsCache with non-Zimit ZIMS
* FIX: PDFs from the ZIM now have a workaround for Android
* FIX: Resolved issue with PDFs in Nautilus ZIMs failing to download
* DEV: Fix incrementation of Microsoft Store apps at build time
* DEPENDENCIES: Electron-builder updated to v24.9.1

## Release 2.8.7 / 2.8.8-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2023-12`
* FEATURE: Support multiple instances of the PWA or browser tabs/windows with different ZIMs loaded in each
* ENHANCEMENT: Option to download viewed assets when searching by URL (e.g. C/.*interesting_asset.js)
* ENHANCEMENT: On non-scrollable pages, remove navbars with Ctrl/Cmd + UpArrow/DownArrow, long swipe or mousewheel
* ENHANCEMENT: Auto-dismiss (fade out) Zimit and active content warnings on scroll
* INFO: Provide info to user about how to change behaviour of opening external links in tab or window
* FIX: Critical bug that prevented scrolling of search results
* FIX: Critical bug causing a boot loop when the app is in JQuery mode and SW cannot be registered
* FIX: Incorrect sizing of article area in UWP app
* FIX: Failure to resize Configuration in rare circumstances
* FIX: Accidental disabling of assetsCache when user loads a non-Zimit-based archive
* DEV: Various updates to demos and readme
* DEV: Fix quote detection in rollup build chain
* DEV: Changed favicon from white to black with white border
* DEV: New, more robust, way to wake up and initialize the Service Worker when needed
* DEV: Developer options now provided to use libzim for reading archive contents
* DEV: Updated, standard method for bundling JQuery
* DEPENDENCIES: RollupJS updated to v3.5.0
* DEPENDENCIES: Updated WebpHero to v0.0.2
* DEPENDENCIES: Updated DarkReader to v4.9.73
* DEPENDENCIES: Javascript-libzim updated to v0.6

## Release 2.7.5 / 2.7.6-Wikivoyage
* FEATURE: Rework file system access and support Origin Private File System (OPFS)
* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2023-10`
* UPDATE: Electron version bumped to 22.3.25
* ENHANCEMENT: Autoload and display of all archives in OPFS on app launch, no permission prompts!
* ENHANCEMENT: Last selected archive (and optionally article) auto-loaded on app launch if in OPFS
* ENHANCEMENT: Import existing archives from anywhere on device into the OPFS easily with file picker
* ENHANCEMENT: New file management facility for deleting, and (in some contexts) exporting OPFS archives
* ENHANCEMENT: Option to download archives directly into the OPFS, without downloading first to user-visible FS
* ENHANCEMENT: Option to download archives direclty into any folder pickable with the File System Access API 
* ENHANCEMENT: Full-text search enabled by default on Android for archives in OPFS
* ENHANCEMENT: Pick multiple archives at once and switch easily between them, even on legacy systems
* ENHANCEMENT: New Operations Panel to show download progress in PWA and Electron apps
* ENHANCEMENT: Add indicative colourization to archive list when using OPFS
* ENHANCEMENT: Add a spinner for adding and direct download of files to OPFS
* ENHANCEMENT: After failure to import or download to OPFS, delete file stub(s)
* INFO: Inform user that OPFS files are preserved on app reset
* INFO: More informative message about import/download error in Safari
* FIX: When using locally cached CSS, the details/summary tags are restored where missing from ZIM
* FIX: Display of open-close markers for headers is now as expected in mobile css (suppressed in desktop css)
* FIX: Dropdowns for languages and subjects in some download library directories
* FIX: Ensure archive list is displayed on open in browsers supporting the webkitdirectory property
* FIX: Empty archive list when OPFS is deactivated
* FIX: Make sure spinner doesn't block the UI
* FIX: Ensure some HTML and entities do not appear in constructed article titles
* FIX: Don't show spinner on click in cases of anchor or javascript links
* FIX: Cancel OPFS delete if export selected and vice versa
* FIX: Exception preventing display of legacy archive content in jQuery mode
* FIX: Failure to display ZIM Archive Index when typing space in some circumstances
* FIX: Partially fixed broken "unclick" of Configure button on touchscreen devices
* REGRESSION: Fixed failure to refresh full-screen state when clicking in-app in SW mode
* REGRESSION: Fixed rogue error message when using File Handling API
* DEV: Name of repository changed to kiwix-js-pwa
* DEV: Add facility for adding ZIM metadata to the ZIMArchive object

## Release 2.6.7 / 2.6.8-Wikivoyage

* FEATURE: Full-text search enabled by default on iOS 15+
* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2023-09`
* UPDATE: Electron version bumped to 22.3.21
* ENHANCEMENT: Avoid double loading of WebP Polyfill when present in ZIM
* REGRESSION: Fixed loss of ability to pick ZIM archives in latest Chromium on Android
* FIX: Avoid duplication of title in wider range of ZIMs
* FIX: Avoid hyperlinking math fallback images to high-res Wikimedia versions
* FIX: More broken Linux icons
* DEV: Added clear documentation to the Create-DraftRelease.ps1 script
* DEV: Remove more unnecessary JQuery from the app
* DEV: Disable appCache by default if developing with the Vite server

## Release 2.6.1 / 2.6.2-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2023-07`
* FEATURE: Ability to pick a folder of ZIM archives in nearly all apps and frameworks supporting the Webkitdirectory API
* ENHANCEMENT: Dragged and dropped files, including split files, can now be re-opened automatically in Electron and NWJS apps
* ENHANCEMENT: Microsoft Store app now supports full-text search for users with 64bit Windows
* ENHANCEMENT: Restored the ability not to display images in ServiceWorker Mode in non-Zimit ZIMs
* ENHANCEMENT: Restored lazy-loading of images on most landing pages (improves Android experience with image-heavy landing pages)
* ENHANCEMENT: Top toolbar now resized correctly with Window Controls Overlay in installed PWA on macOS and Windows
* ENHANCEMENT: When using Window Controls Overlay, app now has a draggable area (left of Kiwix icon)
* REGRESSION: Fixed loss of ability to access custom ZIMs from download library
* REGRESSION: Work around missing titles in English-language Wikivoyage scrapes since 2023-07
* FIX: Conflict between manual image display and hyperlinking images to high-res Wikimedia versions
* FIX: Broken Kiwix icon for Linux app packages
* FIX: Miscellaneous small bugfixes and typos
* DEV: A lot of normalization of coding style using ESLint

## Release 2.5.1 / 2.5.2-Wikivoyage

Note: v2.5.1-Wikivoyage is the legacy UWP app; v2.5.2-Wikivoyage is for the Electron apps

* ENHANCEMENT: Provide more gradual screen width transition with max page width auto setting
* ENHANCEMENT: The Kiwix PWA can now be added as a Side Panel app in Edge (NB folder picking does not work in this configuration)
* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2023-06`
* UPDATE: Troubleshooting instructions for installing on Debian on the Releases page
* DEV: Re-enable use of wingetcreate with v2.6.0 when publishing to winget repository
* FIX: Missing commit ID in Windows nightly builds
* FIX: Add BOM to production bundle when building UWP app (store requirement)
* FIX: Bug that loaded a blank screen when asking user whether to open external links
* BUILD: New appx version of Kiwix JS Wikivoyage, based on Electron, now available from Store and GitHub Releases
* BUILD: Allow producing signed or unsigned versions of appx, and compile to appxbundle
* BUILD: Option to build artefacts only for testing

## Release 2.4.9-Wikivoyage

* FEATURE: PWA app is now smaller and loads faster due to minification with modern build process
* ENHANCEMENT: New modular system and bundler ensures smaller and more stable memory management
* ENHANCEMENT: Add a Promise queue to prevent overlapping alert dialogue boxes
* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2023-05`
* UPDATE: Renamed breakout link feature to "Download or open current article"
* UPDATE: Reduce image fade-in transition time
* UPDATE: Add a limit to the number of dialogue boxes that can be queued up
* UPDATE: Make one-time hidden content warning less intrusive
* DEV: Removed RequireJS and migrated app to ES6 native modules
* DEV: Provide clearer colouring when appCache is disabled for development
* DEV: Use rollup.js and Babel to build compatible versions of the app for all supported browsers
* DEV: Provide minified and unminified versions of the bundled app 
* DEV: Added ability to publish a distribution of the app to GitHub Pages for development
* DEV: Add a basic Vite.js server configuration
* FIX: Make upgrade notification persistent in Electron app
* FIX: Several UI issues with toolbars and downloads
* FIX: Bug which prevented UWP / Edge Legacy app from reading articles with certain options deselected
* FIX: Add a better algorithm for Kiwix asset detection
* FIX: Add workarounds for sandboxed iframe: load all https: and pdf content in a new window or tab
* DEPENDENCY: Update jQuery to 3.7.0, while removing its use in a number of places
* REGRESSION: Fix regression with (former) breakout link feature
* REGRESSION: Restore dialogue box animations that were removed with removal of jQuery
* REGRESSION: Restore Table of Contents functionality disabled with removal of jQuery
* REGRESSION: Restore ability to close several in-page alerts after removal of jQuery
* REGRESSION: Restore automatic updating of appCache

## Release 2.4.6-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2023-04`
* FEATURE: Support Full Screen (all browsers) and rotation lock (primarily intended for mobile)
* FEATURE: Significant speed-up of access to Wikimedia archives with option to ignore unneeded JS files
* ENHANCEMENT: Include broader pseudo-case-insensitive search in title search
* ENHANCEMENT: Use screen width more efficiently in SW mode (with Remove max page width option)
* SECURITY: Added sandbox attribute to iframe to block top-level navigation and attempts by scripts to "phone home" 
* SECURITY: Add iframe referrer policy 'no-referrer'
* SECURITY: Strengthen Content Security Policy via response headers and meta http-equiv
* FIX: Return to article links were missing in ServiceWorker mode
* FIX: Make upgrade notification persistent in Electron app
* FIX: Several UI issues with toolbars and downloads
* UPDATE: Streamline the splashscreen display and make it dynamic
* UPDATE: Add more complete language support to the Download Library languages dropdown
* UPDATE: JavaWScript Libzim reader updated to v0.2
* FIX: Missing full-text search cancellation which caused race condition in search 

## Release 2.3.7-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2023-02`
* UPDATE: Longstanding upstream bug preventing update of Wikivoyage articles now resolved
* ENHANCEMENT: Provide indication of archive download progress in Electron app
* ENHANCEMENT: Avoid opening blank window when downloading archive in Electron/NWJS
* ENHANCEMENT: Provide troubleshooting option to disable drag-and-drop
* ENHANCEMENT: Tidier Configuration layout with collapsible options
* ENHANCEMENT: Streamline access to legacy file picker when File System Access API unavailable
* ENHANCEMENT: The PWA now works on iOS devices (iPhone/iPad) in Safari and can be added to home screen
* ENHANCEMENT: App now intelligently sets the initial window opening mode (tab or window)
* UPDATE: Neater display of file picking instructions, hiding them when no longer needed
* FIX: Removed orientation key that prevented proper setting of orientation in some contexts
* FIX: Improved detection of Wikimedia ZIMs for seleciton of printing stylesheet
* FIX: Several issues affecting printing (Zimit archives in Chromium, failure to detect selected options in Safari, etc.)
* FIX: Logic for checking GitHub update server 
* FIX: Legacy file picker is now able to pick ZIM archives on iOS devices 
* FIX: Block a wider range of analytics in Zimit archives
* FIX: Processing of data-srcset blocks in Zimit archives

## Release 2.3.2-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2023-01`
* ENHANCEMENT: Check for update to PWA and notify user shortly after startup of the app
* ENHANCEMENT: New "auto" setting for display of hidden navboxes and tables in Wikimedia ZIMs 
* ENHANCEMENT: Detect historical ZIM types and add advice on using jQuery mode to read them
* ENHANCEMENT: Refresh and Reset buttons provided near the top of Configuration in case of app freeze
* DEV: Added developer option to force use of libzim W/ASM decoding of full-text index
* FIX: Libzim loading error in Electron app with large ZIM archives due to race condition
* FIX: Prevent race condition between reactivation of Service Worker and loading of NODEFS
* FIX: Failure to load last-visited article in Electron app
* FIX: Electron file and folder picking methods
* FIX: In UWP app, request to launch PWA is now shown after upgrade splash screen
* FIX: Allow URL-based search to complete before launching full-text search
* FIX: Critical bug preventing display of legacy file picker
* FIX: Display of some images on Wikivoyage landing page
* BUILD: Build 64bit and 32bit packages separately to avoid race condition in electron-builder
* BUILD: All Electron apps other than 32bit Linux are now built with latest Electron

## Release 2.2.90-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2022-12`
* ENHANCEMENT: Run full-text and title search in parallel for faster return of results
* BUGFIX: Fix libzim loading error in Electron app with large ZIM archives due to race condition
* FIX: Prevent Electron app from rebooting on every load to reactivate the Service Worker
* FIX: Add BOM to new JS files to conform to Microsoft Store requirements
* FIX: Exception caused by site.js script included in Wikimedia archives
* DEV: Added developer option to force use of libzim W/ASM decoding of full-text index
* FIX: Critical startup bug which prevented opening of some packaged archives
* FIX: When dark mode is set to auto, do not use darkReader for Wikimedia ZIMs

## Release 2.2.7-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2022-11`
* ENHANCEMENT: Experimental use of libzim WASM port to read Full Text index (PWA only for now)
* ENHANCEMENT: Information added to API panel to show status of Full Text index
* ENHANCEMENT: Experimental option to use DarkReader plugin (SW mode only)
* ENHANCEMENT: Enable ServiceWorker mode as the default (and deprecate JQuery mode) 
* ENHANCEMENT: Display media download alert only when the medium is fetched from the ZIM
* ENHANCEMENT: Better suggestions for mirrors when Library server does not provide mirror info
* ENHANCEMENT: Building Electron app on GitHub actions now downloads the latest packaged archive before cloud-building
* CLEANUP: Removal of several JQuery functions, replaced with native DOM methods 
* CLEANUP: Remove some unused functions
* FIX: A number of glitches with standard and inverted dark themes
* FIX: Crash in UWP app when switching between modes if there are too many archives in a loaded directory
* FIX: Deal with Zimit links correctly when link handling is disabled
* FIX: Test both the encoded and decoded path for Zimit hyperlinks, due to inconsistencies in format
* FIX: Infinite loop when hyperlinks are not being captured by window opener
* FIX: Failure to display active content warning in some instances
* FIX: Regression preventing UWP app from remaining in ServiceWorker mode
* FIX: Failure to confirm with user before launching SW mode in UWP app
* FIX: Bug which prevented reload of last visited page on re-launch of app

## Release 2.1.9-Wikivoyage

* UPDATE: Streamline polling of spinner and messaging
* ENHANCEMENT: Clearer signposting of Archive Index vs URL Index
* ENHANCEMENT: Show an alert to user if main page is not an article
* ENHANCEMENT: Better suggestions for mirrors when Library server does not provide mirror info
* WORKAROUND: Assets with erroneous MIME types were misrecognized as articles (blocking reload of some articles)
* FIX: Downloading of non-mirrored content in the Library
* FIX: Wikivoyage package and install icons
* FIX: Detect more ZIMs for active content warning
* FIX: Provide instructions for showing URL Index in active content warning
* FIX: Download of files with very long filenames
* FIX: Bug causing incomplete loading of images on image-heavy landing pages
* FIX: Display of blue placeholders for manual image extraction in SW mode
* FIX: Selection of languages in Library
* FIX: Display of some irregularly formatted filenames in Library
* FIX: Ensure spinner never shows for more than 3 seconds
* FIX: Regression preventing UWP app from remaining in Service Worker mode
* FIX: Failure to confirm with user before launching SW mode in UWP app

## Release 2.1.5-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2022-08`
* UPDATE: Packages are now signed with new Kiwix coding certificate
* UPDATE: BitTorrent files are now displayed before magnet links in the download library
* UPDATE: Provide more complete documentation on GitHub
* ENHANCEMENT: Basic Zimit file reading in IE11
* FIX: Downloading of non-mirrored content in the Library
* FIX: Recognize XHTML documents and applications in Zimit ZIMs and treat as HTML
* FIX: Correct location of relative links on Zimit landing pages
* FIX: Add more asset types to Type 1 C-namespace Zimit support
* FIX: Support reading of Zimit archives using new Type 1 C-namespace ZIM format
* FIX: Searching for namespaces with Type 1 Zimit ZIMs
* FIX: Hyperlink transformations for Type 1 Zimit ZIMs
* FIX: Package and install icons for WikiMed and Wikivoyage
* FIX: Bug which caused app to hang when encountering URLs larger than 2KB in length

## Release 2.0.9-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2022-07`
* ENHANCEMENT: System back button in UWP app no longer exits the app
* ENHANCEMENT: Hyperlink the currently loaded archive so that user can re-open it easily with a click
* ENHANCEMENT: Make archive links combo box scrollable
* ENHANCEMENT: Make buttons more visible in dark mode
* ENHANCEMENT: Provide magnet torrent links in Archive Library
* ENHANCEMENT: Provide link to preview of live ZIM archive on library.kiwix.org
* FIX: Do not redirect to landing page if requested article is not found
* FIX: Prevent app entering an anomalous state if launch of Service Worker mode fails
* FIX: File handling API (works with latest Chrome, and with Edge Beta)
* FIX: Distinguish between Electron and NWJS when reporting app type to UI

## Release 2.0.2-Wikivoyage

* FEATURE: Optionally check for app updates and inform user of availability
* FEATURE: Search for any asset in any ZIM by prefixing namespace
* ENHANCEMENT: Option to warn before opening external links
* ENHANCEMENT: Reduce delay between image loads when lazy-loading images (Wikimedia ZIMs)
* ENHANCEMENT: Intelligently auto-switch image manipulation setting if supported by ZIM type
* ENHANCEMENT: Intelligently turn off dark theme if ZIM does not support it
* ENHANCEMENT: Ensure user clears the cache when switching to SW mode while a Zimit ZIM is loaded
* ENHANCEMENT: Prevent expensive RegExp processing for irrelevant ZIM types
* ENHANCEMENT: Made PWA manifest compatible with Chromium installability criteria
* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2022-06`
* UPDATE: Refresh Kiwix icons
* UPDATE: Hyperlinking of images to high-res versions is now off by default
* FIX: Searching for assets in url index now properly shows the url instead of title
* FIX: System alert dialogue box now handles keyboard events
* FIX: Add some failsafe code to hide spinner if it runs too long (does not handle app crashes) 
* FIX: Bug that caused repeating images when hyperlinking images to online high-res versions
* FIX: Remove lazy image loading system if detected
* FIX: Errors with parsing and display of archive links in download library
* FIX: Adjustment to max page width restrictions is now applied on resize

## Release 1.9.9-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2022-05`
* FEATURE: Experimental support for reading Zimit ZIM archives (relevant for base app)
* FIX: Style of thumbinner Wikimedia images adjusted so that images are back in their original position
* FIX: Links to PDF data are now recognized by MIME type and downloaded as if they were files
* FIX: Transition away from testing file extensions for caching strategy
* FIX: Add any missing file extension to downloadable files
* FIX: Exception when reloading the last selected archive on certain platforms

## Release 1.9.7-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2022-04`
* BUILD: Nightly builds of main app are now uploaded to a new server (with sftp instead of ssh)
* BUILD: Deploy PWA image on a k8s cluster
* BUILD: PWA images are now uploaded to ghcr.io instead of Docker Hub

## Release 1.9.4-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2022-03`
* FEATURE: Option to hyperlink images in Wikimedia ZIMs to the online File for the image
* ENHANCEMENT: Electron app now uses File System Access API except for initial loading of packaged archive
* DEV: Provided instructions on how to split a ZIM archive using WSL
* FIX: App now (optionally) remembers the last viewed article for split ZIM archives
* FIX: Electron and UWP apps now auto-load split ZIM archives
* FIX: Failure to recognize landing page when retrieved from history or cache
* DEV: Automatic building of Electron app now enabled via GitHub Actions
* FIX: Improvement to independent browsing of windows in UWP app in SW mode
* FIX: Stabilize page loading when assets are missing (in SW mode)
* FIX: Styling of image-based landing pages

## Release 1.9.1-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2022-02`
* ENHANCEMENT: Better feedback to user during slow ZIM archive loading
* ENHANCEMENT: Included favicons at various resolutions
* ENHANCEMENT: App now uses Bootstrap asynchronous dialogue boxes for modal alert and confirm
* DEV: Developer option to bypass appCache
* DEV: Window location information now shown in API panel
* FIX: Bug that would sometimes cause a blank screen in Service Worker mode on slow devices
* FIX: Loading of articles that have question marks or hashes in the title
* FIX: Incorrect attempt to register Service Worker in XP version of NWJS app causing fatal crash on startup
* FIX: Random button now warns user if archive is not loaded
* FIX: Race condition loading deocmpressors which caused failure in some rare contexts with the file:// protocol

## Release 1.8.7-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2022-01`
* ENHANCEMENT: Service Worker mode is now the default in contexts or frameworks that natively support it
* ENHANCEMENT: Option to reset app to defaults in Expert settings
* ENHANCEMENT: Assets cache and app cache are now separated, so assets persist after update
* ENHANCEMENT: New persistent caching of ZIM assets that are not provided in file system singinficantly improves performance
* ENHANCEMENT: Automatically choose best available caching technology: Cache API, IndexedDB, Local Storage or memory
* ENHANCEMENT: New Cache API info panel in Configuration, and option to stop using and empty the cache
* FIX: Set headers properly when caching Fetch responses in JQuery mode
* FIX: Regression whereby blue image placeholders were not shown in jQuery mode when user turns off image display
* FIX: Bug whereby upgrade alert was triggered by caches from other apps on the same domain
* FIX: Regression with Electron file handling causing previously picked archive to be forgotten
* FIX: Fatal Electron error on startup if packaged archive cannot be found
* FIX: NWJS file handling with legacy file picker (for XP and Vista builds)

## Release 1.8.3-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2021-12`
* UPDATE: App can now use the latest Electron release and APIs
* ENHANCEMENT: Scrollbars are now styled (with darker colours) in dark mode (in Chromium frameworks)
* ENHANCEMENT: More app files are precached in the PWA for better offline experience
* ENHANCEMENT: Hardware back and forward buttons on mouse now work with UWP app (natively supported in other contexts)
* FIX: Prevent most app crashes when switching to SW mode in UWP app
* FIX: More intelligent relocation of hatnote and noexcerpt blocks
* FIX: UI bug when using the UWP app with a secondary display (via Config option)
* FIX: Stylesheet errors with sistersite boxes

## Release 1.7.9-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2021-11`
* EXPERIMENTAL: Added option to display hidden block elements, prinicipally for Wikimedia ZIMs
* ENHANCEMENT: Electron version of app can now read contents of directories
* ENHANCEMENT: With display hidden elements opetion, force display of zero-width images also
* ENHANCEMENT: Allow more time between clicks to register a double-right-click
* FIX REGRESSION: Prevent incorrect parsing of map markers when image manipulation is on in SW mode
* FIX REGRESSION: Closing all sections (by deselecting "Open all sections") now works again in jQuery mode
* BACKEND: Use a safer way of determining the ZIM name and type

## Release 1.7.6-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2021-10`
* ENHANCEMENT: The app should now show dynamic content on landing pages in YouTube-based ZIMs (SW mode)
* ENHANCEMENT: Option for map pins to open OpenStreetMap instead of Windows Maps App (mostly for Wikivoyage)
* ENHANCEMENT: Select map type automatically: Maps App for Windows, OSM for Linux or other
* ENHANCEMENT: Use smaller pins for Wikipedia pages vs Wikivoyage pages
* DEPRECATED: Disabled *indpenedent* resizing of content in iframe with touch: too slow, and worked only in Chromium
* FIX: Video playback controls are now shown in Khan Acadeny ZIMs (and others based on YouTube)
* FIX: Bug relocating hatnotes which moved extraneous text blocks
* FIX: Image rendering bug with substitute landing pages
* FIX: Fatal error loading the PWA in some circumstances
* FIX: Data URIs with WebP images can now be rendered in old browsers
* FIX: Style issues and rendering of map pins in German Wikimedia ZIMs
* FIX: Error with offline Cache that prevented PWA from working fully offline
* FIX: Prevented the NWJS app for Windows XP from attempting to switch to SW mode (which doesn't work)

## Release 1.7.3-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2021-09`
* UPDATE: New option to change right click to double right click for opening new window or tab
* ENHANCEMENT: Provide option to allow image manipulation (saving to disk or opening in new tab), with workaround for UWP
* ENHANCEMENT: Provide contextual warnings for features that do not work well with dynamic content
* ENHANCEMENT: Added help section in About concerning link handling, dynamic content, new windows, etc.
* ENHANCEMENT: Verbose tooltips provided for several options in Configuration
* ENHANCEMENT: Usage instructions more clearly highlighted on first run
* FIX: Issue preventing correct parsing of ZIM archive path in some contexts in SW mode
* FIX: Some app crashes when switching the UWP app to SW mode
* FIX: Printing in SW mode (load all images correctly before printing)
* FIX: Restoring DOM after printing in SW mode

## Release 1.6.2-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2021-08`
* FEATURE: New dropdown in Download Library allows filtering the list of archives by subject (for some ZIM types)
* ENHANCEMENT: Sorting the Download Library list by clicking on the Size / Last modified / Name headers
* ENHANCEMENT: Significant speed-up by using native Promise API, or modern polyfill where needed
* ENHANCEMENT: Decompressors now loaded as fast binary WASM modules if the brower supports WebAssembly
* ENNHNCEMENT: Added more diagnostic APIs to the API panel in Configuration
* ENHANCEMENT: Added refresh button for picked folder in Configuration (UWP or File System Access API)
* FIX: Issues with toolbars getting stuck on after searching for text in article
* FIX: Better replication of infobox mobile and desktop styles
* FIX: More displaced hatnotes corrected
* FIX: Style injection code that would (rarely) cause an exception on some ZIM types

## Release 1.5.0-Wikivoyage

* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2021-07`
* FEATURE: (Experimental) PWA is paritcipating in File Handling API origin trial
* FEATURE: Search with wildcards `.*`, `.+` or regex syntax `(?:my_regular_expression)`
* ENHANCEMENT: Improve zooming and re-flowing the article contents in browsers that support the `zoom` style property
* ENHANCEMENT: Added full usage/syntax notes for title search and Alphabetical Title Index
* ENHANCEMENT: Include `h4` headings in Table of Contents
* ENHANCEMENT: Report number of titles scanned for long title searches
* ENHANCEMENT: Add a Content Security Policy preventing contents of a page from connecting to online resources
* FIX: Critical bug where article is not unhidden in time on slow systems in jQuery mode
* FIX: Crash in UWP app after updating a ZIM archive
* FIX: Improve handover from local code to PWA code to prevent rogue error message
* FIX: Improve page composition timing for non-MS browsers
* FIX: Bug which failed to detect images correctly in a new tab
* FIX: Touch-zoom of contents of iframe no longer blanks part of the display
* FIX: Broken zoom of contents of iframe (with UI buttons) in Internet Explorer
* FIX: Bug setting up backlinks which caused some pages not to load
* FIX: Unhandled exception when cite ref was not found

## Release 1.4.0-Wikivoyage

* ENHANCEMENT: Pre-calculate position and size of article namespace in legacy ZIMs (speeds up binary search)
* ENHANCEMENT: New option to move navigation buttons to the top toolbar
* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2021-06`
* UPDATE: System dark/light mode now used for "auto" setting in modern browsers (as well as UWP)
* UPDATE: KaTeX to v0.13.11
* FIX: Double-clicking on archive failed to launch it in UWP app running in SW mode
* FIX: Hide jump in page position during article load in Service Worker mode
* FIX: Adjusted timing of hiding and showing the article during page composition
* FIX: Hover and active colours on buttons
* FIX: Intermittent failure to compose page in UWP app on mobile
* FIX: Reposition multiple displaced hatnotes
* FIX: Click on document reloads article when open new window feature is off
* FIX: Bug which prevented auto launch of packaged file on first install
* FIX: Failure to apply dark theme to articles with no CSS
* FIX: Bug affecting middle-click when opening a new window or tab
* FIX: Bug which hid the file selectors when the app could not get a handle on a file or directory
* FIX: Bug preventing touch navigation
* FIX: Issue preventing the article window from receiving focus for keyboard input

## Release 1.3.0-Wikivoyage

* FEATURE: Open a new browsable tab or window with right-click, long-press, ctrl-click, middle-click
* UPDATE: Packaged archive updated to `wikivoyage_en_all_maxi_2021-05`
* UPDATE: Location of cached styles tweaked to reflect latest location in ZIM archives
* UPDATE: Cached main pages for WikiMed and Wikivoyage updated and used by vanilla app
* ENHANCEMENT: PWA now adapts if it was launched from a basic packaged app
* ENHANCEMENT: Alt-left or Ctrl-left (and same for right key) can now be used for navigation
* FIX: Prevent flash between page loads by adapting empty screen to the selected theme color
* FIX: Crash on upgrade of ZIM archive in some contexts
* FIX: Subtitle dislplay on videos
* FIX: Download of media and subtitles
* FIX: Display of list-based home pages
* FIX: Properly define width of infoboxes in Wikimedia Destop style

## Release 1.2.4-Wikivoyage

* UPDATE: Packaged archive updated to wikivoyage_en_all_maxi_2021-04
* ENHANCEMENT: Support v1 article index in no-namespace ZIM archives
* ENHANECMENT: Detect and correct erroneous hard-coded sytling of navboxes in recent ZIMs
* FIX: Correct width of infoboxes in Wikipedia Desktop style
* FIX: Failure to recognize mouse click on title index entry
* FIX: Issue preventing proper relocation of infobox when transforming to desktop style

## Release 1.2.3-Wikivoyage

* UPDATE: Included ZIM updated to `wikivoyage_en_all_maxi_2021-01.zim`
* ENHANCEMENT: Enable Service Worker mode in UWP app
* ENHANCEMENT: New domain pwa.kiwix.org for the PWA/UWP app
* ENHANCEMENT: If app is running as a PWA, its identity is changed to Kiwix JS PWA
* ENHANCEMENT: Use a list of customized start pages even if the app is generic 
* UPDATE: Preliminary support for ZIM archives with no namespace
* UPDATE: Revised Privacy Policy to reflect PWA usage
* UPDATE: Minor update to improve handover between local and PWA code
* UPDATE: Better messaging around 'failure' to load SW mode (not a real failure)
* FIX: Calculation of appRoot directory
* FIX: Display of masonry tiles in JQuery mode with latest ZIMs
* FIX: Map markers not showing in Service Worker mode
* FIX: Implement internal app:// links for app-based assets
* FIX: Race condition in handover to PWA code
* FIX: Faulty permalinks

## Release 1.1.4 Wikivoyage

* UPDATE: Included ZIM updated to `wikivoyage_en_all_maxi_2021-01.zim`
* UPDATE: More consistent install prompt display in Configuration (for PWA)
* ENHANCEMENT: Provide more robust upgrade process for PWAs, including notification banner
* FIX: Inconsistent use of Settings Store during app initialization
* FIX: Disable HTTP cache when pre-caching upgraded app files
* FIX: Switching to jQuery mode in the PWA app no longer prevents the app working offline
* FIX: Display of masonry-style landing pages in SW mode
* FIX: Delete accidentally created Indexed Databases with wrong filename on startup (where possible)
* FIX: Provide explicit Content Security Policy headers to reduce or eliminate CORS errors in SW mode
* FIX: Broken manual display of images in SW mode
* FIX: Broken "Open all headings" option in SW mode
* FIX: Printing in SW mode
* META: Create-DraftRelease PowerShell script supports automatic creation of GitHub releases for more versions of the app

## Release 1.1.3 Wikivoyage

* UPDATE: Included ZIM updated to `wikivoyage_en_all_maxi_2020-12.zim`
* UPDATE: Support new location of mobile and desktop styles in Wikimedia ZIMs
* UPDATE: Upgrade Settings store to use localStorage over cookies where available
* ENHANCEMENT: Enable use of Native File System with NWJS
* REGRESSION: Manual extraction of images reverted to one-by-one to prevent errors with WebP batch decoding
* FIX: Styling of index-based landing pages
* FIX: Bugs with file picking in Native FS
* FIX: Critical error on some new Wikipedia articles containing equations

## Release 1.1.0 Wikivoyage

* UPDATE: App is no longer in beta!
* UPDATE: Packaged ZIM updated to `wikivoyage_en_all_maxi_2020-11.zim`
* UPDATE: App now supports newest archives encoded with ZSTD compression
* UPDATE: WebP support (via polyfill) for older browsers including Windows Mobile 
* ENHANCEMENT: Decompression speed gains with ZSTD
* ENHANCEMENT: Allow use of keyboard to select archive from archive list
* ENHANCEMENT: Option to display articles with all sections open or closed
* ENHANCEMENT: Use Native File System API in PWA version
* ENHANCEMENT: Better error reporting in console log
* ENHANCEMENT: Improved block cache and faster conversion of file slice to blob
* FIX: Prevent erroneous display of Active Content Warning with ZSTD archives
* FIX: Reduce some cross-origin errors
* FIX: Prevent archive list from jumping to wrong archive on click
* FIX: Critical error on load if packaged archive name has changed
* FIX: Download links are no longer erroneously cached by the Service Worker
* DEPRECATED: Scrolling information for new users

## Release 0.9.9.992 Wikivoyage (beta)

* UPDATE: August 2020 update of Wikivoyage ZIM archive to `wikivoyage_en_all_maxi_2020-08.zim`
* FIX: Critical error on load if packaged archive name has changeds
* FIX: Prevent extraneous titles appearing in search
* FIX: Broken drag-and-drop
* FIX: Bug with construction of backlinks preventing load of some Wikipedia articles
* FIX: Calculate path of breakout icon correctly in SW mode
* ENHANCEMENT: Use Native File System API in PWA version
* ENHANCEMENT: Various fixes to the Electron app
* ENHANCEMENT: Better error reporting in console log

## Release 0.9.9.991 Wikivoyage (beta)

* UPDATE: June 2020 update of Wikivoyage ZIM archive to wikivoyage_en_all_maxi_2020-06.zim
* UPDATE: Update Q Promise support to v1.5.1
* ENHANCEMENT: Major upgrade to the title-search algorithm: search is now near-case-insensitive
* ENHANCEMENT: Make app compatible with Electron / NWJS as a packaged app
* ENHANCEMENT: Attempt to make app a little more usable on Android browsers
* FIX: Bug preventing all Kiwix apps accessing latest ZIMs (incorrect method of reading MIME type list)
* FIX: Failure to load landing page when backing into it from history.back
* FIX: Incorrect hiding of toolbars after using in-page search

## Release 0.9.9.97 Wikivoyage (beta)

* UPDATE: February 2020 update of Wikivoyage ZIM archive to wikivoyage_en_all_maxi_2020-02.zim
* UPDATE: Added missing stylesheets for cache
* ENHANCEMENT: Intuitive toolbar hiding/showing on scroll down/up
* ENHANCEMENT: Added block cache to speed up search considerably
* ENHANCEMENT: Provide option to set number of results to find when searching
* ENHANCEMENT: Provide app install experience for PWA
* FIX: Search results can now be scrolled by touch on Windows 10 tablets
* FIX: Corrected height of search results window so content is not hidden under footer
* FIX: Prevent ugly jumping of iframe on new article load
* FIX: Allow use of special characters in article search
* FIX: Remove broken links to deprecated portable versions of archives

## Release 0.9.9.96 Wikivoyage (beta)

* FIX: Broken display of Kiwix download library
* FIX: Broken display of MathML when there are no images in the document
* FIX: Search bar always remains on-screen if selected (in non-mobile contexts)
* FIX: All images above the fold are now loaded (async timing of image scanning was premature)
* FIX: Math typeset by KaTeX is rendered better when there are mbox statements (fbox is used instead)
* FIX: Display-style maths SVGs are now correctly inverted in dark mode
* FIX: Standard dark-mode SVGs in infoboxes and elsewhere are now displayed correctly without inversion
* FIX: Truncated display of search box
* UPDATE: Updated KaTeX library to v0.11.1
* ENHANCEMENT: Include more files in PWA payload to allow better offline functionality in PWA scenarios
* ENHANCEMENT: Appxbundle is now signed with Kiwix certificate for a better sideloading experience
* KNOWN ISSUE: In mobile contexts, top bar always gets hidden by Bootstrap on scroll

## Release 0.9.9.95 Wikivoyage (beta)
* UPDATE: October 2019 update of Wikvoyage ZIM archive to wikivoyage_en_all_maxi_2019-10.zim
* UPDATE: Improved support for stylesheets in latest Wikimedia ZIMs
* UPDATE: Updated the [Privacy Policy](https://github.com/kiwix/kiwix-js-windows/tree/Kiwix-JS-Wikivoyage-dev#privacy-policy)
* ENHANCEMENT: The base app (not UWP) can now be installed as a PWA (visit <https://kiwix.github.io/kiwix-js-windows/www/index.html> to try)
* ENHANCEMENT: Assets are now cached in Service Worker mode
* ENHANCEMENT: Support MathML in latest Wikimedia ZIMs
* ENHANCEMENT: Provide an alert if a packaged or picked file cannot be found
* ENHANCEMENT: App can now be compiled with Electron or NWJS to support Win XP/7/8.1 (see [releases](https://github.com/kiwix/kiwix-js-windows/releases))
* ENHANCEMENT: Fallback to localStorage if cookies are not supported (e.g. running Chromium from file:///)
* FIX: Bug causing localStorage to fill up has been fixed
* FIX: Fixed broken drag-and-drop
* FIX: Enable page extraction in Service Worker mode
* FIX: Rare condition where a missing ZIM causes the app to crash on load
* FIX: Better algorithm for adding missing notes backlinks
* FIX: Better process for hiding navbar (though Bootstrap still ignores on mobile)
* FIX: All blocks are now opened for details-summary tags
* FIX: Bugs with the timing of display blanking between page loads
* FIX: Missing target attribute for hyperlinks to some external files
* FIX: Race condition preventing jQuery `alert.hide()` statements from running
* FIX: Enable dark theme and style transformations in Service Worker mode
* FIX: Enable printing in Service Worker mode
* FIX: Critical page reload loop when switching styles in print dialogue
* FIX: Update printing filters to support deatils-summary ZIMs
* FIX: Rare condition where a missing ZIM causes the app to crash on load
* FIX: Article is now re-loaded on change of content injection mode

## Release 0.9.9.92 Wikivoyage (beta)
* UPDATE: July 2019 update of Wikvoyage ZIM archive to wikivoyage_en_all_novid_2019-07.zim* FIX: Bug causing localStorage to fill up has been fixed
* FIX: Various tweaks to cached and transformed styles
* FIX: Many more equations now rendered correctly due to change of engine
* FIX: Service Worker mode now works in browser context (not app context)
* FIX: MathTex now rendered in Service Worker mode
* FIX: Bug with equations containing apostrophes
* FIX: Scripts no longer run in Quirks mode
* ENHANCEMENT: Better lazy image loading, and enable lazy loading for Service Worker mode
* ENHANCEMENT: Subtle fade-in effect for lazy-loaded images
* ENHANCEMENT: Allow breakout link to work in Service Worker mode
* ENHANCEMENT: Change MathTex rendering engine from MathJax to KaTeX (much faster)
* ENHANCEMENT: CORS errors are now detected and a message provided to the user to help resolve

## Release 0.9.9.91 Wikivoyage (beta)
* ENHANCEMENT: Links in clickable image maps (e.g. in Wikivoyage) are now supported
* ENHANCEMENT: App code supports developer setting a custom start page for a packaged ZIM
* ENHANCEMENT: A ZIM archive can be loaded through drag-and-drop of the file into the app
* ENHANCEMENT: Article search results can now be selected with physical keyboard (down, up, enter keys)
* UPDATE: Removed dependency on base tag, simplifying handling of hyperlinks
* FIX: New MediaWiki ZIMs with details-summary tags are now supported
* FIX: Low-level ZIM reader now conforms to libzim logic in deriving title from url
* FIX: Low-level ZIM reader now reads the MIME type list from the ZIM
* FIX: A system alert utility is now provided, to avoid using synchronous alert()
* FIX: A workaround has been added for improperly coded hyperlinks in subdirectories in WikiMedia ZIM files

## Release 0.9.9.90 Wikivoyage (beta)

* CRITICAL FIX: Remembered last page is now properly blanked on new archive load
* CRITICAL FIX: Fixed regression preventing use of download library
* UPDATE: April 2019 update of Wikvoyage ZIM archive to wikivoyage_en_all_novid_2019-04.zim 
* ENHANCEMENT: Article can now be sent to device's browser for reading, side-by-side viewing, printing
* ENHANCEMENT: A breakout icon can optionally be shown on each page to enable sending page to browser (see Settings)
* ENHANCEMENT: A new "auto" setting for dark mode and dark theme follows the system default for UWP apps
* ENHANCEMENT: Checkbox and radio buttons are now styled and coloured for better visibility (also larger)
* ENHANCEMENT: Packaged apps now default to showing the most appropriate ZIM archive types from Library
* ENHANCEMENT: Streamlined the process for adding other languages of packaged app ZIM files
* ENHANCEMENT: Language and date selectors in Library are now responsive to each other
* ENHANCEMENT: Download link more clearly signalled
* ENHANCEMENT: Improved styling of checkboxes in light and dark modes 
* ENHANCEMENT: Deal with re-organized stylesheets in mwoffliner ZIMs
* FIX: Fixed regression caused by removal of timeout for find in article function
* FIX: Fixed problems searching for dirEntries with empty titles in new ZIMs
* FIX: Correctly handle anchor links with a single #
* FIX: App detects a language that is predominantly ASCII and uses left-side word searching in that case (Chinese open-type search should be unaffected)
* FIX: Prevent crash if changing language selector on "wrong" screen
* FIX: Prevent timeout-related crashes on slower devices
* FIX: Prevent unusable app state after clicking non-Roman alphabet button in Archive Index
* FIX: Number of stylesheets retrieved from ZIM was not being counted properly, causing some pages to load twice
* FIX: The article content div is now hidden until the HTML for the requested article is injected 

## Release 0.9.9.87 Wikivoyage (beta)

* ENHANCEMENT: Support for playing media (video/audio) in the ZIM if the device has the required codec
* ENHANCEMENT: Support for "downloading" media (e.g. videos+subtitles) from the ZIM
* ENHANCEMENT: Media are launched via appropriate app selection menu after download (mobile)
* ENHANCEMENT: Typing a space in search box now displays an Archive Index
* ENHANCEMENT: Option to support non-Roman alphabets for Archive Index
* ENHANCEMENT: If active content is detected in the ZIM, information is given about accessing the Index instead
* FIX: Add startup bootloop crash prevention
* FIX: Exceptions produced by unsupported JS in ZIM articles are now caught
* FIX: Prevent app crash with malformed anchor references
* FIX: Correct logic in binary search so it doesn't stall if assets in A namespace have no title
* FIX: Missing footnote reference numbers in desktop ZIMs transformed to mobile style
* FIX: Assets with unescaped characters in URL should now be retrieved correctly
* FIX: Individual extraction of images when images are disabled in Configuration
* FIX: Removed timeout preventing fast typing for find in article function (Ctrl-F / Alt-F)
* FIX: Allow searching in article for languages that do not use spaces (such as Chinese)

## Release 0.9.9.81 Wikivoyage (beta)

* UPDATE: October 2018 update of Wikvoyage ZIM archive to wikivoyage_en_all_2018-10.zim
* ENHANCEMENT: Add a modern CSS spinner and rework status messages
* ENHANCEMENT: Neater presentation of article search results
* ENHANCEMENT: Test for CORS violation if server cannot be accessed
* ENHANCEMENT: Add API for reading ZIM metadata
* FIX: Crash when previously picked archive has been moved or deleted
* FIX: Added startup boot loop crash protection
* FIX: Prevent app crash with malformed anchor hrefs
* FIX: Support changed format of anchor references in latest English Wikipedia
* FIX: Correctly apply mobile styles when one of the defaults is missing
* FIX: Incorrect utf8 characters in mobile styles

## Release 0.9.9.7 Wikivoyage (beta)

* UPDATE: July 2018 update of Wikivoyage ZIM archive to wikivoyage_en_all_novid_2018-07.zim
* ENHANCEMENT: Optimization of decompression process

## Release 0.9.9.6 Wikivoyage (beta)

* UPDATE: June 2018 update of Wikivoyage ZIM archive to wikivoyage_en_all_novid_2018-06.zim
* UPDATE: Mobile styles and cached home page
* ENHANCEMENT: New compile of decoding engine provides significant performance improvement
* ENHANCEMENT: Headings in article can be toggled open or closed on narrow screens
* ENHANCEMENT: Current page is cached in localStorage for very fast restart and reloading
* ENHANCEMENT: Automatically switch to desktop style for better printing result
* ENHANCEMENT: Better memory management to prevent app crashes
* ENHANCEMENT: Reduced dependency on jQuery for further performance gains
* ENHANCEMENT: Tweaks to dark theme
* ENHANCEMENT: Print zoom capability
* ENHANCEMENT: Prevent printing of location pins
* ENHANCEMENT: Set maximum page width to 100% before printing
* FIX: Descriptive text for UI controls is now non-selectable for cleaner app experience
* FIX: Whitespace at the end of the page is now preserved when hiding reference section
* FIX: Bug which prevented switching the printing device (caused app crash)
* FIX: Bug in download links preventing display of language codes that are substrings of other language codes
* WORKAROUND: MW-Offliner bug which places extraneous tags in some HTML id attributes

## Release 0.9.9.5 Wikivoyage (beta)
There was no 0.9.9.5 release due to unusable Wikivoyage ZIM files in May

## Release 0.9.9.4 Wikivoyage (beta)

* UPDATE: March 2018 update of Wikivoyage ZIM archive to wikivoyage_en_all_novid_2018-03.zim
* ENHANCEMENT: Experimental support for printing articles
* ENHANCEMENT: Better presentation of About and Changelog information

## Release 0.9.9.3 Wikivoyage (beta)

* FIX: Unhandled exception after using in-article word search
* FIX: Article now reloads correctly when switching styles
* FIX: Browser history now remembered for first page load
* FIX: Added more padding for content hidden under the bottom bar
* FIX: New mode of injecting HTML into iframe fixes baseUrl issues
* FIX: Reduced memory usage for decompressing multiple SVG images/equations to prevent crash on devices with 1GB RAM
* FIX: Display bug causing Settings tab to remain selected after article load
* FIX: Loads landing page when an article is not found (instead of throwing a silent error)
* ENHANCEMENT: Filter ZIM archives by date in download links
* ENHANCEMENT: Option to remove maximum page width restriction for Wikipedia articles
* ENHANCEMENT: Setting or clearing dark themes no longer require page reload
* ENHANCEMENT: Wider range of infoboxes, and "homonymie" hatnotes supported
* ENHANCEMENT: Better algorithm for moving first paragraph when there are stacked infoboxes
* ENHANCEMENT: Applying or removing dark themes no longer requires a page reload
* ENHANCEMENT: Option to remove max page width restriction
* ENHANCEMENT: Some code redundancy removed
* ENHANCEMENT: 'Unclicking' a tab (Settings or About) now returns the user to the article
* ENHANCEMENT: Cache start page in the filesystem for quick start or return to home
* ENHANCEMENT: Activating dark theme for UI now activates article dark theme by default
* ENHANCEMENT: Improved handling and display of file selectors
* ENHANCEMENT: Clearer navigation signposting from About tab
* WORKAROUND for misplaced hatnotes in mobile-style ZIMs

## Release 0.9.7 Wikivoyage (beta)

* UPDATE: January 2018 update of Wikivoyage ZIM archive to wikivoyage_en_all_novid_2018-01.zim
* FIX: Added icon indicating that a link is to an external web site
* FIX: Bugs in mobile to desktop style transformation
* FIX: Issue with infoboxes and images not stacking correctly on mobile displays
* FIX: Support new-style infoboxes in German Wikivoyage
* FIX: Last-visited page was not being remembered when user picked the file as a single archive
* FIX: Bug which prevented the dark mode by simple inversion from functioning
* FIX: Issue with toolbar icons being misaligned on small screens
* ENHANCEMENT: The Wikivoyage app now hides the file selectors by default in the Config menu to avoid confusion and to encourage use of Kiwix JS for anything not related to Wikivoyage
* ENHANCEMENT: Inject footnote backlinks if the ZIM doesn't have any

## Release 0.9.6 Wikivoyage (beta)

* FIX: Prevent bottom toolbar from wrapping across two lines on small screens
* ENHANCEMENT: Enabled autoloading of last-read page on app start (and privacy option to turn this off)
* ENHANCEMENT: Geo-location co-ordinates in English and German Wikivoyage are represented with a location marker that links to the Maps app (opens map to show the precise location)
* ENHANCEMENT: Telephone numbers marked with tel: links will attempt to open a relevant app for dialling (e.g., Skype or the People app) when selected
* FIX: Links in Stackexchange ZIMs are now recognized and can be used to open the content
* WORKAROUND: Some Wikivoyage entries have HTML showing in the header, and this is now (temporarily) suppressed (the HTML is interpreted) until the ZIMs are fixed
* ENHANCEMENT: The toolbar icon now switches to a Wikivoyage logo if a Wikivoyage ZIM is loaded

## Release 0.9.3 (beta)

* WORKAROUND: Mis-aligned toolbar icons on smaller screens
* FIX: Rogue HTML showing in some pages from recent ZIM archives
* ENHANCEMENT: Better experience when scanning local storage for archives

## Release 0.9.0 (beta)

* ENHANCEMENT: Auto-loading of ZIM archives on device storage
* ENHANCEMENT: In-page search / highlighting with Ctrl-F / Alt-F or tap on search button
* ENHANCEMENT: Uses UWP APIs for sotrage: Future Access List so that users do not need to pick their ZIM file every time
* ENHANCEMENT: Dark-themed User Interface
* ENHANCEMENT: Experimental Wikipedia Dark Theme
* ENHANCEMENT: Font scaling for articles and for the UI
* ENHANCEMENT: Cleaner, minimalistic UI (eliminated hamburger menu due to poor navigability)
* FIX: Display of SVG files is handled by careful queuing of images to send to the decompressor (fixes hang in articles with many equations)
* ENHANCEMENT: If the TeX string of an equation is available, it will be typeset using MathJax (huge speed improvement)
* ENHANCEMENT: Transform the layout of Wikipedia articles from desktop to mobile style and vice versa (experimental)
* ENHANCEMENT: Disable the display of images, and extract them one-by-one as needed (for slow devices)
* ENHANCEMENT: Only send images in current viewport to the decompressor, and prefetch configurable (by developer) number of images from above and below the viewport
