'use strict';

/**
 * scripts/afterPack.cjs — electron-builder afterPack hook for the Windows builds.
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
 * The same correction is needed for the ia32 NSIS Setup and portable targets, which are likewise
 * packed from the runner's x64 binary, so every Windows build must run with a config that carries
 * this hook (a JSON `build` field cannot hold a function, hence electronBuilder-signed.cjs).
 *
 * WHAT IT DOES (Windows only — macOS/Linux keep their per-step swaps and return early here)
 * - Downloads node-datachannel's win32-<arch> N-API prebuild (a download, no compile) for the arch
 *   being packed and overwrites the packed binary, then reads its PE machine type and throws on any
 *   mismatch, so a wrong-arch package can never be published — our CI arch-check, since neither
 *   Windows on ARM nor 32-bit Windows is testable on the runner.
 * - ia32 must request its prebuild as "x86": node-datachannel publishes the 32-bit Windows binary
 *   under that name, while prebuild-install substitutes the arch into the asset filename verbatim,
 *   so asking for "ia32" 404s. The x86 asset is a true 32-bit PE (machine 0x014c), which is what
 *   makes the in-app torrent feature workable on 32-bit Windows 10/11 (see preload.cjs
 *   `torrentSupported`). Legacy Win7/32-bit-Linux/old-macOS builds are excluded separately, by
 *   Electron versions whose Node is below WebTorrent's Node 20 floor.
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

// node-datachannel names its 32-bit Windows release asset "x86", not Node's "ia32" spelling, and
// prebuild-install interpolates whatever arch string it is given straight into the asset filename
// ({name}-v{version}-{runtime}-v{abi}-{platform}-{arch}.tar.gz), so ia32 has to be translated here
// or the download 404s. The other two archs match their Node names.
const PREBUILD_ARCH = { ia32: 'x86', x64: 'x64', arm64: 'arm64' };

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

    const prebuildArch = PREBUILD_ARCH[arch];
    if (!prebuildArch) throw new Error('[afterPack] no known node-datachannel prebuild for arch ' + arch);

    const ndcDir = path.join(context.packager.projectDir, 'node_modules', 'node-datachannel');
    const prebuildInstall = require.resolve('prebuild-install/bin.js', { paths: [ndcDir] });
    console.log('[afterPack] downloading node-datachannel win32-' + prebuildArch + ' prebuild for ' + arch + '...');
    // prebuild-install must run as a child process (it calls process.exit); cwd must be the
    // node-datachannel dir so it reads that package's manifest and writes to its build/Release.
    execFileSync(process.execPath,
        [prebuildInstall, '-r', 'napi', '--arch', prebuildArch, '--platform', 'win32'],
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
