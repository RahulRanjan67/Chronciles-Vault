const { test } = require("node:test");
const assert = require("node:assert/strict");

require("../shared/src/browser-adapter.js");
const { createBrowserAdapter, BrowserAdapter } = globalThis.RadarBrowserAdapter;

test("BrowserAdapter handles query tabs with callback API", async () => {
  const mockApi = {
    tabs: {
      query(options, callback) {
        callback([{ id: 1, url: "https://example.com/ch1", title: "Chapter 1", windowId: 10 }]);
      },
    },
    runtime: {
      lastError: null,
    },
  };

  const adapter = createBrowserAdapter(mockApi, "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
  const tabs = await adapter.tabs.query({ currentWindow: true });
  assert.equal(tabs.length, 1);
  assert.equal(tabs[0].url, "https://example.com/ch1");
  assert.equal(adapter.runtime.getBrowserSource(), "chromium");
});

test("BrowserAdapter detects firefox user agent", () => {
  const adapter = createBrowserAdapter({}, "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0");
  assert.equal(adapter.runtime.getBrowserSource(), "firefox");
});

test("BrowserAdapter handles bookmarks getSubTree", async () => {
  const mockApi = {
    bookmarks: {
      getSubTree(id, callback) {
        callback([{ id, title: "Manga", children: [{ id: "2", title: "Solo Leveling", url: "https://asura.example" }] }]);
      },
    },
    runtime: {},
  };

  const adapter = createBrowserAdapter(mockApi);
  const result = await adapter.bookmarks.getSubTree("folder-1");
  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Manga");
});
