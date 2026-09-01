# CurlLens launch and outreach kit

This kit keeps promotion focused on useful, relevant communities. Personalize every submission, disclose that you built the tool, and participate in the discussion. Do not automate submissions or post the same message everywhere.

## Product facts

- **Name:** CurlLens
- **Website:** https://www.curljson.help/
- **Workspace:** https://www.curljson.help/workspace
- **Source:** https://github.com/ailuvu-art/curl-to-formater-json
- **Category:** Developer tool / API client / JSON viewer
- **Price:** Free
- **Account required:** No
- **License:** MIT
- **Stack:** React, TypeScript, Vite, Chakra UI, Vercel
- **One-line description:** Run cURL requests and inspect API responses as an expandable JSON tree, highlighted code, or raw text.
- **Short description:** CurlLens is a free browser-based cURL to JSON formatter and API response viewer. Paste a command from API documentation, run it directly from your browser, and inspect the response without setting up a full API client.
- **Privacy note:** Requests go directly from the user's browser to the target API; CurlLens does not proxy request contents through its own application server. Browser CORS rules apply.

## Product Hunt draft

### Tagline

Turn cURL commands into clear, explorable JSON responses

### Description

CurlLens is a focused browser-based API response viewer. Paste a cURL command, run the equivalent request, and inspect the response in expandable Tree, syntax-highlighted Code, or raw Text views. Use the workspace to keep multiple requests open in tabs. It is free, open source, and requires no account.

### Maker comment

I built CurlLens because I often copied a cURL example from API documentation and wanted to understand a nested JSON response quickly without creating a collection in a larger API client.

The difficult part was preserving quoted cURL values while keeping the workflow understandable: paste, run, inspect. Requests execute directly in the browser, which also means CORS applies. I documented that limitation rather than hiding it.

I would especially value feedback on the cURL options you use most and which response-inspection features would make the workspace more useful.

## Show HN draft

### Title

Show HN: CurlLens – run cURL requests and inspect JSON in the browser

### Post

Hi HN,

I made CurlLens: https://www.curljson.help/

It is a small open-source tool for the moment after you copy a cURL command from API documentation. Paste the command, run the equivalent browser request, and inspect the response as an expandable JSON tree, highlighted code, or raw text. There is also a tabbed workspace for comparing several requests.

The parser currently handles common URL, method, header, and body options. Requests go directly from the browser to the target API—there is no application proxy—so normal browser CORS restrictions apply. The source is here: https://github.com/ailuvu-art/curl-to-formater-json

I built it with React, TypeScript, Vite, and Chakra UI. I would appreciate feedback on parsing edge cases, privacy expectations, and which cURL flags are essential for real API documentation workflows.

## DEV Community / Hashnode article brief

### Working title

Why a cURL command works in your terminal but fails in a browser

### Reader value

Explain same-origin policy, CORS preflight, custom headers, credentials, and safe troubleshooting. Use the repository guide as the factual base:

https://github.com/ailuvu-art/curl-to-formater-json/blob/dev/docs/guides/curl-cors-errors.md

Mention CurlLens once in the introduction as the real-world context and once at the end as a browser-compatible test tool. The article should remain useful even if the promotional links are removed.

Suggested tags: `curl`, `api`, `webdev`, `showdev` on DEV; choose equivalent technical tags on Hashnode.

## Indie Hackers draft

I built CurlLens, a focused browser tool for running cURL examples from API docs and exploring JSON responses: https://www.curljson.help/

The product intentionally does less than a full API platform: it parses the common command options, runs the request, and gives you tree/code/text views plus a multi-request workspace. It is open source and free.

My current question: when you copy cURL from API docs, what is the first thing that slows you down—editing auth, understanding a nested response, comparing requests, or dealing with CORS?

Maker/source disclosure: https://github.com/ailuvu-art/curl-to-formater-json

## Newsletter outreach email

**Subject:** Open-source cURL response viewer for possible inclusion

Hi {{name}},

I built CurlLens, a free open-source tool for developers who copy cURL examples from API documentation and want to inspect the JSON response quickly:

https://www.curljson.help/

