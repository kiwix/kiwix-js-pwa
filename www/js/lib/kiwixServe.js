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

import cache from './cache.js';
import uiUtil from './uiUtil.js';
import settingsStore from './settingsStore.js';
import torrentClient from './torrentClient.js';

/* globals params, appstate */

var langCodes = {
    aa: 'Afar (Afar)',
    ab: 'Аҧсуа (Abkhazian)',
    ace: 'Acèh (Achinese)',
    ady: 'Адыгэбзэ (Adyghe (Adygei))',
    af: 'Afrikaans (Afrikaans)',
    ak: 'Akana (Akan)',
    ale: 'Aleut (Aleut)',
    als: 'Alemannisch (Alemannic (Swiss German))',
    am: 'አማርኛ (Amharic)',
    an: 'Aragonés (Aragonese)',
    ang: 'Englisc (Anglo-Saxon / Old English)',
    ar: 'العربية (Arabic)',
    arc: 'ܣܘܪܬ (Aramaic)',
    arp: 'Arapaho (Arapaho)',
    arz: 'مصرى (Egyptian Arabic)',
    as: 'অসমীয়া (Assamese)',
    ast: 'Asturianu (Asturian)',
    atj: 'Atikamekw (Atikamekw)',
    av: 'Авар (Avar)',
    ay: 'Aymar (Aymara)',
    az: 'Azərbaycanca / آذربايجان (Azerbaijani)',
    azb: 'تۆرکجه (South Azerbaijani)',
    ba: 'Башҡорт (Bashkir)',
    ban: 'Bhāṣa Bali (Balinese)',
    bar: 'Boarisch (Bavarian)',
    batSmg: 'Žemaitėška (Samogitian)',
    sgs: 'Žemaitėška (Samogitian)',
    bcl: 'Bikol Central (Bikol)',
    be: 'Беларуская (Belarusian)',
    beXOld: 'Беларуская (тарашкевіца) (Belarusian (Taraškievica))',
    beTarask: 'Беларуская (тарашкевіца) (Belarusian (Taraškievica))',
    bg: 'Български (Bulgarian)',
    bgs: 'Tagabawa (Tagabawa (Manobo))',
    bh: 'भोजपुरी (Bihari)',
    bho: 'भोजपुरी (Bhojpuri)',
    bi: 'Bislama (Bislama)',
    bjn: 'Bahasa Banjar (Banjar)',
    bm: 'Bamanankan (Bambara)',
    bn: 'বাংলা (Bengali)',
    bo: 'བོད་ཡིག / Bod skad (Tibetan)',
    bpy: 'ইমার ঠার/বিষ্ণুপ্রিয়া মণিপুরী (Bishnupriya Manipuri)',
    br: 'Brezhoneg (Breton)',
    brx: 'बड़ो (Bodo)',
    bs: 'Bosanski (Bosnian)',
    bug: 'ᨅᨔ ᨕᨘᨁᨗ / Basa Ugi (Buginese)',
    bxr: 'Буряад хэлэн (Buriat (Russia))',
    ca: 'Català (Catalan)',
    cbk: 'Chavacano (Chavacano)',
    cbkZam: 'Chavacano de Zamboanga (Chavacano)',
    cdo: 'Mìng-dĕ̤ng-ngṳ̄ / 閩東語 (Min Dong Chinese)',
    ce: 'Нохчийн (Chechen)',
    ceb: 'Sinugboanong Binisaya (Cebuano)',
    ch: 'Chamoru (Chamorro)',
    cho: 'Choctaw (Choctaw)',
    chr: 'ᏣᎳᎩ (Cherokee)',
    chy: 'Tsetsêhestâhese (Cheyenne)',
    ckb: 'کوردی (Central Kurdish)',
    co: 'Corsu (Corsican)',
    cr: 'Nehiyaw (Cree)',
    crh: 'Qırımtatarca (Crimean Tatar)',
    cs: 'Česky (Czech)',
    csb: 'Kaszëbsczi (Kashubian)',
    cu: 'словѣньскъ / slověnĭskŭ (Old Church Slavonic)',
    cv: 'Чăваш (Chuvash)',
    cy: 'Cymraeg (Welsh)',
    da: 'Dansk (Danish)',
    dag: 'Dagbanli (Dagbanli)',
    de: 'Deutsch (German)',
    din: 'Thuɔŋjäŋ (Dinka)',
    diq: 'Zazaki (Dimli)',
    dsb: 'Dolnoserbski (Lower Sorbian)',
    dty: 'डोटेली (Doteli (Dotyali))',
    dv: 'ދިވެހިބަސް (Divehi)',
    dz: 'ཇོང་ཁ (Dzongkha)',
    ee: 'Ɛʋɛ (Ewe)',
    el: 'Ελληνικά (Greek)',
    eml: 'Emiliàn e rumagnòl (Emiliano-Romagnolo)',
    en: 'English (English)',
    eng: 'English (English)',
    enm: 'Middle English',
    eo: 'Esperanto (Esperanto)',
    es: 'Español (Spanish)',
    et: 'Eesti (Estonian)',
    eu: 'Euskara (Basque)',
    ext: 'Estremeñu (Extremaduran)',
    fa: 'فارسی (Farsi (Persian))',
    far: 'فارسی (Farsi (Persian))',
    ff: 'Fulfulde (Peul)',
    fi: 'Suomi (Finnish)',
    fiuVro: 'Võro (Võro)',
    vro: 'Võro (Võro)',
    fj: 'Na Vosa Vakaviti (Fijian)',
    frr: 'Nordfriisk (North Frisian)',
    fo: 'Føroyskt (Faroese)',
    fr: 'Français (French)',
    frp: 'Arpitan/francoprovençal (Arpitan/Provençal)',
    fur: 'Furlan (Friulian)',
    fy: 'Frysk (West Frisian)',
    ga: 'Gaeilge (Irish)',
    gag: 'Gagauz (Gagauz)',
    gan: '贛語 (Gan Chinese)',
    gbm: 'गढ़वळी (Garhwali)',
    gd: 'Gàidhlig (Scottish Gaelic)',
    gil: 'Taetae ni kiribati (Gilbertese)',
    gl: 'Galego (Galician)',
    gla: 'Gàidhlig (Scottish Gaelic)',
    glk: 'گیلکی (Gilaki)',
    gn: 'Avañe’ẽ (Guarani)',
    gor: 'Bahasa Hulontalo (Gorontalo)',
    got: 'gutisk (Gothic)',
    grc: 'Ἑλληνικὴ ἀρχαία (Ancient Greek)',
    gu: 'ગુજરાતી (Gujarati)',
    guw: 'Gungbe (Gun)',
    gv: 'Gaelg (Manx)',
    ha: 'هَوُسَ (Hausa)',
    hak: '客家語/Hak-kâ-ngî (Hakka Chinese)',
    haw: 'Hawai`i (Hawaiian)',
    he: 'עברית (Hebrew)',
    hi: 'हिन्दी (Hindi)',
    hif: 'Fiji Hindi (Fiji Hindi)',
    ho: 'Hiri Motu (Hiri Motu)',
    hr: 'Hrvatski (Croatian)',
    hsb: 'Hornjoserbsce (Upper Sorbian)',
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
    in: 'Bahasa Indonesia (Indonesian)',
    inh: 'ГӀалгӀай (Ingush)',
    io: 'Ido (Ido)',
    is: 'Íslenska (Icelandic)',
    it: 'Italiano (Italian)',
    iu: 'ᐃᓄᒃᑎᑐᑦ (Inuktitut)',
    iw: 'עברית (Hebrew)',
    ja: '日本語 (Japanese)',
    jbo: 'Lojban (Lojban)',
    jv: 'Basa Jawa (Javanese)',
    ka: 'ქართული (Georgian)',
    kaa: 'Qaraqalpaqsha (Karakalpak)',
    kab: 'Taqbaylit (Kabyle)',
    kbd: 'Адыгэбзэ (Kabardian)',
    kbp: 'Kabɩyɛ (Kabiye)',
    kg: 'KiKongo (Kongo)',
    kha: 'Ka Ktien Khasi (Khasi)',
    ki: 'Gĩkũyũ (Kikuyu)',
    kj: 'Kuanyama (Kuanyama)',
    kk: 'Қазақша (Kazakh)',
    kl: 'Kalaallisut (Greenlandic)',
    kld: 'Gamilaraay / Kamilaroi (Gamilaraay)',
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
    lbe: 'лакку (Lak)',
    lfn: 'Lingua Franca Nova (Lingua Franca Nova)',
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
    mnw: 'ဘာသာမန် / မန် (Mon)',
    mo: 'Moldovenească (Moldovan)',
    mr: 'मराठी (Marathi)',
    ms: 'Bahasa Melayu (Malay)',
    mt: 'bil-Malti (Maltese)',
    mul: 'Multiple Languages',
    mus: 'Mvskoke (Creek / Muskogee)',
    mwl: 'Mirandés (Mirandese)',
    my: 'Myanmasa (Burmese)',
    myn: 'Maya (Mayan Languages)',
    na: 'Dorerin Naoero (Nauruan)',
    nah: 'Nahuatl (Nahuatl)',
    nai: 'North American Indian (North American Indian Languages)',
    nap: 'Nnapulitano (Neapolitan)',
    nav: 'Diné bizaad (Navajo)',
    nb: 'Norsk (bokmål / riksmål) (Norwegian Bokmål)',
    nd: 'Sindebele (North Ndebele)',
    nds: 'Plattdüütsch (Low German / Low Saxon)',
    ndsNl: 'Nedersaksisch (Dutch Low Saxon)',
    ne: 'नेपाली (Nepali)',
    new: 'नेपालभाषा / Newah Bhaye (Newar)',
    no: 'Norsk (bokmål / riksmål) (Norwegian)',
    ng: 'Oshiwambo (Ndonga)',
    nl: 'Nederlands (Dutch)',
    nn: 'Norsk (nynorsk) (Norwegian Nynorsk)',
    nr: 'isiNdebele (South Ndebele)',
    nso: 'Sesotho sa Leboa / Sepedi (Northern Sotho)',
    nrm: 'Nouormand / Normaund (Norman)',
    nv: 'Diné bizaad (Navajo)',
    ny: 'Chi-Chewa (Chichewa)',
    oc: 'Occitan (Occitan)',
    oj: 'ᐊᓂᔑᓈᐯᒧᐎᓐ / Anishinaabemowin (Ojibwa)',
    oji: 'ᐊᓂᔑᓈᐯᒧᐎᓐ / Anishinaabemowin (Ojibwa)',
    om: 'Oromoo (Oromo)',
    or: 'ଓଡ଼ିଆ (Oriya)',
    os: 'Иронау (Ossetian / Ossetic)',
    pa: 'ਪੰਜਾਬੀ / पंजाबी / پنجابي (Panjabi / Punjabi)',
    pag: 'Pangasinan (Pangasinan)',
    pam: 'Kapampangan (Kapampangan)',
    pap: 'Papiamentu (Papiamentu)',
    pcm: 'Naijíríà (Nigerian Pidgin)',
    pdc: 'Deitsch (Pennsylvania German)',
    pi: 'Pāli / पाऴि (Pali)',
    pih: 'Norfuk (Norfolk)',
    pl: 'Polski (Polish)',
    pms: 'Piemontèis (Piedmontese)',
    pnb: 'پنجابی (Western Punjabi)',
    pnt: 'Ποντιακά (Pontic)',
    ps: 'پښتو (Pashto)',
    pt: 'Português (Portuguese)',
    ptbr: 'Português brasileiro (Brazilian Portuguese)',
    qu: 'Runa Simi (Quechua)',
    rm: 'Rumantsch (Raeto Romance)',
    rmr: 'Caló (Caló (Romani))',
    rmy: 'Romani / रोमानी (Romani)',
    rn: 'Kirundi (Kirundi)',
    ro: 'Română (Romanian)',
    roaRup: 'Armâneashti (Aromanian)',
    roaTara: 'Tarandíne (Tarantino)',
    rup: 'Armâneashti (Aromanian)',
    ru: 'Русский (Russian)',
    rue: 'Русиньскый (Rusyn)',
    rw: 'Kinyarwandi (Rwandi)',
    sa: 'संस्कृतम् (Sanskrit)',
    sat: 'ᱥᱟᱱᱛᱟᱲᱤ (Santali)',
    sc: 'Sardu (Sardinian)',
    scn: 'Sicilianu (Sicilian)',
    sco: 'Scots (Scots)',
    sd: 'सिनधि (Sindhi)',
    se: 'Davvisámegiella (Northern Sami)',
    sg: 'Sängö (Sango)',
    sh: 'Srpskohrvatski/Српскохрватски (Serbo-Croatian)',
    shn: 'ရှမ်း (Shan)',
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
    stq: 'Saterfriesisch / Seeltersk (Saterland Frisian)',
    su: 'Basa Sunda (Sundanese)',
    sv: 'Svenska (Swedish)',
    sw: 'Kiswahili (Swahili)',
    szl: 'Ślůnski (Silesian)',
    ta: 'தமிழ் (Tamil)',
    tcy: 'ತುಳು (Tulu)',
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
    tyv: 'Тыва дыл (Tuvinian)',
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
    wuu: '吴语 (Wu Chinese)',
    xal: 'Хальмг (Kalmyk)',
    xh: 'isiXhosa (Xhosa)',
    xmf: 'მარგალური (Mingrelian)',
    yi: 'ייִדיש (Yiddish)',
    yo: 'Yorùbá (Yoruba)',
    za: 'Cuengh / Tôô / 壮语 (Zhuang)',
    zh: '中文 (Chinese)',
    lzh: '文言 (Classical Chinese)',
    zhClassical: '文言 (Classical Chinese)',
    nan: 'Bân-lâm-gú (Minnan)',
    yue: '粵語 / 粤语 (Cantonese)',
    zu: 'isiZulu (Zulu)',
    gom: 'Goan Konkani',
    gsw: 'Swiss German-Alemannic-Alsatian',
    jam: 'Jamaican Creole English',
    koi: 'Komi-Permyak',
    krc: 'Karachay-Balkar',
    lez: 'Lezghian',
    lrc: 'Northern Luri',
    ltg: 'Latgalian',
    mai: 'Maithili',
    mdf: 'Moksha',
    mhr: 'Eastern Mari',
    mrj: 'Western Mari',
    myv: 'Erzya',
    mzn: 'Mazanderani',
    nov: 'Novial',
    olo: 'Livvi',
    pcd: 'Picard',
    pfl: 'Pfaelzisch',
    sah: 'Yakut',
    srn: 'Sranan Tongo',
    vep: 'Veps',
    zea: 'Zeeuws'
};

