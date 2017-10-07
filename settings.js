function sanitize(url) {
    return url.split("#").pop().split("?").pop();
}

function getCurrentTabUrl(callback) {
    // Query filter to be passed to chrome.tabs.query - see
    // https://developer.chrome.com/extensions/tabs#method-query
    var queryInfo = {
      active: true,
      currentWindow: true
    };
  
    chrome.tabs.query(queryInfo, (tabs) => {
        var tab = tabs[0];
        var url = sanitize(tab.url);
        console.assert(typeof url == "string", "tab.url should be a string");
        callback(url);
    });
}

function getSavedWebhook(url, callback) {
    chrome.storage.sync.get(url, (items) => {
      callback(chrome.runtime.lastError ? null : items[url]);
    });
}

function saveWebhook(url, webhook) {
    var items = {};
    items[sanitize(url)] = webhook;
    chrome.storage.sync.set(items);
}

document.addEventListener("DOMContentLoaded", () => {
    getCurrentTabUrl((url) => {
        var input = document.getElementById("webhook_url");

        getSavedWebhook(url, (webhook) => {
            if (webhook) {
                input.value = webhook;
            }
        });

        input.addEventListener("change", () => {
            saveWebhook(url, input.value);
        });
    });
});
