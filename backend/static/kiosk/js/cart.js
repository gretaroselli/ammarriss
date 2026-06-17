// =============================================
// cart.js - order summary page logic
// =============================================

const CART_KEY = 'amarriCart';
const MODE_KEY = 'amarriMode';

let cart = {};

document.addEventListener('DOMContentLoaded', () => {
    cart = loadCart();
    wireCartActions();
    renderCart();
    wireButtons();
});

function loadCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || {};
    } catch (error) {
        console.warn('Saved cart is invalid. Starting with an empty cart.', error);
        return {};
    }
}

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getMode() {
    return localStorage.getItem(MODE_KEY) || 'Dine In';
}

function getModeQuery() {
    return getMode().includes('take') ? 'takeout' : 'Dine-in';
}

function getItems() {
    return Object.entries(cart).map(([name, item]) => ({
        id:item.id,
        name,
        price: Number(item.price) || 0,
        qty: Number(item.qty) || 0,
        img: item.img || '../images/placeholder.jpg',
    })).filter(item => item.qty > 0);
}

function renderCart() {
    const itemsWrap = document.querySelector('.cart-items');
    const footer = document.querySelector('.cart-footer');
    const items = getItems();

    if (!itemsWrap || !footer) return;

    if (items.length === 0) {
        itemsWrap.innerHTML = `
            <div class="cart-card empty-cart">
                <div class="cart-info">
                    <h3>Your cart is empty</h3>
                    <p>Add items from the menu to start your order.</p>
                </div>
            </div>
        `;
    } else {
        itemsWrap.innerHTML = items.map(item => `
            <div class="cart-card">
                <div class="cart-image">
                    <img src="${escapeAttr(item.img)}" alt="${escapeAttr(item.name)}">
                </div>

                <div class="cart-info">
                    <h3>${escapeHtml(item.name)}</h3>
                    <p>${formatCurrency(item.price)} each</p>

                    <div class="actions">
                        <button type="button" data-action="remove" data-name="${escapeAttr(item.name)}">REMOVE</button>
                        <button type="button" data-action="edit">EDIT</button>
                    </div>
                </div>

                <div class="cart-right">
                    <span>${formatCurrency(item.price * item.qty)}</span>

                    <div class="qty">
                        <button type="button" data-action="qty" data-name="${escapeAttr(item.name)}" data-delta="-1">-</button>
                        <span>${item.qty}</span>
                        <button type="button" data-action="qty" data-name="${escapeAttr(item.name)}" data-delta="1">+</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    footer.innerHTML = `
        <div>
            <strong>${escapeHtml(getMode())}</strong>
        </div>

        <div>
            Total ${formatCurrency(getTotal(items))}
        </div>
    `;

    updateButtonLinks();
}

function wireCartActions() {
    const itemsWrap = document.querySelector('.cart-items');
    if (!itemsWrap) return;

    itemsWrap.addEventListener('click', event => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const name = button.dataset.name;

        if (action === 'qty') {
            changeQty(name, Number(button.dataset.delta));
        }

        if (action === 'remove') {
            removeItem(name);
        }

        if (action === 'edit') {
            editOrder();
        }
    });
}

function changeQty(name, delta) {
    if (!cart[name]) return;

    cart[name].qty = (Number(cart[name].qty) || 0) + delta;

    if (cart[name].qty <= 0) {
        delete cart[name];
    }

    saveCart();
    renderCart();
}

function removeItem(name) {
    delete cart[name];
    saveCart();
    renderCart();
}

function editOrder() {
    window.location.href = `/static/kiosk/html/menu.html?mode=${getModeQuery()}`;
}

async function checkout(event) {
    event.preventDefault();
    if (getItems().length === 0) {
        alert('Your cart is empty. Go back to add items.');
        return;
    }

    await sendOrderToBackend();
}

function wireButtons() {
    const checkoutLink = document.querySelector('.cart-buttons a[href="/static/kiosk/html/payment.html"]');
    if (checkoutLink) {
        checkoutLink.addEventListener('click', checkout);
    }

    updateButtonLinks();
}

function updateButtonLinks() {
    const backLink = document.querySelector('.cart-buttons a[href^="menu.html"]');
    if (backLink) {
        backLink.href = `/static/kiosk/html/menu.html?mode=${getModeQuery()}`;
    }
}

function getTotal(items = getItems()) {
    return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function formatCurrency(value) {
    return `PHP ${Number(value || 0).toFixed(2)}`;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttr(value) {
    return escapeHtml(value);
}


// creates order in the backend
async function sendOrderToBackend() {
    const items = getItems(); // Gets the array containing [{id, name, price, qty}, ...]

    const orderPayload = {
        order_mode: getModeQuery(),
        items: items.map(item => ({
            product_id: item.id,
            quantity: item.qty
        }))
    };

    try {
        const response = await fetch('/kiosk/place-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        const data = await response.json();

        if (response.ok) {
            alert("Order placed successfully!");
            // localStorage.removeItem(CART_KEY);
            // cart = {};
            sessionStorage.setItem('currentOrderId', data.order_id);
            window.location.href = 'payment.html'; // Redirect on success
        } else {
            alert("Failed to submit order: " + (data.detail || "Unknown error"));
        }
    } catch (error) {
        console.error("Checkout Error:", error);
        alert("Network error: Could not connect to the backend server.");
    }
}