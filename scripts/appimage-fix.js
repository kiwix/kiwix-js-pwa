const child_process = require('child_process'),
    fs = require('fs'),
    path = require('path');
    
const appName = "kiwix-js-wikimed";    

function isLinux (targets) {
    const re = /AppImage|snap|deb|rpm|freebsd|pacman/i;
    return !!targets.find ( target => re.test (target.name));
}

async function afterPack ({targets, appOutDir}) {
    if ( !isLinux ( targets ) ) return;
    const scriptPath = path.join(appOutDir, appName),
        script = '#!/bin/bash\n"${BASH_SOURCE%/*}"/' + appName + '.bin "$@" --no-sandbox';
    new Promise((resolve) => {
        const child = child_process.exec(`mv ${appName} ${appName}.bin`, {cwd: appOutDir});  
        child.on('exit', () => {
            resolve();
        });    
    }).then(() => {
        fs.writeFileSync (scriptPath, script);
        child_process.exec(`chmod +x ${appName}`, {cwd: appOutDir});
    });
}

module.exports = afterPack;