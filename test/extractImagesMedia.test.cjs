#!/usr/bin/env node
/**
 * Checks image and media extraction completion callback behavior in www/js/lib/images.js (#954).
 *
 * Usage: npm test
 */

'use strict';

const path = require('path');
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { loadModuleSource, createMockDocument } = require('./helpers.cjs');

const IMAGES_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'images.js');
const imagesSource = loadModuleSource(IMAGES_JS);

function createMockEnvironment (options) {
    options = options || {};
    const archiveFiles = options.archiveFiles || {
        'I/test.png': { mime: 'image/png', data: new Uint8Array([1, 2, 3]) },
        'M/video.mp4': { mime: 'video/mp4', data: new Uint8Array([4, 5, 6]) },
        'M/audio.mp3': { mime: 'audio/mp3', data: new Uint8Array([7, 8, 9]) }
    };

    const mockParams = {
        baseURL: 'https://localhost/test/',
        regexpZIMUrlWithNamespace: /^[A-Z-]\//,
        contentInjectionMode: 'jquery',
        manipulateImages: false,
        allowHTMLExtraction: false,
        zimType: 'standard'
    };

    const mockAppstate = { // eslint-disable-line no-unused-vars
        selectedArchive: {
            file: { name: 'test_archive.zim' },
            getDirEntryByPath: function (pathName) {
                return new Promise(function (resolve) {
                    if (archiveFiles[pathName]) {
                        resolve({
                            url: pathName,
                            getMimetype: function () {
                                return archiveFiles[pathName].mime;
                            }
                        });
                    } else {
                        resolve(null);
                    }
                });
            },
            readBinaryFile: function (dirEntry, callback) {
                const file = archiveFiles[dirEntry.url];
                if (callback) callback(dirEntry, file ? file.data : new Uint8Array(0));
            }
        }
    };

    const mockUiUtil = { // eslint-disable-line no-unused-vars
        deriveZimUrlFromRelativeUrl: function (relUrl) {
            return relUrl.replace(/^(\.\/|\/)/, '');
        },
        feedNodeWithBlob: function (node, attr, content, mime, manipulate, callback) {
            node[attr] = 'blob:' + (typeof content === 'string' ? content : 'mock');
            if (callback) callback();
        }
    };

    const mockElement = {
        style: {},
        innerHTML: '',
        setAttribute: function () {},
        appendChild: function () {},
        addEventListener: function () {}
    };

    const mockContainer = { // eslint-disable-line no-unused-vars
        kiwixType: 'iframe',
        document: createMockDocument({
            getElementById: function (id) {
                if (id === 'kiwixCCMenu') return {};
                return mockElement;
            },
            createElement: function () {
                return mockElement;
            }
        })
    };

    global.URL = {
        createObjectURL: function (blob) {
            return 'blob:mock-' + Math.random().toString(36).slice(2);
        }
    };

    global.Blob = function (parts, options) {
        this.parts = parts;
        this.type = options && options.type ? options.type : '';
    };

    // Evaluate in sandbox
    /* eslint-disable no-eval */
    const sandbox = eval(`(function () {
        var params = ${JSON.stringify(mockParams)};
        params.regexpZIMUrlWithNamespace = ${mockParams.regexpZIMUrlWithNamespace.toString()};
        var appstate = mockAppstate;
        var uiUtil = mockUiUtil;
        var container = mockContainer;
        var document = mockContainer.document;
        var articleContainer = { addEventListener: function () {} };
        ${imagesSource}
        return {
            extractImages: extractImages,
            insertMediaBlobsJQuery: insertMediaBlobsJQuery,
            getExtractorBusy: function () { return extractorBusy; }
        };
    })()`);
    /* eslint-enable no-eval */

    return sandbox;
}

