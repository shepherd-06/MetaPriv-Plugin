browser.runtime.onInstalled.addListener(function (details) {
    console.log("Facebook Privacy Enhancer installed/updated:", details.reason);
});
