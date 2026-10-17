#!/usr/bin/env node
/**
 * Checks the scoping of the in-app library to a packaged app's own archives, in www/js/lib/kiwixServe.js.
 *
 * Before the library moved to the OPDS catalogue, packaged apps (WikiMed, Wikivoyage) listed only their own kind of
 * archive, because regexpFilter deleted every other ZIM from the download server's directory listings. The OPDS
 * listings never applied it, so these apps showed the whole catalogue. A scope is now matched against each entry's
 * search text, which the filter textbox shares. The fixture holds real catalogue entries, chosen because each one
 * pins down a part of that text: mdwiki_en_all is medical only in its title and tags (its description says
 * "Healthcare"), librepathology_en_all only in its tags, and the internal "_category:" tags must not count.
 *
 * Usage: npm test
 */

'use strict';
/* eslint-disable no-unused-vars */

const path = require('path');
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { loadModuleSource, createMockDocument } = require('./helpers.cjs');

const KIWIX_SERVE_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'kiwixServe.js');
const kiwixServeSource = loadModuleSource(KIWIX_SERVE_JS);
const fixtureEntries = require('./fixtures/opds-library-entries.json');

const CATEGORIES_URL = 'https://opds.library.kiwix.org/catalog/v2/categories';
const ENTRIES_URL = 'https://opds.library.kiwix.org/catalog/v2/entries?count=-1';

/**
 * Builds a sandbox holding the real kiwixServe source, loaded as it would be in an app with the given packaged file
 *
 * @param {String} packagedFile The value of params.packagedFile ('' for the main app)
 * @returns {Object} The sandbox, exposing the functions under test
 */
function createMockEnvironment (packagedFile) {
    const mockParams = {
        appType: 'PWA',
        packagedFile: packagedFile,
        kiwixCatalogCategories: CATEGORIES_URL,
        kiwixCatalogEntries: ENTRIES_URL
    };
    const mockDocument = createMockDocument();

    /* eslint-disable no-eval */
    return eval(`(function () {
        var document = mockDocument;
        var params = mockParams;
        var window = {};
        // The module's imports: only torrentClient is read at load time
        var cache = {};
        var uiUtil = {};
        var settingsStore = {};
        var torrentClient = { isAvailable: function () { return false; } };
        ${kiwixServeSource}
        return {
            getLibraryScope: getLibraryScope,
            getLibraryStartUrl: getLibraryStartUrl,
            getEntrySearchText: getEntrySearchText,
            isEntryInScope: isEntryInScope,
            entryMatchesFilters: entryMatchesFilters,
            libraryScope: libraryScope
        };
    })()`);
    /* eslint-enable no-eval */
}

/**
 * Gives each fixture entry the search text that parseOpdsEntries would give it
 *
 * @param {Object} env The sandbox
 * @returns {Array<Object>} The fixture entries, with their search text and the fields the filters read
 */
function parsedEntries (env) {
    return fixtureEntries.map(function (entry) {
        const parsed = Object.assign({ languages: ['eng'], subject: '', date: '' }, entry);
        parsed.search = env.getEntrySearchText(parsed);
        return parsed;
    });
}

/**
 * Lists the names of the fixture entries that are in the scope of an app with the given packaged file
 *
 * @param {String} packagedFile The value of params.packagedFile
 * @returns {Array<String>} The names of the entries in scope
 */
function namesInScope (packagedFile) {
    const env = createMockEnvironment(packagedFile);
    return parsedEntries(env).filter(function (entry) {
        return env.isEntryInScope(entry, env.libraryScope);
    }).map(function (entry) {
        return entry.name;
    });
}

describe('getLibraryScope', function () {
    it('does not scope the main app', function () {
        assert.equal(createMockEnvironment('').getLibraryScope(''), null);
    });

    it('does not scope an app packaged with an archive it has no rule for', function () {
        assert.equal(createMockEnvironment('').getLibraryScope('wikipedia_en_100_maxi_2026-09.zim'), null);
    });

    it('scopes Wikivoyage to Wikivoyage archives', function () {
        assert.ok(createMockEnvironment('').getLibraryScope('wikivoyage_en_all_maxi_2026-09.zim').match.test('wikivoyage'));
    });

    it('scopes both kinds of WikiMed package to medical archives', function () {
        const env = createMockEnvironment('');
        assert.ok(env.getLibraryScope('mdwiki_en_all_maxi_2025-11.zim').match.test('medic'));
        assert.ok(env.getLibraryScope('wikipedia_en_medicine_maxi_2026-10.zim').match.test('medic'));
    });
});

describe('getLibraryStartUrl', function () {
    it('opens the main app on the category list', function () {
        assert.equal(createMockEnvironment('').getLibraryStartUrl(), CATEGORIES_URL);
    });

    it('opens a packaged app on the whole catalogue, which its scope then filters', function () {
        assert.equal(createMockEnvironment('mdwiki_en_all_maxi_2025-11.zim').getLibraryStartUrl(), ENTRIES_URL);
        assert.equal(createMockEnvironment('wikivoyage_en_all_maxi_2026-09.zim').getLibraryStartUrl(), ENTRIES_URL);
    });
});

describe('getEntrySearchText', function () {
    const env = createMockEnvironment('');
    const mdwiki = fixtureEntries[0];

    it('includes the title even when the entry has a description', function () {
        assert.ok(env.getEntrySearchText(mdwiki).includes('mdwiki medical encyclopedia'));
        assert.ok(env.getEntrySearchText(mdwiki).includes('healthcare articles'));
    });

    it('includes the descriptive tags, but not the internal ones', function () {
        const text = env.getEntrySearchText(fixtureEntries[5]);
        assert.ok(text.includes('wikivoyage'));
        assert.ok(!text.includes('_category'));
        assert.ok(!text.includes('_ftindex'));
    });

    it('copes with an entry that has no tags', function () {
        assert.equal(env.getEntrySearchText({ filename: 'a.zim', title: 'A', summary: 'B', tags: '' }), 'a.zim a b');
    });
});

describe('the library scope', function () {
    it('lets the main app list every entry', function () {
        assert.equal(namesInScope('').length, fixtureEntries.length);
    });

    it('lists every medical archive in WikiMed, including mdwiki and those that are medical only in their tags', function () {
        assert.deepEqual(namesInScope('mdwiki_en_all_maxi_2025-11.zim'), [
            'mdwiki_en_all', 'wikipedia_en_medicine', 'ted_mul_medicine', 'nhs.uk_en_medicines', 'librepathology_en_all'
        ]);
    });

    it('still lists everything that the old filename filter listed in WikiMed', function () {
        const inScope = namesInScope('mdwiki_en_all_maxi_2025-11.zim');
        fixtureEntries.filter(function (entry) {
            return /_medicine_|mdwiki_/.test(entry.filename);
        }).forEach(function (entry) {
            assert.ok(inScope.includes(entry.name), entry.name + ' is missing');
        });
    });

    it('lists only Wikivoyage archives, in every language, in Wikivoyage', function () {
        assert.deepEqual(namesInScope('wikivoyage_en_all_maxi_2026-09.zim'), ['wikivoyage_en_all', 'wikivoyage_de_all']);
    });
});

describe('the filter textbox', function () {
    it('finds mdwiki when the user types "medic"', function () {
        const env = createMockEnvironment('');
        const mdwiki = parsedEntries(env)[0];
        assert.equal(env.entryMatchesFilters(mdwiki, '', '', '', ['medic']), true);
    });
});
