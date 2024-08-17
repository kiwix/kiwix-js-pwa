const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Extract rfc3161TimeStampServer from package.json
const rfc3161TimeStampServer = packageJson.build.win.rfc3161TimeStampServer;

const fileToSign = process.argv[2];
const sha1 = process.env.ED_SIGNTOOL_THUMBPRINT;
const signToolPath = process.env.SIGNTOOL_PATH;

if (!sha1) {
    console.error('Environment variable SIGNING_CERT_SHA1 is not set.');
    process.exit(1);
}

if (!rfc3161TimeStampServer) {
    console.error('rfc3161TimeStampServer is not set in package.json.');
    process.exit(1);
}

const signCommand = `"${signToolPath}" sign /tr ${rfc3161TimeStampServer} /sha1 ${sha1} /s My /fd sha256 /td sha256 /d "Kiwix JS Electron" /du "https://github.com/kiwix/kiwix-js-pwa#readme" /debug "${fileToSign}"`;

try {
    execSync(signCommand, { stdio: 'inherit' });
    console.log(`Successfully signed ${fileToSign}`);
} catch (error) {
    console.error(`Failed to sign ${fileToSign}`);
    process.exit(1);
}