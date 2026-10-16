"use strict";

const api = globalThis.browser || globalThis.chrome;
const promiseApi = typeof globalThis.browser !== "undefined";
const adapter =
  (typeof globalThis !== "undefined" &&
    globalThis.RadarBrowserAdapter &&
    globalThis.RadarBrowserAdapter.BrowserAdapter) ||
  {
    tabs: { query: (q) => callApi(api.tabs.query.bind(api.tabs), q) },
    bookmarks: {
      getTree: () => callApi(api.bookmarks.getTree.bind(api.bookmarks)),
      getSubTree: (id) => callApi(api.bookmarks.getSubTree.bind(api.bookmarks), id),
    },
    runtime: {
      sendMessage: (msg) => callApi(api.runtime.sendMessage.bind(api.runtime), msg),
      getBrowserSource: browserSource,
    },
    downloads: {
      download: (opts) => callApi(api.downloads.download.bind(api.downloads), opts),
    },
  };

const status = document.getElementById("queue-status");
const count = document.getElementById("queue-count");
const exportButton = document.getElementById("export-batch");
const clearButton = document.getElementById("clear-batch");
const folderSelect = document.getElementById("bookmark-folder");
let nextBatchId = null;
let exportedBatchId = null;
let exporting = false;

function browserSource() {
  return adapter.runtime.getBrowserSource ? adapter.runtime.getBrowserSource() : "chromium";
}

function callApi(method, ...args) {
  if (promiseApi) {
    try {
      return Promise.resolve(method(...args));
    } catch (error) {
      return Promise.reject(error);
    }
  }
  return new Promise((resolve, reject) => {
    method(...args, (result) => {
      const error = api.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve(result);
    });
  });
}

function send(type, details = {}) {
  return adapter.runtime.sendMessage({ type, ...details }).then(
    (response) => {
      if (!response || response.ok !== true)
        throw new Error(response?.error || "Radar extension request failed.");
      return response;
    },
  );
}

async function getTabs(query) {
  return adapter.tabs.query(query);
}

function updateStatus(message, isError = false) {
  status.textContent = message;
  status.dataset.error = String(isError);
}

async function refreshQueue() {
  const response = await send("LIST_QUEUE");
  const items = (response.items || []).sort(
    (a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt),
  );
  count.textContent = String(items.length);
  const first = items[0];
  nextBatchId = first?.batchId || null;
  exportButton.disabled = !nextBatchId || exporting;
  clearButton.disabled = !nextBatchId || exporting || exportedBatchId !== nextBatchId;
  if (!items.length)
    updateStatus("No staged captures. They will remain here until exported and reviewed.");
  else
    updateStatus(
      `${items.length} staged capture${items.length === 1 ? "" : "s"} · oldest batch ready to export.`,
    );
}

function onFailure(error) {
  updateStatus(error instanceof Error ? error.message : "The browser operation failed.", true);
}

async function stageTabs(tabs, windowId, label) {
  const batch = RadarUtils.makeBatch(tabs, browserSource(), windowId, label);
  if (!batch.items.length) {
    updateStatus("No HTTP(S) pages could be staged. Internal browser pages are skipped.", true);
    return;
  }
  const response = await send("QUEUE_BATCH", { batch });
  await refreshQueue();
  updateStatus(
    `${response.added} staged · ${response.duplicates} duplicate${response.duplicates === 1 ? "" : "s"} skipped.`,
  );
}

document.getElementById("capture-tab").addEventListener("click", async () => {
  try {
    const tabs = await getTabs({ active: true, currentWindow: true });
    if (tabs.length === 0) throw new Error("No active tab is available.");
    await stageTabs(tabs, tabs[0].windowId, "Current tab");
  } catch (error) {
    onFailure(error);
  }
});

document.getElementById("capture-window").addEventListener("click", async () => {
  try {
    const tabs = await getTabs({ currentWindow: true });
    const limited = tabs.slice(0, RadarUtils.MAX_ITEMS);
    await stageTabs(limited, tabs[0]?.windowId, `Current window (${limited.length} tabs)`);
    if (tabs.length > limited.length)
      updateStatus(
        `Staged the first ${RadarUtils.MAX_ITEMS} tabs; ${tabs.length - limited.length} were not included.`,
      );
  } catch (error) {
    onFailure(error);
  }
});

function addBookmarkFolders(nodes, depth = 0) {
  for (const node of nodes) {
    if (!node.url && Array.isArray(node.children) && node.children.length > 0) {
      const option = document.createElement("option");
      option.value = node.id;
      option.textContent = `${"· ".repeat(Math.min(depth, 4))}${node.title || "Bookmarks"}`;
      folderSelect.append(option);
      addBookmarkFolders(node.children, depth + 1);
    }
  }
}

callApi(api.bookmarks.getTree.bind(api.bookmarks)).then(addBookmarkFolders).catch(onFailure);

document.getElementById("capture-bookmarks").addEventListener("click", async () => {
  try {
    const folderId = folderSelect.value;
    if (!folderId) throw new Error("Choose a bookmark folder first.");
    const [folder] = await callApi(api.bookmarks.getSubTree.bind(api.bookmarks), folderId);
    if (!folder) throw new Error("That bookmark folder is no longer available.");
    const bookmarks = RadarUtils.flattenBookmarks(folder, []);
    const batch = RadarUtils.makeBatch(
      bookmarks,
      browserSource(),
      undefined,
      `Bookmarks: ${folder.title}`,
    );
    if (!batch.items.length)
      throw new Error("This folder contains no capturable HTTP(S) bookmarks.");
    const response = await send("QUEUE_BATCH", { batch });
    await refreshQueue();
    updateStatus(`${response.added} bookmarks staged · ${response.duplicates} duplicates skipped.`);
  } catch (error) {
    onFailure(error);
  }
});

exportButton.addEventListener("click", async () => {
  if (!nextBatchId || exporting) return;
  exporting = true;
  let resultMessage = null;
  let resultIsError = false;
  try {
    const { batch } = await send("EXPORT_BATCH", { batchId: nextBatchId });
    const blob = new Blob([JSON.stringify(batch, null, 2)], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);
    await callApi(api.downloads.download.bind(api.downloads), {
      url: objectUrl,
      filename: `chronicles-vault-radar-${batch.batchId}.json`,
      saveAs: true,
    });
    exportedBatchId = batch.batchId;
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    resultMessage = "Exported batch. Import the JSON file in Chronicles Vault → Radar.";
  } catch (error) {
    resultMessage = error instanceof Error ? error.message : "The export failed.";
    resultIsError = true;
  } finally {
    exporting = false;
    try {
      await refreshQueue();
    } catch (error) {
      onFailure(error);
      return;
    }
    if (resultMessage) updateStatus(resultMessage, resultIsError);
  }
});

clearButton.addEventListener("click", async () => {
  if (!nextBatchId || exporting) return;
  try {
    const batchId = nextBatchId;
    await send("CLEAR_BATCH", { batchId });
    await refreshQueue();
    updateStatus("Exported batch cleared from this browser.");
  } catch (error) {
    onFailure(error);
  }
});

refreshQueue().catch(onFailure);
