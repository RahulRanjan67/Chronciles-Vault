(function (root) {
  "use strict";

  const SENSITIVE_PARAMETER =
    /(^|[-_])(access[-_]?token|api[-_]?key|auth|authorization|cookie|jwt|password|passwd|refresh[-_]?token|secret|session(id|key)?|sid|token)([-_]|$)/i;
  const TRACKING_PARAMETER = /^(utm_|ga_|_gl|_ga)/i;
  const TRACKING_NAMES = new Set([
    "aff",
    "affiliate",
    "fbclid",
    "fbc",
    "fbp",
    "gclid",
    "gclsrc",
    "dclid",
    "mc_cid",
    "mc_eid",
    "_hsenc",
    "_hsmi",
    "igshid",
    "msclkid",
    "ref",
    "referrer",
    "source",
    "spm",
    "share_id",
    "si",
    "feature",
    "vero_id",
    "wickedid",
    "ttclid",
    "twclid",
    "yclid",
    "utm_reader",
    "session_id",
    "jsessionid",
    "phpsessid",
    "_",
    "v",
    "t",
    "timestamp",
  ]);
  const MAX_ITEMS = 100;

  function safeUrl(value) {
    if (typeof value !== "string" || value.length > 4096) return null;
    let url;
    try {
      url = new URL(value);
    } catch {
      return null;
    }
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password)
      return null;
    for (const key of Array.from(url.searchParams.keys())) {
      const normalizedKey = key.replace(/([a-z0-9])([A-Z])/g, "$1_$2");
      if (
        SENSITIVE_PARAMETER.test(normalizedKey) ||
        TRACKING_PARAMETER.test(key) ||
        TRACKING_NAMES.has(key.toLowerCase())
      ) {
        url.searchParams.delete(key);
      }
    }
    url.hash = "";
    url.searchParams.sort();
    return url.toString();
  }

  function makeBatch(tabs, browserSource, windowId, batchLabel) {
    const capturedAt = new Date().toISOString();
    const batchId = crypto.randomUUID();
    const seen = new Set();
    const items = [];

    for (const tab of tabs.slice(0, MAX_ITEMS)) {
      const url = safeUrl(tab.url);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      items.push({
        id: crypto.randomUUID(),
        url,
        title: (typeof tab.title === "string" && tab.title.trim()
          ? tab.title.trim()
          : new URL(url).hostname
        ).slice(0, 500),
        browserSource,
        ...(Number.isSafeInteger(windowId) && windowId >= 0 ? { windowId } : {}),
        ...(Number.isSafeInteger(tab.id) && tab.id >= 0 ? { tabId: tab.id } : {}),
        capturedAt,
        batchId,
        batchLabel: batchLabel.slice(0, 200),
      });
    }

    return {
      format: "chronicles-vault-radar",
      version: 1,
      batchId,
      batchLabel: batchLabel.slice(0, 200),
      browserSource,
      capturedAt,
      items,
    };
  }

  function flattenBookmarks(node, result = []) {
    const pending = [node];
    let visited = 0;
    while (pending.length > 0 && result.length < MAX_ITEMS && visited < 10000) {
      const current = pending.pop();
      visited += 1;
      if (!current || typeof current !== "object") continue;
      if (typeof current.url === "string") {
        result.push({
          id: Number.isSafeInteger(Number(current.id)) ? Number(current.id) : undefined,
          url: current.url,
          title: current.title || current.url,
        });
        continue;
      }
      if (Array.isArray(current.children)) {
        for (let index = current.children.length - 1; index >= 0; index -= 1) {
          pending.push(current.children[index]);
        }
      }
    }
    return result;
  }

  root.RadarUtils = { MAX_ITEMS, safeUrl, makeBatch, flattenBookmarks };
})(globalThis);
