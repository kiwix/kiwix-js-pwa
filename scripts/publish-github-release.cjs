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
 * The oldest macOS that may ever be offered the modern macOS build, as a Darwin kernel
 * version: Darwin 21 is macOS 12 Monterey, the floor of the Electron we currently ship.
 *
 * This is a floor, not a fixed value. The real figure is read from the built app below and
 * the higher of the two wins, so an Electron that raises its own floor is followed
 * automatically; the constant only takes over if that read fails, and must never be lowered
 * below the oldest macOS a modern build actually runs on.
 *
 * Do not assume this tracks whatever the release notes claim. It was first written as 20.0.0
 * on the documented belief that Electron 43 needed only Big Sur; the build reported macOS
 * 12.0, and the derivation is what caught it.
 */
const MAC_MINIMUM_DARWIN_VERSION = '21.0.0';

/**
 * The modern macOS variants the build produces, x64 first so that the legacy top-level
 * path/sha512 - which mirror files[0] and are all a pre-arm64 client reads - describe the
 * Intel build. All of them must be present before a channel file is published; see
 * mergeMacChannelDocs. Kept in step by hand with the electron-builder invocations in
 * .github/workflows/build-electron.yml, which name the latest-mac-<variant>.yml files.
 */
const MAC_MODERN_VARIANTS = ['x64', 'arm64'];

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
    // A macOS zip is the electron-updater payload and nothing else now: the human download is
    // the .dmg below. The High Sierra zip is not even that, since its variant is deliberately
    // kept out of latest-mac.yml (see mergeMacChannelDocs). It is still built, because the
    // smoke test launches every zip and the legacy variant - a different Electron generation -
    // is the one most likely to break; it just goes nowhere afterwards.
    { pattern: /-macOS-HighSierra\.zip$/i, to: 'skip' },
    { pattern: /-macOS-(?:x64|arm64)\.zip$/i, to: 'channel' },
    { pattern: /\.dmg$/i, to: 'human' } // the default, but this is the macOS download, so say it
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
    // it just created and fail with a 404.
    //
    // In practice the collision is always latest.yml, and which copy wins decides how every
    // Windows user updates. Phase 1 (NSIS) writes one to the root describing the full
    // installer; phase 2 (nsis-web) writes its own into the subdirectory, carrying the
    // `packages` block that points at the .7z fragments. Contrary to what one might expect,
    // phase 2 does NOT overwrite the root copy - it writes alongside its own output - so
    // nsis-web is scanned FIRST here to make its copy win. Publishing the root copy instead
    // sends every user down the full-installer path and leaves the fragments unreferenced,
    // which is a ~110MB download per update rather than a differential one. Every release to
    // date publishes the nsis-web copy (compare v3.8.8-E's latest.yml).
    const seen = new Set();
    // The nsis-web target writes its fragments to a subdirectory; everything else is flat
    [path.join(dir, 'nsis-web'), dir].forEach(function (searchDir) {
        if (!fs.existsSync(searchDir)) return;
        fs.readdirSync(searchDir, { withFileTypes: true }).forEach(function (entry) {
            if (!entry.isFile() || !PUBLISHABLE.test(entry.name)) return;
            const key = assetName(entry.name).toLowerCase();
            if (seen.has(key)) {
                console.log('Ignoring ' + path.join(searchDir, entry.name) + ' - superseded by the copy already found');
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

/**
 * Converts a macOS product version, as written in a bundle's LSMinimumSystemVersion, into
 * the Darwin kernel version that os.release() reports on it.
 *
 * The two numbering schemes are unrelated: macOS 11 runs Darwin 20, and they have moved in
 * step since, while the whole 10.x line mapped off the minor number (10.13 High Sierra is
 * Darwin 17). The patch level is dropped, so 11.x of any point release qualifies.
 */
function darwinVersionFor (productVersion) {
    const parts = /^(\d+)(?:\.(\d+))?/.exec(String(productVersion).trim());
    if (!parts) return null;
    const major = Number(parts[1]);
    const minor = Number(parts[2] || 0);
    if (major >= 11) return (major + 9) + '.0.0';
    if (major === 10) return (minor + 4) + '.0.0';
    return null;
}

/**
 * Reads LSMinimumSystemVersion out of every packaged .app under <dir>/mac*, and returns the
 * highest as a Darwin version - never lower than MAC_MINIMUM_DARWIN_VERSION.
 *
 * Highest rather than first because the legacy build writes its app into the same "mac"
 * directory as the modern x64 one, and only the ordering of the build steps decides which
 * survives. Reading the legacy app's 10.13 by mistake would produce a channel file offering
 * a Monterey-only binary to High Sierra, which is the exact failure this guards against;
 * taking the maximum, floored by the constant, cannot fail in that direction.
 *
 * electron-builder rewrites these plists with the `plist` package, which emits XML, so a
 * text match suffices and no plist parser has to be added as a dependency.
 */
function macMinimumSystemVersion (dir) {
    let best = MAC_MINIMUM_DARWIN_VERSION;
    const consider = function (plist) {
        if (!fs.existsSync(plist)) return;
        const match = /<key>LSMinimumSystemVersion<\/key>\s*<string>([^<]+)<\/string>/.exec(fs.readFileSync(plist, 'utf8'));
        if (!match) return;
        const darwin = darwinVersionFor(match[1]);
        if (!darwin) return;
        console.log('  ' + path.relative(dir, plist) + ': macOS ' + match[1].trim() + ' = Darwin ' + darwin);
        if (parseInt(darwin, 10) > parseInt(best, 10)) best = darwin;
    };
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
        if (!entry.isDirectory() || !/^mac/i.test(entry.name)) return;
        fs.readdirSync(path.join(dir, entry.name), { withFileTypes: true }).forEach(function (app) {
            if (app.isDirectory() && /\.app$/i.test(app.name)) consider(path.join(dir, entry.name, app.name, 'Contents', 'Info.plist'));
        });
    });
    return best;
}

/**
 * Builds the one latest-mac.yml the updater asks for out of the per-variant files the macOS
 * job leaves behind, and puts a floor on the OS that may accept it.
 *
 * Two things make this necessary. Each electron-builder invocation writes its own
 * latest-mac.yml over the last one's, so the job renames each aside as latest-mac-<variant>.yml
 * and they are recombined here; and MacUpdater picks an entry out of files[] purely by
 * whether its url contains the substring "arm64" (filterFilesForArch), so one file listing
 * both modern builds serves both architectures.
 *
 * The High Sierra variant is excluded, and that exclusion is the point of the exercise. Its
 * Electron 26 build runs on macOS 10.13, but the modern build needs macOS 12, and the app's
 * own auto-update guard only embargoes the Windows 7 Electron - so those clients would
 * happily install an app that cannot launch. minimumSystemVersion is checked by
 * AppUpdater.checkIfUpdateSupported before anything is downloaded, and has been honoured
 * since electron-updater 6.3; older clients than that predate signing and were shipped as
 * experimental. Note it is a *kernel* version (upstream's own type doc: "Same with
 * os.release() value"), which is why electron-builder cannot emit it from the product
 * version it holds, and why writing "11.0.0" here would be a silent no-op.
 */
function mergeMacChannelDocs (variants, dir) {
    const named = function (name) {
        return variants.find(function (entry) { return entry.variant.toLowerCase() === name; });
    };
    const modern = MAC_MODERN_VARIANTS.map(named);
    // Every modern variant must be present. A merged file missing one would still look
    // healthy, which is the danger: MacUpdater.filterFilesForArch falls back to the non-arm64
    // entries when the list holds no arm64 one, so losing latest-mac-arm64.yml would hand
    // every Apple Silicon user the Intel build under Rosetta - working, permanent, and
    // invisible. The build step only warns when a channel file fails to appear, because an
    // artefacts-only run has nothing to publish; this is where that warning becomes an error.
    const missing = MAC_MODERN_VARIANTS.filter(function (name) { return !named(name); });
    if (missing.length) {
        throw new Error('Missing macOS channel file(s): ' + missing.map(function (name) { return 'latest-mac-' + name + '.yml'; }).join(', ') +
            '. Found: ' + (variants.map(function (entry) { return entry.variant; }).join(', ') || 'none') +
            '. Publishing a merged latest-mac.yml without every architecture would silently mis-route those users, so re-run the macOS build instead.');
    }
    variants.filter(function (entry) { return MAC_MODERN_VARIANTS.indexOf(entry.variant.toLowerCase()) === -1; }).forEach(function (entry) {
        console.log('  excluding latest-mac-' + entry.variant + '.yml: not a modern build, so not an auto-update target');
    });
    const merged = Object.assign({}, modern[0].doc);
    const seen = new Set();
    merged.files = [];
    modern.forEach(function (entry) {
        console.log('  including latest-mac-' + entry.variant + '.yml');
        const before = merged.files.length;
        (entry.doc.files || []).forEach(function (file) {
            const key = assetName(file.url).toLowerCase();
            // Zips only. MacUpdater asks for one by name - findFile(files, 'zip', ['pkg',
            // 'dmg']) - so anything else is an entry no client will ever choose, which
            // rewriteChannelFile would nonetheless turn into a cross-release url pointing at
            // the human release. The dmg target is built with writeUpdateInfo=false so none
            // should reach here; this keeps the publisher right on its own if that changes.
            if (!/\.zip$/.test(key)) {
                console.log('    excluding ' + assetName(file.url) + ': the updater downloads the zip');
                return;
            }
            if (seen.has(key)) return;
            seen.add(key);
            merged.files.push(file);
        });
        // Same reasoning as the missing-variant check above: a variant that contributes no zip
        // leaves that architecture out of files[] and filterFilesForArch silently falls back.
        if (merged.files.length === before) {
            throw new Error('latest-mac-' + entry.variant + '.yml lists no .zip for the updater to download, so the merged channel file would leave ' +
                entry.variant + ' Macs to fall back on the other architecture. Re-run the macOS build.');
        }
    });
    merged.minimumSystemVersion = macMinimumSystemVersion(dir);
    console.log('  minimumSystemVersion: ' + merged.minimumSystemVersion + ' (Darwin)');
    return merged;
}

/**
 * Loads the channel files as { name, doc } pairs, collapsing any latest-mac-<variant>.yml
 * into a single latest-mac.yml. A no-op on the Windows and Linux jobs, which produce no such
 * files.
 */
function loadChannelDocs (ymls, dir) {
    const docs = [];
    const macVariants = [];
    ymls.forEach(function (file) {
        const doc = yaml.load(fs.readFileSync(file, 'utf8'));
        const variant = /^latest-mac-(.+)\.yml$/i.exec(path.basename(file));
        if (variant) macVariants.push({ variant: variant[1], doc: doc });
        else docs.push({ name: path.basename(file), doc: doc });
    });
    if (macVariants.length) {
        console.log('\nMerging the macOS channel files into latest-mac.yml:');
        docs.push({ name: 'latest-mac.yml', doc: mergeMacChannelDocs(macVariants, dir) });
    }
    return docs;
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
    const staged = loadChannelDocs(ymls, dir).map(function (entry) {
        const out = path.join(stagingDir, entry.name);
        // Staged rather than edited in place: the download.kiwix.org sync still scans the
        // build directory and should not see rewritten urls. Its glob is non-recursive.
        fs.writeFileSync(out, yaml.dump(rewriteChannelFile(entry.doc, localNames, prefix), { lineWidth: -1 }));
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
        // Channel ymls are omitted here because the section above already lists them under the
        // names they are published as, which is not always what they were called on disk - the
        // macOS variants are merged into a single latest-mac.yml
        const listed = buckets[route].filter(function (f) { return route !== 'channel' || !/\.yml$/i.test(f); });
        if (!listed.length) return;
        console.log('\nRouted to ' + route + ':');
        listed.forEach(function (f) { console.log('  ' + assetName(f)); });
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
