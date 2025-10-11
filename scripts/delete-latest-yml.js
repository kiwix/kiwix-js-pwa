#!/usr/bin/env node

/**
 * Deletes latest.yml from the GitHub draft release
 * This is needed when running multiple electron-builder publish commands
 * that each try to upload their own latest.yml file
 */

const https = require('https');
const { execSync } = require('child_process');

// Get environment variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const INPUT_VERSION = process.env.INPUT_VERSION;
const INPUT_TARGET = process.env.INPUT_TARGET;
const CRON_LAUNCHED = process.env.CRON_LAUNCHED;

if (!GITHUB_TOKEN) {
    console.log('No GITHUB_TOKEN found, skipping latest.yml cleanup');
    process.exit(0);
}

// Calculate the tag name (same logic as workflow)
let tagName;
if (!INPUT_VERSION) {
    const packageJson = require('../package.json');
    tagName = `v${packageJson.version}`;
} else {
    tagName = INPUT_VERSION;
}

// Add -E suffix if not nightly/cron
if (!CRON_LAUNCHED && INPUT_TARGET !== 'nightly') {
    if (!tagName.endsWith('-E')) {
        tagName = `${tagName}-E`;
    }
}

console.log(`Looking for draft release with tag: ${tagName}`);

// Get repository from package.json
const packageJson = require('../package.json');
const repoUrl = packageJson.repository;
const repoMatch = repoUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);

if (!repoMatch) {
    console.error('Could not parse repository from package.json');
    process.exit(1);
}

const owner = repoMatch[1];
const repo = repoMatch[2].replace(/\.git$/, '');

console.log(`Repository: ${owner}/${repo}`);

// GitHub API request to get releases
const options = {
    hostname: 'api.github.com',
    path: `/repos/${owner}/${repo}/releases`,
    method: 'GET',
    headers: {
        'User-Agent': 'kiwix-js-pwa-builder',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
    }
};

https.get(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const releases = JSON.parse(data);
            const draftRelease = releases.find(r => r.draft && r.tag_name === tagName);

            if (!draftRelease) {
                console.log(`No draft release found for tag ${tagName} - this may be the first upload`);
                process.exit(0);
            }

            console.log(`Found draft release ID: ${draftRelease.id}`);

            // Find latest.yml asset
            const latestYmlAsset = draftRelease.assets.find(a => a.name === 'latest.yml');

            if (!latestYmlAsset) {
                console.log('No latest.yml found - nothing to delete');
                process.exit(0);
            }

            console.log(`Deleting latest.yml (ID: ${latestYmlAsset.id}) to avoid conflict with next build...`);

            // Delete the asset
            const deleteOptions = {
                hostname: 'api.github.com',
                path: `/repos/${owner}/${repo}/releases/assets/${latestYmlAsset.id}`,
                method: 'DELETE',
                headers: {
                    'User-Agent': 'kiwix-js-pwa-builder',
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            };

            const deleteReq = https.request(deleteOptions, (deleteRes) => {
                if (deleteRes.statusCode === 204) {
                    console.log('Successfully deleted latest.yml');
                    process.exit(0);
                } else {
                    console.error(`Failed to delete latest.yml: HTTP ${deleteRes.statusCode}`);
                    process.exit(1);
                }
            });

            deleteReq.on('error', (error) => {
                console.error('Error deleting latest.yml:', error.message);
                process.exit(1);
            });

            deleteReq.end();

        } catch (error) {
            console.error('Error parsing GitHub API response:', error.message);
            process.exit(1);
        }
    });
}).on('error', (error) => {
    console.error('Error fetching releases:', error.message);
    process.exit(1);
});
