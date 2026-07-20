'use strict';

/**
 * scripts/afterPack.cjs — electron-builder afterPack hook for the Windows nsis-web build.
 *
 * WHY THIS EXISTS
 * The Windows nsis-web installer is built in a single `--ia32 --x64 --arm64` pass, and it has to
 * be: the Web Setup .exe detects the host arch at install time and downloads the matching package,
 * so the three arch packages must be produced together (they cannot be split into per-arch build
 * steps the way macOS and Linux are). Because package.json sets `npmRebuild: false`, electron-builder
 * copies the ONE node-datachannel binary that npm installed on the x64 CI runner into every arch's
 * package — leaving the arm64 package with an x64 WebRTC addon that fails to load on Windows on ARM.
 * macOS/Linux dodge this by building each arch in its own workflow step and swapping the prebuild in
 * between; nsis-web can't, so we correct each arch here, where the hook fires once per arch with the
 * packed output dir (context.appOutDir), before the package is compressed into its .nsis.7z.
 *
 * WHAT IT DOES (Windows only — macOS/Linux keep their per-step swaps and return early here)
 * - ia32: no node-datachannel prebuild exists and the torrent feature is gated off on ia32 (see
 *   preload.cjs `torrentSupported`), so the wrong-arch binary is deleted rather than shipped dead.
 * - x64 / arm64: downloads node-datachannel's win32-<arch> N-API prebuild (a download, no compile)
 *   and overwrites the packed binary, then reads its PE machine type and throws on any mismatch, so
 *   a wrong-arch package can never be published — our CI arch-check, since Windows on ARM cannot be
 *   tested on-device here.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Arch } = require('electron-builder');

// Location of the auto-unpacked native addon inside a packed app. electron-builder unpacks .node
// modules out of the asar automatically; this is the same path that appeared in the macOS runtime
// dlopen error when the wrong-arch binary was shipped.
const REL_BINARY = path.join('resources', 'app.asar.unpacked', 'node_modules',
    'node-datachannel', 'build', 'Release', 'node_datachannel.node');

// PE (Windows executable) machine-type identifiers, read from the COFF header of the binary.
const PE_MACHINE = { ia32: 0x014c, x64: 0x8664, arm64: 0xaa64 };

/**
 * Reads the machine type from a Windows PE binary: the 2-byte COFF Machine field immediately after
 * the "PE\0\0" signature, whose file offset is stored as a 4-byte little-endian value at 0x3C.
 * @param {String} file Path to the .node/.dll/.exe binary
 * @returns {Number} The IMAGE_FILE_MACHINE_* value
 */
function readPeMachine (file) {
    const fd = fs.openSync(file, 'r');
    try {
        const head = Buffer.alloc(4);
        fs.readSync(fd, head, 0, 4, 0x3c);
        const peOffset = head.readUInt32LE(0);
        const machine = Buffer.alloc(2);
        fs.readSync(fd, machine, 0, 2, peOffset + 4);
        return machine.readUInt16LE(0);
    } finally {
        fs.closeSync(fd);
    }
}

exports.default = async function afterPack (context) {
    // Only the Windows multi-arch nsis-web build needs per-arch correction here.
    if (context.electronPlatformName !== 'win32') return;

    const arch = Arch[context.arch]; // 'ia32' | 'x64' | 'arm64'
    const packed = path.join(context.appOutDir, REL_BINARY);

    // The module may be absent — e.g. the legacy Win7 build strips webtorrent before install, so
    // there is no node-datachannel binary to fix.
    if (!fs.existsSync(packed)) return;

    if (arch === 'ia32') {
        fs.rmSync(packed, { force: true });
        console.log('[afterPack] removed node-datachannel from the ia32 package (no prebuild; feature gated off)');
        return;
    }

    const ndcDir = path.join(context.packager.projectDir, 'node_modules', 'node-datachannel');
    const prebuildInstall = require.resolve('prebuild-install/bin.js', { paths: [ndcDir] });
    console.log('[afterPack] downloading node-datachannel win32-' + arch + ' prebuild...');
    // prebuild-install must run as a child process (it calls process.exit); cwd must be the
    // node-datachannel dir so it reads that package's manifest and writes to its build/Release.
    execFileSync(process.execPath,
        [prebuildInstall, '-r', 'napi', '--arch', arch, '--platform', 'win32'],
        { cwd: ndcDir, stdio: 'inherit' });
    fs.copyFileSync(path.join(ndcDir, 'build', 'Release', 'node_datachannel.node'), packed);

    // CI arch-check: prove the packed binary really is the target arch, or fail the build.
    const machine = readPeMachine(packed);
    if (machine !== PE_MACHINE[arch]) {
        throw new Error('[afterPack] node_datachannel.node for ' + arch + ' has PE machine 0x' +
            machine.toString(16) + ', expected 0x' + PE_MACHINE[arch].toString(16));
    }
    console.log('[afterPack] verified node_datachannel.node is win32-' + arch +
        ' (PE machine 0x' + machine.toString(16) + ')');
};
