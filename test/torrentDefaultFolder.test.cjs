#!/usr/bin/env node
/**
 * Checks isPackagedArchiveFolder in www/js/lib/kiwixServe.js, which stops the in-app BitTorrent download from offering a
 * packaged app's own archive folder (e.g. WikiMed's or Wikivoyage's resources/archives) as its default destination.
 *
 * When no download folder has been chosen, the destination is derived from the picked archive folder, and in a packaged
 * app that is the folder holding the packaged archive, inside the installed app. That folder is read-only in the MSIX,
 * AppImage, deb/rpm and signed macOS packages, and is emptied on upgrade in the others, so the user must be asked to pick
 * a folder instead. The paths below are the shapes electronAPI.__dirname takes in each kind of package.
 *
 * Usage: npm test
 */

'use strict';
/* eslint-disable no-unused-vars */

const path = require('path');
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { loadModuleSource, createMockDocument } = require('./helpers.cjs');

const KIWIX_SERVE_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'kiwixServe.js');
const kiwixServeSource = loadModuleSource(KIWIX_SERVE_JS);

/**
 * Builds a sandbox holding the real kiwixServe source, loaded as it would be in an app with the given packaged file and
 * app directory
 *
 * @param {String} packagedFile The value of params.packagedFile ('' for the main app)
 * @param {String|null} appDirname The value of electronAPI.__dirname, or null where there is no electronAPI
 * @returns {Function} The isPackagedArchiveFolder function from the sandbox
 */
function loadIsPackagedArchiveFolder (packagedFile, appDirname) {
    const mockParams = {
        appType: 'PWA',
        packagedFile: packagedFile,
        archivePath: 'archives'
    };
    const mockDocument = createMockDocument();
    const mockWindow = appDirname ? { electronAPI: { __dirname: appDirname } } : {};

    /* eslint-disable no-eval */
    return eval(`(function () {
        var document = mockDocument;
        var params = mockParams;
        var window = mockWindow;
        // The module's imports: only torrentClient is read at load time
        var cache = {};
        var uiUtil = {};
        var settingsStore = {};
        var torrentClient = { isAvailable: function () { return false; } };
        ${kiwixServeSource}
        return isPackagedArchiveFolder;
    })()`);
    /* eslint-enable no-eval */
}

const PACKAGED_FILE = 'wikivoyage_en_all_maxi_2026-09.zim';

describe('isPackagedArchiveFolder', () => {
    it('matches the archive folder of a Windows NSIS install, whatever the slashes, case or trailing slash', () => {
        const isPackaged = loadIsPackagedArchiveFolder(PACKAGED_FILE, 'C:\\Users\\me\\AppData\\Local\\Programs\\Wikivoyage by Kiwix\\resources\\app.asar');
        assert.equal(isPackaged('C:/Users/me/AppData/Local/Programs/Wikivoyage by Kiwix/resources/archives'), true);
        assert.equal(isPackaged('C:\\Users\\me\\AppData\\Local\\Programs\\Wikivoyage by Kiwix\\resources\\archives\\'), true);
        assert.equal(isPackaged('c:/users/me/appdata/local/programs/wikivoyage by kiwix/Resources/Archives'), true);
    });

    it('matches the archive folder of an MSIX install', () => {
        const isPackaged = loadIsPackagedArchiveFolder(PACKAGED_FILE, 'C:\\Program Files\\WindowsApps\\Kiwix.Wikivoyage_3.9.5.0_x64__abc\\app\\resources\\app.asar');
        assert.equal(isPackaged('C:/Program Files/WindowsApps/Kiwix.Wikivoyage_3.9.5.0_x64__abc/app/resources/archives'), true);
    });

    it('matches the archive folder of a mounted AppImage', () => {
        const isPackaged = loadIsPackagedArchiveFolder(PACKAGED_FILE, '/tmp/.mount_WikivoAbC123/resources/app.asar');
        assert.equal(isPackaged('/tmp/.mount_WikivoAbC123/resources/archives/'), true);
    });

    it('matches the archive folder inside a macOS app bundle', () => {
        const isPackaged = loadIsPackagedArchiveFolder(PACKAGED_FILE, '/Applications/Wikivoyage by Kiwix.app/Contents/Resources/app.asar');
        assert.equal(isPackaged('/Applications/Wikivoyage by Kiwix.app/Contents/Resources/archives'), true);
    });

    it('matches the repository\'s archives folder when run with npm start (no asar)', () => {
        const isPackaged = loadIsPackagedArchiveFolder(PACKAGED_FILE, 'C:\\Repos\\kiwix-js-wikivoyage');
        assert.equal(isPackaged('C:/Repos/kiwix-js-wikivoyage/archives'), true);
    });

    it('matches the bare relative archivePath that app.js may store as the picked folder', () => {
        assert.equal(loadIsPackagedArchiveFolder(PACKAGED_FILE, '/opt/Wikivoyage by Kiwix/resources/app.asar')('archives'), true);
        assert.equal(loadIsPackagedArchiveFolder(PACKAGED_FILE, null)('archives/'), true);
    });

    it('does not match folders the user keeps archives in', () => {
        const isPackaged = loadIsPackagedArchiveFolder(PACKAGED_FILE, '/opt/Wikivoyage by Kiwix/resources/app.asar');
        assert.equal(isPackaged('/home/me/ZIMs'), false);
        assert.equal(isPackaged('/home/me/archives'), false);
        assert.equal(isPackaged('/opt/Wikivoyage by Kiwix/resources/archives-old'), false);
        assert.equal(isPackaged('/opt/Wikivoyage by Kiwix/resources'), false);
    });

    it('is case-sensitive for POSIX paths', () => {
        const isPackaged = loadIsPackagedArchiveFolder(PACKAGED_FILE, '/tmp/.mount_WikivoAbC123/resources/app.asar');
        assert.equal(isPackaged('/tmp/.mount_WikivoAbC123/resources/Archives'), false);
    });

    it('never matches in the main app, which has no packaged archive', () => {
        const isPackaged = loadIsPackagedArchiveFolder('', 'C:\\Repos\\kiwix-js-pwa');
        assert.equal(isPackaged('C:/Repos/kiwix-js-pwa/archives'), false);
        assert.equal(isPackaged('archives'), false);
    });

    it('returns false for anything that is not a non-empty path', () => {
        const isPackaged = loadIsPackagedArchiveFolder(PACKAGED_FILE, '/opt/Wikivoyage by Kiwix/resources/app.asar');
        assert.equal(isPackaged(null), false);
        assert.equal(isPackaged(''), false);
        // An FSA directory handle, which resolveSavePath turns into a path before this is called
        assert.equal(isPackaged({ kind: 'directory', name: 'archives' }), false);
    });
});