It parses common cURL URL, method, header, and body options, runs the request directly in the browser, and renders the response as an expandable tree, highlighted code, or raw text. The multi-request workspace is useful for comparing endpoints. Source code is available at https://github.com/ailuvu-art/curl-to-formater-json.

I thought it might fit {{publication/community}} because {{one specific sentence tied to their audience or recent issue}}. No worries if it is not a fit. I am happy to provide technical details or a screenshot, and I would value any feedback.

Thanks,
{{your name}}

## API documentation author outreach

**Subject:** Optional response-viewer link for your cURL examples

Hi {{name}},

Your documentation for {{specific API/endpoint}} includes clear cURL examples. I maintain CurlLens, an open-source browser tool that lets readers paste a cURL example and inspect browser-compatible JSON responses in tree, code, or text views:

https://www.curljson.help/

If it would genuinely help your readers, you could mention it as an optional response-inspection tool near the examples. Because it runs in a browser, the API must allow CORS; I would only suggest it for endpoints that officially support browser access.

Source and privacy details: https://github.com/ailuvu-art/curl-to-formater-json

Either way, thank you for maintaining the documentation.

## Directory submission fields

### AlternativeTo

- Name: CurlLens
- URL: https://www.curljson.help/
- Platforms: Web, Self-Hosted (only select Self-Hosted if reviewers accept the public source and local installation path)
- License: Open Source / MIT
- Categories: API Client, JSON Viewer, Developer Tool
- Suggested alternatives: Postman, Insomnia, Hoppscotch, HTTPie for Web
- Differentiator: Focused paste-run-inspect workflow for cURL examples and JSON responses; no account required.

### StackShare

- Tool name: CurlLens
- Website: https://www.curljson.help/
- Source: https://github.com/ailuvu-art/curl-to-formater-json
- Category: API Tools / Utilities
- Description: Browser-based cURL request runner and JSON response inspector with tree, code, text, and multi-request workspace views.

### OpenSourceAlternative.to

Submit only if its current rules accept projects that are self-hostable from source. Describe the project honestly as an open-source alternative for the focused request/response inspection portion of Postman or Insomnia—not as a replacement for all collaboration and automation features.

### BetaList

Submit only while the product meets BetaList's current definition of a new startup/product. Do not represent an established tool as unreleased. Use the live custom-domain landing page and request actionable early feedback.

## Reputable channels and links

Verify current requirements immediately before submitting:

- AlternativeTo: https://alternativeto.net/manage-item/
- StackShare: https://stackshare.io/submit
- Product Hunt: https://www.producthunt.com/posts/new
- OpenSourceAlternative.to: https://opensourcealternative.to/submit
- Show HN guidance: https://news.ycombinator.com/showhn.html
- Changelog News: https://changelog.com/news/submit
- DEV #showdev: https://dev.to/t/showdev
- Indie Hackers products: https://www.indiehackers.com/products
- BetaList criteria: https://betalist.com/criteria
- BetaList submit: https://betalist.com/submit

Conditional or later-stage options:

- Awesome API Clients requires the project's current eligibility rules, including meaningful community traction. Do not submit before qualifying: https://github.com/stepci/awesome-api-clients
- Awesome Selfhosted requires a mature, genuinely self-hostable project and compliance with its contribution rules. Do not submit only for a backlink.

## Personalized outreach targets

Research a recent issue/article before contacting any of these:

- Console — selection criteria: https://console.dev/selection-criteria; contact: hello@console.dev
- Changelog News — https://changelog.com/news/submit
- APIs You Won't Hate community — https://apisyouwonthate.com/community/
- Kin Lane / API Evangelist — use the current contact method on https://apievangelist.com/
- Nordic APIs — use the current editorial/contact route on https://nordicapis.com/
- Cooperpress developer publications — https://cooperpress.com/publications/; editor@cooperpress.com

## Ethical promotion checklist

- Read every site's rules before posting.
- Use your real maker identity and disclose your connection.
- Tailor the message to the audience instead of copying it verbatim.
- Lead with a useful lesson, demo, or feedback question.
- Reply to comments and fix issues people identify.
- Do not buy backlinks, reviews, votes, stars, or directory packages.
- Do not mass-email scraped contacts.
- Do not submit to unrelated generic SEO directories.
- Track submissions once and avoid duplicate posts.
