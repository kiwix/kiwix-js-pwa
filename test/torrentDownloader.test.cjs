#!/usr/bin/env node
/**
 * Checks the free-space calculation in torrentDownloader.cjs: the space a torrent still needs is
 * its length minus the space its files already take up on disk, so a partial download that has
 * already been extended to full size (WebTorrent requests pieces near the end of the torrent
 * first) must not be asked to find that space a second time.
 *
 * Usage: npm test
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('node:assert/strict');
const { describe, it, before, after, afterEach } = require('node:test');
const { checkFreeSpace } = require('../torrentDownloader.cjs');

const MB = 1048576;
const LENGTH = 4 * MB;

let tmpDir = null;
const realStatfs = fs.promises.statfs;
const realStat = fs.promises.stat;

// Makes the drive appear to have the given number of bytes free
function mockFreeSpace (bytes) {
    fs.promises.statfs = async function () {
        return { bsize: 4096, bavail: Math.floor(bytes / 4096) };
    };
}

// A store with a single file, as TolerantStore describes the files of a single-file torrent
function storeFor (fileName) {
    return { files: [{ path: path.join(tmpDir, fileName), length: LENGTH, offset: 0 }] };
}

describe('checkFreeSpace', { skip: !realStatfs && 'fs.promises.statfs is not available' }, function () {
    before(function () {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kiwix-torrent-test-'));
    });

    after(function () {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    afterEach(function () {
        fs.promises.statfs = realStatfs;
        fs.promises.stat = realStat;
    });

    it('needs the full length when the file does not exist yet', async function () {
        mockFreeSpace(1 * MB);
        assert.equal(await checkFreeSpace(storeFor('missing.zim'), tmpDir), 3 * MB);
    });

    it('needs only the part of the file not yet on disk', async function () {
        fs.writeFileSync(path.join(tmpDir, 'partial.zim'), Buffer.alloc(1 * MB));
        mockFreeSpace(1 * MB);
        assert.equal(await checkFreeSpace(storeFor('partial.zim'), tmpDir), 2 * MB);
    });

    it('needs no more space when the file is already full size', async function () {
        // As when one piece near the end of the torrent has been written to a non-sparse file
        fs.writeFileSync(path.join(tmpDir, 'fullsize.zim'), Buffer.alloc(LENGTH));
        mockFreeSpace(1 * MB);
        assert.ok(await checkFreeSpace(storeFor('fullsize.zim'), tmpDir) <= 0);
    });

    it('counts only the allocated blocks of a sparse file', async function () {
        fs.promises.stat = async function () {
            return { size: LENGTH, blocks: MB / 512 };
        };
        mockFreeSpace(1 * MB);
        assert.equal(await checkFreeSpace(storeFor('sparse.zim'), tmpDir), 2 * MB);
    });

    it('needs the full length for a sparse file that is all holes', async function () {
        fs.promises.stat = async function () {
            return { size: LENGTH, blocks: 0 };
        };
        mockFreeSpace(1 * MB);
        assert.equal(await checkFreeSpace(storeFor('holes.zim'), tmpDir), 3 * MB);
    });

    it('falls back to the size where the allocated blocks are not reported', async function () {
        fs.promises.stat = async function () {
            return { size: LENGTH };
        };
        mockFreeSpace(1 * MB);
        assert.ok(await checkFreeSpace(storeFor('noblocks.zim'), tmpDir) <= 0);
    });

    it('does not block the download when free space cannot be determined', async function () {
        fs.promises.statfs = async function () {
            throw new Error('statfs failed');
        };
        assert.equal(await checkFreeSpace(storeFor('missing.zim'), tmpDir), 0);
    });

    it('does not block the download without a store', async function () {
        mockFreeSpace(0);
        assert.equal(await checkFreeSpace(null, tmpDir), 0);
    });
});
