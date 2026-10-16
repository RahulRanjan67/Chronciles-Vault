const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

require("../shared/src/capture-utils.js");
const { flattenBookmarks, makeBatch, safeUrl } = globalThis.RadarUtils;

test("sanitizes unsafe and tracking URL components before staging", () => {
  assert.equal(
    safeUrl(
      "https://reader.example/chapter?token=secret&utm_source=browser&chapter=4#access_token=x",
    ),
    "https://reader.example/chapter?chapter=4",
  );
  assert.equal(
    safeUrl("https://reader.example/chapter?authToken=private&chapter=4"),
    "https://reader.example/chapter?chapter=4",
  );
  assert.equal(safeUrl("https://user:password@example.com/chapter"), null);
  assert.equal(safeUrl("chrome://settings"), null);
  assert.equal(
    safeUrl("https://reader.example/chapter?mc_cid=campaign&sessionId=private&chapter=4"),
    "https://reader.example/chapter?chapter=4",
  );
});

test("creates bounded, de-duplicated web-only batches", () => {
  const batch = makeBatch(
    [
      { id: 1, url: "https://example.com/page", title: "Page" },
      { id: 2, url: "https://EXAMPLE.com/page", title: "Duplicate" },
      { id: 3, url: "file:///private/book.pdf", title: "Local file" },
    ],
    "chromium",
    7,
    "Current window",
  );
  assert.equal(batch.items.length, 1);
  assert.equal(batch.items[0].windowId, 7);
  assert.equal(batch.items[0].url, "https://example.com/page");
  assert.equal("autoCloseTabsAfterCapture" in batch, false);
});

test("flattens only bookmark leaves and retains titles", () => {
  const items = flattenBookmarks(
    {
      id: "root",
      children: [
        { id: "folder", children: [{ id: "1", title: "Chapter", url: "https://example.com" }] },
      ],
    },
    [],
  );
  assert.deepEqual(items, [{ id: 1, url: "https://example.com", title: "Chapter" }]);
});

test("packages least-privilege Chromium and Firefox manifests", () => {
  for (const [browser, version] of [
    ["chromium", 3],
    ["firefox", 2],
  ]) {
    const manifest = JSON.parse(
      fs.readFileSync(`${__dirname}/../${browser}/manifest.json`, "utf8"),
    );
    assert.equal(manifest.manifest_version, version);
    assert.equal("host_permissions" in manifest, false);
    assert.equal("content_scripts" in manifest, false);
    assert.equal("optional_host_permissions" in manifest, false);
  }
});
