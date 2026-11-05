#!/usr/bin/env node
/**
 * Checks Table of Contents heading escaping and dropup generation in www/js/app.js (#1046).
 *
 * Validates that setupTableOfContents:
 * - Escapes HTML-significant characters in heading textContent (such as angle brackets in generic
 *   types like Uppercase<StringType>, ampersands, and quotes) so text is not parsed as markup.
 * - Escapes quotes in heading ids when generating data-heading-id attributes.
 * - Correctly sets font-size percentages for h1, h2, h3, and h4 headings.
 * - Skips headings below h4 (h5, h6).
 * - Hides the dropup when there is at most one heading.
 *
 * Usage: npm test
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { loadModuleSource } = require('./helpers.cjs');

const UTIL_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'util.js');
const utilSource = loadModuleSource(UTIL_JS);
// eslint-disable-next-line no-eval
const util = eval('(function () {\n' + utilSource + '\nreturn { escapeHtml: escapeHtml };\n})()');

const APP_JS = path.join(__dirname, '..', 'www', 'js', 'app.js');
const appSource = fs.readFileSync(APP_JS, 'utf8');
const match = appSource.match(/function setupTableOfContents \(\) \{[\s\S]*?\n\}/);
if (!match) {
    throw new Error('Could not find setupTableOfContents in www/js/app.js');
}

function createTocEnvironment (headings, relativeFontSize) {
    let dropupHtml = '';
    const dropupElement = {
        classList: {
            classes: new Set(['btn-default']),
            add: function (cls) { this.classes.add(cls); },
            remove: function (cls) { this.classes.delete(cls); }
        },
        style: {},
        innerHTML: ''
    };
    const ToCList = {
        style: {},
        set innerHTML (val) { dropupHtml = val; },
        get innerHTML () { return dropupHtml; },
        getElementsByTagName: function () { return []; }
    };
    const mockDocument = {
        getElementById: function (id) {
            if (id === 'articleContent') {
                return {
                    contentDocument: {}
                };
            }
            if (id === 'dropup') return dropupElement;
            if (id === 'ToCList') return ToCList;
            return {};
        }
    };
    const uiUtil = {
        ToC: function () {
            this.getHeadingObjects = function () {
                return headings.map(function (h, i) {
                    return {
                        id: h.id,
                        textContent: h.textContent,
                        tagName: h.tagName,
                        index: i
                    };
                });
            };
        }
    };
    const params = {
        relativeFontSize: relativeFontSize || 100,
        relativeUIFontSize: 100
    };
    const dropup = dropupElement;
    const window = { innerHeight: 800 };

    // eslint-disable-next-line no-eval
    const setupTableOfContents = eval('(function (document, uiUtil, util, params, dropup, window) {\n' +
        match[0] + '\nreturn setupTableOfContents;\n})')(mockDocument, uiUtil, util, params, dropup, window);

    setupTableOfContents();

    return {
        dropupHtml: dropupHtml,
        dropupElement: dropupElement,
        ToCList: ToCList
    };
}

describe('setupTableOfContents (#1046)', function () {
    it('escapes angle brackets and quotes in heading textContent and id', function () {
        const headings = [
            { id: 'heading-intro', textContent: 'Introduction', tagName: 'H1' },
            { id: 'heading-types', textContent: 'Uppercase<StringType>', tagName: 'H2' },
            { id: 'heading-"quote"', textContent: 'Comparison: a < b & c > d', tagName: 'H3' },
            { id: 'heading-ref', textContent: '/// <reference path="..." />', tagName: 'H4' }
        ];

        const env = createTocEnvironment(headings, 100);
        const html = env.dropupHtml;

        // Angle brackets and special characters in textContent must be escaped
        assert.ok(html.includes('>Uppercase&lt;StringType&gt;</a>'), 'Escapes <StringType> in H2');
        assert.ok(html.includes('>Comparison: a &lt; b &amp; c &gt; d</a>'), 'Escapes comparison in H3');
        assert.ok(html.includes('>/// &lt;reference path=&quot;...&quot; /&gt;</a>'), 'Escapes XML reference in H4');

        // Heading ids must be escaped for the attribute
        assert.ok(html.includes('data-heading-id="heading-&quot;quote&quot;"'), 'Escapes quotes in heading id');

        // Font sizes must match heading hierarchy
        assert.ok(html.includes('style="font-size:100%;"'), 'H1 font size 100%');
        assert.ok(html.includes('style="font-size:90%;"'), 'H2 font size 90%');
        assert.ok(html.includes('style="font-size:80%;"'), 'H3 font size 80%');
        assert.ok(html.includes('style="font-size:70%;"'), 'H4 font size 70%');
    });

    it('skips headings below h4 (h5 and h6)', function () {
        const headings = [
            { id: 'h1', textContent: 'Main', tagName: 'H1' },
            { id: 'h2', textContent: 'Sub', tagName: 'H2' },
            { id: 'h5', textContent: 'Deep Sub 5', tagName: 'H5' },
            { id: 'h6', textContent: 'Deep Sub 6', tagName: 'H6' }
        ];

        const env = createTocEnvironment(headings, 100);
        assert.ok(!env.dropupHtml.includes('Deep Sub 5'), 'H5 is skipped');
        assert.ok(!env.dropupHtml.includes('Deep Sub 6'), 'H6 is skipped');
    });

    it('hides dropup and ToCList when there is at most one heading', function () {
        const envSingle = createTocEnvironment([{ id: 'h1', textContent: 'Only Heading', tagName: 'H1' }]);
        assert.equal(envSingle.ToCList.style.visibility, 'hidden');
        assert.equal(envSingle.dropupElement.style.pointerEvents, 'none');

        const envEmpty = createTocEnvironment([]);
        assert.equal(envEmpty.ToCList.style.visibility, 'hidden');
        assert.equal(envEmpty.dropupElement.style.pointerEvents, 'none');
    });
});
