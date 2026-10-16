"use strict";

if (typeof importScripts === "function") importScripts("capture-utils.js");

const api = globalThis.browser || globalThis.chrome;
const promiseApi = typeof globalThis.browser !== "undefined";
const DB_NAME = "chronicles-vault-radar";
const STORE_NAME = "captures";
const MAX_QUEUE_ITEMS = 1000;

function openQueue() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("Could not open the Radar offline queue."));
  });
}

async function withQueue(mode, operation) {
  const db = await openQueue();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    let result;
    try {
      result = operation(store);
    } catch (error) {
      db.close();
      reject(error);
      return;
    }
    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("Could not update the Radar offline queue."));
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error || new Error("Radar queue update was cancelled."));
    };
  });
}

function readQueue() {
  return openQueue().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(request.error || new Error("Could not read the Radar offline queue."));
        transaction.oncomplete = () => db.close();
        transaction.onabort = () => {
          db.close();
          reject(transaction.error || new Error("Could not read the Radar offline queue."));
        };
      }),
  );
}

async function enqueue(batch) {
  if (
    !batch ||
    batch.format !== "chronicles-vault-radar" ||
    !Array.isArray(batch.items) ||
    batch.items.length > RadarUtils.MAX_ITEMS
  ) {
    throw new Error("The capture batch is invalid or exceeds the 100-item limit.");
  }
  const existing = await readQueue();
  const now = Date.now();
  const added = [];
  const seenInBatch = new Set();
  for (const item of batch.items) {
    const url = RadarUtils.safeUrl(item.url);
    if (!url || typeof item.id !== "string" || typeof item.title !== "string") continue;
    if (seenInBatch.has(url)) continue;
    seenInBatch.add(url);
    const duplicate = existing.some(
      (queued) =>
        queued.url === url && Math.abs(now - Date.parse(queued.capturedAt)) <= 24 * 60 * 60 * 1000,
    );
    if (duplicate) continue;
    added.push({ ...item, url });
  }
  if (existing.length + added.length > MAX_QUEUE_ITEMS) {
    throw new Error(
      `The offline queue is full (${MAX_QUEUE_ITEMS} captures). Export and clear a batch before capturing more.`,
    );
  }
  await withQueue("readwrite", (store) => added.forEach((item) => store.put(item)));
  return { added: added.length, duplicates: batch.items.length - added.length };
}

async function getExportBatch(batchId) {
  const queued = await readQueue();
  const batchItems = queued
    .filter((item) => item.batchId === batchId)
    .sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt))
    .slice(0, RadarUtils.MAX_ITEMS);
  if (batchItems.length === 0)
    throw new Error("That capture batch is no longer in the offline queue.");
  const first = batchItems[0];
  return {
    format: "chronicles-vault-radar",
    version: 1,
    batchId: first.batchId,
    batchLabel: first.batchLabel,
    browserSource: first.browserSource,
    capturedAt: first.capturedAt,
    items: batchItems,
  };
}

api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string") return false;
  let task;
  if (message.type === "QUEUE_BATCH") {
    task = enqueue(message.batch);
  } else if (message.type === "LIST_QUEUE") {
    task = readQueue().then((items) => ({ items }));
  } else if (message.type === "EXPORT_BATCH" && typeof message.batchId === "string") {
    task = getExportBatch(message.batchId).then((batch) => ({ batch }));
  } else if (message.type === "CLEAR_BATCH" && typeof message.batchId === "string") {
    task = readQueue()
      .then((items) =>
        withQueue("readwrite", (store) =>
          items
            .filter((item) => item.batchId === message.batchId)
            .forEach((item) => store.delete(item.id)),
        ),
      )
      .then(() => ({ cleared: true }));
  } else {
    return false;
  }

  if (promiseApi) {
    return task.then(
      (result) => ({ ok: true, ...result }),
      (error) => ({
        ok: false,
        error: error instanceof Error ? error.message : "Radar queue operation failed.",
      }),
    );
  }

  task.then(
    (result) => sendResponse({ ok: true, ...result }),
    (error) =>
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Radar queue operation failed.",
      }),
  );
  return true;
});
