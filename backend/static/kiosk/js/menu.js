// =============================================
// menu.js — customer menu logic
// =============================================

let menuData = {};
let cart = loadSavedCart();         // { itemName: { price, qty, img } }
let currentCat = '';
let currentSearch = '';

function loadSavedCart() {
    try {
        return JSON.parse(localStorage.getItem('amarriCart')) || {};
    } catch (error) {
        console.warn('Saved cart is invalid. Starting with an empty cart.', error);
        return {};
    }
}

function saveCart() {
    localStorage.setItem('amarriCart', JSON.stringify(cart));
}

// ——— Read mode from URL (set by index.html) ———
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');
if (mode === 'takeout') {
    document.getElementById('modeBadge').textContent = 'Take-Out';
}

// ——— Load menu from API, fall back to placeholder ———
async function loadMenu()
{
    try {
        const response = await fetch('/kiosk/products'); // FastAPI
        if (!response.ok) throw new Error('API not ready');
        menuData = await response.json();


        
    } catch (error)
    {
        console.warn('API not available, using placeholder data:', error);
        
        
    }

    renderCategories();
    renderMenu();
}

// ——— Build the category sidebar from menuData ———
function renderCategories() {
    const sidebar = document.getElementById('catSidebar');
    const categories = Object.keys(menuData);

    sidebar.innerHTML = categories.map((cat, index) => `
    <button class="cat-btn ${index === 0 ? 'active' : ''}"
            onclick="selectCat(this, '${cat}')">
      ${cat}
    </button>
  `).join('');

    currentCat = categories[0];
}

// ——— Render menu items for the current category / search ———
function renderMenu() {
    const grid = document.getElementById('menuGrid');
    const title = document.getElementById('catTitle');
    let items;

    if (currentSearch) {
        const q = currentSearch.toLowerCase();
        items = Object.values(menuData).flat().filter(i =>
            i.name.toLowerCase().includes(q)
        );
        title.textContent = `Results for "${currentSearch}"`;
    } else {
        items = menuData[currentCat] || [];
        title.textContent = currentCat;
    }

    if (items.length === 0) {
        grid.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <p>No items found</p>
      </div>`;
        return;
    }

    // NOTE: item.name may contain apostrophes (e.g. "Amarri's").
    // We use data attributes to avoid breaking the onclick string.
    grid.innerHTML = items.map((item, i) => `
    <div class="menu-item" onclick='addToCart(${i},${item.product_id}, ${JSON.stringify(item.name)}, ${item.price}, ${JSON.stringify(item.image_url)})'>
      <div class="item-img">
        <img src="${item.image_url}" alt="${item.name}" />
      </div>
      <div class="item-info">
        <strong>${item.name}</strong>
        <div class="price">${item.price > 0 ? '₱' + item.price + '.00' : 'Included'}</div>
      </div>
      <div class="add-badge">+</div>
    </div>
  `).join('');
}

// ——— Category selection ———
function selectCat(btn, cat) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCat = cat;
    currentSearch = '';
    document.querySelector('.menu-search input').value = '';
    renderMenu();
}

// ——— Search filter ———
function filterMenu(val) {
    currentSearch = val;
    renderMenu();
}

// ——— Cart: add item ———
function addToCart(index, id, name, price, img) {
    if (cart[name]) {
        cart[name].qty++;
    } else {
        cart[name] = { id, price, qty: 1, img };
    }
    saveCart();
    updateCartCount();
    showToast(`Added: ${name}`);
}

// ——— Cart: update badge count ———
function updateCartCount() {
    const total = Object.values(cart).reduce((sum, i) => sum + i.qty, 0);
    document.getElementById('cartCount').textContent = total;
}

// ——— Cart: render drawer contents ———
function renderCart() {
    const el = document.getElementById('cartItems');
    const keys = Object.keys(cart);

    if (keys.length === 0) {
        el.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
        document.getElementById('cartTotalRow').style.display = 'none';
        document.getElementById('placeOrderBtn').style.display = 'none';
        return;
    }

    el.innerHTML = keys.map(name => {
        const item = cart[name];
        return `
      <div class="cart-item">
        <div>
          <div class="cart-item-name">${name}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick='changeQty(${JSON.stringify(name)}, -1)'>−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick='changeQty(${JSON.stringify(name)}, 1)'>+</button>
          </div>
        </div>
        <div class="cart-item-price">₱${item.price * item.qty}</div>
      </div>`;
    }).join('');

    const total = keys.reduce((sum, n) => sum + cart[n].price * cart[n].qty, 0);
    document.getElementById('cartTotal').textContent = '₱' + total;
    document.getElementById('cartTotalRow').style.display = 'flex';
    document.getElementById('placeOrderBtn').style.display = 'block';
}

// ——— Cart: change quantity ———
function changeQty(name, delta) {
    cart[name].qty += delta;
    if (cart[name].qty <= 0) delete cart[name];
    saveCart();
    updateCartCount();
    renderCart();
}

// ——— Cart: toggle drawer open/close ———
function toggleCart() {
    const overlay = document.getElementById('cartOverlay');
    const drawer = document.getElementById('cartDrawer');
    const isOpen = drawer.classList.contains('open');

    if (!isOpen) renderCart();

    overlay.classList.toggle('open', !isOpen);
    drawer.classList.toggle('open', !isOpen);
}

// ——— Cart: place order ———
function placeOrder()
{

    localStorage.setItem(
        'amarriCart',
        JSON.stringify(cart)
    );

    localStorage.setItem(
        'amarriMode',
        document.getElementById('modeBadge').textContent
    );

    window.location.href = '/static/kiosk/html/cart.html';
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

// ——— Init ———
updateCartCount();
loadMenu();
