## Release 0.9.9.87 WikiMed (beta)
* ENHANCEMENT: Support for playing media (video/audio) in the ZIM if the device has the required codec
* ENHANCEMENT: Support for "downloading" media (e.g. videos+subtitles) from the ZIM
* ENHANCEMENT: Media are launched via appropriate app selection menu after download (mobile)
* ENHANCEMENT: Typing a space in search box now displays an Archive Index
* ENHANCEMENT: Option to support non-Roman alphabets for Archive Index
* ENHANCEMENT: If active content is detected in the ZIM, information is given about accessing the Index instead
* FIX: Removed timeout preventing fast typing for find in article function (Ctrl-F / Alt-F)
* FIX: Allow searching in article for languages that do not use spaces (such as Chinese)
* FIX: Add startup bootloop crash prevention
* FIX: Exceptions produced by unsupported JS in ZIM articles are now caught
* FIX: Prevent app crash with malformed anchor references
* FIX: Rogue ampersands in MathJax output are now correctly escaped
* FIX: Correct logic in binary search so it doesn't stall if assets in A namespace have no title
* FIX: Missing footnote reference numbers in desktop ZIMs transformed to mobile style
* FIX: Assets with unescaped characters in URL should now be retrieved correctly
* FIX: Individual extraction of images when images are disabled in Configuration

## Release 0.9.9.81 WikiMed (beta)
* UPDATE: October 2018 update of WikiMed ZIM archive to wikipedia_en_medicine_novid_2018-10.zim
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

## Release 0.9.9.7 WikiMed (beta)
* UPDATE: August 2018 update of WikiMed ZIM archive to wikipedia_en_medicine_novid_2018-08.zim
* ENHANCEMENT: Optimization of decompression process
* FIX: Crash in RegExp engine caused by malformed backreferences in some articles

## Release 0.9.9.6 WikiMed (beta)
* UPDATE: June 2018 update of WikiMed ZIM archive to wikipedia_en_medicine_novid_2018-06.zim
* UPDATE: Mobile styles and cached home page
* ENHANCEMENT: New compile of decoding engine provides significant performance improvement
* ENHANCEMENT: Better memory management to prevent app crashes
* ENHANCEMENT: Reduced dependency on jQuery for further performance gains
* ENHANCEMENT: Tweaks to dark theme
* ENHANCEMENT: Improvements to show-hide sections toggle function with footnote/endnote references
* FIX: Headers that open or close sections are no longer accidentally selected on tap or click
* FIX: Descriptive text for UI controls is now non-selectable for cleaner app experience
* FIX: Whitespace at the end of the page is now preserved when hiding reference section
* FIX: Tapping headers now only opens and closes sections on narrow screens as intended by WikiMedia

## Release 0.9.9.5 WikiMed (beta)
* ENHANCEMENT: Headings in article can be toggled open or closed with tap or click
* ENHANCEMENT: Current page is cached in localStorage for very fast restart and reloading
* ENHANCEMENT: Automatically switch to desktop style for better printing result
* ENHANCEMENT: Print zoom capability
* ENHANCEMENT: Set maximum page width to 100% before printing
* FIX: Bug which prevented switching the printing device (caused app crash)
* FIX: Bug in download links preventing display of language codes that are substrings of other language codes
* WORKAROUND: MW-Offliner bug which places extraneous tags in some HTML id attributes

## Release 0.9.9.4 WikiMed (beta)
* UPDATE: March 2018 update of WikiMed ZIM archive to wikipedia_en_medicine_novid_2018-03.zim
* ENHANCEMENT: Experimental support for printing articles
* ENHANCEMENT: Better presentation of About and Changelog information

## Release 0.9.9.3 WikiMed (beta)
* FIX: Article now reloads correctly when switching styles
* FIX: Unhandled exception after using in-article word search
* FIX: Browser history now remembered for first page load
* FIX: Added more padding for content hidden under the bottom bar
* FIX: New mode of injecting HTML into iframe fixes baseUrl issues
* ENHANCEMENT: Filter ZIM archives by date in download links
* ENHANCEMENT: Option to remove maximum page width restriction for Wikipedia articles
* ENHANCEMENT: Setting or clearing dark themes no longer require page reload
* ENHANCEMENT: Wider range of infoboxes, and "homonymie" hatnotes supported
* ENHANCEMENT: Better algorithm for moving first paragraph when there are stacked infoboxes
* ENHANCEMENT: Applying or removing dark themes no longer requires a page reload
* ENHANCEMENT: Option to remove max page width restriction
* ENHANCEMENT: Some code redundancy removed
* ENHANCEMENT: Faster typesetting of TeX equations
* ENHANCEMENT: Uncluttered the UI for file selection

## Release 0.9.9 WikiMed (beta)
* FIX: Reduced memory usage for decompressing multiple SVG images/equations to prevent crash on devices with 1GB RAM
* FIX: Display bug causing Settings tab to remain selected after article load
* FIX: Loads landing page when an article is not found (instead of throwing a silent error)
* ENHANCEMENT: 'Unclicking' a tab (Settings or About) now returns the user to the article
* ENHANCEMENT: Improved handling and display of file selectors
* ENHANCEMENT: Clearer navigation signposting from About tab

## Release 0.9.8 WikiMed (beta)
* FIX: Corrected dark-style backgrounds in some infoboxes on WikiMed 
* WORKAROUND for hidden IPA pronunciation information on some WikiMed articles
* WORKAROUND for misplaced hatnotes in mobile-style ZIMs
* ENHANCEMENT: Cache start page in the filesystem for quick start or return to home
* ENHANCEMENT: Activating dark theme for UI now activates article dark theme by default
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
