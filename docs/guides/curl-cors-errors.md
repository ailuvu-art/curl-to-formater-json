# Why cURL works in the terminal but fails in a browser

You run a cURL command in the terminal and receive JSON. You paste the same command into a browser-based API tool and see `Failed to fetch`. The API can be healthy in both cases—the difference is often Cross-Origin Resource Sharing (CORS).

[CurlLens](https://www.curljson.help/) can send requests directly from the browser, so browser security rules apply in **Browser** mode. Its optional **Local Agent** mode executes requests on your computer outside the browser CORS sandbox.

## What CORS does

The same-origin policy prevents a website from freely reading responses from another origin. An API opts into browser access by returning CORS response headers.

For a simple public request, a server might return:

```http
Access-Control-Allow-Origin: https://www.curljson.help
```

A public API can sometimes allow every origin:

```http
Access-Control-Allow-Origin: *
```

The wildcard cannot be used for credentialed requests. Cookies and other credentialed browser requests require an explicit allowed origin and suitable credential configuration.

## Why terminal cURL is different

CORS is enforced by browsers, not by HTTP servers or the cURL command-line client. Terminal cURL can read a response even when it has no `Access-Control-Allow-Origin` header. JavaScript running on a website cannot.

This means:

- success in terminal cURL does not prove browser access is allowed;
- the browser may send a preflight `OPTIONS` request before the real request;
- custom headers and methods often trigger preflight;
- redirects must also satisfy browser security requirements.

## Common causes of `Failed to fetch`

### The API does not allow the website origin

The response is missing a valid `Access-Control-Allow-Origin` value.

### Preflight is rejected

The API does not respond correctly to `OPTIONS`, or it omits the requested method or headers:

```http
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

Only allow methods and headers that the API actually supports.

### HTTP or TLS problems

A browser can block mixed content, invalid certificates, insecure redirects, or unsupported TLS behavior.

### Extensions or network policy

Privacy extensions, corporate firewalls, DNS filtering, and content blockers can stop a request before the API responds.

## How API owners can fix CORS

1. Decide which website origins should access the API.
2. Return the exact allowed origin where practical.
3. Handle `OPTIONS` preflight requests without authentication side effects.
4. Allow only the necessary methods and headers.
5. Add `Vary: Origin` when the allowed origin changes dynamically.
6. Test both the preflight and real request in a browser.
7. Avoid reflecting arbitrary origins when credentials or private data are involved.

Example response headers:

```http
Access-Control-Allow-Origin: https://www.curljson.help
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Vary: Origin
```

The exact configuration depends on your server framework, gateway, and authentication model.

## What API users can do

If you do not control the API:

- use CurlLens **Local Agent** mode;
- use an official endpoint that supports browser access;
- ask the provider whether browser CORS is supported;
- run the original command in a trusted terminal;
- use your own authenticated backend when your application needs server-to-server access.

Do not paste private credentials into a random public CORS proxy. A proxy can read and retain every header and body you send.

## Run the request with CurlLens Agent

CurlLens Agent is a small authenticated service that runs on your computer. It is useful for APIs blocked by CORS and for endpoints available only through `localhost`, your LAN, or a VPN.

### 1. Install and start the agent

Node.js 20 or newer is required:

```bash
npx @nolann-dev/curllens-agent install
```

The command starts the agent on `http://127.0.0.1:43120` and prints a private connection token.

### 2. Connect CurlLens

1. Open [CurlLens](https://www.curljson.help/).
2. Select **Local Agent** under the request editor.
3. Paste the token printed by the installation command.
4. Select **Connect**.
5. Run the cURL request again.

The browser sends the request definition to the authenticated loopback agent. The agent contacts the target API from your computer and returns the response to CurlLens, so the target API's browser CORS policy does not block the response.

### Agent lifecycle commands

```bash
npx @nolann-dev/curllens-agent start
npx @nolann-dev/curllens-agent status
npx @nolann-dev/curllens-agent token
npx @nolann-dev/curllens-agent stop
npx @nolann-dev/curllens-agent uninstall
```

Treat the connection token like a password. The agent listens only on your loopback interface and accepts explicitly allowed CurlLens browser origins, but anyone who obtains the token may try to send requests through your local agent.

## Debugging checklist

1. Open browser developer tools.
2. Check the **Network** panel for an `OPTIONS` request.
3. Review the browser Console for a specific CORS message.
4. Confirm the final URL after redirects.
5. Check whether `Authorization` or custom headers trigger preflight.
6. Test without privacy extensions in a clean browser profile.
7. Ask the API owner to inspect server and gateway logs.

## Test a browser-compatible API

Use this public example in [CurlLens](https://www.curljson.help/):

```bash
curl 'https://jsonplaceholder.typicode.com/users/1' \
  -H 'Accept: application/json'
```

If the example works but your endpoint does not, compare its CORS and preflight behavior rather than only comparing the cURL commands.
