/**
 * uiUtil.js : Utility functions for the User Interface
 * 
 * Copyright 2013-2014 Mossroy and contributors
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
define([], function() {
    
    /**
     * Creates a Blob from the given content, then a URL from this Blob
     * And put this URL in the attribute of the DOM node
     * 
     * This is useful to inject images (and other dependencies) inside an article
     * 
     * @param {Object} jQueryNode
     * @param {String} nodeAttribute
     * @param {Uint8Array} content
     * @param {String} mimeType
     */
    function feedNodeWithBlob(jQueryNode, nodeAttribute, content, mimeType) {
        var blob = new Blob([content], { type: mimeType }, {oneTimeOnly: true});
        var url = URL.createObjectURL(blob);
        /*jQueryNode.on('load', function () {
            URL.revokeObjectURL(url);
        });*/
        jQueryNode.attr(nodeAttribute, url);
    }
        
    var regexpRemoveUrlParameters = new RegExp(/([^\?]+)\?.*$/);
    
    function removeUrlParameters(url) {
        if (regexpRemoveUrlParameters.test(url)) {
            return regexpRemoveUrlParameters.exec(url)[1];
        } else {
            return url;
        }
    }

    function TableOfContents(articleDoc) {
        this.doc = articleDoc;
        this.headings = this.doc.querySelectorAll("h1, h2, h3, h4, h5, h6");

        this.getHeadingObjects = function () {
            var headings = [];
            for (var i = 0; i < this.headings.length; i++) { 
                var element = this.headings[i];
                var obj = {};
                obj.id = element.id;
                var objectId = element.innerHTML.match(/\bid\s*=\s*["']\s*([^"']+?)\s*["']/i);
                obj.id = obj.id ? obj.id : objectId && objectId.length > 1 ? objectId[1] : "";
                obj.index = i;
                obj.textContent = element.textContent;
                obj.tagName = element.tagName;
                headings.push(obj);
            }
            return headings;
        }
    }

    /**
     * Checks whether an element is fully or partially in view
     * This is useful for progressive download of images inside an article
     *
     * @param {Object} el
     * @param {Boolean} fully
     */
    function isElementInView(el, fully) {
        var elemTop = el.getBoundingClientRect().top;
        var elemBottom = el.getBoundingClientRect().bottom;

        var isVisible = fully ? elemTop < window.innerHeight && elemBottom >= 0 :
            elemTop >= 0 && elemBottom <= window.innerHeight;
        return isVisible;
    }


    function makeReturnLink(title) {
        //Abbreviate title if necessary
        var shortTitle = title.substring(0, 25);
        shortTitle = shortTitle == title ? shortTitle : shortTitle + "..."; 
        var link = '<h4 style="font-size:' + ~~(params.relativeUIFontSize * 1.4 * 0.14) + 'px;"><a href="#">&lt;&lt; Return to ' + shortTitle + '</a></h4>';
        var rtnFunction = "(function () { setTab(); \
            if (params.themeChanged) { \
                params.themeChanged = false; \
                if (history.state !== null) {  \
                    var thisURL = decodeURIComponent(history.state.title); \
                    goToArticle(thisURL); \
                } \
            } \
        })";
        var returnDivs = document.getElementsByClassName("returntoArticle");
        for (var i = 0; i < returnDivs.length; i++) {
            returnDivs[i].innerHTML = link;
        }
        return rtnFunction;
    }

    function poll(msg) {
        document.getElementById("progressMessage").innerHTML += '<p>' + msg + '</p>';
    }

    function clear() {
        document.getElementById("progressMessage").innerHTML = "<p></p>";
    }

    /**
  * Initiates XMLHttpRequest
  * Can be used for loading local files in app context
  *
  * @param {String} file
  * @param {Function} callback
  * @returns responseText, status
  */
    function XHR(file, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (e) {
            if (this.readyState == 4) {
                callback(this.responseText, this.status);
            }
        };
        var err = false;
        try {
            xhr.open('GET', file, true);
        }
        catch (e) {
            console.log("Exception during GET request: " + e);
            err = true;
        }
        if (!err) {
            xhr.send();
        } else {
            callback("Error", 500);
        }
    }

    function printCustomElements() {
        var innerDocument = window.frames[0].frameElement.contentDocument;
        //Add any missing classes
        innerDocument.body.innerHTML = innerDocument.body.innerHTML.replace(/(<h2\b[^<]+external_links(?:[^<]|<\/)+<ul\s+(?!class="externalLinks"))/i, '$1class="externalLinks" ');
        innerDocument.body.innerHTML = innerDocument.body.innerHTML.replace(/(<h2\b[^<]+see_also(?:[^<]|<\/)+<ul\s+(?!class="seeAlso"))/i, '$1class="seeAlso" ');
        innerDocument.body.innerHTML = innerDocument.body.innerHTML.replace(/(<div\s+)([^>]+>\s+This article is issued from)/i, '$1class="copyLeft" $2');
        var printOptions = innerDocument.getElementById("printOptions");
        //If there is no printOptions style block in the iframe, create it
        if (!printOptions) {
            var printStyle = innerDocument.createElement("style");
            printStyle.id = "printOptions";
            innerDocument.head.appendChild(printStyle);
            printOptions = innerDocument.getElementById("printOptions");
        }
        var printStyleInnerHTML = "@media print { ";
        printStyleInnerHTML += document.getElementById("printNavBoxCheck").checked ? "" : ".navbox, .vertical-navbox { display: none; } ";
        printStyleInnerHTML += document.getElementById("printEndNoteCheck").checked ? "" : ".reflist { display: none; } ";
        printStyleInnerHTML += document.getElementById("externalLinkCheck").checked ? "" : ".externalLinks { display: none; } ";
        printStyleInnerHTML += document.getElementById("seeAlsoLinkCheck").checked ? "" : ".seeAlso { display: none; } ";
        printStyleInnerHTML += document.getElementById("printInfoboxCheck").checked ? "" : ".mw-stack, .infobox, .infobox_v2, .infobox_v3, .qbRight, .qbRightDiv, .wv-quickbar, .wikitable { display: none; } ";
        printStyleInnerHTML += document.getElementById("printImageCheck").checked ? "" : "img { display: none; } ";
        printStyleInnerHTML += ".copyLeft { display: none } ";
        var sliderVal = document.getElementById("documentZoomSlider").value;
        sliderVal = ~~sliderVal;
        sliderVal = Math.floor(sliderVal * (Math.max(window.screen.width, window.screen.height) / 1440)); 
        printStyleInnerHTML += "body { font-size: " + sliderVal + "% !important; } ";
        printStyleInnerHTML += "}";
        printOptions.innerHTML = printStyleInnerHTML;
        //innerDocument.execCommand("print", false, null);
        window.frames[0].frameElement.contentWindow.print();
    }

    /**
     * Functions and classes exposed by this module
     */
    return {
        feedNodeWithBlob: feedNodeWithBlob,
        removeUrlParameters: removeUrlParameters,
        toc: TableOfContents,
        isElementInView: isElementInView,
        makeReturnLink: makeReturnLink,
        poll: poll,
        clear: clear,
        XHR: XHR,
        printCustomElements: printCustomElements
    };
});
