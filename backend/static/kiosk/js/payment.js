// =============================================
// payment.js - payment selection logic
// =============================================

const CART_KEY = 'amarriCart';
const MODE_KEY = 'amarriMode';
const PAYMENT_KEY = 'amarriPayment';
const TOTAL_KEY = 'amarriOrderTotal';
const QUEUE_KEY = 'amarriQueueNumber';

let selectedMethod = '';

document.addEventListener('DOMContentLoaded', () => {
    renderSummary();
    wirePaymentOptions();
    wireConfirmButton();
});

function loadCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || {};
    } catch (error) {
        console.warn('Saved cart is invalid. Starting with an empty cart.', error);
        return {};
    }
}

function getItems() {
    return Object.values(loadCart())
        .map(item => ({
            price: Number(item.price) || 0,
            qty: Number(item.qty) || 0,
        }))
        .filter(item => item.qty > 0);
}

function renderSummary() {
    const items = getItems();
    const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
    const total = getTotal(items);

    document.getElementById('orderMode').textContent = localStorage.getItem(MODE_KEY) || 'Dine In';
    document.getElementById('itemCount').textContent = itemCount;
    document.getElementById('paymentTotal').textContent = formatCurrency(total);

    if (itemCount === 0) {
        document.getElementById('paymentMessage').textContent = 'Your cart is empty. Go back to add items.';
    }
}

function wirePaymentOptions() {
    document.querySelectorAll('.payment-option').forEach(button => {
        button.addEventListener('click', () => {
            if (getItems().length === 0) return;

            selectedMethod = button.dataset.method;

            document.querySelectorAll('.payment-option').forEach(option => {
                option.classList.toggle('active', option === button);
            });

            document.getElementById('qrPanel').hidden = selectedMethod !== 'Online';
            document.getElementById('confirmPayment').disabled = false;
            document.getElementById('paymentMessage').textContent =
                selectedMethod === 'Online'
                    ? 'Scan the QR code, then confirm payment.'
                    : 'Confirm and pay at the counter.';
        });
    });
}

function wireConfirmButton() {
    document.getElementById('confirmPayment').addEventListener('click', () => {
        const items = getItems();
        const activeOrderId = sessionStorage.getItem('currentOrderId');

        if (!selectedMethod || items.length === 0) return;

        localStorage.setItem(PAYMENT_KEY, selectedMethod);
        localStorage.setItem(TOTAL_KEY, String(getTotal(items)));
        localStorage.setItem(QUEUE_KEY, createQueueNumber());

        window.location.href = 'sucess.html';
    });
}

function getTotal(items = getItems()) {
    return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function createQueueNumber() {
    return `O-${sessionStorage.getItem('currentOrderId')}`;
}

function formatCurrency(value) {
    return `PHP ${Number(value || 0).toFixed(2)}`;
}

