# Changelog

## In-progress release 1.6.0-rc3

* FEATURE: New dropdown in Download Library allows filtering the list of archives by subject (for some ZIM types)
* ENHANCEMENT: The app can now take advantage of native Promises (faster than Q)
* ENHANCEMENT: Decompressors now loaded as fast binary WASM modules if the brower supports WebAssembly
* EXPERIMENTAL: Intalled PWA can now be opened offline when double-clicking ZIM archive (depends on File Handling API) 
* FIX: More displaced hatnotes corrected
* FIX: Style injection code that would (rarely) cause an exception on some ZIM types

## Release 1.5.0

* FEATURE: Search with wildcards `.*`, `.+` or regex syntax `(?:my_regular_expression)`
* FEATURE: (Experimental) PWA is paritcipating in File Handling API origin trial
* ENHANCEMENT: Significant speed-up by using native Promise API, or modern polyfill where needed
* ENHANCEMENT: Added full usage/syntax notes for title search and Alphabetical Title Index
* ENHANCEMENT: Include `h4` headings in Table of Contents
* ENHANCEMENT: Report number of titles scanned for long title searches
* UPDATE: Sample ZIM updated to `wikipedia_en_100_maxi_2021-06.zim`
* FIX: Display of ZIM Archive Index
* FIX: Bug which failed to detect images correctly in a new tab
* FIX: Touch-zoom of contents of iframe no longer blanks part of the display
* FIX: Broken zoom of contents of iframe (with UI buttons) in Internet Explorer
* FIX: Bug setting up backlinks which caused some pages not to load
* FIX: Unhandled exception when cite ref was not found

## Release 1.4.2

* ENHANCEMENT: Improve zooming and re-flowing the article contents in browsers that support the `zoom` style property
* ENHANCEMENT: Add a Content Security Policy preventing contents of a page from connecting to online resources
* FIX: Crash in UWP app after updating a ZIM archive
* FIX: Improve handover from local code to PWA code to prevent rogue error message
* FIX: Improve page composition timing for non-MS browsers

## Release 1.4.1

* FIX: Critical bug where article is not unhidden in time on slow systems in jQuery mode
* FIX: Issues with dark mode in Gutenberg ZIMs using SW mode
* FIX: Missing images from book lists in Gutenberg ZIMs

## Release 1.4.0

* ENHANCEMENT: Pre-calculate position and size of article namespace in legacy ZIMs (speeds up binary search)
* ENHANCEMENT: New option to move navigation buttons to the top toolbar
* UPDATE: Sample ZIM updated to `wikipedia_en_100_maxi_2021-05.zim`
* UPDATE: System dark/light mode now used for "auto" setting in modern browsers (as well as UWP)
* UPDATE: KaTeX to v0.13.11
* FIX: Double-clicking on archive failed to launch it in UWP app running in SW mode
* FIX: Hover and active colours on buttons
* FIX: Hide jump in page position during article load in Service Worker mode
* FIX: Adjusted timing of hiding and showing the article during page composition
* FIX: Intermittent failure to compose page in UWP app on mobile
* FIX: Reposition multiple displaced hatnotes
* FIX: Click on document reloads article when open new window feature is off
* FIX: Bug which prevented auto launch of packaged file on first install
* FIX: Issue preventing the article window from receiving focus for keyboard input

## Release 1.3.2

* FEATURE: Open a new browsable tab or window with right-click, long-press, ctrl-click, middle-click
* UPDATE: Sample archive updated to `wikipedia_en_100_maxi_2021-04`
* UPDATE: Release Linux AppImage packages for Electron-based build
* ENHANCEMENT: Alt-left or Ctrl-left (and same for right key) can now be used for navigation
* FIX: Prevent flash between page loads by adapting empty screen to the selected theme color
* FIX: Crash on upgrade of ZIM archive in some contexts
* FIX: Subtitle dislplay on videos
* FIX: Download of media and subtitles
* FIX: Display of list-based home pages
* FIX: Failure to apply dark theme to articles with no CSS
* FIX: Bug affecting middle-click when opening a new window or tab
* FIX: Bug which hid the file selectors when the app could not get a handle on a file or directory
* FIX: Bug preventing touch navigation

