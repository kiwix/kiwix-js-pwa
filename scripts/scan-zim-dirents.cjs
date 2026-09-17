#!/usr/bin/env node
'use strict';

/**
 * scripts/scan-zim-dirents.cjs — scan the directory entries of real ZIM archives for a pattern.
 *
 * WHY THIS EXISTS
 * Claims that "some ZIMs contain X in their titles/URLs" are easy to make and hard to check by eye.
 * This reads the directory entries of one or more archives directly and reports how often a pattern
 * really occurs, split by redirects, HTML entries and other entries, with examples.
 *
 * HOW IT WORKS
 * Directory entries are stored uncompressed, so no cluster is ever decompressed. The script reads the
 * header, loads the URL pointer list, sorts the offsets so that the entries are read in file order,
 * and parses them from large sequential chunks. Even an archive with millions of entries takes seconds.
 * See https://wiki.openzim.org/wiki/ZIM_file_format
 *
 * USAGE
 *   node scripts/scan-zim-dirents.cjs [options] <file.zim | directory> ...
 *
 * Directories are searched recursively for *.zim. Split archives (.zimaa etc.) are not supported.
 *
 * OPTIONS
 *   --pattern <regex>   Pattern to look for (default: \| — a literal pipe)
 *   --flags <flags>     Regex flags, e.g. i (default: none)
 *   --field <field>     title | url | any (default: any)
 *   --ns <chars>        Only entries in these namespaces, e.g. AC (default: all)
 *   --mime <regex>      Only non-redirect entries whose MIME type matches, e.g. html
 *   --redirects         Only redirect entries
 *   --examples <n>      Number of example matches to print per archive (default: 5)
 *   --json              Print one JSON object per archive instead of the text report
 *
 * EXAMPLE
 *   node scripts/scan-zim-dirents.cjs --field title --examples 3 W:\zim_tests D:\WIKI\some.zim
 */

const fs = require('fs');
const path = require('path');

const ZIM_MAGIC = 72173914;
const CHUNK_SIZE = 16 * 1024 * 1024;

