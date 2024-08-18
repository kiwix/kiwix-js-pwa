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

    // Extract rfc3161TimeStampServer and sha1 from package.json
    const rfc3161TimeStampServer = packageJson.build.win.rfc3161TimeStampServer;
    const sha1 = packageJson.build.win.certificateSha1;

    // Extract file to sign from configuration
    const fileToSign = configuration.path;

    // Debug statement to print the file to sign
    // console.log('FILE_TO_SIGN:', fileToSign);

    const signToolPath = process.env.SIGNTOOL_PATH;
    const eSignerCKAPath = process.env.INSTALL_DIR + '/eSignerCKATool.exe';

    console.log('eSigner CKA Status:');
    execSync(`"${eSignerCKAPath}" status`, { stdio: 'inherit' });

    // Debug statements to print environment variables
    // console.log('SIGNING_CERT_SHA1:', sha1);
    // console.log('SIGNTOOL_PATH:', signToolPath);

    if (!fileToSign) {
        console.error('No file specified to sign.');
        process.exit(1);
    }

    if (!sha1) {
        console.error('Signing certificate SHA1 is not set in package.json.');
        process.exit(1);
    }

    if (!rfc3161TimeStampServer) {
        console.error('rfc3161TimeStampServer is not set in package.json.');
        process.exit(1);
    }

    const signCommand = `"${signToolPath}" sign /sha1 ${sha1} /s My /fd sha256 /tr ${rfc3161TimeStampServer} /td sha256 /csp "eSignerKSP" /d "Kiwix JS Electron" /du "https://github.com/kiwix/kiwix-js-pwa#readme" /debug "${fileToSign}"`;

    // Debug statement to print the full sign command
    console.log('Sign Command:', signCommand);

    try {
        execSync(signCommand, { stdio: 'inherit' });
        console.log(`Successfully signed ${fileToSign}`);
    } catch (error) {
        console.error(`Failed to sign ${fileToSign}`);
        process.exit(1);
    }
};