## Release 1.2.5

* ENHANCEMENT: PWA now adapts if it was launched from a basic packaged app
* UPDATE: Location of cached styles tweaked to reflect latest location in ZIM archives
* UPDATE: Cached main pages for WikiMed and Wikivoyage updated and used by vanilla app
* FIX: Properly define width of infoboxes in Wikimedia Destop style

## Release 1.2.4

* UPDATE: Packaged archive updated to `wikipedia_en_100_maxi_2021-03`
* ENHANCEMENT: Support v1 article index in no-namespace ZIM archives
* ENHANECMENT: Detect and correct erroneous hard-coded sytling of navboxes in recent ZIMs
* FIX: Correct width of infoboxes in Wikipedia Desktop style
* FIX: Failure to recognize mouse click on title index entry
* FIX: Issue preventing proper relocation of infobox when transforming to desktop style

## Release 1.2.3

* UPDATE: Better messaging around 'failure' to load SW mode (not a real failure)
* FIX: Calculation of appRoot directory

## Release 1.2.2

* ENHANCEMENT: Use a list of customized start pages even if the app is generic 
* FIX: Map markers not showing in Service Worker mode
* FIX: Implement internal app:// links for app-based assets
* FIX: Race condition in handover to PWA code
* FIX: Faulty permalinks

## Release 1.2.1

* UPDATE: Minor update to improve handover between local and PWA code
* ENHANCEMENT: If app is running as a PWA, its identity is changed to Kiwix JS PWA
* FIX: Display of masonry tiles in JQuery mode with latest ZIMs

## Release 1.2.0

* ENHANCEMENT: Enable Service Worker mode in UWP app
* ENHANCEMENT: New domain pwa.kiwix.org for the PWA/UWP app
* UPDATE: Preliminary support for ZIM archives with no namespace
* UPDATE: Revised Privacy Policy to reflect PWA usage

## Release 1.1.4

* UPDATE: Included ZIM updated to `wikipedia_en_100_maxi_2021-01.zim`
* UPDATE: More consistent install prompt display in Configuration (for PWA)
* ENHANCEMENT: Provide more robust upgrade process for PWAs, including notification banner
* FIX: Disable HTTP cache when pre-caching upgraded app files
* FIX: Switching to jQuery mode in the PWA app no longer prevents the app working offline
* FIX: Display of masonry-style landing pages in SW mode
* FIX: Inconsistent use of Settings Store during app initialization
* FIX: Delete accidentally created Indexed Databases with wrong filename on startup (where possible)
* FIX: Provide explicit Content Security Policy headers to reduce or eliminate CORS errors in SW mode
* FIX: Broken manual display of images in SW mode
* FIX: Broken "Open all headings" option in SW mode
* FIX: Printing in SW mode
* FIX: Bugs with reload of last visited article
* META: Create-DraftRelease PowerShell script supports automatic creation of GitHub releases for more versions of the app

## Release 1.1.3

* UPDATE: Included ZIM updated to `wikipedia_en_100_maxi_2020-12.zim`
* UPDATE: Support new location of mobile and desktop styles in Wikimedia ZIMs
* UPDATE: Upgrade Settings store to use localStorage over cookies where available
* ENHANCEMENT: Enable use of Native File System with NWJS
* FIX: Styling of index-based landing pages
* FIX: Bugs with file picking in Native FS

## Release 1.1.2

* UPDATE: Included ZIM updated to `wikipedia_en_100_maxi_2020-11.zim`
* UPDATE: WebP support (via polyfill) for older browsers including Windows Mobile
* ENHANCEMENT: Improved block cache and faster conversion of file slice to blob
* REGRESSION: Manual extraction of images reverted to one-by-one to prevent errors with WebP batch decoding
* FIX: Critical error on some new Wikipedia articles containing equations
* FIX: Prevent erroneous display of Active Content Warning with ZSTD archives
* FIX: Reduce some cross-origin errors

