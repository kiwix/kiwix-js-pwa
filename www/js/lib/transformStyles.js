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
    var prefix = document.location.href.replace(/index\.html(?:$|[#?].*$)/, '');
    /* zl = zimLink; zim = zimType; cc = cssCache; cs = cssSource; i]  */
    function filterCSS(zl, zim, cc, cs, i) {
        var rtnFunction = "injectCSS";
        if ((zim != cs) && zl.match(/(-\/s\/(?:css_modules\/)?style\.css)|minerva|mobile|parsoid/i)) { //If it's the wrong ZIM type and style matches main styles...
            if (zl.match(/-\/s\/style\.css|minerva|style-mobile\.css/i)) { //If it matches one of the required styles...
                zl = (cs == "mobile") ? prefix + "-/s/style-mobile.css" : prefix + "-/s/style.css"; //Take it from cache, because not in the ZIM
                console.log("Matched #" + i + " [" + zl + "] from local filesystem because style is not in ZIM" +
                    "\nbut your display options require a " + cs + " style");
                uiUtil.poll("Matched [" + zl.replace(/[^/]+\//g, '').substring(0, 18) + "] from cache" + " because your display options require a " + cs + " style...");
            }
            if (cs == "desktop" && /minerva|mobile|parsoid|css_modules\/style\.css/.test(zl) && !/css_modules\/mobile_main_page\.css/.test(zl)) {
                //If user selected desktop style and style is one of the mobile styles, but not mobile_main_page for newstyle all image homepages
                console.log("Voiding #" + i + " [" + zl + "] from document header \nbecause your display options require a desktop style");
                uiUtil.poll("Voiding [" + zl.replace(/[^/]+\//g, '').substring(0, 18) + "] because your display options require a " + cs + " style...");
                zl = "#"; //Void these mobile styles
            }
            // Rename this required mobile style so that we don't trigger reading ZIM as mobile in print intercept
            zl = /css_modules\/mobile_main_page\.css/.test(zl) && cs == 'desktop' ? prefix + "-/s/css_modules/newstyle_main_page.css" : zl;
        } else {
            //If this is a standard Wikipedia css use stylesheet cached in the filesystem...
            //DEV: Although "." matches any character in regex, there is enough specificity in the patterns below
            //DEV: Add any local stylesheets you wish to include here
            if (cc &&
                (/-\/s\/style.css/i.test(zl) ||
                    /-\/s\/css_modules\/mediawiki.toc.css/i.test(zl) ||
                    /-\/s\/css_modules\/ext.cite.styles.css/i.test(zl) ||
                    /-\/s\/css_modules\/ext.timeline.styles.css/i.test(zl) ||
                    /-\/s\/css_modules\/ext.scribunto.logs.css/i.test(zl) ||
                    /-\/s\/css_modules\/mediawiki.page.gallery.styles.css/i.test(zl) ||
                    /-\/s\/css_modules\/ext.cite.a11y.css/i.test(zl) ||
                    /-\/s\/css_modules\/ext.kartographer.style.css/i.test(zl) ||
                    /-\/s\/css_modules\/ext.kartographer.link.css/i.test(zl) ||
                    /-\/s\/css_modules\/ext.kartographer.frame.css/i.test(zl) ||
                    /-\/s\/css_modules\/mw.TMHGalleryHook.js.css/i.test(zl) ||
                    /-\/s\/css_modules\/mw.PopUpMediaTransform.css/i.test(zl) ||
                    /-\/s\/css_modules\/mw.MediaWikiPlayer.loader.css/i.test(zl) ||
                    /-\/s\/css_modules\/ext.tmh.thumbnail.styles.css/i.test(zl) ||
                    /-\/s\/css_modules\/ext.math.styles.css/i.test(zl) ||
                    /-\/s\/css_modules\/ext.math.scripts.css/i.test(zl) ||
                    /-\/s\/css_modules\/ext.inputBox.styles.css/i.test(zl) ||
                    /-\/s\/css_modules\/ext.cite.ux-enhancements.css/i.test(zl) ||
                    /-\/s\/css_modules\/mobile_main_page.css/i.test(zl) ||
                    /-\/s\/css_modules\/mediawiki.ui.input.css/i.test(zl) ||
                    /-\/s\/css_modules\/mediawiki.ui.checkbox.css/i.test(zl) ||
                    /-\/s\/css_modules\/content.parsoid.css/i.test(zl) ||
                    /-\/s\/css_modules\/inserted_style_mobile.css/i.test(zl) ||
                    /-\/s\/css_modules\/inserted_style.css/i.test(zl) ||
                    /-\/s\/css_modules\/style.css/i.test(zl) ||
                    /-\/static\/bootstrap\/css\/bootstrap.min.css/i.test(zl) ||
                    /-\/static\/bootstrap\/css\/bootstrap-theme.min.css/i.test(zl) ||
                    /-\/static\/main.css/i.test(zl) ||
                    /-\/s\/css_modules\/mobile.css/i.test(zl) ||
                    /-\/s\/style-mobile.css/i.test(zl) ||
                    /-\/s\/css_modules\/skins.minerva.base.reset\|skins.minerva.content.styles\|ext.cite.style\|mediawiki.page.gallery.styles\|mobile.app.pagestyles.android\|mediawiki.skinning.content.parsoid.css/i.test(zl)
                )) {
                zl = zl.replace(/\|/ig, "_"); //Replace "|" with "_" (legacy for some stylesheets with pipes in filename - but next line renders this redundant in current implementation)
                if (/(-\/s\/style\.css)|minerva|inserted_style_mobile/i.test(zl)) { //If it matches one of the required styles...
                    zl = cs == "mobile" ? "-/s/style-mobile.css" : "-/s/style.css";
                }
                // Rename this required mobile style so that we don't trigger reading ZIM as mobile in print intercept
                zl = /css_modules\/mobile_main_page\.css/.test(zl) ? "-/s/css_modules/newstyle_main_page.css" : zl;
                // Replace bootstrap with own: DEV: when upgrading to Bootstrap 4, stop doing this!
                zl = zl.replace(/.+(bootstrap[^\/]*?\.css)/i, "css/$1");
                console.log("Matched #" + i + " [" + zl + "] from local filesystem");
                uiUtil.poll("Matched #" + i + " [" + zl.replace(/[^/]+\//g, '').substring(0, 18) + "] from filesystem");
                //Make link absolute
                zl = zl.replace(/^[/.]*/, prefix);
                //injectCSS();
            } else if (params.contentInjectionMode == 'jquery') { //Try to get the stylesheet from the ZIM file unless it's the wrong ZIM type
                zl = zl.replace(/^[./]+/, ""); //Remove the directory path
                console.log("Attempting to resolve CSS link #" + i + " [" + zl + "] from ZIM file..." +
                    (cc ? "\n(Consider adding file #" + i + " to the local filesystem)" : ""));
                rtnFunction = "resolveCSS";
            }
        }
        return { zl: zl, rtnFunction: rtnFunction };
    }

    function toMobileCSS(html, zim, cc, cs, css) {
        //DEV: Careful not to add styles twice...
        //NB Can't relocate to filterCSS function above because it filters styles serially and code would be called for every style...
        if (zim == "desktop" && zim != cs) { //If ZIM doesn't match user-requested style, add in stylesheets if they're missing
            css += /-\/s\/css_modules\/content\.parsoid\.css/i.test(css) ? "" : '<link href="' + prefix + '-/s/css_modules/content.parsoid.css" rel="stylesheet" type="text/css">\r\n';
            css += /-\/s\/css_modules\/inserted_style_mobile\.css/i.test(css) ? "" : '<link href="' + prefix + '-/s/style-mobile.css" rel="stylesheet" type="text/css">\r\n';
            css += /-\/s\/css_modules\/mobile\.css/i.test(css) ? "" : '<link href="' + prefix + '-/s/css_modules/mobile.css" rel="stylesheet" type="text/css">\r\n';
        }
        if (cc || (zim == "desktop")) { //If user requested cached styles OR the ZIM does not contain mobile styles
            console.log(zim == "desktop" ? "Transforming display style to mobile..." : "Optimizing cached styles for mobile display...");
            uiUtil.poll(zim == "desktop" ? "Transforming display style to mobile..." : "Optimizing cached styles for mobile display...");
            //Add styling to image captions that is hard-coded in Wikipedia mobile
            html = html.replace(/class\s*=\s*["']\s*thumbcaption\s*["']\s*/ig, 'style="margin: 0.5em 0 0.5em; font-size: 0.8em; line-height: 1.5; padding: 0 !important; color: #54595d; width: auto !important;"');
            //Wrap <h2> tags in <div> to control bottom border width if there's an infobox, but not if it's a new-style ZIM with collapsible details tags
            if (!/<details[\s\S]+?<summary\b/i.test(html)) {
                html = /table\s+(?=[^>]*class\s*=\s*["'][^"']*(?:mw-stack|infobox|vertical-navbox|qbRight|wv-quickbar))/i.test(html) ? html.replace(/(<h2\s+[^<]*<\/h2>)/ig, '<div style="width: 60%;">$1</div>') : html;
            }
            if (zim == "desktop") {
                var infobox = [];
                if (/<table\b[^>]+(?:mw-stack|infobox|vertical-navbox|qbRight|wv-quickbar)/i.test(html)) {
                    infobox = util.matchOuter(html, '<table\\b[^>]+(?:mw-stack|infobox|vertical-navbox|qbRight|wv-quickbar)[^>]+>', '</table>', 'i');
                } else {
                    if (/<div\b[^>]+(?:infobox|vertical-navbox|qbRight|wv-quickbar)/i.test(html)) {
                        infobox = util.matchOuter(html, '<div\\b[^>]+(?:infobox|vertical-navbox|qbRight|wv-quickbar)[^>]+>', '</div>', 'i');
                    }
                }
                if (infobox.length) {
                    var temphtml = html.replace(infobox[0], "<!-- @@@kiwixmarker@@@ -->");
                    var paras = util.matchInner(temphtml, '<p\\b[^>]*>', '</p>', 'gi');
                    var matched = false;
                    if (paras.length) {
                        for (var g = 0; g < 3; g++) {
                            //Check if the paragraph is a proper sentence, i.e. contains at least 50 non-HTML-delimetered non-full-stop characters, followed by a punctuation character
                            if (paras[g] && /[^.]{50,}[^.]*[.,;:?!-]/.test(paras[g].replace(/<[^>]*>/g, ""))) { matched = true; break; }
                        }
                        if (matched) {
                            //If there are navboxes below the infobox, hide them in mobile view
                            temphtml = temphtml.replace(/(<div\b(?=[^>]+navbox))(?:([^>]+?)style\s*=\s*["']([^"']+)["'])?/ig, '$1$2style="display:none;$3"');
                            //Ensure mobile styling in infobox
                            infobox[0] = infobox[0].replace(/(<(?:table|div)\b(?=[^>]+?class\s*=\s*["'][^"']*(?:mw-stack|infobox|navbox)))([^>]+?style\s*=\s*["'])(?:([^"']*?)margin\s*:[^;"']*[;"'])?/ig, '$1$2margin:0 auto;$3');
                            //Clear any fixed width but set it to max-width
                            infobox[0] = infobox[0].replace(/^(<(?:table|div)\b[^>]+?;\s*width\s*:\s*)([^;"']+)/i, '$1auto;max-width:$2');
                            //Hide any navboxes inside the infobox
                            infobox[0] = infobox[0].replace(/(<(?:table|div)\b(?=[^>]+?class\s*=\s*["'][^"']*navbox))(?:([^>]+?)style\s*=\s*["'])(?:([^"']*?)display\s*:[^;"']*[;"'])?/ig, '$1$2style="display:none;$3');
                            //We already deleted the table above
                            html = "";
                            //First try to move the lead paragraph 
                            html = temphtml.replace(/(<div\s+[^>]*?\bid\s*=\s*["']mw-content-text\s*[^>]*>\s*)/i, "$1\r\n" + paras[g].replace(/(<p\s+)/i, '$1data-kiwix-id="lead" ') + "\r\n");
                            if (html) { //Looks like we succeeded so clean up
                                html = html.replace(paras[g], "");
                                html = html.replace("<!-- @@@kiwixmarker@@@ -->", infobox[0]);
                            } else {
                                //So there was no match, let's try just swapping para and infobox
                                html = temphtml.replace(paras[g], paras[g].replace(/(<p\s+)/i, '$1data-kiwix-id="lead" ') + "\r\n" + infobox[0]);
                                html = html.replace("<!-- @@@kiwixmarker@@@ -->", "");
                            }
                        }
                    }
                }
            }
            //Set infobox styling hard-coded in Wikipedia mobile
            html = html.replace(/(table\s+(?=[^>]*class\s*=\s*["'][^"']*(?:mw-stack|infobox|vertical-navbox|qbRight|wv-quickbar))[^>]*style\s*=\s*["'][^"']+[^;'"]);?\s*["']/ig, '$1; position: relative; border: 1px solid #eaecf0; text-align: left; background-color: #f8f9fa;"');
        }
        //Remove hard-coded style on h1
        html = html.replace(/(<h1\b[^>]+)background-color\s*:\s*white;\s*/i, '$1');
        
        return { html : html, css : css };
    }

    function toDesktopCSS(html, zim, cc, cs, css) {
        if (cc || (zim != cs)) {
            if (/class\s*=\s*["']gallery/i.test(html) && !/gallery/i.test(css)) {
                console.log("Inserting missing css required for gallery display [mediawiki.page.gallery.styles.css]...");
                uiUtil.poll("Inserting missing css [mediawiki.page.gallery.styles.css]...");
                css += /-\/s\/css_modules\/mediawiki\.page\.gallery\.styles\.css/i.test(css) ? "" : '<link href="' + prefix + '-/s/css_modules/mediawiki.page.gallery.styles.css" rel="stylesheet" type="text/css">\r\n';
            }
        }
        if (cc || (zim == "mobile")) { //If user requested cached styles OR the ZIM does not contain desktop styles
            console.log(zim == "mobile" ? "Transforming display style to desktop..." : "Optimizing cached styles for desktop display...");
            uiUtil.poll(zim == "mobile" ? "Transforming display style to desktop..." : "Optimizing cached styles for desktop display...");
            //If it's in mobile position, move info-box above lead paragraph like on Wikipedia desktop
            if (zim == "mobile") {
                //Attempt to match div-style infobox first
                var tableBox = util.matchOuter(html, '<div\\b[^>]+?(?:infobox|vertical-navbox|qbRight|wv-quickbar)[^>]+>', '</div>', 'i');
                //If above failed we may have traditional table-style infobox
                tableBox = !(tableBox && tableBox.length) ? util.matchOuter(html, '<table\\b[^>]+?(?:mw-stack|infobox|vertical-navbox|qbRight|wv-quickbar)[^>]+>', '</table>', 'i') : tableBox;
                if (tableBox && tableBox.length) {
                    html = html.replace(tableBox, "");
                    html = html.replace(/(<\/h1>\s*)/i, "$1" + tableBox);
                }
            }
            //Ensure white background colour
            html = html.replace(/(class\s*=\s*["']\s*mw-body\s*["'][^>]*?style\s*=\s*["'])/i, "$1background-color:white;");
            //Void empty header title
            html = html.replace(/<h1\s*[^>]+titleHeading[^>]+>\s*<\/h1>\s*/ig, "");
        }
        //Remove hard-coded style on h1
        html = html.replace(/(<h1\b[^>]+)background-color\s*:\s*white;\s*/i, '$1');
        //Remove hard-coded style on infobox
        html = html.replace(/(<table\s+(?=[^>]*?\bclass=['"][^'"]*infobox)[^>]*\bstyle=['"][^'"]*\b)(?:float:\s*none\s*;?\s*)(?:clear:\s*none\s*;?\s*)?/gi, '$1');
        //Remove any residual references to mobile styles (e.g. in data-kiwixhref) because they trigger page reload when printing
        css = css.replace(/(<link\b[^>]+)(minerva|mobile)/ig, '$1');
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