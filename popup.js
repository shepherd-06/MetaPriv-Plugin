// ─────────────────────────────────────────────
// Async-friendly chrome.storage helpers
// ─────────────────────────────────────────────
function getFromStorage(keys) {
    return new Promise((resolve) => {
        browser.storage.local.get(keys, (result) => resolve(result));
    });
}

function setToStorage(data) {
    return new Promise((resolve) => {
        browser.storage.local.set(data, () => resolve());
    });
}

function removeFromStorage(keys) {
    return new Promise((resolve) => {
        browser.storage.local.remove(keys, () => resolve());
    });
}

// ─────────────────────────────────────────────
// DOM is ready
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const syncBtn = document.getElementById('syncBtn');

    const { user, page_urls } = await getFromStorage(['user', 'page_urls']);
    if (user) {
        showUserInfo(user, page_urls || []);
    }

    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const msgBox = document.getElementById('loginMsg');

        if (!username || !password) {
            msgBox.textContent = 'Username and password are required.';
            return;
        }

        try {
            const res = await fetch('http://127.0.0.1:5000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                msgBox.textContent = data.message || 'Login failed.';
                return;
            }

            const user = {
                user_id: data.user_id,
                username: data.username,
                sessionToken: data.access_token,
                refreshToken: data.refresh_token
            };

            await setToStorage({ user });
            console.log('User data saved:', user);
            const page_urls = await fetchActivePages(user.sessionToken);
            await setToStorage({ page_urls });
            showUserInfo(user, page_urls);
        } catch (err) {
            msgBox.textContent = `❌ Network error. Try again. ${err.message}`;
            console.error(err);
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await removeFromStorage(['user', 'page_urls']);
        document.getElementById('user-info').style.display = 'none';
        document.getElementById('login-section').style.display = 'block';
    });

    syncBtn.addEventListener('click', async () => {
        const syncBtn = document.getElementById('syncBtn');
        const syncBtnText = document.getElementById('syncBtnText');
        const syncSpinner = document.getElementById('syncSpinner');

        syncSpinner.style.display = 'inline-block';
        syncBtn.disabled = true;

        const { user } = await getFromStorage(['user']);
        if (user) {
            const page_urls = await fetchActivePages(user.sessionToken);
            await setToStorage({ page_urls });
            showUserInfo(user, page_urls);
        }

        syncSpinner.style.display = 'none';
        syncBtn.disabled = false;
    });

});

// ─────────────────────────────────────────────
// Show user info and active page list
// ─────────────────────────────────────────────
function showUserInfo(user, pageUrls = []) {
    document.getElementById('displayUsername').textContent = user.username;
    const pageList = document.getElementById('pageList');
    pageList.innerHTML = '';

    pageUrls.forEach(url => {
        const li = document.createElement('li');
        li.className = 'list-group-item py-1 px-2';
        li.textContent = url;
        pageList.appendChild(li);
    });

    document.getElementById('login-section').style.display = 'none';
    document.getElementById('user-info').style.display = 'block';
}

// ─────────────────────────────────────────────
// Fetch active pages from server
// ─────────────────────────────────────────────
async function fetchActivePages(token) {
    try {
        const res = await fetch('http://127.0.0.1:5000/fetch/active', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();
        if (res.ok) return data.page_urls || [];

        console.error('Failed to sync pages:', data.message || res.statusText);
        return [];
    } catch (err) {
        console.error('Network error during sync:', err);
        return [];
    }
}
