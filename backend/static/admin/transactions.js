let allTransactions = [];

async function loadTransactions() {
    try {
        const response = await fetch('/transactions');
        const data = await response.json();

        allTransactions = data;

        displayTransactions(allTransactions);
    } catch (error) {
        console.error("Error loading transactions:", error);
    }
}

function displayTransactions(dataList) {
    const tbody = document.getElementById('transactionTableBody');
    tbody.innerHTML = '';

    if (dataList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No transactions found matching the filters.</td></tr>`;
        return;
    }

    dataList.forEach(order => {
        const row = `<tr>
            <td>#${order.order_id}</td>
            <td>${new Date(order.updated_at).toLocaleString()}</td>
            <td><span class="badge ${order.order_mode === 'Dine-in' ? 'bg-info text-dark' : 'bg-secondary'}">${order.order_mode}</span></td>
            <td>${order.payment_method}</td>
            <td class="fw-bold">₱${order.amount_paid.toFixed(2)}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

function filterTransactions() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const paymentFilter = document.getElementById('paymentFilter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;

    const filtered = allTransactions.filter(order => {
        const matchesSearch = !searchQuery ||
            (order.order_id && order.order_id.toString().includes(searchQuery));

        const matchesType = !typeFilter || order.order_mode === typeFilter;
        const matchesPayment = !paymentFilter || order.payment_method === paymentFilter;

        let matchesDate = true;
        if (order.updated_at) {
            const orderDate = new Date(order.updated_at).setHours(0, 0, 0, 0);

            if (dateFrom) {
                const fromDate = new Date(dateFrom).setHours(0, 0, 0, 0);
                if (orderDate < fromDate) matchesDate = false;
            }
            if (dateTo) {
                const toDate = new Date(dateTo).setHours(0, 0, 0, 0);
                if (orderDate > toDate) matchesDate = false;
            }
        }

        return matchesSearch && matchesType && matchesPayment && matchesDate;
    });

    displayTransactions(filtered);
}

function clearDates() {
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    filterTransactions(); // Refresh UI view after clearing values
}

document.addEventListener("DOMContentLoaded", () => {
    loadTransactions();

    document.getElementById('searchInput').addEventListener('input', filterTransactions);
    document.getElementById('typeFilter').addEventListener('change', filterTransactions);
    document.getElementById('paymentFilter').addEventListener('change', filterTransactions);
    document.getElementById('dateFrom').addEventListener('change', filterTransactions);
    document.getElementById('dateTo').addEventListener('change', filterTransactions);
});