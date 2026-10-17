#!/usr/bin/env node
/**
 * Checks that the Find in article search (Hilitor in www/js/lib/util.js) treats the text typed by the
 * user literally (#974).
 *
 * The typed text used to be turned into a RegExp as it was, in three places: apply() (which highlights),
 * countFullMatches() (which counts full matches) and scrollToFullMatch() (which finds the match to
 * scroll to). Text that is not a valid regular expression (c++, (, [, +1 ...) therefore threw a
 * SyntaxError, which left the highlights cleared but the match counters stale, and text that is a
 * valid one (f(x), 1+1, a.b) was searched for as a pattern instead of as itself.
 *
 * Hilitor works on the DOM, so these tests give it a minimal fake DOM with just the parts that
 * apply(), remove() and scrollToFullMatch() touch, and run the real source against it.
 *
 * Usage: npm test
 */

'use strict';

const path = require('path');
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { loadModuleSource } = require('./helpers.cjs');

const UTIL_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'util.js');
const utilSource = loadModuleSource(UTIL_JS);

// A minimal stand-in for the parts of the DOM used by Hilitor
class FakeText {
    constructor (value, parentNode) {
        this.nodeType = 3;
        this.nodeName = '#text';
        this.nodeValue = value;
        this.parentNode = parentNode;
        this.childNodes = [];
    }

    hasChildNodes () { return false; }

    // Like Text.splitText(): keeps the first part, and inserts the rest as a new sibling after this node
    splitText (offset) {
        // A pattern that matches an empty string would split forever in the real DOM too, so fail
        // instead of hanging the test run
        if (this.parentNode.childNodes.length > 200) throw new Error('Runaway highlighting');
        const after = new FakeText(this.nodeValue.slice(offset), this.parentNode);
        this.nodeValue = this.nodeValue.slice(0, offset);
        const siblings = this.parentNode.childNodes;
        siblings.splice(siblings.indexOf(this) + 1, 0, after);
        return after;
    }
}

class FakeElement {
    constructor (nodeName) {
        this.nodeType = 1;
        this.nodeName = nodeName;
        this.childNodes = [];
        this.className = '';
        this.style = { setProperty () {} };
    }

    hasChildNodes () { return this.childNodes.length > 0; }

    appendChild (child) {
        child.parentNode = this;
        this.childNodes.push(child);
        // Keeps innerHTML in step for elements holding only text, like the highlight elements
        if (child.nodeType === 3) this.innerHTML = (this.innerHTML || '') + child.nodeValue;
        return child;
    }

    insertBefore (newNode, referenceNode) {
        newNode.parentNode = this;
        this.childNodes.splice(this.childNodes.indexOf(referenceNode), 0, newNode);
        return newNode;
    }

    getElementsByClassName (className) {
        return this.childNodes.filter(function (child) { return child.className === className; });
    }

    replaceChild (newChild, oldChild) {
        newChild.parentNode = this;
        this.childNodes[this.childNodes.indexOf(oldChild)] = newChild;
    }

    normalize () {}
}

// scrollToFullMatch() scrolls the article iframe, so record what it is asked to scroll to
const scrolls = [];
const fakeArticleWindow = {
    document: { documentElement: { style: {} } },
    scrollTo: function () { scrolls.push(arguments); }
};

const fakeDocument = {
    documentElement: { style: {} },
    createElement: function (nodeName) { return new FakeElement(nodeName.toUpperCase()); },
    createTextNode: function (text) { return new FakeText(text, null); },
    getElementById: function () { return { contentWindow: fakeArticleWindow }; }
};

// The globals that util.js reads at run time
const fakeParams = { relativeFontSize: 100 };
const fakeAppstate = { isReplayWorkerAvailable: false };
const fakeWindow = { innerHeight: 800 };

// eslint-disable-next-line no-eval
const Hilitor = eval('(function (document, params, appstate, window) {\n' + utilSource + '\nreturn Hilitor;\n})')(
    fakeDocument, fakeParams, fakeAppstate, fakeWindow);

/**
 * Builds a fake <body> holding a single text node
 *
 * @param {String} text The text of the article
 * @returns {FakeElement} The fake body
 */
function makeBody (text) {
    const body = new FakeElement('BODY');
    body.appendChild(new FakeText(text, body));
    // countFullMatches() reads the HTML of the node
    body.innerHTML = text;
    return body;
}

/**
 * Runs a search the way findInArticleInitiate() in app.js does, and returns what it found
 *
 * @param {String} text The text of the article
 * @param {String} term The text typed in the Find in article box
 * @param {String} [matchType] The match type to set before applying, 'open' by default
 * @returns {{highlighted: String[], full: Number}} The highlighted strings and the full match count
 */
