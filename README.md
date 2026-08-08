# SPA Engine

[![Test](https://github.com/dayvsonmarques/spa-engine/actions/workflows/test.yml/badge.svg)](https://github.com/dayvsonmarques/spa-engine/actions/workflows/test.yml)

A dependency-free Single Page Application engine (Liferay Frontend Engineer
exercise). Drop `engine.js` into an existing multi-page site and it
intercepts navigation on configured routes, swapping `<body>` content via
`fetch` instead of a full page reload.

```html
<script src="engine.js"></script>
<script>
  const engine = new Engine({
    routes: ['*.html', '/site/*'],
    enabled: true,
  });
</script>
```

## Features

- **`routes`** — glob patterns (`*` wildcard) matched against the link's
  `pathname`. Only matching same-origin links are intercepted.
- **`enabled`** — toggle SPA navigation on/off at runtime.
- **`data-no-spa`** — add to any `<a>` to opt it out of interception.
- Re-executes `<script>` tags (inline and external `src`) found in the
  fetched content, in order — required because scripts inserted via
  `innerHTML` don't run on their own.
- Updates the URL via `history.pushState` and supports the browser's
  Back/Forward buttons (`popstate`).
- Loading bar shown while a navigation is in flight.
- Falls back to a normal full-page navigation if the fetch fails.
- **Component state caching**: mark an element `data-spa-component="id"` and
  it survives navigation as the same live DOM node (no re-render, no flash,
  no lost state) whenever a page with a matching id is swapped in.

## Try it

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080/example/index.html`. Click around, click the
counter button before navigating (its count survives), try the "no SPA"
link, and try the browser's Back button.

> `fetch()` is blocked by CORS on `file://` — you must serve over HTTP.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dayvsonmarques/spa-engine)

Zero-config static deploy — `vercel.json` redirects `/` to the demo at
`/example/index.html`. No build step required.

## Tests

```bash
npm test
```

Zero dependencies (Node's built-in test runner). Runs on every push/PR via
GitHub Actions ([`.github/workflows/test.yml`](.github/workflows/test.yml)).
Covers the route-matching logic (`globToRegExp`/`matchesAnyRoute`, exposed
via `Engine._internal`). DOM/network-dependent behavior is covered by
manual testing against `example/` instead.

## Docs

How the engine works internally: [`docs/how-it-works.md`](docs/how-it-works.md).

General exercise questions: [`answers.md`](answers.md).
