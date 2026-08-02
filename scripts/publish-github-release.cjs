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
 *   --version <tag>  Release version, with or without the -E suffix. Defaults to the
 *                    version in package.json, which is what electron-builder named the
 *                    artefacts after, so the tags and the filenames cannot disagree.
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
 *
 * Keeping them on the channel release matters for a third, less obvious reason. The in-app
 * update sniffer (www/js/lib/updater.js) scans release *asset filenames* for its baseApp
 * pattern - 'windows|electron|kiwixwebapp_' for the main app - to decide which release
 * belongs to this flavour's channel. If the channel release held nothing but ymls, no asset
 * would match, the sniffer's channelMatchedTag would stay undefined, and it would fall back
 * to the non-channel release. Both these entries carry "electron" in their names and so keep
 * that match alive. Do not reduce the channel release to metadata alone without checking
 * updater.js first.
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
    let i = 0;
    // Takes the next argv entry as a value, unless it is empty or is itself the next flag, in
    // which case none was given and it is left for the loop to read as a flag. Callers pass
    // "--version $INPUT_VERSION" from a workflow input that is legitimately blank on a nightly
    // or a plain rebuild, and a naive read would silently swallow the flag that follows.
    const value = function () {
        const next = argv[i + 1];
        if (!next || /^--/.test(next)) return '';
        i++;
        return next;
    };
    for (; i < argv.length; i++) {
        const arg = argv[i];
        if (!arg) continue; // an empty value left behind by a blank workflow input
        if (arg === '--upload') opts.upload = true;
        else if (arg === '--no-channel') opts.noChannel = true;
        else if (arg === '--skip-if-no-draft') opts.skipIfNoDraft = true;
        else if (arg === '--version') opts.version = value();
        else if (arg === '--dir') opts.dir = value() || opts.dir;
        else if (arg === '--repo') opts.repo = value() || opts.repo;
        else if (arg === '--target') opts.target = value();
        else if (arg === '--only') opts.only = new RegExp(value() || '.', 'i');
        else throw new Error('Unrecognized argument: ' + arg);
    }
    if (!opts.version) opts.version = versionFromPackageJson();
    return opts;
}

/**
 * The fallback when no version was passed. electron-builder derives every artefact name from
 * this same field, so reading it here is what guarantees the release tags line up with the
 * files being uploaded - deriving it from init.js or a workflow input could not promise that.
 */
