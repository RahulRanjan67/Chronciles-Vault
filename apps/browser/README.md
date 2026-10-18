# Radar browser companions

Build both extension folders from the shared sources:

```sh
pnpm --filter @chronicles-vault/browser build
```

Load `apps/browser/chromium` as an unpacked extension in a Chromium-based
browser, or load `apps/browser/firefox` temporarily from Firefox's
`about:debugging` page. The Chromium bundle uses Manifest V3; the Firefox bundle
uses its WebExtensions Manifest V2 compatibility configuration.

The popup can stage the active tab, up to 100 tabs in the current window, or up
to 100 bookmarks from a selected folder. Captures stay in the browser's
IndexedDB queue until explicitly exported as a JSON file. Import that file with
**Radar → Import Capture Batch** in Chronicles Vault. Clear the browser copy
only after confirming the import succeeded.

The companion captures only tab/bookmark titles and HTTP(S) URLs. It does not
read page content, request host access, contact a server, close tabs, or collect
credentials. URL fragments, tracking parameters, embedded URL credentials, and
credential-like query parameters are removed or rejected. Native messaging and
the local HTTP bridge are not implemented yet.
