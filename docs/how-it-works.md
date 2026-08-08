# How engine.js Works

`engine.js` turns `<a>` links into SPA navigation. It fetches the new
page's HTML, swaps the `<body>`, and re-runs any `<script>` tags.
Everything is in one class, `Engine`.

```js
const engine = new Engine({ routes, enabled });
```

| Feature | What it does |
|---|---|
| `routes` | Only intercepts links matching these glob patterns |
| `enabled` | Turns interception on/off |
| `data-no-spa` | Skips interception for this link |
| Body swap | Replaces content without a reload |
| Script re-run | Makes scripts in the new content work |
| Component cache | `data-spa-component="id"` keeps an element's state across navigation |
| Loading bar | Shows during fetch, attached to `<html>` so it survives the swap |
| History / `popstate` | Updates the URL and makes Back/Forward work |
| Error fallback | Falls back to a real page load if the fetch fails |

## Key points

- One `click` listener on `document` and one `popstate` listener on
  `window`, set once. They survive every body swap.
- On click, the engine checks: enabled, modifier keys, `target="_blank"`,
  `data-no-spa`, same origin, route match. If any check fails, the browser
  navigates normally.
- `_navigate` is async: fetch, parse with `DOMParser`, swap the body,
  update the URL, run the scripts. Any error falls back to
  `window.location.href = href`.
- Browsers don't run `<script>` tags added via `innerHTML`. So the engine
  creates new `<script>` elements to force execution, in order.
- Component cache: before swapping, it saves elements with
  `[data-spa-component]` and reuses the same DOM node in the new page — no
  lost state, no flash.

## Known limitations

- A same-page `<a href="#section">` link gets intercepted if its path
  matches a route, instead of scrolling to the anchor.
- Each page's own `<script>` (like the init snippet in `example/*.html`)
  re-runs on every navigation. Listeners and timers it creates are never
  cleaned up, so they build up over repeated navigation in one session.
