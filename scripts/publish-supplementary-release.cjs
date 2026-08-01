#!/usr/bin/env node
/**
 * Publishes the auto-update payload to the supplementary "-E" GitHub release.
 *
 * Why this exists: the app's own version carries a semver prerelease identifier
 * ("3.8.8-E"), so electron-updater switches allowPrerelease on by itself and then
 * matches releases whose tag carries the *same* identifier (see
 * GitHubProvider.getLatestVersion). The "-E" tag is therefore the update channel,
 * and the channel ymls have to live in a release carrying it. Human visitors,
 * meanwhile, should land on the plain "v1.2.3" release with the notes and only the
 * files people actually download.
 *
 * Rather than publishing everything to one release and splitting it up afterwards,
 * this routes artefacts between the two releases at upload time, straight from the
 * build directory, so nothing is ever downloaded and re-uploaded.
 *
 * Usage:
 *   node scripts/publish-supplementary-release.cjs --version v3.8.8-E [options]
 *
 *   --version <tag>  Release version, with or without the -E suffix (required)
 *   --dir <path>     Build output directory (default: dist/bld/Electron)
 *   --repo <o/r>     Target repository (default: kiwix/kiwix-js-pwa)
 *   --target <ref>   Commit to tag if the release must be created (default: $GITHUB_SHA)
 *   --upload         Create the release and upload; omit for a dry run
 *
 * A dry run is the default so local builds can exercise this same code path without
 * any risk of touching a live release: it writes the rewritten ymls to
 * <dir>/supplementary/ and prints the routing table plus the commands it would run.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const yaml = require('js-yaml');

const RELEASE_TITLE = 'Supplementary installation files for Kiwix JS Electron';
const RELEASE_BODY = 'Autoupdate files ONLY. Please go to https://kiwix.github.io/kiwix-js-pwa/app for the main release.';

// Artefacts the updater needs alongside the channel ymls. Whether any of these ALSO
// stay on the human release is Publish-ElectronPackages.ps1's business, not ours: the
// web installer stub does (NsisUpdater downloads both it and the .7z package, and
// people download it directly too), while the fragments and blockmaps are pure
// plumbing. Anything not listed here is left entirely to the human release.
const UPDATER_ASSETS = [
    /\.nsis\.7z$/i, // nsis-web payload fragments, referenced from latest.yml
    /Web-Setup.*\.exe$/i, // nsis-web installer stub, fetched by NsisUpdater
    /\.blockmap$/i, // differential-download maps for the zip and nsis targets
    /-macOS-(?:x64|arm64)\.zip$/i // mac update payloads; inert until the macOS PR lands
];

function parseArgs (argv) {
    const opts = { dir: 'dist/bld/Electron', repo: 'kiwix/kiwix-js-pwa', target: process.env.GITHUB_SHA || '', upload: false };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--upload') opts.upload = true;
        else if (arg === '--version') opts.version = argv[++i];
        else if (arg === '--dir') opts.dir = argv[++i];
        else if (arg === '--repo') opts.repo = argv[++i];
        else if (arg === '--target') opts.target = argv[++i];
        else throw new Error('Unrecognized argument: ' + arg);
    }
    if (!opts.version) throw new Error('--version is required, e.g. --version v3.8.8-E');
    return opts;
}

/**
 * Derives the human release tag and the channel release tag from whatever form of
 * the version we were handed. Branded flavours (-WikiMed, -Wikivoyage) collapse onto
 * the same -E tag, matching the behaviour of Rewrite-DraftReleaseTag.ps1.
 */
function resolveTags (version) {
    const match = /^v?(\d+\.\d+\.\d+)/.exec(version);
    if (!match) throw new Error('Cannot parse a version number from "' + version + '"');
    const base = 'v' + match[1];
    return { base: base, tag: base + '-E' };
}

/**
 * The name an artefact ends up with as a release asset. Spaces become hyphens both on
 * upload and when electron-updater resolves a url, so we normalise the same way here.
 * Taking the basename also strips any prefix a previous run added, which is what makes
 * rewriting a yml idempotent.
 */
function assetName (url) {
    return path.posix.basename(String(url).replace(/\\/g, '/')).replace(/ /g, '-');
}

function isUpdaterAsset (name) {
    return UPDATER_ASSETS.some(function (pattern) { return pattern.test(name); });
}

function collectFiles (dir) {
    const found = [];
    // The nsis-web target writes its fragments to a subdirectory; everything else is flat
    [dir, path.join(dir, 'nsis-web')].forEach(function (searchDir) {
        if (!fs.existsSync(searchDir)) return;
        fs.readdirSync(searchDir, { withFileTypes: true }).forEach(function (entry) {
            if (entry.isFile()) found.push(path.join(searchDir, entry.name));
        });
    });
    return found;
}

