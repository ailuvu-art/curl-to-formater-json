# How to convert a cURL command to formatted JSON

API documentation often provides a cURL command because it is portable and easy to run in a terminal. The command itself is not JSON, though: it describes an HTTP request. The API response may contain JSON that you want to format, search, or inspect.

[CurlLens](https://www.curljson.help/) turns that workflow into a visual process in the browser.

## Quick method

1. Copy a cURL command from trusted API documentation.
2. Open [CurlLens](https://www.curljson.help/).
3. Paste the command into the request editor.
4. Review the target URL, headers, and body for secrets or unexpected data.
5. Select **Run request**.
6. Inspect the response in **Tree**, **Code**, or **Text** view.

For example:

```bash
curl 'https://jsonplaceholder.typicode.com/users/1' \
  -H 'Accept: application/json'
```

A successful response contains a JSON object. Tree view makes nested properties expandable, Code view preserves formatted JSON syntax, and Text view shows the original response body.

## What the command means

A basic command has a URL:

```bash
curl 'https://api.example.com/users/42'
```

Headers provide request metadata or authentication:

```bash
curl 'https://api.example.com/users/42' \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

`-X` sets an explicit HTTP method, while `-d` supplies a body:

```bash
curl 'https://api.example.com/users' \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","role":"developer"}'
```

CurlLens parses these common options and sends the equivalent request with the browser Fetch API.

## JSON formatting versus cURL conversion

“Convert cURL to JSON” can mean two different things:

1. **Format the API response as JSON.** CurlLens executes the cURL request and formats a JSON response.
2. **Represent the request itself as JSON.** This produces an object containing fields such as `url`, `method`, `headers`, and `body` without making the request.

CurlLens currently focuses on the first use case: running a request and inspecting its response.

## Working with nested responses

Large responses are easier to understand in Tree view:

- expand only the object or array you need;
- collapse all containers to see the overall structure;
- switch to Code view when you need valid formatted JSON to copy;
- use search to locate repeated IDs, keys, or values;
- use Text view for non-JSON content or to inspect the untouched response.

For multiple endpoints, open the [multi-request workspace](https://www.curljson.help/workspace). Each tab keeps its own command, response, and view state.

## Security checklist

Before running a copied command:

- confirm that you trust the target hostname;
- remove production API keys, cookies, and personal data where possible;
- use short-lived test credentials;
- do not paste secrets while screen sharing;
- remember that the target API receives all headers and body data you include.

CurlLens does not proxy the request through an application server, but browser extensions, the destination API, and anyone with access to your device may still expose sensitive information.

## Why a request may fail

A command that works in a terminal can fail in a browser because of CORS. Browsers require the API to allow cross-origin access. Terminal cURL does not apply this browser security policy.

Read [Why cURL works in the terminal but fails in a browser](curl-cors-errors.md) for troubleshooting steps.

## Try it

Open the free [cURL to JSON formatter and response viewer](https://www.curljson.help/) or use the [CurlLens workspace](https://www.curljson.help/workspace) for several requests.
