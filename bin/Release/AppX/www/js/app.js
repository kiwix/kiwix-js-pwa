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

define(['jquery', 'zimArchiveLoader', 'util', 'uiUtil', 'cookies','abstractFilesystemAccess', 'module', 'transformStyles'],
 function($, zimArchiveLoader, util, uiUtil, cookies, abstractFilesystemAccess, module, transformStyles) {
     
    /**
     * Maximum number of articles to display in a search
     * @type Integer
     */
    var MAX_SEARCH_RESULT_SIZE = module.config().results; //This is set in init.js

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
                - $("#top").outerHeight(true)
                - $("#articleListWithHeader").outerHeight(true)
                // TODO : this 5 should be dynamically computed, and not hard-coded
                - 5;
        $(".articleIFrame").css("height", height + "px");
    }
    $(document).ready(resizeIFrame);
    $(window).resize(resizeIFrame);
    
    // Define behavior of HTML elements
    $('#searchArticles').on('click', function(e) {
        pushBrowserHistoryState(null, $('#prefix').val());
        searchDirEntriesFromPrefix($('#prefix').val());
        $("#welcomeText").hide();
        $("#readingArticle").hide();
        $("#articleContent").hide();
        if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
            $('#navbarToggle').click();
        }
    });
    $('#formArticleSearch').on('submit', function(e) {
        document.getElementById("searchArticles").click();
        return false;
    });
    $('#prefix').on('keyup', function(e) {
        if (selectedArchive !== null && selectedArchive.isReady()) {
            onKeyUpPrefix(e);
        }
    });
    $("#btnRandomArticle").on("click", function(e) {
        $('#prefix').val("");
        goToRandomArticle();
        $("#welcomeText").hide();
        $('#articleList').hide();
        $('#articleListHeaderMessage').hide();
        $("#readingArticle").hide();
        $('#searchingForArticles').hide();
        if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
            $('#navbarToggle').click();
        }
    });
    
    $('#btnRescanDeviceStorage').on("click", function(e) {
        searchForArchivesInStorage();
    });
    // Bottom bar :
    $('#btnBack').on('click', function(e) {
        history.back();
        return false;
    });
    $('#btnForward').on('click', function(e) {
        history.forward();
        return false;
    });
    $('#btnHomeBottom').on('click', function(e) {
        $('#btnHome').click();
        return false;
    });
    $('#btnTop').on('click', function(e) {
        $("#articleContent").contents().scrollTop(0);
        // We return true, so that the link to #top is still triggered (useful in the About section)
        return true;
    });
    // Top menu :
    $('#btnHome').on('click', function(e) {
        // Highlight the selected section in the navbar
        $('#liHomeNav').attr("class","active");
        $('#liConfigureNav').attr("class","");
        $('#liAboutNav').attr("class","");
        if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
            $('#navbarToggle').click();
        }
        // Show the selected content in the page
        $('#about').hide();
        $('#configuration').hide();
        $('#formArticleSearch').show();
        $("#welcomeText").show();
        $('#articleList').show();
        $('#articleListHeaderMessage').show();
        $('#articleContent').show();
        // Give the focus to the search field, and clean up the page contents
        $("#prefix").val("");
        $('#prefix').focus();
        $("#articleList").empty();
        $('#articleListHeaderMessage').empty();
        $("#readingArticle").hide();
        $("#articleContent").hide();
        $("#articleContent").contents().empty();
        $('#searchingForArticles').hide();
        if (selectedArchive !== null && selectedArchive.isReady()) {
            $("#welcomeText").hide();
            goToMainArticle();
        }
        return false;
    });
    $('#btnConfigure').on('click', function(e) {
        // Highlight the selected section in the navbar
        $('#liHomeNav').attr("class","");
        $('#liConfigureNav').attr("class","active");
        $('#liAboutNav').attr("class","");
        if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
            $('#navbarToggle').click();
        }
        // Show the selected content in the page
        $('#about').hide();
        $('#configuration').show();
        $('#formArticleSearch').hide();
        $("#welcomeText").hide();
        $('#articleList').hide();
        $('#articleListHeaderMessage').hide();
        $("#readingArticle").hide();
        $("#articleContent").hide();
        $('#articleContent').hide();
        $('#searchingForArticles').hide();
        refreshAPIStatus();
        return false;
    });
    $('#btnAbout').on('click', function(e) {
        // Highlight the selected section in the navbar
        $('#liHomeNav').attr("class","");
        $('#liConfigureNav').attr("class","");
        $('#liAboutNav').attr("class","active");
        if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
            $('#navbarToggle').click();
        }
        // Show the selected content in the page
        $('#about').show();
        $('#configuration').hide();
        $('#formArticleSearch').hide();
        $("#welcomeText").hide();
        $('#articleList').hide();
        $('#articleListHeaderMessage').hide();
        $("#readingArticle").hide();
        $("#articleContent").hide();
        $('#articleContent').hide();
        $('#searchingForArticles').hide();
        return false;
    });
    $('input:radio[name=contentInjectionMode]').on('change', function(e) {
        if (checkWarnServiceWorkerMode(this.value)) {
            document.getElementById('returntoArticle_top').innerHTML = "";
            document.getElementById('returntoArticle_bottom').innerHTML = "";
            // Do the necessary to enable or disable the Service Worker
            setContentInjectionMode(this.value);
        }
        else {
            setContentInjectionMode('jquery');
        }
    });
    $('input:checkbox[name=cssCacheMode]').on('change', function (e) {
        params['cssCache'] = this.checked ? true : false;
    });
    $('input:checkbox[name=imageDisplayMode]').on('change', function (e) {
        params['imageDisplay'] = this.checked ? true : false;
    });
    $('input:radio[name=cssInjectionMode]').on('click', function (e) {
        params['cssSource'] = this.value;
        //document.getElementById('returntoArticle_top').innerHTML = "";
        //document.getElementById('returntoArticle_bottom').innerHTML = "";
    });
    $(document).ready(function (e) {
        // Set checkbox for cssCache and radio for cssSource
        document.getElementById('cssCacheModeCheck').checked = params['cssCache'];
        document.getElementById('imageDisplayModeCheck').checked = params['imageDisplay'];
        $('input:radio[name=cssInjectionMode]').filter('[value="' + params['cssSource'] + '"]').prop('checked', true);
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
                navigator.serviceWorker.controller.postMessage({'action': 'disable'});
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
                    serviceWorker.addEventListener('statechange', function(statechangeevent) {
                        if (statechangeevent.target.state === 'activated') {
                            console.log("try to post an init message to ServiceWorker");
                            navigator.serviceWorker.controller.postMessage({'action': 'init'}, [messageChannel.port2]);
                            console.log("init message sent to ServiceWorker");
                        }
                    });
                }, function (err) {
                    console.error('error while registering serviceWorker', err);
                    refreshAPIStatus();
                });
            } else {
                console.log("try to re-post an init message to ServiceWorker, to re-enable it in case it was disabled");
                navigator.serviceWorker.controller.postMessage({'action': 'init'}, [messageChannel.port2]);
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
        try{
            var dummyMessageChannel = new MessageChannel();
            if (dummyMessageChannel) return true;
        }
        catch (e){
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
            searchForArchivesInStorage();
        }
    }
    function searchForArchivesInStorage() {
        // If DeviceStorage is available, we look for archives in it
        $("#btnConfigure").click();
        $('#scanningForArchives').show();
        zimArchiveLoader.scanForArchives(storages, populateDropDownListOfArchives);
    }

    if ($.isFunction(navigator.getDeviceStorages)) {
        // The method getDeviceStorages is available (FxOS>=1.1)
        storages = $.map(navigator.getDeviceStorages("sdcard"), function(s) {
            return new abstractFilesystemAccess.StorageFirefoxOS(s);
        });
    }

    if (storages !== null && storages.length > 0) {
        // Make a fake first access to device storage, in order to ask the user for confirmation if necessary.
        // This way, it is only done once at this moment, instead of being done several times in callbacks
        // After that, we can start looking for archives
        //storages[0].get("fake-file-to-read").then(searchForArchivesInPreferencesOrStorage,
                                                  //searchForArchivesInPreferencesOrStorage);
        searchForArchivesInPreferencesOrStorage;
    }
    else {
        // If DeviceStorage is not available, we display the file select components
        displayFileSelect();
        if (document.getElementById('archiveFiles').files && document.getElementById('archiveFiles').files.length>0) {
            // Archive files are already selected, 
            setLocalArchiveFromFileSelect();
        }
        else {
            $("#btnConfigure").click();
        }
    }


    // Display the article when the user goes back in the browser history
    window.onpopstate = function(event) {
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
            
            if (title && !(""===title)) {
                goToArticle(title);
            }
            else if (titleSearch && !(""===titleSearch)) {
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
        
        $('#archiveList').on('change', setLocalArchiveFromArchiveList);
        if (comboArchiveList.options.length > 0) {
            var lastSelectedArchive = cookies.getItem("lastSelectedArchive");
            if (lastSelectedArchive !== null && lastSelectedArchive !== undefined && lastSelectedArchive !== "") {
                // Attempt to select the corresponding item in the list, if it exists
                if ($("#archiveList option[value='"+lastSelectedArchive+"']").length > 0) {
                    $("#archiveList").val(lastSelectedArchive);
                }
            }
            // Set the localArchive as the last selected (or the first one if it has never been selected)
            setLocalArchiveFromArchiveList();
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
        if (archiveDirectory && archiveDirectory.length > 0) {
            // Now, try to find which DeviceStorage has been selected by the user
            // It is the prefix of the archive directory
            var regexpStorageName = /^\/([^\/]+)\//;
            var regexpResults = regexpStorageName.exec(archiveDirectory);
            var selectedStorage = null;
            if (regexpResults && regexpResults.length>0) {
                var selectedStorageName = regexpResults[1];
                for (var i=0; i<storages.length; i++) {
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
                else {
                    alert("Something weird happened with the DeviceStorage API : found a directory without prefix : "
                        + archiveDirectory + ", but there were " + storages.length
                        + " storages found with getDeviceStorages instead of 1");
                }
            }
            selectedArchive = zimArchiveLoader.loadArchiveFromDeviceStorage(selectedStorage, archiveDirectory, function (archive) {
                cookies.setItem("lastSelectedArchive", archiveDirectory, Infinity);
                // The archive is set : go back to home page to start searching
                $("#btnHome").click();
            });
            
        }
    }

    /**
     * Displays the zone to select files from the archive
     */
    function displayFileSelect() {
        $('#openLocalFiles').show();
        $('#archiveFiles').on('change', setLocalArchiveFromFileSelect);
    }

    function setLocalArchiveFromFileList(files) {
        selectedArchive = zimArchiveLoader.loadArchiveFromFiles(files, function (archive) {
            // The archive is set : go back to home page to start searching
            $("#btnHome").click();
        });
    }
    /**
     * Sets the localArchive from the File selects populated by user
     */
    function setLocalArchiveFromFileSelect() {
        setLocalArchiveFromFileList(document.getElementById('archiveFiles').files);
    }

    /**
     * This is used in the testing interface to inject a remote archive.
     */
    window.setRemoteArchive = function(url) {
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "blob";
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if ((request.status >= 200 && request.status < 300) || request.status === 0) {
                // Hack to make this look similar to a file
                request.response.name = url;
                setLocalArchiveFromFileList([request.response]);
            	}
            }
        };
        request.send(null);
    };

    /**
     * Handle key input in the prefix input zone
     * @param {Event} evt
     */
    function onKeyUpPrefix(evt) {
        // Use a timeout, so that very quick typing does not cause a lot of overhead
        // It is also necessary for the words suggestions to work inside Firefox OS
        if(window.timeoutKeyUpPrefix) {
            window.clearTimeout(window.timeoutKeyUpPrefix);
        }
        window.timeoutKeyUpPrefix = window.setTimeout(function() {
            var prefix = $("#prefix").val();
            if (prefix && prefix.length>0) {
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
            $("#searchArticles").focus();
            alert("Archive not set : please select an archive");
            $("#btnConfigure").click();
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
            
            articleListDivHtml += "<a href='#' dirEntryId='" + dirEntry.toStringId().replace(/'/g,"&apos;")
                    + "' class='list-group-item'>" + dirEntry.title + "</a>";
        }
        articleListDiv.html(articleListDivHtml);
        $("#articleList a").on("click",handleTitleClick);
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
        pushBrowserHistoryState(dirEntry.url);
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

            selectedArchive.readArticle(dirEntry, displayArticleInForm);
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
                        selectedArchive.readBinaryFile(dirEntry, function(readableTitle, content) {
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
    var regexpImageLink = /^.?\/?[^:]+:(.*)/;
    var regexpPath = /^(.*\/)[^\/]+$/;
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

        //Fast-replace img src with data-kiwixsrc and hide image [kiwix-js #272]
        htmlArticle = htmlArticle.replace(/(<img\s+[^>]*\b)src(\s*=)/ig, "$1data-kiwixsrc$2");
        if (!params['imageDisplay']) {
            //Ensure 36px clickable image height so user can request images by clicking [kiwix-js #173]
            htmlArticle = htmlArticle.replace(/(<img\s+[^>]*\b)height(\s*=\s*)/ig,
                '$1height="36" alt="Placeholder" style="color: lightblue; background-color: lightblue;" ' +
                'data-kiwixheight$2');
        }

     //Preload stylesheets [kiwix-js @149]
        //Set up blobArray of promises
        var cssArray = htmlArticle.match(regexpSheetHref);
        var blobArray = [];
        var cssSource = params['cssSource'];
        var cssCache = params['cssCache'];
        var zimType = "";
        getBLOB(cssArray);

        //Extract CSS URLs from given array of links
        function getBLOB(arr) {
            var testCSS = arr.join();
            zimType = /-\/s\/style\.css/i.test(testCSS) ? "desktop" : zimType;
            zimType = /minerva|mobile/i.test(testCSS) ? "mobile" : zimType;
            if (/minerva/i.test(testCSS) && (cssCache || zimType != cssSource)) {
                //Substitute ridiculously long style name TODO: move this code to transformStyles
                for (var i = 0; i < arr.length; i++) { //NB minerva.css is a dummy name for now TODO: sort out in transfromStyles
                    arr[i] = /minerva/i.test(arr[i]) ? '<link href="../-/s/style-mobile.css" rel="stylesheet" type="text/css">' : arr[i];
                }
            }
            for (var i = 0; i < arr.length; i++) {
                var linkArray = regexpSheetHref.exec(arr[i]);
                regexpSheetHref.lastIndex = 0; //Reset start position for next loop
                if (linkArray && regexpMetadataUrl.test(linkArray[2])) { //It's a CSS file contained in ZIM
                    var zimLink = decodeURIComponent(uiUtil.removeUrlParameters(linkArray[2]));
                    /* zl = zimLink; zim = zimType; cc = cssCache; cs = cssSource; i  */
                    var filteredLink = transformStyles.filterCSS(zimLink, zimType, cssCache, cssSource, i);
                    //blobArray[i] = filteredLink.zl; //This line is a mistake! It fills blobArray too quickly and doesn't trigger waiting for primises...
                    //filteredLink.rtnFunction == "injectCSS" ? injectCSS() : resolveCSS(filteredLink.zl, i); 
                    if (filteredLink.rtnFunction == "injectCSS") { blobArray[i] = filteredLink.zl; injectCSS() } else { resolveCSS(filteredLink.zl, i); }
                } else {
                    blobArray[i] = arr[i]; //If CSS not in ZIM, store URL in blobArray
                    injectCSS(); //Ensure this is called even if none of CSS links are in ZIM
                }
            }
        }

        function resolveCSS(title, index) {
            selectedArchive.getDirEntryByTitle(title).then(
            function (dirEntry) {
                selectedArchive.readBinaryFile(dirEntry,
                    function (readableTitle, content, namespace, url) {
                //DEV: Uncomment line below and break on next to capture cssContent for local filesystem cache
                    //var cssContent = util.uintToString(content);
                    var cssBlob = new Blob([content], { type: 'text/css' }, { oneTimeOnly: true });
                    var newURL = [namespace + "/" + url, URL.createObjectURL(cssBlob)];
                    //blobArray[index] = newURL; //Don't bother with "index" -- you don't need to track the order of the blobs TODO: delete this logic
                    blobArray.push(newURL);
                    injectCSS(); //DO NOT move this: it must run within .then function to pass correct values
                });
            }).fail(function (e) {
                console.error("could not find DirEntry for CSS : " + title, e);
                //blobArray[index] = title;
                blobArray.push(title);
                injectCSS();
            });
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

        function injectHTML(htmlContent) {
            //Void progress message
            uiUtil.clear(); //Void progress messages
            $("#readingArticle").hide();
            $("#articleContent").show();
            // Scroll the iframe to its top
            $("#articleContent").contents().scrollTop(0);
            $('#articleContent').contents().find('body').html(htmlContent);
            //Try to match Title
            //var articleTitle = htmlContent.match(regexpArticleTitle); 
            //If not found try to match mw-offliner ZIM format
            //var articleTitle = articleTitle ? articleTitle[1] : htmlContent.match(regexpType2ZIMTitle);
            //If not found, use "Article"
            //articleTitle = articleTitle ? articleTitle[1] : "Article";
            uiUtil.makeReturnLink(dirEntry); //[kiwix-js #127]

            // If the ServiceWorker is not useable, we need to fallback to parse the DOM
            // to inject math images, and replace some links with javascript calls
            if (contentInjectionMode === 'jquery') {

                // Convert links into javascript calls
                $('#articleContent').contents().find('body').find('a').each(function () {
                    // Store current link's url
                    var url = $(this).attr("href");
                    if (url === null || url === undefined) {
                        return;
                    }
                    var lowerCaseUrl = url.toLowerCase();
                    var cssClass = $(this).attr("class");

                    if (cssClass === "new") {
                        // It's a link to a missing article : display a message
                        $(this).on('click', function (e) {
                            alert("Missing article in Wikipedia");
                            return false;
                        });
                    }
                    else if (url.slice(0, 1) === "#") {
                        // It's an anchor link : do nothing
                    }
                    else if (url.substring(0, 4) === "http") {
                        // It's an external link : open in a new tab
                        $(this).attr("target", "_blank");
                    }
                    else if (url.match(regexpImageLink)
                        && (util.endsWith(lowerCaseUrl, ".png")
                            || util.endsWith(lowerCaseUrl, ".svg")
                            || util.endsWith(lowerCaseUrl, ".jpg")
                            || util.endsWith(lowerCaseUrl, ".jpeg"))) {
                        // It's a link to a file of Wikipedia : change the URL to the online version and open in a new tab
                        var onlineWikipediaUrl = url.replace(regexpImageLink, "https://" + selectedArchive._language + ".wikipedia.org/wiki/File:$1");
                        $(this).attr("href", onlineWikipediaUrl);
                        $(this).attr("target", "_blank");
                    }
                    else {
                        // It's a link to another article
                        // Add an onclick event to go to this article
                        // instead of following the link

                        if (url.substring(0, 2) === "./") {
                            url = url.substring(2);
                        }
                        // Remove the initial slash if it's an absolute URL
                        else if (url.substring(0, 1) === "/") {
                            url = url.substring(1);
                        }
                        $(this).on('click', function (e) {
                            var decodedURL = decodeURIComponent(url);
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

        if (contentInjectionMode === 'jquery') {
            //loadImages();
            //loadJavascript(); //Disabled for now, since it does nothing
        }

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
    //DEV: Set this to the number of images you want to prefetch after the on-screen images have been fetched
        var prefetchSliceSize = 20;
    //DEV: SVG images are currently very taxing: keep this number at 5 or below and test on your system with Sine.html
        var svgSliceSize = 3;
        var visibleSlice = [];
        var svgSlice = [];
        var prefetchSlice = [];
        var windowScroll = true;
        var imageDisplay = params['imageDisplay'];

        //Establish master image array
        var images = $('#articleContent').contents().find('body').find('img');
        var allImages = images.length;

        //If user wants to display images...
        if (imageDisplay) {

            //Set up a listener function for onscroll event
            if (allImages > prefetchSliceSize) {
                //Polyfill scrollStopped event
                $.fn.scrollStopped = function (callback) {
                    var that = this, $this = $(that);
                    $this.scroll(function (ev) {
                        clearTimeout($this.data('scrollTimeout'));
                        $this.data('scrollTimeout', setTimeout(callback.bind(that), 250, ev));
                    });
                }
                $("#articleContent").contents().scrollStopped(prepareImages);
                    /*(function () {
                    //Ensure event doesn't fire multiple times before launched process has finished
                    if (windowScroll) {
                        //scrollEnded = true;
                        windowScroll = false;
                        prepareImages();
                    }
                });
                /*$("#articleContent").contents().on("scroll", function () {
                    //Ensure event doesn't fire multiple times before scrollStopped "event"
                    if (windowScroll && scrollEnded) {
                        scrollEnded = false;
                        windowScroll = false;
                        prepareImages();
                    }
                });*/
            }
            if (allImages) {
                prepareImages();
            } else {
                console.log("There are no images to display in this article.");
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
                        //loadImageSlice(this, 0, 0, function (sliceID, sliceCount, sliceEnd, url) {
                        //    img[0].src = url;
                        //}); //Both the blob method and the src="data:" method work - if changing check parameters carefully
                        //loadImageSlice(this.getAttribute('data-kiwixsrc'), 0, 0, function (sliceID,sliceCount,sliceEnd,mimetype,data) {
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
            var svgGroup1 = [], svgGroup2 = [];
            for (var i = startSlice; i < lengthSlice; i++) {
                if (/\.svg$/i.test(images[i].getAttribute('data-kiwixsrc'))) {
                    if (i < firstVisible || i > lastVisible) {
                        svgGroup2.push(images[i]);
                    } else {
                        svgGroup1.push(images[i]);
                    }
                } else {
                    if (i <= lastVisible) {
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
                        console.log("** About to request " + visibleSlice.length + " visible image(s)...");
                        loadImageSlice(visibleSlice, 1, visibleSlice.length, displaySlices);
                        visibleSlice = [];
                    //TESTING
                        console.timeEnd("Time to Document Ready");
                    } else { //No images in this slice so move on to next
                        sliceID++;
                    }
                }
                if (sliceID == 2) {
                    if (prefetchSlice.length) {
                        console.log("Prefetching " + prefetchSlice.length + " offscreen images...");
                        loadImageSlice(prefetchSlice, 2, prefetchSlice.length, displaySlices);
                        prefetchSlice = [];
                    } else { //No images in this slice so move on to next
                        sliceID++;
                    }
                }
                if (sliceID == 3) {
                    if (svgSlice.length) {
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
                        console.log("All images extracted from requested slices\n" +
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
                        console.log("startSVG");
                        startSVG = checkVisibleImages();
                    } else {
                        console.log("endSVG");
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
                        selectedArchive.readBinaryFile(dirEntry, function (readableTitle, content, namespace, url) {
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



    /*** Image functions below this comment are deprecated ****

        function prePrepImages() {
            //var imageURLs = htmlContent.match(/kiwixsrc\s*=\s*["'](?:\.\.\/|\/)+(I\/)/ig);
            var imageDisplay = params['imageDisplay'];
            var images = $('#articleContent').contents().find('body').find('img');
            var countImages = 0;
            //DEV: firstSliceSize determines maximum number of images loaded above the fold (should be <= 10)
            //Smaller numbers give faster subjective experience, but too small may delay load of visible images above the fold
            var firstSliceSize = 7;
            //DEV: sliceSize determines minimum batch size of background image extraction for remaining images
            //Larger numbers marginally increase speed of background extraction but take longer for directory lookup and conflict with user scrolling
            var sliceSize = 10;
            var svgSliceSize = 5;
            var imageSlice = {};
            var slice$x = 0;
            var slice$y = 0;
            var svg = 0;
            var windowScroll = false;

            //If there are images in the article, set up a listener function for onscroll event
            if (images.length && imageDisplay) {
                if (images.length > firstSliceSize) {
                    $("#articleContent").contents().on("scroll", function () {
                        //Ensure event doesn't fire multiple times and waits for previous slice to be retrieved
                        if (windowScroll && countImages == slice$y) {
                            windowScroll = false; //Indicate we no longer need to delay execution because user has scrolled
                            sliceImages();
                        }
                    });
                }

                sliceImages();

            } else { //User did not request images, so give option of loading one by one {kiwix-js #173]
                if (images.length) {
                    images.each(function () {
                        // Attach an onclick function to load the image
                        var img = $(this);
                        img.on('click', function () {
                            this.height = this.getAttribute('data-kiwixheight');
                            this.style.background = "";
                            //loadOneImage(this.getAttribute('data-kiwixsrc'), function (url) {
                            //    img[0].src = url;
                            //}); //Both the blob method and the src="data:" method work - if changing, edit loadOneImage() also
                            loadOneImage(this.getAttribute('data-kiwixsrc'), function (mimetype, data) {
                                img[0].src = "data:" + mimetype + ";base64," + btoa(data);
                            });
                        });
                    });
                }
            }
            //TESTING
            if (!images.length) {
                console.log("No images in document");
                console.timeEnd("Time to Document Ready");
            } else {
                if (!imageDisplay) {
                    console.log("Image retrieval disabled by user");
                    console.timeEnd("Time to Document Ready");
                }
            }
            //END TESTING
        }

        /**
        * Loads images in batches or "slices" according to firstSliceSize and sliceSize parameters set above
        * Slices after firstSlice are delayed until the user scrolls the iframe window
        **
        function sliceImages() {
            //Chrome seems to lose the number of images between loops, so we repeat this statement:
            images = $('#articleContent').contents().find('body').find('img');

            //If starting loop or slice batch is complete AND we still need images for article
            if ((countImages >= slice$y) && (countImages < images.length)) {
                if (!windowScroll) { //If we haven't requested the next loop to be on scroll
                    //Filter out images we've already extracted
                    for (var i = 0; i < images.length; i++) {
                        if (images[i].src) {
                            images.splice(i, 1);
                            countImages--; //Don't count already displayed images
                        }
                    }
                    //TESTING: Reset everything! NOPE - causes infinite loop
                    //countImages = 0;
                    //slice$x = 0;
                    //slice$y = 0;

                    //slice$x = slice$y; //Not needed, because we'll always start again now
                    var remainder = (images.length - firstSliceSize) % (sliceSize);
                    slice$y = slice$y > 0 ? slice$y + sliceSize : slice$y + firstSliceSize; //Increment by standard or initial sliceSize 
                    //If all images can be obtained in one batch, set slice$y to number of images
                    slice$y = slice$y > images.length ? images.length : slice$y;
                    //Last batch should be increased to include any remainder
                    if (slice$x > 0 && (slice$y + remainder === images.length)) { slice$y += remainder; }

                    //Find visible images
                    var firstVisible, lastVisible;
                    for (var n = 0; n < images.length; n++) {
                        var visibility = uiUtil.isElementInView(images[n], false);
                        if (visibility) {
                            firstVisible = firstVisible >= 0 ? firstVisible : n;
                            lastVisible = n;
                        } else {
                            if (firstVisible >= 0 && lastVisible >= 0) {
                                console.log("** First visible image is #" + firstVisible + "\n" +
                                    "** Last visible image is #" + lastVisible);
                                break;
                            }
                        }
                    }

                    //Extend slice$y if it doesn't cover all visible images
                    slice$y = slice$y < lastVisible ? lastVisible : slice$y;

                    console.log("Requesting images # " + (slice$x + 1) + " to " + slice$y + "...");
                    imageSlice = images.slice(slice$x, slice$y);

                     // Check to see if the slice contains svg images...
                    if (imageSlice.length > svgSliceSize) {
                        for (var t = 0; t < imageSlice.length; t++) {
                            if (/\.svg$/i.test(imageSlice[t].getAttribute('data-kiwixsrc'))) {
                                var tempimageSlice = imageSlice.slice(0, svgSliceSize);
                                slice$y = slice$x + svgSliceSize //Reduce sliceSize to prevent app from hanging
                                imageSlice = tempimageSlice;
                                //Increment svg loop detector unless we reach end of visible images
                                svg = svg < (Math.ceil((lastVisible - slice$y)/svgSliceSize)) ? svg + 1 : 0; //Resetting svg to 0 will cause wait on scroll on next sliceImages loop
                                console.log("SVG images detected in slice, reducing image sliceSize...");
                                break;
                            }
                        }
                    }

                    serializeImages();

                } else {
                    console.log("** Waiting for user to scroll the window...");
                }
            } else { //All images requested, so Unload the scroll listener
                if (images && images.length > firstSliceSize) {
                    if (countImages == images.length) {
                        console.log("Unloading scroll listener");
                        $("#articleContent").contents().off('scroll');
                    }
                }
            }
        }

        function serializeImages() {
            $(imageSlice).each(function () {
                var image = $(this);
                //TESTING: If the image isn't in the viewport, abandon it
                if (!uiUtil.isElementInView(image[0], false)) {
                    //countImages++;
                    slice$y--;
                    windowScroll = countImages == slice$y ? true : windowScroll;
                    sliceImages();
                    return;
                }

                /*TEST
                var isInView = uiUtil.isElementInView(image[0], false);
                console.log("The next image is " + (isInView ? "" : "not ") + "visible");
                //*

                // It's a standard image contained in the ZIM file
                // We try to find its name (from an absolute or relative URL)
                var imageMatch = image.attr('data-kiwixsrc').match(regexpImageUrl); //kiwix-js #272
                if (imageMatch) {
                    var title = decodeURIComponent(imageMatch[1]);
                    selectedArchive.getDirEntryByTitle(title).then(function (dirEntry) {
                        selectedArchive.readBinaryFile(dirEntry, function (readableTitle, content, namespace, url) {
                            // TODO : use the complete MIME-type of the image (as read from the ZIM file)
                            var mimetype = url.match(/\.(\w{2,4})$/);
                            mimetype = mimetype ? "image/" + mimetype[1].toLowerCase() : "image";
                            mimetype = /\.jpg$/i.test(url) ? "image/jpeg" : mimetype;
                            mimetype = /\.tif$/i.test(url) ? "image/tiff" : mimetype;
                            mimetype = /\.ico$/i.test(url) ? "image/x-icon" : mimetype;
                            mimetype = /\.svg$/i.test(url) ? "image/svg+xml" : mimetype;
                            uiUtil.feedNodeWithBlob(image, 'src', content, mimetype);
                            //Alternative way of loading images below also works
                            //var data = util.uintToString(content);
                            //image[0].src = "data:" + mimetype + ";base64," + btoa(data);
                            countImages++

                        //TESTING
                            console.log("Extracted image " + (countImages) + " of " + images.length + "...");
                            if (countImages == firstSliceSize || (countImages <= firstSliceSize && countImages == images.length)) {
                                console.log("** First image slice extracted: document ready **");
                                console.timeEnd("Time to Document Ready");
                                console.log("");
                            }
                            if (countImages == images.length) {
                                console.log("** All images extracted **");
                            }
                        //END TESTING

                            if (countImages == slice$y) {
                                //Once slice is complete, delay the loop unless there are SVG images in slice
                                windowScroll = svg ? false : true; //If svg is 0, waits for user scroll on next sliceImages loop
                            }   //Explanation: extraction of svg images is slow and memory-hungry, so keep going while detecting SVG, in slices of 5 (see code above)
                            sliceImages();
                        });
                    }).fail(function (e) {
                        console.error("Could not find DirEntry for image:" + title, e);
                        countImages++;
                        if (countImages == slice$y) {
                            windowScroll = true; //Once slice is complete, delay the loop
                        }
                        sliceImages();
                    });
                }
            });
        }

        function loadOneImage(image, callback) {
            // It's a standard image contained in the ZIM file
            // We try to find its name (from an absolute or relative URL)
            var imageMatch = image.match(regexpImageUrl);
            if (imageMatch) {
                var title = decodeURIComponent(imageMatch[1]);
                selectedArchive.getDirEntryByTitle(title).then(function (dirEntry) {
                    selectedArchive.readBinaryFile(dirEntry, function (readableTitle, content, namespace, url) {
                        var mimetype = url.match(/\.(\w{2,4})$/);
                        mimetype = mimetype ? "image/" + mimetype[1].toLowerCase() : "image";
                        mimetype = /\.jpg$/i.test(url) ? "image/jpeg" : mimetype;
                        mimetype = /\.tif$/i.test(url) ? "image/tiff" : mimetype;
                        mimetype = /\.ico$/i.test(url) ? "image/x-icon" : mimetype;
                        mimetype = /\.svg$/i.test(url) ? "image/svg+xml" : mimetype;
                        //var imageBlob = new Blob([content], { type: mimetype }, { oneTimeOnly: true });
                        //var newURL = URL.createObjectURL(imageBlob);
                        var data = util.uintToString(content);
                        //callback(newURL); //If using blob method, no need to send mimetype
                        callback(mimetype, data);
                    });
                }).fail(function (e) {
                    console.error("Could not find DirEntry for image:" + title, e);
                    callback("");
                });
            }
        } */

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
                        selectedArchive.readBinaryFile(dirEntry, function (readableTitle, content) {
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
        selectedArchive.getDirEntryByTitle(title).then(function(dirEntry) {
            if (dirEntry === null || dirEntry === undefined) {
                $("#readingArticle").hide();
                alert("Article with title " + title + " not found in the archive");
            }
            else {
                $("#articleName").html(title);
                $("#readingArticle").show();
                $('#articleContent').contents().find('body').html("");
                readArticle(dirEntry);
            }
        }).fail(function() { alert("Error reading article with title " + title); });
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
                    pushBrowserHistoryState(dirEntry.url);
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
            }
            else {
                if (dirEntry.namespace === 'A') {
                    $("#articleName").html(dirEntry.title);
                    pushBrowserHistoryState(dirEntry.url);
                    $("#readingArticle").show();
                    $('#articleContent').contents().find('body').html("");
                    readArticle(dirEntry);
                }
                else {
                    console.error("The main page of this archive does not seem to be an article");
                }
            }
        });
    }
});
