# SARTHI React App — Vercel Deployment

This repository is a frontend-only React application (Create React App) prepared for deployment to Vercel.

## Quick Local Build & Preview
1. Install dependencies

```powershell
npm install
```

2. Build the production bundle

```powershell
npm run build
```

3. Preview the production build locally

```powershell
npx serve -s build
# then open http://localhost:3000 (or the port shown)
```

## Deploying to Vercel
1. Commit and push your repository to GitHub/GitLab/Bitbucket.
2. In the Vercel dashboard, choose "Import Project" and pick the repository.
3. Vercel will detect this as a React app. Verify the following (defaults are usually correct):
   - Build Command: `npm run build`
   - Output Directory: `build`
4. Deploy. Vercel will run the build and publish the site.

The repository includes a `vercel.json` file configured to use `@vercel/static-build` and a route that serves `index.html` for all paths (SPA routing).

## Environment Variables
- This codebase currently does not reference any `process.env.*` variables in source. If you add API keys, endpoints, or flags, add them in the Vercel Project Settings under "Environment Variables".

## Notes & Recommendations
- Node version: If you need a specific Node.js version for the build, add an `engines.node` field to `package.json` or set the Node version in Vercel settings.
- Large libs: `pdf-parse` and `pdfjs-dist` are included and can increase bundle size. Consider lazy-loading them if used only in specific flows.
- .vercelignore: This repo contains a `.vercelignore` file to avoid uploading `node_modules`, local env files, logs, and other unnecessary files.

If you want, I can:
- Add an `engines.node` field to `package.json` to pin the build Node version.
- Add a short CI step (GitHub Actions) to run `npm test` before deployment.

Contact: engineering@yourorg.example (replace with your team's contact)