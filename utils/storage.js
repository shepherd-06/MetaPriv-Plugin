// utils/storage.js
export function getFromStorage(keys) {
    return new Promise((resolve) => {
        browser.storage.local.get(keys, (result) => resolve(result));
    });
}

export function setToStorage(data) {
    return new Promise((resolve) => {
        browser.storage.local.set(data, () => resolve());
    });
}

export function removeFromStorage(keys) {
    return new Promise((resolve) => {
        browser.storage.local.remove(keys, () => resolve());
    });
}
