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
        cu: 'словѣньскъ / slověnĭskŭ (Old Church Slavonic / Old Bulgarian)',
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
        frp: 'Arpitan / francoprovençal (Arpitan / Franco-Provençal)',
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
        lad: 'Dzhudezmo / Djudeo-Espanyol (Ladino / Judeo-Spanish)',
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
        sh: 'Srpskohrvatski / Српскохрватски (Serbo-Croatian)',
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
        war: 'Winaray / Binisaya Lineyte-Samarnon (Waray / Samar-Leyte Visayan)',
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
                    //Create dropdown language selector
                    if (langArray) {
                        var dropdown = '<select class="dropdown" id="langs">\r\n';
                        for (var q = 0; q < langArray.length; q++) {
                            dropdown += '<option value="' + langArray[q] + '">' +
                                (langCodes[langArray[q]] ? langArray[q] + ' :  ' + langCodes[langArray[q]] : langArray[q]) +
                                '</option>\r\n';
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