## Release 1.0.0

* UPDATE: Included ZIM updated to `wikipedia_en_100_maxi_2020-09.zim`
* UPDATE: App now supports newest archives encoded with ZSTD compression
* ENHANCEMENT: Decompression speed gains with ZSTD
* ENHANCEMENT: Allow use of keyboard to select archive from archive list
* ENHANCEMENT: Option to display articles with all sections open or closed
* FIX: Prevent archive list from jumping to wrong archive on click
* FIX: Critical error on load if packaged archive name has changed
* FIX: Download links are no longer erroneously cached by the Service Worker
* DEPRECATED: Scrolling information for new users

## Release 0.9.9.992 (beta)

* UPDATE: Included ZIM updated to `wikipedia_en_100_maxi_2020-08.zim`
* UPDATE: Some new Kiwix icons
* FIX: Prevent extraneous titles appearing in search
* FIX: Broken drag-and-drop
* FIX: Bug with construction of backlinks preventing load of some Wikipedia articles
* FIX: Calculate path of breakout icon correctly in SW mode
* ENHANCEMENT: Use Native File System API in PWA version
* ENHANCEMENT: Fix printing in the Electron app
* ENHANCEMENT: Support launching Electron app from shortcut
* ENHANCEMENT: Better error reporting in console log

## Release 0.9.9.991 (beta)

* FIX: Bug preventing all Kiwix apps accessing latest ZIMs (incorrect method of reading MIME type list)
* ENHANCEMENT: Included ZIM changed to wikipedia_en_100_maxi_2020-06.zim
* FIX: Several bugfixes to allow better running of Electron app in SW mode

## Release 0.9.9.99 (beta)

* ENHANCEMENT: Major upgrade to the title-search algorithm: search is now near-case-insensitive
* UPDATE: Included sample ZIM updated to wikipedia_en_ray_charles_maxi_2020-05.zim

## Release 0.9.9.98 (beta)

* ENHANCEMENT: Make app compatible with Electron / NWJS as a packaged app
* ENHANCEMENT: Better user experience for PWA version
* ENHANCEMENT: Attempt to make app a little more usable on Android browsers
* FIX: Incorrect layout when transforming WikiMed articles to desktop style
* FIX: Failure to load landing page when backing into it from history.back
* FIX: Incorrect hiding of toolbars after using in-page search
* UPDATE: Update Q Promise support to v1.5.1

## Release 0.9.9.97 (beta)

* ENHANCEMENT: Intuitive toolbar hiding/showing on scroll down/up
* ENHANCEMENT: Added block cache to speed up search considerably
* ENHANCEMENT: Provide option to set number of results to find when searching
* ENHANCEMENT: Provide app install experience for PWA
* FIX: Search results can now be scrolled by touch on Windows 10 tablets
* FIX: Corrected height of search results window so content is not hidden under footer
* FIX: Prevent ugly jumping of iframe on new article load
* FIX: Allow use of special characters in article search
* FIX: Remove broken links to deprecated portable versions of archives
* UPDATE: Added missing stylesheets for cache
* UPDATE: Added some more initial files to load for PWA

## Release 0.9.9.96 (beta)

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

## Release 0.9.9.95 (beta)

