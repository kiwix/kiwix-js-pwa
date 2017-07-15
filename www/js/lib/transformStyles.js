/**
 * transformCSS.js: Provides transformations in CSS of Wikipedia articles contained in the ZIM file
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
define([], function () {

    function toMobileCSS(html, zim, cc, css) {
        css += css.match(/-\/s\/css_modules\/content\.parsoid\.css/i) ? "" : '<link href="../-/s/css_modules/content.parsoid.css" rel="stylesheet" type="text/css">\r\n';
        css += css.match(/-\/s\/css_modules\/inserted_style_mobile\.css/i) ? "" : '<link href="../-/s/css_modules/inserted_style_mobile.css" rel="stylesheet" type="text/css">\r\n';
        css += css.match(/-\/s\/css_modules\/mobile\.css/i) ? "" : '<link href="../-/s/css_modules/mobile.css" rel="stylesheet" type="text/css">\r\n';
        if (cc || (zim == "desktop")) { //If user requested cached styles OR the ZIM does not contain mobile styles
            console.log(zim == "desktop" ? "Transforming display style to mobile..." : "Optimizing cached styhles for mobile display...");
            //Allow images to float right or left
            html = html.replace(/class\s*=\s*["']\s*thumb\s+tright\s*["']\s*/ig, 'style="float: right; clear: right; margin-left: 1.4em;"');
            html = html.replace(/class\s*=\s*["']\s*thumb\s+tleft\s*["']\s*/ig, 'style="float: left; clear: left; margin-right: 1.4em;"');
            //Add styling to image captions that is hard-coded in Wikipedia mobile
            html = html.replace(/class\s*=\s*["']\s*thumbcaption\s*["']\s*/ig, 'style="margin: 0.5em 0 0.5em; font-size: 0.8em; line-height: 1.5; padding: 0 !important; color: #54595d; width: auto !important;"');
            //If it's in desktop position, move info-box below lead paragraph like on Wikipedia mobile
            html = /<\/p>[\s\S]*?<table\s+[^>]*(?:infobox|vertical-navbox)/i.test(html) ? html : html.replace(/(<table\s+(?=[^>]*(?:infobox|vertical-navbox))[\s\S]+?<\/table>[^<]*)((?:<span\s*>\s*)?<p\b[^>]*>(?:(?=([^<]+))\3|<(?!p\b[^>]*>))*?<\/p>(?:<span\s*>)?)/i, "$2\r\n$1");
            //Set infobox styling hard-coded in Wikipedia mobile
            html = html.replace(/(table\s+(?=[^>]*class\s*=\s*["'][^"']*infobox)[^>]*style\s*=\s*["'][^"']+[^;'"]);?\s*["']/ig, '$1; position: relative; border: 1px solid #eaecf0; text-align: left; background-color: #f8f9fa;"');
            //Wrap <h2> tags in <div> to control bottom border width if there's an infobox
            html = html.match(/table\s+(?=[^>]*class\s*=\s*["'][^"']*infobox)/i) ? html.replace(/(<h2\s+[^<]*<\/h2>)/ig, '<div style="width: 60%;">$1</div>') : html;
        }
        return { html: html, css: css };
    }

    function toDesktopCSS(html, zim, cc, css) {
        if (cc || (zim == "mobile")) { //If user requested cached styles OR the ZIM does not contain desktop styles
            console.log(zim == "mobile" ? "Transforming display style to desktop..." : "Optimizing cached styhles for desktop display...");
            //If it's in mobile position, move info-box above lead paragraph like on Wikipedia desktop
            //html = html.replace(/((?:<span\s*>\s*)?<p\b[^>]*>(?:(?=([^<]+))\2|<(?!p\b[^>]*>))*?<\/p>(?:<\/span\s*>)?[^<]*)([\s\S]*?)(<table\s*(?=[^>]*infobox)[\s\S]+?<\/table>)/i, "$4$3$1");
            html = html.replace(/((?:<span\s*>\s*)?<p\b[\s\S]+?)(<table\s*(?=[^>]*(?:infobox|vertical-navbox))[\s\S]+?<\/table>)/i, "$2\r\n$1");
            //Ensure white background colour
            html = html.replace(/class\s*=\s*["']\s*mw-body\s*["']\s*/ig, 'style="background-color: white; padding: 1em; border-width: 0px; max-width: 55.8em; margin: 0 auto 0 auto;"');
            //Void empty header title
            html = html.replace(/<h1\s*[^>]+titleHeading[^>]+>\s*<\/h1>\s*/ig, "");
        }
        return { html : html, css : css };
    }

    /**
    * Functions and classes exposed by this module
    */
    return {
        toMobileCSS: toMobileCSS,
        toDesktopCSS: toDesktopCSS
    };
});