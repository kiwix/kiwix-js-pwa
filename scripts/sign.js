import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function (configuration) {
    // Read package.json
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Extract rfc3161TimeStampServer from package.json
    const rfc3161TimeStampServer = packageJson.build.win.rfc3161TimeStampServer;

    // Extract file to sign from configuration
    const fileToSign = configuration.path;

    // Debug statement to print the file to sign
    // console.log('FILE_TO_SIGN:', fileToSign);

    const sha1 = process.env.SIGNING_CERT_SHA1;
    const signToolPath = process.env.SIGNTOOL_PATH;

    // Debug statements to print environment variables
    // console.log('SIGNING_CERT_SHA1:', sha1);
    // console.log('SIGNTOOL_PATH:', signToolPath);

    if (!fileToSign) {
        console.error('No file specified to sign.');
        process.exit(1);
    }

    if (!sha1) {
        console.error('Environment variable SIGNING_CERT_SHA1 is not set.');
        process.exit(1);
    }

    if (!rfc3161TimeStampServer) {
        console.error('rfc3161TimeStampServer is not set in package.json.');
        process.exit(1);
    }

    const signCommand = `"${signToolPath}" sign /tr ${rfc3161TimeStampServer} /sha1 ${sha1} /s My /fd sha256 /td sha256 /d "Kiwix JS Electron" /du "https://github.com/kiwix/kiwix-js-pwa#readme" "${fileToSign}"`;

    // Debug statement to print the full sign command
    // console.log('Sign Command:', signCommand);

    try {
        execSync(signCommand, { stdio: 'inherit' });
        // console.log(`Successfully signed ${fileToSign}`);
    } catch (error) {
        console.error(`Failed to sign ${fileToSign}`);
        process.exit(1);
    }
};
