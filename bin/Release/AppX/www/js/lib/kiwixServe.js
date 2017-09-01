/**
 * languageCodes.js: Provides an object literal for looking up the English-language names of language codes
 * as defined in ISO 639-1, augmented with some ISO 639-3 codes as used by Wikipedia
 * 
 * This file is part of Kiwix.
 * 
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
'use strict';

define([], function () {

    var langCodes = {
        ab: 'Abkhazian',
        aa: 'Afar',
        af: 'Afrikaans',
        ak: 'Akan',
        sq: 'Albanian',
        am: 'Amharic',
        ar: 'Arabic',
        an: 'Aragonese',
        hy: 'Armenian',
        as: 'Assamese',
        av: 'Avaric',
        ae: 'Avestan',
        ay: 'Aymara',
        az: 'Azerbaijani',
        bm: 'Bambara',
        ba: 'Bashkir',
        eu: 'Basque',
        be: 'Belarusian',
        bn: 'Bengali (Bangla)',
        bh: 'Bihari',
        bi: 'Bislama',
        bs: 'Bosnian',
        br: 'Breton',
        bg: 'Bulgarian',
        my: 'Burmese',
        ca: 'Catalan',
        ch: 'Chamorro',
        ce: 'Chechen',
        ny: 'Chichewa-Chewa-Nyanja',
        zh: 'Chinese',
        zh: 'Chinese',
        cv: 'Chuvash',
        kw: 'Cornish',
        co: 'Corsican',
        cr: 'Cree',
        hr: 'Croatian',
        cs: 'Czech',
        da: 'Danish',
        dv: 'Divehi-Dhivehi-Maldivian',
        nl: 'Dutch',
        dz: 'Dzongkha',
        en: 'English',
        eo: 'Esperanto',
        et: 'Estonian',
        ee: 'Ewe',
        fo: 'Faroese',
        fj: 'Fijian',
        fi: 'Finnish',
        fr: 'French',
        ff: 'Fula-Fulah-Pulaar-Pular',
        gl: 'Galician',
        gd: 'Gaelic (Scottish)',
        gv: 'Gaelic (Manx)',
        ka: 'Georgian',
        de: 'German',
        el: 'Greek',
        kl: 'Greenlandic-Kalaallisut',
        gn: 'Guarani',
        gu: 'Gujarati',
        ht: 'Haitian Creole',
        ha: 'Hausa',
        he: 'Hebrew',
        hz: 'Herero',
        hi: 'Hindi',
        ho: 'Hiri Motu',
        hu: 'Hungarian',
        is: 'Icelandic',
        io: 'Ido',
        ig: 'Igbo',
        id: 'Indonesian',
        in: 'Indonesian',
        ia: 'Interlingua',
        ie: 'Interlingue',
        iu: 'Inuktitut',
        ik: 'Inupiak',
        ga: 'Irish',
        it: 'Italian',
        ja: 'Japanese',
        jv: 'Javanese',
        kn: 'Kannada',
        kr: 'Kanuri',
        ks: 'Kashmiri',
        kk: 'Kazakh',
        km: 'Khmer',
        ki: 'Kikuyu',
        rw: 'Kinyarwanda (Rwanda)',
        rn: 'Kirundi',
        ky: 'Kyrgyz',
        kv: 'Komi',
        kg: 'Kongo',
        ko: 'Korean',
        ku: 'Kurdish',
        kj: 'Kwanyama',
        lo: 'Lao',
        la: 'Latin',
        lv: 'Latvian (Lettish)',
        li: 'Limburgish ( Limburger)',
        ln: 'Lingala',
        lt: 'Lithuanian',
        lu: 'Luga-Katanga',
        lg: 'Luganda-Ganda',
        lb: 'Luxembourgish',
        mk: 'Macedonian',
        mg: 'Malagasy',
        ms: 'Malay',
        ml: 'Malayalam',
        mt: 'Maltese',
        mi: 'Maori',
        mr: 'Marathi',
        mh: 'Marshallese',
        mo: 'Moldavian',
        mn: 'Mongolian',
        na: 'Nauru',
        nv: 'Navajo',
        ng: 'Ndonga',
        nd: 'Northern Ndebele',
        ne: 'Nepali',
        no: 'Norwegian',
        nb: 'Norwegian bokmål',
        nn: 'Norwegian nynorsk',
        ii: 'Nuosu (Sichuan Yi)',
        oc: 'Occitan',
        oj: 'Ojibwe',
        cu: 'Old Church Slavonic-Old Bulgarian',
        or: 'Oriya',
        om: 'Oromo (Afaan Oromo)',
        os: 'Ossetian',
        pi: 'Pāli',
        ps: 'Pashto-Pushto',
        fa: 'Persian (Farsi)',
        pl: 'Polish',
        pt: 'Portuguese',
        pa: 'Punjabi (Eastern)',
        qu: 'Quechua',
        rm: 'Romansh',
        ro: 'Romanian',
        ru: 'Russian',
        se: 'Sami',
        sm: 'Samoan',
        sg: 'Sango',
        sa: 'Sanskrit',
        sr: 'Serbian',
        sh: 'Serbo-Croatian',
        st: 'Sesotho',
        tn: 'Setswana',
        sn: 'Shona',
        sd: 'Sindhi',
        si: 'Sinhalese',
        ss: 'Siswati',
        sk: 'Slovak',
        sl: 'Slovenian',
        so: 'Somali',
        nr: 'Southern Ndebele',
        es: 'Spanish',
        su: 'Sundanese',
        sw: 'Swahili (Kiswahili)',
        sv: 'Swedish',
        tl: 'Tagalog',
        ty: 'Tahitian',
        tg: 'Tajik',
        ta: 'Tamil',
        tt: 'Tatar',
        te: 'Telugu',
        th: 'Thai',
        bo: 'Tibetan',
        ti: 'Tigrinya',
        to: 'Tonga',
        ts: 'Tsonga',
        tr: 'Turkish',
        tk: 'Turkmen',
        tum: 'Tumbuka',
        tw: 'Twi',
        ug: 'Uyghur',
        uk: 'Ukrainian',
        ur: 'Urdu',
        uz: 'Uzbek',
        ve: 'Venda',
        vi: 'Vietnamese',
        vo: 'Volapük',
        wa: 'Wallon',
        cy: 'Welsh',
        wo: 'Wolof',
        fy: 'Western Frisian',
        xh: 'Xhosa',
        yi: 'Yiddish',
        ji: 'Yiddish',
        yo: 'Yoruba',
        za: 'Zhuang-Chuang',
        zu: 'Zulu'
    };

    function requestDownloadLinks(URL, lang) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            var downloadLinks = document.getElementById('downloadLinks');
            var serverResponse = document.getElementById('serverResponse');
            serverResponse.innerHTML = "Server response: Waiting...";
            serverResponse.style.display = "inline";
            if (this.readyState == 4 && this.status == 200) {
                serverResponse.innerHTML = "Server response: 200 OK (data received)";
                var doc = this.responseText;
                if (/\.meta4$/i.test(URL)) {
                    //It's the metalink with download links
                    var linkArray = doc.match(/<url\b[^>]*>[^<]*<\/url>/ig);
                    var size = doc.match(/<size>(\d+)<\/size>/i);
                    //Filter value (add commas if required)
                    size = size.length ? size[1] : "";
                    var megabytes = size ? Math.round(size * 10 / (1024 * 1024)) / 10 : size;
                    //Use the lookbehind reversal trick to add commas....
                    size = size.toString().split('').reverse().join('').replace(/(\d{3}(?!.*\.|$))/g, '$1,').split('').reverse().join('');
                    var megabytes$ = megabytes.toString().split('').reverse().join('').replace(/(\d{3}(?!.*\.|$))/g, '$1,').split('').reverse().join('');
                    doc = "";
                    //NB we'ere intentionally discarding first link to kiwix.org (not to zim)
                    var mirrorservice = false;
                    for (var i = 1; i < linkArray.length; i++) {
                        if (/mirrorservice\.org/i.test(linkArray[i])) {
                            mirrorservice = true;
                            doc += linkArray[i].replace(/<url\b[^>]*>([^<]*)<\/url>/i, '<li>*** Server has download bug, see note ***<br />$1</li>\r\n');
                        } else {
                            doc += linkArray[i].replace(/<url\b[^>]*>([^<]*)<\/url>/i, '<li><a href="$1" target="_blank">$1</a></li>\r\n');
                        }
                    }
                    var headerDoc = 'We found the following links to your file:';
                    var bodyDoc = "<h5";
                    bodyDoc += megabytes > 200 ? ' style="color:red;"> WARNING: ' : '>';
                    bodyDoc += 'File size is <b>' + (megabytes ? megabytes$ + 'MB' : 'unnown') + '</b>' + (size ? ' (' + size + ' bytes)' : '') + '</h5>\r\n';
                    if (megabytes > 4000) bodyDoc += '<p style="color:red;">This file is larger than the maximum file size permitted on an SD card formatted as FAT32 (max size is approx. 4GB). If your card or other storage area is formatted in this way, you will need to download a split version of this file: see <a href="http://wiki.kiwix.org/wiki/FAQ/en">Frequently Asked Questions</a>.</p>\r\n';
                    if (megabytes > 200) bodyDoc += '<p><b>Consider using a torrent download method: see <a href="#" onclick="$(\'#btnAbout\').click();">About</a> section</b></p>\r\n';
                    bodyDoc += '<p><i>Links will open in a new browser window</i></p><ol>\r\n' + doc + '</ol>\r\n';
                    if (mirrorservice) bodyDoc += '*** Note: mirrorservice.org currently has a download bug with ZIM archives: on some browsers it will download the ZIM file as plain text in browser window<br /><br />';
                    bodyDoc += '<a id="returnLink" href="#" data-kiwix-dl="' + URL.replace(/\/[^\/]*\.meta4$/i, "\/") + '">&lt;&lt; Back to list of files</a><br /><br />';
                    var header = document.getElementById('dl-panel-heading');
                    header.outerHTML = header.outerHTML.replace(/<pre\b([^>]*)>[\s\S]*?<\/pre>/i, '<div$1>' + headerDoc + '</div>');
                    var body = document.getElementById('dl-panel-body');
                    body.outerHTML = body.outerHTML.replace(/<pre\b([^>]*)>[\s\S]*?<\/pre>/i, '<div$1>' + bodyDoc + '</div>');
                    downloadLinks.innerHTML = downloadLinks.innerHTML.replace(/Index\s+of/ig, "File in");
                    if (megabytes > 4000) downloadLinks.innerHTML = downloadLinks.innerHTML.replace(/panel-success/i, "panel-danger");
                    if (megabytes > 200) downloadLinks.innerHTML = downloadLinks.innerHTML.replace(/panel-success/i, "panel-warning");
                    var langSel = document.getElementById("langs");
                    //Set chosen value in language selector (really this is for return)
                    if (langSel) {
                        langs.value = lang;
                    }
                    //Add event listener for click on return link, to go back to list of archives
                    document.getElementById('returnLink').addEventListener('click', function (e) {
                        var langSel = document.getElementById("langs");
                        //var langID = langSel ? langSel.options[langSel.selectedIndex].value : "";
                        var langID = langSel ? langs.value : "";
                        langID = langID == "All" ? "" : langID;
                        requestDownloadLinks(this.dataset.kiwixDl, langID);
                    });
                    return;
                }
                //Remove images
                var doc = doc.replace(/<img\b[^>]*>\s*/ig, "");
                //Reduce size of header
                doc = doc.replace(/<h1\b([^>]*>[^<]*<\/)h1>/ig, "<h3$1h3>");
                //Limit height of pre box and prevent word wrapping
                doc = doc.replace(/<pre>/i, '<div class="panel panel-success">\r\n' +
                    '<pre id="dl-panel-heading" class="panel-heading" style="overflow-x: hidden; word-wrap: normal;">$#$#</pre>\r\n' +
                    '<pre id="dl-panel-body" class="panel panel-body" style="max-height:360px; word-wrap:normal; margin-bottom:10px; overflow: auto;">');
                //Remove hr at end of page and add extra </div>           
                doc = doc.replace(/<hr\b[^>]*>(\s*<\/pre>)/i, "$1</div>");
                //Move header into panel-header (NB regex is deliberately redundant to increase specificity of search)
                doc = doc.replace(/\$\#\$\#([\s\S]+?)(<a\s+href[^>]+>name<[\s\S]+?last\s+modified<[\s\S]+?)<hr>\s*/i, "$2$1");
                if (/\dK|\dM|\dG/.test(doc)) {
                    //Swap size and date fields to make file size more prominent on narrow screens
                    doc = doc.replace(/(<a\b[^>]*>last\s+modified<\/a>\s*)(<a\b[^>]*>size<\/a>\s*)/ig, "$2$1");
                    doc = doc.replace(/(\d\d-\w{3}-\d{4}\s\d\d\:\d\d\s+)(\d[\d.\w]+\s+)$/img, "$2$1");
                }
                if (/^[^_\n\r]+_([^_]+)_.+\.zim.+$/m.test(doc)) {
                    //Delete all lines without a wiki pattern from language list
                    var langList = doc.replace(/^(?![^_\n\r]+_(\w+)_.+$).*[\r\n]*/mg, "");
                    //Get list of all languages
                    langList = langList.replace(/^[^_]+_([^_]+)_.+$/mg, "$1");
                    //Delete recurrences
                    langList = langList.replace(/\b(\w+)\n(?=.*\b\1\n?)/mg, "");
                    langList = "All\n" + langList;
                    var langArray = langList.match(/^\w+$/mg);
                    if (langArray) {
                        var dropdown = '<select id="langs">\r\n';
                        for (var q = 0; q < langArray.length; q++) {
                            dropdown += '<option value="' + langArray[q] + '">' + langArray[q] + '</option>\r\n';
                        }
                        dropdown += '</select>\r\n';
                        doc = doc.replace(/<\/h3>/i, '</h3><p>Filter list by language code: ' + dropdown + '</p>');
                    }
                    //Add language spans to doc
                    doc = doc.replace(/^([^_\n\r]+_([^_]+)_.+\.zim.+)$[\n\r]*/img, '<span class="wikiLang" lang="$2">$1<br /></span>');
                }
                downloadLinks.innerHTML = doc;
                if (lang) {
                    var langEntries = document.querySelectorAll(".wikiLang");
                    //Hide all entries except specified language
                    for (i = 0; i < langEntries.length; i++) {
                        if (langEntries[i].lang != lang) langEntries[i].style.display = "none";
                    }
                    var langSel = document.getElementById("langs");
                    if (langSel) {
                        //var match = false;
                        //for (var i = 0; i = langSel.options.length; i++) {
                        //    if (langSel.options[i].value == lang) { match = true; break; }
                        //}
                        //if (match) langSel.options[i]
                        langs.value = lang;
                    }
                }
                if (typeof langArray !== "undefined") {
                    //Set up event listener for language selector
                    document.getElementById("langs").addEventListener("change", function () {
                        var langSel = document.getElementById("langs");
                        var langID = langSel ? langSel.options[langSel.selectedIndex].value : "";
                        var langEntries = document.querySelectorAll(".wikiLang");
                        //Hide all entries except specified language
                        for (i = 0; i < langEntries.length; i++) {
                            if (langEntries[i].lang == langID || langID == "All") langEntries[i].style.display = "inline";
                            if (langEntries[i].lang != langID && langID != "All") langEntries[i].style.display = "none";
                        }
                    });
                }
                var links = downloadLinks.getElementsByTagName("a");
                for (var i = 0; i < links.length; i++) {
                    //Store the href - seems it's not useful?
                    //links[i].setAttribute("data-kiwix-dl", links[i].href);
                    links[i].href = "#";
                    links[i].addEventListener('click', function () {
                        var langSel = document.getElementById("langs");
                        //var langID = langSel ? langSel.options[langSel.selectedIndex].value : "";
                        var langID = langSel ? langs.value : "";
                        var replaceURL = URL + this.text;
                        if (/\.zim$/i.test(this.text))
                            replaceURL = replaceURL + ".meta4";
                        if (/parent\s*directory/i.test(this.text))
                            replaceURL = URL.replace(/\/[^\/]*\/$/i, "\/");
                        requestDownloadLinks(replaceURL, langID);
                    });
                }
                //Toggle display of download panel -- bug: causes whole div to close if clicking on a link...
                //downloadLinks.style.display = downloadLinks.style.display == "none" ? "inline" : "none";
                downloadLinks.style.display = "inline";
            } else {
                serverResponse.innerHTML += ".";
            }
        };
        xhttp.open("GET", URL, true);
        xhttp.send();
    }


    /**
    * Functions and classes exposed by this module
    */
    return {
        langCodes: langCodes,
        requestDownloadLinks: requestDownloadLinks
    };
});