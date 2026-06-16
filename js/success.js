// =============================================
// success.js - order confirmation page
// =============================================

const CART_KEY = 'amarriCart';
const MODE_KEY = 'amarriMode';
const PAYMENT_KEY = 'amarriPayment';
const TOTAL_KEY = 'amarriOrderTotal';
const QUEUE_KEY = 'amarriQueueNumber';

document.addEventListener('DOMContentLoaded', () => {
    renderSuccess();
    wireNewOrder();
});

function renderSuccess() {
    const mode = localStorage.getItem(MODE_KEY) || 'Dine In';
    const payment = localStorage.getItem(PAYMENT_KEY) || 'Counter';
    const total = Number(localStorage.getItem(TOTAL_KEY)) || getCartTotal();
    const queue = localStorage.getItem(QUEUE_KEY) || createQueueNumber();

    document.getElementById('successMode').textContent = mode;
    document.getElementById('paymentMethod').textContent = payment;
    document.getElementById('orderTotal').textContent = formatCurrency(total);
    document.getElementById('queueNumber').textContent = queue;
    document.getElementById('successMessage').textContent = getMessage(payment);

    localStorage.setItem(QUEUE_KEY, queue);
}

function wireNewOrder() {
    document.getElementById('newOrderBtn').addEventListener('click', event => {
        event.stopPropagation();
        startNewOrder();
    });

    document.body.addEventListener('click', startNewOrder);
}

function startNewOrder() {
    [CART_KEY, MODE_KEY, PAYMENT_KEY, TOTAL_KEY, QUEUE_KEY].forEach(key => {
        localStorage.removeItem(key);
    });

    window.location.href = 'index.html';
}

function getMessage(payment) {
    if (payment === 'Online') {
        return 'Payment selected. Please show your queue number at the counter.';
    }

    return 'Please proceed to the counter to confirm payment.';
}

function getCartTotal() {
    try {
        const cart = JSON.parse(localStorage.getItem(CART_KEY)) || {};
        return Object.values(cart).reduce((sum, item) => {
            return sum + (Number(item.price) || 0) * (Number(item.qty) || 0);
        }, 0);
    } catch (error) {
        console.warn('Saved cart is invalid. Total set to zero.', error);
        return 0;
    }
}

function createQueueNumber() {
    const number = Math.floor(Math.random() * 900) + 100;
    return `B-${number}`;
}

function formatCurrency(value) {
    return `PHP ${Number(value || 0).toFixed(2)}`;
}
