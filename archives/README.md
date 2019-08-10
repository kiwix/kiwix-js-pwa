## If you are viewing this folder on GitHub or a cloned repository…

Due to GitHub filesize restrictions, it is not possible to upload ZIMs that are larger than 100Mb to this directory. If you wish to build the source code yourself, you will need to add the appropriate packaged ZIM file to your local repository before building. See below.

## How to change the packaged archive

If you have a distribution of this app and want to delete the packaged archive to save space, or change the default archive, simply delete the ZIM file here or add your own file and change some values in the `www/js/init.js`. The values to change are these:

``params['packagedFile'] = "name_of_your_file.zim";
params['fileVersion'] = "descriptive_name_of_your_file (Jan-2020)"; // These values will show in the app, but they are not important
params['cachedStartPage'] = false;``

## Building the app

If you are building a packaged version of the app, you should use a generic name for the ZIM, like `wikivoyage_en.zim` and then give the real name as as the `*.zim.txt` file in this directory, e.g. `wikivoyage_en_all_novid_2019-07.zim.txt`. The text file can be empty (0 bytes). You should also set the fields listed above in `www/js/init.js` to match, and additionally decide whether to set `params['showFileSelectors'] = false;`. That setting dedicates the app to the packaged archive, but users can still override and pick a different ZIM by changing the value in Expert Settings (Config).