function versionFromPackageJson () {
    const file = path.resolve('package.json');
    if (!fs.existsSync(file)) throw new Error('No --version given and no package.json in ' + process.cwd() + ' to fall back on');
    const version = JSON.parse(fs.readFileSync(file, 'utf8')).version;
    if (!version) throw new Error('No --version given and package.json has no "version" field');
    console.log('No --version given; using the version in package.json: ' + version);
    return version;
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
 * The name an artefact ends up with as a release asset. electron-builder's own GitHub
 * publisher replaced spaces with hyphens, so every release to date carries names like
 * Kiwix-JS-Electron-Setup-3.8.8-E.exe, and the urls inside the channel ymls have to match.
 * Taking the basename also strips any prefix a previous run added, which is what makes
 * rewriting a channel file idempotent.
 */
function assetName (url) {
    return path.posix.basename(String(url).replace(/\\/g, '/')).replace(/ /g, '-');
}

/**
 * Renames artefacts on disk to the names they must carry as release assets.
 *
 * This is not cosmetic. `gh release upload` posts the basename verbatim and GitHub replaces
 * each space with a *dot*, giving Kiwix.JS.Electron.Setup.3.8.9-E.exe - whereas
 * electron-builder, which used to do the uploading, replaced spaces with hyphens. Renaming
 * first keeps the asset names identical to every previous release, and keeps them matching
 * the urls assetName writes into the rewritten channel ymls; without it the updater would
 * fetch a url that 404s. Both download.kiwix.org sync scripts collapse spaces and hyphens
 * to underscores alike and re-glob the directory, so neither notices the change.
 */
function normaliseNames (files) {
    return files.map(function (file) {
        const target = path.join(path.dirname(file), assetName(file));
        if (target === file) return file;
        fs.renameSync(file, target);
        return target;
    });
}

function routeFor (name) {
    const parent = name.replace(/\.blockmap$/i, '');
    const match = ROUTES.find(function (route) { return route.pattern.test(parent); });
    return match ? match.to : 'human';
}

function collectFiles (dir) {
    const found = [];
    // Release assets are keyed by name, so two files sharing one basename can never both be
    // uploaded - and passing both to `gh release upload --clobber` makes it delete the asset
    // it just created and fail with a 404. nsis-web writes its own copy of latest.yml next to
    // the fragments, so this is the normal case, not a corner one. The root directory is
    // scanned first and wins, because that is the copy electron-builder leaves as
    // authoritative and the one the download.kiwix.org sync in Publish-ElectronPackages sees.
    const seen = new Set();
    // The nsis-web target writes its fragments to a subdirectory; everything else is flat
    [dir, path.join(dir, 'nsis-web')].forEach(function (searchDir) {
        if (!fs.existsSync(searchDir)) return;
        fs.readdirSync(searchDir, { withFileTypes: true }).forEach(function (entry) {
            if (!entry.isFile() || !PUBLISHABLE.test(entry.name)) return;
            const key = assetName(entry.name).toLowerCase();
            if (seen.has(key)) {
                console.log('Ignoring duplicate ' + path.join(searchDir, entry.name) + ' (already found in ' + dir + ')');
                return;
            }
            seen.add(key);
            found.push(path.join(searchDir, entry.name));
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

/**
 * Locates the human-facing draft release, which keeps its plain vX.Y.Z tag throughout.
 *
 * The prefix match is for branded flavours, whose draft is tagged vX.Y.Z-WikiMed or
 * -Wikivoyage. It has to exclude the channel tag explicitly: "v3.8.9-E" also starts with
 * "v3.8.9", the channel release is a draft too, and `gh release list` returns newest first -
 * so once this run has created the channel release, every later job in the same build would
 * otherwise pick it up as "the draft" and upload the human artefacts into it.
 */
function findDraft (humanTag, channelTag, repo, skipIfMissing) {
    const raw = gh(['release', 'list', '--repo', repo, '--limit', '30', '--json', 'tagName,isDraft'], { stdio: 'pipe' });
    const drafts = JSON.parse(raw).filter(function (release) {
        return release.isDraft && release.tagName !== channelTag;
    });
    const match = drafts.find(function (release) { return release.tagName === humanTag; }) ||
        drafts.find(function (release) { return release.tagName.indexOf(humanTag) === 0; });
    if (match) return match.tagName;
    if (skipIfMissing) {
        console.log('\nNo draft release found whose tag starts with ' + humanTag + ' - nothing to publish.');
        return null;
    }
    throw new Error('No draft release found whose tag starts with ' + humanTag + '. Create it first with Create-DraftRelease.ps1.');
}

/**
 * Counts releases carrying this tag. Listed rather than `gh release view`, which resolves a
 * tag through an API endpoint that only returns published releases - it would miss the draft
 * created below and try to create it again on every run. A count rather than a boolean
 * because GitHub does allow two *drafts* to share a tag name (no git ref exists until
 * publication), and this build's jobs run in parallel.
 */
function countReleases (tag, repo) {
    const raw = gh(['release', 'list', '--repo', repo, '--limit', '30', '--json', 'tagName'], { stdio: 'pipe' });
    return JSON.parse(raw).filter(function (release) { return release.tagName === tag; }).length;
}

function ensureChannelRelease (tag, repo, target) {
    if (countReleases(tag, repo)) {
        console.log('Channel release ' + tag + ' already exists.');
        return;
    }
    console.log('Creating channel release ' + tag + ' as a draft...');
    // --draft matters as much as anything else here. A published channel release is live
    // the instant it exists: it enters the atom feed, and every installed app at a lower
    // version starts chasing its artefacts. During a test build those artefacts sit in an
    // unpublished draft, so users would be offered an update that 404s. Creating it as a
    // draft also means no git tag is cut until the release is actually published, so a
    // test run leaves nothing behind. Publish it by hand alongside the human release.
    //
    // --prerelease is what it becomes on publication: it keeps the channel release out of
    // GitHub's "Latest" badge so humans browsing the repo land on the real release.
    // electron-updater finds it regardless, because the atom feed includes prereleases.
    const args = ['release', 'create', tag, '--repo', repo, '--draft', '--prerelease', '--title', CHANNEL_TITLE, '--notes', CHANNEL_BODY];
    // Tag the commit that was actually built, not wherever the default branch has moved to
    if (target) args.push('--target', target);
    gh(args, { stdio: 'inherit' });
    // The Windows, Linux and macOS jobs run concurrently and each publishes for itself, so
    // two of them can pass the check above before either creates. GitHub accepts both, and
    // the assets then split silently across two identically tagged drafts. Fail loudly here
    // instead: it is trivial to fix by hand and near-impossible to spot afterwards.
    if (countReleases(tag, repo) > 1) {
        throw new Error('Two draft releases are now tagged ' + tag + ', created by concurrent jobs. Delete the empty one on GitHub and re-run this job.');
    }
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

    // --only supports jobs that build more than they publish, such as the branded and
    // nightly portable paths, which put a single zip on GitHub and nothing else. It is
    // matched against the on-disk name, before any renaming, so that a caller can pass a
    // literal filename it has just built (Publish-ElectronPackages -test does exactly that).
    let files = collectFiles(dir).filter(function (file) {
        return !opts.only || opts.only.test(path.basename(file));
    });
    // Renaming only when actually uploading keeps a dry run read-only; the listing below
    // reports asset names either way, so a dry run still shows what would be published.
    if (opts.upload) files = normaliseNames(files);

    const buckets = { human: [], channel: [], both: [], skip: [] };
    // Routed on the asset name rather than the on-disk name, so that a pattern written the
    // way the file appears on the release ("Web-Setup") matches a build output that spells
    // it with spaces ("Kiwix JS Electron Web Setup 3.8.9-E.exe")
    files.forEach(function (file) { buckets[routeFor(assetName(file))].push(file); });
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
        buckets[route].forEach(function (f) { console.log('  ' + assetName(f)); });
    });

    if (!opts.upload) {
        console.log('\nDry run: nothing uploaded. Rewritten ymls are in ' + stagingDir);
        console.log('Re-run with --upload to publish to ' + opts.repo + '.');
        return;
    }

    const draftTag = findDraft(tags.human, tags.channel, opts.repo, opts.skipIfNoDraft);
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
