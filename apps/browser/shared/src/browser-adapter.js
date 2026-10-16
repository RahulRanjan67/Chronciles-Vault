(function (root) {
  "use strict";

  function createBrowserAdapter(customApi, customUserAgent) {
    const api =
      customApi ||
      (typeof globalThis !== "undefined" &&
        (globalThis.browser || globalThis.chrome)) ||
      {};

    const isPromiseApi =
      typeof globalThis !== "undefined" &&
      typeof globalThis.browser !== "undefined" &&
      globalThis.browser === api;

    function invokeApi(fn, ...args) {
      if (!fn) {
        return Promise.reject(new Error("Browser API method is not available."));
      }
      if (isPromiseApi) {
        try {
          return Promise.resolve(fn(...args));
        } catch (error) {
          return Promise.reject(error);
        }
      }
      return new Promise((resolve, reject) => {
        try {
          fn(...args, (result) => {
            const lastError = api.runtime?.lastError;
            if (lastError) {
              reject(new Error(lastError.message));
            } else {
              resolve(result);
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    }

    function getBrowserSource() {
      const agent =
        customUserAgent ||
        (typeof navigator !== "undefined" ? navigator.userAgent : "");
      if (/Firefox\//.test(agent)) return "firefox";
      if (/Edg\//.test(agent)) return "edge";
      return "chromium";
    }

    const tabs = {
      query(queryInfo) {
        if (!api.tabs?.query) return Promise.resolve([]);
        return invokeApi(api.tabs.query.bind(api.tabs), queryInfo);
      },
      get(tabId) {
        if (!api.tabs?.get) return Promise.reject(new Error("tabs.get unavailable"));
        return invokeApi(api.tabs.get.bind(api.tabs), tabId);
      },
    };

    const bookmarks = {
      getTree() {
        if (!api.bookmarks?.getTree) return Promise.resolve([]);
        return invokeApi(api.bookmarks.getTree.bind(api.bookmarks));
      },
      getSubTree(id) {
        if (!api.bookmarks?.getSubTree) return Promise.resolve([]);
        return invokeApi(api.bookmarks.getSubTree.bind(api.bookmarks), id);
      },
    };

    const windows = {
      getCurrent(getInfo) {
        if (!api.windows?.getCurrent) return Promise.resolve(null);
        return invokeApi(api.windows.getCurrent.bind(api.windows), getInfo);
      },
      getAll(getInfo) {
        if (!api.windows?.getAll) return Promise.resolve([]);
        return invokeApi(api.windows.getAll.bind(api.windows), getInfo);
      },
    };

    const runtime = {
      sendMessage(message) {
        if (!api.runtime?.sendMessage) {
          return Promise.reject(new Error("runtime.sendMessage unavailable"));
        }
        return invokeApi(api.runtime.sendMessage.bind(api.runtime), message);
      },
      getManifest() {
        if (!api.runtime?.getManifest) return {};
        return api.runtime.getManifest();
      },
      getBrowserSource,
    };

    const downloads = {
      download(options) {
        if (!api.downloads?.download) {
          return Promise.reject(new Error("downloads.download unavailable"));
        }
        return invokeApi(api.downloads.download.bind(api.downloads), options);
      },
    };

    return {
      tabs,
      bookmarks,
      windows,
      runtime,
      downloads,
      isPromiseApi,
    };
  }

  const defaultAdapter = createBrowserAdapter();

  const exportsObj = {
    createBrowserAdapter,
    BrowserAdapter: defaultAdapter,
  };

  root.RadarBrowserAdapter = exportsObj;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = exportsObj;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
