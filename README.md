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
