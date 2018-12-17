var fmtJsonContextMenuItem = {
    "id": "Jipy:fmtJSON"
    , "title": "Format JSON"
    , "contexts": ["selection"]
};

var fmtJsonStringContextMenuItem = {
    "id": "Jipy:fmtJSONString"
    , "title": "Format Escaped JSON"
    , "contexts": ["selection"]
};

function runFormatter(cmd) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, cmd);
        }
    });
}

// SEE: https://developer.chrome.com/extensions/background_pages#initialization
chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create(fmtJsonContextMenuItem);
    chrome.contextMenus.create(fmtJsonStringContextMenuItem);
});

chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.sendMessage(tab.id, fmtJsonContextMenuItem.id);
});

chrome.contextMenus.onClicked.addListener(function (data) {
    if (data.menuItemId !== fmtJsonContextMenuItem.id
        && data.menuItemId !== fmtJsonStringContextMenuItem.id) {
        return;
    }
    runFormatter(data.menuItemId);
});

chrome.commands.onCommand.addListener(function (cmd) {
    if (cmd === 'FormatJSON') {
        runFormatter(fmtJsonContextMenuItem.id);
    }
    else if (cmd === 'FormatJSONString') {
        runFormatter(fmtJsonStringContextMenuItem.id);
    }
});