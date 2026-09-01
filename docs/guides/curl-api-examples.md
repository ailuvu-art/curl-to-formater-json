# Useful cURL examples for testing JSON APIs

These examples cover common JSON API requests. You can run browser-compatible endpoints in [CurlLens](https://www.curljson.help/) and inspect responses as an expandable tree, highlighted JSON, or raw text.

Replace placeholder URLs and credentials before using the examples with your own API.

## GET a JSON resource

```bash
curl 'https://jsonplaceholder.typicode.com/users/1' \
  -H 'Accept: application/json'
```

Use `Accept: application/json` to tell the API which response format you prefer.

## GET a collection with query parameters

```bash
curl 'https://jsonplaceholder.typicode.com/posts?userId=1' \
  -H 'Accept: application/json'
```

Keep query parameters in the quoted URL so the shell does not interpret `&` and other special characters.

## POST a JSON object

```bash
curl 'https://jsonplaceholder.typicode.com/posts' \
  -X POST \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"title":"API test","body":"Created from cURL","userId":1}'
```

`Content-Type` describes the request body. `Accept` describes the preferred response.

## PUT a complete resource

```bash
curl 'https://jsonplaceholder.typicode.com/posts/1' \
  -X PUT \
  -H 'Content-Type: application/json' \
  -d '{"id":1,"title":"Updated title","body":"Updated body","userId":1}'
```

APIs commonly treat PUT as a complete replacement, although semantics vary by service.

## PATCH selected fields

```bash
curl 'https://jsonplaceholder.typicode.com/posts/1' \
  -X PATCH \
  -H 'Content-Type: application/json' \
  -d '{"title":"Only this field changes"}'
```

PATCH usually represents a partial update.

## DELETE a resource

```bash
curl 'https://jsonplaceholder.typicode.com/posts/1' \
  -X DELETE \
  -H 'Accept: application/json'
```

A successful DELETE can return an empty body, a status object, or the deleted resource.

## Bearer token authentication

```bash
curl 'https://api.example.com/me' \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer YOUR_SHORT_LIVED_TEST_TOKEN'
```

Do not commit real tokens to Git, paste them while screen sharing, or use long-lived production credentials for casual testing.

## Custom request headers

```bash
curl 'https://api.example.com/data' \
  -H 'Accept: application/json' \
  -H 'X-Request-ID: local-test-001' \
  -H 'X-API-Version: 2026-01-01'
```

Custom headers can trigger a browser CORS preflight. The API must explicitly allow them for browser-based tools.

## Send nested JSON

```bash
curl 'https://api.example.com/orders' \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{
    "customer": {"id": 42, "name": "Ada"},
    "items": [
      {"sku": "KEYBOARD-01", "quantity": 1},
      {"sku": "CABLE-02", "quantity": 2}
    ]
  }'
```

CurlLens Tree view is especially useful for checking nested objects and arrays in the response.

## Inspect several requests together

Open the [multi-request workspace](https://www.curljson.help/workspace) to keep GET, POST, and update requests in separate tabs. Each tab preserves its own command, result, view mode, and collapsed JSON paths.

## Troubleshooting

If a command works in terminal cURL but fails in the browser, read the [CORS troubleshooting guide](curl-cors-errors.md). Browser-based tools cannot bypass an API's cross-origin policy safely.
