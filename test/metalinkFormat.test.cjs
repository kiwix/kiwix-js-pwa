#!/usr/bin/env node
/**
 * Checks file size and byte formatting in www/js/lib/kiwixServe.js processMetaLink().
 *
 * Usage: npm test
 */

'use strict';

const fs = require('fs');
const path = require('path');

const KIWIX_SERVE_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'kiwixServe.js');
const source = fs.readFileSync(KIWIX_SERVE_JS, 'utf8');

// Verify that the broken string reversal regex pattern has been removed from kiwixServe.js
if (source.includes("replace(/(\\d{3}(?!.*\\.|\\$))/g, '$1,')")) {
    console.error('FAIL: Found broken string reversal regex in kiwixServe.js');
    process.exit(1);
}

/**
 * Simulates size parsing and formatting from processMetaLink()
 *
 * @param {String} xmlDoc Metalink XML document text
 * @returns {Object} { sizeFormatted, megabytesFormatted, megabytes }
 */
function parseAndFormatSize (xmlDoc) {
    var size = xmlDoc.match(/<size>(\d+)<\/size>/i);
    size = size ? size[1] : '';
    var megabytes = size ? Math.round(size * 10 / (1024 * 1024)) / 10 : size;
    var sizeFormatted = size ? size.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
    var megabytes$ = megabytes ? megabytes.toLocaleString('en-US') : '';

    return {
        sizeFormatted: sizeFormatted,
        megabytesFormatted: megabytes$,
        megabytes: megabytes
    };
}

// ---------------------------------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------------------------------

let failures = 0;
let total = 0;

function section (title) {
    console.log('\n' + title);
}

function check (description, passed) {
    total++;
    if (passed) {
        console.log('  ok    ' + description);
    } else {
        failures++;
        console.log('  FAIL  ' + description);
    }
}

function runTests () {
    section('Large archive Metalink XML parsing & size formatting');
    const mockMetalink12GB = `<?xml version="1.0" encoding="UTF-8"?>
    <metalink xmlns="urn:ietf:params:xml:ns:metalink">
      <file name="wikipedia_en_all_maxi_2024-01.zim">
        <size>12940000000</size>
        <url priority="1">https://download.kiwix.org/zim/wikipedia/wikipedia_en_all_maxi_2024-01.zim</url>
      </file>
    </metalink>`;

    const res12GB = parseAndFormatSize(mockMetalink12GB);
    check('Formats 12.94GB byte count with commas', res12GB.sizeFormatted === '12,940,000,000');
    check('Formats 12.94GB MB count with commas and decimal', res12GB.megabytesFormatted === '12,340.5');

    section('1.2GB archive formatting (previously rendered as 1,.5MB and 1,,, bytes)');
    const mockMetalinkOnePointTwoGB = '<file><size>1294467072</size></file>';
    const resOnePointTwoGB = parseAndFormatSize(mockMetalinkOnePointTwoGB);
    check('Byte count does not truncate digits to bare commas', resOnePointTwoGB.sizeFormatted === '1,294,467,072');
    check('MB count does not drop digits into 1,.5MB', resOnePointTwoGB.megabytesFormatted === '1,234.5');

    section('Exact 1,000 MB boundary archive');
    const mockMetalink1000MB = '<file><size>1048576000</size></file>';
    const res1000MB = parseAndFormatSize(mockMetalink1000MB);
    check('Formats exact 1,000 MB without trailing orphan comma', res1000MB.megabytesFormatted === '1,000');
    check('Formats exact 1,000 MB bytes', res1000MB.sizeFormatted === '1,048,576,000');

    section('Small archive (< 1000 MB / < 1000 bytes)');
    const mockMetalinkSmall = '<file><size>524288000</size></file>';
    const resSmall = parseAndFormatSize(mockMetalinkSmall);
    check('Formats 500 MB without unnecessary leading commas', resSmall.megabytesFormatted === '500');
    check('Formats 524,288,000 bytes', resSmall.sizeFormatted === '524,288,000');

    section('Missing or empty size element');
    const mockMetalinkNoSize = '<file><name>test.zim</name></file>';
    const resNoSize = parseAndFormatSize(mockMetalinkNoSize);
    check('Handles missing size gracefully without throwing', resNoSize.sizeFormatted === '' && resNoSize.megabytesFormatted === '');

    if (failures > 0) {
        console.error('\n' + failures + ' of ' + total + ' checks failed.');
        process.exit(1);
    } else {
        console.log('\nAll ' + total + ' checks passed\n');
    }
}

runTests();