/**
 * Points every url in a channel file at wherever that artefact actually ends up.
 * Assets uploaded alongside the yml keep a bare filename; anything living on the
 * human release gets a relative prefix, which the WHATWG URL parser collapses against
 * the release download path (".../download/v3.8.8-E/../v3.8.8/x" -> ".../download/v3.8.8/x").
 */
function rewriteChannelFile (doc, localNames, prefix) {
    const rewrite = function (url) {
        const name = assetName(url);
        return localNames.has(name.toLowerCase()) ? name : prefix + name;
    };
    if (Array.isArray(doc.files)) {
        doc.files.forEach(function (file) { file.url = rewrite(file.url); });
    }
    // Legacy single-file fields, still read by older clients; they mirror files[0]
    if (doc.path) doc.path = rewrite(doc.path);
    // nsis-web records its .7z fragment under packages.<arch>.path, which
    // electron-updater resolves separately from files[] (see Provider.resolveFiles)
    if (doc.packages) {
        Object.keys(doc.packages).forEach(function (arch) {
            const info = doc.packages[arch];
            if (info && info.path) info.path = rewrite(info.path);
        });
    }
    return doc;
}

function gh (args, opts) {
    return execFileSync('gh', args, Object.assign({ encoding: 'utf8' }, opts));
}

function ensureRelease (tag, repo, target) {
    try {
        gh(['release', 'view', tag, '--repo', repo], { stdio: 'pipe' });
        console.log('Supplementary release ' + tag + ' already exists.');
        return;
    } catch (err) {
        // `gh release view` exits non-zero when the release is absent, which is the
        // only case we want to act on; anything else will resurface on create below.
        console.log('Creating supplementary release ' + tag + '...');
    }
    const args = ['release', 'create', tag, '--repo', repo, '--prerelease', '--title', RELEASE_TITLE, '--notes', RELEASE_BODY];
    // Tag the commit that was actually built, rather than whatever the default branch
    // has moved on to since the workflow started
    if (target) args.push('--target', target);
    gh(args, { stdio: 'inherit' });
}

function main () {
    const opts = parseArgs(process.argv.slice(2));
    const tags = resolveTags(opts.version);
    const dir = path.resolve(opts.dir);
    if (!fs.existsSync(dir)) throw new Error('Build directory not found: ' + dir);

    const files = collectFiles(dir);
    const ymls = files.filter(function (f) { return /^latest.*\.yml$/i.test(path.basename(f)); });
    const payload = files.filter(function (f) { return isUpdaterAsset(path.basename(f)); });

    if (!ymls.length) throw new Error('No latest*.yml channel files found in ' + dir + ' - was the build run with electron-builder?');

    // Derived, not declared: a url stays bare exactly when that artefact is being
    // uploaded next to the yml. Change the routing table above and this follows.
    const localNames = new Set(payload.map(function (f) { return assetName(f).toLowerCase(); }));
    const prefix = '../' + tags.base + '/';

    const stagingDir = path.join(dir, 'supplementary');
    fs.mkdirSync(stagingDir, { recursive: true });

    const staged = ymls.map(function (file) {
        const doc = yaml.load(fs.readFileSync(file, 'utf8'));
        const out = path.join(stagingDir, path.basename(file));
        // Written to a staging directory rather than edited in place: the human-release
        // upload and the download.kiwix.org sync both still scan the build directory,
        // and neither should see rewritten urls. Both globs are non-recursive.
        fs.writeFileSync(out, yaml.dump(rewriteChannelFile(doc, localNames, prefix), { lineWidth: -1 }));
        return out;
    });

    console.log('\nSupplementary release: ' + tags.tag + '   (human release: ' + tags.base + ')');
    console.log('\nChannel files rewritten:');
    staged.forEach(function (f) {
        console.log('  ' + path.basename(f));
        const doc = yaml.load(fs.readFileSync(f, 'utf8'));
        (doc.files || []).forEach(function (file) { console.log('      files[]  ' + file.url); });
        Object.keys(doc.packages || {}).forEach(function (arch) { console.log('      pkg[' + arch + ']  ' + doc.packages[arch].path); });
    });
    console.log('\nUpdater assets routed to ' + tags.tag + ':');
    payload.forEach(function (f) { console.log('  ' + path.basename(f)); });
    if (!payload.length) console.log('  (none)');

    if (!opts.upload) {
        console.log('\nDry run: nothing uploaded. Rewritten ymls are in ' + stagingDir);
        console.log('Re-run with --upload to publish to ' + opts.repo + '.');
        return;
    }

    ensureRelease(tags.tag, opts.repo, opts.target);
    const uploads = staged.concat(payload);
    console.log('\nUploading ' + uploads.length + ' assets to ' + tags.tag + '...');
    // --clobber so a re-run of a failed job replaces assets rather than erroring
    gh(['release', 'upload', tags.tag, '--repo', opts.repo, '--clobber'].concat(uploads), { stdio: 'inherit' });
    console.log('\nDone.');
}

try {
    main();
} catch (err) {
    console.error('\nERROR: ' + err.message);
    process.exit(1);
}
