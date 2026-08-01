#!/usr/bin/env node
/**
 * Publishes Electron build artefacts to GitHub, routing each one to the human-facing
 * release, to the "-E" auto-update channel release, or to both.
 *
 * Why two releases: the app's own version carries a semver prerelease identifier
 * ("3.8.8-E"), so electron-updater switches allowPrerelease on by itself and then looks
 * for a release whose tag carries the *same* identifier (GitHubProvider.getLatestVersion).
 * The "-E" tag is therefore the update channel. Human visitors should instead land on the
 * plain "v3.8.8" release, with the notes and only the files people actually download.
 *
 * Artefacts are uploaded straight from the build directory, so nothing is ever downloaded
 * from one release and re-uploaded to another.
 *
 * Usage:
 *   node scripts/publish-github-release.cjs --version v3.8.8 [options]
 *
 *   --version <tag>  Release version, with or without the -E suffix (required)
 *   --dir <path>     Build output directory (default: dist/bld/Electron)
 *   --repo <o/r>     Target repository (default: kiwix/kiwix-js-pwa)
 *   --target <ref>   Commit to tag if the channel release must be created ($GITHUB_SHA)
 *   --only <regex>   Publish only artefacts whose filename matches (partial publishes)
 *   --no-channel     Publish to the human release only, leaving the channel untouched
 *   --skip-if-no-draft  Exit quietly when no draft release exists, mirroring the
 *                    electron-builder "onTagOrDraft" policy this replaces
 *   --upload         Actually create the release and upload; omit for a dry run
 *
 * A dry run is the default so local builds can exercise this same code path with no risk
 * of touching a live release: it writes the rewritten ymls to <dir>/channel/ and prints
 * the routing table and the commands it would run.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const yaml = require('js-yaml');

const CHANNEL_TITLE = 'Supplementary installation files for Kiwix JS Electron';
const CHANNEL_BODY = 'Autoupdate files ONLY. Please go to https://kiwix.github.io/kiwix-js-pwa/app for the main release.';

/**
 * Where each artefact goes. First match wins; anything unmatched defaults to 'human', so
 * a newly added target type shows up for users rather than silently vanishing into the
 * channel release. A '.blockmap' is routed with its parent artefact, because the updater
 * looks for it at <artefact-url>.blockmap.
 *
 * The nsis-web pieces have to be in both places, for two unrelated reasons. The web
 * installer stub resolves its .7z fragments from an APP_PACKAGE_URL compiled in at build
 * time, which app-builder-lib derives from the app version and so always points at the -E
 * tag (PublishManager.computeDownloadUrl); that URL cannot be redirected afterwards. But
 * Kiwix users on poor connections also install offline, from a USB stick holding the stub
 * and the fragments side by side, so the same files must be visible on the human release.
 */
const ROUTES = [
    { pattern: /^builder-debug\.yml$/i, to: 'skip' }, // build diagnostics, never published
    { pattern: /^latest.*\.yml$/i, to: 'channel' }, // update metadata, rewritten below
    { pattern: /\.nsis\.7z$/i, to: 'both' }, // see note above
    { pattern: /Web-Setup.*\.exe$/i, to: 'both' }, // ditto, and NsisUpdater fetches the stub
    { pattern: /-macOS-(?:x64|arm64)\.zip$/i, to: 'channel' } // mac update payload; humans get the .dmg
];

// The build directory also holds unpacked trees and assorted intermediates. Only these
// ever reach a release.
const PUBLISHABLE = /\.(exe|zip|msix|appx|appxbundle|7z|yml|blockmap|deb|rpm|AppImage|dmg)$/i;

function parseArgs (argv) {
    const opts = { dir: 'dist/bld/Electron', repo: 'kiwix/kiwix-js-pwa', target: process.env.GITHUB_SHA || '', upload: false };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--upload') opts.upload = true;
        else if (arg === '--no-channel') opts.noChannel = true;
        else if (arg === '--skip-if-no-draft') opts.skipIfNoDraft = true;
        else if (arg === '--version') opts.version = argv[++i];
        else if (arg === '--dir') opts.dir = argv[++i];
        else if (arg === '--repo') opts.repo = argv[++i];
        else if (arg === '--target') opts.target = argv[++i];
        else if (arg === '--only') opts.only = new RegExp(argv[++i], 'i');
        else throw new Error('Unrecognized argument: ' + arg);
    }
    if (!opts.version) throw new Error('--version is required, e.g. --version v3.8.8');
    return opts;
}

