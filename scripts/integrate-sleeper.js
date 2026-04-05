const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

try {
    // 1. Build main app (using build:main command from package.json)
    console.log('--- Building main React app ---');
    execSync('npm run build:main', { stdio: 'inherit' });

    // 2. Build Sleeper app
    console.log('\n--- Building Sleeper Dashboard (Vite) ---');
    const sleeperDir = path.join(process.cwd(), 'Sleeper-Dashboard');

    if (fs.existsSync(sleeperDir)) {
        console.log('Installing Sleeper dependencies...');
        execSync('npm install', { cwd: sleeperDir, stdio: 'inherit' });

        console.log('Executing Sleeper build...');
        execSync('npm run build', { cwd: sleeperDir, stdio: 'inherit' });

        // 3. Move Sleeper build to main build folder
        console.log('\n--- Integrating Sleeper build into main build ---');
        const sleeperDist = path.join(sleeperDir, 'dist');
        const mainBuildSleeper = path.join(process.cwd(), 'build', 'sleeper');

        if (fs.existsSync(sleeperDist)) {
            if (!fs.existsSync(mainBuildSleeper)) {
                fs.mkdirSync(mainBuildSleeper, { recursive: true });
            }

            console.log(`Copying built files from ${sleeperDist} to ${mainBuildSleeper}...`);
            copyRecursiveSync(sleeperDist, mainBuildSleeper);
            console.log('Sleeper Dashboard successfully integrated into /sleeper directory.');
        } else {
            console.error('Error: Sleeper dist folder not found after build.');
        }
    } else {
        console.error('Error: Sleeper-Dashboard directory not found.');
    }

    console.log('\nDeployment-ready build completed successfully.');
} catch (error) {
    console.error('\nBuild failed:', error.message);
    process.exit(1);
}
