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

        //TESTING
        // Get the app's installation folder.
        //var appFolder = Windows.ApplicationModel.Package.current.installedLocation;
        var appfolder = "";
        // Print the folder's path to the Visual Studio Output window.
        //console.log(appFolder.name, "folder path:", appFolder.path);
        //END TESTING

        /**
        * @type ZIMArchive
        */
        var selectedArchive = null;

        /**
         * Resize the IFrame height, so that it fills the whole available height in the window
         */
        function resizeIFrame() {
            var height = $(window).outerHeight()
                //- $("#top").outerHeight(true)
                - $("#articleListWithHeader").outerHeight(true)
                // TODO : this 5 should be dynamically computed, and not hard-coded
                //- 5;
                + 10; //Try adding extra space to get pesky x-scrollbar out of way
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
            var that = this, $this = $(that);
            $this.scroll(function (ev) {
                clearTimeout($this.data('scrollTimeout'));
                $this.data('scrollTimeout', setTimeout(callback.bind(that), 250, ev));
            });
        }

        // Define behavior of HTML elements
        $('#searchArticles').on('click', function (e) {
            pushBrowserHistoryState(null, $('#prefix').val());
            searchDirEntriesFromPrefix($('#prefix').val());
            $("#welcomeText").hide();
            $("#readingArticle").hide();
            $("#articleContent").hide();
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
        $('#formArticleSearch').on('submit', function (e) {
            document.getElementById("searchArticles").click();
            return false;
        });
        $('#prefix').on('keyup', function (e) {
            if (selectedArchive !== null && selectedArchive.isReady()) {
                if (e.which == 40) {
                    var articleResults = document.querySelectorAll('.list-group-item');
                    if (articleResults && articleResults.length) {
                        articleResults[0].focus();
                    }
                }    
                onKeyUpPrefix(e);
            }
        });

        //Add keyboard shortcuts
        $(window).on('keyup', function (e) {
            var e = e || window.event;
            //Alt-F for search in article, also patches Ctrl-F for apps that do not have access to browser search
            if ((e.ctrlKey || e.altKey) && e.which == 70) {
                $('#findText').click();
                return false;
            }
        });
        //Also have to listen to iframe key presses
        document.getElementById('articleContent').contentWindow.addEventListener('keyup', function (e) {
            //Alt-F for search in article, also patches Ctrl-F for apps that do not have access to browser search
            if ((e.ctrlKey || e.altKey) && e.which == 70) {
                $('#findText').click();
                return false;
            }
        }), false;

        var localSearch = {};
        var firstRun = false;

        function clearFindInArticle() {
            document.getElementById('findInArticle').value = "";
            if (localSearch.remove) localSearch.remove();
            document.getElementById('matches').innerHTML = "Full: 0";
            document.getElementById('partial').innerHTML = "Partial: 0";
            document.getElementById('row2').style.display = "none";
            document.getElementById('findText').classList.remove("active");
        }

        $('#findText').on('click', function (e) {
            var innerDocument = window.frames[0].frameElement.contentDocument || window.frames[0].frameElement.contentWindow.document;
            innerDocument = innerDocument ? innerDocument.body : null;
            if (!innerDocument || innerDocument.innerHTML.length < 10) return;
            var searchDiv = document.getElementById('row2');
            var findInArticle = document.getElementById('findInArticle');
            if (searchDiv.style.display == 'none') {
                setHomeTab('findText');
                searchDiv.style.display = "inline";
                findInArticle.focus();
            } else {
                clearFindInArticle();
            }
            if (localSearch.remove) {
                localSearch.remove();
            } else if (searchDiv.style.display == "inline") {
                localSearch = new util.Hilitor(innerDocument);
                //TODO: Check right-to-left language support...
                localSearch.setMatchType('left');
                var timer = null;
                findInArticle.addEventListener('keyup', function (e) {
                    //Ensure timeout doesn't occur if another key has been pressed within time window
                    clearTimeout(timer);
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
                    //Ensure nothing happens if only one value has been entered (not specific enough), but ensure timeout is set 
                    //if no value has been entered (clears highlighting if user deletes all values in search field)
                    if (~(val.length - 2)) {
                        localSearch.scrollFrom = 0;
                        localSearch.lastScrollValue = val;
                        timer = setTimeout(function () {
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
                        }, 500);
                    }
                }, false);
            }
        });

        $("#btnRandomArticle").on("click", function (e) {
            setHomeTab('btnRandomArticle');
            //Re-enable top-level scrolling
            document.getElementById('top').style.position = "relative";
            document.getElementById('scrollbox').style.position = "fixed";
            document.getElementById('scrollbox').style.height = window.innerHeight + "px";
            goToRandomArticle();
        });

        $('#btnRescanDeviceStorage').on("click", function (e) {
            var returnDivs = document.getElementsByClassName("returntoArticle");
            for (var i = 0; i < returnDivs.length; i++) {
                returnDivs[i].innerHTML = "";
            }
            //Stop app from jumping straight into to first archive if user initiated the scan (to give user a chance to select the archive manually)
            params.rescan = true;
            //Reload any ZIM files in local storage (whcih the usar can't otherwise select with the filepicker)
            if (params.localStorage) {
                scanUWPFolderforArchives(params.localStorage);
            }
            if (storages.length) {
                searchForArchivesInStorage();
            } else {
                displayFileSelect();
            }
        });
        // Bottom bar :
        // @TODO Since bottom bar now hidden this code makes no sense, consider adding it to top home button instead
        $('#btnBack').on('click', function (e) {
            if (document.getElementById('articleContent').style.display == "none") {
                $('#returntoArticle').click();
                return false;
            }
            clearFindInArticle();
            history.back();
            return false;
        });
        $('#btnForward').on('click', function (e) {
            clearFindInArticle();
            history.forward();
            return false;
        });
        document.getElementById('articleContent').contentDocument.body.style.fontSize = params.relativeFontSize + "%";
        $('#btnZoomin').on('click', function (e) {
            params.relativeFontSize += 5;
            document.getElementById('articleContent').contentDocument.body.style.fontSize = params.relativeFontSize + "%";
            document.getElementById('lblZoom').innerHTML = params.relativeFontSize + "%";
            document.getElementById('lblZoom').style = "position:absolute;right: " + window.innerWidth / 3 + "px;bottom:5px;z-index:50;";
            setTimeout(function () {
                document.getElementById('lblZoom').innerHTML = "";
            }, 1000);
            cookies.setItem('relativeFontSize', params.relativeFontSize, Infinity);
            return false;
        });
        $('#btnZoomout').on('click', function (e) {
            params.relativeFontSize -= 5;
            document.getElementById('articleContent').contentDocument.body.style.fontSize = params.relativeFontSize + "%";
            document.getElementById('lblZoom').innerHTML = params.relativeFontSize + "%";
            document.getElementById('lblZoom').style = "position:absolute;left: " + window.innerWidth / 3 + "px;bottom:5px;z-index:50;";
            setTimeout(function () {
                document.getElementById('lblZoom').innerHTML = "";
            }, 1000);
            cookies.setItem('relativeFontSize', params.relativeFontSize, Infinity);
            return false;
        });
        setRelativeUIFontSize(params.relativeUIFontSize);
        $('#relativeUIFontSizeSlider').on('change', function () {
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
            var buttons = document.querySelectorAll('.btn');
            for (var i = 0; i < buttons.length; i++) {
                buttons[i].style.fontSize = ~~(value * 14 / 100) + "px";
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

        $('#btnHomeBottom').on('click', function (e) {
            $('#btnHome').click();
            return false;
        });
        $('#btnTop').on('click', function (e) {
            //Ensures toolbar is shown after hidden
            var thisdoc = document.getElementById('top');
            if (params.hideToolbar && thisdoc.style.zIndex == "0") {
                params.hideToolbar = false;
                checkToolbar();
                params.hideToolbar = true;
                return
            };
            //document.getElementById('article').style.marginTop = "46px";
            $("#articleContent").contents().scrollTop(0);
            $("#search-article").scrollTop(0);
            // We return true, so that the link to #top is still triggered (useful in the About section)
            return true;
        });
        // Top menu :
        $('#btnHome').on('click', function (e) {
            setHomeTab('btnHome');
            // Give the focus to the search field, and clean up the page contents
            if (!firstRun) {
                $('#prefix').focus();
                firstRun = false;
            }
            $('#articleContent').hide();
            $('#articleContent').contents().empty();
            $('#searchingForArticles').hide();
            $('#welcomeText').show();
            $('#articleList').show();
            $('#articleListHeaderMessage').show();
            if (selectedArchive !== null && selectedArchive.isReady()) {
                $('#welcomeText').hide();
                goToMainArticle();
            }
            return false;
        });

        function setHomeTab(activeBtn) {
            // Highlight the selected section in the navbar
            $('#liHomeNav').attr("class", "active");
            $('#liConfigureNav').attr("class", "");
            $('#liAboutNav').attr("class", "");
            if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
                $('#navbarToggle').click();
            }
            setActiveBtn(activeBtn);
            clearFindInArticle();
            //Re-enable bottom toolbar display
            document.getElementById('footer').style.display = "block";
            //Re-enable top-level scrolling
            document.getElementById('top').style.position = "relative";
            document.getElementById('scrollbox').style.position = "fixed";
            document.getElementById('scrollbox').style.height = window.innerHeight + "px";
            //Use the "light" navbar if the content is "light" (otherwise it looks shite....)
            if (params.cssTheme == "light" && params.cssUITheme == "dark") {
                document.getElementById('search-article').classList.remove("dark");
                document.getElementById('findInArticle').classList.remove("dark");
                document.getElementById('prefix').classList.remove("dark");
            }
            // Show the selected content in the page
            $('#about').hide();
            $('#configuration').hide();
            $('#formArticleSearch').show();
            $('#articleContent').show();
            $("#prefix").val("");
            $("#articleList").empty();
            $('#articleList').hide();
            $('#articleListHeaderMessage').empty();
            $("#readingArticle").hide();
            $("#welcomeText").hide();
            // Scroll the iframe to its top
            $("#articleContent").contents().scrollTop(0);
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

        $('#btnConfigure').on('click', function (e) {
            var searchDiv = document.getElementById('configuration');
            if (searchDiv.style.display != 'none') {
                setHomeTab();
                if (params.themeChanged) {
                    params.themeChanged = false;
                    if (history.state !== null) {
                        var thisURL = decodeURIComponent(history.state.title);
                        goToArticle(thisURL);
                    }
                }
                return;
            }
            setHomeTab('btnConfigure');
            // Highlight the selected section in the navbar
            $('#liHomeNav').attr("class", "");
            $('#liConfigureNav').attr("class", "active");
            $('#liAboutNav').attr("class", "");
            if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
                $('#navbarToggle').click();
            }
            //Return navbar to dark state if we switched it earlier
            if (params.cssTheme == "light" && params.cssUITheme == "dark") {
                document.getElementById('search-article').classList.add("dark");
                document.getElementById('findInArticle').classList.add("dark");
                document.getElementById('prefix').classList.add("dark");
            }
            //Hide footer toolbar
            document.getElementById('footer').style.display = "none";
            // Show the selected content in the page
            $('#configuration').show();
            $('#articleContent').hide();
            $('#downloadLinks').hide();
            $('#serverResponse').hide();
            refreshAPIStatus();
            //Re-enable top-level scrolling
            document.getElementById('top').style.position = "relative";
            document.getElementById('scrollbox').style.position = "fixed";
            document.getElementById('scrollbox').style.height = document.documentElement.clientHeight + "px";
            document.getElementById('search-article').style.overflowY = "auto";
            
            //If user hadn't previously picked a folder or a file, resort to the local storage folder (UWP functionality)
            if (params.localStorage && !params.pickedFolder && !params.pickedFile) {
                params.pickedFolder = params.localStorage;
            }
            if (typeof Windows === 'undefined') {
                //If not UWP, display legacy File Select
                document.getElementById('archiveFile').style.display = "none";
                document.getElementById('archiveFiles').style.display = "none";
                document.getElementById('UWPInstructions').style.display = "none";
                document.getElementById('instructions').style.display = "inline";
                document.getElementById('archiveFilesLegacy').style.display = "inline";
                $('#archiveFilesLegacy').on('change', setLocalArchiveFromFileSelect)
            }
            return false;
        });
        $('#btnAbout').on('click', function (e) {
            //Check if we're 'unclicking' the button
            var searchDiv = document.getElementById('about');
            if (searchDiv.style.display != 'none') {
                setHomeTab();
                return;
            }
            // Highlight the selected section in the navbar
            $('#liHomeNav').attr("class", "");
            $('#liConfigureNav').attr("class", "");
            $('#liAboutNav').attr("class", "active");
            if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
                $('#navbarToggle').click();
            }
            setHomeTab('btnAbout');
            if (params.cssTheme == "light" && params.cssUITheme == "dark") {
                document.getElementById('search-article').classList.add("dark");
                document.getElementById('findInArticle').classList.add("dark");
                document.getElementById('prefix').classList.add("dark");
            }
            //Hide footer toolbar
            document.getElementById('footer').style.display = "none";
            // Show the selected content in the page
            $('#about').show();
            $('#articleContent').hide();
            //Re-enable top-level scrolling
            document.getElementById('top').style.position = "relative";
            document.getElementById('scrollbox').style.position = "fixed";
            document.getElementById('scrollbox').style.height = document.documentElement.clientHeight + "px";
            document.getElementById('search-article').style.overflowY = "auto";
            return false;
        });
        // TODO: I've set up two event listeners below because the archive list doesn't "change" if there is only one element in it
        // See if this can be simplified.... (but note that keyboard users might not click)
        $('#archiveList').on('change', function () {
            console.log("***Archive List change event fired")
            $('#openLocalFiles').hide();
            setLocalArchiveFromArchiveList();
        });
        $('#archiveList').on('click', function () {
            console.log("***Archive List click event fired:  ***WHY***??? checking length of options list...")
            //Doh, why are you testing for this? Surely you want to jump to the file if it's been clicked on? There was a reason @REMIND_ME....
            //var comboArchiveList = document.getElementById('archiveList');
            //if (comboArchiveList.options.length == 1) {
            //console.log("***Only one item, so, fire away...");
            $('#openLocalFiles').hide();
            setLocalArchiveFromArchiveList();
            //}
        });

        $('#archiveFile').on('click', function () {
            if (typeof Windows !== 'undefined' && typeof Windows.Storage !== 'undefined') {
                //UWP FilePicker [kiwix-js-windows #3]
                pickFileUWP();
            } else {
                //@TODO enable and provide classic filepicker
            }
        });
        $('#archiveFiles').on('click', function () {
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
            }
            else {
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
            cookies.setItem('imageDisplay', params.imageDisplay, Infinity);
        });
        $('input:checkbox[name=hideToolbar]').on('change', function (e) {
            params.hideToolbar = this.checked ? true : false;
            cookies.setItem('hideToolbar', params.hideToolbar, Infinity);
            //checkToolbar();
        });
        $('input:checkbox[name=cssUIDarkTheme]').on('change', function (e) {
            params.cssUITheme = this.checked ? 'dark' : 'light';
            cookies.setItem('cssUITheme', params.cssUITheme, Infinity);
            cssUIThemeSet(params.cssUITheme);
            if (params.cssUITheme !== params.cssTheme) $('#cssWikiDarkThemeCheck').click();
        });

        function cssUIThemeSet(value) {
            if (value == 'dark') {
                document.getElementsByTagName('body')[0].classList.add("dark");
                //document.getElementById('article').classList.add("dark");
                //document.getElementById('navbar').classList.remove("navbar-default");
                //document.getElementById('navbar').classList.add("dark");
                document.getElementById('archiveFilesLegacy').classList.add("dark");
                document.getElementById('footer').classList.add("darkfooter");
                document.getElementById('archiveFilesLegacy').classList.remove("btn");
                //document.getElementById('container').classList.add("dark");
                document.getElementById('findInArticle').classList.add("dark");
                document.getElementById('prefix').classList.add("dark");
                var elements = document.querySelectorAll(".settings");
                for (var i = 0; i < elements.length; i++) { elements[i].style.border = "1px solid darkgray"; }
                document.getElementById('kiwixIcon').src = /wikivoyage/i.test(params.storedFile) ? "./img/icons/wikivoyage-white-32.png" : /medicine/i.test(params.storedFile) ? "./img/icons/wikimed-lightblue-32.png" : "./img/icons/kiwix-32.png";
            }
            if (value == 'light') {
                document.getElementsByTagName('body')[0].classList.remove("dark");
                document.getElementById('search-article').classList.remove("dark");
                //document.getElementById('article').classList.remove("dark");
                //document.getElementById('navbar').classList.add("navbar-default");
                //document.getElementById('navbar').classList.remove("dark");
                document.getElementById('footer').classList.remove("darkfooter");
                document.getElementById('archiveFilesLegacy').classList.remove("dark");
                document.getElementById('archiveFilesLegacy').classList.add("btn");
                //document.getElementById('container').classList.remove("dark");
                document.getElementById('findInArticle').classList.remove("dark");
                document.getElementById('prefix').classList.remove("dark");
                var elements = document.querySelectorAll(".settings");
                for (var i = 0; i < elements.length; i++) { elements[i].style.border = "1px solid black"; }
                document.getElementById('kiwixIcon').src = /wikivoyage/i.test(params.storedFile) ? "./img/icons/wikivoyage-black-32.png" : /medicine/i.test(params.storedFile) ? "./img/icons/wikimed-blue-32.png" : "./img/icons/kiwix-blue-32.png";
            }
        }

        $('input:checkbox[name=cssWikiDarkTheme]').on('change', function (e) {
            params.cssTheme = this.checked ? 'dark' : 'light';
            if (!this.checked) document.getElementById('cssWikiDarkThemeInvertCheck').checked = false; 
            if (this.checked) document.getElementById('footer').classList.add("darkfooter");
            if (!this.checked) document.getElementById('footer').classList.remove("darkfooter");
            document.getElementById('darkInvert').style.display = this.checked ? "inline" : "none"; 
            params.cssTheme = document.getElementById('cssWikiDarkThemeInvertCheck').checked && params.cssTheme == 'dark' ? 'invert' : params.cssTheme;
            cookies.setItem('cssTheme', params.cssTheme, Infinity);
            params.themeChanged = true;
        });
        $('input:checkbox[name=cssWikiDarkThemeInvert]').on('change', function (e) {
            if (params.cssTheme == "light" && this.checked) document.getElementById('cssWikiDarkThemeInvertCheck').checked = true;
            params.cssTheme = this.checked ? 'invert' : 'dark';
            cookies.setItem('cssTheme', params.cssTheme, Infinity);
            params.themeChanged = true;
        });
        $('input:checkbox[name=rememberLastPage]').on('change', function (e) {
            if (params.rememberLastPage && this.checked) document.getElementById('rememberLastPageCheck').checked = true;
            params.rememberLastPage = this.checked ? true : false;
            cookies.setItem('rememberLastPage', params.rememberLastPage, Infinity);
            if (!params.rememberLastPage) {
                cookies.setItem('lastPageVisit', "", Infinity);
            }
        });
        $('input:radio[name=cssInjectionMode]').on('click', function (e) {
            params.cssSource = this.value;
            cookies.setItem('cssSource', params.cssSource, Infinity);
            params.themeChanged = true;
        });
        $('input:radio[name=useMathJax]').on('click', function (e) {
            params.useMathJax = this.value;
            cookies.setItem('useMathJax', params.useMathJax, Infinity);
            params.themeChanged = true;
        });
        $('input:checkbox[name=displayFileSelectors]').on('change', function (e) {
            params.showFileSelectors = this.checked ? true : false;
            document.getElementById('hideFileSelectors').style.display = params.showFileSelectors ? "block" : "none";
            document.getElementById('downloadLinksText').style.display = params.showFileSelectors ? "inline" : "none";
            cookies.setItem('showFileSelectors', params.showFileSelectors, Infinity);
            if (params.showFileSelectors) document.getElementById('configuration').scrollIntoView();
        });

        function checkToolbar() {
            var thisdoc = document.getElementById('top');
            var scrollbox = document.getElementById('scrollbox');
            if (!params.hideToolbar) {
                thisdoc.style.display="block";
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
            var tryHideToolbar = function () { hideToolbar(); }
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
            if (params.cssTheme == "dark") document.getElementById('footer').classList.add("darkfooter");
            cssUIThemeSet(params.cssUITheme);
            //@TODO - this is initialization code, and should be in init.js (withoug jQuery)
            $('input:radio[name=cssInjectionMode]').filter('[value="' + params.cssSource + '"]').prop('checked', true);
            //DEV this hides file selectors if it is a packaged file -- add your own packaged file test to regex below
            if (/wikivoyage|medicine/i.test(params.fileVersion)) {
                document.getElementById('packagedAppFileSelectors').style.display = "block";
                document.getElementById('hideFileSelectors').style.display = "none";
                document.getElementById('downloadLinksText').style.display = "none";
                if (params.showFileSelectors) {
                    document.getElementById('hideFileSelectors').style.display = "block";
                    document.getElementById('downloadLinksText').style.display = "inline";
                }
            }
            //Code below triggers display of modal info box if app is run for the first time, or it has been upgraded to new version
            if (cookies.getItem('version') != params.version) {
                firstRun = true;
                $('#myModal').modal({ backdrop: "static" });
                //document.getElementById('myModal').style.display = "block";
                //document.getElementsByClassName("closeme")[0].onclick = function () {
                //    document.getElementById('myModal').style.display = "none";
                //}
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
                    navigator.serviceWorker.controller.postMessage({ 'action': 'disable' });
                    messageChannel = null;
                }
                refreshAPIStatus();
            } else if (value === 'serviceworker') {
                if (!isServiceWorkerAvailable()) {
                    alert("The ServiceWorker API is not available on your device. Falling back to JQuery mode");
                    setContentInjectionMode('jquery');
                    return;
                }
                if (!isMessageChannelAvailable()) {
                    alert("The MessageChannel API is not available on your device. Falling back to JQuery mode");
                    setContentInjectionMode('jquery');
                    return;
                }

                if (!messageChannel) {
                    // Let's create the messageChannel for the 2-way communication
                    // with the Service Worker
                    messageChannel = new MessageChannel();
                    messageChannel.port1.onmessage = handleMessageChannelMessage;
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
                                console.log("try to post an init message to ServiceWorker");
                                navigator.serviceWorker.controller.postMessage({ 'action': 'init' }, [messageChannel.port2]);
                                console.log("init message sent to ServiceWorker");
                            }
                        });
                    }, function (err) {
                        console.error('error while registering serviceWorker', err);
                        refreshAPIStatus();
                    });
                } else {
                    console.log("try to re-post an init message to ServiceWorker, to re-enable it in case it was disabled");
                    navigator.serviceWorker.controller.postMessage({ 'action': 'init' }, [messageChannel.port2]);
                    console.log("init message sent to ServiceWorker");
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
                    $("searchArticles").focus();
                }
                if (confirm("The 'Service Worker' mode is still UNSTABLE for now."
                    + " It happens that the application needs to be reinstalled (or the ServiceWorker manually removed)."
                    + " Please confirm with OK that you're ready to face this kind of bugs, or click Cancel to stay in 'jQuery' mode.")) {
                    // We will not display this warning again for one day
                    cookies.setItem("warnedServiceWorkerMode", true, 86400);
                    return true;
                }
                else {
                    return false;
                }
            }
            return true;
        }

        // At launch, we try to set the last content injection mode (stored in a cookie)
        var lastContentInjectionMode = cookies.getItem('lastContentInjectionMode');
        if (lastContentInjectionMode) {
            setContentInjectionMode(lastContentInjectionMode);
        }
        else {
            setContentInjectionMode('jquery');
        }

        var serviceWorkerRegistration = null;

        /**
         * Tells if the ServiceWorker API is available
         * https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker
         * @returns {Boolean}
         */
        function isServiceWorkerAvailable() {
            return ('serviceWorker' in navigator);
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
            }
            catch (e) {
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
            return (serviceWorkerRegistration);
        }

        /**
         * 
         * @type Array.<StorageFirefoxOS>
         */
        var storages = [];
        //var storages = [appFolder.path];  //UWP
        function searchForArchivesInPreferencesOrStorage() {
            // First see if the list of archives is stored in the cookie
            var listOfArchivesFromCookie = cookies.getItem("listOfArchives");
            if (listOfArchivesFromCookie !== null && listOfArchivesFromCookie !== undefined && listOfArchivesFromCookie !== "") {
                var directories = listOfArchivesFromCookie.split('|');
                populateDropDownListOfArchives(directories);
            }
            else {
                if (storages.length || params.localStorage) {
                    searchForArchivesInStorage();
                } else {
                    displayFileSelect();
                    if (document.getElementById('archiveFiles').files && document.getElementById('archiveFiles').files.length > 0) {
                        // Archive files are already selected, 
                        setLocalArchiveFromFileSelect();
                    }
                    else {
                        $("#btnConfigure").click();
                    }
                }
            }
        }

        function searchForArchivesInStorage() {
            // If DeviceStorage is available, we look for archives in it
            $("#btnConfigure").click();
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

        if ((storages !== null && storages.length > 0) || 
            (typeof Windows !== 'undefined' && typeof Windows.Storage !== 'undefined')) {
            // Make a fake first access to device storage, in order to ask the user for confirmation if necessary.
            // This way, it is only done once at this moment, instead of being done several times in callbacks
            // After that, we can start looking for archives
            //storages[0].get("fake-file-to-read").then(searchForArchivesInPreferencesOrStorage,
            //searchForArchivesInPreferencesOrStorage);
            searchForArchivesInPreferencesOrStorage();
        }
        else {
            // If DeviceStorage is not available, we display the file select components
            displayFileSelect();
            if (document.getElementById('archiveFiles').files && document.getElementById('archiveFiles').files.length > 0) {
                // Archive files are already selected, 
                setLocalArchiveFromFileSelect();
            }
            else {
                $("#btnConfigure").click();
            }
        }


        // Display the article when the user goes back in the browser history
        window.onpopstate = function (event) {
            if (event.state) {
                var title = event.state.title;
                var titleSearch = event.state.titleSearch;

                $('#prefix').val("");
                $("#welcomeText").hide();
                $("#readingArticle").hide();
                if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
                    $('#navbarToggle').click();
                }
                $('#searchingForArticles').hide();
                $('#configuration').hide();
                $('#articleList').hide();
                $('#articleListHeaderMessage').hide();
                $('#articleContent').contents().empty();

                if (title && !("" === title)) {
                    goToArticle(title);
                }
                else if (titleSearch && !("" === titleSearch)) {
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
            var comboArchiveList = document.getElementById('archiveList');
            comboArchiveList.options.length = 0;
            for (var i = 0; i < archiveDirectories.length; i++) {
                var archiveDirectory = archiveDirectories[i];
                if (archiveDirectory === "/") {
                    alert("It looks like you have put some archive files at the root of your sdcard (or internal storage). Please move them in a subdirectory");
                }
                else {
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
                document.getElementById('archiveNumber').innerHTML = "<b>" + comboArchiveList.length + "</b> Archive" + (comboArchiveList.length > 1 ? "s" : "");
                var lastSelectedArchive = cookies.getItem("lastSelectedArchive") || params.storedFile;
                if ((lastSelectedArchive !== null && lastSelectedArchive !== undefined && lastSelectedArchive !== "")
                    || comboArchiveList.options.length == 1) { //Either we have previously chosen a file, or there is only one file
                    // Attempt to select the corresponding item in the list, if it exists
                    var success = false;
                    if ($("#archiveList option[value='" + lastSelectedArchive + "']").length > 0) {
                        $("#archiveList").val(lastSelectedArchive);
                        success = true;
                        cookies.setItem("lastSelectedArchive", lastSelectedArchive, Infinity);
                    }
                    // Set the localArchive as the last selected (if none has been selected previously, wait for user input)
                    if (success || comboArchiveList.options.length == 1) {
                        setLocalArchiveFromArchiveList();
                    }
                }
            }
            else {
                alert("Welcome to Kiwix! This application needs at least a ZIM file in your SD-card (or internal storage). Please download one and put it on the device (see About section). Also check that your device is not connected to a computer through USB device storage (which often locks the SD-card content)");
                $("#btnAbout").click();
                var isAndroid = (navigator.userAgent.indexOf("Android") !== -1);
                if (isAndroid) {
                    alert("You seem to be using an Android device. Be aware that there is a bug on Firefox, that prevents finding Wikipedia archives in a SD-card (at least on some devices. See about section). Please put the archive in the internal storage if the application can't find it.");
                }
            }
        }

        /**
         * Sets the localArchive from the selected archive in the drop-down list
         */
        function setLocalArchiveFromArchiveList() {
            var archiveDirectory = $('#archiveList').val();
            document.getElementById('kiwixIcon').src = /wikivoyage/i.test(archiveDirectory) ? params.cssUITheme == "light" ? "./img/icons/wikivoyage-black-32.png" : "./img/icons/wikivoyage-white-32.png" : /medicine/i.test(archiveDirectory) ? params.cssUITheme == "light" ? "./img/icons/wikimed-blue-32.png" : "./img/icons/wikimed-lightblue-32.png" : params.cssUITheme == "light" ? "./img/icons/kiwix-blue-32.png" : "./img/icons/kiwix-32.png";
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
                        alert("Unable to find which device storage corresponds to directory " + archiveDirectory);
                    }
                }
                else {
                    // This happens when the archiveDirectory is not prefixed by the name of the storage
                    // (in the Simulator, or with FxOs 1.0, or probably on devices that only have one device storage)
                    // In this case, we use the first storage of the list (there should be only one)
                    if (storages.length === 1) {
                        selectedStorage = storages[0];
                    }
                    else { //IT'S NOT FREAKIN FFOS!!!!!!!!!!
                        //console.log("Something weird happened with the DeviceStorage API : found a directory without prefix : "
                        //    + archiveDirectory + ", but there were " + storages.length
                        //    + " storages found with getDeviceStorages instead of 1");
                        //Patched for UWP support:
                        if (params.pickedFolder && Windows && Windows.Storage) {
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
                                    if (archiveDirectory != params.storedFile) {
                                        cookies.setItem("lastSelectedArchive", archiveDirectory, Infinity);
                                        params.storedFile = archiveDirectory;
                                    }
                                    selectedStorage = fileset;
                                    archiveDirectory = "";
                                    //selectedStorage = "";
                                    //archiveDirectory = MSApp.createFileFromStorageFile(file);
                                    // Reset the cssDirEntryCache and cssBlobCache. Must be done when archive changes.
                                    if (cssBlobCache)
                                        cssBlobCache = new Map();
                                    //if (cssDirEntryCache)
                                    //    cssDirEntryCache = new Map();
                                    selectedArchive = zimArchiveLoader.loadArchiveFromDeviceStorage(selectedStorage, archiveDirectory, function (archive) {
                                        // The archive is set : go back to home page to start searching
                                        if (params.rescan) {
                                            $('#btnConfigure').click();
                                            $('#btnConfigure').click();
                                            params.rescan = false;
                                        } else {
                                            $('#openLocalFiles').hide();
                                            if (params.rememberLastPage && ~params.lastPageVisit.indexOf(selectedArchive._file._files[0].name)) {
                                                var lastPage = decodeURIComponent(params.lastPageVisit.replace(/@kiwixKey@.+/, ""));
                                                goToArticle(lastPage);
                                            } else {
                                                $('#btnHome').click();
                                            }
                                        }
                                    });
                                } else {
                                    console.error("The picked file could not be found in the selected folder!");
                                    var archiveList = [];
                                    for (var i = 0; i < files.length; i++) {
                                        if (/\.zima?a?$/i.test(files[i].name)) {
                                            archiveList.push(files[i].name);
                                        }
                                    }
                                    populateDropDownListOfArchives(archiveList);
                                    $('#btnConfigure').click();
                                }
                            });
                            return;
                        } else { //Check if user previously picked a specific file rather than a folder
                            if (params.pickedFile && typeof MSApp !== 'undefined') {
                                selectedStorage = MSApp.createFileFromStorageFile(params.pickedFile);
                                setLocalArchiveFromFileList([selectedStorage]);
                                return;
                            }
                        }
                        //There was no picked file or folder, so we'll try setting the default localStorage
                        if (!params.pickedFolder) {
                            //This gets called, for example, if the picked folder or picked file are in FutureAccessList but now are
                            //no longer accessible. There will be a (handled) error in cosole log, and params.pickedFolder and params.pickedFile will be blank
                            //params.rescan = true;
                            if (params.localStorage) {
                                scanUWPFolderforArchives(params.localStorage);
                            } else {
                                $('#btnConfigure').click();
                            }
                            return;
                        }
                    }
                }
                selectedArchive = zimArchiveLoader.loadArchiveFromDeviceStorage(selectedStorage, archiveDirectory, function (archive) {
                    cookies.setItem("lastSelectedArchive", archiveDirectory, Infinity);
                    // The archive is set : go back to home page to start searching
                    if (params.rescan) {
                        $('#btnConfigure').click()
                        params.rescan = false;
                    } else {
                        $('#openLocalFiles').hide();
                        $('#btnHome').click();
                    }
                });

            }
        }

        /**
         * Displays the zone to select files from the archive
         */
        function displayFileSelect() {
            $('#openLocalFiles').show();
            if (typeof Windows === 'undefined') {
                //If not UWP, display legacy File Select
                $('#btnConfigure').click();
            }
            //TODO - check if this is necessary or if it causes the archiveList change event to fire 
            //Make archive list combo box fit the number of files
            //var comboArchiveList = document.getElementById('archiveList');
            //if (comboArchiveList.length > 0) { comboArchiveList.size = comboArchiveList.length; }
        }

        function pickFileUWP() { //Support UWP FilePicker [kiwix-js-windows #3]
            // Create the picker object and set options
            var filePicker = new Windows.Storage.Pickers.FileOpenPicker;
            filePicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.downloads;
            // Filter folder contents
            filePicker.fileTypeFilter.replaceAll([".zim"]);

            filePicker.pickSingleFileAsync().then(function (file) {
                if (file) {
                    // Cache file so the contents can be accessed at a later time
                    Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.addOrReplace(params.falFileToken, file);
                    params.pickedFile = file;
                    Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.remove(params.falFolderToken);
                    params.pickedFolder = "";
                    cookies.setItem("lastSelectedArchive", file.name, Infinity);
                    document.getElementById('openLocalFiles').style.display = "none";
                    populateDropDownListOfArchives([file.name]);
                } else {
                    // The picker was dismissed with no selected file
                    console.log("User closed folder picker without picking a file");
                }
            });
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
                    document.getElementById('noZIMFound').style.display = "inline";
                    document.getElementById('archiveList').options.length = 0;
                    document.getElementById('archiveList').size = 0;
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
            // Reset the cssDirEntryCache and cssBlobCache. Must be done when archive changes.
            if (cssBlobCache)
                cssBlobCache = new Map();
            //if (cssDirEntryCache)
            //    cssDirEntryCache = new Map();
        selectedArchive = zimArchiveLoader.loadArchiveFromFiles(files, function (archive) {
            // The archive is set : go back to home page to start searching
            if (params.rememberLastPage && ~params.lastPageVisit.indexOf(selectedArchive._file._files[0].name)) {
                var lastPage = decodeURIComponent(params.lastPageVisit.replace(/@kiwixKey@.+/, ""));
                goToArticle(lastPage);
            } else {
                $("#btnHome").click();
            }
        });
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
                if ((request.status >= 200 && request.status < 300) || request.status === 0) {
                // Hack to make this look similar to a file
                request.response.name = url;
                    deferred.resolve(request.response);
            	}
                else {
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
    window.setRemoteArchives = function() {
        var readRequests = [];
        var i;
        for (i = 0; i < arguments.length; i++) {
            readRequests[i] = readRemoteArchive(arguments[i]);
        }
        return q.all(readRequests).then(function(arrayOfArchives) {
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
        window.timeoutKeyUpPrefix = window.setTimeout(function() {
            var prefix = $("#prefix").val();
            if (prefix && prefix.length > 0) {
                $('#searchArticles').click();
            }
        }
        ,500);
    }


    /**
     * Search the index for DirEntries with title that start with the given prefix (implemented
     * with a binary search inside the index file)
     * @param {String} prefix
     */
    function searchDirEntriesFromPrefix(prefix) {
        $('#searchingForArticles').show();
        $('#configuration').hide();
        $('#articleContent').contents().empty();
        if (selectedArchive !== null && selectedArchive.isReady()) {
            selectedArchive.findDirEntriesWithPrefix(prefix.trim(), MAX_SEARCH_RESULT_SIZE, populateListOfArticles);
        } else {
            $('#searchingForArticles').hide();
            // We have to remove the focus from the search field,
            // so that the keyboard does not stay above the message
            $('#searchArticles').focus();
            alert("Archive not set : please select an archive");
            $('#btnConfigure').click();
        }
    }

  
    /**
     * Display the list of articles with the given array of DirEntry
     * @param {Array.<DirEntry>} dirEntryArray
     * @param {Integer} maxArticles
     */
    function populateListOfArticles(dirEntryArray, maxArticles) {       
        var articleListHeaderMessageDiv = $('#articleListHeaderMessage');
        var nbDirEntry = 0;
        if (dirEntryArray) {
            nbDirEntry = dirEntryArray.length;
        }

        var message;
        if (maxArticles >= 0 && nbDirEntry >= maxArticles) {
            message = maxArticles + " first articles below (refine your search).";
        }
        else {
            message = nbDirEntry + " articles found.";
        }
        if (nbDirEntry === 0) {
            message = "No articles found.";
        }
              
        articleListHeaderMessageDiv.html(message);
        

        var articleListDiv = $('#articleList');
        var articleListDivHtml = "";
        for (var i = 0; i < dirEntryArray.length; i++) {
            var dirEntry = dirEntryArray[i];
            
            articleListDivHtml += "<a href='#' dirEntryId='" + dirEntry.toStringId().replace(/'/g, "&apos;")
                    + "' class='list-group-item'>" + dirEntry.title + "</a>";
        }
        articleListDiv.html(articleListDivHtml);
        $("#articleList a").on("click", handleTitleClick);
        $('#searchingForArticles').hide();
        $('#articleList').show();
        $('#articleListHeaderMessage').show();
    }
    
    /**
     * Handles the click on the title of an article in search results
     * @param {Event} event
     * @returns {Boolean}
     */
    function handleTitleClick(event) {

        /*/TESTING//
        console.log("Initiating HTML load...");
        console.time("Time to HTML load");
        console.log("Initiating Document Ready timer...");
        console.time("Time to Document Ready"); */

        var dirEntryId = event.target.getAttribute("dirEntryId");
        $("#articleList").empty();
        $('#articleListHeaderMessage').empty();
        $("#prefix").val("");
        findDirEntryFromDirEntryIdAndLaunchArticleRead(dirEntryId);
        var dirEntry = selectedArchive.parseDirEntryId(dirEntryId);
        pushBrowserHistoryState(dirEntry.namespace + "/" + dirEntry.url);
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
            $("#articleName").html(dirEntry.title);
            $("#readingArticle").show();
            $("#articleContent").contents().html("");
            if (dirEntry.isRedirect()) {
                selectedArchive.resolveRedirect(dirEntry, readArticle);
            }
            else {
                readArticle(dirEntry);
            }
        }
        else {
            alert("Data files not set");
        }
    }

    /**
     * Read the article corresponding to the given dirEntry
     * @param {DirEntry} dirEntry
     */
    function readArticle(dirEntry) {
        if (dirEntry.isRedirect()) {
            selectedArchive.resolveRedirect(dirEntry, readArticle);
        }
        else {
            //TESTING//
            console.log("Initiating HTML load...");
            console.time("Time to HTML load");
            console.log("Initiating Document Ready timer...");
            console.time("Time to Document Ready");

            //Load cached start page if it exists
            var htmlContent = 0;
            if (params.cachedStartPage && dirEntry.url == decodeURIComponent(params.cachedStartPage)) {
                htmlContent = -1;
                uiUtil.XHR(dirEntry.namespace + '/' + encodeURIComponent(params.cachedStartPage),
                function (responseTxt, status) {
                    htmlContent = /<html[^>]*>/.test(responseTxt) ? responseTxt : 0;
                    if (htmlContent) {
                        displayArticleInForm(dirEntry, htmlContent);
                    } else {
                        selectedArchive.readArticle(dirEntry, displayArticleInForm);
                    }
                });
            }
            if (!htmlContent) selectedArchive.readArticle(dirEntry, displayArticleInForm);
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
                var readFile = function(dirEntry) {
                    if (dirEntry === null) {
                        console.error("Title " + title + " not found in archive.");
                        messagePort.postMessage({'action': 'giveContent', 'title' : title, 'content': ''});
                    } else if (dirEntry.isRedirect()) {
                        selectedArchive.resolveRedirect(dirEntry, readFile);
                    } else {
                        console.log("Reading binary file...");
                        selectedArchive.readBinaryFile(dirEntry, function(fileDirEntry, content) {
                            messagePort.postMessage({'action': 'giveContent', 'title' : title, 'content': content});
                            console.log("content sent to ServiceWorker");
                        });
                    }
                };
                selectedArchive.getDirEntryByTitle(title).then(readFile).fail(function() {
                    messagePort.postMessage({'action': 'giveContent', 'title' : title, 'content': new UInt8Array()});
                });
            }
            else {
                console.error("Invalid message received", event.data);
            }
        }
    };
    
    // Compile some regular expressions needed to modify links
    // Pattern to find the path in a url
    var regexpPath = /^(.*\/)[^\/]+$/;
    // Pattern to find a ZIM URL (with its namespace) - see http://www.openzim.org/wiki/ZIM_file_format#Namespaces
    var regexpZIMUrlWithNamespace = /(?:^|\/)([-ABIJMUVWX]\/.+)/;
    // Pattern to match a local anchor in a href
    var regexpLocalAnchorHref = /^#/;
    // These regular expressions match both relative and absolute URLs
    // Since late 2014, all ZIM files should use relative URLs
    var regexpImageUrl = /^(?:\.\.\/|\/)+(I\/.*)$/;
    var regexpMetadataUrl = /^(?:\.\.\/|\/)+(-\/.*)$/;
    // This matches the href of all <link> tags containing rel="stylesheet" in raw HTML
    var regexpSheetHref = /(<link\s+(?=[^>]*rel\s*=\s*["']stylesheet)[^>]*href\s*=\s*["'])([^"']+)(["'][^>]*>)/ig;
     // This matches the title between <title  attrs> ... </title>
    //var regexpArticleTitle = /<title\s*[^>]*>\s*([^<]+)\s*</i;
     // This matches the title of a Type1 Wikimedia ZIM file or any ZIM file using simple <h1 attrs....> Title </h1>
    //var regexpType1ZIMTitle = /<h1\s+[^>]*>\s*([^<]+)\s*</i;
    // This matches the title of a mw-offliner (Type2) Wikimedia ZIM file, specifically 
    //var regexpType2ZIMTitle = /id\s*=\s*['"][^'"]*title_0[^"']*["'][^>]*>\s*([^<]+)\s*</i;

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
        // Display the article inside the web page.

        //TESTING
        console.log("** HTML received **");
        console.timeEnd("Time to HTML load");
        console.log("Loading stylesheets...");
        console.time("Time to First Paint");
        //return;

        //Some documents (e.g. Ray Charles Index) can't be scrolled to the very end, as some content remains benath the footer
        //so add some whitespace at the end of the document
        htmlArticle = htmlArticle.replace(/(dditional terms may apply for the media files[^<]+<\/div>\s*)/i, "$1\r\n<p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p>\r\n");

        //@TODO - remove this when issue fixed: VERY DIRTY PATCH FOR HTML IN PAGE TITLES on Wikivoyage
        htmlArticle = htmlArticle.replace(/&lt;a href[^"]+"\/wiki\/([^"]+)[^<]+&gt;([^<]+)&lt;\/a&gt;/ig, "<a href=\"$1.html\">$2</a>");
        htmlArticle = htmlArticle.replace(/&lt;(\/?)(i|b|em|strong)&gt;/ig, "<$1$2>");

        //Fast-replace img src with data-kiwixsrc and hide image [kiwix-js #272]
        htmlArticle = htmlArticle.replace(/(<img\s+[^>]*\b)src(\s*=)/ig, "$1data-kiwixsrc$2");
        if (!params.imageDisplay) {
            //Ensure 36px clickable image height so user can request images by clicking [kiwix-js #173]
            htmlArticle = htmlArticle.replace(/(<img\s+[^>]*\b)height(\s*=\s*)/ig,
                '$1height="36" src="../img/lightBlue.png" style="color: lightblue; background-color: lightblue;" ' +
                'data-kiwixheight$2');
        }
        //Remove erroneous content frequently on front page
        htmlArticle = htmlArticle.replace(/<h1\b[^>]+>[^/]*?User:Popo[^<]+<\/h1>\s*/i, "");
        htmlArticle = htmlArticle.replace(/<span\b[^>]+>[^/]*?User:Popo[^<]+<\/span>\s*/i, "");

        //Put misplaced hatnote headers inside <h1> block back in correct position @TODO remove this when fixed in mw-offliner
        var hatnote = htmlArticle.match(/<h1\b(?:[^<]|<(?!h2))+?((?:<div\s+[^>]+\bhatnote\b[\s\S]+?<\/div>\s*)+)/i);
        if (hatnote && hatnote.length > 1) {
            htmlArticle = htmlArticle.replace(hatnote[1], "");
            htmlArticle = htmlArticle.replace(/(<\/h1>\s*)/i, "$1" + hatnote[1]);
        }
        //Put misplaced disambiguation header back in its correct position @TODO remove this when fixed in mw-offliner
        var noexcerpt = htmlArticle.match(/<dl>(?:[^<]|<(?!\/dl>))+?excerpt(?:[^<]|<(?!\/dl>))+?For other places with the same name(?:[^<]|<(?!\/dl>))+?<\/dl>\s*/i);
        if (noexcerpt && noexcerpt.length) {
            htmlArticle = htmlArticle.replace(noexcerpt, "");
            htmlArticle = htmlArticle.replace(/(<\/h1>\s*)/i, "$1" + noexcerpt);
        }

        //Display IPA pronunciation info erroneously hidden in some ZIMs
        htmlArticle = htmlArticle.replace(/(<span\b[^>]+?class\s*=\s*"[^"]+?mcs-ipa[^>]+?display:\s*)none/i, "$1inline");
        
     //TESTING - find out whether document contains MathSVGs
        //var containsMathSVG = /\.svg\s*['"][^>]+mwe-math-fallback-image|mwe-math-fallback-image[^>]+\.svg\s*['"]/i.test(htmlArticle);
        //Version below will match any type of fallback image so long as there is an alt string
        var containsMathSVG = /alt\s*=\s*['"][^'"]+['"][^>]+mwe-math-fallback-image|mwe-math-fallback-image[^>]+alt\s*=\s*['"][^'"]+['"]/i.test(htmlArticle);

     //Preload stylesheets [kiwix-js @149]
        //Set up blobArray of promises
        var cssArray = htmlArticle.match(regexpSheetHref);
        var blobArray = [];
        var cssSource = params.cssSource;
        var cssCache = params.cssCache;
        var zimType = "";
        getBLOB(cssArray);

        //Extract CSS URLs from given array of links
        function getBLOB(arr) {
            var testCSS = arr.join();
            zimType = /-\/s\/style\.css/i.test(testCSS) ? "desktop" : zimType;
            zimType = /-\/static\/main\.css/i.test(testCSS) ? "desktop" : zimType; //Support stackexchange
            zimType = /minerva|mobile/i.test(testCSS) ? "mobile" : zimType;
            cssSource = cssSource == "auto" ? zimType : cssSource; //Default to in-built zimType if user has selected automatic detection of styles
            if (/minerva/i.test(testCSS) && (cssCache || zimType != cssSource)) {
                //Substitute ridiculously long style name TODO: move this code to transformStyles
                for (var i = 0; i < arr.length; i++) { //NB minerva.css is a dummy name for now TODO: sort out in transfromStyles
                    arr[i] = /minerva/i.test(arr[i]) ? '<link href="../-/s/style-mobile.css" rel="stylesheet" type="text/css">' : arr[i];
                }
            }
            for (var i = 0; i < arr.length; i++) {
                var linkArray = regexpSheetHref.exec(arr[i]);
                regexpSheetHref.lastIndex = 0; //Reset start position for next loop

                //@BUG WORKAROUND for Kiwix-JS-Windows #18
                linkArray[2] = linkArray[2].replace(/^(s\/[\s\S]+(?!\.css))$/i, "../-/$1.css"); 

                if (linkArray && regexpMetadataUrl.test(linkArray[2])) { //It's a CSS file contained in ZIM
                    var zimLink = decodeURIComponent(uiUtil.removeUrlParameters(linkArray[2]));
                    /* zl = zimLink; zim = zimType; cc = cssCache; cs = cssSource; i  */
                    var filteredLink = transformStyles.filterCSS(zimLink, zimType, cssCache, cssSource, i);
                    //blobArray[i] = filteredLink.zl; //This line is a mistake! It fills blobArray too quickly and doesn't trigger waiting for promises...
                    //filteredLink.rtnFunction == "injectCSS" ? injectCSS() : resolveCSS(filteredLink.zl, i); 
                    if (filteredLink.rtnFunction == "injectCSS") { blobArray[i] = filteredLink.zl; injectCSS() } else { resolveCSS(filteredLink.zl, i); }
                } else {
                    blobArray[i] = arr[i]; //If CSS not in ZIM, store URL in blobArray
                    injectCSS(); //Ensure this is called even if none of CSS links are in ZIM
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
                        uiUtil.poll("Attempting to resolve CSS link #" + index + " [" + title.substring(0, 30) + "] from ZIM file...");
                        return selectedArchive.readBinaryFile(dirEntry,
                            function (fileDirEntry, content) {
                        //DEV: Uncomment line below and break on next to capture cssContent for local filesystem cache
                                //var cssContent = util.uintToString(content);
                                var cssBlob = new Blob([content], { type: 'text/css' });
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
            if (blobArray.length === cssArray.length) { //If all promised values have been obtained
                var resultsArray = [];
                for (var i in cssArray) { //Put them back in the correct order
                    var match = 0;
                    for (var j in blobArray) { //Iterate the blobArray to find the matching entry
                        var testBlob = blobArray[j][0] == "." ? blobArray[j] : blobArray[j][0]; //What a kludge! TODO: fix this ugly mixing of arrays and strings 
                        if (~cssArray[i].indexOf(testBlob)) { match = 1; break; }
                    }
                    testBlob = match && /blob:/i.test(blobArray[j][1]) ? blobArray[j][1] : blobArray[i]; //Whoa!!! Steady on!
                    resultsArray[i] = cssArray[i].replace(/(href\s*=\s*["'])([^"']+)/i, "$1" +
                        testBlob + '" data-kiwixhref="$2');//Store the original URL for later use
                        //DEV note: do not attempt to add onload="URL.revokeObjectURL...)": see [kiwix.js #284]
                    //DEBUG:
                        //console.log("BLOB CSS #" + i + ": " + resultsArray[i] + "\nshould correspond to: " + testBlob);
                }
                cssArray = resultsArray;
                htmlArticle = htmlArticle.replace(regexpSheetHref, ""); //Void existing stylesheets
                var cssArray$ = "\r\n" + cssArray.join("\r\n") + "\r\n";
                if (cssSource == "mobile") { //If user has selected mobile display mode...
                    var mobileCSS = transformStyles.toMobileCSS(htmlArticle, zimType, cssCache, cssSource, cssArray$);
                    htmlArticle = mobileCSS.html;
                    cssArray$ = mobileCSS.css;
                }
                if (cssSource == "desktop") { //If user has selected desktop display mode...
                    var desktopCSS = transformStyles.toDesktopCSS(htmlArticle, zimType, cssCache, cssSource, cssArray$);
                    htmlArticle = desktopCSS.html;
                    cssArray$ = desktopCSS.css;
                }
                if (cssCache) { //For all cases except where user wants exactly what's in the zimfile...
                    //Reduce the hard-coded top padding to 0
                    htmlArticle = htmlArticle.replace(/(<div\s+[^>]*mw-body[^>]+style[^>]+padding\s*:\s*)1em/i, "$10 1em");
                }
                //For all cases, neutralize the toggleOpenSection javascript that causes a crash - TODO: make it work for mobile style
                htmlArticle = htmlArticle.replace(/onclick\s*=\s*["']toggleOpenSection[^"']*['"]\s*/ig, "");
                htmlArticle = htmlArticle.replace(/\s*(<\/head>)/i, cssArray$ + "$1");
                console.log("All CSS resolved");
                //$("#progressMessage").html(""); //Void progress messages
                injectHTML(htmlArticle); //Pass the revised HTML to the image and JS subroutine...
            } else {
               uiUtil.poll("Waiting for " + (cssArray.length - blobArray.length) + " out of " + cssArray.length + " to resolve...");
                //console.log("Waiting for " + (cssArray.length - blobArray.length) + " out of " + cssArray.length + " to resolve...")
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
            $('#ToCList').find('a').each(function () {
                $(this).on("click", function () {
                    window.frames[0].frameElement.contentWindow.location.hash = this.dataset.headingId;
                });
            });
        }


        function injectHTML() {
            //Adapt German Wikivoyage POI data format
            var regexpGeoLocationDE = /<span\s+class\s?=\s?"[^"]+?listing-coordinates[\s\S]+?latitude">([^<]+)[\s\S]+?longitude">([^<]+)<[\s\S]+?(<span[^>]+listing-name[^>]+>([^<]+)<\/span>)/ig;
            htmlArticle = htmlArticle.replace(regexpGeoLocationDE, function (match, latitude, longitude, href, id) {
                return '<a href="bingmaps:?collection=point.' + latitude + '_' + longitude + '_' + encodeURIComponent(id.replace(/_/g, " ")) +
                    '">\r\n<img alt="Map marker" title="Diesen Ort auf einer Karte zeigen" src="../img/icons/map_marker-18px.png" style="position:relative !important;top:-5px !important;margin-top:5px !important" />\r\n</a>' + href;
            });
            
            //Adapt English Wikivoyage POI data format
            var regexpGeoLocationEN = /(href\s?=\s?")geo:([^,]+),([^"]+)("[^>]+?(?:data-zoom[^"]+"([^"]+))?[^>]+>)[^<]+(<\/a>[\s\S]+?<span\b(?=[^>]+listing-name)[\s\S]+?id\s?=\s?")([^"]+)/ig;
            htmlArticle = htmlArticle.replace(regexpGeoLocationEN, function (match, p1, latitude, longitude, p4, p5, p6, id) {
                return p1 + "bingmaps:?collection=point." + latitude + "_" + longitude + "_" +
                    encodeURIComponent(id.replace(/_/g, " ")).replace(/\.(\w\w)/g, "%$1") +
                    (p5 ? "\&lvl=" + p5 : "") + p4.replace(/style\s?="\s?background:[^"]+"\s?/i, "") + '<img alt="Map marker" title="Show this place on a map" src="../img/icons/map_marker-18px.png" style="position:relative !important;top:-5px !important;" />' + p6 + id;
            });

            //Clean up remaining geo: links
            htmlArticle = htmlArticle.replace(/href\s*=\s*"\s*geo:([\d.-]+),([\d.-]+)/ig, 'href="bingmaps:?collection=point.$1_$2_' + encodeURIComponent(dirEntry.title));

            //Setup footnote backlinks if the ZIM doesn't have any
            htmlArticle = htmlArticle.replace(/<li\s+id\s*=\s*"cite_note-([^"]+)"\s*>(?![^/]+↑)/ig, function (match, p1) {
                var fnSearchRegxp = new RegExp('id\\s*=\\s*"(cite[-_]ref[-_]' + p1.replace(/[-_]/g,"[-_]") + '[^"]*)', "i");
                var fnReturnMatch = htmlArticle.match(fnSearchRegxp);
                var fnReturnID = fnReturnMatch ? fnReturnMatch[1] : "";
                return match + '\r\n<a href=\"#' + fnReturnID + '">^&nbsp;</a>'; 
            });

            //Inject htmlArticle into iframe
            uiUtil.clear(); //Void progress messages
            setHomeTab();
            $('#articleContent').contents().find('body').html(htmlArticle);

            setupTableOfContents();
            //Hide top-level scrolling -- gets rid of interfering useless scroll bar, but re-enable for Config and About pages
            document.getElementById('search-article').scrollTop = 0;
            document.getElementById('search-article').style.overflow = "hidden";
            
            var makeLink = uiUtil.makeReturnLink(dirEntry.title); //[kiwix-js #127]
            var linkListener = eval(makeLink);
            //Prevent multiple listeners being attached on each browse
            var returnDivs = document.getElementsByClassName("returntoArticle");
            for (var i = 0; i < returnDivs.length; i++) {
                returnDivs[i].removeEventListener('click', linkListener);
                returnDivs[i].addEventListener('click', linkListener);
            }
            checkToolbar();

            // If the ServiceWorker is not useable, we need to fallback to parse the DOM
            // to inject math images, and replace some links with javascript calls
            if (contentInjectionMode === 'jquery') {

                //Load MathJax if required and if not already loaded
                if (containsMathSVG) {
                    if (params.useMathJax && !window.frames[0].MathJax) {
                        var doc = $("#articleContent").contents()[0];
                        var script = doc.createElement("script");
                        script.type = "text/javascript";
                        script.src = "../js/MathJax/MathJax.js?config=TeX-AMS_HTML-full";
                        doc.head.appendChild(script);
                    }
                }
            // Compute base URL
            var urlPath = regexpPath.test(dirEntry.url) ? urlPath = dirEntry.url.match(regexpPath)[1] : "";
            var baseUrl = dirEntry.namespace + "/" + urlPath;
            // Create (or replace) the "base" tag with our base URL
            $('#articleContent').contents().find('head').find("base").detach();
            $('#articleContent').contents().find('head').append("<base href='" + baseUrl + "'>");
            
            var currentProtocol = location.protocol;
            var currentHost = location.host;

                // Convert links into javascript calls
                $('#articleContent').contents().find('body').find('a').each(function () {
                var href = $(this).attr("href");
                // Compute current link's url (with its namespace), if applicable
                var zimUrl = regexpZIMUrlWithNamespace.test(this.href) ? this.href.match(regexpZIMUrlWithNamespace)[1] : "";
                if (href === null || href === undefined) {
                    // No href attribute
                }
                else if (href.length === 0) {
                    // It's a link with an empty href, pointing to the current page.
                    // Because of the base tag, we need to modify it
                        $(this).on('click', function (e) {
                            return false;
                        });
                    }
                else if (regexpLocalAnchorHref.test(href)) {
                    // It's an anchor link : we need to make it work with javascript
                    // because of the base tag
                    $(this).on('click', function(e) {
                        $('#articleContent').first()[0].contentWindow.location.hash = href;
                        return false;
                    });
                    }
                else if (this.protocol !== currentProtocol
                    || this.host !== currentHost) {
                    // It's an external URL : we should open it in a new tab
                        $(this).attr("target", "_blank");
                    }
                    else {
                        // It's a link to another article
                        // Add an onclick event to go to this article
                        // instead of following the link
                        $(this).on('click', function (e) {
                        var decodedURL = decodeURIComponent(zimUrl);
                            pushBrowserHistoryState(decodedURL);
                            goToArticle(decodedURL);
                            return false;
                        });
                    }
                });

                loadImages();
                //loadJavascript(); //Disabled for now, since it does nothing
            }  

        } //End of injectHTML()

    } //End of displayArticleInForm()


    /** This is the main image loading function.
     * Contains four sub functions: prepareImages, triageImages, displaySlices, loadImageSlice
     * and a utility function checkVisibleImages
     */
    function loadImages() {

        //TESTING
        console.log("** First Paint complete **");
        console.timeEnd("Time to First Paint");

        //Set up tracking variables
        var countImages = 0;
    //DEV: This sets the maximum number of visible images to request in a single batch (too many will slow image display)
        //NB remaining visible images are shunted into prefetchSlice, which works in the background
        var maxVisibleSliceSize = 10;
    //DEV: Set this to the number of images you want to prefetch after the on-screen images have been fetched
        var prefetchSliceSize = 20;
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
        var images = $('#articleContent').contents().find('body').find('img');
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
                //TESTING
                console.timeEnd("Time to Document Ready");
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
                        loadImageSlice(this, 0, 0, function (sliceID, sliceCount, sliceEnd, mimetype, data) {
                            img[0].src = "data:" + mimetype + ";base64," + btoa(data);
                            }, true);
                    });
                });
            }
            //TESTING
            console.timeEnd("Time to Document Ready");
        }

        /** Prepares the main array of images remaining for triage
         * and determines which images are visible
         */
        function prepareImages() {
            //Ensure the function isn't launched multiple times
            if (!windowScroll) { return; }
            windowScroll = false;

            //Reload images array because we may have spliced it on a previous loop
            images = $('#articleContent').contents().find('body').find('img');
            
            //Remove images that have already been loaded
            var visibleImage = null;
            var lastRemovedPosition = 0;
            for (var i = 0; i < images.length; i++) {
                if (images[i].src) {
                    visibleImage = uiUtil.isElementInView(images[i], true) ? lastRemovedPosition : visibleImage;
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
                        }        
                    } else {
                        //We don't know where we are because no images are in view, so we'd better fetch some more
                        triageImages();
                    }
                }
            } else {
                //Unload scroll listener
                console.log("Unloading scroll listener");
                $("#articleContent").contents().off('scroll');
                windowScroll = true; //Check if it's really unloaded...
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
            if (typeof firstVisible === 'undefined' || firstVisible == null) { firstVisible = -1; } //No first images was set
            if (typeof lastVisible === 'undefined' || lastVisible == null) { lastVisible = -1; } //No first images was set
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
                if (/\.svg$/i.test(images[i].getAttribute('data-kiwixsrc')) ||
                    //Include any kind of maths image fallback that has an alt string in SVG bucket
                    (/mwe-math-fallback/i.test(images[i].className) && images[i].alt)) {
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
                    //TESTING
                    if (countImages <= maxVisibleSliceSize + prefetchSliceSize) { console.timeEnd("Time to Document Ready"); }

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
                        console.log("** All images extracted from current document **")
                        windowScroll = true; //Go back to prove this!
                    } else {
                        console.log("All requested image slices have been processed\n" +
                            "** Waiting for user scroll... **");
                        windowScroll = true;
                    }
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
         * @param {Array} imnages
         * @param {number} sliceID
         * @param {number} sliceEnd
         * @param {requestCallback} callback
         * @param {Boolean} dataRequested
         */
        function loadImageSlice(images, sliceID, sliceEnd, callback, dataRequested) {
            var sliceCount = 0;
            $(images).each(function () {
                var image = $(this);
                // It's a standard image contained in the ZIM file
                // We try to find its name (from an absolute or relative URL)
                var imageMatch = image.attr('data-kiwixsrc').match(regexpImageUrl); //kiwix-js #272
                if (imageMatch) {
                    var title = decodeURIComponent(imageMatch[1]);
                    selectedArchive.getDirEntryByTitle(title).then(function (dirEntry) {
                        selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                            var url = fileDirEntry.url;
                            var mimetype = url.match(/\.(\w{2,4})$/);
                            mimetype = mimetype ? "image/" + mimetype[1].toLowerCase() : "image";
                            mimetype = /\.jpg$/i.test(url) ? "image/jpeg" : mimetype;
                            mimetype = /\.tif$/i.test(url) ? "image/tiff" : mimetype;
                            mimetype = /\.ico$/i.test(url) ? "image/x-icon" : mimetype;
                            mimetype = /\.svg$/i.test(url) ? "image/svg+xml" : mimetype;
                            if (!dataRequested) {
                                uiUtil.feedNodeWithBlob(image, 'src', content, mimetype);
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
                }
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
                //console.log("Checking #" + i + ": " + images[i].getAttribute("data-kiwixsrc"));
                if (uiUtil.isElementInView(images[i], true)) {
                    //console.log("#" + i + " *is* visible");
                    if (firstVisible == null) { firstVisible = i; }
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

    } //End of loadImages()

    // Load Javascript content
    function loadJavascript() {
        $('#articleContent').contents().find('script').each(function () {
            var script = $(this);
            // We try to find its name (from an absolute or relative URL)
            if (script) { var srcMatch = script.attr("src").match(regexpMetadataUrl) }
            // TODO check that the type of the script is text/javascript or application/javascript
            if (srcMatch) {
                // It's a Javascript file contained in the ZIM file
                var title = uiUtil.removeUrlParameters(decodeURIComponent(srcMatch[1]));
                selectedArchive.getDirEntryByTitle(title).then(function (dirEntry) {
                    if (dirEntry === null)
                        console.log("Error: js file not found: " + title);
                    else
                        selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                            // TODO : I have to disable javascript for now
                            // var jsContent = encodeURIComponent(util.uintToString(content));
                            //script.attr("src", 'data:text/javascript;charset=UTF-8,' + jsContent);
                        });
                }).fail(function (e) {
                    console.error("could not find DirEntry for javascript : " + title, e);
                });
            }
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
        if (title && !(""===title)) {
            stateObj.title = title;
            urlParameters = "?title=" + title;
            stateLabel = "Wikipedia Article : " + title;
            if (params.rememberLastPage) {
                params.lastPageVisit = encodeURIComponent(title) + "@kiwixKey@" + selectedArchive._file._files[0].name;
                cookies.setItem('lastPageVisit', params.lastPageVisit, Infinity);
            }
        }
        else if (titleSearch && !(""===titleSearch)) {
            stateObj.titleSearch = titleSearch;
            urlParameters = "?titleSearch=" + titleSearch;
            stateLabel = "Wikipedia search : " + titleSearch;
        }
        else {
            return;
        }
        window.history.pushState(stateObj, stateLabel, urlParameters);
    }


    /**
     * Replace article content with the one of the given title
     * @param {String} title
     */
    function goToArticle(title) {
        clearFindInArticle();
        //Re-enable top-level scrolling
        document.getElementById('top').style.position = "relative";
        document.getElementById('scrollbox').style.position = "fixed";
        document.getElementById('scrollbox').style.height = window.innerHeight + "px";
        $("#readingArticle").show();
        selectedArchive.getDirEntryByTitle(title).then(function(dirEntry) {
            if (dirEntry === null || dirEntry === undefined) {
                $("#readingArticle").hide();
                $("#articleContent").show();
                console.error("Article with title " + title + " not found in the archive");
                goToMainArticle();
            }
            else {
                $("#articleName").html(title);
                $('#articleContent').contents().find('body').html("");
                readArticle(dirEntry);
            }
        }).fail(function() { console.error("Error reading article with title " + title); });
    }
    
    function goToRandomArticle() {
        if (selectedArchive === null) { return; } //Prevents exception if user hasn't selected an archive
        selectedArchive.getRandomDirEntry(function (dirEntry) {
            if (dirEntry === null || dirEntry === undefined) {
                alert("Error finding random article.");
            }
            else {
                if (dirEntry.namespace === 'A') {
                    $("#articleName").html(dirEntry.title);
                    pushBrowserHistoryState(dirEntry.namespace + "/" + dirEntry.url);
                    $("#readingArticle").show();
                    $('#articleContent').contents().find('body').html("");
                    readArticle(dirEntry);
                }
                else {
                    // If the random title search did not end up on an article,
                    // we try again, until we find one
                    goToRandomArticle();
                }
            }
        });
    }
    
    function goToMainArticle() {
        selectedArchive.getMainPageDirEntry(function (dirEntry) {
            if (dirEntry === null || dirEntry === undefined) {
                console.error("Error finding main article.");
                $("#welcomeText").show();
            }
            else {
                if (dirEntry.namespace === 'A') {
                    $("#articleName").html(dirEntry.title);
                    pushBrowserHistoryState('A/' + dirEntry.url);
                    $("#readingArticle").show();
                    $('#articleContent').contents().find('body').html("");
                    readArticle(dirEntry);
                }
                else {
                    console.error("The main page of this archive does not seem to be an article");
                    $("#welcomeText").show();
                }
            }
        });
    }
});