/**
 * Derives both release tags from whatever form of the version we were handed. Branded
 * flavours (-WikiMed, -Wikivoyage) collapse onto the same -E tag, matching the behaviour
 * of Rewrite-DraftReleaseTag.ps1 that this replaces.
 */
function resolveTags (version) {
    const match = /^v?(\d+\.\d+\.\d+)/.exec(version);
    if (!match) throw new Error('Cannot parse a version number from "' + version + '"');
    const base = 'v' + match[1];
    return { human: base, channel: base + '-E' };
}

/**
 * The name an artefact ends up with as a release asset. Spaces become hyphens both on
 * upload and when electron-updater resolves a url, so we normalise the same way here.
 * Taking the basename also strips any prefix a previous run added, which is what makes
 * rewriting a channel file idempotent.
 */
function assetName (url) {
    return path.posix.basename(String(url).replace(/\\/g, '/')).replace(/ /g, '-');
}

function routeFor (name) {
    const parent = name.replace(/\.blockmap$/i, '');
    const match = ROUTES.find(function (route) { return route.pattern.test(parent); });
    return match ? match.to : 'human';
}

function collectFiles (dir) {
    const found = [];
    // The nsis-web target writes its fragments to a subdirectory; everything else is flat
    [dir, path.join(dir, 'nsis-web')].forEach(function (searchDir) {
        if (!fs.existsSync(searchDir)) return;
        fs.readdirSync(searchDir, { withFileTypes: true }).forEach(function (entry) {
            if (entry.isFile() && PUBLISHABLE.test(entry.name)) found.push(path.join(searchDir, entry.name));
        });
    });
    return found;
}

/**
 * Points every url in a channel file at wherever that artefact actually ends up. Assets
 * uploaded alongside the yml keep a bare filename; anything living only on the human
 * release gets a relative prefix, which the WHATWG URL parser collapses against the
 * release download path (".../download/v3.8.8-E/../v3.8.8/x" -> ".../download/v3.8.8/x").
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
    // nsis-web records its .7z fragments under packages.<arch>.path, which electron-updater
    // resolves separately from files[] (see Provider.resolveFiles)
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

/** Locates the human-facing draft release, which keeps its plain vX.Y.Z tag throughout. */
function findDraft (humanTag, repo, skipIfMissing) {
    const raw = gh(['release', 'list', '--repo', repo, '--limit', '30', '--json', 'tagName,isDraft'], { stdio: 'pipe' });
    const match = JSON.parse(raw).find(function (release) {
        return release.isDraft && release.tagName.indexOf(humanTag) === 0;
    });
    if (match) return match.tagName;
    if (skipIfMissing) {
        console.log('\nNo draft release found whose tag starts with ' + humanTag + ' - nothing to publish.');
        return null;
    }
    throw new Error('No draft release found whose tag starts with ' + humanTag + '. Create it first with Create-DraftRelease.ps1.');
}

function ensureChannelRelease (tag, repo, target) {
    try {
        gh(['release', 'view', tag, '--repo', repo], { stdio: 'pipe' });
        console.log('Channel release ' + tag + ' already exists.');
        return;
    } catch (err) {
        // `gh release view` exits non-zero when the release is absent, which is the only
        // case we act on; any other failure resurfaces from the create below.
        console.log('Creating channel release ' + tag + '...');
    }
    // --prerelease keeps this release out of GitHub's "Latest" badge, so humans browsing the
    // repo still land on the real release. electron-updater finds it regardless, because it
    // reads the atom feed, which includes prereleases.
    const args = ['release', 'create', tag, '--repo', repo, '--prerelease', '--title', CHANNEL_TITLE, '--notes', CHANNEL_BODY];
    // Tag the commit that was actually built, not wherever the default branch has moved to
    if (target) args.push('--target', target);
    gh(args, { stdio: 'inherit' });
}