function search (text, term, matchType) {
    const body = makeBody(text);
    const hilitor = new Hilitor(body);
    hilitor.setMatchType(matchType || 'open');
    hilitor.apply(term);
    const highlighted = body.childNodes
        .filter(function (child) { return child.className === 'hilitor'; })
        .map(function (child) { return child.childNodes[0].nodeValue; });
    return { highlighted, full: hilitor.countFullMatches(term) };
}

/**
 * Applies a search and then asks Hilitor to scroll to the first full match, like findInArticleInitiate()
 *
 * @param {String} text The text of the article
 * @param {String} term The text typed in the Find in article box
 * @returns {Number} How many times the article iframe was scrolled
 */
function scrollsAfterSearch (text, term) {
    const body = makeBody(text);
    const hilitor = new Hilitor(body);
    hilitor.setMatchType('open');
    hilitor.apply(term);
    scrolls.length = 0;
    hilitor.scrollToFullMatch(term, 0);
    return scrolls.length;
}

describe('Find in article treats the typed text literally', function () {
    // [term, article text, expected highlighted strings]
    // Each article text also contains near misses that the term would match if it were read as a pattern
    const literalCases = [
        ['c++', 'cc c+ c++ ccc', ['c++']],
        ['(', 'a (b) c', ['(']],
        [')', 'a (b) c', [')']],
        ['[', 'x [1] y', ['[']],
        [']', 'x [1] y', [']']],
        ['+1', 'a +1 11 b', ['+1']],
        ['1+1', '11 1+1 111', ['1+1']],
        ['f(x)', 'fx f(x) f(y)', ['f(x)']],
        ['a*', 'aaa a* b', ['a*']],
        ['a.b', 'axb a.b a_b', ['a.b']],
        ['a?b', 'ab a?b b', ['a?b']],
        ['$5', 'costs $5 or 5', ['$5']],
        ['^x', 'x ^x y', ['^x']],
        ['x{2}', 'xx x{2} x', ['x{2}']],
        ['a|b', 'a b a|b', ['a|b']],
        ['foo)', 'foo foo) bar', ['foo)']],
        ['C:\\dir', 'C:dir C:\\dir', ['C:\\dir']]
    ];

    literalCases.forEach(function (c) {
        const term = c[0];
        const text = c[1];
        const expected = c[2];
        it('highlights ' + JSON.stringify(term) + ' and counts it', function () {
            const result = search(text, term);
            assert.deepEqual(result.highlighted, expected);
            assert.equal(result.full, expected.length);
        });
    });

    it('does not throw for text that is not a valid regular expression', function () {
        ['c++', '(', '[', '?', '+1', 'foo)', '*', '\\', '{', '}', '|', '^', '$'].forEach(function (term) {
            assert.doesNotThrow(function () { search('some text with c++ and (brackets)', term); }, JSON.stringify(term));
        });
    });

    it('scrolls to a match of text that is not a valid regular expression', function () {
        ['c++', '(', '[', '+1', 'foo)'].forEach(function (term) {
            assert.equal(scrollsAfterSearch('before ' + term + ' after', term), 1, JSON.stringify(term));
        });
    });

    it('does not scroll to text that would only match the term as a pattern', function () {
        assert.equal(scrollsAfterSearch('we have fx here', 'f(x)'), 0);
        assert.equal(scrollsAfterSearch('we have 11 here', '1+1'), 0);
    });

    it('finds each of several words, escaping each one', function () {
        const result = search('use c++ or f(x) here', 'c++ f(x)');
        assert.deepEqual(result.highlighted, ['c++', 'f(x)']);
    });

    it('still requires a whole word when neither end is open', function () {
        // Any type other than 'left', 'right' or 'open' leaves both ends closed
        assert.deepEqual(search('I like c++ and c+++', 'c++', 'word').highlighted, ['c++']);
        assert.deepEqual(search('gadgets', 'get', 'word').highlighted, []);
    });

    it('keeps accent-insensitive matching for ordinary text', function () {
        assert.deepEqual(search('un café noir', 'cafe').highlighted, ['café']);
        assert.deepEqual(search('naïve résumé', 'resume').highlighted, ['résumé']);
    });

    it('keeps matching non-ASCII text', function () {
        assert.deepEqual(search('東京 and 大阪', '大阪').highlighted, ['大阪']);
    });

    it('is case insensitive', function () {
        assert.deepEqual(search('Hello HELLO', 'hello').highlighted, ['Hello', 'HELLO']);
    });

    it('counts full matches of ordinary text as before', function () {
        assert.equal(search('one two one two one', 'one').full, 3);
    });
});