function createMockNode (tagName, attrs) {
    attrs = attrs || {};
    const dataset = {};
    Object.keys(attrs).forEach(function (k) {
        if (k.startsWith('data-')) {
            const prop = k.slice(5).replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
            dataset[prop] = attrs[k];
        }
    });

    const node = {
        tagName: tagName.toUpperCase(),
        dataset: dataset,
        style: {},
        getAttribute: function (attr) { return attrs[attr] || null; },
        setAttribute: function (attr, val) { attrs[attr] = val; },
        removeAttribute: function (attr) { delete attrs[attr]; },
        getElementsByTagName: function () {
            return [];
        },
        hasAttribute: function (attr) { return Object.prototype.hasOwnProperty.call(attrs, attr); },
        load: function () {},
        addEventListener: function () {},
        appendChild: function () {}
    };

    const sources = (attrs.sources || []).map(function (s) {
        return {
            tagName: 'SOURCE',
            getAttribute: function (attr) { return s[attr] || null; },
            type: s.type || '',
            parentElement: node
        };
    });

    node.querySelectorAll = function (sel) {
        if (sel === 'source') return sources;
        return [];
    };

    node.parentElement = {
        insertBefore: function () {},
        appendChild: function () {}
    };

    return node;
}

function extractWithTimeout (sandbox, images, timeoutMs) {
    timeoutMs = timeoutMs || 500;
    return new Promise(function (resolve, reject) {
        let settled = false;
        const timer = setTimeout(function () {
            if (!settled) {
                settled = true;
                reject(new Error('extractImages timed out after ' + timeoutMs + 'ms (callback was not invoked)'));
            }
        }, timeoutMs);
        try {
            sandbox.extractImages(images, function () {
                if (!settled) {
                    settled = true;
                    clearTimeout(timer);
                    resolve(true);
                }
            });
        } catch (err) {
            if (!settled) {
                settled = true;
                clearTimeout(timer);
                reject(err);
            }
        }
    });
}

describe('Mixed collection (IMG + VIDEO + AUDIO) completion handling', function () {
    it('calls completion callback within timeout for mixed collections with multimedia', async function () {
        const sandbox = createMockEnvironment();
        const img1 = createMockNode('img', { 'data-kiwixurl': 'I/test.png' });
        const video1 = createMockNode('video', { src: 'M/video.mp4' });
        const audio1 = createMockNode('audio', { src: 'M/audio.mp3' });
        const img2 = createMockNode('img', { 'data-kiwixurl': 'I/test.png' });

        const completed = await extractWithTimeout(sandbox, [img1, video1, audio1, img2]);
        assert.equal(completed, true);
    });
});

describe('Media-only collections', function () {
    it('does not count media elements against extractorBusy', function () {
        const sandbox = createMockEnvironment();
        const videoNode = createMockNode('video', { src: 'M/video.mp4' });

        sandbox.extractImages([videoNode], function () {});
        assert.equal(sandbox.getExtractorBusy(), 0);
    });

    it('calls completion callback within timeout when collection only contains video elements', async function () {
        const sandbox = createMockEnvironment();
        const videoNode = createMockNode('video', { src: 'M/video.mp4' });

        const completed = await extractWithTimeout(sandbox, [videoNode]);
        assert.equal(completed, true);
    });
});

describe('Multi-source media elements (<video><source ...><source ...></video>)', function () {
    it('completes within timeout when media element contains multiple nested source tags', async function () {
        const sandbox = createMockEnvironment();
        const videoWithSources = createMockNode('video', {
            sources: [
                { src: 'M/video.mp4', type: 'video/mp4' },
                { src: 'M/audio.mp3', type: 'audio/mp3' }
            ]
        });

        const completed = await extractWithTimeout(sandbox, [videoWithSources]);
        assert.equal(completed, true);
    });
});

describe('Missing / invalid URLs and missing DirEntry handling', function () {
    it('completes within timeout without hanging when nodes have missing or invalid URLs', async function () {
        const sandbox = createMockEnvironment();
        const imgNoUrl = createMockNode('img', {});
        const videoInvalidUrl = createMockNode('video', { src: 'invalid-url' });
        const videoNotFound = createMockNode('video', { src: 'M/nonexistent.mp4' });

        const completed = await extractWithTimeout(sandbox, [imgNoUrl, videoInvalidUrl, videoNotFound]);
        assert.equal(completed, true);
    });
});

describe('Empty collection', function () {
    it('immediately invokes callback on empty collection', async function () {
        const sandbox = createMockEnvironment();
        const completed = await extractWithTimeout(sandbox, []);
        assert.equal(completed, true);
    });
});
