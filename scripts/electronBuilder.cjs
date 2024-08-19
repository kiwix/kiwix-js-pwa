const fs = require('fs');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const baseConfig = packageJson.build;

// Create a new configuration object, removing signing-related options
const unsignedConfig = {
    ...baseConfig,
    win: {
        ...baseConfig.win
    },
    // Remove top-level configs related to signing
    cscLink: undefined,
    cscKeyPassword: undefined
};

// Remove properties if they exist
delete unsignedConfig.win.certificateSha1;
delete unsignedConfig.win.signingHashAlgorithms;
delete unsignedConfig.win.rfc3161TimeStampServer;
delete unsignedConfig.win.sign;

module.exports = unsignedConfig;