// Maps common OPDS ISO 639-2/3 codes to the language codes used in langCodes.
// This keeps filtering keyed to OPDS values while preserving native-friendly labels.
var opdsLangCodeAliases = {
    abk: 'ab',
    afr: 'af',
    alb: 'sq',
    amh: 'am',
    ara: 'ar',
    arm: 'hy',
    arg: 'an',
    asm: 'as',
    ava: 'av',
    aym: 'ay',
    aze: 'az',
    bak: 'ba',
    baq: 'eu',
    bam: 'bm',
    bel: 'be',
    ben: 'bn',
    bis: 'bi',
    bos: 'bs',
    bod: 'bo',
    bre: 'br',
    bul: 'bg',
    bur: 'my',
    cat: 'ca',
    ces: 'cs',
    cha: 'ch',
    che: 'ce',
    chi: 'zh',
    chu: 'cu',
    chv: 'cv',
    cor: 'kw',
    cos: 'co',
    cre: 'cr',
    cze: 'cs',
    cym: 'cy',
    dan: 'da',
    deu: 'de',
    div: 'dv',
    dut: 'nl',
    dzo: 'dz',
    epo: 'eo',
    ell: 'el',
    est: 'et',
    eus: 'eu',
    ewe: 'ee',
    fao: 'fo',
    fas: 'fa',
    fij: 'fj',
    fin: 'fi',
    ful: 'ff',
    fre: 'fr',
    fra: 'fr',
    geo: 'ka',
    ger: 'de',
    gle: 'ga',
    glg: 'gl',
    glv: 'gv',
    gre: 'el',
    grn: 'gn',
    guj: 'gu',
    hat: 'ht',
    hau: 'ha',
    hbs: 'sh',
    heb: 'he',
    hin: 'hi',
    hrv: 'hr',
    hun: 'hu',
    hye: 'hy',
    ibo: 'ig',
    ido: 'io',
    iku: 'iu',
    ile: 'ie',
    ina: 'ia',
    ice: 'is',
    ind: 'id',
    ipk: 'ik',
    isl: 'is',
    ita: 'it',
    jav: 'jv',
    jpn: 'ja',
    kal: 'kl',
    kan: 'kn',
    kas: 'ks',
    kat: 'ka',
    kaz: 'kk',
    khm: 'km',
    kik: 'ki',
    kin: 'rw',
    kir: 'ky',
    kor: 'ko',
    kom: 'kv',
    kon: 'kg',
    lav: 'lv',
    lao: 'lo',
    lat: 'la',
    lit: 'lt',
    lim: 'li',
    lin: 'ln',
    mac: 'mk',
    mal: 'ml',
    mar: 'mr',
    mkd: 'mk',
    mlg: 'mg',
    mri: 'mi',
    msa: 'ms',
    mya: 'my',
    mlt: 'mt',
    nep: 'ne',
    nhe: 'nah',
    nld: 'nl',
    nno: 'nn',
    nob: 'nb',
    nor: 'no',
    nya: 'ny',
    oci: 'oc',
    ori: 'or',
    orm: 'om',
    oss: 'os',
    pan: 'pa',
    per: 'fa',
    pli: 'pi',
    pol: 'pl',
    por: 'pt',
    pus: 'ps',
    que: 'qu',
    roh: 'rm',
    ron: 'ro',
    rum: 'ro',
    run: 'rn',
    rus: 'ru',
    sag: 'sg',
    san: 'sa',
    sin: 'si',
    sme: 'se',
    smo: 'sm',
    sna: 'sn',
    snd: 'sd',
    som: 'so',
    sot: 'st',
    slk: 'sk',
    slo: 'sk',
    slv: 'sl',
    spa: 'es',
    sqi: 'sq',
    srp: 'sr',
    srd: 'sc',
    ssw: 'ss',
    sun: 'su',
    swa: 'sw',
    swe: 'sv',
    tah: 'ty',
    tam: 'ta',
    tel: 'te',
    tgk: 'tg',
    tgl: 'tl',
    tha: 'th',
    tir: 'ti',
    ton: 'to',
    tso: 'ts',
    tuk: 'tk',
    twi: 'tw',
    tur: 'tr',
    uig: 'ug',
    ukr: 'uk',
    urd: 'ur',
    uzb: 'uz',
    ven: 've',
    vol: 'vo',
    vie: 'vi',
    wln: 'wa',
    wol: 'wo',
    xho: 'xh',
    yid: 'yi',
    yor: 'yo',
    zha: 'za',
    zho: 'zh',
    zul: 'zu'
};

// langCodes keys camelCase multi-part codes (e.g. roa-tara -> roaTara, nds-nl -> ndsNl),
// but the OPDS pipeline canonicalizes to lowercase-hyphen form. Bridge the two for lookups.
function toLangCodesKey (code) {
    return code.replace(/-([a-z])/g, function (match, letter) { return letter.toUpperCase(); });
}

function getLanguageDisplayLabel (langCode) {
    var code = trim(langCode).toLowerCase();
    var aliasCode = opdsLangCodeAliases[code] || code;
    var langName = langCodes[code] || langCodes[aliasCode] ||
        langCodes[toLangCodesKey(aliasCode)] || langCodes[toLangCodesKey(code)];
    if (!langName) return langCode;
    return aliasCode + ' :  ' + langName;
}

function normalizeOpdsLanguageCode (langCode) {
    var code = trim(langCode).toLowerCase();
    var aliasCode = opdsLangCodeAliases[code] || code;
    if (aliasCode.length === 2) return aliasCode;
    if (!langCodes[aliasCode]) return aliasCode;
    // If we have an equivalent 2-letter code in langCodes, prefer it for UI consistency.
    for (var key in langCodes) {
        if (key.length === 2 && langCodes[key] === langCodes[aliasCode]) return key;
    }
    return aliasCode;
}

var downloadLinks = document.getElementById('downloadLinks');
var serverResponse = document.getElementById('serverResponse');

// Used to decide the target for download links
var target = /Electron/.test(params.appType) ? '' : ' target="_blank"';

// DEV: If you support more packaged files, add to this list
var regexpFilter = /_medicine|mdwiki_/.test(params.packagedFile) ? /^(?!.+(_medicine_|mdwiki_))[^_\n\r]+_([^_\n\r]+)_.+\.zi[mp].+$\s+/mig : null;
regexpFilter = /wikivoyage/.test(params.packagedFile) ? /^(?!.+wikivoyage_)[^_\n\r]+_([^_\n\r]+)_.+\.zi[mp].+$\s+/mig : regexpFilter;

var currentBrowseUrl = '';
var currentOpdsEntries = [];
var currentOpdsCategory = '';
// Held here rather than read back from the input because the download panels re-serialize
// downloadLinks.innerHTML, which would discard a typed (property-only) value.
var currentOpdsFilter = '';

