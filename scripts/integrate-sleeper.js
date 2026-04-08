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

    console.log('\n--- Injecting root server configuration (web.config) ---');
    const webConfigContent = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <remove fileExtension=".js" />
      <mimeMap fileExtension=".js" mimeType="application/javascript" />
      <remove fileExtension=".jsx" />
      <mimeMap fileExtension=".jsx" mimeType="application/javascript" />
      <remove fileExtension=".css" />
      <mimeMap fileExtension=".css" mimeType="text/css" />
      <remove fileExtension=".json" />
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <remove fileExtension=".woff" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <remove fileExtension=".woff2" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
    </staticContent>
    <rewrite>
      <rules>
        <!-- Rule 1: STOP PROCESSING and Serve Sleeper Assets Directly -->
        <rule name="Sleeper Assets Pass-Through" stopProcessing="true">
          <match url="^sleeper/assets/(.*)" />
          <action type="None" />
        </rule>
        
        <!-- Rule 2: SPA Fallback for Sleeper Dashboard -->
        <rule name="Sleeper Dashboard SPA" stopProcessing="true">
          <match url="^sleeper(/.*)?" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/sleeper/index.html" />
        </rule>

        <!-- Rule 3: SPA Fallback for Main App -->
        <rule name="Parent App SPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/sleeper" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    <httpErrors errorMode="Detailed" />
  </system.webServer>
</configuration>`;
    
    const buildPath = path.join(process.cwd(), 'build');
    if (fs.existsSync(buildPath)) {
        fs.writeFileSync(path.join(buildPath, 'web.config'), webConfigContent);
        console.log('web.config successfully injected into /build directory.');
    } else {
        console.warn('Warning: build directory not found. Skipping web.config injection.');
    }

    console.log('\nDeployment-ready build completed successfully.');
} catch (error) {
    console.error('\nBuild failed:', error.message);
    process.exit(1);
}
