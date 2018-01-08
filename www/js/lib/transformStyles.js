/**
 * transformStyles.js: Provides transformations in CSS of Wikipedia articles contained in the ZIM file
 * This allows the user to choose the presentation style for the page to be viewed.
 * Currently available are "mobile" and "desktop" display modes.
 * 
 * Copyright 2017 Kiwix developers
 * License GPL v3:
 * 
 * This file is part of Kiwix.
 * 
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Kiwix is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Kiwix (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */
'use strict';

define(['util', 'uiUtil'], function (util, uiUtil) {
    /* zl = zimLink; zim = zimType; cc = cssCache; cs = cssSource; i]  */
    function filterCSS(zl, zim, cc, cs, i) {
        var rtnFunction = "injectCSS";
        if ((zim != cs) && zl.match(/(-\/s\/style\.css)|minerva|mobile|parsoid/i)) { //If it's the wrong ZIM type and style matches main styles...
            if (zl.match(/(-\/s\/style\.css)|(minerva)|style-mobile\.css/i)) { //If it matches one of the required styles...
                zl = (cs == "mobile") ? "../-/s/style-mobile.css" : "../-/s/style.css"; //Take it from cache, because not in the ZIM
                console.log("Matched #" + i + " [" + zl + "] from local filesystem because style is not in ZIM" +
                    "\nbut your display options require a " + cs + " style");
                uiUtil.poll("Matched [" + zl.substring(0, 30) + "] from cache" + " because your display options require a " + cs + " style...");
            }
            if (cs == "desktop" && zl.match(/minerva|mobile|parsoid/)) { //If user selected desktop style and style is one of the mobile styles
                console.log("Voiding #" + i + " [" + zl + "] from document header \nbecause your display options require a desktop style");
                uiUtil.poll("Voiding [" + zl.substring(0, 30) + "] because your display options require a " + cs + " style...");
                zl = "#"; //Void these mobile styles
            }
            //injectCSS();
            return {zl : zl, rtnFunction : rtnFunction};
        } else {
            //If this is a standard Wikipedia css use stylesheet cached in the filesystem...
            //DEV: Although "." matches any character in regex, there is enough specificity in the patterns below
            //DEV: Add any local stylesheets you wish to include here
            if (cc &&
                (zl.match(/-\/s\/style.css/i) ||
                    zl.match(/-\/s\/css_modules\/mediawiki.toc.css/i) ||
                    zl.match(/-\/s\/css_modules\/ext.cite.styles.css/i) ||
                    zl.match(/-\/s\/css_modules\/ext.timeline.styles.css/i) ||
                    zl.match(/-\/s\/css_modules\/ext.scribunto.logs.css/i) ||
                    zl.match(/-\/s\/css_modules\/mediawiki.page.gallery.styles.css/i) ||
                    zl.match(/-\/s\/css_modules\/ext.cite.a11y.css/i) ||
                    zl.match(/-\/s\/css_modules\/ext.kartographer.style.css/i) ||
                    zl.match(/-\/s\/css_modules\/ext.kartographer.link.css/i) ||
                    zl.match(/-\/s\/css_modules\/ext.kartographer.frame.css/i) ||
                    zl.match(/-\/s\/css_modules\/mw.TMHGalleryHook.js.css/i) ||
                    zl.match(/-\/s\/css_modules\/mw.PopUpMediaTransform.css/i) ||
                    zl.match(/-\/s\/css_modules\/mw.MediaWikiPlayer.loader.css/i) ||
                    zl.match(/-\/s\/css_modules\/ext.tmh.thumbnail.styles.css/i) ||
                    zl.match(/-\/s\/css_modules\/ext.math.styles.css/i) ||
                    zl.match(/-\/s\/css_modules\/ext.math.scripts.css/i) ||
                    zl.match(/-\/s\/css_modules\/content.parsoid.css/i) ||
                    zl.match(/-\/s\/css_modules\/inserted_style_mobile.css/i) ||
                    zl.match(/-\/s\/css_modules\/mobile.css/i) ||
                    zl.match(/-\/s\/style-mobile.css/i) ||
                    zl.match(/-\/s\/css_modules\/skins.minerva.base.reset\|skins.minerva.content.styles\|ext.cite.style\|mediawiki.page.gallery.styles\|mobile.app.pagestyles.android\|mediawiki.skinning.content.parsoid.css/i)
                )) {
                zl = zl.replace(/\|/ig, "_"); //Replace "|" with "_" (legacy for some stylesheets with pipes in filename - but next line renders this redundant in current implementation)
                if (zl.match(/(-\/s\/style\.css)|(minerva)/i)) { //If it matches one of the required styles...
                    zl = (cs == "mobile") ? "../-/s/style-mobile.css" : "../-/s/style.css";
                }
                console.log("Matched #" + i + " [" + zl + "] from local filesystem");
                uiUtil.poll("Matched #" + i + " [" + zl.substring(0, 30) + "] from local filesystem");
                //injectCSS();
                return { zl: zl, rtnFunction: rtnFunction };
            } else { //Try to get the stylesheet from the ZIM file unless it's the wrong ZIM type
                zl = zl.match(/^(?:\.\.\/|\/)+(-\/.*)$/)[1]; //Remove the directory path
                console.log("Attempting to resolve CSS link #" + i + " [" + zl + "] from ZIM file..." +
                    (cc ? "\n(Consider adding file #" + i + " to the local filesystem)" : ""));
                rtnFunction = "resolveCSS";
                return { zl: zl, rtnFunction: rtnFunction };
            }
        }
    }

    function toMobileCSS(html, zim, cc, cs, css) {
        //DEV: Careful not to add styles twice...
        //NB Can't relocate to filterCSS function above because it filters styles serially and code would be called for every style...
        if (zim != cs) { //If ZIM doesn't match user-requested style, add in stylesheets if they're missing
            css += /-\/s\/css_modules\/content\.parsoid\.css/i.test(css) ? "" : '<link href="../-/s/css_modules/content.parsoid.css" rel="stylesheet" type="text/css">\r\n';
            css += /-\/s\/css_modules\/inserted_style_mobile\.css/i.test(css) ? "" : '<link href="../-/s/css_modules/inserted_style_mobile.css" rel="stylesheet" type="text/css">\r\n';
            css += /-\/s\/css_modules\/mobile\.css/i.test(css) ? "" : '<link href="../-/s/css_modules/mobile.css" rel="stylesheet" type="text/css">\r\n';
        }
        if (cc || (zim == "desktop")) { //If user requested cached styles OR the ZIM does not contain mobile styles
            console.log(zim == "desktop" ? "Transforming display style to mobile..." : "Optimizing cached styles for mobile display...");
            uiUtil.poll("desktop" ? "Transforming display style to mobile..." : "Optimizing cached styles for mobile display...");
            //Allow images to float right or left
            //html = html.replace(/class\s*=\s*["']\s*thumb\s+tright\s*["']\s*/ig, 'style="float: right; clear: right; margin-left: 1.4em;"');
            //html = html.replace(/class\s*=\s*["']\s*thumb\s+tleft\s*["']\s*/ig, 'style="float: left; clear: left; margin-right: 1.4em;"');
            //Add styling to image captions that is hard-coded in Wikipedia mobile
            html = html.replace(/class\s*=\s*["']\s*thumbcaption\s*["']\s*/ig, 'style="margin: 0.5em 0 0.5em; font-size: 0.8em; line-height: 1.5; padding: 0 !important; color: #54595d; width: auto !important;"');
            //If it's in desktop position, move info-box below lead paragraph like on Wikipedia mobile
            //html = zim == "desktop" ? /<\/p>[\s\S]*?<table\s+[^>]*(?:infobox|vertical-navbox)/i.test(html) ? html : html.replace(/(<table\s+(?=[^>]*(?:infobox|vertical-navbox))[\s\S]+?<\/table>[^<]*)((?:<span\s*>\s*)?<p\b[^>]*>(?:(?=([^<]+))\3|<(?!p\b[^>]*>))*?<\/p>(?:<span\s*>)?)/i, "$2\r\n$1") : html;
            //var test = html.getElementById("qbRight")
            if (zim == "desktop") {
                var infobox = [];
                if (/<table\b[^>]+(?:infobox|vertical-navbox|qbRight|wikitable)/i.test(html)) {
                    infobox = util.matchOuter(html, '<table\\b[^>]+(?:infobox|vertical-navbox|qbRight|wikitable)[^>]+>', '</table>', 'i');
                } else {
                    if (/<div\b[^>]+(?:infobox|vertical-navbox|qbRight|wikitable)/i.test(html)) {
                        infobox = util.matchOuter(html, '<div\\b[^>]+(?:infobox|vertical-navbox|qbRight|wikitable)[^>]+>', '</div>', 'i');
                    }
                }
                if (infobox.length) {
                    var temphtml = html.replace(infobox[0], "");
                    var paras = util.matchInner(temphtml, '<p\\b[^>]*>', '</p>', 'gi');
                    var matched = false;
                    if (paras.length) {
                        for (var g = 0; g < 3; g++) {
                            //Check if the paragraph is a proper sentence, i.e. contains at least 50 non-HTML-delimetered non-full-stop characters, followed by a punctuation character
                            if (paras[g] && /[^.]{50,}[^.]*[.,;:?!-]/.test(paras[g].replace(/<[^>]*>/g, ""))) { matched = true; break; }
                        }
                        if (matched) {
                            //Swap table and first matched paragraph, but mark lead paragraph first
                            //We already deleted the table above
                            html = temphtml;
                            html = html.replace(paras[g], paras[g].replace(/(<p\s+)/i, '$1data-kiwix-id="lead" ') + "\r\n" + infobox[0]);
                        }
                    }
                }
            }
            //html = zim == "desktop" ? html.replace(/(<table\s+(?=[^>]*(?:infobox|vertical-navbox|qbRight))[\s\S]+?<\/table>[^<]*)((?:<span\s*>\s*)?<p\b[^>]*>(?:(?=([^<]+))\3|<(?!p\b[^>]*>))*?<\/p>(?:<span\s*>)?)/i, "$2\r\n$1") : html;
            //Set infobox styling hard-coded in Wikipedia mobile
            html = html.replace(/(table\s+(?=[^>]*class\s*=\s*["'][^"']*(?:infobox|vertical-navbox|qbRight|wikitable))[^>]*style\s*=\s*["'][^"']+[^;'"]);?\s*["']/ig, '$1; position: relative; border: 1px solid #eaecf0; text-align: left; background-color: #f8f9fa;"');
            //Wrap <h2> tags in <div> to control bottom border width if there's an infobox
            html = html.match(/table\s+(?=[^>]*class\s*=\s*["'][^"']*(?:infobox|vertical-navbox|qbRight|wikitable))/i) ? html.replace(/(<h2\s+[^<]*<\/h2>)/ig, '<div style="width: 60%;">$1</div>') : html;
        }
        //Add dark theme if requested
        css += (params.cssTheme == "dark") ? '<link href="../-/s/style-dark.css" rel="stylesheet" type="text/css">\r\n' : (params.cssTheme == "invert") ? '<link href="../-/s/style-dark-invert.css" rel="stylesheet" type="text/css">\r\n' :"";
        html = (params.cssTheme == "dark") ? html.replace(/(<h1\s+[^>]*)background-color\s*:\s*white;\s*/i, "$1") : html;
        html = (params.cssTheme == "dark") ? html.replace(/(<div\s+[^>]*)background-image\s*:\s*linear-gradient[^;]+white[^;]*;\s*/i, "$1") : html;

        return { html : html, css : css };
    }

    function toDesktopCSS(html, zim, cc, cs, css) {
        if (cc || (zim != cs)) {
            if (/class\s*=\s*["']gallery/i.test(html) && !/gallery/i.test(css)) {
                console.log("Inserting missing css required for gallery display [mediawiki.page.gallery.styles.css]...");
                uiUtil.poll("Inserting missing css required for gallery display [mediawiki.page.gallery.styles.css]...");
                css += /-\/s\/css_modules\/mediawiki\.page\.gallery\.styles\.css/i.test(css) ? "" : '<link href="../-/s/css_modules/mediawiki.page.gallery.styles.css" rel="stylesheet" type="text/css">\r\n';
            }
        }
        if (cc || (zim == "mobile")) { //If user requested cached styles OR the ZIM does not contain desktop styles
            console.log(zim == "mobile" ? "Transforming display style to desktop..." : "Optimizing cached styles for desktop display...");
            uiUtil.poll("mobile" ? "Transforming display style to desktop..." : "Optimizing cached styles for desktop display...");
            //If it's in mobile position, move info-box above lead paragraph like on Wikipedia desktop
            //html = html.replace(/((?:<span\s*>\s*)?<p\b[^>]*>(?:(?=([^<]+))\2|<(?!p\b[^>]*>))*?<\/p>(?:<\/span\s*>)?[^<]*)([\s\S]*?)(<table\s*(?=[^>]*infobox)[\s\S]+?<\/table>)/i, "$4$3$1");
            if (zim == "mobile") {
                var tableBox = util.matchOuter(html, '<table\\b[^>]+?(?:infobox|vertical-navbox|qbRight|wikitable)[^>]+>', '</table>', 'i');
                if (!(tableBox && tableBox.length)) {
                    //If above failed we may have div style infobox
                    tableBox = util.matchOuter(html, '<div\\b[^>]+?(?:qbRight)[^>]+>', '</div>', 'i');
                }
                //html = tableBox && tableBox.length ? html.replace(tableBox, "@@@KiwixSep@@@") : html;
                if (tableBox && tableBox.length) {
                    html = html.replace(tableBox, "@@@KiwixSep@@@");
                    html = html.replace(/((?:<span\s*>\s*)?<p\b[\s\S]+?)@@@KiwixSep@@@/i, tableBox + "\r\n$1");
                    //Do the replacement below just in case above regex failed
                    html = html.replace(/@@@KiwixSep@@@/, tableBox);
                }
            }
            //Ensure white background colour
            html = html.replace(/class\s*=\s*["']\s*mw-body\s*["']\s*/ig, 'style="background-color: white; padding: 1em; border-width: 0px; max-width: 55.8em; margin: 0 auto 0 auto;"');
            //Void empty header title
            html = html.replace(/<h1\s*[^>]+titleHeading[^>]+>\s*<\/h1>\s*/ig, "");
        }
        //Add dark theme if requested
        css += (params.cssTheme == "dark") ? '<link href="../-/s/style-dark.css" rel="stylesheet" type="text/css">\r\n' : (params.cssTheme == "invert") ? '<link href="../-/s/style-dark-invert.css" rel="stylesheet" type="text/css">\r\n' : "";
        html = (params.cssTheme == "dark") ? html.replace(/(<h1\s+[^>]*)background-color:\s*white;\s*/i, "$1") : html;
        html = (params.cssTheme == "dark") ? html.replace(/(<div\s+[^>]*)background-image\s*:\s*linear-gradient[^;]+white[^;]*;\s*/i, "$1") : html;

        return { html : html, css : css };
    }

    /**
    * Functions and classes exposed by this module
    */
    return {
        toMobileCSS: toMobileCSS,
        toDesktopCSS: toDesktopCSS,
        filterCSS: filterCSS
    };
});