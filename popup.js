document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    chrome.storage.local.get(['user'], (result) => {
        if (result.user) {
            showUserInfo(result.user);
        }
    });

    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const msgBox = document.getElementById('loginMsg');

        if (!username || !password) {
            msgBox.textContent = 'Username and password are required.';
            return;
        }

        try {
            // 🔐 Replace this with your real backend call
            const res = await fetch('http://127.0.0.1:5000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            console.log('Response:', data);

            if (!res.ok) {
                msgBox.textContent = data.message || 'Login failed.';
                return;
            }

            const user = {
                user_id: data.user_id,
                username: data.username,
                sessionToken: data.sessionToken,
                refreshToken: data.refreshToken
            };

            chrome.storage.local.set({ user });
            showUserInfo(user);
        } catch (err) {
            msgBox.textContent = `❌ Network error. Try again. ${err.message}`;
            console.error(err);
        }
    });

    logoutBtn.addEventListener('click', () => {
        chrome.storage.local.remove('user', () => {
            document.getElementById('user-info').style.display = 'none';
            document.getElementById('login-section').style.display = 'block';
        });
    });
});

function showUserInfo(user) {
    document.getElementById('displayUsername').textContent = user.username;
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('user-info').style.display = 'block';
}
