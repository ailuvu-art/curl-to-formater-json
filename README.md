# CurlLens

A focused cURL-to-JSON inspector built with React, Vite, TypeScript, and Chakra UI. Paste a cURL command, run it in your browser, and inspect the response as an expandable tree, highlighted code, or raw text.

[Open the repository](https://github.com/ailuvu-art/curl-to-formater-json)

## Features

- Parse and execute cURL commands in the browser
- Inspect responses in Tree, Code, and Text modes
- Expand and collapse nested objects and arrays
- Manage multiple independent requests with workspace tabs
- View HTTP status, response time, payload size, and line count
- Copy, search, format, and inspect JSON responses
- Responsive dark interface built for developer workflows

## Multi-request workspace

Open `/workspace` while running the application to manage multiple request tabs. Each tab keeps its own cURL command, response, loading state, view mode, and expanded tree nodes.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Deploy to Vercel with GitHub Actions

The workflow in `.github/workflows/deploy-vercel.yml` deploys the `main` branch to Vercel production. It can also be started manually from the GitHub Actions page.

### 1. Create and link the Vercel project

Create a Vercel project for this repository, then link it from your local checkout:

```bash
npx vercel login
npx vercel link
```

After linking, `.vercel/project.json` contains the project and organization IDs. The `.vercel` directory is intentionally ignored by Git.

### 2. Add GitHub Actions secrets

Open **Repository Settings → Secrets and variables → Actions** and add:

| Secret | Value |
| --- | --- |
| `VERCEL_TOKEN` | A token created at [Vercel Account Settings → Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | The `orgId` from `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | The `projectId` from `.vercel/project.json` |

### 3. Deploy

Push to `main`, or open **GitHub → Actions → Deploy to Vercel → Run workflow**. The workflow installs dependencies, pulls the production settings, builds the Vercel output, and deploys it to production.

The included `vercel.json` provides an SPA rewrite so `/workspace` and its nested routes work when opened or refreshed directly.

## Browser request limitation

CurlLens executes requests directly in the browser. A target API must permit cross-origin browser requests. If it does not provide suitable CORS headers, the same request may work in a terminal but be blocked in CurlLens.

## Tech stack

- React
- TypeScript
- Vite
- Chakra UI
- Lucide icons

## Support

If CurlLens helps your workflow, you can support its development:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-nolann25-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/nolann25)

---

Built and signed by [nolann](https://github.com/nolann-dev).
