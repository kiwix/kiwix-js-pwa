#!/usr/bin/env node
/**
 * Checks DirEntry stringId serialization and deserialization in www/js/lib/zimDirEntry.js (#966).
 *
 * Usage: npm test
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ZIM_DIR_ENTRY_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'zimDirEntry.js');

function extractDirEntryFunctions (source) {
    return source
        .replace(/^\s*import\s+.*?;\s*$/gm, '')
        .replace(/^\s*export\s+default\s+[\s\S]*?;\s*$/gm, '');
}

const zimDirEntrySource = extractDirEntryFunctions(fs.readFileSync(ZIM_DIR_ENTRY_JS, 'utf8'));

/* eslint-disable no-eval */
const DirEntry = eval(`(function () {
    ${zimDirEntrySource}
    return DirEntry;
})()`);
/* eslint-enable no-eval */

let passes = 0;
let failures = 0;

function assert (desc, ok) {
    if (ok) {
        console.log(`  ok    ${desc}`);
        passes++;
    } else {
        console.error(`  FAIL  ${desc}`);
        failures++;
    }
}

const fakeZimFile = {
    mimeTypes: new Map([
        [0, 'text/plain'],
        [1, 'text/html'],
        [2, 'image/png']
    ]),
    blob: function () { return Promise.resolve(new Uint8Array([1, 2, 3])); }
};

function runTests () {
    console.log('DirEntry serialization with pipe characters (#966)');
    {
        const original = new DirEntry(fakeZimFile, {
            offset: 1234,
            mimetypeInteger: 1,
            namespace: 'C',
            cluster: 42,
            blob: 7,
            url: 'Bitwise_OR_operator',
            title: 'Bitwise | (OR) operator in C/C++',
            redirect: true,
            redirectTarget: 8888
        });

        const stringId = original.toStringId();
        const reconstructed = DirEntry.fromStringId(fakeZimFile, stringId);

        assert('String ID does not contain unencoded pipe in title', !stringId.includes('|Bitwise | (OR)'));
        assert('Reconstructs exact title with pipe', reconstructed.title === 'Bitwise | (OR) operator in C/C++');
        assert('Preserves redirect boolean as true', reconstructed.redirect === true);
        assert('Preserves numerical redirectTarget', reconstructed.redirectTarget === 8888);
        assert('isRedirect() returns true', reconstructed.isRedirect() === true);
        assert('getTitleOrUrl() returns original title', reconstructed.getTitleOrUrl() === 'Bitwise | (OR) operator in C/C++');
    }

    console.log('\nDirEntry serialization with multiple pipes in URL and title');
    {
        const original = new DirEntry(fakeZimFile, {
            offset: 5678,
            mimetypeInteger: 1,
            namespace: 'A',
            cluster: 100,
            blob: 3,
            url: 'regex|pattern|match',
            title: 'Title | with | multiple | pipes',
            redirect: false,
            redirectTarget: undefined
        });

        const stringId = original.toStringId();
        const reconstructed = DirEntry.fromStringId(fakeZimFile, stringId);

        assert('Reconstructs exact URL with multiple pipes', reconstructed.url === 'regex|pattern|match');
        assert('Reconstructs exact title with multiple pipes', reconstructed.title === 'Title | with | multiple | pipes');
        assert('Preserves redirect boolean as false', reconstructed.redirect === false);
        assert('Preserves undefined redirectTarget', reconstructed.redirectTarget === undefined);
        assert('isRedirect() returns false', reconstructed.isRedirect() === false);
    }

    console.log('\nDirEntry serialization with Unicode, emojis, quotes, and percent sequences');
    {
        const original = new DirEntry(fakeZimFile, {
            offset: 9012,
            mimetypeInteger: 2,
            namespace: 'I',
            cluster: 200,
            blob: 5,
            url: 'assets/image_%20_test#hash?q=1',
            title: 'Icons & "Quotes" & \'Apostrophes\' 📚 ∑ | Test',
            redirect: false,
            redirectTarget: undefined
        });

        const stringId = original.toStringId();
        const reconstructed = DirEntry.fromStringId(fakeZimFile, stringId);

        assert('Reconstructs exact URL with percent sequences and query/hash characters', reconstructed.url === 'assets/image_%20_test#hash?q=1');
        assert('Reconstructs exact Unicode title with emojis and quotes', reconstructed.title === 'Icons & "Quotes" & \'Apostrophes\' 📚 ∑ | Test');
        assert('Preserves offset, mimetypeInteger, namespace, cluster, blob',
            reconstructed.offset === 9012 &&
            reconstructed.mimetypeInteger === 2 &&
            reconstructed.namespace === 'I' &&
            reconstructed.cluster === 200 &&
            reconstructed.blob === 5
        );
        assert('fromArticleList is marked true on deserialized entry', reconstructed.fromArticleList === true);
    }

    console.log('\nDirEntry with empty or fallback title');
    {
        const original = new DirEntry(fakeZimFile, {
            offset: 3456,
            mimetypeInteger: 0,
            namespace: 'M',
            cluster: 0,
            blob: 0,
            url: 'Main_Page',
            title: '',
            redirect: false,
            redirectTarget: undefined
        });

        const stringId = original.toStringId();
        const reconstructed = DirEntry.fromStringId(fakeZimFile, stringId);

        assert('Reconstructs empty title', reconstructed.title === '');
        assert('getTitleOrUrl() falls back to url when title is empty', reconstructed.getTitleOrUrl() === 'Main_Page');
    }

    console.log('\nDirEntry robust parsing of malformed or legacy stringId');
    {
        // Malformed URI percent sequence in stringId should not throw
        const malformedStringId = '100|1|C|10|1|%ZZmalformed|%E0%A4%A|false|undefined';
        let parsed;
        let threw = false;
        try {
            parsed = DirEntry.fromStringId(fakeZimFile, malformedStringId);
        } catch (e) {
            threw = true;
        }

        assert('Does not throw URIError on malformed percent sequence', !threw);
        assert('Falls back gracefully to raw string', parsed.url === '%ZZmalformed');
    }

    console.log(`\nAll ${passes} checks passed${failures ? ` (${failures} failed)` : ''}\n`);
    if (failures > 0) {
        process.exit(1);
    }
}

runTests();
