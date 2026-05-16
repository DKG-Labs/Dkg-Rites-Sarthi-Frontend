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
    // Set GENERATE_SOURCEMAP=false to save memory and increase heap size to 4GB
    execSync('npm run build:main', { 
        stdio: 'inherit',
        env: { ...process.env, GENERATE_SOURCEMAP: 'false', NODE_OPTIONS: '--max-old-space-size=4096' }
    });

    // 2. Build Sub-apps
    const subApps = [
        { name: 'Sleeper', dir: 'Sleeper-Dashboard', dist: 'dist', target: 'sleeper' },
        { name: 'Railpad', dir: 'Railpad-IE', dist: 'dist', target: 'railpad' }
    ];

    subApps.forEach(app => {
        console.log(`\n--- Building ${app.name} Dashboard (Vite) ---`);
        const appDir = path.join(process.cwd(), app.dir);

        if (fs.existsSync(appDir)) {
            console.log(`Installing ${app.name} dependencies...`);
            execSync('npm install', { cwd: appDir, stdio: 'inherit' });

            console.log(`Executing ${app.name} build...`);
            execSync('npm run build', { cwd: appDir, stdio: 'inherit' });

            // 3. Move app build to main build folder
            console.log(`\n--- Integrating ${app.name} build into main build ---`);
            const appDist = path.join(appDir, app.dist);
            const mainBuildApp = path.join(process.cwd(), 'build', app.target);

            if (fs.existsSync(appDist)) {
                if (!fs.existsSync(mainBuildApp)) {
                    fs.mkdirSync(mainBuildApp, { recursive: true });
                }

                console.log(`Copying built files from ${appDist} to ${mainBuildApp}...`);
                copyRecursiveSync(appDist, mainBuildApp);
                console.log(`${app.name} Dashboard successfully integrated into /${app.target} directory.`);
            } else {
                console.error(`Error: ${app.name} dist folder not found after build.`);
            }
        } else {
            console.error(`Error: ${app.dir} directory not found.`);
        }
    });

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
        <!-- Rule 1: STOP PROCESSING and Serve Sub-app Assets Directly -->
        <rule name="Sub-app Assets Pass-Through" stopProcessing="true">
          <match url="^(sleeper|railpad)/assets/(.*)" />
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

        <!-- Rule 3: SPA Fallback for Railpad Dashboard -->
        <rule name="Railpad Dashboard SPA" stopProcessing="true">
          <match url="^railpad(/.*)?" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/railpad/index.html" />
        </rule>

        <!-- Rule 4: SPA Fallback for Main App -->
        <rule name="Parent App SPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(sleeper|railpad)" negate="true" />
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
