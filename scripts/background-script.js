if (!browser.action.onClicked.hasListener(listener)) {
    browser.action.onClicked.addListener(listener);
}

function listener(tab) {
    browser.scripting.executeScript("./scripts/content-script.js");
}