function escapeRegExp (str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml (str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function trim (str) {
    return str == null ? '' : String(str).replace(/^\s+|\s+$/g, '');
}

function resolveCatalogHref (href, referenceUrl) {
    if (!href) return '';
    if (/^https?:\/\//i.test(href)) return href;
    if (/^\/\//.test(href)) return window.location.protocol + href;
    var baseUrl = referenceUrl || params.kiwixCatalogRoot + '/';
    if (/^\//.test(href)) {
        var originMatch = baseUrl.match(/^(https?:\/\/[^/]+)/i);
        return (originMatch ? originMatch[1] : params.kiwixLibraryServer) + href;
    }
    baseUrl = baseUrl.replace(/[?#].*$/, '');
    if (!/\/$/.test(baseUrl)) baseUrl = baseUrl.replace(/\/[^/]*$/, '/');
    return baseUrl + href;
}

function setQueryParameter (url, key, value) {
    var hash = '';
    var hashIndex = url.indexOf('#');
    if (~hashIndex) {
        hash = url.slice(hashIndex);
        url = url.slice(0, hashIndex);
    }
    var encodedKey = encodeURIComponent(key);
    var encodedValue = encodeURIComponent(value);
    var pattern = new RegExp('([?&])' + escapeRegExp(encodedKey) + '=[^&]*');
    if (pattern.test(url)) {
        url = url.replace(pattern, '$1' + encodedKey + '=' + encodedValue);
    } else {
        url += (~url.indexOf('?') ? '&' : '?') + encodedKey + '=' + encodedValue;
    }
    return url + hash;
}

function getDirectChildElements (parent, localName) {
    var matches = [];
    if (!parent) return matches;
    for (var i = 0; i < parent.childNodes.length; i++) {
        var node = parent.childNodes[i];
        if (node.nodeType !== 1) continue;
        var nodeName = node.localName || node.baseName || node.nodeName.replace(/^.*:/, '');
        if (nodeName === localName) matches.push(node);
    }
    return matches;
}

function getDirectChildText (parent, localName) {
    var nodes = getDirectChildElements(parent, localName);
    return nodes.length ? trim(nodes[0].textContent || nodes[0].text) : '';
}

function getEntryLink (entry, rel, type) {
    var links = getDirectChildElements(entry, 'link');
    for (var i = 0; i < links.length; i++) {
        var linkRel = links[i].getAttribute('rel') || '';
        var linkType = links[i].getAttribute('type') || '';
        if (rel && linkRel !== rel) continue;
        if (type && linkType !== type) continue;
        return links[i];
    }
    return null;
}

function parseLanguages (langValue) {
    var langs = [];
    var seen = {};
    if (!langValue) return langs;
    var splitLangs = langValue.split(',');
    for (var i = 0; i < splitLangs.length; i++) {
        var lang = normalizeOpdsLanguageCode(splitLangs[i]);
        if (lang && !seen[lang]) {
            seen[lang] = true;
            langs.push(lang);
        }
    }
    return langs;
}

function formatSize (bytes) {
    var number = parseInt(bytes, 10);
    if (isNaN(number) || number <= 0) return '';
    var units = ['B', 'K', 'M', 'G', 'T'];
    var unitIndex = 0;
    var size = number;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size = size / 1024;
        unitIndex++;
    }
    return (size >= 100 || unitIndex === 0 ? Math.round(size) : Math.round(size * 10) / 10) + units[unitIndex];
}

function getYearMonth (dateValue) {
    var match = trim(dateValue).match(/^(\d{4}-\d{2})/);
    return match ? match[1] : '';
}

function getDateDisplay (dateValue) {
    var match = trim(dateValue).match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : trim(dateValue);
}

function deriveSubjectFromName (name, category) {
    if (!name) return '';
    if (/^(mooc|phet|zimit|videos|other|dev)$/i.test(category)) return '';
    if (/^stack_exchange$/i.test(category)) {
        var stackMatch = name.match(/^(?:([^_]+)|stackexchange)_([^_]+)_(.+)$/i);
        if (!stackMatch) return '';
        return trim((stackMatch[1] || 'stackexchange') + (stackMatch[3] ? '_' + stackMatch[3] : '')).replace(/^_/, '');
    }
    var parts = name.split('_');
    if (parts.length < 3) return '';
    return trim(parts.slice(2).join('_'));
}

// The OPDS <language> field cannot distinguish wiki dialects that share an ISO 639-3 code
// (e.g. both wikipedia_nap_* and wikipedia_roa-tara_* report "nap"). The filename encodes the
// wiki's own code as the second underscore-delimited segment, so prefer it when it structurally
// looks like a language code, falling back to the OPDS language otherwise. This deliberately does
// not depend on langCodes/opdsLangCodeAliases being complete: an unlisted language still yields a
// dropdown entry (labelled with its bare code) and filters correctly.
// Subject/flavour tokens that can occupy the language segment in malformed names but must not be
// treated as languages:
var nonLanguageSegments = /^(all|maxi|mini|nopic|nodet|novid)$/;
function deriveLanguageFromName (name) {
    if (!name) return '';
    var parts = name.split('_');
    if (parts.length < 2) return '';
    var code = trim(parts[1]).toLowerCase();
    if (nonLanguageSegments.test(code)) return '';
    // Two-to-six letters, optionally followed by hyphen-delimited subtags (roa-tara, zh-min-nan)
    if (/^[a-z]{2,6}(-[a-z]+)*$/.test(code)) return code;
    return '';
}

function getOpdsFilename (entry) {
    var href = entry.acquisitionHref || '';
    if (href) {
        return href.replace(/^.*\/([^/?#]+).*$/, '$1').replace(/\.meta4$/i, '');
    }
    var dateSuffix = entry.date ? '_' + entry.date : '';
    return entry.name + dateSuffix + '.zim';
}

function parseOpdsFeed (docText) {
    var parser;
    try {
        parser = new DOMParser().parseFromString(docText, 'text/xml');
    } catch (err) {
        return null;
    }
    if (!parser || !parser.documentElement) return null;
    var rootName = parser.documentElement.localName || parser.documentElement.baseName || parser.documentElement.nodeName.replace(/^.*:/, '');
    if (rootName === 'parsererror' || parser.getElementsByTagName('parsererror').length) return null;
    return parser;
}

function isOpdsCategoryFeed (xml) {
    var feedEntries = xml.getElementsByTagName('entry');
    if (!feedEntries.length) return false;
    var firstLink = getEntryLink(feedEntries[0], 'subsection');
    return !!firstLink;
}

// Keep OPDS category injection in sync with the legacy directory parser so developer folders
// remain visible in both normal operation (OPDS) and fallback mode (legacy HTML parsing).
function buildOpdsCategoryRows (entries, requestUrl) {
    var rows = [];
    for (var i = 0; i < entries.length; i++) {
        var title = getDirectChildText(entries[i], 'title');
        var link = getEntryLink(entries[i], 'subsection');
        if (!title || !link) continue;
        rows.push({
            title: title,
            href: setQueryParameter(resolveCatalogHref(link.getAttribute('href'), requestUrl), 'count', '-1')
        });
    }
    return rows;
}

function injectDeveloperCategoryRows (categoryRows) {
    var hasWikipedia = false;
    var gutenbergIndex = -1;
    for (var i = 0; i < categoryRows.length; i++) {
        var title = trim(categoryRows[i].title).toLowerCase();
        if (title === 'wikipedia') hasWikipedia = true;
        if (title === 'gutenberg') gutenbergIndex = i;
    }
    if (!hasWikipedia) return categoryRows;

    var stagingBase = params.kiwixStagingServer + '/zim/';
    var devRows = [];
    // archive is commented out pending confirmation of its new location:
    // var archiveUrl = params.kiwixDownloadServer.replace(/\/zim\/?$/i, '/archive/zim/');
    // if (!params.appCache) devRows.push({ title: 'archive', href: archiveUrl });
    if (!params.appCache) devRows.push({ title: 'branded_apps', href: stagingBase + 'branded_apps/', external: true });
    if (!params.appCache) devRows.push({ title: 'dev', href: stagingBase + 'dev/', external: true });
    if (!params.appCache) devRows.push({ title: 'dev (OPDS)', href: params.kiwixStagingCatalogEntries });
    if (!params.appCache) devRows.push({ title: 'endless', href: stagingBase + 'endless/', external: true });

    for (var j = 0; j < devRows.length; j++) {
        var exists = false;
        for (var k = 0; k < categoryRows.length; k++) {
            if (trim(categoryRows[k].title).toLowerCase() === devRows[j].title.toLowerCase()) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            categoryRows.splice(~gutenbergIndex ? gutenbergIndex++ : 0, 0, devRows[j]);
        }
    }
    return categoryRows;
}

function renderOpdsCategories (xml, requestUrl) {
    var entries = xml.getElementsByTagName('entry');
    currentBrowseUrl = requestUrl;
    var categoryRows = injectDeveloperCategoryRows(buildOpdsCategoryRows(entries, requestUrl));
    // Browsing by category alone cannot reach archives whose ZIM declares no Category, so offer the
    // catalogue-wide feed as well. Rows with a label render verbatim (no trailing directory slash).
    categoryRows.unshift({
        title: 'All entries',
        label: 'All entries (whole catalogue)',
        href: params.kiwixCatalogEntries
    });
    var bodyDoc = '<div style="padding:0 8px;">' +
        '<h3 id="indexHeader" style="margin-left:0.15em;">Index of /zim</h3>' +
        '</div>' +
        '<div class="card border-success">' +
        '<div id="dl-panel-heading" class="card-header" style="overflow-x:auto;word-wrap:normal;">Name</div>' +
        '<div id="dl-panel-body" class="card-body" style="max-height:360px;word-wrap:normal;margin-bottom:10px;overflow:auto;">';
    for (var i = 0; i < categoryRows.length; i++) {
        var rowLabel = escapeHtml(categoryRows[i].label || categoryRows[i].title + '/');
        if (categoryRows[i].external) {
            bodyDoc += '<div><a href="' + escapeHtml(categoryRows[i].href) + '" target="_blank" rel="noopener noreferrer">' + rowLabel + '</a></div>';
        } else {
            bodyDoc += '<div><a href="#" class="kiwix-opds-link" data-kiwix-kind="category" data-kiwix-dl="' + escapeHtml(categoryRows[i].href) + '">' + rowLabel + '</a></div>';
        }
    }
    bodyDoc += '</div></div>';
    downloadLinks.innerHTML = bodyDoc;
    downloadLinks.style.display = 'block';
    currentBrowseUrl = requestUrl;
    var links = downloadLinks.getElementsByClassName('kiwix-opds-link');
    for (var j = 0; j < links.length; j++) {
        links[j].addEventListener('click', function (e) {
            e.preventDefault();
            requestXhttpData(this.dataset.kiwixDl);
        });
    }
    document.getElementById('indexHeader').scrollIntoView();
}

function parseOpdsEntries (xml, requestUrl) {
    var feedEntries = xml.getElementsByTagName('entry');
    var parsedEntries = [];
    for (var i = 0; i < feedEntries.length; i++) {
        var entry = feedEntries[i];
        var acquisitionLink = getEntryLink(entry, '', 'application/x-zim') ||
            getEntryLink(entry, '', 'application/metalink4+xml');
        var previewLink = getEntryLink(entry, '', 'text/html');
        var updated = getDirectChildText(entry, 'updated');
        var issued = getDirectChildText(entry, 'issued');
        var category = getDirectChildText(entry, 'category');
        var name = getDirectChildText(entry, 'name');
        var subject = deriveSubjectFromName(name, category);
        var languageValue = getDirectChildText(entry, 'language');
        parsedEntries.push({
            id: getDirectChildText(entry, 'id').replace(/^urn:uuid:/i, ''),
            title: getDirectChildText(entry, 'title'),
            summary: getDirectChildText(entry, 'summary'),
            languageValue: languageValue,
            languages: (function () {
                var nameLang = deriveLanguageFromName(name);
                return nameLang ? [nameLang] : parseLanguages(languageValue);
            })(),
            name: name,
            flavour: getDirectChildText(entry, 'flavour'),
            category: category,
            tags: getDirectChildText(entry, 'tags'),
            updated: updated,
            issued: issued,
            date: getYearMonth(issued || updated),
            dateDisplay: getDateDisplay(updated || issued),
            subject: subject,
            // OPDS acquisition links have type="application/x-zim" but href may currently point to a .zim or .meta4 URL;
            // normalize to .meta4 so requestXhttpData always fetches the metalink (served inline with CORS by lb(o).download.kiwix.org),
            // then processMetaLink() parses the mirror list and derives the OPFS download URL from any *.kiwix.org mirror listed
            acquisitionHref: acquisitionLink ? resolveCatalogHref(acquisitionLink.getAttribute('href'), requestUrl).replace(/\.meta4$/i, '') + '.meta4' : '',
            previewHref: previewLink ? resolveCatalogHref(previewLink.getAttribute('href'), requestUrl) : '',
            size: acquisitionLink ? acquisitionLink.getAttribute('length') || '' : '',
            sizeDisplay: formatSize(acquisitionLink ? acquisitionLink.getAttribute('length') || '' : ''),
            filename: ''
        });
        var parsed = parsedEntries[parsedEntries.length - 1];
        parsed.filename = getOpdsFilename(parsed);
        // Precomputed lowercase haystack for the text filter, so keystrokes never re-derive it
        parsed.search = (parsed.filename + ' ' + (parsed.summary || parsed.title || '')).toLowerCase();
    }
    return parsedEntries;
}

function sortAlphaNumeric (arr) {
    arr.sort(function (a, b) {
        a = a.toLowerCase();
        b = b.toLowerCase();
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    });
    return arr;
}

function getOpdsLangArray (entries) {
    var seen = {};
    var langs = ['All'];
    for (var i = 0; i < entries.length; i++) {
        for (var j = 0; j < entries[i].languages.length; j++) {
            var lang = entries[i].languages[j];
            if (!seen[lang]) {
                seen[lang] = true;
                langs.push(lang);
            }
        }
    }
    return ['All'].concat(sortAlphaNumeric(langs.slice(1)));
}

// Returns the category shared by every entry, or '' if the feed mixes categories (the all-entries
// catalogue) or is empty. Callers treat '' as "no single category to key presentation to".
function getCommonCategory (entries) {
    if (!entries.length) return '';
    var category = entries[0].category;
    for (var i = 1; i < entries.length; i++) {
        if (entries[i].category !== category) return '';
    }
    return category;
}

function getOpdsSubjectArray (entries, category) {
    // Subjects are only comparable within a category, and a mixed feed yields ~1000 of them, which is
    // not a usable dropdown. Per-entry subjects are still set, so the data attributes stay meaningful.
    if (!category) return null;
    if (/^(mooc|phet|zimit|videos|other|dev)$/i.test(category)) return null;
    var seen = {};
    var subjects = [];
    for (var i = 0; i < entries.length; i++) {
        var subject = trim(entries[i].subject);
        if (!subject || /^all$/i.test(subject) || seen[subject]) continue;
        seen[subject] = true;
        subjects.push(subject);
    }
    if (!subjects.length) return null;
    return ['All'].concat(sortAlphaNumeric(subjects));
}

function getOpdsDateArray (entries) {
    var seen = {};
    var dates = [];
    for (var i = 0; i < entries.length; i++) {
        var date = entries[i].date;
        if (!date || seen[date]) continue;
        seen[date] = true;
        dates.push(date);
    }
    dates.sort();
    dates.reverse();
    dates.unshift('All');
    return dates;
}

function buildDropdown (id, values, valueType) {
    if (!values || !values.length) return '';
    var dropdown = '<select class="dropdown" id="' + id + '">\r\n';
    for (var i = 0; i < values.length; i++) {
        var label = values[i];
        if (valueType === 'lang' && label !== 'All') {
            label = getLanguageDisplayLabel(label);
        }
        dropdown += '<option value="' + escapeHtml(values[i]) + '">' + escapeHtml(label) + '</option>\r\n';
    }
    dropdown += '</select>\r\n';
    return dropdown;
}

// Whitespace-separated tokens, all of which must appear somewhere in the entry's filename or
// description, so 'devdocs angular' finds the archive regardless of the order the words appear in
function getFilterTokens (filterText) {
    var tokens = trim(filterText || '').toLowerCase().split(/\s+/);
    var kept = [];
    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i]) kept.push(tokens[i]);
    }
    return kept;
}

function entryMatchesFilters (entry, lang, subj, kiwixDate, filterTokens) {
    var matchLang = !lang || lang === 'All';
    var matchSubject = !subj || subj === 'All';
    var matchDate = !kiwixDate || kiwixDate === 'All';
    if (!matchLang) {
        for (var i = 0; i < entry.languages.length; i++) {
            if (entry.languages[i] === lang.toLowerCase()) {
                matchLang = true;
                break;
            }
        }
    }
    if (!matchSubject) matchSubject = entry.subject === subj;
    if (!matchDate) matchDate = entry.date === kiwixDate;
    if (!(matchLang && matchSubject && matchDate)) return false;
    if (filterTokens && filterTokens.length) {
        var haystack = entry.search || '';
        for (var j = 0; j < filterTokens.length; j++) {
            if (haystack.indexOf(filterTokens[j]) === -1) return false;
        }
    }
    return true;
}

// Re-applies all four filters to the rendered rows in place. Rows are rendered one per entry in
// order, so the row index maps directly onto currentOpdsEntries and no data attributes are re-read.
// Filtering in place (rather than re-rendering) is what lets the text box keep focus while typing.
function applyOpdsFilters () {
    var panel = document.getElementById('dl-panel-body');
    if (!panel) return;
    var rows = panel.getElementsByClassName('wikiLang');
    if (rows.length !== currentOpdsEntries.length) return;
    var langSel = document.getElementById('langs');
    var subjSel = document.getElementById('subjects');
    var dateSel = document.getElementById('dates');
    var filterTokens = getFilterTokens(currentOpdsFilter);
    var shown = 0;
    for (var i = 0; i < rows.length; i++) {
        var matches = entryMatchesFilters(currentOpdsEntries[i], langSel ? langSel.value : '',
            subjSel ? subjSel.value : '', dateSel ? dateSel.value : '', filterTokens);
        rows[i].style.display = matches ? '' : 'none';
        if (matches) shown++;
    }
    setFilterCount(shown);
}

function setFilterCount (shown) {
    var counter = document.getElementById('kiwixFilterCount');
    if (!counter) return;
    counter.textContent = shown === currentOpdsEntries.length
        ? currentOpdsEntries.length + ' archives'
        : 'showing ' + shown + ' of ' + currentOpdsEntries.length;
}

// The download panels rewrite downloadLinks.innerHTML wholesale, which re-parses the filter controls
// from their serialized markup. A dropdown's selection lives only in DOM properties, so it would be
// lost on the round-trip and every dropdown would revert to its first option when the user goes back
// to the list. Stamping the state into attributes first makes it survive. Called for both the OPDS
// and the legacy directory listing, since both render these controls above the panel.
function preserveFilterControls () {
    var selectIds = ['langs', 'subjects', 'dates'];
    for (var i = 0; i < selectIds.length; i++) {
        var select = document.getElementById(selectIds[i]);
        if (!select) continue;
        for (var j = 0; j < select.options.length; j++) {
            if (j === select.selectedIndex) select.options[j].setAttribute('selected', 'selected');
            else select.options[j].removeAttribute('selected');
        }
    }
    // Already kept in sync as the user types, but re-stated here so the invariant holds at the point
    // it actually matters, however the value was set
    var filterBox = document.getElementById('kiwixFilter');
    if (filterBox) filterBox.setAttribute('value', filterBox.value);
}

function renderOpdsEntries (entriesUrl, lang, subj, kiwixDate) {
    var langArray = getOpdsLangArray(currentOpdsEntries);
    var subjectArray = getOpdsSubjectArray(currentOpdsEntries, currentOpdsCategory);
    var dateArray = getOpdsDateArray(currentOpdsEntries);
    var dropdownLang = buildDropdown('langs', langArray, 'lang');
    var dropdownSubj = buildDropdown('subjects', subjectArray, 'subject');
    var dropdownDate = buildDropdown('dates', dateArray, 'date');
    var bodyDoc = '<div style="padding:0 8px;">' +
        '<h3 id="indexHeader" style="margin-left:0.15em;">Index of /zim' +
        (currentOpdsCategory ? '/' + escapeHtml(currentOpdsCategory) : ' (all entries)') + '</h3>';
    if (dropdownLang || dropdownSubj || dropdownDate) {
        bodyDoc += '<div class="row" style="margin-left:0; margin-right:0;">';
        if (dropdownLang) bodyDoc += '<div class="col-4">Language:&nbsp;&nbsp;' + dropdownLang + '</div>';
        if (dropdownSubj) bodyDoc += '<div class="col-4">Subject:&nbsp;&nbsp;' + dropdownSubj + '</div>';
        if (dropdownDate) bodyDoc += '<div class="col-4">Date:&nbsp;&nbsp;' + dropdownDate + '</div>';
        bodyDoc += '</div>';
    }
    // The value is written as an attribute (and kept in sync on input) so that it survives the
    // innerHTML round-trips performed by the download panels
    bodyDoc += '<div class="row" style="margin-left:0; margin-right:0; padding-bottom:10px;">' +
        '<div class="col-12" style="padding-top:4px;">Filter:&nbsp;&nbsp;' +
        '<input type="search" id="kiwixFilter" class="kiwix-filter" autocomplete="off" spellcheck="false" ' +
        'placeholder="Filter by name or description" value="' + escapeHtml(currentOpdsFilter) + '" />' +
        '&nbsp;&nbsp;<span id="kiwixFilterCount" style="opacity:0.75;"></span></div></div>';
    bodyDoc += '</div>';
    var opdsRowStyle = 'display:flex;min-width:740px;white-space:nowrap;';
    var opdsNameColStyle = 'flex:0 0 300px;max-width:300px;padding-right:8px;overflow:hidden;text-overflow:ellipsis;';
    var opdsSizeColStyle = 'flex:0 0 90px;padding-right:8px;';
    var opdsDateColStyle = 'flex:0 0 120px;padding-right:8px;';
    var opdsDescColStyle = 'flex:0 0 auto;min-width:220px;padding-right:8px;';
    var opdsNameLinkStyle = 'display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;vertical-align:top;';
    bodyDoc += '<div class="card border-success">' +
        '<div id="dl-panel-heading" class="card-header" style="overflow-x:auto;word-wrap:normal;">' +
        '<div style="' + opdsRowStyle + '"><div style="' + opdsNameColStyle + '"><b>Name</b></div><div style="' + opdsSizeColStyle + '"><b>Size</b></div><div style="' + opdsDateColStyle + '"><b>Last modified</b></div><div style="' + opdsDescColStyle + '"><b>Description</b></div></div>' +
        '</div>' +
        '<div id="dl-panel-body" class="card-body" style="max-height:360px;word-wrap:normal;white-space:nowrap;margin-bottom:10px;overflow:auto;">';
    bodyDoc += '<div style="' + opdsRowStyle + '"><div style="' + opdsNameColStyle + '"><a href="#" class="kiwix-opds-link" data-kiwix-kind="category-root" data-kiwix-dl="' + escapeHtml(params.kiwixCatalogCategories) + '">Back to category list</a></div><div style="' + opdsSizeColStyle + '"></div><div style="' + opdsDateColStyle + '"></div><div style="' + opdsDescColStyle + '"></div></div>';
    var filterTokens = getFilterTokens(currentOpdsFilter);
    var shown = 0;
    for (var i = 0; i < currentOpdsEntries.length; i++) {
        var entry = currentOpdsEntries[i];
        var matches = entryMatchesFilters(entry, lang, subj, kiwixDate, filterTokens);
        if (matches) shown++;
        var displayStyle = matches ? '' : ' style="display:none;"';
        bodyDoc += '<div class="wikiLang" data-kiwixlanguages="' + escapeHtml(entry.languages.join(',')) + '" data-kiwixsubject="' + escapeHtml(entry.subject) + '" data-kiwixdate="' + escapeHtml(entry.date) + '"' + displayStyle + '>' +
            '<div style="' + opdsRowStyle + '">' +
            '<div style="' + opdsNameColStyle + '"><a href="#" class="kiwix-opds-link" style="' + opdsNameLinkStyle + '" title="' + escapeHtml(entry.filename) + '" data-kiwix-kind="archive" data-kiwix-dl="' + escapeHtml(entry.acquisitionHref) + '">' + escapeHtml(entry.filename) + '</a></div>' +
            '<div style="' + opdsSizeColStyle + '">' + escapeHtml(entry.sizeDisplay) + '</div>' +
            '<div style="' + opdsDateColStyle + '">' + escapeHtml(entry.dateDisplay) + '</div>' +
            '<div style="' + opdsDescColStyle + '" title="' + escapeHtml(entry.summary || entry.title) + '">' + escapeHtml(entry.summary || entry.title) + '</div>' +
            '</div>' +
            '</div>';
    }
    bodyDoc += '</div></div>';
    downloadLinks.innerHTML = bodyDoc;
    downloadLinks.style.display = 'block';
    currentBrowseUrl = entriesUrl;

    var links = downloadLinks.getElementsByClassName('kiwix-opds-link');
    for (var j = 0; j < links.length; j++) {
        links[j].addEventListener('click', function (e) {
            e.preventDefault();
            requestXhttpData(this.dataset.kiwixDl);
        });
    }

    var langSel = document.getElementById('langs');
    var subjSel = document.getElementById('subjects');
    var dateSel = document.getElementById('dates');
    if (langSel) langSel.value = lang || 'All';
    if (subjSel) subjSel.value = subj || 'All';
    if (dateSel) dateSel.value = kiwixDate || 'All';

    setFilterCount(shown);

    // All four controls now filter the rendered rows in place instead of re-rendering the list, which
    // both keeps the text box focused while typing and avoids rebuilding ~3600 rows per keystroke
    if (langSel) langSel.addEventListener('change', applyOpdsFilters);
    if (subjSel) subjSel.addEventListener('change', applyOpdsFilters);
    if (dateSel) dateSel.addEventListener('change', applyOpdsFilters);

    var filterBox = document.getElementById('kiwixFilter');
    if (filterBox) {
        filterBox.addEventListener('input', function () {
            currentOpdsFilter = this.value;
            this.setAttribute('value', this.value);
            applyOpdsFilters();
        });
        // Escape clears the filter. The app's global key handlers already exempt input elements, so
        // no other key needs intercepting here.
        filterBox.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && this.value) {
                e.preventDefault();
                this.value = '';
                currentOpdsFilter = '';
                this.setAttribute('value', '');
                applyOpdsFilters();
            }
        });
    }
    document.getElementById('indexHeader').scrollIntoView();
}

function processOpdsData (docText, requestUrl, lang, subj, kiwixDate) {
    var xml = parseOpdsFeed(docText);
    if (!xml) return false;
    if (isOpdsCategoryFeed(xml)) {
        currentOpdsEntries = [];
        currentOpdsCategory = '';
        currentOpdsFilter = '';
        renderOpdsCategories(xml, requestUrl);
        return true;
    }
    // Carry the filter across a re-fetch of the same feed (returning from a download panel), but drop
    // it when moving to a different one, so it cannot silently empty a newly opened category
    if (requestUrl !== currentBrowseUrl) currentOpdsFilter = '';
    currentOpdsEntries = parseOpdsEntries(xml, requestUrl);
    currentOpdsCategory = getCommonCategory(currentOpdsEntries);
    renderOpdsEntries(requestUrl, lang, subj, kiwixDate);
    return true;
}

function setPanelContent (panelId, html) {
    var panel = document.getElementById(panelId);
    if (!panel) return;
    panel.innerHTML = html;
}

/**
 * Makes a request to the Kiwix Download server and processes the output for ease of user selection
 *
 * @param {String} URL The URL of the download server
 * @param {String} lang The selected language code (optional helper value used internally)
 * @param {String} subj The selected subject (optional helper value)
 * @param {String} kiwixDate The selected date (optional helper value)
 */
function requestXhttpData (URL, lang, subj, kiwixDate) {
    if (!params.allowInternetAccess) {
        document.getElementById('serverResponse').innerHTML = "Blocked: select 'Allow Internet access'";
        document.getElementById('serverResponse').style.display = 'inline';
        return;
    }
    if (!URL) {
        document.getElementById('serverResponse').innerHTML = 'Unrecognized filetype, please try different link';
        document.getElementById('serverResponse').style.display = 'inline';
        return;
    }
    var xhttp = new XMLHttpRequest();
    // DEV: timeout set here to 20s for regular requests, 10s for meta4, 5s for magnet; if this isn't long enough for your target countries, increase
    var timeout = /\.magnet$/i.test(URL) ? 5000 : /\.meta4$/i.test(URL) ? 10000 : 20000;
    var xhttpTimeout = setTimeout(ajaxTimeout, timeout);
    function ajaxTimeout () {
        xhttp.abort();
        var responseMessageBox = document.getElementById('serverResponse');
        responseMessageBox.innerHTML = 'Connection attempt timed out (failed)';
        if (/https?:|file:/.test(window.location.protocol)) responseMessageBox.innerHTML = "Browser's CORS Policy disallowed access!";
        if (/\.meta4$/i.test(URL)) responseMessageBox.innerHTML = 'Archive descriptor xml file (meta4) is missing!';
        if (/\.magnet$/i.test(URL)) responseMessageBox.innerHTML = 'Unable to get magnet link!';
        document.getElementById('serverResponse').style.display = 'inline';
        if (!/\.magnet$/i.test(URL)) serverError(URL);
    }
    xhttp.onreadystatechange = function () {
        serverResponse.innerHTML = 'Server response: 0 Waiting...';
        serverResponse.style.display = 'inline';
        console.debug('Server responded: readyState ' + this.readyState + '; status ' + this.status);
        if (this.readyState === 4) {
            serverResponse.innerHTML = 'Server response: ' + this.status + ' ' + this.statusText + ' Waiting....';
            if (this.status === 200) {
                clearTimeout(xhttpTimeout);
                serverResponse.innerHTML = 'Server response: ' + this.status + ' ' + this.statusText + ' (data received)';
                // Preserve original querystring for OPDS state restoration, while also keeping a stripped URL for legacy checks.
                var requestURLWithQuery = URL;
                var requestURLNoQuery = URL.replace(/\?.*/, '');
                if (/\.meta4$/i.test(requestURLNoQuery)) {
                    processMetaLink(this.responseText);
                } else if (/\.magnet$/i.test(requestURLNoQuery)) {
                    processMagnetLink(this.responseText);
                } else if (!processOpdsData(this.responseText, requestURLWithQuery, lang, subj, kiwixDate)) {
                    processXhttpData(this.responseText);
                }
            } else if (this.status === 0) {
                if (window.location.protocol === 'file:') {
                    document.getElementById('serverResponse').innerHTML = 'Cannot use XMLHttpRequest with file:// protocol';
                    document.getElementById('serverResponse').style.display = 'inline';
                } else {
                    clearTimeout(xhttpTimeout);
                    serverResponse.innerHTML = 'Archive descriptor xml file (meta4) is missing!';
                }
                serverError(URL);
            }
        } else {
            serverResponse.innerHTML = 'Server response: ' + this.status + '/' + this.readyState + ' ' + this.statusText + ' Waiting...';
        }
    };
    // var urlArr = URL.split('?');
    xhttp.open('GET', URL, true);
    xhttp.send(null);

    function serverError (URL) {
        var requestedURL, altURL, torrentURL;
        if (/\.meta4$/i.test(URL)) {
            requestedURL = URL.replace(/\.meta4$/i, '');
            // Only show mirror link for the exact production download server (not subdomains like staging.)
            altURL = /wikipedia|wikisource|wikivoyage|wiktionary/i.test(URL) && /^https?:\/\/download\.kiwix\.org\//i.test(requestedURL)
                ? requestedURL.replace(/^https?:\/\/download\.kiwix\.org/i, 'https://www.mirrorservice.org/sites/download.kiwix.org') : '';
            // Keep the torrent on the same domain as the original URL (staging files have staging torrents)
            torrentURL = URL.replace(/\.meta4$/i, '.torrent');
            var headerDoc = 'There is a server issue, but please try the following links to your file:';
            setPanelContent('dl-panel-heading', headerDoc);
            var body = document.getElementById('dl-panel-body');
            var returnUrl = currentBrowseUrl || URL.replace(/\/[^/]*\.meta4$/i, '/');
            var bodyDoc = '<p><a id="returnLink" href="#" data-kiwix-dl="' + escapeHtml(returnUrl) + '">&lt;&lt; Back to list of files</a></p>\r\n';
            bodyDoc += '<p><b><i><a id="preview" target="_blank">Preview this archive</a></i></b> in your browser before downloading it</p>';
            bodyDoc += '<p><b>Browser-managed download of ZIM archive:</b></p>' +
            '<p><a href="' + requestedURL + '"' + target + ' class="download">' + requestedURL + '</a></p>' +
            (altURL ? '<p><b>Possible mirror:</b></p>' +
            '<p><a href="' + altURL + '"' + target + ' class="download">' + altURL + '</a></p>' : '') +
            '<p><b>Download with bittorrent:</b></p>' +
            '<p><a href="' + torrentURL + '"' + target + '>' + torrentURL + '</a></p>';
            if (body) body.innerHTML = bodyDoc;
            preserveFilterControls();
            downloadLinks.innerHTML = downloadLinks.innerHTML.replace(/Index\s+of/ig, 'File in');
            downloadLinks.innerHTML = downloadLinks.innerHTML.replace(/border-success/i, 'border-warning');
            document.getElementById('preview').href = URL.replace(/^[^/]+\/\/[^/]+\/.+\/([^/]+)\.zim.+$/i, params.kiwixLibraryBrowser + '/content/$1');
            var langSel = document.getElementById('langs');
            var subjSel = document.getElementById('subjects');
            var dateSel = document.getElementById('dates');
            var submitSelectValues = function () {
                var langID = langSel ? langSel.value === 'All' ? '' : langSel.value : '';
                var subjID = subjSel ? subjSel.value === 'All' ? '' : subjSel.value : '';
                var dateID = dateSel ? dateSel.value === 'All' ? '' : dateSel.value : '';
                requestXhttpData(this.dataset.kiwixDl, langID, subjID, dateID);
            };
            // Add event listener for click on return link, to go back to list of archives
            var returnLinkError = document.getElementById('returnLink');
            if (returnLinkError) returnLinkError.addEventListener('click', submitSelectValues);
        } else {
            downloadLinks.innerHTML = '<div class="console">' +
                '<p style="color:salmon;">Unable to access the server. Please see message below for reason.</p>' +
                '<p>Try one of these mirror links (opens in a new browser window):</p><ul>';
            params.kiwixDownloadMirrors.forEach(function (mirror) {
                downloadLinks.innerHTML += '<li class="console"><a href="' + mirror + '" target="_blank">' + mirror.replace(/^([^/]+\/\/[^/]+).*/, '$1') + '</a></li>';
            });
            downloadLinks.innerHTML += '</ul></div><br />';
        }
        downloadLinks.style.display = 'block';
    }

    function processMetaLink (doc) {
        // It's the metalink with download links
        var linkArray = doc.match(/<url\b[^>]*\bpriority="[^"]*"[^>]*>[^<]*<\/url>/ig) || [];
        var size = doc.match(/<size>(\d+)<\/size>/i);
        // Filter value (add comma separators if required)
        size = size ? size[1] : '';
        var megabytes = size ? Math.round(size * 10 / (1024 * 1024)) / 10 : size;
        // Use the lookbehind reversal trick to add commas....
        size = size.toString().split('').reverse().join('').replace(/(\d{3}(?!.*\.|$))/g, '$1,').split('').reverse().join('');
        var megabytes$ = megabytes.toString().split('').reverse().join('').replace(/(\d{3}(?!.*\.|$))/g, '$1,').split('').reverse().join('');
        doc = '';
        var kiwixMirrorUrl = '';
        var kiwixMirrorPriority = Infinity;
        for (var i = 0; i < linkArray.length; i++) {
            var urlMatch = linkArray[i].match(/<url\b[^>]*>([^<]*)<\/url>/i);
            if (urlMatch && /^https?:\/\/[^/]*\.kiwix\.org\//i.test(urlMatch[1])) {
                // Pick the *.kiwix.org URL with the lowest priority number (highest preference per meta4 spec)
                var prioMatch = linkArray[i].match(/\bpriority="(\d+)"/i);
                var prio = prioMatch ? parseInt(prioMatch[1], 10) : 999;
                if (prio < kiwixMirrorPriority) {
                    kiwixMirrorUrl = urlMatch[1];
                    kiwixMirrorPriority = prio;
                }
            }
            doc += linkArray[i].replace(/<url\b[^>]*>([^<]*)<\/url>/i, '<li><a href="$1"' + target + '>$1</a></li>\r\n');
        }
        var headerDoc = 'We found the following links to your file:';
        var returnUrl = currentBrowseUrl || URL.replace(/\/[^/]*\.meta4$/i, '/');
        var bodyDoc = '<p><a id="returnLink" href="#" data-kiwix-dl="' + escapeHtml(returnUrl) + '">&lt;&lt; Back to list of files</a></p>\r\n';
        bodyDoc += /\/(ted|videos)\//i.test(URL) && /UWP/.test(params.appType) ? '<h4 style="color:red">IMPORTANT: <b>VIDEOS</b> (e.g. TED Talks, Khan Academy, etc.) can be played in the UWP app on Windows 10, but on Windows 10 Mobile you may need to play the videos with an external app such as VLC Media Player (from the Store).</h4>\r\n<p>Please note if you cannot switch to Service Worker mode (see Configuration - Expert Settings) you will need to search for the videos using standard ZIM search or by typing a space in search to show the ZIM Archive Index, because the ZIM\'s proprietary UI does not work in Restricted mode.' : '';
        bodyDoc += /\/gutenberg\//i.test(URL) ? '<p>You can read Gutenberg books in this app, but please note that if you cannot switch to Service Worker mode (see Configuration - Expert Settings) you will need to search for books using standard or wildcard ZIM search (e.g. \'.*quixote\') or by typing a space in search to show the ZIM Archive Index, because the ZIM\'s proprietary UI does not work in Restricted mode.' : '';
        bodyDoc += '<h5';
        bodyDoc += megabytes > 2000 ? ' style="color:red;"> WARNING: ' : '>';
        bodyDoc += 'File size is <b>' + (megabytes ? megabytes$ + 'MB' : 'unknown') + '</b>' + (size ? ' (' + size + ' bytes)' : '') + '</h5>\r\n';
        bodyDoc += '<p><b>New! <i><a id="preview" target="_blank">Preview this archive</a></i></b> in your browser before downloading it</p>';
        if (megabytes > 1000) {
            bodyDoc += '<p><b>Consider using BitTorrent to download file:</b></p>\r\n<ul>' +
            '<li><b>BitTorrent file</b>: <a href="' + URL.replace(/\.meta4$/, '.torrent') + '"' + target + '>' +
                URL.replace(/\.meta4$/, '.torrent') + '</a></li>\r\n' +
             '<li><b>Magnet link</b>: <a id="magnet" href="' + URL.replace(/\.meta4$/, '.magnet') + '"' + target + '>' +
                URL.replace(/\.meta4$/, '.magnet') + '</a> (if torrent app doesn\'t launch, <a id="magnetAlt" href="#" target="_blank">tap here</a> and copy/paste link into your app)<br /></li></ul>\r\n';
        }
        var torrentDownloadAvailable = megabytes > 200 && torrentClient.isAvailable() && /\.zim\.meta4$/i.test(URL);
        if (torrentDownloadAvailable) {
            bodyDoc += '<p><b>In-app BitTorrent download, for larger archives (downloads to your selected ZIM folder):</b></p><ul>\r\n<li>' +
                '<a href="#" id="torrentDownloadLink" data-kiwix-torrent="' + escapeHtml(URL.replace(/\.meta4$/, '.torrent')) +
                '" style="background-color: green; color: yellow !important; padding: 2px 5px; border-radius: 3px; text-decoration: none;">Download via BitTorrent</a> (<i><b>recommended</b>: resumes automatically, even if interrupted by closing the app)</i></li></ul>\r\n';
        }
        if (megabytes > 4000 && /\.zim\.meta4$/i.test(URL)) {
            bodyDoc += '<p style="color:red;">If you plan to store this archive on a drive/microSD formatted as <b>FAT32</b> (most are not), then you will need to download the file on a PC and split it into chunks less than 4GB: see <a href="https://github.com/kiwix/kiwix-js-pwa/tree/main/AppPackages#download-a-zim-archive-all-platforms" target="_blank">Download a ZIM archive</a>.</p>\r\n';
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
        var mirrorZimUrl = kiwixMirrorUrl || (params.kiwixMirrorServer + URL.replace(/\.meta4$/i, '').replace(/^https?:\/\/[^/]+/, ''));
        if (params.useOPFS || (window.showSaveFilePicker && params.pickedFolder && params.pickedFolder.kind === 'directory')) {
            bodyDoc += '<p><b>Direct download';
            bodyDoc += params.useOPFS ? ' to Origin Private File System' : ' to your ZIM folder';
            bodyDoc += ', for smaller archives:</b> (<i>downloads archive in-app</i>)</p><ul>\r\n<li>' +
                '<a href="' + mirrorZimUrl + '" class="download" style="background-color: ' + (torrentDownloadAvailable ? 'goldenrod; color: navy !important' : 'green; color: yellow !important') +
                '; padding: 2px 5px; border-radius: 3px; text-decoration: none;">Direct download</a> ' +
                '<a href="' + mirrorZimUrl + '" class="download">' + mirrorZimUrl + '</a></li></ul>\r\n';
            bodyDoc += '<p><b>Browser-managed download from mirrors, for larger archives:</b>';
        } else {
            bodyDoc += '<p><b>Browser-managed download from mirrors:</b>';
        }
        bodyDoc += ' (<i>links open in a new browser window</i>)</p><ol>\r\n' + doc + '</ol>\r\n';
        bodyDoc += '<br /><br />';
        // Try to get magnet link
        if (megabytes > 200) requestXhttpData(URL.replace(/\.meta4$/, '.magnet'));
        setPanelContent('dl-panel-heading', headerDoc);
        var body = document.getElementById('dl-panel-body');
        if (body) body.innerHTML = bodyDoc;
        preserveFilterControls();
        downloadLinks.innerHTML = downloadLinks.innerHTML.replace(/Index\s+of/ig, 'File in');
        if (megabytes > 4000) downloadLinks.innerHTML = downloadLinks.innerHTML.replace(/border-success/i, 'border-danger');
        if (megabytes > 2000) downloadLinks.innerHTML = downloadLinks.innerHTML.replace(/border-success/i, 'border-warning');
        var langSel = document.getElementById('langs');
        var subjSel = document.getElementById('subjects');
        var dateSel = document.getElementById('dates');
        var submitSelectValues = function () {
            var langID = langSel ? langSel.value === 'All' ? '' : langSel.value : '';
            var subjID = subjSel ? subjSel.value === 'All' ? '' : subjSel.value : '';
            var dateID = dateSel ? dateSel.value === 'All' ? '' : dateSel.value : '';
            requestXhttpData(this.dataset.kiwixDl, langID, subjID, dateID);
        };
        // Add event listener for click on return link, to go back to list of archives
        var returnLink = document.getElementById('returnLink');
        if (returnLink) returnLink.addEventListener('click', submitSelectValues);
        // Add event listener for the in-app BitTorrent download link (Electron / NWJS only)
        var torrentLink = document.getElementById('torrentDownloadLink');
        if (torrentLink) {
            torrentLink.addEventListener('click', function (e) {
                e.preventDefault();
                startTorrentDownload(torrentLink.dataset.kiwixTorrent, megabytes$);
            });
        }
        // Set up preview link
        document.getElementById('preview').href = URL.replace(/^[^/]+\/\/[^/]+\/.+\/([^/]+)\.zim.+$/i, params.kiwixLibraryBrowser + '/content/$1');
        // If File System Access API is available, add event listeners on download links to save to local storage
        if (params.useOPFS || window.showSaveFilePicker) {
            var downloadUrls = document.getElementsByClassName('download');
            for (var j = 0; j < downloadUrls.length; j++) {
                downloadUrls[j].addEventListener('click', function (e) {
                    e.preventDefault();
                    if (!(params.pickedFolder && params.pickedFolder.kind === 'directory') || downloadSize > 0) return;
                    if (params.useOPFS) {
                        var quotaInMB = appstate.OPFSQuota / (1024 * 1024);
                        if (megabytes > quotaInMB) {
                            return uiUtil.systemAlert('<p>Sorry, the archive you selected is too large to download to your Origin Private File System.</p>' +
                                '<p>It is <b>' + megabytes$ + ' MB</b>, but your quota is only <b>' + quotaInMB.toFixed(1) + ' MB</b>.</p>' +
                                '<p>Please select a smaller archive, or else select a different download method.</p>', 'File too large');
                        }
                    }
                    var archiveUrl = mirrorZimUrl;
                    var archiveName = e.target.href.replace(/^.*\/([^/]+)$/, '$1');
                    var downloadArchiveWithFSA = function () {
                        downloadSize = megabytes;
                        uiUtil.pollOpsPanel('<span class="glyphicon glyphicon-refresh spinning"></span>&emsp;<b>Please wait:</b> Downloading archive... 0%', true);
                        return cache.downloadArchiveToPickedFolder(archiveName, archiveUrl, reportDownloadProgress).then(function () {
                            return uiUtil.systemAlert('<p>The archive ' + archiveName + ' has been downloaded to your device.</p>' +
                            (params.useOPFS ? '<p><b>Reloading to activate new ZIM...</b></p>' : ''), 'Download complete').then(function () {
                                if (params.useOPFS) {
                                    settingsStore.setItem('lastSelectedArchive', archiveName);
                                    window.location.reload();
                                } else {
                                    document.getElementById('btnRefresh').click();
                                }
                            });
                        }).catch(function (err) {
                            uiUtil.pollOpsPanel();
                            console.error(err);
                            downloadSize = 0;
                            percentageComplete = 0;
                            var message = 'Unable to download the archive ' + archiveName + ' to your device: ' + err;
                            if (/iOS/.test(params.appType) || /^((?!chrome|android).)*safari/i.test(navigator.userAgent)) message = '<p>Unfortunately, Safari and iOS browsers do not currently support downloading files directly into the OPFS. Please select a different download method.</p><p>Error message: ' + err.message + '</p>';
                            return uiUtil.systemAlert(message, 'Download failed').then(function () {
                                return cache.deleteOPFSEntry(archiveName);
                            });
                        });
                    }
                    if (megabytes > 1000) {
                        var message = '<p>Do you wish to download the following <b>large</b> archive ' + (params.useOPFS ? 'directly into the Origin Private File System' : 'to the current ZIM folder') +
                            '?</p><ul><li><i>' + archiveName + '</i> (<b>' + megabytes$ + ' MB</b>)</li></ul><p><b><i>If you proceed, do not close the app during the download.</i></b><p>' +
                            '<p>If you prefer to download in the background, use a browser-managed download link instead, and ' + (params.useOPFS
                            ? 'afterwards import the file into the OPFS using the "Add file(s)" button' : 'then move the file manually into your ZIM folder') + '.</p>';
                        var messageTitle = 'Download large archive to ' + (params.useOPFS ? 'OPFS?' : 'folder?');
                        uiUtil.systemAlert(message, messageTitle, true, 'Cancel', 'Download').then(function (result) {
                            if (result) downloadArchiveWithFSA();
                        });
                    } else {
                        downloadArchiveWithFSA();
                    }
                });
            }
        }
    }

    function processMagnetLink (link) {
        link = link.replace(/&amp;/g, '&');
        var magnetLink = document.getElementById('magnet');
        if (!magnetLink) return;
        // Set up backup link
        var magnetLinkAlt = document.getElementById('magnetAlt');
        magnetLinkAlt.href = magnetLink.href;
        // Now point main link to the magnet URL so torrent app will open if installed
        magnetLink.href = link;
        magnetLink.innerHTML = 'tap to launch link';
        magnetLink.removeAttribute('target');
        magnetLink.addEventListener('click', function (e) {
            e.preventDefault();
            window.location = this.href;
        });
    }

    function processXhttpData (doc) {
        // Remove images
        doc = doc.replace(/<img\b[^>]*>\s*/ig, '');
        // Reduce size of header
        doc = doc.replace(/<h1\b[^>]*>([^<]*)<\/h1>/ig, '<h3 id="indexHeader">$1</h3>');
        // Limit height of pre box and prevent word wrapping
        doc = doc.replace(/<pre>/i, '<div class="card border-success">\r\n' +
            '<pre id="dl-panel-heading" class="card-header" style="overflow-x:auto;word-wrap:normal;">$#$#</pre>\r\n' +
            '<pre id="dl-panel-body" class="card-body" style="max-height:360px;word-wrap:normal;margin-bottom:10px;overflow:auto;">');
        // Remove hr at end of page and add extra </div>
        doc = doc.replace(/<hr\b[^>]*>(\s*<\/pre>)/i, '$1</div>');
        // Remove any residual hr
        doc = doc.replace(/<hr>\s*<(\/?div|\/body)/ig, '<$1');
        // Move header into panel-header (NB regex is deliberately redundant to increase specificity of search)
        doc = doc.replace(/\$#\$#([\s\S]+?)(<a\s+href[^>]+>name<[\s\S]+?last\s+modified<[\s\S]+?)<hr>\s*/i, '$2$1');
        // If this failed, we're probably in a non-mirrored directory, so add simple header
        doc = doc.replace(/\$#\$#/, 'Name');
        if (/\dK|\dM|\dG/.test(doc)) {
            // Swap size and date fields to make file size more prominent on narrow screens
            doc = doc.replace(/(<a\b[^>]*>last\s+modified<\/a>\s*)(<a\b[^>]*>size<\/a>)\s*/ig, ' $2    $1');
            doc = doc.replace(/(\d{4}-\d\d-\d\d\s\d\d:\d\d)\s\s([\s\d.\w-]{7})$/img, ' $2 $1');
            // Remove unused README file
            doc = doc.replace(/^<a\s+href\b[^<]+README.+$[\r\n]*/m, '');
        }
        var stDoc; // Placeholder for standardized doc to be used to get arrays
        if (/^[^_\n\r]+_([^_\n\r]+)_.+\.zi[mp].+$/m.test(doc)) {
            // Delete lines that do not match regexpFilter (this ensures packaged apps only show ZIMs appropriate to the package)
            doc = regexpFilter ? doc.replace(regexpFilter, '') : doc;
            stDoc = getStandardizedDoc(doc);

            // Get language and date arrays
            var langArray = getLangArray(stDoc);
            var subjectArray = getSubjectArray(stDoc);
            var dateArray = getDateArray(stDoc);

            // Create dropdown language and date selectors
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
            // Add language, subject and date spans to doc
            if (/\/(mooc|phet|zimit|videos|other|dev)\b/i.test(URL)) {
                // doc = doc.replace(/^([^_\n\r]+_([^_\n\r\d]*)_?.*?(\d[\d-]+)\.zi[mp].+)$[\n\r]*/img, '<span class="wikiLang" lang="$2" data-kiwixdate="$3">$1<br /></span>');
                doc = doc.replace(/^(.+?_(?!all_)([a-z]{2,4}|nds-nl|be-tarask|map-bms|roa-tara|zh-classical)_.*?(\d[\d-]+)\.(?:zi[mp]|err).+|.+(\d[\d-]+)\.(?:zi[mp]|err).+)$[\n\r]*/img, '<span class="wikiLang" lang="$2" data-kiwixdate="$3">$1<br /></span>');
            } else if (/\/stack_exchange\b/i.test(URL)) {
                doc = doc.replace(/^([^>\n\r]+>(?:.+(stackoverflow)|([^.\n\r]+))\.([^_\n\r]+)_([^_\n\r]+)_.*?(\d[\d-]+)\.zi[mp].+)$[\n\r]*/img, '<span class="wikiLang" lang="$5" data-kiwixsubject="$2$3" data-kiwixdate="$6">$1<br /></span>');
            } else {
                doc = doc.replace(/^([^_\n\r]+_([^_\n\r]+)_((?:[^_]|_(?!maxi|mini|nopic|\d\d\d\d))+)_.*?(\d[\d-]+)\.zi[mp].+)$[\n\r]*/img, '<span class="wikiLang" lang="$2" data-kiwixsubject="$3" data-kiwixdate="$4">$1<br /></span>');
            }
            // Normalize languages with a - (from Stackexchange)
            doc = doc.replace(/(lang="\w+)-(\w+")/ig, '$1$2');
            doc = dropdownDate ? doc.replace(/<\/h3>/i, '</h3>' + (dropdownLang || dropdownSubj ? '' : '\r\n<div class="row">\r\n') + '<div class="col-4">Date:&nbsp;&nbsp;' + dropdownDate + '</div>\r\n</div>\r\n') : doc;
            doc = dropdownSubj ? doc.replace(/<\/h3>/i, '</h3>' + (dropdownLang ? '' : '\r\n<div class="row">\r\n') + '<div class="col-4">Subject:&nbsp;&nbsp;' + dropdownSubj + '</div>\r\n' + (dropdownDate ? '' : '</div>\r\n')) : doc;
            doc = dropdownLang ? doc.replace(/<\/h3>/i, '</h3>\r\n<div class="row">\r\n<div class="col-4">Language:&nbsp;&nbsp;' + dropdownLang + '</div>\r\n' + (dropdownSubj || dropdownDate ? '' : '</div>\r\n')) : doc;
        }
        downloadLinks.innerHTML = doc;
        var langSel = document.getElementById('langs');
        var subjSel = document.getElementById('subjects');
        var dateSel = document.getElementById('dates');
        var langPanel = document.getElementById('dl-panel-body');
        if (lang || subj || kiwixDate) {
            var rgxLang = lang ? new RegExp(lang, 'i') : null;
            var selectEntries = document.querySelectorAll('.wikiLang');
            // Hide all entries except specified language, subject, or date
            for (var i = 0; i < selectEntries.length; i++) {
                if (lang && lang !== 'All' && !rgxLang.test(selectEntries[i].lang)) selectEntries[i].style.display = 'none';
                if (subj && subj !== 'All' && selectEntries[i].dataset.kiwixsubject !== subj) selectEntries[i].style.display = 'none';
                if (kiwixDate && kiwixDate !== 'All' && selectEntries[i].dataset.kiwixdate !== kiwixDate) selectEntries[i].style.display = 'none';
            }
            if (langSel) langSel.value = lang || 'All';
            if (subjSel) subjSel.value = subj || 'All';
            if (dateSel) dateSel.value = kiwixDate || 'All';
        }
        if (langArray && langSel) {
            // Set up event listener for language selector
            langSel.addEventListener('change', function () {
                var dateID = dateSel ? dateSel.options[dateSel.selectedIndex].value : '';
                var subjID = subjSel ? subjSel.options[subjSel.selectedIndex].value : '';
                var langID = langSel ? langSel.options[langSel.selectedIndex].value : '';
                // Make langID into case-insensitive regex
                var rgxlangID = new RegExp(langID, 'i');
                // Reset any hidden entries
                // langPanel.innerHTML = langPanel.innerHTML.replace(/(display:\s*)none\b/mig, 'inline');
                var langEntries = langPanel.querySelectorAll('.wikiLang');
                // Hide all entries except specified language
                if (langID) {
                    for (var i = 0; i < langEntries.length; i++) {
                        if (rgxlangID.test(langEntries[i].lang) || langID === 'All') langEntries[i].style.display = 'inline';
                        if (!rgxlangID.test(langEntries[i].lang) && langID !== 'All') langEntries[i].style.display = 'none';
                        if (subjID && langEntries[i].dataset.kiwixsubject !== subjID && subjID !== 'All') langEntries[i].style.display = 'none';
                        if (dateID && langEntries[i].dataset.kiwixdate !== dateID && dateID !== 'All') langEntries[i].style.display = 'none';
                    }
                    var visibleZIMs = langPanel.innerText.match(/^.*?\.zi[mp]/mgi);
                    // Prune date list
                    if (dateID === 'All') {
                        var dateList = dateArray.join('\r\n');
                        dateList = dateList.replace(/^(.*)[\r\n]*/mg, function (p0, p1) {
                            var rgxDate = new RegExp('_' + p1 + '\\.zi', 'i');
                            if (p1 !== 'All' && !rgxDate.test(visibleZIMs)) return '';
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
                            if (p1 !== 'All' && !rgxSubject.test(visibleZIMs)) return '';
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
            // Set up event listener for subject selector
            subjSel.addEventListener('change', function () {
                var langID = langSel ? langSel.options[langSel.selectedIndex].value : '';
                var subjID = subjSel ? subjSel.options[subjSel.selectedIndex].value : '';
                var dateID = dateSel ? dateSel.options[dateSel.selectedIndex].value : '';
                var subjEntries = document.querySelectorAll('.wikiLang');
                // Hide all entries except specified subject
                if (subjID) {
                    for (var i = 0; i < subjEntries.length; i++) {
                        if (subjEntries[i].dataset.kiwixsubject === subjID || subjID === 'All') subjEntries[i].style.display = 'inline';
                        if (subjEntries[i].dataset.kiwixsubject !== subjID && subjID !== 'All') subjEntries[i].style.display = 'none';
                        if (langID && subjEntries[i].lang !== langID && langID !== 'All') subjEntries[i].style.display = 'none';
                        if (dateID && subjEntries[i].dataset.kiwixdate !== dateID && dateID !== 'All') subjEntries[i].style.display = 'none';
                    }
                    var visibleZIMs = langPanel.innerText.match(/^.*?\.zi[mp]/mgi);
                    // Prune the language list
                    if (langID === 'All') {
                        var langList = langArray.join('\r\n');
                        // We need to normalize language codes in langPanel (for Stackexchange)
                        // DEV: innerText doesn't include hidden items
                        var langTestPanel = langPanel.innerText.replace(/(_\w+)-(\w+_)/, '$1$2');
                        langList = langList.replace(/^(.*)[\r\n]*/mg, function (p0, p1) {
                            if (p1 !== 'All' && !~langTestPanel.indexOf('_' + p1 + '_')) return '';
                            return '<option value="' + p1 + '"' + (langID === p1 ? ' selected' : '') + '>' + p1 + (p1 === 'All' ? '' : ' : ' + langCodes[p1]) + '</option>';
                        });
                        langSel.innerHTML = langList;
                    }
                    // Prune date list
                    if (dateID === 'All') {
                        var dateList = dateArray.join('\r\n');
                        dateList = dateList.replace(/^(.*)[\r\n]*/mg, function (p0, p1) {
                            var rgxDate = new RegExp('_' + p1 + '\\.zi', 'i');
                            if (p1 !== 'All' && !rgxDate.test(visibleZIMs)) return '';
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
            // Set up event listener for date selector
            dateSel.addEventListener('change', function () {
                var langID = langSel ? langSel.options[langSel.selectedIndex].value : '';
                var subjID = subjSel ? subjSel.options[subjSel.selectedIndex].value : '';
                var dateID = dateSel ? dateSel.options[dateSel.selectedIndex].value : '';
                var dateEntries = document.querySelectorAll('.wikiLang');
                // Hide all entries except specified date
                if (dateID) {
                    for (var i = 0; i < dateEntries.length; i++) {
                        if (dateEntries[i].dataset.kiwixdate === dateID || dateID === 'All') dateEntries[i].style.display = 'inline';
                        if (dateEntries[i].dataset.kiwixdate !== dateID && dateID !== 'All') dateEntries[i].style.display = 'none';
                        if (langID && dateEntries[i].lang !== langID && langID !== 'All') dateEntries[i].style.display = 'none';
                        if (subjID && dateEntries[i].dataset.kiwixsubject !== subjID && subjID !== 'All') dateEntries[i].style.display = 'none';
                    }
                    var visibleZIMs = langPanel.innerText.match(/^.*?\.zi[mp]/mgi);
                    // Prune the language list
                    if (langID === 'All') {
                        var langList = langArray.join('\r\n');
                        // We need to normalize language codes in langPanel (for Stackexchange)
                        // DEV: innerText doesn't include hidden items
                        var langTestPanel = langPanel.innerText.replace(/(_\w+)-(\w+_)/, '$1$2');
                        langList = langList.replace(/^(.*)[\r\n]*/mg, function (p0, p1) {
                            if (p1 !== 'All' && !~langTestPanel.indexOf('_' + p1 + '_')) return '';
                            return '<option value="' + p1 + '"' + (langID === p1 ? ' selected' : '') + '>' + p1 + (p1 === 'All' ? '' : ' : ' + langCodes[p1]) + '</option>';
                        });
                        langSel.innerHTML = langList;
                    }
                    // Prune subject list
                    if (subjID === 'All') {
                        var subjList = subjectArray.join('\r\n');
                        subjList = subjList.replace(/^(.*)[\r\n]*/mg, function (p0, p1) {
                            // DEV: innerText doesn't include hidden items
                            var rgxSubject = new RegExp('_?' + p1 + '[._]', 'i');
                            if (p1 !== 'All' && !rgxSubject.test(visibleZIMs)) return '';
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
        var links = downloadLinks.getElementsByTagName('a');
        for (i = 0; i < links.length; i++) {
            // Store the href
            links[i].setAttribute('data-kiwix-dl', links[i].getAttribute('href'));
            // Preserve sort order
            if (!/\?C=\w;O=\w/.test(links[i].href)) links[i].href = '#';
            if (/\.\.\//.test(links[i].innerHTML)) links[i].innerHTML = 'Parent Directory';
            links[i].addEventListener('click', function (e) {
                e.preventDefault();
                var langSel = document.getElementById('langs');
                var subjSel = document.getElementById('subjects');
                var dateSel = document.getElementById('dates');
                var langID = langSel ? langSel.value : '';
                var dateID = dateSel ? dateSel.value : '';
                var subjID = subjSel ? subjSel.value : '';
                var replaceURL = URL + this.dataset.kiwixDl;
                // Allow both zim and zip format
                if (/\.zi[mp]$/i.test(this.dataset.kiwixDl)) {
                    replaceURL = replaceURL + '.meta4';
                } else if (/parent\s*directory|\.\.\//i.test(this.text)) {
                    replaceURL = URL.replace(/\/[^/]*\/$/i, '/');
                    replaceURL = replaceURL.replace(/\/archive\/$/, '/zim/');
                } else if (/Name|Size|Last\smodified|Description/.test(this.text)) {
                    replaceURL = this.getAttribute('href').replace(/;/g, '&');
                    replaceURL = URL + replaceURL;
                } else if (!/\/$/.test(this.text)) {
                    // Unrecognized filetype and it's not a directory, so prevent potentially harmful download
                    replaceURL = '';
                }
                requestXhttpData(replaceURL, langID, subjID, dateID);
            });
        }
        // Display the finished panel
        downloadLinks.style.display = 'block';
        document.getElementById('indexHeader').scrollIntoView();
        // document.getElementById('scrollbox').scrollTop += 65;

        // Standardize the document for array extraction
        function getStandardizedDoc (fromDoc) {
            // Add back any missing carriage returns
            var std = fromDoc.replace(/<\/span><span\b/ig, '\n');
            // Delete all lines without a wiki pattern from language list
            std = std.replace(/^(?![^_\n\r]+_([\w-]+)_.+$).*[\r\n]*/mg, '');
            // Delete any hidden lines
            std = std.replace(/^.*?display:\s*none;.*[\r\n]*/mg, '');
            return std;
        }

        // Get list of languages
        function getLangArray (fromDoc) {
            // Normalize line spacing
            fromDoc = fromDoc.replace(/[\r\n]+/g, '\n');
            // Deal first with two-code languages (the most common)
            // var langList = fromDoc.replace(/^[^_]+_([a-z]{2})_.+[\r\n]*/mg, '@$1\n');
            var langList = fromDoc.replace(/^.*_([a-z]{2})_.+[\r\n]*/mg, '@$1\n');
            // Now deal with longer language codes
            langList = langList.replace(/^(?!@).*?_(?!(?:all|maxi|mini|nopic)_)([a-z]{2,6}|nds-nl|be-tarask|map-bms|roa-tara|zh-classical)_.+[\r\n]*/mg, '@$1\n');
            // Normalize codes with hyphen
            langList = langList.replace(/^(@[a-z]+)-([a-z])/mg, function (p0, p1, p2) {
                return p1 + p2.toUpperCase();
            });
            // Remove placeholder
            langList = langList.replace(/^@/mg, '');
            // Delete recurrences
            langList = langList.replace(/\b([\w-]+\n)(?=[\s\S]*\b\1\n?)/g, '');
            langList = 'All\n' + langList;
            langList = langList.replace(/-/g, '');
            var langArray = langList.match(/^\w+$/mg);
            // Sort list alphabetically
            langArray.sort();
            return langArray;
        }

        // Get list of subjects
        function getSubjectArray (fromDoc) {
            // Get list of all subjects
            var subList;
            if (/\/(mooc|phet|zimit|videos|other|dev)\b/i.test(URL)) {
                return null;
            } else if (/\/stack_exchange\b/i.test(URL)) {
                subList = fromDoc.replace(/^(?:.+(stackoverflow)|[^"]+"([^.]+)).+[\r\n]/img, '$1$2\n');
            } else {
                subList = fromDoc.replace(/^[^"]+"[^_]+_[^_]+_((?:[^_]|_(?!maxi|mini|nopic|\d\d\d\d))+).+[\r\n]*/img, '$1\n');
            }
            // Delete recurrences
            subList = subList.replace(/^([\w_-]+)$[\r\n]*(?=[\s\S]*^\1$)/gm, '');
            // Remove 'all'
            subList = subList.replace(/^all$/mi, '');
            var subArray = subList.match(/^.+$/mg);
            if (subArray) {
                // Sort list alphabetically
                subArray.sort();
                // Add 'All' at astart
                subArray.unshift('All');
            }
            return subArray;
        }

        // Get list of dates
        function getDateArray (fromDoc) {
            // Get list of all dates
            var dateList = fromDoc.replace(/^.*?(\d+[-]\d+)\.(?:zi[mp]|err).+[\r\n]*/mig, '$1\n');
            // Delete recurrences
            dateList = dateList.replace(/(\b\d+[-]\d+)\n(?=[\s\S]*\b\1\n?)/g, '');
            dateList = 'All\n' + dateList;
            var dateArray = dateList.match(/^.+$/mg);
            // Sort list alphabetically
            dateArray.sort();
            dateArray.reverse();
            return dateArray;
        }
    }
}

var percentageComplete = 0;
var downloadSize = 0;

// State of any in-app BitTorrent download in progress ({ infoHash, name } or null)
var activeTorrent = null;
// A completed torrent that is still seeding in the background ({ infoHash, name } or null)
var seedingTorrent = null;
// A torrent start request that is waiting for the user to pick a download folder
var pendingTorrentUrl = null;

// settingsStore key remembering a BitTorrent download that is (or was) in progress, so that if
// the app is closed or crashes before it finishes, the user can be offered to resume it on the
// next launch. The partial data itself is always kept on disk regardless of this record; it
// only remembers where to find it again. Cleared as soon as the download finishes, fails, or is
// stopped by the user.
var ACTIVE_TORRENT_KEY = 'activeTorrentDownload';

/**
 * Remembers an in-progress BitTorrent download across app restarts
 * @param {String} torrentUrl The URL of the .torrent file being downloaded
 * @param {String} savePath The absolute path of the folder it is being saved into
 * @param {String} [name] The archive's name, once known, for a friendlier resume prompt
 */
function persistActiveTorrent (torrentUrl, savePath, name) {
    settingsStore.setItem(ACTIVE_TORRENT_KEY, JSON.stringify({
        torrentUrl: torrentUrl,
        savePath: savePath,
        name: name || null
    }), Infinity);
}

/**
 * Forgets any remembered in-progress BitTorrent download (called once it finishes, fails, or
 * is explicitly stopped, so that it is no longer offered for resumption on a future launch)
 */
function clearActiveTorrent () {
    settingsStore.removeItem(ACTIVE_TORRENT_KEY);
}

// If the user had to pick a folder before a torrent could start, the chosen path arrives
// here (as well as in app.js, which scans the folder and sets params.pickedFolder)
if (window.dialog && torrentClient.isAvailable()) {
    window.dialog.on('dir-dialog', function (fullPath) {
        if (pendingTorrentUrl && fullPath) {
            var torrentUrl = pendingTorrentUrl;
            pendingTorrentUrl = null;
            beginTorrentDownload(torrentUrl, fullPath.replace(/\\/g, '/'));
        }
    });
}

// If a BitTorrent download was still in progress when the app last quit (or crashed), offer to
// resume it now. Deferred to DOMContentLoaded, and further delayed with setTimeout, because the
// modal dialogue depends on bootstrap/jQuery having been injected, which is not guaranteed yet
// at this point on all platforms (see the similar splash-screen modal delay in app.js)
if (torrentClient.isAvailable()) {
    document.addEventListener('DOMContentLoaded', function () {
        var pendingResumeJSON = settingsStore.getItem(ACTIVE_TORRENT_KEY);
        var pendingResume = null;
        if (pendingResumeJSON) {
            try {
                pendingResume = JSON.parse(pendingResumeJSON);
            } catch (e) {
                pendingResume = null;
            }
        }
        if (!pendingResume || !pendingResume.torrentUrl || !pendingResume.savePath) return;
        setTimeout(function () {
            uiUtil.systemAlert('<p>A BitTorrent download of <i>' + escapeHtml(pendingResume.name || 'an archive') +
                '</i> did not finish because the app was closed.</p>' +
                '<p>Do you want to resume it now? (<i>The data already downloaded has been kept.</i>)</p>',
            'Resume BitTorrent download?', true, 'Discard', 'Resume').then(function (resume) {
                if (resume) {
                    beginTorrentDownload(pendingResume.torrentUrl, pendingResume.savePath);
                } else {
                    clearActiveTorrent();
                    torrentClient.deletePartial(pendingResume.savePath, pendingResume.name).catch(function (err) {
                        console.warn('[kiwixServe] Could not delete discarded partial download', err);
                    });
                }
            });
        }, 1500);
    });
}

/**
 * Entry point for the in-app BitTorrent download link: confirms with the user, obtains a
 * real filesystem path to download to, and starts the download; if a download is already
 * in progress, offers to stop it instead
 * @param {String} torrentUrl The URL of the .torrent file for the archive
 * @param {String} sizeMB The formatted size of the archive in MB (for display only)
 */
function startTorrentDownload (torrentUrl, sizeMB) {
    if (activeTorrent) {
        uiUtil.systemAlert('<p>A BitTorrent download is already in progress:</p><ul><li><i>' + escapeHtml(activeTorrent.name) + '</i></li></ul>' +
            '<p>Do you wish to stop it? (<i>Partially downloaded data will be kept, so the download can be resumed later.</i>)</p>',
        'Stop BitTorrent download?', true, 'Continue downloading', 'Stop download').then(function (result) {
            if (result && activeTorrent) {
                torrentClient.stop(activeTorrent.infoHash, false);
                activeTorrent = null;
                downloadSize = 0;
                percentageComplete = 0;
                clearActiveTorrent();
                uiUtil.pollOpsPanel();
                serverResponse.style.display = 'none';
            }
        });
        return;
    }
    // The torrent backend runs in the Node context and needs a real filesystem path, which is
    // derived from the picked folder (including FSA directory handles) where possible; we
    // resolve it before showing the dialogue so the destination (or the need to pick one) can
    // be stated up front
    torrentClient.resolveSavePath(params.pickedFolder).then(function (savePath) {
        var message = '<p>Do you wish to download this archive with the app\'s built-in BitTorrent client?</p>' +
            (sizeMB ? '<ul><li><b>' + sizeMB + ' MB</b></li></ul>' : '') +
            (savePath ? '<p>The archive will be downloaded to <b>' + escapeHtml(savePath) + '</b>.</p>' +
                '<p><label><input type="checkbox" id="torrentPickNewFolder">&nbsp;Download to a different folder&hellip;</label></p>'
                : '<p>You will be asked to choose the folder into which the archive should be downloaded (usually your ZIM folder).</p>') +
            '<p>The download can be resumed if it is interrupted — even by closing the app: you will be offered to continue it the next time you open the app. ' +
            'Your firewall may ask you (once) to allow the app to accept network connections: this is needed to exchange data with other BitTorrent users.</p>' +
            (params.keepTorrentSeeding ? '<p><i>After the download completes, the app will continue to share (seed) the archive with other users until you close the app. ' +
                'You can turn this off under Download library in Configuration.</i></p>' : '');
        uiUtil.systemAlert(message, 'Download via BitTorrent?', true, 'Cancel', 'Download').then(function (confirm) {
            if (!confirm) return;
            // The modal's content is still in the DOM after it closes, so the checkbox
            // (present only when a download path was derived) can be read here
            var pickNewFolder = document.getElementById('torrentPickNewFolder');
            if (savePath && !(pickNewFolder && pickNewFolder.checked)) {
                beginTorrentDownload(torrentUrl, savePath);
            } else if (window.dialog) {
                // No path could be derived, or the user asked to change folder: open the
                // native (path-returning) folder picker, whose result is also stored as the
                // new picked folder for subsequent downloads
                pendingTorrentUrl = torrentUrl;
                window.dialog.openDirectory();
            } else {
                uiUtil.systemAlert('<p>Unable to establish a folder to download the archive into. Please pick your ZIM folder in Configuration first.</p>', 'No download folder');
            }
        });
    });
}

/**
 * Starts the torrent download and wires its progress, completion and error events to the UI
 * @param {String} torrentUrl The URL of the .torrent file for the archive
 * @param {String} savePath The absolute path of the folder to download into
 */
function beginTorrentDownload (torrentUrl, savePath) {
    downloadSize = 0;
    percentageComplete = 0;
    // A torrent left seeding in the background must stop reporting to the status line now
    // that a new download is taking it over (the old torrent goes on seeding regardless)
    if (seedingTorrent) {
        torrentClient.detach(seedingTorrent.infoHash);
        seedingTorrent = null;
    }
    // Guards against a race where a torrent completes (or fails) before the start Promise
    // resolves, e.g. when resuming a file that is already fully downloaded
    var finished = false;
    // Remembered now (before the name is known) so that even a crash during the initial fetch
    // or hash-check of on-disk data is still offered for resumption on the next launch
    persistActiveTorrent(torrentUrl, savePath);
    uiUtil.pollOpsPanel('<span class="glyphicon glyphicon-refresh spinning"></span>&emsp;<b>Please wait:</b> Starting BitTorrent download...', true);
    torrentClient.start(torrentUrl, savePath, {
        onProgress: function (s) {
            if (s.verifying) {
                // The download has completed and the data written to disk is being hash-checked
                serverResponse.style.display = 'inline';
                serverResponse.style.setProperty('color', 'goldenrod', 'important');
                serverResponse.innerHTML = 'Verifying downloaded data&hellip; ' + Math.round(s.progress * 100) + '%';
            } else if (!s.done) {
                reportDownloadProgress(s.received, s.total);
                serverResponse.innerHTML += ' | ' + s.numPeers + ' peer' + (s.numPeers === 1 ? '' : 's') +
                    ' | ' + (s.downloadSpeed / 1048576).toFixed(2) + ' MB/s';
            } else if (s.seeding && serverResponse.style.display !== 'none') {
                // The download has completed, but we are still seeding the archive
                serverResponse.style.setProperty('color', 'green', 'important');
                serverResponse.innerHTML = 'Seeding ' + escapeHtml(s.name) + ': uploaded ' + (s.uploaded / 1048576).toFixed(1) +
                    ' MB (' + s.numPeers + ' peer' + (s.numPeers === 1 ? '' : 's') + ')';
            }
        },
        onDone: function (s) {
            finished = true;
            activeTorrent = null;
            clearActiveTorrent();
            if (s.seeding) {
                seedingTorrent = { infoHash: s.infoHash, name: s.name };
            } else {
                torrentClient.detach(s.infoHash);
            }
            reportDownloadProgress('completed');
            uiUtil.systemAlert('<p>The archive <i>' + escapeHtml(s.name) + '</i> has been downloaded to your device' +
                (s.verified ? ' and its data has been verified' : '') + '.</p>' +
                (s.seeding ? '<p><i>The app will go on sharing (seeding) this archive with other users until you close the app.</i></p>' : ''),
            'Download complete').then(function () {
                var btnRefresh = document.getElementById('btnRefresh');
                if (btnRefresh) btnRefresh.click();
            });
        },
        onError: function (message) {
            finished = true;
            activeTorrent = null;
            downloadSize = 0;
            percentageComplete = 0;
            clearActiveTorrent();
            uiUtil.pollOpsPanel();
            uiUtil.systemAlert('<p>The BitTorrent download failed:</p><p>' + escapeHtml(message) +
                '</p><p>Any partially downloaded data will be reused if you try again.</p>', 'Download failed');
        }
    }).then(function (status) {
        if (!finished) {
            activeTorrent = { infoHash: status.infoHash, name: status.name };
            // Update the remembered record with the archive's real name for a friendlier
            // resume prompt (a plain retry of the same call is cheap: settingsStore is local)
            persistActiveTorrent(torrentUrl, savePath, status.name);
        }
    }).catch(function (err) {
        activeTorrent = null;
        downloadSize = 0;
        percentageComplete = 0;
        clearActiveTorrent();
        uiUtil.pollOpsPanel();
        uiUtil.systemAlert('<p>Unable to start the BitTorrent download:</p><p>' + escapeHtml(err.message || err) + '</p>', 'Download failed');
    });
}

/**
 * Reports download progress to the serverResponse panel
 *
 * @param {String|Integer} received A string ('completed') or integer representing the download progress (in bytes)
 * @param {Integer} total An optional integer representing the total size of the download (in bytes)
 */
function reportDownloadProgress (received, total) {
    serverResponse.style.display = 'inline';
    var colour = received === 'completed' ? 'green' : isNaN(received) ? 'red' : 'goldenrod';
    serverResponse.style.setProperty('color', colour, 'important');
    var formattedData;
    downloadSize = total ? total / 1024 / 1024 : downloadSize;
    if (isNaN(received)) {
        formattedData = received;
    } else {
        var dataMB = (received / 1024 / 1024);
        // If data is greater than 1GB, convert to GB
        if (received > 1073741824) {
            formattedData = (dataMB / 1024).toFixed(2) + ' GB';
        } else {
            formattedData = dataMB.toFixed(2) + ' MB';
        }
        if (downloadSize > 0) {
            var percentageData = Math.floor(dataMB / downloadSize * 100);
            if (percentageData > percentageComplete) {
                percentageComplete = percentageData;
                uiUtil.pollOpsPanel('<span class="glyphicon glyphicon-refresh spinning"></span>&emsp;<b>Do not quit app:</b> Downloading archive... ' + percentageComplete + '% (' + formattedData + ')', true);
            }
        }
    }
    serverResponse.innerHTML = 'Download progress: ' + formattedData;
    if (received === 'completed') {
        uiUtil.pollOpsPanel('Download complete! 100%', 5000);
        percentageComplete = 0;
        downloadSize = 0;
        setTimeout(function () {
            serverResponse.style.removeProperty('color');
            if (document.getElementById('downloadLinks').style.display === 'none') {
                serverResponse.style.display = 'none';
            }
        }, 10000);
    }
}

/**
 * (Re)populates the "Seeding ..." status line from the torrent's current status and makes it
 * visible, so the user can monitor an ongoing background seed whenever they open the Library
 * panel (which otherwise hides the line). Subsequent live onProgress events then keep it current
 * while the panel is open. A no-op if nothing is currently seeding.
 */
function showSeedingStatus () {
    if (!seedingTorrent) return;
    torrentClient.getStatus(seedingTorrent.infoHash).then(function (s) {
        // The torrent may have been stopped in the meantime (e.g. seeding turned off)
        if (!s || !s.seeding || !seedingTorrent) return;
        serverResponse.style.display = 'inline';
        serverResponse.style.setProperty('color', 'green', 'important');
        serverResponse.innerHTML = 'Seeding ' + escapeHtml(s.name) + ': uploaded ' + (s.uploaded / 1048576).toFixed(1) +
            ' MB (' + s.numPeers + ' peer' + (s.numPeers === 1 ? '' : 's') + ')';
    }).catch(function (err) {
        console.warn('[kiwixServe] Could not refresh seeding status', err);
    });
}

/**
 * Clears the "Seeding ..." status line when the user turns off "Keep seeding". The backend
 * stops the completed torrent, but that also ends the onProgress events that drive the line,
 * so the renderer must detach the torrent and clear the now-frozen message itself. Has no
 * effect if nothing is currently seeding.
 */
function clearSeedingStatus () {
    if (!seedingTorrent) return;
    torrentClient.detach(seedingTorrent.infoHash);
    seedingTorrent = null;
    serverResponse.style.removeProperty('color');
    if (document.getElementById('downloadLinks').style.display === 'none') {
        serverResponse.style.display = 'none';
    } else {
        serverResponse.innerHTML = '';
    }
}

export default {
    // langCodes: langCodes,
    requestXhttpData: requestXhttpData,
    reportDownloadProgress: reportDownloadProgress,
    clearSeedingStatus: clearSeedingStatus,
    showSeedingStatus: showSeedingStatus
};
