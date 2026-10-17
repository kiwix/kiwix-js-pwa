const fs = require('fs');

// Signed Windows builds normally read their electron-builder config straight from dist/package.json's
// `build` field (unlike the unsigned path, which uses electronBuilder.cjs to strip signing). A JSON
// config can't carry a function hook, so this thin JS config re-exports that same build config
// UNCHANGED — signing config intact — with only the per-arch afterPack hook added, so the signed
// nsis-web arm64 package gets the correct-arch node-datachannel binary too (see afterPack.cjs).
const baseConfig = JSON.parse(fs.readFileSync('dist/package.json', 'utf8')).build;

module.exports = {
    ...baseConfig,
    afterPack: require('./afterPack.cjs').default
};
