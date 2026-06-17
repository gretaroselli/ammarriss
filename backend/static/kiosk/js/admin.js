// =============================================
// admin.js — login & dashboard logic
// =============================================

// Demo credentials — replace handleLogin() with a real fetch() to FastAPI later
const DEMO_USER = 'admin';
const DEMO_PASS = 'admin123';

// ——— Login ———
function handleLogin() {
    const name = document.getElementById('adminName').value.trim();
    const pass = document.getElementById('adminPass').value.trim();
    const err = document.getElementById('errorMsg');

    if (!name || !pass) {
        err.textContent = 'Please fill in all fields.';
        return;
    }

    // ── Swap this block with a fetch('/api/login') call once backend is ready ──
    if (name.toLowerCase() === DEMO_USER && pass === DEMO_PASS) {
        err.textContent = '';
        document.getElementById('loggedInName').textContent = name;
        showToast('Welcome, ' + name + '!');
        setTimeout(() => switchScreen('dashboard'), 600);
    } else {
        err.textContent = 'Invalid name or password.';
        document.getElementById('adminPass').value = '';
    }
    // ────────────────────────────────────────────────────────────────────────────
}

// ——— Sign out ———
function signOut() {
    document.getElementById('adminName').value = '';
    document.getElementById('adminPass').value = '';
    document.getElementById('errorMsg').textContent = '';
    switchScreen('login');
    showToast('Signed out.');
}

// ——— Switch between login and dashboard screens ———
function switchScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// ——— Sidebar nav active state ———
function setNav(btn) {
    document.querySelectorAll('.dash-nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// ——— Toast ———
let toastTimer;
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
