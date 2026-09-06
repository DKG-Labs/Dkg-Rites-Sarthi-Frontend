const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getGitCommitSha() {
    try {
        return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch (e) {
        return (
            (process.env.VERCEL_GIT_COMMIT_SHA && process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)) ||
            (process.env.GITHUB_SHA && process.env.GITHUB_SHA.slice(0, 7)) ||
            'dev'
        );
    }
}

/**
 * Reads public/version.json and package.json, increments the patch version (e.g. 1.0.0 -> 1.0.1 -> 1.0.2),
 * and writes the updated version manifest.
 */
function bumpVersion() {
    const versionFilePath = path.join(__dirname, '..', 'public', 'version.json');
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    
    let currentVersion = '1.2.19';
    let buildTime = new Date().toISOString();
    let gitCommit = getGitCommitSha();

    // 1. Try reading existing version from public/version.json
    if (fs.existsSync(versionFilePath)) {
        try {
            const data = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
            if (data.version && /^\d+(\.\d+)+$/.test(data.version.replace(/^v/i, ''))) {
                currentVersion = data.version.replace(/^v/i, '');
            }
        } catch (e) {
            console.warn('Could not read existing version.json');
        }
    }

    // 2. Compute next patch version: e.g. 1.0.0 -> 1.0.1 -> 1.0.2
    const parts = currentVersion.split('.').map(n => parseInt(n, 10) || 0);
    const major = parts[0] !== undefined ? parts[0] : 1;
    const minor = parts[1] !== undefined ? parts[1] : 0;
    const patch = (parts[2] !== undefined ? parts[2] : 0) + 1;
    const newVersion = `${major}.${minor}.${patch}`;

    const newVersionData = {
        version: newVersion,
        buildTime: buildTime,
        gitCommit: gitCommit
    };

    // 3. Write back to public/version.json
    fs.writeFileSync(versionFilePath, JSON.stringify(newVersionData, null, 2));

    // 4. Also keep package.json version in sync if possible
    if (fs.existsSync(packageJsonPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            pkg.version = newVersion;
            fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
        } catch (e) {
            // Ignore package.json sync error
        }
    }

    console.log(`🚀 Version auto-incremented: ${currentVersion} ➔ ${newVersion} (Commit: ${gitCommit}, BuildTime: ${buildTime})`);

    return newVersionData;
}

if (require.main === module) {
    bumpVersion();
}

module.exports = { bumpVersion, getGitCommitSha };
