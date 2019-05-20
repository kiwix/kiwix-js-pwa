/**
 * app.js : User Interface implementation
 * This file handles the interaction between the application and the user
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

// This uses require.js to structure javascript:
// http://requirejs.org/docs/api.html#define

define(['jquery', 'zimArchiveLoader', 'util', 'uiUtil', 'cookies', 'q', 'module', 'transformStyles', 'kiwixServe'],
    function ($, zimArchiveLoader, util, uiUtil, cookies, q, module, transformStyles, kiwixServe) {

        /**
         * Maximum number of articles to display in a search
         * @type Integer
         */
        var MAX_SEARCH_RESULT_SIZE = params.results; //This value is controlled in init.js, as are all parameters

        /**
         * @type ZIMArchive
         */
        var selectedArchive = null;

        // Define globalDropZone (universal drop area) and configDropZone (highlighting area on Config page)
        var globalDropZone = document.getElementById('search-article');
        var scrollBoxDropZone = document.getElementById('scrollbox');
        var configDropZone = document.getElementById('configuration');

        /**
         * Resize the IFrame height, so that it fills the whole available height in the window
         */
        function resizeIFrame() {
            var height = $(window).outerHeight()
                //- $("#top").outerHeight(true)
                // TODO : this 5 should be dynamically computed, and not hard-coded
                //- 5;
                +
                10; //Try adding extra space to get pesky x-scrollbar out of way
            $(".articleIFrame").css("height", height + "px");
            if (params.hideToolbar && document.getElementById('articleContent').style.display == "none") document.getElementById('scrollbox').style.height = height + "px";
            var ToCList = document.getElementById('ToCList');
            if (typeof ToCList !== "undefined") {
                ToCList.style.maxHeight = ~~(window.innerHeight * 0.75) + 'px';
                ToCList.style.marginLeft = ~~(window.innerWidth / 2) - ~~(window.innerWidth * 0.16) + 'px';
            }
            if (window.outerWidth <= 470) {
                document.getElementById('dropup').classList.remove('col-xs-4');
                document.getElementById('dropup').classList.add('col-xs-3');
                //var colXS2 = document.querySelectorAll('.col-xs-2');
                //if (colXS2.length && window.outerWidth <= 360) {
                //    for (var i = 0; i < colXS2.length; i++) {
                //        colXS2[i].classList.remove('col-xs-2');
                //        colXS2[i].classList.add('col-xs-1');
                //    }
                if (window.outerWidth <= 360) {
                    //document.getElementById('btnHomeBottom').classList.remove('col-xs-2');
                    //document.getElementById('btnHomeBottom').classList.add('col-xs-1');
                    document.getElementById('btnTop').classList.remove('col-xs-2');
                    document.getElementById('btnTop').classList.add('col-xs-1');
                    //} else if (window.outerWidth > 360 && !colXS2.length) {
                } else {
                    //document.getElementById('btnHomeBottom').classList.remove('col-xs-1');
                    //document.getElementById('btnHomeBottom').classList.add('col-xs-2');
                    document.getElementById('btnTop').classList.remove('col-xs-1');
                    document.getElementById('btnTop').classList.add('col-xs-2');
                }
            } else {
                document.getElementById('dropup').classList.remove('col-xs-3');
                document.getElementById('dropup').classList.add('col-xs-4');
            }
        }
        $(document).ready(resizeIFrame);
        $(window).resize(resizeIFrame);

        //Polyfill scrollStopped event
        $.fn.scrollStopped = function (callback) {
            var that = this,
                $this = $(that);
            $this.scroll(function (ev) {
                clearTimeout($this.data('scrollTimeout'));
                $this.data('scrollTimeout', setTimeout(callback.bind(that), 250, ev));
            });
        };

        // Define behavior of HTML elements
        document.getElementById('searchArticles').addEventListener('click', function () {
            $("#welcomeText").hide();
            $('.alert').hide();
            document.getElementById('searchingArticles').style.display = 'block';
            pushBrowserHistoryState(null, $('#prefix').val());
            searchDirEntriesFromPrefix($('#prefix').val());
            clearFindInArticle();
            //Re-enable top-level scrolling
            document.getElementById('top').style.position = "relative";
            document.getElementById('scrollbox').style.position = "fixed";
            document.getElementById('scrollbox').style.height = window.innerHeight + "px";
            //document.getElementById('search-article').style.overflow = "auto";
            if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
                $('#navbarToggle').click();
            }
        });
        document.getElementById('formArticleSearch').addEventListener('submit', function () {
            document.getElementById("searchArticles").click();
        });
        var keyPressHandled = false;
        $('#prefix').on('keydown', function (e) {
            if (/^Esc/.test(e.key)) {
                // Hide the article list
                e.preventDefault();
                e.stopPropagation();
                $('#articleListWithHeader').hide();
                document.getElementById('articleContent').style.position = 'fixed';
                $('#articleContent').focus();
                $("#myModal").modal('hide'); // This is in case the modal box is showing with an index search
                keyPressHandled = true;
            }
            // Arrow-key selection code adapted from https://stackoverflow.com/a/14747926/9727685
            // IE11 produces "Down" instead of "ArrowDown" and "Up" instead of "ArrowUp"
            if (/^((Arrow)?Down|(Arrow)?Up|Enter)$/.test(e.key)) {
                // User pressed Down arrow or Up arrow or Enter
                e.preventDefault();
                e.stopPropagation();
                // This is needed to prevent processing in the keyup event : https://stackoverflow.com/questions/9951274
                keyPressHandled = true;
                var activeElement = document.querySelector("#articleList .hover") || document.querySelector("#articleList a");
                if (!activeElement) return;
                // If user presses Enter, read the dirEntry
                if (/Enter/.test(e.key)) {
                    if (activeElement.classList.contains('hover')) {
                        var dirEntryId = activeElement.getAttribute('dirEntryId');
                        findDirEntryFromDirEntryIdAndLaunchArticleRead(dirEntryId);
                        return;
                    }
                }
                // If user presses ArrowDown...
                // (NB selection is limited to five possibilities by regex above)
                if (/Down/.test(e.key)) {
                    if (activeElement.classList.contains('hover')) {
                        activeElement.classList.remove('hover');
                        activeElement = activeElement.nextElementSibling || activeElement;
                        var nextElement = activeElement.nextElementSibling || activeElement;
                        if (!uiUtil.isElementInView(nextElement, true)) nextElement.scrollIntoView(false);
                    }
                }
                // If user presses ArrowUp...
                if (/Up/.test(e.key)) {
                    activeElement.classList.remove('hover');
                    activeElement = activeElement.previousElementSibling || activeElement;
                    var previousElement = activeElement.previousElementSibling || activeElement;
                    if (!uiUtil.isElementInView(previousElement, true)) previousElement.scrollIntoView();
                    if (previousElement === activeElement) {
                        document.getElementById('articleListWithHeader').scrollIntoView();
                        document.getElementById('top').scrollIntoView();
                    }
                }
                activeElement.classList.add('hover');
            }
        });
        // Search for titles as user types characters
        $('#prefix').on('keyup', function (e) {
            if (selectedArchive !== null && selectedArchive.isReady()) {
                // Prevent processing by keyup event if we already handled the keypress in keydown event
                if (keyPressHandled)
                    keyPressHandled = false;
                else
                    onKeyUpPrefix(e);
            }
        });
        // Restore the search results if user goes back into prefix field
        $('#prefix').on('focus', function (e) {
            var prefixVal = $('#prefix').val();
            if (/^\s/.test(prefixVal)) {
                // If user had previously had the archive index open, clear it
                document.getElementById('prefix').value = '';
            } else if (prefixVal !== '') {
                $('#articleListWithHeader').show();
                document.getElementById('articleContent').style.position = 'static';
            }
        });
        // Hide the search resutls if user moves out of prefix field
        $('#prefix').on('blur', function() {
            $('#articleListWithHeader').hide();
            document.getElementById('articleContent').style.position = 'fixed';
        });

        //Add keyboard shortcuts
        window.addEventListener('keyup', function (e) {
            var e = e || window.event;
            //Alt-F for search in article, also patches Ctrl-F for apps that do not have access to browser search
            if ((e.ctrlKey || e.altKey) && e.which == 70) {
                document.getElementById('findText').click();
            }
        });

        window.addEventListener('keydown', function (e) {
            //Ctrl-P to patch printing support, so iframe gets printed
            if (e.ctrlKey && e.which == 80) {
                e.stopPropagation();
                e.preventDefault();
                printIntercept();
            }
        }, true);

        //Set up listeners for print dialogues
        //$("#printModal").off('hide.bs.modal');
        $("#printModal").on('hide.bs.modal', function () {
            //Restore temporarily changed values
            params.cssSource = cookies.getItem('cssSource') || "auto";
            if (document.activeElement.id != "confirm-print-continue") { //User cancelled
                if (params.printInterception) {
                    printCleanup();
                    return;
                }
                //We don't need a radical cleanup because there was no printIntercept
                removePageMaxWidth();
                setTab();
                return;
            }
            uiUtil.printCustomElements();
            document.getElementById("alert-content").innerHTML = "<b>Document will now reload to restore the DOM after printing...</b>";
            $("#alertModal").off('hide.bs.modal');
            $("#alertModal").on('hide.bs.modal', function () {
                printCleanup();
            });
            $("#alertModal").modal({
                backdrop: "static",
                keyboard: true
            });
            //innerDocument.execCommand("print", false, null);
            window.frames[0].frameElement.contentWindow.print();
        });
        document.getElementById('printDesktopCheck').addEventListener('click', function (e) {
            //Reload article if user wants to print a different style
            params.cssSource = e.target.checked ? "desktop" : "mobile";
            params.printIntercept = true;
            params.printInterception = false;
            var btnContinue = document.getElementById('confirm-print-continue');
            var btnCancel = document.getElementById('confirm-print-cancel');
            btnCancel.disabled = true;
            btnContinue.disabled = true;
            btnContinue.innerHTML = "Please wait";
            goToArticle(decodeURIComponent(params.lastPageVisit.replace(/@kiwixKey@.+/, "")));
        });

        function printCleanup() {
            params.printIntercept = false;
            params.printInterception = false;
            goToArticle(decodeURIComponent(params.lastPageVisit.replace(/@kiwixKey@.+/, "")));
            setTimeout(function () { //Restore temporarily changed value after page has reloaded
                params.rememberLastPage = cookies.getItem('rememberLastPage') == "false" ? false : true;
                if (!params.rememberLastPage) {
                    cookies.setItem('lastPageVisit', "", Infinity);
                    if (typeof Storage !== "undefined") {
                        try {
                            localStorage.setItem('lastPageHTML', "");
                        } catch (err) {
                            console.log("localStorage not supported: " + err);
                        }
                    }
                }
            }, 5000);
        }
        //End of listeners for print dialogues

        function printIntercept() {
            params.printInterception = params.printIntercept;
            params.printIntercept = false;
            document.getElementById('btnAbout').classList.add('active');
            var btnContinue = document.getElementById('confirm-print-continue');
            var btnCancel = document.getElementById('confirm-print-cancel');
            btnCancel.disabled = false;
            btnContinue.disabled = false;
            btnContinue.innerHTML = "Continue";
            var printModalContent = document.getElementById('print-modal-content');
            printModalContent.classList.remove('dark');
            var determinedTheme = params.cssUITheme;
            determinedTheme = determinedTheme == 'auto' ? cssUIThemeGetOrSet('auto', true) : determinedTheme;
            if (determinedTheme != "light") {
                printModalContent.classList.add('dark');
            }
            //If document is in wrong style, reload it
            var innerDoc = window.frames[0].frameElement.contentDocument;
            var styleIsDesktop = !/\bhref\s*=\s*["'][^"']*?(?:minerva|mobile)/i.test(innerDoc.head.innerHTML);
            if (styleIsDesktop != document.getElementById("printDesktopCheck").checked) {
                //We need to reload the document because it doesn't match the requested style
                params.cssSource = styleIsDesktop ? "mobile" : "desktop";
                params.rememberLastPage = true; //Re-enable caching to speed up reloading of page
                params.printIntercept = true;
                params.printInterception = false;
                btnCancel.disabled = true;
                btnContinue.disabled = true;
                btnContinue.innerHTML = "Please wait";
                $("#printModal").modal({
                    backdrop: "static",
                    keyboard: true
                });
                goToArticle(decodeURIComponent(params.lastPageVisit.replace(/@kiwixKey@.+/, "")));
                return;
            }
            //Pre-load all images in case user wants to print them
            if (params.imageDisplay) {
                loadImagesJQuery(10000);
                document.getElementById("printImageCheck").disabled = false;
            } else {
                document.getElementById("printImageCheck").checked = false;
                document.getElementById("printImageCheck").disabled = true;
            }
            //Remove max page-width restriction
            if (params.removePageMaxWidth !== true) {
                var tempPageMaxWidth = params.removePageMaxWidth;
                params.removePageMaxWidth = true;
                removePageMaxWidth();
                params.removePageMaxWidth = tempPageMaxWidth;
            }
            $("#printModal").modal({
                backdrop: "static",
                keyboard: true
            });
        }

        //Establish some variables with global scope
        var firstRun = false;
        var localSearch = {};


        function clearFindInArticle() {
            if (document.getElementById('row2').style.display == "none") return;
            if (typeof localSearch !== "undefined" && localSearch.remove) {
                localSearch.remove();
            }
            document.getElementById('findInArticle').value = "";
            document.getElementById('matches').innerHTML = "Full: 0";
            document.getElementById('partial').innerHTML = "Partial: 0";
            document.getElementById('row2').style.display = "none";
            document.getElementById('findText').classList.remove("active");
        }

        document.getElementById('findText').addEventListener('click', function () {
            var searchDiv = document.getElementById('row2');
            if (searchDiv.style.display != "none") {
                setTab();
                return;
            }
            var findInArticle = null;
            var innerDocument = window.frames[0].frameElement.contentDocument;
            innerDocument = innerDocument ? innerDocument.body : null;
            if (!innerDocument || innerDocument.innerHTML.length < 10) return;
            setTab('findText');
            findInArticle = document.getElementById('findInArticle');
            searchDiv.style.display = "block";
            findInArticle.focus();
            localSearch = new util.Hilitor(innerDocument);
            //TODO: MatchType should be language specific
            var timer = null;
            findInArticle.addEventListener('keyup', function (e) {
                //If user pressed Alt-F or Ctrl-F, exit
                if ((e.altKey || e.ctrlKey) && e.which == 70) return;
                var val = this.value;
                //If user pressed enter / return key
                if (val && e.which == 13) {
                    localSearch.scrollFrom = localSearch.scrollToFullMatch(val, localSearch.scrollFrom);
                    return;
                }
                //If value hasn't changed, exit
                if (val == localSearch.lastScrollValue) return;
                findInArticleKeyup(val);
            });
            var findInArticleKeyup = function (val) {
                // Use a timeout, so that very quick typing does not cause a lot of overhead
                if (window.timeoutFIAKeyup) {
                    window.clearTimeout(window.timeoutFIAKeyup);
                }
                window.timeoutFIAKeyup = window.setTimeout(function () {
                    findInArticleInitiate(val);
                }, 500);
            };
            var findInArticleInitiate = function (val) {
                //Ensure nothing happens if only one or two ASCII values have been entered (search is not specific enough) 
                //if no value has been entered (clears highlighting if user deletes all values in search field)
                if (!/^\s*[A-Za-z\s]{1,2}$/.test(val)) {
                    localSearch.scrollFrom = 0;
                    localSearch.lastScrollValue = val;
                    localSearch.setMatchType('open');
                    //Change matchType to 'left' if we are dealing with an ASCII language and a space has been typed
                    if (/\s/.test(val) && /(?:^|[\s\b])[A-Za-z]+(?:[\b\s]|$)/.test(val)) localSearch.setMatchType('left');
                    localSearch.apply(val);
                    if (val.length) {
                        var fullTotal = localSearch.countFullMatches(val);
                        var partialTotal = localSearch.countPartialMatches();
                        fullTotal = fullTotal > partialTotal ? partialTotal : fullTotal;
                        document.getElementById('matches').innerHTML = '<a id="scrollLink" href="#">Full: ' + fullTotal + '</a>';
                        document.getElementById('partial').innerHTML = "Partial: " + partialTotal;
                        document.getElementById('scrollLink').addEventListener('click', function () {
                            localSearch.scrollFrom = localSearch.scrollToFullMatch(val, localSearch.scrollFrom);
                        });
                        //Auto-scroll: TODO - consider making this an option
                        localSearch.scrollFrom = localSearch.scrollToFullMatch(val, localSearch.scrollFrom);
                    } else {
                        document.getElementById('matches').innerHTML = "Full: 0";
                        document.getElementById('partial').innerHTML = "Partial: 0";
                    }
                }
            };
        });

        document.getElementById('btnRandomArticle').addEventListener('click', function () {
            setTab('btnRandomArticle');
            //Re-enable top-level scrolling
            document.getElementById('top').style.position = "relative";
            document.getElementById('scrollbox').style.position = "fixed";
            document.getElementById('scrollbox').style.height = window.innerHeight + "px";
            goToRandomArticle();
        });

        document.getElementById('btnRescanDeviceStorage').addEventListener("click", function () {
            var returnDivs = document.getElementsByClassName("returntoArticle");
            for (var i = 0; i < returnDivs.length; i++) {
                returnDivs[i].innerHTML = "";
            }
            params.rescan = true;
            //Reload any ZIM files in local storage (whcih the usar can't otherwise select with the filepicker)
            loadPackagedArchive();
            if (storages.length) {
                searchForArchivesInStorage();
            } else {
                displayFileSelect();
            }
        });
        // Bottom bar :
        // @TODO Since bottom bar now hidden in Settings and About the returntoArticle code cannot be accessed;
        // consider adding it to top home button instead
        document.getElementById('btnBack').addEventListener('click', function () {
            if (document.getElementById('articleContent').style.display == "none") {
                document.getElementById('returntoArticle').click();
                return;
            }
            clearFindInArticle();
            history.back();
            return;
        });
        document.getElementById('btnForward').addEventListener('click', function () {
            clearFindInArticle();
            history.forward();
        });
        document.getElementById('articleContent').contentDocument.body.style.fontSize = params.relativeFontSize + "%";
        document.getElementById('btnZoomin').addEventListener('click', function () {
            params.relativeFontSize += 5;
            var doc = document.getElementById('articleContent').contentDocument;
            doc.body.style.fontSize = /-\/static\/main\.css/.test(doc.head.innerHTML) ? params.relativeFontSize * 1.5 + "%" : params.relativeFontSize + "%";
            document.getElementById('lblZoom').innerHTML = params.relativeFontSize + "%";
            document.getElementById('lblZoom').style = "position:absolute;right: " + window.innerWidth / 3 + "px;bottom:5px;z-index:50;";
            setTimeout(function () {
                document.getElementById('lblZoom').innerHTML = "";
            }, 1000);
            cookies.setItem('relativeFontSize', params.relativeFontSize, Infinity);
        });
        document.getElementById('btnZoomout').addEventListener('click', function () {
            params.relativeFontSize -= 5;
            var doc = document.getElementById('articleContent').contentDocument;
            doc.body.style.fontSize = /-\/static\/main\.css/.test(doc.head.innerHTML) ? params.relativeFontSize * 1.5 + "%" : params.relativeFontSize + "%";
            document.getElementById('lblZoom').innerHTML = params.relativeFontSize + "%";
            document.getElementById('lblZoom').style = "position:absolute;left: " + window.innerWidth / 3 + "px;bottom:5px;z-index:50;";
            setTimeout(function () {
                document.getElementById('lblZoom').innerHTML = "";
            }, 1000);
            cookies.setItem('relativeFontSize', params.relativeFontSize, Infinity);
        });
        setRelativeUIFontSize(params.relativeUIFontSize);
        document.getElementById('relativeUIFontSizeSlider').addEventListener('change', function () {
            setRelativeUIFontSize(this.value);
        });

        function setRelativeUIFontSize(value) {
            value = ~~value;
            document.getElementById('spinnerVal').innerHTML = value + "%";
            document.getElementById('search-article').style.fontSize = value + "%";
            document.getElementById('relativeUIFontSizeSlider').value = value;
            var forms = document.querySelectorAll('.form-control');
            for (var i = 0; i < forms.length; i++) {
                forms[i].style.fontSize = ~~(value * 14 / 100) + "px";
            }
            var buttons = document.getElementsByClassName('btn');
            for (var i = 0; i < buttons.length; i++) {
                buttons[i].style.fontSize = buttons[i].id == "reloadPackagedArchive" ? ~~(value * 10 / 100) + "px" : ~~(value * 14 / 100) + "px";
            }
            var heads = document.querySelectorAll("h1, h2, h3, h4");
            for (var i = 0; i < heads.length; i++) {
                var multiplier = 1;
                var head = heads[i].tagName;
                multiplier = head == "H4" ? 1.4 : head == "H3" ? 1.9 : head == "H2" ? 2.3 : head == "H1" ? 2.8 : multiplier;
                heads[i].style.fontSize = ~~(value * 0.14 * multiplier) + "px";
            }
            document.getElementById('displaySettingsDiv').scrollIntoView();
            //document.getElementById('prefix').style.height = ~~(value * 14 / 100) * 1.4285 + 14 + "px";
            if (value != params.relativeUIFontSize) {
                params.relativeUIFontSize = value;
                cookies.setItem('relativeUIFontSize', value, Infinity);
            }
        }

        document.getElementById('btnHomeBottom').addEventListener('click', function () {
            document.getElementById('btnHome').click();
        });
        document.getElementById('btnTop').addEventListener('click', function () {
            //Ensures toolbar is shown after hidden
            var thisdoc = document.getElementById('top');
            if (params.hideToolbar && thisdoc.style.zIndex == "0") {
                params.hideToolbar = false;
                checkToolbar();
                params.hideToolbar = true;
                return;
            }
            document.getElementById('articleContent').contentWindow.scrollTo({ top: 0, behavior: 'smooth' });
            document.getElementById('search-article').scrollTop = 0;
        });
        // Top menu :
        document.getElementById('btnHome').addEventListener('click', function () {
            setTab('btnHome');
            // Give the focus to the search field, and clean up the page contents
            //if (!firstRun) {
            //    $('#prefix').focus();
            //}
            $('#articleContent').hide();
            $('#articleContent').contents().empty();
            $('#searchingArticles').hide();
            $('#welcomeText').show();
            //$('#articleList').show();
            //$('#articleListWithHeader').show();
            if (selectedArchive !== null && selectedArchive.isReady()) {
                $('#welcomeText').hide();
                goToMainArticle();
            }
        });

        function setTab(activeBtn) {
            // Highlight the selected section in the navbar
            $('#liHomeNav').attr("class", "active");
            $('#liConfigureNav').attr("class", "");
            $('#liAboutNav').attr("class", "");
            if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
                $('#navbarToggle').click();
            }
            setActiveBtn(activeBtn);
            var btnAbout = document.getElementById('btnAbout');
            if (!activeBtn || activeBtn == "btnHome" || activeBtn == "findText") {
                btnAbout.innerHTML = '<span class="glyphicon glyphicon-print"></span>';
                btnAbout.title = 'Ctrl-P: Print';
            } else {
                btnAbout.innerHTML = '<span class="glyphicon glyphicon-info-sign"></span>';
                btnAbout.title = 'About';
            }
            clearFindInArticle();
            //Re-enable bottom toolbar display
            document.getElementById('footer').style.display = "block";
            //Re-enable top-level scrolling
            document.getElementById('top').style.position = "relative";
            document.getElementById('scrollbox').style.position = "fixed";
            document.getElementById('scrollbox').style.height = window.innerHeight + "px";
            document.getElementById('articleContent').style.position = "fixed";
            //Use the "light" navbar if the content is "light" (otherwise it looks shite....)
            var determinedTheme = cssUIThemeGetOrSet(params.cssUITheme);
            var determinedWikiTheme = params.cssTheme == 'auto' ? determinedTheme : params.cssTheme == 'inverted' ? 'dark' : params.cssTheme;
            if (determinedWikiTheme != determinedTheme) {
                if (determinedWikiTheme == "light" && (!activeBtn || activeBtn == "btnHome" || activeBtn == "findText") ||
                    determinedWikiTheme == "dark" && activeBtn && activeBtn != "btnHome" && activeBtn != "findText") {
                    cssUIThemeGetOrSet("light");
                } else {
                    cssUIThemeGetOrSet("dark");
                }
            } else {
                cssUIThemeGetOrSet(determinedTheme);
            }
            if (typeof Windows !== 'undefined') {
                document.getElementById('openLocalFiles').style.display = params.rescan ? "block" : "none";
            }
            document.getElementById('libraryArea').style.borderColor = '';
            document.getElementById('libraryArea').style.borderStyle = '';
            var currentArchive = document.getElementById('currentArchive');
            if (params.packagedFile && params.storedFile && params.storedFile != params.packagedFile) {
                currentArchive.innerHTML = "Currently loaded archive: <b>" + params.storedFile.replace(/\.zim$/i, "") + "</b>";
                currentArchive.style.display = "block";
                document.getElementById('downloadLinksText').style.display = "none";
                document.getElementById('moreInfo').style.display = "none";
            }
            if (params.storedFile && params.storedFile == params.packagedFile) {
                document.getElementById('downloadLinksText').style.display = "block";
                currentArchive.style.display = "none";
            }
            //else {
            //    document.getElementById('rescanStorage').style.display = "none";
            //}
            // Show the selected content in the page
            $('#about').hide();
            $('#configuration').hide();
            $('#formArticleSearch').show();
            $('#articleContent').show();
            $("#articleList").empty();
            $('#articleListHeaderMessage').empty();
            $('#articleListWithHeader').hide();
            $("#prefix").val("");
            $("#searchingArticles").hide();
            $("#welcomeText").hide();
        }

        function setActiveBtn(activeBtn) {
            document.getElementById('btnHome').classList.remove("active");
            document.getElementById('btnRandomArticle').classList.remove("active");
            document.getElementById('btnConfigure').classList.remove("active");
            document.getElementById('btnAbout').classList.remove("active");
            if (activeBtn) {
                var activeID = document.getElementById(activeBtn);
                if (activeID) activeID.classList.add("active");
            }
        }

        document.getElementById('btnConfigure').addEventListener('click', function () {
            var searchDiv = document.getElementById('configuration');
            if (searchDiv.style.display != 'none') {
                setTab();
                if (params.themeChanged) {
                    params.themeChanged = false;
                    if (history.state !== null) {
                        var thisURL = decodeURIComponent(history.state.title);
                        goToArticle(thisURL);
                    }
                }
                return;
            }
            setTab('btnConfigure');
            // Highlight the selected section in the navbar
            $('#liHomeNav').attr("class", "");
            $('#liConfigureNav').attr("class", "active");
            $('#liAboutNav').attr("class", "");
            if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
                $('#navbarToggle').click();
            }
            //Hide footer toolbar
            document.getElementById('footer').style.display = "none";
            // Show the selected content in the page
            $('#configuration').show();
            $('#articleContent').hide();
            $('.alert').hide();
            $('#downloadLinks').hide();
            $('#serverResponse').hide();
            $('#myModal').hide();
            refreshAPIStatus();
            //Re-enable top-level scrolling
            document.getElementById('top').style.position = "relative";
            document.getElementById('scrollbox').style.position = "fixed";
            document.getElementById('scrollbox').style.height = document.documentElement.clientHeight + "px";
            document.getElementById('search-article').style.overflowY = "auto";
            if (document.getElementById('openLocalFiles').style.display == "none") {
                document.getElementById('rescanStorage').style.display = "block";
            }

            //If user hadn't previously picked a folder or a file, resort to the local storage folder (UWP functionality)
            if (params.localStorage && !params.pickedFolder && !params.pickedFile) {
                params.pickedFolder = params.localStorage;
            }
            if (typeof Windows === 'undefined') {
                //If not UWP, display legacy File Select
                document.getElementById('archiveFile').style.display = "none";
                document.getElementById('archiveFiles').style.display = "none";
                document.getElementById('UWPInstructions').style.display = "none";
                document.getElementById('archivesFound').style.display = "none";
                document.getElementById('chooseArchiveFromLocalStorage').style.display = "block";
                document.getElementById('instructions').style.display = "block";
                document.getElementById('archiveFilesLegacy').style.display = "inline";
                document.getElementById('archiveFilesLegacy').addEventListener('change', setLocalArchiveFromFileSelect);
            }
        });
        document.getElementById('btnAbout').addEventListener('click', function () {
            var btnAboutElement = document.getElementById('btnAbout');
            if (/glyphicon-print/.test(btnAboutElement.innerHTML)) {
                printIntercept();
                return;
            }
            //Check if we're 'unclicking' the button
            var searchDiv = document.getElementById('about');
            if (searchDiv.style.display != 'none') {
                setTab();
                return;
            }
            // Highlight the selected section in the navbar
            $('#liHomeNav').attr("class", "");
            $('#liConfigureNav').attr("class", "");
            $('#liAboutNav').attr("class", "active");
            if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
                $('#navbarToggle').click();
            }
            setTab('btnAbout');
            //Hide footer toolbar
            document.getElementById('footer').style.display = "none";
            // Show the selected content in the page
            $('#about').show();
            $('#articleContent').hide();
            $('.alert').hide();
            //Re-enable top-level scrolling
            document.getElementById('top').style.position = "relative";
            document.getElementById('scrollbox').style.position = "fixed";
            document.getElementById('scrollbox').style.height = document.documentElement.clientHeight + "px";
            document.getElementById('search-article').style.overflowY = "auto";
        });
        // Two event listeners are needed because the archive list doesn't "change" if there is only one element in it
        // (also note that keyboard users might not click)
        var selectFired = false;
        document.getElementById('archiveList').addEventListener('change', function () {
            this.click();
        });
        document.getElementById('archiveList').addEventListener('click', function () {
            if (selectFired) return;
            // If nothing was selected, user will have to click again
            // (NB this.selectedIndex will be -1 if no value has been selected)
            if (!~this.selectedIndex) return;
            selectFired = true;
            $('#openLocalFiles').hide();
            // Void any previous picked file to prevent it launching
            if (params.pickedFile && params.pickedFile.name !== this.options[this.selectedIndex].value) {
                params.pickedFile = '';
            }
            setLocalArchiveFromArchiveList();
            setTimeout(function () {
                selectFired = false;
            }, 0);
        });

        document.getElementById('archiveFile').addEventListener('click', function () {
            if (typeof Windows !== 'undefined' && typeof Windows.Storage !== 'undefined') {
                //UWP FilePicker
                pickFileUWP();
            } else {
                //@TODO enable and provide classic filepicker
            }
        });
        document.getElementById('archiveFiles').addEventListener('click', function () {
            if (typeof Windows !== 'undefined' && typeof Windows.Storage !== 'undefined') {
                //UWP FolderPicker
                pickFolderUWP();
            } else {
                //@TODO hide folderpicker
            }
        });
        document.getElementById('downloadTrigger').addEventListener('click', function () {
            kiwixServe.requestXhttpData(params.kiwixDownloadLink);
        });

        $('input:radio[name=contentInjectionMode]').on('change', function (e) {
            if (checkWarnServiceWorkerMode(this.value)) {
                var returnDivs = document.getElementsByClassName("returntoArticle");
                for (var i = 0; i < returnDivs.length; i++) {
                    returnDivs[i].innerHTML = "";
                }
                // Do the necessary to enable or disable the Service Worker
                setContentInjectionMode(this.value);
            } else {
                setContentInjectionMode('jquery');
            }
        });
        $('input:checkbox[name=allowInternetAccess]').on('change', function (e) {
            params.allowInternetAccess = this.checked ? true : false;
            document.getElementById('serverResponse').style.display = "none";
            if (!this.checked) {
                document.getElementById('downloadLinks').style.display = "none";
            }
            //NB do not store this value in a cookie -- should be enabled by the user on a per-session basis only
        });
        $('input:checkbox[name=cssCacheMode]').on('change', function (e) {
            params.cssCache = this.checked ? true : false;
            cookies.setItem('cssCache', params.cssCache, Infinity);
            params.themeChanged = true;
        });
        $('input:checkbox[name=imageDisplayMode]').on('change', function (e) {
            params.imageDisplay = this.checked ? true : false;
            params.themeChanged = params.imageDisplay; //Only reload page if user asked for all images to be displayed
            cookies.setItem('imageDisplay', params.imageDisplay, Infinity);
        });
        $('input:checkbox[name=hideActiveContentWarning]').on('change', function (e) {
            params.hideActiveContentWarning = this.checked ? true : false;
            cookies.setItem('hideActiveContentWarning', params.hideActiveContentWarning, Infinity);
        });
        $('input:checkbox[name=allowHTMLExtraction]').on('change', function (e) {
            params.allowHTMLExtraction = this.checked ? true : false;
            cookies.setItem('allowHTMLExtraction', params.allowHTMLExtraction, Infinity);
        });
        $('input:text[name=alphaChar]').on('change', function (e) {
            params.alphaChar = this.value.length == 1 ? this.value : params.alphaChar;
            this.value = params.alphaChar;
            cookies.setItem('alphaChar', params.alphaChar, Infinity);
        });
        $('input:text[name=omegaChar]').on('change', function (e) {
            params.omegaChar = this.value.length == 1 ? this.value : params.omegaChar;
            this.value = params.omegaChar;
            cookies.setItem('omegaChar', params.omegaChar, Infinity);
        });
        $('input:checkbox[name=hideToolbar]').on('change', function (e) {
            params.hideToolbar = this.checked ? true : false;
            cookies.setItem('hideToolbar', params.hideToolbar, Infinity);
            //checkToolbar();
        });
        // Set up hook into Windows ViewManagement uiSettings if needed
        var uiSettings = null;
        initializeUISettings();
        function initializeUISettings() {
            var checkAuto = params.cssUITheme == 'auto' || params.cssTheme == 'auto';
            if (checkAuto && typeof Windows !== 'undefined' && Windows.UI && Windows.UI.ViewManagement) {
                uiSettings = new Windows.UI.ViewManagement.UISettings();
                uiSettings.oncolorvalueschanged = function () {
                    if (params.cssUITheme == 'auto') cssUIThemeGetOrSet('auto');
                    if (params.cssTheme == 'auto') switchCSSTheme();
                };
            }
        }
        // Code below is needed on startup to show or hide the inverted dark theme checkbox; 
        // similar code also runs in switchCSSTheme(), but that is not evoked on startup
        if (params.cssTheme == 'auto') document.getElementById('darkInvert').style.display = cssUIThemeGetOrSet('auto', true) == 'light' ? 'none' : 'inline';
        document.getElementById('cssUIDarkThemeCheck').addEventListener('click', function () {
            //This code implements a tri-state checkbox
            if (this.readOnly) this.checked = this.readOnly = false;
            else if (!this.checked) this.readOnly = this.indeterminate = true;
            //Code below shows how to invert the order
            //if (this.readOnly) { this.checked = true; this.readOnly = false; }
            //else if (this.checked) this.readOnly = this.indeterminate = true;
            params.cssUITheme = this.indeterminate ? "auto" : this.checked ? 'dark' : 'light';
            if (!uiSettings) initializeUISettings();
            cookies.setItem('cssUITheme', params.cssUITheme, Infinity);
            document.getElementById('cssUIDarkThemeState').innerHTML = params.cssUITheme;
            cssUIThemeGetOrSet(params.cssUITheme);
            //Make subsequent check valid if params.cssTheme is "invert" rather than "dark"
            if (params.cssUITheme != params.cssTheme) $('#cssWikiDarkThemeCheck').click();
        });
        document.getElementById('cssWikiDarkThemeCheck').addEventListener('click', function () {
            if (this.readOnly) this.checked = this.readOnly = false;
            else if (!this.checked) this.readOnly = this.indeterminate = true;
            params.cssTheme = this.indeterminate ? "auto" : this.checked ? 'dark' : 'light';
            if (!uiSettings) initializeUISettings();
            var determinedValue = params.cssTheme;
            if (params.cssTheme == "auto") determinedValue = cssUIThemeGetOrSet('auto', true);
            if (determinedValue == "light") document.getElementById('footer').classList.remove("darkfooter");
            if (params.cssTheme == "light") document.getElementById('cssWikiDarkThemeInvertCheck').checked = false;
            if (determinedValue == "dark") document.getElementById('footer').classList.add("darkfooter");
            document.getElementById('darkInvert').style.display = determinedValue == 'light' ? 'none' : 'inline';
            params.cssTheme = document.getElementById('cssWikiDarkThemeInvertCheck').checked && determinedValue == 'dark' ? 'invert' : params.cssTheme;
            document.getElementById('cssWikiDarkThemeState').innerHTML = params.cssTheme;
            cookies.setItem('cssTheme', params.cssTheme, Infinity);
            switchCSSTheme();
        });
        $('input:checkbox[name=cssWikiDarkThemeInvert]').on('change', function (e) {
            if (this.checked) {
                params.cssTheme = 'invert';
            } else {
                var darkThemeCheckbox = document.getElementById('cssWikiDarkThemeCheck');
                params.cssTheme = darkThemeCheckbox.indeterminate ? 'auto' : darkThemeCheckbox.checked ? 'dark' : 'light';
            }
            cookies.setItem('cssTheme', params.cssTheme, Infinity);
            switchCSSTheme();
        });
        function cssUIThemeGetOrSet(value, getOnly) {
            if (value == 'auto') {
                if (uiSettings) {
                    // We need to check the system theme
                    // var uiSettings = new Windows.UI.ViewManagement.UISettings();
                    // Value 0 below is the 'background' constant in array Windows.UI.ViewManagement.UIColorType
                    var colour = uiSettings.getColorValue(0);
                    value = (colour.b + colour.g + colour.r) <= 382 ? 'dark' : 'light';
                } else {
                    // There is no system default, so use light, as it is what most people will expect
                    value = 'light';
                }
            }
            if (getOnly) return value;
            var elements;
            if (value == 'dark') {
                document.getElementsByTagName('body')[0].classList.add("dark");
                document.getElementById('archiveFilesLegacy').classList.add("dark");
                document.getElementById('footer').classList.add("darkfooter");
                document.getElementById('archiveFilesLegacy').classList.remove("btn");
                document.getElementById('findInArticle').classList.add("dark");
                document.getElementById('prefix').classList.add("dark");
                elements = document.querySelectorAll(".settings");
                for (var i = 0; i < elements.length; i++) {
                    elements[i].style.border = "1px solid darkgray";
                }
                document.getElementById('kiwixIcon').src = /wikivoyage/i.test(params.storedFile) ? "img/icons/wikivoyage-white-32.png" : /medicine/i.test(params.storedFile) ? "img/icons/wikimed-lightblue-32.png" : "img/icons/kiwix-32.png";
                if (/wikivoyage/i.test(params.storedFile)) document.getElementById('kiwixIconAbout').src = "img/icons/wikivoyage-90-white.png";
            }
            if (value == 'light') {
                document.getElementsByTagName('body')[0].classList.remove("dark");
                document.getElementById('search-article').classList.remove("dark");
                document.getElementById('footer').classList.remove("darkfooter");
                document.getElementById('archiveFilesLegacy').classList.remove("dark");
                document.getElementById('archiveFilesLegacy').classList.add("btn");
                document.getElementById('findInArticle').classList.remove("dark");
                document.getElementById('prefix').classList.remove("dark");
                elements = document.querySelectorAll(".settings");
                for (var i = 0; i < elements.length; i++) {
                    elements[i].style.border = "1px solid black";
                }
                document.getElementById('kiwixIcon').src = /wikivoyage/i.test(params.storedFile) ? "img/icons/wikivoyage-black-32.png" : /medicine/i.test(params.storedFile) ? "img/icons/wikimed-blue-32.png" : "img/icons/kiwix-blue-32.png";
                if (/wikivoyage/i.test(params.packagedFile)) document.getElementById('kiwixIconAbout').src = "img/icons/wikivoyage-90.png";
            }
            return value;
        }
        function switchCSSTheme() {
            var doc = window.frames[0].frameElement.contentDocument;
            var treePath = decodeURIComponent(params.lastPageVisit).replace(/[^/]+\/(?:[^/]+$)?/g, "../");
            //If something went wrong, use the page reload method
            if (!treePath) {
                params.themeChanged = true;
                return;
            }
            var styleSheets = doc.getElementsByTagName("link");
            //Remove any dark theme, as we don't know whether user switched from light to dark or from inverted to dark, etc.
            for (var i = styleSheets.length - 1; i > -1; i--) {
                if (~styleSheets[i].href.search(/\/style-dark/)) {
                    styleSheets[i].disabled = true;
                    styleSheets[i].parentNode.removeChild(styleSheets[i]);
                }
            }
            var determinedWikiTheme = params.cssTheme == 'auto' ? cssUIThemeGetOrSet('auto', true) : params.cssTheme;
            var breakoutLink = doc.getElementById('breakoutLink');
            if (determinedWikiTheme != "light") {
                var link = doc.createElement("link");
                link.setAttribute("rel", "stylesheet");
                link.setAttribute("type", "text/css");
                link.setAttribute("href", determinedWikiTheme == "dark" ? "-/s/style-dark.css" : "-/s/style-dark-invert.css");
                doc.head.appendChild(link);
                if (breakoutLink) breakoutLink.src = 'img/icons/new_window_lb.svg';
            } else {
                if (breakoutLink) breakoutLink.src = 'img/icons/new_window.svg';
            }
            document.getElementById('darkInvert').style.display = determinedWikiTheme == 'light' ? 'none' : 'inline';
        }
        $('input:checkbox[name=rememberLastPage]').on('change', function (e) {
            if (params.rememberLastPage && this.checked) document.getElementById('rememberLastPageCheck').checked = true;
            params.rememberLastPage = this.checked ? true : false;
            cookies.setItem('rememberLastPage', params.rememberLastPage, Infinity);
            if (!params.rememberLastPage) {
                cookies.setItem('lastPageVisit', "", Infinity);
                //Clear localStorage
                if (typeof Storage !== "undefined") {
                    try {
                        localStorage.setItem('lastPageHTML', "");
                    } catch (err) {
                        console.log("localStorage not supported: " + err);
                    }
                }
            }
        });
        $('input:radio[name=cssInjectionMode]').on('click', function (e) {
            params.cssSource = this.value;
            cookies.setItem('cssSource', params.cssSource, Infinity);
            params.themeChanged = true;
        });
        document.getElementById('removePageMaxWidthCheck').addEventListener('click', function () {
            //This code implements a tri-state checkbox
            if (this.readOnly) this.checked = this.readOnly = false;
            else if (!this.checked) this.readOnly = this.indeterminate = true;
            params.removePageMaxWidth = this.indeterminate ? "auto" : this.checked;
            document.getElementById('pageMaxWidthState').innerHTML = (params.removePageMaxWidth == "auto" ? "auto" : params.removePageMaxWidth ? "always" : "never");
            cookies.setItem('removePageMaxWidth', params.removePageMaxWidth, Infinity);
            removePageMaxWidth();
        });

        function removePageMaxWidth() {
            var doc = window.frames[0].frameElement.contentDocument;
            var zimType = /\bhref\s*=\s*["'][^"']*?(?:minerva|mobile)/i.test(doc.head.innerHTML) ? "mobile" : "desktop";
            var idArray = ["content", "bodyContent"];
            for (var i = 0; i < idArray.length; i++) {
                var contentElement = doc.getElementById(idArray[i]);
                if (!contentElement) continue;
                var docStyle = contentElement.style;
                if (!docStyle) continue;
                if (contentElement.className == "mw-body") {
                    docStyle.padding = "1em";
                    docStyle.border = "1px solid #a7d7f9";
                }
                if (params.removePageMaxWidth == "auto") {
                    docStyle.maxWidth = zimType == "desktop" ? "100%" : "55.8em";
                    docStyle.cssText = docStyle.cssText.replace(/(max-width[^;]+)/i, "$1 !important");
                    docStyle.border = "0";
                } else {
                    docStyle.maxWidth = params.removePageMaxWidth ? "100%" : "55.8em";
                    docStyle.cssText = docStyle.cssText.replace(/(max-width[^;]+)/i, "$1 !important");
                    if (params.removePageMaxWidth || zimType == "mobile") docStyle.border = "0";
                }
                docStyle.margin = "0 auto";
            }
        }
        $('input:radio[name=useMathJax]').on('click', function (e) {
            params.useMathJax = /true/i.test(this.value);
            cookies.setItem('useMathJax', params.useMathJax, Infinity);
            params.themeChanged = true;
        });
        document.getElementById('otherLangs').addEventListener('click', function () {
            if (!params.showFileSelectors) document.getElementById('displayFileSelectorsCheck').click();
            var library = document.getElementById('libraryArea');
            library.style.borderColor = 'red';
            library.style.borderStyle = 'solid';
            document.getElementById('downloadTrigger').addEventListener('mousedown', function () {
                library.style.borderColor = '';
                library.style.borderStyle = '';
            });
        });
        $('input:checkbox[name=displayFileSelectors]').on('change', function (e) {
            params.showFileSelectors = this.checked ? true : false;
            document.getElementById('rescanStorage').style.display = "block";
            document.getElementById('openLocalFiles').style.display = "none";
            document.getElementById('hideFileSelectors').style.display = params.showFileSelectors ? "block" : "none";
            document.getElementById('downloadLinksText').style.display = params.showFileSelectors ? "none" : "inline";
            document.getElementById('moreInfo').style.display = params.showFileSelectors ? "none" : "inline";
            if (params.packagedFile && params.storedFile && params.storedFile != params.packagedFile) {
                var currentArchive = document.getElementById('currentArchive');
                currentArchive.innerHTML = "Currently loaded archive: <b>" + params.storedFile.replace(/\.zim$/i, "") + "</b>";
                currentArchive.style.display = params.showFileSelectors ? "none" : "block";
                document.getElementById('downloadLinksText').style.display = params.showFileSelectors ? "none" : "block";
            }
            cookies.setItem('showFileSelectors', params.showFileSelectors, Infinity);
            if (params.showFileSelectors) document.getElementById('configuration').scrollIntoView();
        });

        function checkToolbar() {
            var thisdoc = document.getElementById('top');
            var scrollbox = document.getElementById('scrollbox');
            if (!params.hideToolbar) {
                thisdoc.style.display = "block";
                thisdoc.style.position = "fixed";
                thisdoc.style.zIndex = "1";
                scrollbox.style.position = "relative";
                scrollbox.style.height = ~~document.getElementById('top').getBoundingClientRect().height + "px"; //Cannot be larger or else on Windows Mobile (at least) and probably other mobile, the top bar gets covered by iframe
                resizeIFrame();
                return;
            }
            thisdoc.style.position = "relative";
            thisdoc.style.zIndex = "0";
            scrollbox.style.position = "fixed";
            resizeIFrame();
            if (typeof tryHideToolber !== "undefined") window.frames[0].removeEventListener('scroll', tryHideToolbar);
            var tryHideToolbar = function () {
                hideToolbar();
            };
            window.frames[0].addEventListener('scroll', tryHideToolbar, true);

            function hideToolbar(lastypos) {
                if (!params.hideToolbar) return;
                //Don't hide toolbar if search is open
                if (document.getElementById('row2').style.display != "none") return;
                var ypos = window.frames[0].frameElement.contentDocument.body.scrollTop;
                var thisdoc = document.getElementById('top');
                //Immediately hide toolbar if not at top
                if (params.hideToolbar && ypos) {
                    thisdoc.style.display = "none";
                    scrollbox.style.position = "fixed";
                    thisdoc.style.zIndex = "0";
                }
                //As function runs on start of scroll, give 0.25s to find out if user has stopped scrolling
                if (typeof lastypos !== "undefined" && lastypos == ypos) {
                    //We've stropped scrolling, do we need to re-enable?
                    if (!ypos) {
                        params.hideToolbar = false;
                        checkToolbar();
                        params.hideToolbar = true;
                    }
                } else {
                    var wait = setTimeout(function () {
                        clearTimeout(wait);
                        hideToolbar(ypos);
                    }, 250, ypos);
                }
            }
        }

        $(document).ready(function (e) {
            // Set initial behaviour (see also init.js)
            cssUIThemeGetOrSet(params.cssUITheme);
            //@TODO - this is initialization code, and should be in init.js (withoug jQuery)
            $('input:radio[name=cssInjectionMode]').filter('[value="' + params.cssSource + '"]').prop('checked', true);
            //DEV this hides file selectors if it is a packaged file -- add your own packaged file test to regex below
            if (/wikivoyage|medicine/i.test(params.fileVersion)) {
                document.getElementById('packagedAppFileSelectors').style.display = "block";
                document.getElementById('hideFileSelectors').style.display = "none";
                //document.getElementById('downloadLinksText').style.display = "none";
                if (params.showFileSelectors) {
                    document.getElementById('hideFileSelectors').style.display = "block";
                    document.getElementById('downloadLinksText').style.display = "inline";
                }
            }
            //Code below triggers display of modal info box if app is run for the first time, or it has been upgraded to new version
            if (cookies.getItem('version') != params.version) {
                firstRun = true;
                $('#myModal').modal({
                    backdrop: "static"
                });
                cookies.setItem('version', params.version, Infinity);
            }
        });

        /**
         * Displays or refreshes the API status shown to the user
         */
        function refreshAPIStatus() {
            if (isMessageChannelAvailable()) {
                $('#messageChannelStatus').html("MessageChannel API available");
                $('#messageChannelStatus').removeClass("apiAvailable apiUnavailable")
                    .addClass("apiAvailable");
            } else {
                $('#messageChannelStatus').html("MessageChannel API unavailable");
                $('#messageChannelStatus').removeClass("apiAvailable apiUnavailable")
                    .addClass("apiUnavailable");
            }
            if (isServiceWorkerAvailable()) {
                if (isServiceWorkerReady()) {
                    $('#serviceWorkerStatus').html("ServiceWorker API available, and registered");
                    $('#serviceWorkerStatus').removeClass("apiAvailable apiUnavailable")
                        .addClass("apiAvailable");
                } else {
                    $('#serviceWorkerStatus').html("ServiceWorker API available, but not registered");
                    $('#serviceWorkerStatus').removeClass("apiAvailable apiUnavailable")
                        .addClass("apiUnavailable");
                }
            } else {
                $('#serviceWorkerStatus').html("ServiceWorker API unavailable");
                $('#serviceWorkerStatus').removeClass("apiAvailable apiUnavailable")
                    .addClass("apiUnavailable");
            }
        }

        var contentInjectionMode;
        var keepAliveServiceWorkerHandle;
    
        /**
         * Send an 'init' message to the ServiceWorker with a new MessageChannel
         * to initialize it, or to keep it alive.
         * This MessageChannel allows a 2-way communication between the ServiceWorker
         * and the application
         */
        function initOrKeepAliveServiceWorker() {
            if (contentInjectionMode === 'serviceworker') {
                // Create a new messageChannel
                var tmpMessageChannel = new MessageChannel();
                tmpMessageChannel.port1.onmessage = handleMessageChannelMessage;
                // Send the init message to the ServiceWorker, with this MessageChannel as a parameter
                navigator.serviceWorker.controller.postMessage({'action': 'init'}, [tmpMessageChannel.port2]);
                messageChannel = tmpMessageChannel;
                console.log("init message sent to ServiceWorker");
                // Schedule to do it again regularly to keep the 2-way communication alive.
                // See https://github.com/kiwix/kiwix-js/issues/145 to understand why
                clearTimeout(keepAliveServiceWorkerHandle);
                keepAliveServiceWorkerHandle = setTimeout(initOrKeepAliveServiceWorker, DELAY_BETWEEN_KEEPALIVE_SERVICEWORKER, false);
            }
        }

        /**
         * Sets the given injection mode.
         * This involves registering (or re-enabling) the Service Worker if necessary
         * It also refreshes the API status for the user afterwards.
         * 
         * @param {String} value The chosen content injection mode : 'jquery' or 'serviceworker'
         */
        function setContentInjectionMode(value) {
            if (value === 'jquery') {
                if (isServiceWorkerReady()) {
                    // We need to disable the ServiceWorker
                    // Unregistering it does not seem to work as expected : the ServiceWorker
                    // is indeed unregistered but still active...
                    // So we have to disable it manually (even if it's still registered and active)
                navigator.serviceWorker.controller.postMessage({'action': 'disable'});
                    messageChannel = null;
                }
                refreshAPIStatus();
            } else if (value === 'serviceworker') {
                if (!isServiceWorkerAvailable()) {
                    uiUtil.systemAlert("The ServiceWorker API is not available on your device. Falling back to JQuery mode");
                    setContentInjectionMode('jquery');
                    return;
                }
                if (!isMessageChannelAvailable()) {
                    uiUtil.systemAlert("The MessageChannel API is not available on your device. Falling back to JQuery mode");
                    setContentInjectionMode('jquery');
                    return;
                }

                if (!isServiceWorkerReady()) {
                    $('#serviceWorkerStatus').html("ServiceWorker API available : trying to register it...");
                    navigator.serviceWorker.register('../service-worker.js').then(function (reg) {
                        console.log('serviceWorker registered', reg);
                        serviceWorkerRegistration = reg;
                        refreshAPIStatus();

                        // We need to wait for the ServiceWorker to be activated
                        // before sending the first init message
                        var serviceWorker = reg.installing || reg.waiting || reg.active;
                        serviceWorker.addEventListener('statechange', function (statechangeevent) {
                            if (statechangeevent.target.state === 'activated') {
                            // Create the MessageChannel
                            // and send the 'init' message to the ServiceWorker
                            initOrKeepAliveServiceWorker();
                            }
                        });
                    if (serviceWorker.state === 'activated') {
                        // Even if the ServiceWorker is already activated,
                        // We need to re-create the MessageChannel
                        // and send the 'init' message to the ServiceWorker
                        // in case it has been stopped and lost its context
                        initOrKeepAliveServiceWorker();
                    }
                    }, function (err) {
                        console.error('error while registering serviceWorker', err);
                        refreshAPIStatus();
                    });
                } else {
                initOrKeepAliveServiceWorker();
                }
            }
            $('input:radio[name=contentInjectionMode]').prop('checked', false);
            $('input:radio[name=contentInjectionMode]').filter('[value="' + value + '"]').prop('checked', true);
            contentInjectionMode = value;
            // Save the value in a cookie, so that to be able to keep it after a reload/restart
            cookies.setItem('lastContentInjectionMode', value, Infinity);
        }

        /**
         * If the ServiceWorker mode is selected, warn the user before activating it
         * @param chosenContentInjectionMode The mode that the user has chosen
         */
        function checkWarnServiceWorkerMode(chosenContentInjectionMode) {
            if (chosenContentInjectionMode === 'serviceworker' && !cookies.hasItem("warnedServiceWorkerMode")) {
                // The user selected the "serviceworker" mode, which is still unstable
                // So let's display a warning to the user

                // If the focus is on the search field, we have to move it,
                // else the keyboard hides the message
                if ($("#prefix").is(":focus")) {
                    $("#searchArticles").focus();
                }
                if (confirm("The 'Service Worker' mode is still UNSTABLE for now." +
                        " It happens that the application needs to be reinstalled (or the ServiceWorker manually removed)." +
                        " Please confirm with OK that you're ready to face this kind of bugs, or click Cancel to stay in 'jQuery' mode.")) {
                    // We will not display this warning again for one day
                    cookies.setItem("warnedServiceWorkerMode", true, 86400);
                    return true;
                } else {
                    return false;
                }
            }
            return true;
        }

        // At launch, we try to set the last content injection mode (stored in a cookie)
        var lastContentInjectionMode = cookies.getItem('lastContentInjectionMode');
        if (lastContentInjectionMode) {
            setContentInjectionMode(lastContentInjectionMode);
        } else {
            setContentInjectionMode('jquery');
        }

        var serviceWorkerRegistration = null;

        /**
         * Tells if the ServiceWorker API is available
         * https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker
         * @returns {Boolean}
         */
        function isServiceWorkerAvailable() {
            return 'serviceWorker' in navigator;
        }

        /**
         * Tells if the MessageChannel API is available
         * https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel
         * @returns {Boolean}
         */
        function isMessageChannelAvailable() {
            try {
                var dummyMessageChannel = new MessageChannel();
                if (dummyMessageChannel) return true;
            } catch (e) {
                return false;
            }
            return false;
        }

        /**
         * Tells if the ServiceWorker is registered, and ready to capture HTTP requests
         * and inject content in articles.
         * @returns {Boolean}
         */
        function isServiceWorkerReady() {
            // Return true if the serviceWorkerRegistration is not null and not undefined
            return serviceWorkerRegistration;
        }

        /**
         * 
         * @type Array.<StorageFirefoxOS>
         */
        var storages = [];
        //var storages = [appFolder.path];  //UWP @UWP
        function searchForArchivesInPreferencesOrStorage() {
            // First see if the list of archives is stored in the cookie
            var listOfArchivesFromCookie = cookies.getItem("listOfArchives");
            if (listOfArchivesFromCookie !== null && listOfArchivesFromCookie !== undefined && listOfArchivesFromCookie !== "") {
                var directories = listOfArchivesFromCookie.split('|');
                populateDropDownListOfArchives(directories);
            } else {
                if (storages.length || params.localStorage) {
                    searchForArchivesInStorage();
                } else {
                    displayFileSelect();
                    if (document.getElementById('archiveFiles').files && document.getElementById('archiveFiles').files.length > 0) {
                        // Archive files are already selected, 
                        setLocalArchiveFromFileSelect();
                    } else {
                        document.getElementById('btnConfigure').click();
                    }
                }
            }
        }

        function searchForArchivesInStorage() {
            // If DeviceStorage is available, we look for archives in it
            document.getElementById('btnConfigure').click();
            $('#scanningForArchives').show();
            if (params.localStorage && typeof Windows !== 'undefined' && typeof Windows.Storage !== 'undefined') {
                scanUWPFolderforArchives(params.localStorage);
            } else {
                zimArchiveLoader.scanForArchives(storages, populateDropDownListOfArchives);
            }
        }

        // @STORAGE AUTOLOAD STARTS HERE
        if ($.isFunction(navigator.getDeviceStorages)) {
            // The method getDeviceStorages is available (FxOS>=1.1)
            storages = $.map(navigator.getDeviceStorages("sdcard"), function (s) {
                return new abstractFilesystemAccess.StorageFirefoxOS(s);
            });
        }

        if (storages !== null && storages.length > 0 ||
            typeof Windows !== 'undefined' && typeof Windows.Storage !== 'undefined') {
            // Make a fake first access to device storage, in order to ask the user for confirmation if necessary.
            // This way, it is only done once at this moment, instead of being done several times in callbacks
            // After that, we can start looking for archives
            //storages[0].get("fake-file-to-read").then(searchForArchivesInPreferencesOrStorage,
            if (!params.pickedFile) {
                searchForArchivesInPreferencesOrStorage();
            } else {
                processPickedFileUWP(params.pickedFile);
            }
        } else {
            // If DeviceStorage is not available, we display the file select components
            displayFileSelect();
            if (document.getElementById('archiveFiles').files && document.getElementById('archiveFiles').files.length > 0) {
                // Archive files are already selected, 
                setLocalArchiveFromFileSelect();
            } else {
                document.getElementById('btnConfigure').click();
            }
        }


        // Display the article when the user goes back in the browser history
        window.onpopstate = function (event) {
            if (event.state) {
                var title = event.state.title;
                var titleSearch = event.state.titleSearch;

                $('#prefix').val("");
                $("#welcomeText").hide();
                if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
                    $('#navbarToggle').click();
                }
                $('#searchingArticles').hide();
                $('#configuration').hide();
                $('#articleListWithHeader').hide();
                $('#articleContent').contents().empty();

                if (title && !("" === title)) {
                    goToArticle(title);
                } else if (titleSearch && !("" === titleSearch)) {
                    $('#prefix').val(titleSearch);
                    searchDirEntriesFromPrefix($('#prefix').val());
                }
            }
        };

        /**
         * Populate the drop-down list of archives with the given list
         * @param {Array.<String>} archiveDirectories
         */
        function populateDropDownListOfArchives(archiveDirectories) {
            $('#scanningForArchives').hide();
            $('#chooseArchiveFromLocalStorage').show();
            document.getElementById('rescanStorage').style.display = params.rescan ? "none" : "block";
            document.getElementById('openLocalFiles').style.display = params.rescan ? "block" : "none";
            var comboArchiveList = document.getElementById('archiveList');
            comboArchiveList.options.length = 0;
            for (var i = 0; i < archiveDirectories.length; i++) {
                var archiveDirectory = archiveDirectories[i];
                if (archiveDirectory === "/") {
                    uiUtil.systemAlert("It looks like you have put some archive files at the root of your sdcard (or internal storage). Please move them in a subdirectory");
                } else {
                    comboArchiveList.options[i] = new Option(archiveDirectory, archiveDirectory);
                }
            }
            // Store the list of archives in a cookie, to avoid rescanning at each start
            cookies.setItem("listOfArchives", archiveDirectories.join('|'), Infinity);
            comboArchiveList.size = comboArchiveList.length;
            //Kiwix-Js-Windows #23 - remove dropdown caret if only one archive
            if (comboArchiveList.length > 1) comboArchiveList.removeAttribute("multiple");
            if (comboArchiveList.length == 1) comboArchiveList.setAttribute("multiple", "1");
            if (comboArchiveList.options.length > 0) {
                var plural = comboArchiveList.length > 1 ? "s" : "";
                document.getElementById('archiveNumber').innerHTML = '<b>' + comboArchiveList.length + '</b> Archive' + plural + ' found in selected location (tap "Select storage" to change)';
                // If we're doing a rescan, then don't attempt to jump to the last selected archive, but leave selectors open
                var lastSelectedArchive = params.rescan ? '' : params.storedFile;
                if (lastSelectedArchive !== null && lastSelectedArchive !== undefined && lastSelectedArchive !== "") {
                    //  || comboArchiveList.options.length == 1
                    // Either we have previously chosen a file, // or there is only one file
                    // Attempt to select the corresponding item in the list, if it exists
                    var success = false;
                    if ($("#archiveList option[value='" + lastSelectedArchive + "']").length > 0) {
                        $("#archiveList").val(lastSelectedArchive);
                        success = true;
                        cookies.setItem("lastSelectedArchive", lastSelectedArchive, Infinity);
                    }
                    // Set the localArchive as the last selected (if none has been selected previously, wait for user input)
                    //if (success || comboArchiveList.options.length == 1) {
                    if (success) {
                        setLocalArchiveFromArchiveList();
                    } else {
                        // We can't find lastSelectedArchive in the archive list, so let's ask the user to pick it
                        //uiUtil.systemAlert(lastSelectedArchive + ' could not be found in the known list of archives!');
                        document.getElementById('alert-content').innerHTML = '<p>We could not find the archive <b>' + lastSelectedArchive + '</b>!</p><p>Please select its location...</p>';
                        $('#alertModal').off('hide.bs.modal');
                        $('#alertModal').on('hide.bs.modal', function () {
                            displayFileSelect();
                        });
                        $('#alertModal').modal({
                            backdrop: 'static',
                            keyboard: true
                        });
                        if (document.getElementById('configuration').style.display == 'none')
                            document.getElementById('btnConfigure').click();
                    }
                }
            } else {
                uiUtil.systemAlert("Welcome to Kiwix! This application needs at least a ZIM file in your SD-card (or internal storage). Please download one and put it on the device (see About section). Also check that your device is not connected to a computer through USB device storage (which often locks the SD-card content)");
                $("#btnAbout").click();
                var isAndroid = navigator.userAgent.indexOf("Android") !== -1;
                if (isAndroid) {
                    alert("You seem to be using an Android device. Be aware that there is a bug on Firefox, that prevents finding Wikipedia archives in a SD-card (at least on some devices. See about section). Please put the archive in the internal storage if the application can't find it.");
                }
            }
        }

        /**
         * Sets the localArchive from the selected archive in the drop-down list
         */
        function setLocalArchiveFromArchiveList(archiveDirectory) {
            params.rescan = false;
            archiveDirectory = archiveDirectory || $('#archiveList').val();
            if (archiveDirectory && archiveDirectory.length > 0) {
                // Now, try to find which DeviceStorage has been selected by the user
                // It is the prefix of the archive directory
                var regexpStorageName = /^\/([^\/]+)\//;
                var regexpResults = regexpStorageName.exec(archiveDirectory);
                var selectedStorage = null;
                if (regexpResults && regexpResults.length > 0) {
                    var selectedStorageName = regexpResults[1];
                    for (var i = 0; i < storages.length; i++) {
                        var storage = storages[i];
                        if (selectedStorageName === storage.storageName) {
                            // We found the selected storage
                            selectedStorage = storage;
                        }
                    }
                    if (selectedStorage === null) {
                        uiUtil.systemAlert("Unable to find which device storage corresponds to directory " + archiveDirectory);
                    }
                } else {
                    // This happens when the archiveDirectory is not prefixed by the name of the storage
                    // (in the Simulator, or with FxOs 1.0, or probably on devices that only have one device storage)
                    // In this case, we use the first storage of the list (there should be only one)
                    if (storages.length === 1) {
                        selectedStorage = storages[0];
                    } else { //IT'S NOT FREAKIN FFOS!!!!!!!!!!
                        //Patched for UWP support:
                        if (!params.pickedFile && params.pickedFolder && typeof MSApp !== 'undefined') {
                            var query = params.pickedFolder.createFileQuery();
                            query.getFilesAsync().done(function (files) {
                                var file;
                                if (files) {
                                    for (var i = 0; i < files.length; i++) {
                                        if (files[i].name == archiveDirectory) {
                                            file = files[i];
                                            break;
                                        }
                                    }
                                    if (file) {
                                        var fileset = [];
                                        if (/\.zim\w\w$/i.test(file.name)) {
                                            var genericFileName = file.name.replace(/(.*)\.zim\w\w$/i, "$1");
                                            var testFileName = new RegExp(genericFileName + '\\.zim\\w\\w$');
                                            for (var i = 0; i < files.length; i++) {
                                                if (testFileName.test(files[i].name)) {
                                                    //This converts a UWP storage file object into a standard JavaScript web file object
                                                    fileset.push(MSApp.createFileFromStorageFile(files[i]));
                                                }
                                            }
                                        } else {
                                            //This converts a UWP storage file object into a standard JavaScript web file object
                                            fileset = [MSApp.createFileFromStorageFile(file)];
                                        }
                                    }
                                }
                                if (fileset && fileset.length) {
                                    setLocalArchiveFromFileList(fileset);
                                } else {
                                    console.error("The picked file could not be found in the selected folder!");
                                    var archiveList = [];
                                    for (var i = 0; i < files.length; i++) {
                                        if (/\.zima?a?$/i.test(files[i].name)) {
                                            archiveList.push(files[i].name);
                                        }
                                    }
                                    populateDropDownListOfArchives(archiveList);
                                    document.getElementById('btnConfigure').click();
                                }
                            });
                            return;
                        } else { //Check if user previously picked a specific file rather than a folder
                            if (params.pickedFile && typeof MSApp !== 'undefined') {
                                try {
                                    selectedStorage = MSApp.createFileFromStorageFile(params.pickedFile);
                                    setLocalArchiveFromFileList([selectedStorage]);
                                    return;
                                } catch (err){
                                    // Probably user has moved or deleted the previously selected file
                                    uiUtil.systemAlert("The previously picked archive can no longer be found!");
                                    console.error("Picked archive not found: " + err);
                                }
                            }
                        }
                        //There was no picked file or folder, so we'll try setting the default localStorage
                        //if (!params.pickedFolder) {
                            //This gets called, for example, if the picked folder or picked file are in FutureAccessList but now are
                            //no longer accessible. There will be a (handled) error in cosole log, and params.pickedFolder and params.pickedFile will be blank
                            params.rescan = true;
                            if (params.localStorage) {
                                scanUWPFolderforArchives(params.localStorage);
                            } else {
                                document.getElementById('btnConfigure').click();
                            }
                            return;
                        //}
                    }
                }
                // Reset the cssDirEntryCache and cssBlobCache. Must be done when archive changes.
                if (cssBlobCache)
                    cssBlobCache = new Map();
                //if (cssDirEntryCache)
                //    cssDirEntryCache = new Map();
                selectedArchive = zimArchiveLoader.loadArchiveFromDeviceStorage(selectedStorage, archiveDirectory, function (archive) {
                    cookies.setItem("lastSelectedArchive", archiveDirectory, Infinity);
                    // The archive is set : go back to home page to start searching
                    if (params.rescan) {
                        document.getElementById('btnConfigure').click();
                        params.rescan = false;
                    } else {
                        $('#openLocalFiles').hide();
                        document.getElementById('btnHome').click();
                    }
                });

            }
        }

        /**
         * Displays the zone to select files from the archive
         */
        function displayFileSelect() {
            document.getElementById('openLocalFiles').style.display = 'block';
            // Set the main drop zone
            scrollBoxDropZone.addEventListener('dragover', handleGlobalDragover, false);
            scrollBoxDropZone.addEventListener('dragleave', function (e) {
                configDropZone.style.border = '';
            });
            // Also set a global drop zone (allows us to ensure Config is always displayed for the file drop)
            globalDropZone.addEventListener('dragover', function (e) {
                e.preventDefault();
                if (document.getElementById('configuration').style.display === 'none') document.getElementById('btnConfigure').click();
                e.dataTransfer.dropEffect = 'link';
            }, false);
            globalDropZone.addEventListener('drop', handleFileDrop);
            // This handles use of the file picker
            document.getElementById('archiveFiles').addEventListener('change', setLocalArchiveFromFileSelect);
        }

        function handleGlobalDragover(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'link';
            configDropZone.style.border = '3px dotted red';
        }

        function handleIframeDragover(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'link';
            document.getElementById('btnConfigure').click();
        }

        function handleIframeDrop(e) {
            e.stopPropagation();
            e.preventDefault();
            return;
        }

        function handleFileDrop(packet) {
            packet.stopPropagation();
            packet.preventDefault();
            configDropZone.style.border = '';
            var files = packet.dataTransfer.files;
            document.getElementById('openLocalFiles').style.display = 'none';
            setLocalArchiveFromFileList(files);
            // This clears the display of any previously picked archive in the file selector
            document.getElementById('archiveFiles').value = null;
        }

        function pickFileUWP() { //Support UWP FilePicker [kiwix-js-windows #3]
            // Create the picker object and set options
            var filePicker = new Windows.Storage.Pickers.FileOpenPicker;
            filePicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.downloads;
            // Filter folder contents
            filePicker.fileTypeFilter.replaceAll([".zim"]);
            filePicker.pickSingleFileAsync().then(processPickedFileUWP);
        }

        function processPickedFileUWP(file) {
            if (file) {
                // Cache file so the contents can be accessed at a later time
                Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.addOrReplace(params.falFileToken, file);
                params.pickedFile = file;
                if (params.pickedFolder) Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.remove(params.falFolderToken);
                params.pickedFolder = "";
                cookies.setItem("lastSelectedArchive", file.name, Infinity);
                params.storedFile = file.name;
                // Since we've explicitly picked a file, we should jump to it
                params.rescan = false;
                document.getElementById('openLocalFiles').style.display = "none";
                populateDropDownListOfArchives([file.name]);
            } else {
                // The picker was dismissed with no selected file
                console.log("User closed folder picker without picking a file");
            }
        }

        function pickFolderUWP() { //Support UWP FilePicker [kiwix-js-windows #3]
            var folderPicker = new Windows.Storage.Pickers.FolderPicker;
            folderPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.downloads;
            folderPicker.fileTypeFilter.replaceAll([".zim", ".dat", ".idx", ".txt", ".zimaa"]);

            folderPicker.pickSingleFolderAsync().done(function (folder) {
                if (folder) {
                    scanUWPFolderforArchives(folder);
                }
            });
        }

        function scanUWPFolderforArchives(folder) {
            if (folder) {
                // Application now has read/write access to all contents in the picked folder (including sub-folder contents)
                // Cache folder so the contents can be accessed at a later time
                Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.addOrReplace(params.falFolderToken, folder);
                params.pickedFolder = folder;
                // Query the folder.
                var query = folder.createFileQuery();
                query.getFilesAsync().done(function (files) {
                    // Display file list
                    var archiveDisplay = document.getElementById('chooseArchiveFromLocalStorage');
                    if (files) {
                        var archiveList = [];
                        files.forEach(function (file) {
                            if (file.fileType == ".zim" || file.fileType == ".zimaa") {
                                archiveList.push(file.name);
                            }
                        });
                        if (archiveList.length) {
                            document.getElementById('noZIMFound').style.display = "none";
                            populateDropDownListOfArchives(archiveList);
                            return;
                        }
                    }
                    archiveDisplay.style.display = "inline";
                    document.getElementById('noZIMFound').style.display = "block";
                    document.getElementById('openLocalFiles').style.display = "none";
                    document.getElementById('rescanStorage').style.display = "block";
                    document.getElementById('archiveList').options.length = 0;
                    document.getElementById('archiveList').size = 0;
                    document.getElementById('archiveNumber').innerHTML = '<b>0</b> Archives found in local storage (tap "Select storage" to select an archive location)';
                    params.pickedFolder = "";
                    Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.remove(params.falFolderToken);
                    return;
                });
            } else {
                // The picker was dismissed with no selected file
                console.log("User closed folder picker without picking a file");
            }
        }

        function setLocalArchiveFromFileList(files) {
            // Check for usable file types
            for (var i = files.length; i--;) {
                // DEV: you can support other file types by adding (e.g.) '|dat|idx' after 'zim\w{0,2}'
                if (!/\.(?:zim\w{0,2})$/i.test(files[i].name)) {
                    uiUtil.systemAlert("One or more files does not appear to be a ZIM file!");
                    return;
                }
            }
            // Check that user hasn't picked just part of split ZIM
            if (files.length == 1 && /\.zim\w\w/i.test(files[0].name)) {
                document.getElementById('alert-content').innerHTML = '<p>You have picked only part of a split archive!</p><p>Please select its folder in Config, or drag and drop <b>all</b> of its parts into Config.</p>';
                $('#alertModal').off('hide.bs.modal');
                $('#alertModal').on('hide.bs.modal', function () {
                    if (document.getElementById('configuration').style.display == 'none')
                        document.getElementById('btnConfigure').click();
                    displayFileSelect();
                });
                $('#alertModal').modal({
                    backdrop: 'static',
                    keyboard: true
                });
            }
            // If the file name is already in the archive list, try to select it in the list
            var listOfArchives = document.getElementById('archiveList');
            if (listOfArchives) listOfArchives.value = files[0].name;
            // Reset the cssDirEntryCache and cssBlobCache. Must be done when archive changes.
            if (cssBlobCache)
                cssBlobCache = new Map();
            //if (cssDirEntryCache)
            //    cssDirEntryCache = new Map();
            selectedArchive = zimArchiveLoader.loadArchiveFromFiles(files, function (archive) {
                // The archive is set : go back to home page to start searching
                params.storedFile = archive._file._files[0].name;
                cookies.setItem("lastSelectedArchive", params.storedFile, Infinity);
                var reloadLink = document.getElementById("reloadPackagedArchive");
                if (reloadLink) {
                    if (params.packagedFile != params.storedFile) {
                        reloadLink.style.display = "inline";
                        reloadLink.removeEventListener("click", loadPackagedArchive);
                        reloadLink.addEventListener("click", loadPackagedArchive);
                        document.getElementById("moreInfo").style.display = "none";
                    } else {
                        reloadLink.style.display = "none";
                        document.getElementById('currentArchive').style.display = "none";
                        document.getElementById("moreInfo").style.display = "inline";
                    }
                }
                //This ensures the correct icon is set for the newly loaded archive
                cssUIThemeGetOrSet(params.cssUITheme);
                if (params.rescan) {
                    document.getElementById('btnConfigure').click();
                    document.getElementById('btnConfigure').click();
                    params.rescan = false;
                } else {
                    $('#openLocalFiles').hide();
                    if (params.rememberLastPage && ~params.lastPageVisit.indexOf(params.storedFile)) {
                        var lastPage = decodeURIComponent(params.lastPageVisit.replace(/@kiwixKey@.+/, ""));
                        goToArticle(lastPage);
                    } else {
                        // The archive has changed, so we must blank the last page in case the Home page of the new archive
                        // has the same title as the previous archive (possible if it is, for example, "index") 
                        params.lastPageVisit = "";
                        document.getElementById('btnHome').click();
                    }
                }
            });
        }

        function loadPackagedArchive() {
            // Reload any ZIM files in local storage (whcih the user can't otherwise select with the filepicker)
            if (params.localStorage) {
                params.storedFile = params.packagedFile || '';
                params.pickedFolder = params.localStorage;
                scanUWPFolderforArchives(params.localStorage);
                if (!params.rescan) setLocalArchiveFromArchiveList(params.storedFile);
            }
        }

        /**
         * Sets the localArchive from the File selects populated by user
         */
        function setLocalArchiveFromFileSelect() {
            setLocalArchiveFromFileList(document.getElementById('archiveFilesLegacy').files);
        }

        /**
         * Reads a remote archive with given URL, and returns the response in a Promise.
         * This function is used by setRemoteArchives below, for UI tests
         * 
         * @param url The URL of the archive to read
         * @returns {Promise}
         */
        function readRemoteArchive(url) {
            var deferred = q.defer();
            var request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.responseType = "blob";
            request.onreadystatechange = function () {
                if (request.readyState === XMLHttpRequest.DONE) {
                    if (request.status >= 200 && request.status < 300 || request.status === 0) {
                        // Hack to make this look similar to a file
                        request.response.name = url;
                        deferred.resolve(request.response);
                    } else {
                        deferred.reject("HTTP status " + request.status + " when reading " + url);
                    }
                }
            };
            request.onabort = function (e) {
                deferred.reject(e);
            };
            request.send(null);
            return deferred.promise;
        }

        /**
         * This is used in the testing interface to inject remote archives
         */
        window.setRemoteArchives = function () {
            var readRequests = [];
            var i;
            for (i = 0; i < arguments.length; i++) {
                readRequests[i] = readRemoteArchive(arguments[i]);
            }
            return q.all(readRequests).then(function (arrayOfArchives) {
                setLocalArchiveFromFileList(arrayOfArchives);
            });
        };

        /**
         * Handle key input in the prefix input zone
         * @param {Event} evt
         */
        function onKeyUpPrefix(evt) {
            // Use a timeout, so that very quick typing does not cause a lot of overhead
            // It is also necessary for the words suggestions to work inside Firefox OS
            if (window.timeoutKeyUpPrefix) {
                window.clearTimeout(window.timeoutKeyUpPrefix);
            }
            window.timeoutKeyUpPrefix = window.setTimeout(function () {
                var prefix = $("#prefix").val();
                if (prefix && prefix.length > 0) {
                    document.getElementById('searchArticles').click();
                }
            }, 500);
        }


        /**
         * Search the index for DirEntries with title that start with the given prefix (implemented
         * with a binary search inside the index file)
         * @param {String} prefix
         */
        function searchDirEntriesFromPrefix(prefix) {
            if (selectedArchive !== null && selectedArchive.isReady()) {
                $('#activeContent').alert('close');
                if (!prefix || /^\s/.test(prefix)) {
                    var sel = prefix ? prefix.replace(/^\s(.*)/, '$1') : '';
                    if (sel.length) {
                        sel = sel.replace(/^(.)(.*)/, function(p0, p1, p2) {
                            return p1.toUpperCase() + p2;
                        });
                    }
                    showZIMIndex(null, sel);
                } else {
                    selectedArchive.findDirEntriesWithPrefix(prefix.trim(), MAX_SEARCH_RESULT_SIZE, populateListOfArticles);
                }
            } else {
                $('#searchingArticles').hide();
                // We have to remove the focus from the search field,
                // so that the keyboard does not stay above the message
                $('#searchArticles').focus();
                uiUtil.systemAlert("Archive not set : please select an archive");
                document.getElementById('btnConfigure').click();
        }
    }

    /**
     * Extracts and displays in htmlArticle the first MAX_SEARCH_RESULT_SIZE articles beginning with start
     * @param {String} start Optional index number to begin the list with
     * @param {String} prefix Optional search prefix from which to start an alphabetical search
     */
    function showZIMIndex(start, prefix) {
        // If we're searching by title index number (other than 0 or null), we should ignore any prefix
        if (isNaN(start)) { 
            prefix = prefix || '';
        } else {
            prefix = start > 0 ? '' : prefix;
        }
        if (selectedArchive !== null && selectedArchive.isReady()) {
            selectedArchive.findDirEntriesWithPrefixCaseSensitive(prefix, MAX_SEARCH_RESULT_SIZE, function(dirEntryArray, nextStart) {
                var docBody = document.getElementById('largeModal');
                var newHtml = "";
                for (var i = 0; i < dirEntryArray.length; i++) {
                    var dirEntry = dirEntryArray[i];
                    newHtml += "\n<a  class='list-group-item' href='#' dirEntryId='" + dirEntry.toStringId().replace(/'/g, "&apos;")
                        + "'>" + (dirEntry.getTitleOrUrl()) + "</a>";
                }
                start = start ? start : 0;
                var back = start ? '<a href="#" data-start="' + (start - MAX_SEARCH_RESULT_SIZE) +
                    '" class="continueAnchor">&lt;&lt; Previous ' + MAX_SEARCH_RESULT_SIZE + '</a>' : '';
                var next = dirEntryArray.length === MAX_SEARCH_RESULT_SIZE ? '<a href="#" data-start="' + nextStart +
                    '" class="continueAnchor">Next ' + MAX_SEARCH_RESULT_SIZE + ' &gt;&gt;</a>' : '';
                var backNext = back ? next ? back + ' | ' + next : back : next;
                backNext = '<div style="float:right;">' + backNext + '</div>\n';
                var alphaSelector = [];
                // Set up the alphabetic selector
                var lower = params.alphaChar.charCodeAt();
                var upper = params.omegaChar.charCodeAt();
                if (upper <= lower) {
                    alphaSelector.push('<a href="#" class="alphaSelector" data-sel="A">PLEASE SELECT VALID START AND END ALPHABET CHARACTERS IN CONFIGURATION</a>');
                } else {
                    for (i = lower; i <= upper; i++) {
                        var char = String.fromCharCode(i);
                        alphaSelector.push('<a href="#" class="alphaSelector" data-sel="' + char + '">' + char + '</a>');
                    }
                }
                // Add selectors for diacritics, etc. for Roman alphabet
                if (params.alphaChar === 'A' && params.omegaChar == 'Z') {
                    alphaSelector.push('<a href="#" class="alphaSelector" data-sel="¡">¡¿ÀÑ</a>');
                    alphaSelector.unshift('<a href="#" class="alphaSelector" data-sel="!">!#123</a>');
                    // Add way of selecting a non-Roman alphabet
                    var switchAlphaButton = document.getElementById('extraModalFooterContent');
                    // Don't re-add button and event listeners if they already exist
                    if (!/button/.test(switchAlphaButton.innerHTML)) {
                        switchAlphaButton.innerHTML = '<button class="btn btn-primary" style="float:left;" type="button">Switch to non-Roman alphabet</button>';
                        switchAlphaButton.addEventListener('click', function () {
                            var alphaLabel = document.getElementById('alphaCharTxt').parentNode;
                            alphaLabel.style.borderColor = 'red';
                            alphaLabel.style.borderStyle = 'solid';
                            alphaLabel.addEventListener('mousedown', function () {
                                this.style.borderColor = '';
                                this.style.borderStyle = '';
                            });
                            $('#myModal').modal('hide');
                            document.getElementById('btnConfigure').click();
                            window.location.href = "#displaySettingsDiv";
                        });
                    }
                }
                // Add diacritics for Greek alphabet
                if (params.alphaChar === 'Α' && params.omegaChar == 'Ω') {
                    alphaSelector.push('<a href="#" class="alphaSelector" data-sel="Ϊ">ΪΫά</a>');
                    alphaSelector.unshift('<a href="#" class="alphaSelector" data-sel="΄">ΆΈΉ</a>');
                }
                
                var alphaString = '<div style="text-align:center">[ ' + alphaSelector.join(' | \n') + ' ]</div>\n';
                var closeButton = '<button class="close" aria-hidden="true" type="button" data-dismiss="modal">&nbsp;&times;&nbsp;</button>';
                docBody.innerHTML = closeButton + '<br />\n<div style="font-size:120%;"><br />\n' + alphaString + '<br />' + backNext + '</div>\n' + 
                    '<h2>ZIM Archive Index</h2>\n' +
                    '<div id="zimIndex" class="list-group">' + newHtml + '\n</div>\n' +
                    '<div style="font-size:120%">\n' + backNext + '<br /><br />' + alphaString + '</div>\n';
                var indexEntries = docBody.querySelectorAll('.list-group-item');
                $(indexEntries).on('click', function (event) {
                    $("#myModal").modal('hide');
                    handleTitleClick(event);
                    return false;
                });
                var continueAnchors = docBody.querySelectorAll('.continueAnchor');
                $(continueAnchors).on('click', function(e) {
                    document.getElementById('prefix').value = '';
                    var start = ~~this.dataset.start;
                    showZIMIndex(start);
                    return false;
                });
                alphaSelector = docBody.querySelectorAll('.alphaSelector');
                $(alphaSelector).on('click', function(e) {
                    var char = this.dataset.sel;
                    document.getElementById('prefix').value = ' ' + char;
                    showZIMIndex(null, char);
                    return false;
                });
                $('#searchingArticles').hide();
                $('#articleListWithHeader').hide();
                var modalTheme = document.getElementById('modalTheme');
                modalTheme.classList.remove('dark');
                var determinedTheme = params.cssUITheme == 'auto' ? cssUIThemeGetOrSet('auto', true) : params.cssUITheme;
                if (determinedTheme === 'dark') modalTheme.classList.add('dark');
                $('#myModal').modal({
                    backdrop: "static"
                });
                //if ($('#prefix').is(":focus")) {
                //    // This removes the focus from prefix
                //    document.getElementById('findText').click();
                //    document.getElementById('findText').click();
                //}
            }, start);
            }
        }


        /**
         * Display the list of articles with the given array of DirEntry
         * @param {Array} dirEntryArray The array of dirEntries returned from the binary search
         */
        function populateListOfArticles(dirEntryArray) {
            var articleListHeaderMessageDiv = $('#articleListHeaderMessage');
            var nbDirEntry = dirEntryArray ? dirEntryArray.length : 0;
            var message;
            if (nbDirEntry >= MAX_SEARCH_RESULT_SIZE) {
            message = 'First ' + MAX_SEARCH_RESULT_SIZE + ' articles below (refine your search).';
            } else {
            message = nbDirEntry + ' articles found.';
            }
            if (nbDirEntry === 0) {
            message = 'No articles found.';
            }

            articleListHeaderMessageDiv.html(message);

            var articleListDiv = document.getElementById('articleList');
            var articleListDivHtml = '';
            var listLength = dirEntryArray.length < MAX_SEARCH_RESULT_SIZE ? dirEntryArray.length : MAX_SEARCH_RESULT_SIZE;
            for (var i = 0; i < listLength; i++) {
                var dirEntry = dirEntryArray[i];
            articleListDivHtml += '<a href="#" dirEntryId="' + dirEntry.toStringId().replace(/'/g, '&apos;') +
                '" class="list-group-item">' + dirEntry.getTitleOrUrl() + '</a>';
            }
            articleListDiv.innerHTML = articleListDivHtml;
            // Needed so that results show on top of article
            document.getElementById('articleContent').style.position = 'static';
            // We have to use mousedown below instead of click as otherwise the prefix blur event fires first 
            // and prevents this event from firing; note that touch also triggers mousedown
            $('#articleList a').on('mousedown', function (e) {
                handleTitleClick(e);
                return false;
            });
            $('#searchingArticles').hide();
            $('#articleListWithHeader').show();
        }

        /**
         * Handles the click on the title of an article in search results
         * @param {Event} event
         * @returns {Boolean}
         */
        function handleTitleClick(event) {       
            var dirEntryId = event.target.getAttribute("dirEntryId");
            findDirEntryFromDirEntryIdAndLaunchArticleRead(dirEntryId);
            return false;
        }


        /**
         * Creates an instance of DirEntry from given dirEntryId (including resolving redirects),
         * and call the function to read the corresponding article
         * @param {String} dirEntryId
         */
        function findDirEntryFromDirEntryIdAndLaunchArticleRead(dirEntryId) {
            if (selectedArchive.isReady()) {
                var dirEntry = selectedArchive.parseDirEntryId(dirEntryId);
                // Remove focus from search field to hide keyboard
                document.getElementById('searchArticles').focus();
                document.getElementById('searchingArticles').style.display = 'block';
                if (dirEntry.isRedirect()) {
                    selectedArchive.resolveRedirect(dirEntry, readArticle);
                } else {
                    params.isLandingPage = false;
                    readArticle(dirEntry);
                }
            } else {
                uiUtil.systemAlert('Data files not set');
            }
        }

        /**
         * Read the article corresponding to the given dirEntry
         * @param {DirEntry} dirEntry
         */
        function readArticle(dirEntry) {
            if (dirEntry.isRedirect()) {
                selectedArchive.resolveRedirect(dirEntry, readArticle);
            } else {
                //TESTING//
                console.log("Initiating HTML load...");
                console.time("Time to HTML load");
                console.log("Initiating Document Ready timer...");
                console.time("Time to Document Ready");

                //Set startup cookie to guard against boot loop
                //Cookie will signal failure until article is fully loaded
                document.cookie = 'lastPageLoad=failed;expires=Fri, 31 Dec 9999 23:59:59 GMT';

                //Void the localSearch variable to prevent invalid DOM references remainining [kiwix-js-windows #56]
                localSearch = {};

                //Void the iframe
                //window.frames[0].frameElement.src = "about:blank";

                //Load cached start page if it exists and we have loaded the packaged file
                var htmlContent = 0;
                if (params.cachedStartPage && ~selectedArchive._file._files[0].name.indexOf(params.packagedFile) && params.isLandingPage) {
                    htmlContent = -1;
                    // DEV: You should deal with the rare possibility that the cachedStartPage is not in the same namespace as the main page dirEntry...
                    // Ideally include the namespace in params.cachedStartPage and adjust/test code (not hard)
                    uiUtil.XHR(dirEntry.namespace + '/' + encodeURIComponent(params.cachedStartPage), 'text',
                        function (responseTxt, status) {
                            htmlContent = /<html[^>]*>/.test(responseTxt) ? responseTxt : 0;
                            if (htmlContent) {
                                console.log('Article retrieved from storage cache...');
                                // Alter the dirEntry url and title parameters in case we are overriding the start page
                                dirEntry.url = params.cachedStartPage;
                                var title = htmlContent.match(/<title[^>]*>((?:[^<]|<(?!\/title))+)/);
                                dirEntry.title = title ? title[1] : dirEntry.title;
                                displayArticleInForm(dirEntry, htmlContent);
                            } else {
                                document.getElementById('searchingArticles').style.display = 'block';
                                selectedArchive.readUtf8File(dirEntry, displayArticleInForm);
                            }
                        });
                }

                //Load lastPageVisit if it is the currently requested page
                if (!htmlContent) {
                    if (params.rememberLastPage && typeof Storage !== "undefined" &&
                        dirEntry.namespace + '/' + dirEntry.url == decodeURIComponent(params.lastPageVisit.replace(/@kiwixKey@.+/, ""))) {
                        try {
                            htmlContent = localStorage.getItem('lastPageHTML');
                        } catch (err) {
                            console.log("localStorage not supported: " + err);
                        }
                    }
                    if (/<html[^>]*>/.test(htmlContent)) {
                        console.log("Fast article retrieval from localStorage...");
                        setTimeout(function () {
                            displayArticleInForm(dirEntry, htmlContent);
                        }, 100);
                    } else {
                        selectedArchive.readUtf8File(dirEntry, displayArticleInForm);
                    }
                }

            }
        }

        var messageChannel;

        /**
         * Function that handles a message of the messageChannel.
         * It tries to read the content in the backend, and sends it back to the ServiceWorker
         * @param {Event} event
         */
        function handleMessageChannelMessage(event) {
            if (event.data.error) {
                console.error("Error in MessageChannel", event.data.error);
                reject(event.data.error);
            } else {
                console.log("the ServiceWorker sent a message on port1", event.data);
                if (event.data.action === "askForContent") {
                    console.log("we are asked for a content : let's try to answer to this message");
                    var title = event.data.title;
                    var messagePort = event.ports[0];
                    var readFile = function (dirEntry) {
                        if (dirEntry === null) {
                            console.error("Title " + title + " not found in archive.");
                        messagePort.postMessage({'action': 'giveContent', 'title' : title, 'content': ''});
                    } else if (dirEntry.isRedirect()) {
                        selectedArchive.resolveRedirect(dirEntry, function(resolvedDirEntry) {
                            var redirectURL = resolvedDirEntry.namespace + "/" +resolvedDirEntry.url;
                            // Ask the ServiceWork to send anÂ HTTP redirect to the browser.
                            // We could send the final content directly, but it is necessary to let the browser know in which directory it ends up.
                            // Else, if the redirect URL is in a different directory than the original URL,
                            // the relative links in the HTML content would fail. See #312
                            messagePort.postMessage({'action':'sendRedirect', 'title':title, 'redirectUrl': redirectURL});
                            console.log("redirect to " + redirectURL + " sent to ServiceWorker");                            
                            });
                        } else {
                            console.log("Reading binary file...");
                            selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                            var message = {'action': 'giveContent', 'title' : title, 'content': content.buffer};
                            messagePort.postMessage(message, [content.buffer]);
                                console.log("content sent to ServiceWorker");
                            });
                        }
                    };
                    selectedArchive.getDirEntryByTitle(title).then(readFile).fail(function () {
                    messagePort.postMessage({'action': 'giveContent', 'title' : title, 'content': new UInt8Array()});
                        });
            }
            else {
                    console.error("Invalid message received", event.data);
                }
            }
        }

        // Compile some regular expressions needed to modify links
        // Pattern to find the path in a url
        var regexpPath = /^(.*\/)[^\/]+$/;
        // Pattern to find a ZIM URL (with its namespace) - see https://wiki.openzim.org/wiki/ZIM_file_format#Namespaces
        var regexpZIMUrlWithNamespace = /^[.\/]*([-ABIJMUVWX]\/.+)$/;
        // Regex below finds images, scripts, and stylesheets with ZIM-type metadata and image namespaces [kiwix-js #378]
        // It first searches for <img, <script, <link, etc., then scans forward to find, on a word boundary, either src=["']
        // or href=["'] (ignoring any extra whitespace), and it then tests the path of the URL with a non-capturing lookahead that
        // matches ZIM URLs with namespaces [-IJ] ('-' = metadata or 'I'/'J' = image). When the regex is used below, it will also
        // remove any relative or absolute path from ZIM-style URLs.
        // DEV: If you want to support more namespaces, add them to the END of the character set [-IJ] (not to the beginning) 
        var regexpTagsWithZimUrl = /(<(?:img|script|link)\b[^>]*?\s)(?:src|href)(\s*=\s*["'])(?:\.\.\/|\/)+(?=[-IJ]\/)/ig;
        // Regex below tests the html of an article for active content [kiwix-js #466]
        // It inspects every <script> block in the html and matches in the following cases: 1) the script loads a UI application called app.js;
        // 2) the script block has inline content that does not contain "importScript()" or "toggleOpenSection" (these strings are used widely
        // in our fully supported wikimedia ZIMs, so they are excluded); 3) the script block is not of type "math" (these are MathJax markup
        // scripts used extensively in Stackexchange ZIMs). Note that the regex will match ReactJS <script type="text/html"> markup, which is
        // common in unsupported packaged UIs, e.g. PhET ZIMs.
        var regexpActiveContent = /<script\b(?:(?![^>]+src\b)|(?=[^>]+src\b=["'][^"']+?app\.js))(?!>[^<]+(?:importScript\(\)|toggleOpenSection))(?![^>]+type\s*=\s*["'](?:math\/|[^"']*?math))/i;
        // Regex below tests the html of an article for active content [kiwix-js #466]
        // It inspects every <script> block in the html and matches in the following cases: 1) the script loads a UI application called app.js;
        // 2) the script block has inline content that does not contain "importScript()" or "toggleOpenSection" (these strings are used widely
        // in our fully supported wikimedia ZIMs, so they are excluded); 3) the script block is not of type "math" (these are MathJax markup
        // scripts used extensively in Stackexchange ZIMs). Note that the regex will match ReactJS <script type="text/html"> markup, which is
        // common in unsupported packaged UIs, e.g. PhET ZIMs.
        var regexpActiveContent = /<script\b(?:(?![^>]+src\b)|(?=[^>]+src\b=["'][^"']+?app\.js))(?!>[^<]+(?:importScript\(\)|toggleOpenSection))(?![^>]+type\s*=\s*["'](?:math\/|[^"']*?math))/i;
    
        // DEV: The regex below matches ZIM links (anchor hrefs) that should have the html5 "donwnload" attribute added to 
    // the link. This is currently the case for epub and pdf files in Project Gutenberg ZIMs -- add any further types you need
        // to support to this regex. The "zip" has been added here as an example of how to support further filetypes
    var regexpDownloadLinks = /^.*?\.epub($|\?)|^.*?\.pdf($|\?)|^.*?\.zip($|\?)/i;
    
        // This matches the data-kiwixurl of all <link> tags containing rel="stylesheet" in raw HTML unless commented out
        var regexpSheetHref = /(<link\s+(?=[^>]*rel\s*=\s*["']stylesheet)[^>]*data-kiwixurl\s*=\s*["'])([^"']+)(["'][^>]*>)(?!\s*--\s*>)/ig;
        // This matches the title between <title  attrs> ... </title>
        //var regexpArticleTitle = /<title\s*[^>]*>\s*([^<]+)\s*</i;
        // This matches the title of a Type1 Wikimedia ZIM file or any ZIM file using simple <h1 attrs....> Title </h1>
        //var regexpType1ZIMTitle = /<h1\s+[^>]*>\s*([^<]+)\s*</i;
        // This matches the title of a mw-offliner (Type2) Wikimedia ZIM file, specifically 
        //var regexpType2ZIMTitle = /id\s*=\s*['"][^'"]*title_0[^"']*["'][^>]*>\s*([^<]+)\s*</i;

        var containsMathTeXRaw = false;
        var containsMathTeX = false;
        var containsMathSVG = false;
        var treePath;

        // Stores a url to direntry mapping and is refered to/updated anytime there is a css lookup
        // When archive changes these caches should be reset. 
        // Currently happens only in setLocalArchiveFromFileList and setLocalArchiveFromArchiveList.
        //var cssDirEntryCache = new Map(); //This one is never hit!
        var cssBlobCache = new Map();

        /**
         * Display the the given HTML article in the web page,
         * and convert links to javascript calls
         * NB : in some error cases, the given title can be null, and the htmlArticle contains the error message
         *
         * @param {DirEntry} dirEntry
         * @param {String} htmlArticle
         */
        function displayArticleInForm(dirEntry, htmlArticle) {

            //TESTING
            console.log("** HTML received **");
            console.timeEnd("Time to HTML load");
            console.log("Loading stylesheets...");
            console.time("Time to First Paint");
            //return;

            // Calculate the current article's ZIM baseUrl to use when processing relative links
            var baseUrl = dirEntry.namespace + '/' + dirEntry.url.replace(/[^/]+$/, '');

            //Since page has been successfully loaded, store it in the browser history
            if (!window.history.state ||
                !window.history.state.title ||
                !~window.history.state.title.indexOf("/" + dirEntry.url)) {
                pushBrowserHistoryState(dirEntry.namespace + "/" + dirEntry.url);
            }
            if (!~decodeURIComponent(params.lastPageVisit).indexOf(dirEntry.url)) {
                params.lastPageVisit = encodeURIComponent(dirEntry.namespace + "/" + dirEntry.url) +
                    "@kiwixKey@" + selectedArchive._file._files[0].name;
                if (params.rememberLastPage) {
                    cookies.setItem('lastPageVisit', params.lastPageVisit, Infinity);
                    //Store current document's raw HTML in localStorage for fast restart
                    if (typeof Storage !== "undefined") {
                        try {
                            localStorage.setItem('lastPageHTML', htmlArticle);
                        } catch (err) {
                            console.log("localStorage not supported: " + err);
                        }
                    }
                }
            }

            // Display Bootstrap warning alert if the landing page contains active content
            if (!params.hideActiveContentWarning && params.isLandingPage) {
                if (regexpActiveContent.test(htmlArticle)) uiUtil.displayActiveContentWarning();
            }

            // Replaces ZIM-style URLs of img, script, link and media tags with a data-kiwixurl to prevent 404 errors [kiwix-js #272 #376]
            // This replacement also processes the URL to remove the path so that the URL is ready for subsequent jQuery functions
            htmlArticle = htmlArticle.replace(regexpTagsWithZimUrl, '$1data-kiwixurl$2');
            // Remove any empty media containers on page
            htmlArticle = htmlArticle.replace(/(<(audio|video)\b(?:[^<]|<(?!\/\2))+<\/\2>)/ig, function (p0) {
                return /(?:src|data-kiwixurl)\s*=\s*["']/.test(p0) ? p0 : '';
            });

            //@BUG WORKAROUND for Kiwix-JS-Windows #18
            htmlArticle = htmlArticle.replace(/(<link\s+[^>]*?\bhref\s*=\s*["'])(s\/[\s\S]+(?!\.css))(["'])/gi, "$1../-/$2.css$3");

            //Some documents (e.g. Ray Charles Index) can't be scrolled to the very end, as some content remains benath the footer
            //so add some whitespace at the end of the document
            htmlArticle = htmlArticle.replace(/(<\/body>)/i, "\r\n<p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p>\r\n$1");
            htmlArticle = htmlArticle.replace(/(dditional\s+terms\s+may\s+apply\s+for\s+the\s+media\s+files[^<]+<\/div>\s*)/i, "$1\r\n<h1></h1><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p>\r\n");

            //@TODO - remove this when issue fixed: VERY DIRTY PATCH FOR HTML IN PAGE TITLES on Wikivoyage
            htmlArticle = htmlArticle.replace(/&lt;a href[^"]+"\/wiki\/([^"]+)[^<]+&gt;([^<]+)&lt;\/a&gt;/ig, "<a href=\"$1.html\">$2</a>");
            htmlArticle = htmlArticle.replace(/&lt;(\/?)(i|b|em|strong)&gt;/ig, "<$1$2>");

            //@TODO - remove when fixed on mw-offliner: dirty patch for removing extraneous tags in ids
            htmlArticle = htmlArticle.replace(/(\bid\s*=\s*"[^\s}]+)\s*\}[^"]*/g, "$1");

            if (!params.imageDisplay) {
                //Ensure 36px clickable image height so user can request images by clicking [kiwix-js #173]
                htmlArticle = htmlArticle.replace(/(<img\s+[^>]*\b)height(\s*=\s*)/ig,
                    '$1height="36" src="img/lightBlue.png" style="color: lightblue; background-color: lightblue;" ' +
                    'data-kiwixheight$2');
            }

            //Remove erroneous content frequently on front page
            htmlArticle = htmlArticle.replace(/<h1\b[^>]+>[^/]*?User:Popo[^<]+<\/h1>\s*/i, "");
            htmlArticle = htmlArticle.replace(/<span\b[^>]+>[^/]*?User:Popo[^<]+<\/span>\s*/i, "");

            //Put misplaced hatnote headers inside <h1> block back in correct position @TODO remove this when fixed in mw-offliner
            var hatnote = htmlArticle.match(/<h1\b(?:[^<]|<(?!h2))+?((?:<div\s+[^>]+\b(?:hatnote|homonymie)\b[\s\S]+?<\/div>\s*)+)/i);
            if (hatnote && hatnote.length > 1) {
                htmlArticle = htmlArticle.replace(hatnote[1], "");
                htmlArticle = htmlArticle.replace(/(<\/h1>\s*)/i, "$1" + hatnote[1].replace(/(<div\s+)/i, '$1style="padding-top:10px;" '));
            }
            //Put misplaced disambiguation header back in its correct position @TODO remove this when fixed in mw-offliner
            var noexcerpt = htmlArticle.match(/<dl\b(?:[^<]|<(?!\/dl>))+?(?:For other places with the same name|Not to be confused with)(?:[^<]|<(?!\/dl>))+?<\/dl>\s*/i);
            if (noexcerpt && noexcerpt.length) {
                htmlArticle = htmlArticle.replace(noexcerpt, "");
                htmlArticle = htmlArticle.replace(/(<\/h1>\s*)/i, "$1" + noexcerpt);
            }

            //Display IPA pronunciation info erroneously hidden in some ZIMs
            htmlArticle = htmlArticle.replace(/(<span\b[^>]+?class\s*=\s*"[^"]+?mcs-ipa[^>]+?display:\s*)none/i, "$1inline");

            //For all cases, neutralize the toggleOpenSection javascript that causes a crash
            //htmlArticle = htmlArticle.replace(/(onclick\s*=\s*["'])toggleOpenSection[^"']*(['"]\s*)/ig, "$1$2");
            // Remove and save inline javascript contents only (does not remove scripts with src)
            // This is required because most app CSPs forbid inline scripts or require hashes
            // DEV: {5,} in regex means script must have at least 5 characters between the script tags to be matched
            //var regexpScripts = /<script\b(?![^>]+type\s*=\s*["']text\/html)(?![^>]+src\s*=)[^>]*>([^<]{5,})<\/script>/ig;
            //var inlineJavaScripts = [];
            //htmlArticle = htmlArticle.replace(regexpScripts, function(match, inlineScript) {
            //    inlineJavaScripts.push(inlineScript);
            //    return "";
            //});
            // Neutralize all inline scripts for now (later use above), excluding math blocks or react templates
            htmlArticle = htmlArticle.replace(/<(script\b(?![^>]+type\s*=\s*["'](?:math\/|text\/html|[^"']*?math))(?:[^<]|<(?!\/script>))+<\/script)>/ig, function (p0, p1) {
                return '<!-- ' + p1 + ' --!>';
            });
            //Neutralize onload events, as they cause a crash in ZIMs with proprietary UIs
            htmlArticle = htmlArticle.replace(/(<[^>]+?)onload\s*=\s*["'][^"']+["']\s*/ig, '$1');
            //Neutralize onclick events
            htmlArticle = htmlArticle.replace(/(<[^>]+?)onclick\s*=\s*["'][^"']+["']\s*/ig, '$1');
            //Neutralize href="javascript:" links
            htmlArticle = htmlArticle.replace(/href\s*=\s*["']javascript:[^"']+["']/gi, 'href=""');

            //MathJax detection:
            containsMathTeXRaw = params.useMathJax && !/wikivoyage/.test(params.storedFile) ? /\$\$?((?:[^$<>]|<\s|\s>)+)\$\$?([\s<.,;:?!'")\]])/.test(htmlArticle) : false;
            //Simplify any configuration script
            //if (containsMathTeXRaw) htmlArticle = htmlArticle.replace(/(<script\s+[^>]*?type\s*=\s*['"]\s*text\/x-mathjax-config[^>]+>[^<]+?Hub\.Config\s*\(\s*{\s*)[^<]*?(tex2jax\s*:[^}]+?})\s*,[^<]+(<\/script>)/i, "$1$2});$3");
            //Replace all TeX SVGs with MathJax scripts
            if (params.useMathJax) {
                htmlArticle = htmlArticle.replace(/<img\s+(?=[^>]+?math-fallback-image)[^>]*?alt\s*=\s*['"]([^'"]+)[^>]+>/ig, function (p0, math) {
                    // Remove any rogue ampersands in MathJax due to double escaping (by Wikipedia)
                    math = math.replace(/&amp;/g, '&');
                    return '<script type="math/tex">' + math + '</script>';
                });
            }
            containsMathTeX = params.useMathJax ? /<script\s+type\s*=\s*['"]\s*math\/tex\s*['"]/i.test(htmlArticle) : false;
            containsMathSVG = params.useMathJax ? /<img\s+(?=[^>]+?math-fallback-image)[^>]*?alt\s*=\s*['"][^'"]+[^>]+>/i.test(htmlArticle) : false;

            //Adapt German Wikivoyage POI data format
            var regexpGeoLocationDE = /<span\s+class\s?=\s?"[^"]+?listing-coordinates[\s\S]+?latitude">([^<]+)[\s\S]+?longitude">([^<]+)<[\s\S]+?(<span[^>]+listing-name[^>]+>([^<]+)<\/span>)/ig;
            htmlArticle = htmlArticle.replace(regexpGeoLocationDE, function (match, latitude, longitude, href, id) {
                return '<a href="bingmaps:?collection=point.' + latitude + '_' + longitude + '_' + encodeURIComponent(id.replace(/_/g, " ")) +
                    '">\r\n<img alt="Map marker" title="Diesen Ort auf einer Karte zeigen" src="img/icons/map_marker-18px.png" style="position:relative !important;top:-5px !important;margin-top:5px !important" />\r\n</a>' + href;
            });

            //Adapt English Wikivoyage POI data format
            var regexpGeoLocationEN = /(href\s?=\s?")geo:([^,]+),([^"]+)("[^>]+?(?:data-zoom[^"]+"([^"]+))?[^>]+>)[^<]+(<\/a>[\s\S]+?<span\b(?=[^>]+listing-name)[\s\S]+?id\s?=\s?")([^"]+)/ig;
            htmlArticle = htmlArticle.replace(regexpGeoLocationEN, function (match, p1, latitude, longitude, p4, p5, p6, id) {
                return p1 + "bingmaps:?collection=point." + latitude + "_" + longitude + "_" +
                    encodeURIComponent(id.replace(/_/g, " ")).replace(/\.(\w\w)/g, "%$1") +
                    (p5 ? "\&lvl=" + p5 : "") + p4.replace(/style\s?="\s?background:[^"]+"\s?/i, "") + '<img alt="Map marker" title="Show this place on a map" src="img/icons/map_marker-18px.png" style="position:relative !important;top:-5px !important;" />' + p6 + id;
            });

            //Clean up remaining geo: links
            htmlArticle = htmlArticle.replace(/href\s*=\s*"\s*geo:([\d.-]+),([\d.-]+)/ig, 'href="bingmaps:?collection=point.$1_$2_' + encodeURIComponent(dirEntry.getTitleOrUrl()));

            //Setup footnote backlinks if the ZIM doesn't have any
            htmlArticle = htmlArticle.replace(/<li\s+id\s*=\s*"cite_note-([^"]+)"\s*>(?![^/]+↑)/ig, function (match, p1) {
                var fnSearchRegxp = new RegExp('id\\s*=\\s*"(cite[-_]ref[-_]' + p1.replace(/[-_()]/g, "[-_()]") + '[^"]*)', "i");
                var fnReturnMatch = htmlArticle.match(fnSearchRegxp);
                var fnReturnID = fnReturnMatch ? fnReturnMatch[1] : "";
                return match + '\r\n<a href=\"#' + fnReturnID + '">^&nbsp;</a>';
            });

            //Preload stylesheets [kiwix-js #149]
            //Set up blobArray of promises
            var cssArray = htmlArticle.match(regexpSheetHref);
            var blobArray = [];
            var cssSource = params.cssSource;
            var cssCache = params.cssCache;
            var zimType = "";
            if (cssArray) {
                getBLOB(cssArray);
            } else {
                injectHTML();
            }

            //Extract CSS URLs from given array of links
            function getBLOB(arr) {
                var testCSS = arr.join();
                zimType = /-\/s\/style\.css/i.test(testCSS) ? "desktop" : zimType;
                zimType = /-\/static\/main\.css/i.test(testCSS) ? "desktop-stx" : zimType; //Support stackexchange
                zimType = /minerva|mobile/i.test(testCSS) ? "mobile" : zimType;
                cssSource = cssSource == "auto" ? zimType : cssSource; //Default to in-built zimType if user has selected automatic detection of styles
                if (/minerva|inserted.style.mobile/i.test(testCSS) && (cssCache || zimType != cssSource)) {
                    //Substitute ridiculously long style name TODO: move this code to transformStyles
                    for (var i = arr.length; i--;) { //TODO: move to transfromStyles
                        arr[i] = /minerva/i.test(arr[i]) ? '<link data-kiwixurl="-/s/style-mobile.css" rel="stylesheet" type="text/css">' : arr[i];
                        // Delete stylesheet if will be inserted via minerva anyway (avoid linking it twice)
                        if (/inserted.style.mobile/i.test(arr[i]) && /minerva/i.test(testCSS)) {
                            arr.splice(i, 1);
                        }
                    }
                }
                for (var i = 0; i < arr.length; i++) {
                    var zimLink = arr[i].match(/data-kiwixurl\s*=\s*['"]([^'"]+)/i);
                    zimLink = zimLink ? decodeURIComponent(zimLink[1]) : '';
                    //Remove path
                    zimLink = zimLink.replace(/^[.\/]*([\S\s]+)$/, '$1');
                    /* zl = zimLink; zim = zimType; cc = cssCache; cs = cssSource; i  */
                    var filteredLink = transformStyles.filterCSS(zimLink, zimType, cssCache, cssSource, i);
                    if (filteredLink.rtnFunction == "injectCSS") {
                        blobArray[i] = filteredLink.zl;
                        injectCSS();
                    } else {
                        resolveCSS(filteredLink.zl, i);
                    }
                }
            }

            function resolveCSS(title, index) {
                if (cssBlobCache && cssBlobCache.has(title)) {
                    console.log("*** cssBlobCache hit ***");
                    blobArray.push([title, cssBlobCache.get(title)]);
                    injectCSS();
                } else {
                    selectedArchive.getDirEntryByTitle(title)
                        .then(function (dirEntry) {
                            uiUtil.poll("Resolving CSS [" + title.replace(/[^/]+\//g, '').substring(0, 18) + "]...");
                            return selectedArchive.readBinaryFile(dirEntry,
                                function (fileDirEntry, content) {
                                    //DEV: Uncomment line below and break on next to capture cssContent for local filesystem cache
                                    //var cssContent = util.uintToString(content);
                                    var cssBlob = new Blob([content], {
                                        type: 'text/css'
                                    });
                                    var newURL = [fileDirEntry.namespace + "/" + fileDirEntry.url, URL.createObjectURL(cssBlob)];
                                    blobArray.push(newURL);
                                    if (cssBlobCache)
                                        cssBlobCache.set(newURL[0], newURL[1]);
                                    injectCSS(); //DO NOT move this: it must run within .then function to pass correct values
                                });
                        }).fail(function (e) {
                            console.error("could not find DirEntry for CSS : " + title, e);
                            //@TODO Change this to push an array of [title, title] afters simplified code in injectCSS()
                            blobArray.push(title);
                            injectCSS();
                        });
                }
            }

            function injectCSS() {
                // We have to count the blobArray elements because some may have been spliced out
                // See https://stackoverflow.com/questions/28811911/find-array-length-in-javascript
                var blobArrayLength = blobArray.filter(function () { return true; }).length;
                if (blobArrayLength >= cssArray.length) { //If all promised values have been obtained
                    var resultsArray = [];
                    var testBlob;
                    for (var i in cssArray) { //Put them back in the correct order
                        var match = 0;
                        for (var j in blobArray) { //Iterate the blobArray to find the matching entry
                            //console.log("blobArray[j]: " + blobArray[j] + "\r\nblobArray[j][0]: " + blobArray[j][0]);
                            testBlob = blobArray[j][0].length == 1 ? blobArray[j] : blobArray[j][0]; //What a kludge! TODO: fix this ugly mixing of arrays and strings 
                            if (~cssArray[i].indexOf(testBlob)) {
                                match = 1;
                                break;
                            }
                        }
                        testBlob = match && /blob:/i.test(blobArray[j][1]) ? blobArray[j][1] : blobArray[i]; //Whoa!!! Steady on!
                        resultsArray[i] = cssArray[i].replace(/data-kiwixurl\s*=\s*["']([^"']+)/i, 'href="' +
                            testBlob + '" data-kiwixhref="$1'); //Store the original URL for later use
                        //DEV note: do not attempt to add onload="URL.revokeObjectURL...)": see [kiwix.js #284]
                        //DEBUG:
                        //console.log("BLOB CSS #" + i + ": " + resultsArray[i] + "\nshould correspond to: " + testBlob);
                    }
                    cssArray = resultsArray;
                    htmlArticle = htmlArticle.replace(regexpSheetHref, ""); //Void existing stylesheets
                    var cssArray$ = "\r\n" + cssArray.join("\r\n") + "\r\n";
                    if (~cssSource.indexOf("mobile")) { //If user has selected mobile display mode...
                        var mobileCSS = transformStyles.toMobileCSS(htmlArticle, zimType, cssCache, cssSource, cssArray$);
                        htmlArticle = mobileCSS.html;
                        cssArray$ = mobileCSS.css;
                    }
                    if (~cssSource.indexOf("desktop")) { //If user has selected desktop display mode...
                        var desktopCSS = transformStyles.toDesktopCSS(htmlArticle, zimType, cssCache, cssSource, cssArray$);
                        htmlArticle = desktopCSS.html;
                        cssArray$ = desktopCSS.css;
                    }
                    //Add dark mode CSS if required
                    var determinedTheme = params.cssTheme == 'auto' ? cssUIThemeGetOrSet('auto', true) : params.cssTheme;
                    cssArray$ += (determinedTheme == "dark") ? '<link href="-/s/style-dark.css" rel="stylesheet" type="text/css">\r\n' : (params.cssTheme == "invert") ? '<link href="-/s/style-dark-invert.css" rel="stylesheet" type="text/css">\r\n' : "";
                    //Add required path in front of injected styles (i.e. those that have no ./ or ../../.. etc)
                    //cssArray$ = cssArray$.replace(/(\bhref\s*=\s*["']\s*)(?![./]+|blob:)/ig, "$1" + treePath);
                    //Ensure all headings are open
                    //htmlArticle = htmlArticle.replace(/class\s*=\s*["']\s*client-js\s*["']\s*/i, "");
                    htmlArticle = htmlArticle.replace(/\s*(<\/head>)/i, cssArray$ + "$1");
                    console.log("All CSS resolved");
                    injectHTML(); //Pass the revised HTML to the image and JS subroutine...
                } else {
                    uiUtil.poll("Waiting for CSS # " + (cssArray.length - blobArrayLength) + " out of " + cssArray.length + "...");
                }
            }
            //End of preload stylesheets code

            function setupTableOfContents() {
                var iframe = window.frames[0].frameElement;
                var innerDoc = iframe.contentDocument || iframe.contentWindow.document;
                var tableOfContents = new uiUtil.toc(innerDoc);
                var headings = tableOfContents.getHeadingObjects();
                document.getElementById('dropup').style.fontSize = ~~(params.relativeUIFontSize * 0.14) + "px";
                var dropup = "";
                headings.forEach(function (heading) {
                    if (/^h1$/i.test(heading.tagName))
                        dropup += '<li style="font-size:' + params.relativeFontSize + '%;"><a href="#" data-heading-id="' + heading.id + '">' + heading.textContent + '</a></li>';
                    else if (/^h2$/i.test(heading.tagName))
                        dropup += '<li style="font-size:' + ~~(params.relativeFontSize * 0.9) + '%;"><a href="#" data-heading-id="' + heading.id + '">' + heading.textContent + '</a></li>';
                    else if (/^h3$/i.test(heading.tagName))
                        dropup += '<li style="font-size:' + ~~(params.relativeFontSize * 0.75) + '%;"><a href="#" data-heading-id="' + heading.id + '">' + heading.textContent + '</a></li>';
                    //Skip smaller headings (if there are any) to avoid making list too long
                });
                var ToCList = document.getElementById('ToCList');
                ToCList.style.maxHeight = ~~(window.innerHeight * 0.75) + 'px';
                ToCList.style.marginLeft = ~~(window.innerWidth / 2) - ~~(window.innerWidth * 0.16) + 'px';
                ToCList.innerHTML = dropup;
                Array.prototype.slice.call(ToCList.getElementsByTagName('a')).forEach(function (listElement) {
                    listElement.addEventListener('click', function () {
                        window.frames[0].frameElement.contentWindow.location.hash = this.dataset.headingId;
                    });
                });
            }

            function injectHTML() {
                //Inject htmlArticle into iframe
                uiUtil.clear(); //Void progress messages
                // Extract any css classes from the html tag (they will be stripped when injected in iframe with .innerHTML)
                var htmlCSS = htmlArticle.match(/<html[^>]*class\s*=\s*["']\s*([^"']+)/i);
                htmlCSS = htmlCSS ? htmlCSS[1] : '';
                // Tell jQuery we're removing the iframe document: clears jQuery cache and prevents memory leaks [kiwix-js #361]
                $('#articleContent').contents().remove();

                // Remove from DOM any download alert box that was activated in uiUtil.displayFileDownloadAlert function
                $('#downloadAlert').alert('close');
        
                var iframeArticleContent = document.getElementById('articleContent');

                iframeArticleContent.onload = function () {
                    //iframeArticleContent.onload = function () { };

                    // Set a global error handler for iframe
                    window.frames[0].onerror = function (msg, url) {
                        console.log('Error caught in ZIM contents [' + url + ']:\n' + msg);
                        return true;
                    };

                    var articleContent = document.getElementById('articleContent').contentDocument;
                    // Inject the new article's HTML into the iframe
                    articleContent.documentElement.innerHTML = htmlArticle;
                    // Make sure the article area is displayed
                    setTab();
                    // Add any missing classes stripped from the <html> tag
                    if (htmlCSS) articleContent.getElementsByTagName('body')[0].classList.add(htmlCSS);

                    //Set relative font size + Stackexchange-family multiplier
                    articleContent.body.style.fontSize = ~zimType.indexOf("stx") ? params.relativeFontSize * 1.5 + "%" : params.relativeFontSize + "%";
                    //Set page width according to user preference
                    removePageMaxWidth();

                    setupTableOfContents();

                    // Attach listeners to headers to open-close following sections
                    var eles = ["H2", "H3"];
                    for (var i = 0; i < eles.length; i++) {
                        // Process headers
                        var collection = articleContent.getElementsByTagName(eles[i]);
                        for (var j = 0; j < collection.length; j++) {
                            // Prevent heading from getting selected when clicking on it
                            collection[j].style.userSelect = 'none';
                            collection[j].style.msUserSelect = 'none';
                            //collection[j].classList.add("open-block");
                            collection[j].addEventListener("click", function (e) {
                                var that = e.currentTarget;
                                var topTag = that.tagName;
                                that.classList.toggle("open-block");
                                var nextElement = that.nextElementSibling;
                                that = that.parentNode;
                                if (!nextElement) nextElement = that.nextElementSibling;
                                if (!nextElement) return;
                                // Decide toggle direction based on first sibling element
                                var toggleDirection = nextElement.classList.contains("collapsible-block") && !nextElement.classList.contains("open-block") || nextElement.style.display == "none" ? "block" : "none";
                                //if (nextElement.style.display == "none") {
                                //    this.innerHTML += "<br />";
                                //} else {
                                //    this.innerHTML = this.innerHTML.replace(/<br\s*\/?>$/i, "");
                                //}
                                while (nextElement && !~nextElement.tagName.indexOf(topTag) && !~nextElement.tagName.indexOf("H1")) {
                                    if (nextElement.classList.contains("collapsible-block")) {
                                        nextElement.classList.toggle("open-block");
                                    } else if (that.classList.contains("collapsible-block")) {
                                        // We're in a document that has been marked up, but we've encountered one that doesn't have markup, so stop
                                        break;
                                    } else {
                                        nextElement.style.display = toggleDirection;
                                    }
                                    that = nextElement;
                                    nextElement = that.nextElementSibling;
                                }
                            });
                        }
                    }
                    // Process endnote references (so they open the reference block if closed)
                    var refs = articleContent.getElementsByClassName("mw-reflink-text");
                    if (refs) {
                        for (var l = 0; l < refs.length; l++) {
                            var reference = refs[l].parentElement;
                            if (reference) {
                                reference.addEventListener("click", function (obj) {
                                    var refID = obj.target.hash || obj.target.parentNode.hash;
                                    if (!refID) return;
                                    refID = refID.replace(/#/, "");
                                    var refLocation = articleContent.getElementById(refID);
                                    var refNext = util.getClosestBack(refLocation, function (el) {
                                        return el.tagName == "H2";
                                    });
                                    if (refNext) {
                                        refNext.classList.add("open-block");
                                        //refNext.innerHTML = refNext.innerHTML.replace(/<br\s*\/?>$/i, "");
                                        refNext = refNext.nextElementSibling;
                                        while (refNext && refNext.classList.contains("collapsible-block")) {
                                            refNext.classList.add("open-block");
                                            refNext = refNext.nextElementSibling;
                                        }
                                    }
                                });
                            }
                        }
                    }

                    //Hide top-level scrolling -- gets rid of interfering useless scroll bar, but re-enable for Config and About pages
                    document.getElementById('search-article').scrollTop = 0;
                    document.getElementById('search-article').style.overflow = "hidden";

                    var makeLink = uiUtil.makeReturnLink(dirEntry.getTitleOrUrl());
                    var linkListener = eval(makeLink);
                    //Prevent multiple listeners being attached on each browse
                    var returnDivs = document.getElementsByClassName("returntoArticle");
                    for (var i = 0; i < returnDivs.length; i++) {
                        returnDivs[i].removeEventListener('click', linkListener);
                        returnDivs[i].addEventListener('click', linkListener);
                    }
                    checkToolbar();

                    //Listen to iframe key presses for in-page search
                    document.getElementById('articleContent').contentWindow.addEventListener('keyup', function (e) {
                        //Alt-F for search in article, also patches Ctrl-F for apps that do not have access to browser search
                        if ((e.ctrlKey || e.altKey) && e.which == 70) {
                            document.getElementById('findText').click();
                        }
                    });

                    document.getElementById('articleContent').contentWindow.addEventListener('keydown', function (e) {
                        //Ctrl-P to patch printing support, so iframe gets printed
                        if (e.ctrlKey && e.which == 80) {
                            e.stopPropagation();
                            e.preventDefault();
                            printIntercept();
                        }
                    }, true);

                    // Deflect drag-and-drop of ZIM file on the iframe to Config
                    var docBody = articleContent.getElementsByTagName('body')[0];
                    docBody.addEventListener('dragover', handleIframeDragover);
                    docBody.addEventListener('drop', handleIframeDrop);

                    // If the ServiceWorker is not useable, we need to fallback to parse the DOM
                    // to inject math images, and replace some links with javascript calls
                    if (contentInjectionMode === 'jquery') {
                        var currentProtocol = location.protocol;
                        var currentHost = location.host;
                        // Percent-encode dirEntry.url and add regex escape character \ to the RegExp special characters - see https://www.regular-expressions.info/characters.html;
                        // NB dirEntry.url can also contain path separator / in some ZIMs (Stackexchange). } and ] do not need to be escaped as they have no meaning on their own. 
                        var escapedUrl = encodeURIComponent(dirEntry.url).replace(/([\\$^.|?*+\/()[{])/g, '\\$1');
                        // Pattern to match a local anchor in an href even if prefixed by escaped url; will also match # on its own
                        var regexpLocalAnchorHref = new RegExp('^(?:#|' + escapedUrl + '#)([^#]*$)');

                        var iframeArticleContent = document.getElementById('articleContent').contentDocument;
                        // Set state of collapsible sections
                        if (params.openAllSections === true) {
                            var collapsedBlocks = iframeArticleContent.querySelectorAll('.collapsible-block:not(.open-block), .collapsible-heading:not(.open-block)');
                            for (var i = collapsedBlocks.length; i--;) {
                                collapsedBlocks[i].classList.add('open-block');
                            }
                        }

                        Array.prototype.slice.call(iframeArticleContent.querySelectorAll('a, area')).forEach(function (anchor) {
                            // Attempts to access any properties of 'this' with malformed URLs causes app crash in Edge/UWP [kiwix-js #430]
                            try {
                                var testHref = anchor.href;
                            } catch (err) {
                                console.error('Malformed href caused error:' + err.message);
                                return;
                            }
                            var href = anchor.getAttribute('href');
                            if (href === null || href === undefined) return;
                            if (href.length === 0) {
                                // It's a link with an empty href, pointing to the current page: do nothing.
                            } else if (regexpLocalAnchorHref.test(href)) {
                                // It's a local anchor link : remove escapedUrl if any (see above)
                                anchor.setAttribute('href', href.replace(/^[^#]*/, ''));
                            } else if (anchor.protocol !== currentProtocol ||
                                anchor.host !== currentHost) {
                                // It's an external URL : we should open it in a new tab
                                anchor.target = '_blank';
                            } else {
                                // It's a link to an article or file in the ZIM
                                var uriComponent = uiUtil.removeUrlParameters(href);
                                var contentType;
                                var downloadAttrValue;
                                // Some file types need to be downloaded rather than displayed (e.g. *.epub)
                                // The HTML download attribute can be Boolean or a string representing the specified filename for saving the file
                                // For Boolean values, getAttribute can return any of the following: download="" download="download" download="true"
                                // So we need to test hasAttribute first: see https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute
                                // However, we cannot rely on the download attribute having been set, so we also need to test for known download file types
                                var isDownloadableLink = anchor.hasAttribute('download') || regexpDownloadLinks.test(href);
                                if (isDownloadableLink) {
                                    downloadAttrValue = anchor.getAttribute('download');
                                    // Normalize the value to a true Boolean or a filename string or true if there is no download attribute
                                    downloadAttrValue = /^(download|true|\s*)$/i.test(downloadAttrValue) || downloadAttrValue || true;
                                    contentType = anchor.getAttribute('type');
                                }
                                // Add an onclick event to extract this article or file from the ZIM
                                // instead of following the link
                                anchor.addEventListener('click', function (e) {
                                    var zimUrl = uiUtil.deriveZimUrlFromRelativeUrl(uriComponent, baseUrl);
                                    goToArticle(zimUrl, downloadAttrValue, contentType);
                                    e.preventDefault();
                                });
                            }
                        });

                        loadImagesJQuery();
                        //loadJavascript(); //Disabled for now, since it does nothing - also, would have to load before images, ideally through controlled css loads above
                        insertMediaBlobsJQuery();
                        var determinedTheme = params.cssTheme == 'auto' ? cssUIThemeGetOrSet('auto') : params.cssTheme;
                        if (params.allowHTMLExtraction) uiUtil.insertBreakoutLink(determinedTheme);

                        // Document has loaded except for images, so we can now change the startup cookie (and delete) [see init.js]
                        document.cookie = 'lastPageLoad=success;expires=Thu, 21 Sep 1979 00:00:01 UTC';
                    }

                     //End of injectHTML()
                };

                // Load the blank article to clear the iframe (NB iframe onload event runs *after* this)
                iframeArticleContent.src = "article.html";
                //var articleContent = iframeArticleContent.contentDocument;
                //articleContent.open('text/html', 'replace');
                //articleContent.write("<!DOCTYPE html>"); // Ensures browsers parse iframe in Standards mode
                //articleContent.write(htmlArticle);
                //articleContent.close();

            } // End of injectHtml

            function insertMediaBlobsJQuery() {
                var iframe = document.getElementById('articleContent').contentDocument;
                var trackBlob;
                Array.prototype.slice.call(iframe.querySelectorAll('video, audio, source')).forEach(function (mediaSource) {
                    var source = mediaSource.getAttribute('src');
                    source = source ? uiUtil.deriveZimUrlFromRelativeUrl(source, baseUrl) : null;
                    if (!source || !regexpZIMUrlWithNamespace.test(source)) {
                        if (source) console.error('No usable media source was found for: ' + source);
                        return;
                    }
                    var mediaElement = /audio|video/i.test(mediaSource.tagName) ? mediaSource : mediaSource.parentElement;
                    // Create custom subtitle / cc load menu if it doesn't already exist
                    if (!iframe.getElementById('kiwixCCMenu')) buildCustomCCMenu(iframe, mediaElement, function (ccBlob) {
                        trackBlob = ccBlob;
                    });
                    // Load media file
                    selectedArchive.getDirEntryByTitle(decodeURIComponent(source)).then(function (dirEntry) {
                        return selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, mediaArray) {
                            var mimeType = mediaSource.type ? mediaSource.type : dirEntry.getMimetype();
                            var blob = new Blob([mediaArray], { type: mimeType });
                            mediaSource.src = URL.createObjectURL(blob);
                            // In Firefox and Chromium it is necessary to re-register the inserted media source
                            // but do not reload for text tracks (closed captions / subtitles)
                            if (/track/i.test(mediaSource.tagName)) return;
                            mediaElement.load();
                            // Add a download link in case media source not supported
                            document.getElementById('alertBoxFooter').innerHTML =
                                '<div id="downloadAlert" class="alert alert-info alert-dismissible">\n' +
                                '    <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>\n' +
                                '    <span id="alertMessage"></span>\n' +
                                '</div>\n';
                            var alertMessage = document.getElementById('alertMessage');
                            var filename = iframe.title + '_' + dirEntry.url.replace(/^.*\/([^\/]+)$/, '$1');
                            // Make filename safe
                            filename = filename.replace(/[\/\\:*?"<>|]/g, '_');
                            alertMessage.innerHTML = '<a href="#" class="alert-link" id="downloadMedia">Download this file</a> (and any selected subtitles) to play with another app';
                            document.getElementById('downloadMedia').addEventListener('click', function () {
                                var downloadFiles = [];
                                downloadFiles.push({
                                    'blob': blob,
                                    'filename': filename,
                                    'src': mediaSource.src
                                });
                                // Add any selected subtitle file to the download package
                                var selTextTrack = iframe.getElementById('kiwixSelCC');
                                if (selTextTrack) {
                                    var selTextExt = selTextTrack.dataset.kiwixurl.replace(/^.*\.([^.]+)$/, '$1');
                                    // Subtitle files should have same name as video + .es.vtt (for example)
                                    downloadFiles.push({
                                        'blob': trackBlob,
                                        'filename': filename.replace(/^(.*)\.[^.]+$/, '$1.' + selTextTrack.srclang + '.' + selTextExt),
                                        'src': selTextTrack.src
                                    });
                                }
                                for (var j = downloadFiles.length; j--;) {
                                    if (typeof Windows !== 'undefined' && typeof Windows.Storage !== 'undefined') {
                                        uiUtil.downloadBlobUWP(downloadFiles[j].blob, downloadFiles[j].filename, alertMessage);
                                    } else {
                                        var mimeType = downloadFiles[j].blob.type ? downloadFiles[j].blob.type : 'application/octet-stream';
                                        var a = document.createElement('a');
                                        a.href = downloadFiles[j].src;
                                        a.target = '_blank';
                                        a.type = mimeType;
                                        a.download = downloadFiles[j].filename;
                                        alertMessage.appendChild(a); // NB we have to add the anchor to the document for Firefox to be able to click it
                                        try { a.click(); }
                                        catch (err) {
                                            // If the click fails, use an alternative download method
                                            if (window.navigator && window.navigator.msSaveBlob) {
                                                // This works for IE11
                                                window.navigator.msSaveBlob(downloadFiles[j].blob, downloadFiles[j].filename);
                                            }
                                        }
                                    }
                                }
                                iframe.addEventListener('unload', function (e) {
                                    alertMessage.remove();
                                });
                            });
                        });
                    });
                });
            }

            /**
             * Create a custom dropdown menu item beneath the given mediaElement (audio or video block) to allow the user to
             * select the language of text tracks (subtitles/CC) to extract from the ZIM (this is necessary because there is
             * no universal onchange event that fires for subtitle changes in the html5 video widget when the URL is invalid)
             * 
             * @param {Document} doc The document in which the new menu will be placed (usually window.document or iframe)
             * @param {Element} mediaElement The media element (usually audio or video block) which contains the text tracks
             * @param {Function} callback The function to call wtih the blob
             */
            function buildCustomCCMenu(doc, mediaElement, callback) {
                var optionList = [];
                var langs = '';
                var src = '';
                var currentTracks = mediaElement.getElementsByTagName('track');
                // Extract track data from current media element
                for (var i = currentTracks.length; i--;) {
                    langs = currentTracks[i].label + ' [' + currentTracks[i].srclang + ']';
                    src = currentTracks[i].getAttribute('src');
                    src = src ? uiUtil.deriveZimUrlFromRelativeUrl(src, baseUrl) : null;
                    if (src && regexpZIMUrlWithNamespace.test(src)) {
                        optionList.unshift('<option value="' + currentTracks[i].srclang + '" data-kiwixsrc="' +
                            src + '" data-kiwixkind="' + currentTracks[i].kind + '">' + langs + '</option>');
                    }
                    currentTracks[i].parentNode.removeChild(currentTracks[i]);
                }
                optionList.unshift('<option value="" data-kiwixsrc="">None</option>');
                var newKiwixCCMenu = '<select id="kiwixCCMenuLangList">\n' + optionList.join('\n') + '\n</select>';
                // Create the new container and menu
                var d = doc.createElement('DIV');
                d.id = 'kiwixCCMenu';
                d.setAttribute('style', 'margin-top: 1em; text-align: left;');
                d.innerHTML = 'Please select subtitle language: ' + newKiwixCCMenu;
                mediaElement.parentElement.insertBefore(d, mediaElement.nextSibling);
                // Add event listener to extract the text track from the ZIM and insert it into the media element when the user selects it
                newKiwixCCMenu = doc.getElementById('kiwixCCMenu').addEventListener('change', function (v) {
                    var existingCC = doc.getElementById('kiwixSelCC');
                    if (existingCC) existingCC.parentNode.removeChild(existingCC);
                    var sel = v.target.options[v.target.selectedIndex];
                    if (!sel.value) return; // User selected "none"
                    selectedArchive.getDirEntryByTitle(sel.dataset.kiwixsrc).then(function (dirEntry) {
                        return selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, trackContents) {
                            var blob = new Blob([trackContents], { type: 'text/vtt' });
                            var t = doc.createElement('track');
                            t.id = 'kiwixSelCC';
                            t.kind = sel.dataset.kiwixkind;
                            t.label = sel.innerHTML;
                            t.srclang = sel.value;
                            t.default = true;
                            t.src = URL.createObjectURL(blob);
                            t.dataset.kiwixurl = sel.dataset.kiwixsrc;
                            mediaElement.appendChild(t);
                            callback(blob);
                        });
                    });
                });
            }

        } //End of displayArticleInForm()

        params.preloadAllImages = function () {
            if (params.preloadingAllImages !== true) {
                $('#searchingArticles').show();
                params.preloadingAllImages = true;
                if (params.imageDisplay) loadImagesJQuery(10000);
                return;
            }
            // All images should now be loaded, or else user did not request loading images
            uiUtil.extractHTML();
            $('#searchingArticles').hide();
        };
 
        function loadMathJax() {
            //Load MathJax if required and if not already loaded
            if (params.useMathJax) {
                if (!window.frames[0].MathJax && (containsMathTeXRaw || containsMathTeX || containsMathSVG)) {
                    var doc = $("#articleContent").contents()[0];
                    var script = doc.createElement("script");
                    script.type = "text/javascript";
                    script.src = "js/MathJax/MathJax.js?config=TeX-AMS_HTML-full";
                    if (containsMathTeX || containsMathTeXRaw) script.innerHTML = 'MathJax.Hub.Queue(["Typeset", MathJax.Hub]); \
                            console.log("Typesetting maths with MathJax");';
                    containsMathTeXRaw = false; //Prevents doing a second Typeset run on the same document
                    containsMathTeX = false;
                    doc.head.appendChild(script);
                } else if (window.frames[0].MathJax && (containsMathTeXRaw || containsMathTeX || containsMathSVG)) {
                    window.frames[0].MathJax.Hub.Queue(["Typeset", window.frames[0].MathJax.Hub]);
                    console.log("Typesetting maths with MathJax");
                    containsMathTeXRaw = false; //Prevents doing a second Typeset run on the same document
                }
            }
        }

        /**
         * This is the main image loading function.
         * Contains four sub functions: prepareImages, triageImages, displaySlices, loadImageSlice
         * and a utility function checkVisibleImages
         * 
         * @param {Boolean} forPrinting A flag to indicate that all images should be injected 
         */
        function loadImagesJQuery(forPrinting) {

            //TESTING
            console.log("** First Paint complete **");
            console.timeEnd("Time to First Paint");

            //Set up tracking variables
            var countImages = 0;
            //DEV: This sets the maximum number of visible images to request in a single batch (too many will slow image display)
            //NB remaining visible images are shunted into prefetchSlice, which works in the background
            var maxVisibleSliceSize = 10;
            //DEV: Set this to the number of images you want to prefetch after the on-screen images have been fetched
            var prefetchSliceSize = forPrinting ? 10000 : 20;
            //DEV: SVG images are currently very taxing: keep this number at 5 or below and test on your system with Sine.html
            var svgSliceSize = 1;
            var visibleSlice = [];
            var svgSlice = [];
            var svgGroup1 = [];
            var initialSVGRun = true;
            var prefetchSlice = [];
            var windowScroll = true;
            var imageDisplay = params.imageDisplay;

            //Establish master image array
            var images = $('#articleContent').contents().find('body').find('img[data-kiwixurl]');
            var allImages = images.length;

            //If user wants to display images...
            if (imageDisplay) {
                //Set up a listener function for onscroll event
                if (allImages > prefetchSliceSize) {
                    $("#articleContent").contents().scrollStopped(prepareImages);
                }
                if (allImages) {
                    prepareImages();
                } else {
                    console.log("There are no images to display in this article.");
                    loadMathJax();
                    //TESTING
                    console.timeEnd("Time to Document Ready");
                    if (params.printIntercept) printIntercept();
                    if (params.preloadingAllImages)
                        params.preloadAllImages();
                }
            } else {
                console.log("Image retrieval disabled by user");
                //User did not request images, so give option of loading one by one {kiwix-js #173]
                if (images.length) {
                    images.each(function () {
                        // Attach an onclick function to load the image
                        var img = $(this);
                        img.on('click', function () {
                            this.height = this.getAttribute('data-kiwixheight');
                            this.style.background = "";
                            loadImageSlice([this], 0, 0, function (sliceID, sliceCount, sliceEnd, mimetype, data) {
                                img[0].src = "data:" + mimetype + ";base64," + btoa(data);
                            }, true);
                        });
                    });
                }
                //Although user didn't request images, typeset equations
                loadMathJax();

                //TESTING
                console.timeEnd("Time to Document Ready");
                if (params.printIntercept) printIntercept();
                if (params.preloadingAllImages)
                    params.preloadAllImages();
            }

            /** Prepares the main array of images remaining for triage
             * and determines which images are visible
             */
            function prepareImages() {
                //Ensure the function isn't launched multiple times
                if (!windowScroll) {
                    return;
                }
                windowScroll = false;

                //Reload images array because we may have spliced it on a previous loop
                images = $('#articleContent').contents().find('body').find('img[data-kiwixurl]');

                //Remove images that have already been loaded
                var visibleImage = null;
                var lastRemovedPosition = 0;
                for (var i = 0; i < images.length; i++) {
                    if (images[i].src) {
                        visibleImage = uiUtil.isElementInView(images[i]) ? lastRemovedPosition : visibleImage;
                        images.splice(i, 1);
                        i--; //If we removed an image, reset the index
                        lastRemovedPosition++;
                    }
                }

                if (images.length) {
                    console.log("Processing " + images.length + " images...");
                    //Determine first and last visible images in the current window
                    var view = checkVisibleImages();
                    //windowScroll = true;
                    //return;

                    //If there are undisplayed images in the current window...
                    if (view.lastVisible >= 0) {
                        triageImages(view.firstVisible, view.lastVisible);
                    } else {
                        //If the currently visible image(s) have already been loaded...
                        if (visibleImage != null) {
                            //If we are viewing an image within 5 images of the next unloaded image
                            if (lastRemovedPosition - visibleImage <= 5) {
                                triageImages();
                            } else {
                                console.log("No images need prefetching\n\n" +
                                    "** Waiting for user to scroll **");
                                windowScroll = true;
                                if (params.printIntercept) printIntercept();
                                if (params.preloadingAllImages)
                                    params.preloadAllImages();
                            }
                        } else {
                            //We don't know where we are because no images are in view, so we'd better fetch some more
                            triageImages();
                        }
                    }
                } else {
                    //Typeset equations
                    loadMathJax();
                    //Unload scroll listener
                    console.log("Unloading scroll listener");
                    $("#articleContent").contents().off('scroll');
                    windowScroll = true; //Check if it's really unloaded...
                    // All images were already loaded, so we have to check the intercepts here too!
                    if (params.printIntercept) printIntercept();
                    if (params.preloadingAllImages)
                        params.preloadAllImages();
                }

            } //End of prepareImages()

            /**
             * Sort the images into three arrays:
             * visibleSlice (visible images which will be loaded first)
             * svgSlice (groups together SVG images)
             * prefetchSlice (preload set number of non-visible images)
             * Pass the index of the first and last images of visible area if known 
             *
             * @param {number} firstVisible
             * @param {number} lastVisible
             */
            function triageImages(firstVisible, lastVisible) {
                //Set the window of images to be requested
                if (typeof firstVisible === 'undefined' || firstVisible == null) {
                    firstVisible = -1;
                } //No first images was set
                if (typeof lastVisible === 'undefined' || lastVisible == null) {
                    lastVisible = -1;
                } //No first images was set
                var lengthSlice = lastVisible + prefetchSliceSize + 1;
                var startSlice = firstVisible;
                //If the requested images window extends beyond the end of the image array...
                if (lengthSlice > images.length) {
                    //Move the window backwards
                    startSlice -= lengthSlice - images.length;
                    lengthSlice = images.length;
                }
                //Check that the start of the window isn't before the beginning of the array
                startSlice = startSlice < 0 ? 0 : startSlice;


                //Sort through images to put them in the appropriate slice arrays
                svgGroup1 = [];
                var svgGroup2 = [];
                for (var i = startSlice; i < lengthSlice; i++) {
                    if (/\.svg$/i.test(images[i].getAttribute('data-kiwixurl')) ||
                        //Include any kind of maths image fallback that has an alt string in SVG bucket
                        /mwe-math-fallback/i.test(images[i].className) && images[i].alt) {
                        if (i < firstVisible || i > lastVisible) {
                            svgGroup2.push(images[i]);
                        } else {
                            svgGroup1.push(images[i]);
                        }
                    } else {
                        if (i <= lastVisible && visibleSlice.length <= maxVisibleSliceSize) {
                            visibleSlice.push(images[i]);
                        } else {
                            prefetchSlice.push(images[i]);
                        }
                    }
                }
                svgSlice = svgGroup1.concat(svgGroup2);

                //Call displaySlices with all counters zeroed
                //This lets the function know that it should initialize display process
                displaySlices(0, 0, 0);

            } //End of triageImages()

            /**
             * This controls the order in which slices will be displayed and acts as a callback function for loadImageSlice
             * sliceID (callback value) identifies the slices: 1=visibleSlice; 2=prefetchSlice; 3=svgSlice 
             * sliceCount (callback value) keeps count of the images loaded in the current slice
             * sliceEnd (callback value) is the index of the last image in the current slice 
             * Start the function with all values zeroed
             *
             * @callback requestCallback
             * @param {number} sliceID
             * @param {number} sliceCount
             * @param {number} sliceEnd
             */
            function displaySlices(sliceID, sliceCount, sliceEnd) {
                //Only respond to callback if all slice images have been extracted (or on startup)
                if (sliceCount === sliceEnd) {
                    sliceID++; //Get ready to process next slice
                    if (sliceID == 1) {
                        if (visibleSlice.length) {
                            console.log("** Accessing " + visibleSlice.length + " visible image(s)...");
                            loadImageSlice(visibleSlice, 1, visibleSlice.length, displaySlices);
                            visibleSlice = [];
                        } else { //No images in this slice so move on to next
                            sliceID++;
                        }
                    }
                    if (sliceID == 2) {
                        if (prefetchSlice.length) {
                            console.log("** Prefetching " + prefetchSlice.length + " offscreen images...");
                            loadImageSlice(prefetchSlice, 2, prefetchSlice.length, displaySlices);
                            prefetchSlice = [];
                        } else { //No images in this slice so move on to next
                            sliceID++;
                        }
                    }
                    if (sliceID == 3) {
                        //Only load MathJax after visible and prefetched images have been extracted, but before SVGs are pulled
                        loadMathJax();

                        //TESTING
                        if (countImages <= maxVisibleSliceSize + prefetchSliceSize) {
                            console.timeEnd("Time to Document Ready");
                        }

                        if (svgSlice.length) {
                            //Use the MathJax method of typesetting formulae if user has requested this
                            if (params.useMathJax && window.frames[0].MathJax) {
                                /*/If MathJax has not yet completed a typesetting run, discard non-visible SVGs to speed up the initial typesetting operation
                                if (initialSVGRun && svgGroup1.length > 0) {
                                    svgSlice = svgGroup1;
                                }
                                initialSVGRun = false;*/
                                var counter = 0;
                                $(svgSlice).each(function () {
                                    var node = this;
                                    if (/mwe-math-fallback-image/i.test(node.className) && node.alt) {
                                        var script = document.createElement("script");
                                        script.type = "math/tex";
                                        script.text = node.alt;
                                        $(this).replaceWith(script);
                                        console.log("Typesetting image #" + countImages + "...");
                                        countImages++;
                                        svgSlice.splice(counter, 1);
                                    } else {
                                        counter++;
                                    }
                                });
                                window.frames[0].MathJax.Hub.Queue(["Typeset", window.frames[0].MathJax.Hub]);
                            }
                        }
                        //If there are any SVGs left which were not dealt with by MathJax, process fallback images
                        if (svgSlice.length) {
                            console.log("** Slicing " + svgSlice.length + " SVG images...");
                            //Set up variables to hold visible image range (to check whether user scrolls during lengthy procedure)
                            var startSVG;
                            var endSVG;
                            iterateSVGSlice(3, 0, 0);
                        } else { //No images in this slice so move on to next
                            sliceID++;
                        }
                    }
                    if (sliceID > 3) {
                        if (countImages === allImages) {
                            console.log("** All images extracted from current document **");
                            windowScroll = true; //Go back to prove this!
                        } else {
                            console.log("All requested image slices have been processed\n" +
                                "** Waiting for user scroll... **");
                            windowScroll = true;
                        }
                        // Remember that we have requested all images by asking for a huge image slice; therefore it is OK to have these statements here (there will be no more images availabe after that huge slice)
                        if (params.printIntercept) printIntercept();
                        if (params.preloadingAllImages)
                            params.preloadAllImages();
                    }
                }

                /**
                 * This is a specialized callback to iterate the SVGSlice
                 * This slice needs special handling because svg images can hang the program
                 *
                 * @callback requestCallback
                 * @param {number} sliceID
                 * @param {number} sliceCount
                 * @param {number} sliceEnd
                 */
                function iterateSVGSlice(sliceID, sliceCount, sliceEnd) {
                    if (sliceCount === sliceEnd) {
                        //Check to see if visible images have changed (i.e. if user has scrolled)
                        if (!sliceCount) {
                            //console.log("startSVG");
                            startSVG = checkVisibleImages();
                        } else {
                            //console.log("endSVG");
                            endSVG = checkVisibleImages();
                        }
                        if (endSVG) {
                            if (startSVG.firstVisible != endSVG.firstVisible || startSVG.lastVisible != endSVG.lastVisible) {
                                //Visible images have changed, so abandon this svgSlice
                                console.log("** Abandoning svgSlice due to user scroll **");
                                svgSlice = [];
                                windowScroll = true;
                                prepareImages();
                                return;
                            }
                        }
                        var batchSize = svgSliceSize > svgSlice.length ? svgSlice.length : svgSliceSize;
                        if (batchSize) {
                            //Split svgSlice into chunks to avoid hanging the program
                            var svgSubSlice = svgSlice.slice(0, batchSize);
                            svgSlice = svgSlice.slice(batchSize, svgSlice.length);
                            console.log("Requesting batch of " + batchSize + " SVG image(s)...");
                            loadImageSlice(svgSubSlice, 3, batchSize, iterateSVGSlice);
                        } else {
                            console.log("** Finished iterating svgSlice");
                            displaySlices(3, 0, 0);
                        }
                    }
                } //End of iterateSVGSlice()

            } //End of displaySlices()

            /**
             * Loads images in the array passed as images
             * sliceID will be passed to the callback 
             * sliceEnd is the index of the last image in the current slice 
             * dataRequested == true returns the content and disables creation of blob
             *
             * @param {Array} images
             * @param {number} sliceID
             * @param {number} sliceEnd
             * @param {requestCallback} callback
             * @param {Boolean} dataRequested
             */
            function loadImageSlice(images, sliceID, sliceEnd, callback, dataRequested) {
                var sliceCount = 0;
                Array.prototype.slice.call(images).forEach(function (image) {
                    var title = decodeURIComponent(image.dataset.kiwixurl);
                    selectedArchive.getDirEntryByTitle(title).then(function (dirEntry) {
                        selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                            var url = fileDirEntry.url;
                            var mimetype = dirEntry.getMimetype();
                            if (!dataRequested) {
                                uiUtil.feedNodeWithBlob(image, 'src', content, mimetype, params.allowHTMLExtraction);
                            }
                            sliceCount++;
                            console.log("Extracted image #" + countImages + "...");
                            countImages++;
                            if (!dataRequested) {
                                callback(sliceID, sliceCount, sliceEnd, url);
                            } else {
                                callback(sliceID, sliceCount, sliceEnd, mimetype, util.uintToString(content));
                            }
                        });
                    }).fail(function (e) {
                        sliceCount++;
                        console.error("Could not find DirEntry for image:" + title, e);
                        countImages++;
                        callback(sliceID, sliceCount, sliceEnd, "Error!");
                    });
                });
            } //End of loadImageRange()

            /**
             * This is a utility function to check the window of images visible to the user.
             * It needs to be run within the scope of the main images array.
             * Returns an object with attributes .firstVisible and .lastVisible
             * They return null if no images are currently visible.
             */
            function checkVisibleImages() {
                var firstVisible = null;
                var lastVisible = null;
                //Determine first and last visible images in the current window
                for (var i = 0; i < images.length; i++) {
                    //console.log("Checking #" + i + ": " + images[i].getAttribute("data-kiwixurl"));
                    if (uiUtil.isElementInView(images[i])) {
                        //console.log("#" + i + " *is* visible");
                        if (firstVisible == null) {
                            firstVisible = i;
                        }
                        lastVisible = i;
                    } else {
                        //console.log("#" + i + " is not visible");
                        if (firstVisible != null && lastVisible != null) {
                            console.log("First visible image is #" + firstVisible + "\n" +
                                "Last visible image is #" + lastVisible);
                            break; //We've found the last visible image, so stop the loop
                        }
                    }
                }
                return {
                    firstVisible: firstVisible,
                    lastVisible: lastVisible
                };
            }

        } //End of loadImagesJQuery()

        // Load Javascript content
        function loadJavaScriptJQuery() {
            $('#articleContent').contents().find('script[data-kiwixurl]').each(function() {
                var script = $(this);
                var scriptUrl = script.attr("data-kiwixurl");
                // TODO check that the type of the script is text/javascript or application/javascript
                var title = uiUtil.removeUrlParameters(decodeURIComponent(scriptUrl));
                    selectedArchive.getDirEntryByTitle(title).then(function (dirEntry) {
                    if (dirEntry === null) {
                            console.log("Error: js file not found: " + title);
                    } else {
                            selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                            // TODO : JavaScript support not yet functional [kiwix-js #152]
                                uiUtil.feedNodeWithBlob(script, 'src', content, 'text/javascript', params.allowHTMLExtraction);
                            });
                    }
                    }).fail(function (e) {
                        console.error("could not find DirEntry for javascript : " + title, e);
                    });
            });
        }

        /**
         * Changes the URL of the browser page, so that the user might go back to it
         * 
         * @param {String} title
         * @param {String} titleSearch
         */
        function pushBrowserHistoryState(title, titleSearch) {
            var stateObj = {};
            var urlParameters;
            var stateLabel;
            if (title && !("" === title)) {
            // Prevents creating a double history for the same page
            if (history.state && history.state.title === title) return;
                stateObj.title = title;
                urlParameters = "?title=" + title;
                stateLabel = "Wikipedia Article : " + title;
            } else if (titleSearch && !("" === titleSearch)) {
                stateObj.titleSearch = titleSearch;
                urlParameters = "?titleSearch=" + titleSearch;
                stateLabel = "Wikipedia search : " + titleSearch;
            } else {
                return;
            }
            window.history.pushState(stateObj, stateLabel, urlParameters);
        }


        /**
     * Extracts the content of the given article title, or a downloadable file, from the ZIM
         * 
         * @param {String} title The path and filename to the article or file to be extracted
     * @param {Boolean|String} download A Bolean value that will trigger download of title, or the filename that should
     *     be used to save the file in local FS (in HTML5 spec, a string value for the download attribute is optional)
         * @param {String} contentType The mimetype of the downloadable file, if known 
         */
        function goToArticle(title, download, contentType) {
            //This removes any search highlighting
            clearFindInArticle();
            //Re-enable top-level scrolling
            document.getElementById('top').style.position = "relative";
            document.getElementById('scrollbox').style.position = "fixed";
            document.getElementById('scrollbox').style.height = window.innerHeight + "px";
            document.getElementById('searchingArticles').style.display = 'block';
            selectedArchive.getDirEntryByTitle(title).then(function (dirEntry) {
                if (dirEntry === null || dirEntry === undefined) {
                    document.getElementById('searchingArticles').style.display = 'none';
                    console.error("Article with title " + title + " not found in the archive");
                    goToMainArticle();
                } else if (download) {
                    selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                        uiUtil.displayFileDownloadAlert(title, download, contentType, content);
                    });
                } else {
                    params.isLandingPage = false;
                    $('#activeContent').alert('close');
                    readArticle(dirEntry);
                }
            }).fail(function () {
                console.error("Error reading article with title " + title);
            });
        }

        function goToRandomArticle() {
            document.getElementById('searchingArticles').style.display = 'block';
            if (selectedArchive === null) {
                return;
            } //Prevents exception if user hasn't selected an archive
            selectedArchive.getRandomDirEntry(function (dirEntry) {
                if (dirEntry === null || dirEntry === undefined) {
                    document.getElementById('searchingArticles').style.display = 'none';
                    uiUtil.systemAlert("Error finding random article.");
                } else {
                    //Test below supports Stackexchange-family ZIMs, so we don't call up user profiles
                    if (dirEntry.namespace === 'A' && !/user\//.test(dirEntry.url)) {
                        params.isLandingPage = false;
                        $('#activeContent').alert('close');
                        readArticle(dirEntry);
                    } else {
                        // If the random title search did not end up on an article,
                        // we try again, until we find one
                        goToRandomArticle();
                    }
                }
            });
        }

        function goToMainArticle() {
            document.getElementById('searchingArticles').style.display = 'block';
            selectedArchive.getMainPageDirEntry(function (dirEntry) {
                if (dirEntry === null || dirEntry === undefined) {
                    console.error("Error finding main article.");
                    document.getElementById('searchingArticles').style.display = 'none';
                    $("#welcomeText").show();
                } else {
                    if (dirEntry.namespace === 'A') {
                        params.isLandingPage = true;
                        readArticle(dirEntry);
                    } else {
                        console.error("The main page of this archive does not seem to be an article");
                        $("#searchingArticles").hide();
                        $("#welcomeText").show();
                    }
                }
            });
        }
    });