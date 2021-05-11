## If you are viewing this folder on GitHub or a cloned repository…

Due to GitHub filesize restrictions, it is not possible to upload ZIMs that are larger than 100Mb to this directory. If you wish to build the source code yourself, you will need to add the appropriate packaged ZIM file to your local repository before building. See below.

## How to change the packaged archive

If you have a distribution of this app and want to delete the packaged archive to save space, or change the default archive, simply delete the ZIM file here or add your own file and change some values in the `www/js/init.js`. The values to change are these:

```
params['packagedFile'] = "name_of_your_file.zim";
params['fileVersion'] = "descriptive_name_of_your_file (Jan-2020)"; // These values will show in the app
params['cachedStartPages'] = false;
params['kiwixDownloadLink'] = "https://download.kiwix.org/zim/"; //Include final slash
```

You can have more than one ZIM archive in `archives`, but only one will launch on app startup as the packaged file. If you do have more than one, then be sure to set `params['showFileSelectors'] = true;` to aid in discoverability of the other archive, otherwise your users will not eaeily realize it is there. Keeping that parameter as `false` dedicates the app to the packaged archive, but users can still override and pick a different ZIM by changing the value in Expert Settings (Config).

## Building the app

If you are building a custom packaged version of the app, then remember that ZIMs will not appear in your online GitHub repo, so add a text file to `archives` to show the intended filename, like the `*.zim.txt` file in this directory, e.g. `wikivoyage_en_all_novid_2019-07.zim.txt`. The text file can be empty (0 bytes). You should also set the fields listed above in `www/js/init.js` to match, and additionally decide whether to set `params['showFileSelectors'] = false;` (if you want to simplify the interface in Config).

Advanced: If you wish to restrict the files that users can search for on the server, e.g. to ensure your app remains dedicated to WikiMed archives, and to aid discoverability of only those archives, then look in `kiwixServe.js` and search for `DEV:` (first comment labelled `DEV:`) for more info. Also, ensure `params['kiwixDownloadLink'] = "https://download.kiwix.org/zim/";` is set appropriately so that the download library opens in the directory where multilingual or updated versions of your packaged ZIM can be found.
