# CurlLens Local Agent

The CurlLens Local Agent runs API requests on your computer so CurlLens can reach APIs that browser CORS rules block, including localhost, LAN, and VPN endpoints.

## Requirements

- Node.js 20 or newer
- npm / npx

## Commands

```bash
# First-time setup: create config and start in background
npx @curllens/local-agent install

# Lifecycle
npx @curllens/local-agent start
npx @curllens/local-agent status
npx @curllens/local-agent stop
npx @curllens/local-agent uninstall

# Print the connection token again
npx @curllens/local-agent token
```

`npx` downloads the package when needed. You do not need a global npm installation.

After `install`, copy the printed connection token into CurlLens, choose **Local Agent**, and connect.

## Custom origin or port

The agent allows the production CurlLens origins and Vite development origins by default. Add another exact browser origin during install or start:

```bash
npx @curllens/local-agent install --allow-origin https://preview.example.com
```

Use a custom port if the default `43120` is occupied:

```bash
npx @curllens/local-agent install --port 43121
```

Enter the matching loopback URL, such as `http://127.0.0.1:43121`, in the CurlLens connection form.

## Security

- The service binds only to `127.0.0.1`.
- Every API call requires a random 256-bit bearer token.
- Browser origins are checked against an explicit allowlist.
- `CONNECT` and `TRACE` are blocked.
- Payloads, responses, and execution time are limited.
- Hop-by-hop and transport-managed request headers are removed.
- Configuration and token are stored in `~/.curllens-agent` with user-only permissions where supported.

Treat the token like a password. Do not paste it into another website or commit it to source control.

## Foreground and logs

Run in the foreground for troubleshooting:

```bash
npx @curllens/local-agent serve
```

Background logs are written to:

```text
~/.curllens-agent/agent.log
```