function upload (tag, repo, files) {
    if (!files.length) return;
    console.log('\nUploading ' + files.length + ' asset(s) to ' + tag + '...');
    // --clobber so re-running a failed job replaces assets rather than erroring
    gh(['release', 'upload', tag, '--repo', repo, '--clobber'].concat(files), { stdio: 'inherit' });
}

function main () {
    const opts = parseArgs(process.argv.slice(2));
    const tags = resolveTags(opts.version);
    const dir = path.resolve(opts.dir);
    if (!fs.existsSync(dir)) throw new Error('Build directory not found: ' + dir);

    const buckets = { human: [], channel: [], both: [], skip: [] };
    collectFiles(dir).forEach(function (file) {
        // --only supports jobs that build more than they publish, such as the branded and
        // nightly portable paths, which put a single zip on GitHub and nothing else
        if (opts.only && !opts.only.test(path.basename(file))) return;
        buckets[routeFor(path.basename(file))].push(file);
    });
    if (opts.noChannel) {
        buckets.human = buckets.human.concat(buckets.both);
        buckets.channel = [];
        buckets.both = [];
    }

    const ymls = buckets.channel.filter(function (f) { return /\.yml$/i.test(f); });
    // A build that produced no channel files at all almost certainly failed, so say so
    // rather than publishing a release the updater will never find. Partial publishes
    // declare themselves with --no-channel and are exempt.
    if (!ymls.length && !opts.noChannel) throw new Error('No latest*.yml channel files found in ' + dir + ' - was the build run with electron-builder? Use --no-channel for a partial publish.');

    // Derived, not declared: a url stays bare exactly when that artefact is uploaded next
    // to the yml. Change the routing table above and the rewriting follows.
    const localNames = new Set(buckets.channel.concat(buckets.both).map(function (f) { return assetName(f).toLowerCase(); }));
    const prefix = '../' + tags.human + '/';

    const stagingDir = path.join(dir, 'channel');
    fs.mkdirSync(stagingDir, { recursive: true });
    const staged = ymls.map(function (file) {
        const doc = yaml.load(fs.readFileSync(file, 'utf8'));
        const out = path.join(stagingDir, path.basename(file));
        // Staged rather than edited in place: the download.kiwix.org sync still scans the
        // build directory and should not see rewritten urls. Its glob is non-recursive.
        fs.writeFileSync(out, yaml.dump(rewriteChannelFile(doc, localNames, prefix), { lineWidth: -1 }));
        return out;
    });

    const humanUploads = buckets.human.concat(buckets.both);
    const channelUploads = staged.concat(buckets.channel.filter(function (f) { return !/\.yml$/i.test(f); }), buckets.both);

    console.log('\nHuman release:   ' + tags.human);
    console.log('Channel release: ' + tags.channel);
    console.log('\nChannel files rewritten:');
    staged.forEach(function (file) {
        console.log('  ' + path.basename(file));
        const doc = yaml.load(fs.readFileSync(file, 'utf8'));
        (doc.files || []).forEach(function (f) { console.log('      files[]   ' + f.url); });
        Object.keys(doc.packages || {}).forEach(function (arch) { console.log('      pkg[' + arch + ']  ' + doc.packages[arch].path); });
    });
    ['human', 'channel', 'both', 'skip'].forEach(function (route) {
        if (!buckets[route].length) return;
        console.log('\nRouted to ' + route + ':');
        buckets[route].forEach(function (f) { console.log('  ' + path.basename(f)); });
    });

    if (!opts.upload) {
        console.log('\nDry run: nothing uploaded. Rewritten ymls are in ' + stagingDir);
        console.log('Re-run with --upload to publish to ' + opts.repo + '.');
        return;
    }

    const draftTag = findDraft(tags.human, opts.repo, opts.skipIfNoDraft);
    if (!draftTag) return;
    upload(draftTag, opts.repo, humanUploads);
    if (channelUploads.length) {
        ensureChannelRelease(tags.channel, opts.repo, opts.target);
        upload(tags.channel, opts.repo, channelUploads);
    }
    console.log('\nDone.');
}

try {
    main();
} catch (err) {
    console.error('\nERROR: ' + err.message);
    process.exit(1);
}
