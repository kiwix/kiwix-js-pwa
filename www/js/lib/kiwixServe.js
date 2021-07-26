/**
 * kiwixServe.js: Provides an AJAX request process for contacting the Kiwix Download Server
 * and manipulating the returned data for display in-app
 * Also provides an object literal (langCodes) for looking up the English-language names of
 * language codesas defined in ISO 639-1, augmented with some ISO 639-3 codes as used by the
 * Kiwix server
 *
 * Copyright 2018 Jaifroid and contributors
 * License GPL v3:
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
        aa: 'Afar (Afar)',
        ab: 'Аҧсуа (Abkhazian)',
        af: 'Afrikaans (Afrikaans)',
        ak: 'Akana (Akan)',
        als: 'Alemannisch (Alemannic)',
        am: 'አማርኛ (Amharic)',
        an: 'Aragonés (Aragonese)',
        ang: 'Englisc (Anglo-Saxon / Old English)',
        ar: 'العربية (Arabic)',
        arc: 'ܣܘܪܬ (Aramaic)',
        as: 'অসমীয়া (Assamese)',
        ast: 'Asturianu (Asturian)',
        av: 'Авар (Avar)',
        ay: 'Aymar (Aymara)',
        az: 'Azərbaycanca / آذربايجان (Azerbaijani)',
        ba: 'Башҡорт (Bashkir)',
        ban: 'Bhāṣa Bali (Balinese)',
        bar: 'Boarisch (Bavarian)',
        batSmg: 'Žemaitėška (Samogitian)',
        sgs: 'Žemaitėška (Samogitian)',
        bcl: 'Bikol Central (Bikol)',
        be: 'Беларуская (Belarusian)',
        beXOld: 'Беларуская (тарашкевіца) (Belarusian (Taraškievica))',
        bg: 'Български (Bulgarian)',
        bh: 'भोजपुरी (Bihari)',
        bi: 'Bislama (Bislama)',
        bm: 'Bamanankan (Bambara)',
        bn: 'বাংলা (Bengali)',
        bo: 'བོད་ཡིག / Bod skad (Tibetan)',
        bpy: 'ইমার ঠার/বিষ্ণুপ্রিয়া মণিপুরী (Bishnupriya Manipuri)',
        br: 'Brezhoneg (Breton)',
        bs: 'Bosanski (Bosnian)',
        bug: 'ᨅᨔ ᨕᨘᨁᨗ / Basa Ugi (Buginese)',
        bxr: 'Буряад хэлэн (Buriat (Russia))',
        ca: 'Català (Catalan)',
        cdo: 'Mìng-dĕ̤ng-ngṳ̄ / 閩東語 (Min Dong Chinese)',
        ce: 'Нохчийн (Chechen)',
        ceb: 'Sinugboanong Binisaya (Cebuano)',
        ch: 'Chamoru (Chamorro)',
        cho: 'Choctaw (Choctaw)',
        chr: 'ᏣᎳᎩ (Cherokee)',
        chy: 'Tsetsêhestâhese (Cheyenne)',
        co: 'Corsu (Corsican)',
        cr: 'Nehiyaw (Cree)',
        cs: 'Česky (Czech)',
        csb: 'Kaszëbsczi (Kashubian)',
        cu: 'словѣньскъ / slověnĭskŭ (Old Church Slavonic)',
        cv: 'Чăваш (Chuvash)',
        cy: 'Cymraeg (Welsh)',
        da: 'Dansk (Danish)',
        de: 'Deutsch (German)',
        diq: 'Zazaki (Dimli)',
        dsb: 'Dolnoserbski (Lower Sorbian)',
        dv: 'ދިވެހިބަސް (Divehi)',
        dz: 'ཇོང་ཁ (Dzongkha)',
        ee: 'Ɛʋɛ (Ewe)',
        far: 'فارسی (Farsi)',
        el: 'Ελληνικά (Greek)',
        en: 'English (English)',
        eng: 'English (English)',
        eo: 'Esperanto (Esperanto)',
        es: 'Español (Spanish)',
        et: 'Eesti (Estonian)',
        eu: 'Euskara (Basque)',
        ext: 'Estremeñu (Extremaduran)',
        ff: 'Fulfulde (Peul)',
        fi: 'Suomi (Finnish)',
        fiuVro: 'Võro (Võro)',
        vro: 'Võro (Võro)',
        fj: 'Na Vosa Vakaviti (Fijian)',
        fo: 'Føroyskt (Faroese)',
        fr: 'Français (French)',
        frp: 'Arpitan/francoprovençal (Arpitan/Provençal)',
        fur: 'Furlan (Friulian)',
        fy: 'Frysk (West Frisian)',
        ga: 'Gaeilge (Irish)',
        gan: '贛語 (Gan Chinese)',
        gbm: 'गढ़वळी (Garhwali)',
        gd: 'Gàidhlig (Scottish Gaelic)',
        gil: 'Taetae ni kiribati (Gilbertese)',
        gl: 'Galego (Galician)',
        gn: 'Avañe’ẽ (Guarani)',
        got: 'gutisk (Gothic)',
        gu: 'ગુજરાતી (Gujarati)',
        gv: 'Gaelg (Manx)',
        ha: 'هَوُسَ (Hausa)',
        hak: '客家語/Hak-kâ-ngî (Hakka Chinese)',
        haw: 'Hawai`i (Hawaiian)',
        he: 'עברית (Hebrew)',
        hi: 'हिन्दी (Hindi)',
        ho: 'Hiri Motu (Hiri Motu)',
        hr: 'Hrvatski (Croatian)',
        ht: 'Krèyol ayisyen (Haitian)',
        hu: 'Magyar (Hungarian)',
        hy: 'Հայերեն (Armenian)',
        hz: 'Otsiherero (Herero)',
        ia: 'Interlingua (Interlingua)',
        id: 'Bahasa Indonesia (Indonesian)',
        ie: 'Interlingue (Interlingue)',
        ig: 'Igbo (Igbo)',
        ii: 'ꆇꉙ / 四川彝语 (Sichuan Yi)',
        ik: 'Iñupiak (Inupiak)',
        ilo: 'Ilokano (Ilokano)',
        io: 'Ido (Ido)',
        is: 'Íslenska (Icelandic)',
        it: 'Italiano (Italian)',
        iu: 'ᐃᓄᒃᑎᑐᑦ (Inuktitut)',
        ja: '日本語 (Japanese)',
        jbo: 'Lojban (Lojban)',
        jv: 'Basa Jawa (Javanese)',
        ka: 'ქართული (Georgian)',
        kg: 'KiKongo (Kongo)',
        ki: 'Gĩkũyũ (Kikuyu)',
        kj: 'Kuanyama (Kuanyama)',
        kk: 'Қазақша (Kazakh)',
        kl: 'Kalaallisut (Greenlandic)',
        km: 'ភាសាខ្មែរ (Cambodian)',
        kn: 'ಕನ್ನಡ (Kannada)',
        khw: 'کھوار (Khowar)',
        ko: '한국어 (Korean)',
        kr: 'Kanuri (Kanuri)',
        ks: 'कश्मीरी / كشميري (Kashmiri)',
        ksh: 'Ripoarisch (Ripuarian)',
        ku: 'Kurdî / كوردی (Kurdish)',
        kv: 'Коми (Komi)',
        kw: 'Kernewek (Cornish)',
        ky: 'Kırgızca / Кыргызча (Kirghiz)',
        la: 'Latina (Latin)',
        lad: 'Dzhudezmo / Djudeo-Espanyol (Ladino)',
        lan: 'Leb Lango / Luo (Lango)',
        lb: 'Lëtzebuergesch (Luxembourgish)',
        lg: 'Luganda (Ganda)',
        li: 'Limburgs (Limburgian)',
        lij: 'Líguru (Ligurian)',
        lmo: 'Lumbaart (Lombard)',
        ln: 'Lingála (Lingala)',
        lo: 'ລາວ / Pha xa lao (Laotian)',
        lt: 'Lietuvių (Lithuanian)',
        lv: 'Latviešu (Latvian)',
        mapBms: 'Basa Banyumasan (Banyumasan)',
        mg: 'Malagasy (Malagasy)',
        man: '官話/官话 (Mandarin)',
        mh: 'Kajin Majel / Ebon (Marshallese)',
        mi: 'Māori (Maori)',
        min: 'Minangkabau (Minangkabau)',
        mk: 'Македонски (Macedonian)',
        ml: 'മലയാളം (Malayalam)',
        mn: 'Монгол (Mongolian)',
        mo: 'Moldovenească (Moldovan)',
        mr: 'मराठी (Marathi)',
        ms: 'Bahasa Melayu (Malay)',
        mt: 'bil-Malti (Maltese)',
        mus: 'Mvskoke (Creek / Muskogee)',
        mwl: 'Mirandés (Mirandese)',
        my: 'Myanmasa (Burmese)',
        na: 'Dorerin Naoero (Nauruan)',
        nah: 'Nahuatl (Nahuatl)',
        nap: 'Nnapulitano (Neapolitan)',
        nd: 'Sindebele (North Ndebele)',
        nds: 'Plattdüütsch (Low German / Low Saxon)',
        ndsNl: 'Nedersaksisch (Dutch Low Saxon)',
        ne: 'नेपाली (Nepali)',
        new: 'नेपालभाषा / Newah Bhaye (Newar)',
        ng: 'Oshiwambo (Ndonga)',
        nl: 'Nederlands (Dutch)',
        nn: 'Norsk (nynorsk) (Norwegian Nynorsk)',
        no: 'Norsk (bokmål / riksmål) (Norwegian)',
        nr: 'isiNdebele (South Ndebele)',
        nso: 'Sesotho sa Leboa / Sepedi (Northern Sotho)',
        nrm: 'Nouormand / Normaund (Norman)',
        nv: 'Diné bizaad (Navajo)',
        ny: 'Chi-Chewa (Chichewa)',
        oc: 'Occitan (Occitan)',
        oj: 'ᐊᓂᔑᓈᐯᒧᐎᓐ / Anishinaabemowin (Ojibwa)',
        om: 'Oromoo (Oromo)',
        or: 'ଓଡ଼ିଆ (Oriya)',
        os: 'Иронау (Ossetian / Ossetic)',
        pa: 'ਪੰਜਾਬੀ / पंजाबी / پنجابي (Panjabi / Punjabi)',
        pag: 'Pangasinan (Pangasinan)',
        pam: 'Kapampangan (Kapampangan)',
        pap: 'Papiamentu (Papiamentu)',
        pdc: 'Deitsch (Pennsylvania German)',
        pi: 'Pāli / पाऴि (Pali)',
        pih: 'Norfuk (Norfolk)',
        pl: 'Polski (Polish)',
        pms: 'Piemontèis (Piedmontese)',
        ps: 'پښتو (Pashto)',
        pt: 'Português (Portuguese)',
        ptbr: 'Português brasileiro (Brazilian Portuguese)',
        qu: 'Runa Simi (Quechua)',
        rm: 'Rumantsch (Raeto Romance)',
        rmy: 'Romani / रोमानी (Romani)',
        rn: 'Kirundi (Kirundi)',
        ro: 'Română (Romanian)',
        roaRup: 'Armâneashti (Aromanian)',
        rup: 'Armâneashti (Aromanian)',
        ru: 'Русский (Russian)',
        rw: 'Kinyarwandi (Rwandi)',
        sa: 'संस्कृतम् (Sanskrit)',
        sc: 'Sardu (Sardinian)',
        scn: 'Sicilianu (Sicilian)',
        sco: 'Scots (Scots)',
        sd: 'सिनधि (Sindhi)',
        se: 'Davvisámegiella (Northern Sami)',
        sg: 'Sängö (Sango)',
        sh: 'Srpskohrvatski/Српскохрватски (Serbo-Croatian)',
        si: 'සිංහල (Sinhalese)',
        simple: 'Simple English (Simple English)',
        sk: 'Slovenčina (Slovak)',
        sl: 'Slovenščina (Slovenian)',
        sm: 'Gagana Samoa (Samoan)',
        sn: 'chiShona (Shona)',
        so: 'Soomaaliga (Somalia)',
        sq: 'Shqip (Albanian)',
        sr: 'Српски (Serbian)',
        ss: 'SiSwati (Swati)',
        st: 'Sesotho (Southern Sotho)',
        su: 'Basa Sunda (Sundanese)',
        sv: 'Svenska (Swedish)',
        sw: 'Kiswahili (Swahili)',
        ta: 'தமிழ் (Tamil)',
        te: 'తెలుగు (Telugu)',
        tet: 'Tetun (Tetum)',
        tg: 'Тоҷикӣ (Tajik)',
        th: 'ไทย / Phasa Thai (Thai)',
        ti: 'ትግርኛ (Tigrinya)',
        tk: 'Туркмен / تركمن (Turkmen)',
        tl: 'Tagalog (Tagalog)',
        tlh: 'tlhIngan-Hol (Klingon)',
        tn: 'Setswana (Tswana)',
        to: 'Lea Faka-Tonga (Tonga)',
        tpi: 'Tok Pisin (Tok Pisin)',
        tr: 'Türkçe (Turkish)',
        ts: 'Xitsonga (Tsonga)',
        tt: 'Tatarça (Tatar)',
        tum: 'chiTumbuka (Tumbuka)',
        tw: 'Twi (Twi)',
        ty: 'Reo Mā`ohi (Tahitian)',
        udm: 'Удмурт кыл (Udmurt)',
        ug: 'Uyƣurqə / ئۇيغۇرچە (Uyghur)',
        uk: 'Українська (Ukrainian)',
        ur: 'اردو (Urdu)',
        uz: 'Ўзбек (Uzbek)',
        ve: 'Tshivenḓa (Venda)',
        vi: 'Việtnam (Vietnamese)',
        vec: 'Vèneto (Venetian)',
        vls: 'West-Vlaoms (West Flemish)',
        vo: 'Volapük (Volapük)',
        wa: 'Walon (Walloon)',
        war: 'Winaray / Binisaya Lineyte-Samarnon (Waray)',
        wo: 'Wollof (Wolof)',
        xal: 'Хальмг (Kalmyk)',
        xh: 'isiXhosa (Xhosa)',
        yi: 'ייִדיש (Yiddish)',
        yo: 'Yorùbá (Yoruba)',
        za: 'Cuengh / Tôô / 壮语 (Zhuang)',
        zh: '中文 (Chinese)',
        lzh: '文言 (Classical Chinese)',
        zhClassical: '文言 (Classical Chinese)',
        nan: 'Bân-lâm-gú (Minnan)',
        yue: '粵語 / 粤语 (Cantonese)',
        zu: 'isiZulu (Zulu)',
        ace: 'Achinese',
        ady: 'Adyghe-Adygei',
        arz: 'Egyptian Arabic',
        atj: 'Atikamekw',
        azb: 'South Azerbaijani',
        bho: 'Bhojpuri',
        bjn: 'Banjar',
        ckb: 'Central Kurdish',
        din: 'Dinka',
        dty: 'Dotyali',
        eml: 'Emilian-Romagnol',
        fa: 'Persian (Farsi)',
        frr: 'Northern Frisian',
        gag: 'Gagauz',
        glk: 'Gilaki',
        gom: 'Goan Konkani',
        gsw: 'Swiss German-Alemannic-Alsatian',
        hif: 'Fiji Hindi',
        hsb: 'Upper Sorbian',
        jam: 'Jamaican Creole English',
        kaa: 'Kara-Kalpak',
        kab: 'Kabyle',
        kbd: 'Kabardian',
        kbp: 'Kabiyè',
        koi: 'Komi-Permyak',
        krc: 'Karachay-Balkar',
        lbe: 'Lak',
        lez: 'Lezghian',
        lrc: 'Northern Luri',
        ltg: 'Latgalian',
        mai: 'Maithili',
        mdf: 'Moksha',
        mhr: 'Eastern Mari',
        mrj: 'Western Mari',
        myv: 'Erzya',
        mzn: 'Mazanderani',
        nb: 'Norwegian bokmål',
        nov: 'Novial',
        olo: 'Livvi',
        pcd: 'Picard',
        pfl: 'Pfaelzisch',
        pnb: 'Western Panjabi',
        pnt: 'Pontic',
        rue: 'Rusyn',
        sah: 'Yakut',
        srn: 'Sranan Tongo',
        stq: 'Saterfriesisch',
        szl: 'Silesian',
        tcy: 'Tulu',
        tyv: 'Tuvinian',
        vep: 'Veps',
        wuu: 'Wu Chinese',
        xmf: 'Mingrelian',
        zea: 'Zeeuws'
    };

    var downloadLinks = document.getElementById('downloadLinks');
    var serverResponse = document.getElementById('serverResponse');
    
    // DEV: If you support more packaged files, add to this list
    var regexpFilter = /_medicine/.test(params.packagedFile) ? /^(?!.+_medicine_)[^_\n\r]+_([^_\n\r]+)_.+\.zi[mp].+$\s+/mig : null;
    regexpFilter = /wikivoyage/.test(params.packagedFile) ? /^(?!.+wikivoyage_)[^_\n\r]+_([^_\n\r]+)_.+\.zi[mp].+$\s+/mig : regexpFilter;
    
    function requestXhttpData(URL, lang, subj, kiwixDate) {
        if (!params.allowInternetAccess) {
            document.getElementById('serverResponse').innerHTML = "Blocked: select 'Allow Internet access'";
            document.getElementById('serverResponse').style.display = "inline";
            return;
        }
        if (!URL) {
            document.getElementById('serverResponse').innerHTML = "Unrecognized filetype, please try different link";
            document.getElementById('serverResponse').style.display = "inline";
            return;
        }
        var xhttp = new XMLHttpRequest();
        //DEV: timeout set here to 20s (except for meta4 links); if this isn't long enough for your target countries, increase
        var timeout = /\.meta4$/i.test(URL) ? 6000 : 20000;
        var xhttpTimeout = setTimeout(ajaxTimeout, timeout);
        function ajaxTimeout() {
            xhttp.abort();
            var responseMessageBox = document.getElementById('serverResponse');
            responseMessageBox.innerHTML = "Connection attempt timed out (failed)";
            if (/https?:|file:/.test(window.location.protocol)) responseMessageBox.innerHTML = "Browser's CORS Policy disallowed access!";
            if (/\.meta4$/i.test(URL)) responseMessageBox.innerHTML = "Archive descriptor xml file (meta4) is missing!";
            document.getElementById('serverResponse').style.display = "inline";
            serverError(URL);
            return;
        }
        xhttp.onreadystatechange = function () {
            serverResponse.innerHTML = "Server response: 0 Waiting...";
            serverResponse.style.display = "inline";
            if (this.readyState == 4) {
                serverResponse.innerHTML = "Server response: " + this.status + " " + this.statusText + " Waiting....";
                if (this.status == 200) {
                    clearTimeout(xhttpTimeout);
                    serverResponse.innerHTML = "Server response: " + this.status + " " + this.statusText + " (data received)";
                    if (/\.meta4$/i.test(URL)) {
                        processMetaLink(this.responseText);
                    } else {
                        processXhttpData(this.responseText);
                    }
                } else if (this.status == 0 && window.location.protocol == "file:") {
                    document.getElementById('serverResponse').innerHTML = 'Cannot use XMLHttpRequest with file:// protocol';
                    document.getElementById('serverResponse').style.display = "inline";
                    serverError();
                    return;
                }
            } else {
                serverResponse.innerHTML = "Server response: " + this.status + "/" + this.readyState + " " + this.statusText + " Waiting...";
            }
        };
        xhttp.open("GET", URL, true);
        xhttp.send(null);

        function serverError(URL) {
            var requestedURL, altURL, torrentURL;
            if (/\.meta4$/i.test(URL)) {
                requestedURL = URL.replace(/\.meta4$/i, '');
                altURL = /wikipedia|wikisource|wikivoyage|wiktionary/i.test(URL) ? 
                    requestedURL.replace(/(download\.kiwix\.org)/i, 'www.mirrorservice.org/sites/$1') : '';
                torrentURL = URL.replace(/\.meta4$/i, '.torrent');
                var header = document.getElementById('dl-panel-heading');
                var headerDoc = 'There is a server issue, but please try the following links to your file:';
                header.outerHTML = header.outerHTML.replace(/<pre\b([^>]*)>[\s\S]*?<\/pre>/i, '<div$1>' + headerDoc + '</div>');
                var body = document.getElementById('dl-panel-body');
                var bodyDoc = '<p><b>Directly download ZIM archive:</b></p>' + 
                '<p><a href="' + requestedURL + '" target="_blank">' + requestedURL + '</a></p>' +
                (altURL ? '<p><b>Possible mirror:</b></p>' + 
                '<p><a href="' + altURL + '" target="_blank">' + altURL + '</a></p>' : '') +
                '<p><b>Download with bittorrent:</b></p>' + 
                '<p><a href="' + torrentURL + '" target="_blank">' + torrentURL + '</a></p>';
                body.outerHTML = body.outerHTML.replace(/<pre\b([^>]*)>[\s\S]*?<\/pre>/i, '<pre$1>' + bodyDoc + '</pre>');
                downloadLinks.innerHTML = downloadLinks.innerHTML.replace(/Index\s+of/ig, "File in");
                downloadLinks.innerHTML = downloadLinks.innerHTML.replace(/panel-success/i, "panel-warning");
            } else {
                downloadLinks.innerHTML = '<span style="font-weight:bold;font-family:consolas,monospace;">' +
                    '<p style="color:salmon;">Unable to access the server. Please see message below for reason.</p>' +
                    '<p>You can either try again or else open this link in a new browser window:<br />' +
                    '<a href="' + params.kiwixDownloadLink + '" target="_blank">' + params.kiwixDownloadLink + '</a></p><br /></span>';
            }
            downloadLinks.style.display = "block";
        }

        function processMetaLink(doc) {
            //It's the metalink with download links
            var linkArray = doc.match(/<url\b[^>]*>[^<]*<\/url>/ig);
            var size = doc.match(/<size>(\d+)<\/size>/i);
            //Filter value (add comma separators if required)
            size = size.length ? size[1] : "";
            var megabytes = size ? Math.round(size * 10 / (1024 * 1024)) / 10 : size;
            //Use the lookbehind reversal trick to add commas....
            size = size.toString().split('').reverse().join('').replace(/(\d{3}(?!.*\.|$))/g, '$1,').split('').reverse().join('');
            var megabytes$ = megabytes.toString().split('').reverse().join('').replace(/(\d{3}(?!.*\.|$))/g, '$1,').split('').reverse().join('');
            doc = "";
            //var mirrorservice = false;
            for (var i = 1; i < linkArray.length; i++) { //NB we'ere intentionally discarding first link to kiwix.org (not to zim)
                //DEV: Mirrorservice download bug now fixed [kiwix-js-windows #28] @TODO: remove this after period of stable downloads fully tested
                //ZIP files work fine with mirrorservice, so test for ZIM type only
                //if (/\.zim\.meta4$/i.test(URL) && /mirrorservice\.org/i.test(linkArray[i])) {
                //    mirrorservice = true;
                //    doc += linkArray[i].replace(/<url\b[^>]*>([^<]*)<\/url>/i, '<li>*** Server has download bug, see note ***<br />$1</li>\r\n');
                //} else {
                    doc += linkArray[i].replace(/<url\b[^>]*>([^<]*)<\/url>/i, '<li><a href="$1" target="_blank">$1</a></li>\r\n');
                //}
            }
            var headerDoc = 'We found the following links to your file:';
            var bodyDoc = '<p><a id="returnLink" href="#" data-kiwix-dl="' + URL.replace(/\/[^\/]*\.meta4$/i, "\/") + '">&lt;&lt; Back to list of files</a></p>\r\n';
            bodyDoc += /\/ted\//i.test(URL) ? '<h4 style="color:red">IMPORTANT: <b>TED TALKS</b> videos can be played in the UWP app on Windows 10, but on Windows 10 Mobile you may need to play the videos with an external app such as VLC Media Player (from the Store).</h4>\r\n<p>Please note if you cannot switch to Service Worker mode (see Configuration - Expert Settings) you will need to search for the talks using standard ZIM search or by typing a space in search to show the ZIM Archive Index, because the ZIM\'s proprietary UI does not work in JQuery mode.' : ''; 
            bodyDoc += /\/gutenberg\//i.test(URL) ? '<p>You can read Gutenberg books in this app, but please note that if you cannot switch to Service Worker mode (see Configuration - Expert Settings) you will need to search for books using standard or wildcard ZIM search (e.g. \'.*quixote\') or by typing a space in search to show the ZIM Archive Index, because the ZIM\'s proprietary UI does not work in JQuery mode.' : ''; 
            bodyDoc += "<h5";
            bodyDoc += megabytes > 2000 ? ' style="color:red;"> WARNING: ' : '>';
            bodyDoc += 'File size is <b>' + (megabytes ? megabytes$ + 'MB' : 'unknown') + '</b>' + (size ? ' (' + size + ' bytes)' : '') + '</h5>\r\n';
            if (megabytes > 200) bodyDoc += '<p><b>Consider using BitTorrent to download file:</b></p>\r\n' + 
                '<p><b>BitTorrent link</b>: <a href="' + URL.replace(/\.meta4$/, ".torrent") + '" target="_blank">' +
                URL.replace(/\.meta4$/, ".torrent") + '</a></p>';
            if (megabytes > 4000 && /\.zim\.meta4$/i.test(URL)) {
                bodyDoc += '<p style="color:red;">This archive is larger than the maximum file size permitted on an SD card formatted as FAT32 (max size is approx. 4GB). On Windows, this is not normally a problem. However, if your card or other storage area is formatted in this way, you will need to download the file on a PC and split it into chunks less than 4GB: see <a href="https://github.com/kiwix/kiwix-js-windows/tree/master/AppPackages#download-a-zim-archive-all-platforms" target="_blank">Download a ZIM archive</a>.</p>\r\n';
                // bodyDoc += '<p><b>To browse for a split version of this archive click here: <a id="portable" href="#" data-kiwix-dl="' +
                //    URL.replace(/\/zim\/([^/]+\/).*$/m, "/portable/$1") + '">' + URL.replace(/\/zim\/([^/]+\/).*$/m, "/portable/$1") +
                //    '</a>.</b></p>\r\n';
            }
            if (/\.zip\.meta4$/i.test(URL)) {
                if (megabytes > 4000) bodyDoc += '<p style="color:red;">This ZIP file contains a split version of the archive, but the ZIP itself is larger than the maximum file size permitted on an SD card formatted as FAT32. Be sure to save it in a non-FAT32 location (e.g. a PC hard drive).</p>\r\n';
                bodyDoc += '<p>INSTRUCTIONS: You may need to open this ZIP file on a regular computer. After you have downloaded it, open the ZIP in\r\n' +
                    'File Explorer. You will need to extract the contents of the folder <span style="font-family: monospace;"><b>&gt; data &gt; content</b></span>,\r\n' +
                    'and transfer ALL of the files there to an accessible folder on your device. After that, you can search for the folder in this app (see above).</p>\r\n';
            }
            bodyDoc += '<p><i>Links will open in a new browser window</i></p><ol>\r\n' + doc + '</ol>\r\n';
            //if (mirrorservice) bodyDoc += '*** Note: mirrorservice.org currently has a download bug with ZIM archives: on some browsers it will download the ZIM file as plain text in browser window';
            bodyDoc += '<br /><br />';
            var header = document.getElementById('dl-panel-heading');
            header.outerHTML = header.outerHTML.replace(/<pre\b([^>]*)>[\s\S]*?<\/pre>/i, '<div$1>' + headerDoc + '</div>');
            var body = document.getElementById('dl-panel-body');
            body.outerHTML = body.outerHTML.replace(/<pre\b([^>]*)>[\s\S]*?<\/pre>/i, '<div$1>' + bodyDoc + '</div>');
            downloadLinks.innerHTML = downloadLinks.innerHTML.replace(/Index\s+of/ig, "File in");
            if (megabytes > 4000) downloadLinks.innerHTML = downloadLinks.innerHTML.replace(/panel-success/i, "panel-danger");
            if (megabytes > 2000) downloadLinks.innerHTML = downloadLinks.innerHTML.replace(/panel-success/i, "panel-warning");
            var langSel = document.getElementById('langs');
            var subjSel = document.getElementById('subjects');
            var dateSel = document.getElementById('dates');
            var submitSelectValues = function () {
                var langID = langSel ? langSel.value === 'All' ? '' : langSel.value : '';
                var subjID = subjSel ? subjSel.value === 'All' ? '' : subjSel.value : '';
                var dateID = dateSel ? dateSel.value === 'All' ? '' : dateSel.value : '';
                requestXhttpData(this.dataset.kiwixDl, langID, subjID, dateID);
            };
            //Add event listener for click on return link, to go back to list of archives
            document.getElementById('returnLink').addEventListener('click', submitSelectValues);
            //Add event listener for split archive link, if necessary
            if (megabytes > 4000 && /\.zim\.meta4$/i.test(URL)) {
                document.getElementById('portable').addEventListener('click', submitSelectValues);
            }
        }

        function processXhttpData(doc) {
            //Remove images
            doc = doc.replace(/<img\b[^>]*>\s*/ig, "");
            //Reduce size of header
            doc = doc.replace(/<h1\b[^>]*>([^<]*)<\/h1>/ig, '<h3 id="indexHeader">$1</h3>');
            //Limit height of pre box and prevent word wrapping
            doc = doc.replace(/<pre>/i, '<div class="panel panel-success">\r\n' +
                '<pre id="dl-panel-heading" class="panel-heading" style="overflow-x:auto;word-wrap:normal;">$#$#</pre>\r\n' +
                '<pre id="dl-panel-body" class="panel panel-body" style="max-height:360px;word-wrap:normal;margin-bottom:10px;overflow:auto;">');
            //Remove hr at end of page and add extra </div>           
            doc = doc.replace(/<hr\b[^>]*>(\s*<\/pre>)/i, "$1</div>");
            //Move header into panel-header (NB regex is deliberately redundant to increase specificity of search)
            doc = doc.replace(/\$\#\$\#([\s\S]+?)(<a\s+href[^>]+>name<[\s\S]+?last\s+modified<[\s\S]+?)<hr>\s*/i, "$2$1");
            if (/\dK|\dM|\dG/.test(doc)) {
                //Swap size and date fields to make file size more prominent on narrow screens
                doc = doc.replace(/(<a\b[^>]*>last\s+modified<\/a>\s*)(<a\b[^>]*>size<\/a>)\s*/ig, " $2    $1");
                doc = doc.replace(/(\d{4}-\d\d-\d\d\s\d\d\:\d\d)\s\s([\s\d.\w-]{7})$/img, " $2 $1");
            }
            var stDoc; // Placeholder for standardized doc to be used to get arrays
            if (/^[^_\n\r]+_([^_\n\r]+)_.+\.zi[mp].+$/m.test(doc)) {
                //Delete lines that do not match regexpFilter (this ensures packaged apps only show ZIMs appropriate to the package)
                doc = regexpFilter ? doc.replace(regexpFilter, "") : doc;
                stDoc = getStandardizedDoc(doc);

                //Get language and date arrays
                var langArray = getLangArray(stDoc);
                var subjectArray = getSubjectArray(stDoc);
                var dateArray = getDateArray(stDoc);

                //Create dropdown language and date selectors
                if (langArray) {
                    var dropdownLang = '<select class="dropdown" id="langs">\r\n';
                    for (var q = 0; q < langArray.length; q++) {
                        dropdownLang += '<option value="' + langArray[q] + '">' +
                            (langCodes[langArray[q]] ? langArray[q] + ' :  ' + langCodes[langArray[q]] : langArray[q]) +
                            '</option>\r\n';
                    }
                    dropdownLang += '</select>\r\n';
                }
                if (subjectArray) {
                    var dropdownSubj = '<select class="dropdown" id="subjects">\r\n';
                    for (var r = 0; r < subjectArray.length; r++) {
                        dropdownSubj += '<option value="' + subjectArray[r] + '">' +
                            subjectArray[r] + '</option>\r\n';
                    }
                    dropdownSubj += '</select>\r\n';
                }
                if (dateArray) {
                    var dropdownDate = '<select class="dropdown" id="dates">\r\n';
                    for (var s = 0; s < dateArray.length; s++) {
                        dropdownDate += '<option value="' + dateArray[s] + '">' +
                            dateArray[s] + '</option>\r\n';
                    }
                    dropdownDate += '</select>\r\n';
                }
                //Add language, subject and date spans to doc
                if (/^(?:[^._]+\.stack(?:exchange|overflow)|askubuntu|stackapps|stackoverflow|superuser|serverfault)/mi.test(doc)) {
                    doc = doc.replace(/^([^>\n\r]+>(?:.+(stackoverflow)|([^.\n\r]+))\.([^_\n\r]+)_([^_\n\r]+)_.*?(\d[\d-]+)\.zi[mp].+)$[\n\r]*/img, '<span class="wikiLang" lang="$5" data-kiwixsubject="$2$3" data-kiwixdate="$6">$1<br /></span>');
                } else {
                    doc = doc.replace(/^([^_\n\r]+_([^_\n\r]+)_((?:[^_]|_(?!maxi|mini|nopic|\d\d\d\d))+)_.*?(\d[\d-]+)\.zi[mp].+)$[\n\r]*/img, '<span class="wikiLang" lang="$2" data-kiwixsubject="$3" data-kiwixdate="$4">$1<br /></span>');
                }
                // Normalize languages with a - (from Stackexchange)
                doc = doc.replace(/(lang="\w+)-(\w+")/, '$1$2');
                doc = dropdownDate ? doc.replace(/<\/h3>/i, '</h3>' + (dropdownLang || dropdownSubj ? '' : '\r\n<div class="row">\r\n') + '<div class="col-xs-4">Date:&nbsp;&nbsp;' + dropdownDate + '</div>\r\n</div>\r\n') : doc;
                doc = dropdownSubj ? doc.replace(/<\/h3>/i, '</h3>' + (dropdownLang ? '' : '\r\n<div class="row">\r\n') + '<div class="col-xs-4">Subject:&nbsp;&nbsp;' + dropdownSubj + '</div>\r\n' + (dropdownDate ? '' : '</div>\r\n')) : doc;
                doc = dropdownLang ? doc.replace(/<\/h3>/i, '</h3>\r\n<div class="row">\r\n<div class="col-xs-4">Language:&nbsp;&nbsp;' + dropdownLang + '</div>\r\n' + (dropdownSubj || dropdownDate ? '' : '</div>\r\n')) : doc;
            }
            downloadLinks.innerHTML = doc;
            var langSel = document.getElementById('langs');
            var subjSel = document.getElementById('subjects');
            var dateSel = document.getElementById('dates');
            var langPanel = document.getElementById('dl-panel-body');    
            if (lang || subj || kiwixDate) {
                var selectEntries = document.querySelectorAll('.wikiLang');
                //Hide all entries except specified language, subject, or date
                for (var i = 0; i < selectEntries.length; i++) {
                    if (lang && lang !== 'All' && selectEntries[i].lang !== lang) selectEntries[i].style.display = 'none';
                    if (subj && subj !== 'All' && selectEntries[i].dataset.kiwixsubject !== subj) selectEntries[i].style.display = 'none';
                    if (kiwixDate && kiwixDate !== 'All' && selectEntries[i].dataset.kiwixdate !== kiwixDate) selectEntries[i].style.display = 'none';
                }
                if (langSel) langSel.value = lang || 'All';
                if (subjSel) subjSel.value = subj || 'All';
                if (dateSel) dateSel.value = kiwixDate || 'All';
            }
            if (langArray && langSel) {
                //Set up event listener for language selector
                langSel.addEventListener("change", function () {
                    var dateID = dateSel ? dateSel.options[dateSel.selectedIndex].value : '';
                    var subjID = subjSel ? subjSel.options[subjSel.selectedIndex].value : '';
                    var langID = langSel ? langSel.options[langSel.selectedIndex].value : '';
                    //Reset any hidden entries
                    //langPanel.innerHTML = langPanel.innerHTML.replace(/(display:\s*)none\b/mig, 'inline');
                    var langEntries = langPanel.querySelectorAll(".wikiLang");
                    //Hide all entries except specified language
                    if (langID) {
                        for (var i = 0; i < langEntries.length; i++) {
                            if (langEntries[i].lang == langID || langID == "All") langEntries[i].style.display = "inline";
                            if (langEntries[i].lang != langID && langID != "All") langEntries[i].style.display = "none";
                            if (subjID && langEntries[i].dataset.kiwixsubject !== subjID && subjID !== "All") langEntries[i].style.display = "none";
                            if (dateID && langEntries[i].dataset.kiwixdate !== dateID && dateID !== "All") langEntries[i].style.display = "none";
                        }
                        // Prune date list
                        if (dateID === 'All') {
                            var dateList = dateArray.join('\r\n');
                            dateList = dateList.replace(/^(.*)[\r\n]*/mg, function (p0, p1) {
                                // DEV: innerText doesn't include hidden items
                                if (p1 !== 'All' && !~langPanel.innerText.indexOf('_' + p1)) return '';
                                return '<option value="' + p1 + '"' + (dateID === p1 ? ' selected' : '') + '>' + p1 + '</option>';
                            });
                            dateSel.innerHTML = dateList;
                        }
                        // Prune subject list
                        if (subjID === 'All') {
                            var subjList = subjectArray.join('\r\n');
                            subjList = subjList.replace(/^(.*)[\r\n]*/mg, function (p0, p1) {
                                // DEV: innerText doesn't include hidden items
                                var rgxSubject = new RegExp('_?' + p1 + '[._]', 'i');
                                if (p1 !== 'All' && !rgxSubject.test(langPanel.innerText)) return '';
                                return '<option value="' + p1 + '"' + (subjID === p1 ? ' selected' : '') + '>' + p1 + '</option>';
                            });
                            subjSel.innerHTML = subjList;
                        }
                        // Rebuild lang selector
                        var langList = langArray.join('\r\n');
                        langList = langList.replace(/^(.*)[\r\n]*/mg, function (p0, p1) {
                            return '<option value="' + p1 + '"' + (langID === p1 ? ' selected' : '') + '>' + p1 + (p1 === 'All' ? '' : ' : ' + langCodes[p1]) + '</option>';
                        });
                        langSel.innerHTML = langList;
                    }
                });
            }
            if (subjectArray && subjSel) {
                //Set up event listener for subject selector
                subjSel.addEventListener("change", function () {
                    var langID = langSel ? langSel.options[langSel.selectedIndex].value : '';
                    var subjID = subjSel ? subjSel.options[subjSel.selectedIndex].value : '';
                    var dateID = dateSel ? dateSel.options[dateSel.selectedIndex].value : '';
                    var subjEntries = document.querySelectorAll(".wikiLang");
                    //Hide all entries except specified subject
                    if (subjID) {
                        for (var i = 0; i < subjEntries.length; i++) {
                            if (subjEntries[i].dataset.kiwixsubject === subjID || subjID === "All") subjEntries[i].style.display = "inline";
                            if (subjEntries[i].dataset.kiwixsubject !== subjID && subjID !== "All") subjEntries[i].style.display = "none";
                            if (langID && subjEntries[i].lang !== langID && langID !== "All") subjEntries[i].style.display = "none";
                            if (dateID && subjEntries[i].dataset.kiwixdate !== dateID && dateID !== "All") subjEntries[i].style.display = "none";
                        }
                        // Prune the language list
                        if (langID === 'All') {
                            var langList = langArray.join('\r\n');
                            // We need to normalize language codes in langPanel (for Stackexchange)
                            // DEV: innerText doesn't include hidden items
                            var langTestPanel = langPanel.innerText.replace(/(_\w+)-(\w+_)/, '$1$2');
                            langList = langList.replace(/^(.*)[\r\n]*/mg, function (p0, p1) {
                                if (p1 !== 'All' && !~langTestPanel.indexOf('_' + p1 + '_')) return '';
                                return '<option value="' + p1 + '"' + (langID === p1 ? ' selected' : '' ) + '>' + p1 + (p1 === 'All' ? '' : ' : ' + langCodes[p1]) + '</option>';
                            });
                            langSel.innerHTML = langList;
                        }
                        // Prune date list
                        if (dateID === 'All') {
                            var dateList = dateArray.join('\r\n');
                            dateList = dateList.replace(/^(.*)[\r\n]*/mg, function (p0, p1) {
                                // DEV: innerText doesn't include hidden items
                                if (p1 !== 'All' && !~langPanel.innerText.indexOf('_' + p1)) return '';
                                return '<option value="' + p1 + '"' + (dateID === p1 ? ' selected' : '') + '>' + p1 + '</option>';
                            });
                            dateSel.innerHTML = dateList;
                        }
                        // Rebuild subject selector
                        var subjList = subjectArray.join('\r\n');
                        subjList = subjList.replace(/^(.*)[\r\n]*/mg, function (p0, p1) {
                            return '<option value="' + p1 + '"' + (subjID === p1 ? ' selected' : '') + '>' + p1 + '</option>';
                        });
                        subjSel.innerHTML = subjList;
                    }
                });
            }
            if (dateArray && dateSel) {
                //Set up event listener for date selector
                dateSel.addEventListener("change", function () {
                    var langID = langSel ? langSel.options[langSel.selectedIndex].value : '';
                    var subjID = subjSel ? subjSel.options[subjSel.selectedIndex].value : '';
                    var dateID = dateSel ? dateSel.options[dateSel.selectedIndex].value : '';
                    var dateEntries = document.querySelectorAll(".wikiLang");
                    //Hide all entries except specified date
                    if (dateID) {
                        for (var i = 0; i < dateEntries.length; i++) {
                            if (dateEntries[i].dataset.kiwixdate == dateID || dateID == "All") dateEntries[i].style.display = "inline";
                            if (dateEntries[i].dataset.kiwixdate != dateID && dateID != "All") dateEntries[i].style.display = "none";
                            if (langID && dateEntries[i].lang != langID && langID != "All") dateEntries[i].style.display = "none";
                            if (subjID && dateEntries[i].dataset.kiwixsubject !== subjID && subjID !== "All") dateEntries[i].style.display = "none";
                        }
                        // Prune the language list
                        if (langID === 'All') {
                            var langList = langArray.join('\r\n');
                            // We need to normalize language codes in langPanel (for Stackexchange)
                            // DEV: innerText doesn't include hidden items
                            var langTestPanel = langPanel.innerText.replace(/(_\w+)-(\w+_)/, '$1$2');
                            langList = langList.replace(/^(.*)[\r\n]*/mg, function (p0, p1) {
                                if (p1 !== 'All' && !~langTestPanel.indexOf('_' + p1 + '_')) return '';
                                return '<option value="' + p1 + '"' + (langID === p1 ? ' selected' : '' ) + '>' + p1 + (p1 === 'All' ? '' : ' : ' + langCodes[p1]) + '</option>';
                            });
                            langSel.innerHTML = langList;
                        }
                        // Prune subject list
                        if (subjID === 'All') {
                            var subjList = subjectArray.join('\r\n');
                            subjList = subjList.replace(/^(.*)[\r\n]*/mg, function (p0, p1) {
                                // DEV: innerText doesn't include hidden items
                                var rgxSubject = new RegExp('_?' + p1 + '[._]', 'i');
                                if (p1 !== 'All' && !rgxSubject.test(langPanel.innerText)) return '';
                                return '<option value="' + p1 + '"' + (subjID === p1 ? ' selected' : '') + '>' + p1 + '</option>';
                            });
                            subjSel.innerHTML = subjList;
                        }
                        // Rebuild date selector
                        var dateList = dateArray.join('\r\n');
                        dateList = dateList.replace(/^(.*)[\r\n]*/mg, function (p0, p1) {
                            return '<option value="' + p1 + '"' + (dateID === p1 ? ' selected' : '') + '>' + p1 + '</option>';
                        });
                        dateSel.innerHTML = dateList;
                    }
                });
            }
            var links = downloadLinks.getElementsByTagName("a");
            for (i = 0; i < links.length; i++) {
                //Store the href - seems it's not useful?
                //links[i].setAttribute("data-kiwix-dl", links[i].href);
                links[i].href = "#";
                links[i].addEventListener('click', function () {
                    var langSel = document.getElementById("langs");
                    var dateSel = document.getElementById("dates");
                    var langID = langSel ? langs.value : "";
                    var dateID = dateSel ? dates.value : "";
                    var replaceURL = URL + this.text;
                    //Allow both zim and zip format
                    if (/\.zi[mp]$/i.test(this.text)) {
                        replaceURL = replaceURL + ".meta4";
                    } else if (/parent\s*directory/i.test(this.text)) {
                        replaceURL = URL.replace(/\/[^\/]*\/$/i, "\/");
                    } else if (!/\/$/.test(this.text)) {
                        //Unrecognized filetype and it's not a directory, so prevent potentially harmful download
                        replaceURL = "";
                    }
                    requestXhttpData(replaceURL, langID, dateID);
                });
            }
            //Display the finished panel
            downloadLinks.style.display = "block";
            document.getElementById('indexHeader').scrollIntoView();
            document.getElementById('scrollbox').scrollTop += 65;

            // Standardize the document for array extraction
            function getStandardizedDoc(fromDoc) {
                //Add back any missing carriage returns
                var std = fromDoc.replace(/<\/span><span\b/ig, '\n');
                //Delete all lines without a wiki pattern from language list
                std = std.replace(/^(?![^_\n\r]+_([\w-]+)_.+$).*[\r\n]*/mg, '');
                //Delete any hidden lines
                std = std.replace(/^.*?display:\s*none;.*[\r\n]*/mg, '');
                return std;
            }

            // Get list of languages
            function getLangArray(fromDoc) {
                //Get list of all languages
                var langList = fromDoc.replace(/^[^_]+_([^_]+)_.+[\r\n]*/mg, '$1\n');
                //Delete recurrences
                langList = langList.replace(/\b([\w-]+\n)(?=[\s\S]*\b\1\n?)/g, '');
                langList = 'All\n' + langList;
                langList = langList.replace(/-/, '');
                var langArray = langList.match(/^\w+$/mg);
                //Sort list alphabetically
                langArray.sort();
                return langArray;
            }

            // Get list of subjects
            function getSubjectArray(fromDoc) {
                //Get list of all subjects
                var subList;
                if (/^(?:[^._]+\.stack(?:exchange|overflow)|askubuntu|stackapps|stackoverflow|superuser|serverfault)/mi.test(fromDoc)) {
                    subList = fromDoc.replace(/^(?:.+(stackoverflow)|[^"]+"([^.]+)).+[\r\n]/img, '$1$2\n');
                } else {
                    subList = fromDoc.replace(/^[^_]+_[^_]+_((?:[^_]|_(?!maxi|mini|nopic|\d\d\d\d))+).+[\r\n]*/mg, '$1\n');
                }
                //Delete recurrences
                subList = subList.replace(/\b([\w_-]+\n)(?=[\s\S]*\b\1\n?)/g, '');
                //Remove 'all'
                subList = subList.replace(/^all$/mi, '');
                var subArray = subList.match(/^.+$/mg);
                if (subArray) {
                    //Sort list alphabetically
                    subArray.sort();
                    // Add 'All' at astart
                    subArray.unshift('All');
                }
                return subArray;
            }

            //Get list of dates
            function getDateArray(fromDoc) {
                //Get list of all dates
                var dateList = fromDoc.replace(/^.*?(\d+[-]\d+)\.zi[mp].+[\r\n]*/mig, '$1\n');
                //Delete recurrences
                dateList = dateList.replace(/(\b\d+[-]\d+)\n(?=[\s\S]*\b\1\n?)/g, '');
                dateList = 'All\n' + dateList;
                var dateArray = dateList.match(/^.+$/mg);
                //Sort list alphabetically
                dateArray.sort();
                dateArray.reverse();
                return dateArray;
            }
        }
    }

    

    /**
    * Functions and classes exposed by this module
    */
    return {
        //langCodes: langCodes,
        requestXhttpData: requestXhttpData
    };
});