* UPDATE: Improved support for stylesheets in latest Wikipedia ZIMs
* UPDATE: Updated the Privacy Policy
* ENHANCEMENT: The base app (not UWP) can now be installed as a PWA (visit https://kiwix.github.io/kiwix-js-windows/www/index.html to try)
* ENHANCEMENT: Assets are now cached in Service Worker mode
* ENHANCEMENT: Support MathML in latest Wikimedia ZIMs
* FIX: Fixed broken drag-and-drop
* FIX: Enable page extraction in Service Worker mode
* FIX: Rare condition where a missing ZIM causes the app to crash on load
* FIX: Fixed broken display of active content warning

## Release 0.9.9.94 (beta)

* ENHANCEMENT: Provide an alert if a packaged or picked file cannot be found
* ENHANCEMENT: App can now be compiled with Electron or NWJS to support Win XP/7/8.1 (see [releases](https://github.com/kiwix/kiwix-js-windows/releases))
* ENHANCEMENT: CORS errors are now detected and a message provided to the user to help resolve
* ENHANCEMENT: Fallback to localStorage if cookies are not supported (e.g. running Chromium from file:///)
* FIX: Bug with equations containing apostrophes
* FIX: ZIMs running in quirks mode are now patched to run in standards mode
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
* FIX: Scripts no longer run in Quirks mode (for clients supporting Service Worker)
* UPDATE: August 2019 update of Ray Charles ZIM

## Release 0.9.9.91 (beta)

* FIX: Remembered last page is now properly blanked on new archive load
* FIX: The article content div is now hidden until the HTML for the requested article is injected
* FIX: Number of stylesheets retrieved from ZIM was not being counted properly, causing some pages to load twice
* FIX: New MediaWiki ZIMs with details-summary tags are now supported
* FIX: Low-level ZIM reader now conforms to libzim logic in deriving title from url
* FIX: Low-level ZIM reader now reads the MIME type list from the ZIM
* FIX: A system alert utility is now provided, to avoid using synchronous alert()
* FIX: Bug causing localStorage to fill up has been fixed
* FIX: A workaround has been added for improperly coded hyperlinks in subdirectories in WikiMedia ZIM files
* FIX: Various tweaks to cached and trasnformed styles
* FIX: Many more equations now rendered correctly due to change of engine
* FIX: Service Worker mode now works in browser context (not app context)
* FIX: MathTex now rendered in Service Worker mode
* UPDATE: Removed dependency on base tag, simplifying handling of hyperlinks
* ENHANCEMENT: Links in clickable image maps (e.g. in Wikivoyage) are now supported
* ENHANCEMENT: App code supports developer setting a custom start page for a packaged ZIM
* ENHANCEMENT: A ZIM archive can be loaded through drag-and-drop of the file into the app
* ENHANCEMENT: A ZIM archive can be loaded by double-clicking the file in Explorer
* ENHANCEMENT: Article search results can now be selected with physical keyboard (down, up, enter keys)
* ENHANCEMENT: Better lazy image loading, and enable lazy loading for Service Worker mode
* ENHANCEMENT: Subtle fade-in effect for lazy-loaded images
* ENHANCEMENT: Allow breakout link to work in Service Worker mode
* ENHANCEMENT: Change MathTex rendering engine from MathJax to KaTeX (much faster)

## Release 0.9.9.90 (beta)

* FIX: Remembered last page is now properly blanked on new archive load
* FIX: Number of stylesheets retrieved from ZIM was not being counted properly, causing some pages to load twice
* FIX: The article content div is now hidden until the HTML for the requested article is injected 

## Release 0.9.9.89 (beta)

* FIX: Fixed regression preventing use of download library
* FIX: Fixed problems searching for dirEntries with empty titles in new ZIMs
* FIX: Correctly handle anchor links with a single #
* ENHANCEMENT: Improved styling of checkboxes in light and dark modes 

## Release 0.9.9.88 (beta)

* ENHANCEMENT: Article can now be sent to device's browser for reading, side-by-side viewing, printing
* ENHANCEMENT: A breakout icon can optionally be shown on each page to enable sending page to browser (see Settings)
* ENHANCEMENT: A new "auto" setting for dark mode and dark theme follows the system default for UWP apps
* ENHANCEMENT: Checkbox and radio buttons are now styled and coloured for better visibility (also larger)
* ENHANCEMENT: Packaged apps now default to showing the most appropriate ZIM archive types from Library
* ENHANCEMENT: Streamlined the process for adding other languages of packaged app ZIM files
* ENHANCEMENT: Language and date selectors in Library are now responsive to each other
* ENHANCEMENT: Download link more clearly signalled
* UPDATE: Deal with re-organized stylesheets in mwoffliner ZIMs
* FIX: Fixed regression caused by removal of timeout for find in article function
* FIX: App detects a language that is predominantly ASCII and uses left-side word searching in that case (Chinese open-type search should be unaffected)
* FIX: Prevent crash if changing language selector on "wrong" screen
* FIX: Prevent timeout-related crashes on slower 
* FIX: Prevent unusable app state after clicking non-Roman alphabet button in Archive Index

## Release 0.9.9.87 (beta)

* FIX: Removed timeout preventing fast typing for find in article function (Ctrl-F / Alt-F)
* FIX: Allow searching in article for languages that do not use spaces (such as Chinese)

## Release 0.9.9.85 (beta)

* ENHANCEMENT: Support for playing media (video/audio) in the ZIM if the device has the required codec
* ENHANCEMENT: Support for "downloading" media (e.g. videos+subtitles) from the ZIM
* ENHANCEMENT: Media are launched via appropriate app selection menu after download (mobile)
* ENHANCEMENT: Preliminary support for TED and dirtybiology ZIMs
* ENHANCEMENT: Preliminary support for Project Gutenberg ZIMs
* ENHANCEMENT: Support for "downloading" epub ebooks from Gutenberg ZIMs
* ENHANCEMENT: Epubs are launched in Edge's built-in epub reader, or via app selection menu
* ENHANCEMENT: Typing a space in search box now displays an Archive Index
* ENHANCEMENT: Option to support non-Roman alphabets for Archive Index
* ENHANCEMENT: If active content is detected in the ZIM, information is given about accessing the Index instead
* FIX: Add startup bootloop crash prevention
* FIX: Exceptions produced by unsupported JS in ZIM articles are now caught
* FIX: Prevent app crash with malformed anchor references
* FIX: Rogue ampersands in MathJax output are now correctly escaped
* FIX: Correct logic in binary search so it doesn't stall if assets in A namespace have no title
* FIX: Missing footnote reference numbers in desktop ZIMs transformed to mobile style
* FIX: Assets with unescaped characters in URL should now be retrieved correctly
* FIX: Individual extraction of images when images are disabled in Configuration

## Release 0.9.9.8 (beta)

* UPDATE: Ray Charles ZIM to October 2018 version
* ENHANCEMENT: Add a modern CSS spinner and rework status messages
* ENHANCEMENT: Neater presentation of article search results
* FIX: Crash when previously picked archive has been moved or deleted
* FIX: Support changed format of anchor references in latest English Wikipedia
* FIX: Correctly apply mobile styles when one of the defaults is missing
* FIX: Incorrect utf8 characters in mobile styles 

## Release 0.9.9.7 (beta)

* ENHANCEMENT: Optimization of decompression process
* WORKAROUND: Prevent periodic hang in Service Worker mode
* FIX: Crash in RegExp engine caused by malformed backreferences in some articles

## Release 0.9.9.6 (beta)

* UPDATE: Mobile styles
* ENHANCEMENT: New compile of decoding engine provides significant performance improvement
* ENHANCEMENT: Better memory management to prevent app crashes
* ENHANCEMENT: Reduced dependency on jQuery for further performance gains
* ENHANCEMENT: Tweaks to dark theme
* ENHANCEMENT: Improvements to show-hide sections toggle function with footnote/endnote references
* FIX: Headers that open or close sections are no longer accidentally selected on tap or click
* FIX: Descriptive text for UI controls is now non-selectable for cleaner app experience
* FIX: Whitespace at the end of the page is now preserved when hiding reference section
* FIX: Tapping headers now only opens and closes sections on narrow screens as intended by WikiMedia

## Release 0.9.9.5 (beta)

* ENHANCEMENT: Headings in article can be toggled open or closed with tap or click
* ENHANCEMENT: Current page is cached in localStorage for very fast restart and reloading
* ENHANCEMENT: Automatically switch to desktop style for better printing result
* FIX: Bug which prevented switching the printing device (caused app crash)
* FIX: Bug in download links preventing display of language codes that are substrings of other language codes

## Release 0.9.9.4 (beta)

* ENHANCEMENT: Experimental support for printing articles
* ENHANCEMENT: Print zoom capability
* ENHANCEMENT: Prevent printing of location pins
* ENHANCEMENT: Set maximum page width to 100% before printing
* ENHANCEMENT: Better presentation of About and Changelog information
* WORKAROUND: MW-Offliner bug which places extraneous tags in some HTML id attributes

## Release 0.9.9.3 (beta)

* FIX: Article now reloads correctly when switching styles
* FIX: Unhandled exception after using in-article word search
* FIX: Browser history now remembered for first page load
* ENHANCEMENT: Filter ZIM archives by date in download links
* ENHANCEMENT: Option to remove maximum page width restriction for Wikipedia articles
* ENHANCEMENT: Setting or clearing dark themes no longer require page reload
* ENHANCEMENT: Wider range of infoboxes, and "homonymie" hatnotes supported
* ENHANCEMENT: Better algorithm for moving first paragraph when there are stacked infoboxes

## Release 0.9.9.2 (beta)

* FIX: Added more padding for content hidden under the bottom bar
* FIX: New mode of injecting HTML into iframe fixes baseUrl issues
* ENHANCEMENT: Some code redundancy removed
* ENHANCEMENT: Faster typesetting of TeX equations
* ENHANCEMENT: Experimental support for equations in mathoverflow and related stackechange ZIMs
* ENHANCEMENT: Dark theme support for stackexchange ZIMs
* ENHANCEMENT: Uncluttered the UI for file selection

## Release 0.9.9 (beta)

* FIX: Reduced memory usage for decompressing multiple SVG images/equations to prevent crash on devices with 1GB RAM
* FIX: Display bug causing Settings tab to remain selected after article load
* FIX: Corrected dark-style backgrounds in some infoboxes on WikiMed
* FIX: Loads landing page when an article is not found (instead of throwing a silent error)
* WORKAROUND for misplaced hatnotes in mobile-style ZIMs
* WORKAROUND for hidden IPA pronunciation information on some articles
* ENHANCEMENT: 'Unclicking' a tab (Settings or About) now returns the user to the article
* ENHANCEMENT: Activating dark theme for UI now activates article dark theme by default
* ENHANCEMENT: Improved handling and display of file selectors
* ENHANCEMENT: Clearer navigation signposting from About tab
* ENHANCEMENT: Dedicated icon for WikiMed archives

## Release 0.9.7 (beta)

* UPDATE: January 2018 update of Wikivoyage ZIM archive to wikivoyage_en_all_novid_2018-01.zim
* ENHANCEMENT: The Wikivoyage app now hides the file selectors by default in the Config menu to avoid confusion and to encourage use of Kiwix JS for anything not related to Wikivoyage
* FIX: Added icon indicating that a link is to an external web site
* ENHANCEMENT: Inject footnote backlinks if the ZIM doesn't have any
* ENHANCEMENT: Support ZIMs that have subdirectories (Stackexchange family ZIMs)
* FIX: Bugs in mobile to desktop style transformation
* FIX: Issue with infoboxes and images not stacking correctly on mobile displays
* FIX: Support new-style infoboxes in German Wikivoyage
* FIX: Last-visited page was not being remembered when user picked the file as a single archive
* FIX: Bug which prevented the dark mode by simple inversion from functioning
* FIX: Issue with toolbar icons being misaligned on small screens

## Release 0.9.6 (beta)

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