function parseArgs (argv) {
    const opts = { pattern: '\\|', flags: '', field: 'any', ns: null, mime: null, redirects: false, examples: 5, json: false, paths: [] };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        switch (a) {
        case '--pattern': opts.pattern = argv[++i]; break;
        case '--flags': opts.flags = argv[++i]; break;
        case '--field': opts.field = argv[++i]; break;
        case '--ns': opts.ns = argv[++i]; break;
        case '--mime': opts.mime = new RegExp(argv[++i], 'i'); break;
        case '--redirects': opts.redirects = true; break;
        case '--examples': opts.examples = parseInt(argv[++i], 10); break;
        case '--json': opts.json = true; break;
        case '-h': case '--help':
            console.log(fs.readFileSync(__filename, 'utf8').match(/\/\*\*[\s\S]*?\*\//)[0]);
            process.exit(0);
            break;
        default:
            if (a.startsWith('--')) throw new Error('Unknown option ' + a);
            opts.paths.push(a);
        }
    }
    if (!/^(title|url|any)$/.test(opts.field)) throw new Error('--field must be title, url or any');
    opts.regex = new RegExp(opts.pattern, opts.flags);
    return opts;
}

function collectZims (paths) {
    const files = [];
    const walk = function (p) {
        let stat;
        try { stat = fs.statSync(p); } catch (e) { console.error('Cannot access ' + p); return; }
        if (stat.isDirectory()) {
            let children = [];
            try { children = fs.readdirSync(p); } catch (e) { return; }
            children.forEach(function (c) { walk(path.join(p, c)); });
        } else if (/\.zim$/i.test(p)) {
            files.push(p);
        } else if (/\.zim[a-z]{2}$/i.test(p)) {
            if (/\.zimaa$/i.test(p)) console.error('Skipping split archive (not supported): ' + p);
        }
    };
    paths.forEach(walk);
    return files;
}

function readMimeList (fd, pos) {
    const mimes = [];
    let size = 4096;
    for (;;) {
        const buf = Buffer.alloc(size);
        const len = fs.readSync(fd, buf, 0, size, pos);
        const end = buf.indexOf(Buffer.from([0, 0]));
        // The list ends with an empty string; make sure we have read all of it
        if (end === -1 && len === size) { size *= 4; continue; }
        let p = 0;
        while (p < len && buf[p] !== 0) {
            const e = buf.indexOf(0, p);
            mimes.push(buf.toString('utf8', p, e));
            p = e + 1;
        }
        return mimes;
    }
}

function scan (file, opts) {
    const fd = fs.openSync(file, 'r');
    try {
        const header = Buffer.alloc(80);
        fs.readSync(fd, header, 0, 80, 0);
        if (header.readUInt32LE(0) !== ZIM_MAGIC) throw new Error('Not a ZIM archive');
        const entryCount = header.readUInt32LE(24);
        const urlPtrPos = Number(header.readBigUInt64LE(32));
        const mimes = readMimeList(fd, Number(header.readBigUInt64LE(56)));

        const ptrs = Buffer.alloc(entryCount * 8);
        fs.readSync(fd, ptrs, 0, ptrs.length, urlPtrPos);
        const offsets = new Float64Array(entryCount);
        for (let i = 0; i < entryCount; i++) offsets[i] = Number(ptrs.readBigUInt64LE(i * 8));
        offsets.sort();

        const result = { file: file, entries: entryCount, scanned: 0, matches: 0, redirects: 0, html: 0, other: 0, inTitle: 0, inUrl: 0, examples: [] };
        const buf = Buffer.alloc(CHUNK_SIZE);
        let bufStart = -1;
        let bufLen = 0;

        for (let i = 0; i < entryCount; i++) {
            const offset = offsets[i];
            let entry = parseEntry(buf, offset - bufStart, bufLen);
            if (bufStart < 0 || !entry) {
                // Refill so that the chunk starts at this entry
                bufStart = offset;
                bufLen = fs.readSync(fd, buf, 0, CHUNK_SIZE, offset);
                entry = parseEntry(buf, 0, bufLen);
                if (!entry) throw new Error('Could not parse directory entry at offset ' + offset);
            }
            if (opts.ns && !opts.ns.includes(entry.namespace)) continue;
            if (opts.redirects && !entry.redirect) continue;
            const mimeType = entry.redirect ? 'redirect' : (mimes[entry.mimetypeInteger] || String(entry.mimetypeInteger));
            if (opts.mime && (entry.redirect || !opts.mime.test(mimeType))) continue;
            result.scanned++;
            const inTitle = opts.field !== 'url' && opts.regex.test(entry.title);
            const inUrl = opts.field !== 'title' && opts.regex.test(entry.url);
            if (!inTitle && !inUrl) continue;
            result.matches++;
            if (inTitle) result.inTitle++;
            if (inUrl) result.inUrl++;
            if (entry.redirect) result.redirects++;
            else if (/html/i.test(mimeType)) result.html++;
            else result.other++;
            if (result.examples.length < opts.examples) {
                result.examples.push({ type: mimeType, url: entry.namespace + '/' + entry.url, title: entry.title });
            }
        }
        return result;
    } finally {
        fs.closeSync(fd);
    }
}

/**
 * Parses a directory entry at pos in buf, or returns null if the entry is not entirely inside the buffer
 */
function parseEntry (buf, pos, len) {
    if (pos < 0 || pos + 16 > len) return null;
    const mimetypeInteger = buf.readUInt16LE(pos);
    const redirect = mimetypeInteger === 0xffff;
    const strStart = pos + (redirect ? 12 : 16);
    const urlEnd = buf.indexOf(0, strStart);
    if (urlEnd === -1 || urlEnd >= len) return null;
    const titleEnd = buf.indexOf(0, urlEnd + 1);
    if (titleEnd === -1 || titleEnd >= len) return null;
    return {
        mimetypeInteger: mimetypeInteger,
        redirect: redirect,
        namespace: String.fromCharCode(buf[pos + 3]),
        url: buf.toString('utf8', strStart, urlEnd),
        title: buf.toString('utf8', urlEnd + 1, titleEnd)
    };
}

function main () {
    let opts;
    try {
        opts = parseArgs(process.argv.slice(2));
    } catch (e) {
        console.error(e.message);
        process.exit(2);
    }
    const files = collectZims(opts.paths);
    if (!files.length) {
        console.error('No ZIM archives given. Run with --help for usage.');
        process.exit(2);
    }
    const totals = { archives: 0, withMatches: 0, entries: 0, matches: 0, redirects: 0 };
    files.forEach(function (file) {
        const started = Date.now();
        let r;
        try {
            r = scan(file, opts);
        } catch (e) {
            console.error(path.basename(file) + ': ERROR ' + e.message);
            return;
        }
        r.ms = Date.now() - started;
        totals.archives++;
        totals.entries += r.entries;
        totals.matches += r.matches;
        totals.redirects += r.redirects;
        if (r.matches) totals.withMatches++;
        if (opts.json) {
            console.log(JSON.stringify(r));
            return;
        }
        console.log(path.basename(file) + ': ' + r.matches + ' matches in ' + r.scanned + ' of ' + r.entries + ' entries' +
            (r.matches ? ' (redirects ' + r.redirects + ', html ' + r.html + ', other ' + r.other +
            '; in title ' + r.inTitle + ', in url ' + r.inUrl + ')' : '') + ' [' + r.ms + ' ms]');
        r.examples.forEach(function (ex) {
            console.log(('    [' + ex.type + '] ' + ex.url.slice(0, 120) + (ex.title ? '  ::  ' + ex.title.slice(0, 120) : '')).replace(/\s*[\r\n]\s*/g, ' '));
        });
    });
    if (!opts.json) {
        console.log('\n' + totals.archives + ' archives, ' + totals.entries + ' entries: ' + totals.matches + ' matches in ' +
            totals.withMatches + ' archives, of which ' + totals.redirects + ' redirects');
    }
}

main();
