// =============================================
// admin.js — login & dashboard logic
// =============================================

// Demo credentials — replace handleLogin() with a real fetch() to FastAPI later
const DEMO_USER = 'admin';
const DEMO_PASS = 'admin123';

// ——— Login ———
async function handleLogin() {
    const name = document.getElementById('adminName').value.trim();
    const pass = document.getElementById('adminPass').value.trim();
    const err = document.getElementById('errorMsg');

    if (!name || !pass) {
        err.textContent = 'Please fill in all fields.';
        return;
    }

    // ── Swap this block with a fetch('/api/login') call once backend is ready ──
    // if (name.toLowerCase() === DEMO_USER && pass === DEMO_PASS) {
    //     err.textContent = '';
    //     document.getElementById('loggedInName').textContent = name;
    //     showToast('Welcome, ' + name + '!');
    //     setTimeout(() => switchScreen('dashboard'), 600);
    // } else {
    //     err.textContent = 'Invalid name or password.';
    //     document.getElementById('adminPass').value = '';
    // }
    // ────────────────────────────────────────────────────────────────────────────
    try {
        //asks database if user exists
        const response = await fetch('http://127.0.0.1:8000/login', {
            method: 'POST',
            headers:
            {
                'Content-Type': 'application/json'

            },
            body: JSON.stringify({
                username: name,
                password: pass
            })

        })

        if (!response.ok)
        {
            const errorData = await response.json();
            err.textContent = 'Invalid Name or Password';
            document.getElementById('adminPass').value = '';
        }
        else
        {
            err.textContent = '';
            document.getElementById('loggedInName').textContent = name;
            showToast('Welcome, ' + name + '!');

            setTimeout(() => switchScreen('dashboard'), 600);
            sessionStorage.setItem('isAuthenticated', 'true');
        }
    }
    catch {
        alert("Cant Reach The Server")
    }

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

    if (id === 'dashboard') {
        setTimeout(() => {
            updateDashboardStats();
        }, 100);
    }

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



//dashboard
async function updateDashboardStats()
{
    try
    {
        //get orders from the backend
        const response = await fetch("http://127.0.0.1:8000/orders",
        {
            method: "GET",
            headers:
            {
                
            }
        });

        const orders = await response.json();

        const today = new Date();
        const todayString = today.toLocaleDateString('sv-SE');
        // const todayString = '2026-05-30';

        let todaysOrders = [];
        let totalSalesToday = 0;
        let totalOrdersToday = 0;
        let pendingCount = 0;
        let completedCount = 0;
        let failedCount = 0;
        let totalOrders = orders.length || 0;

        orders.forEach(order => {
            const price = parseFloat(order.price) || 0;
            const orderDate = order.created_at.split('T')[0];

            
            
            if(orderDate === todayString)
            {
                totalOrdersToday ++;
                todaysOrders.push(order);
            }

            if(order.status === "Completed" && orderDate === todayString || order.status === "Paid" && orderDate === todayString)
            {
                completedCount++;
                totalSalesToday += price;
            }
            else if(order.status === "Pending" && orderDate === todayString) 
            {
                pendingCount++;
            }
            else if(order.status === 'Failed' && orderDate === todayString || order.status === 'Cancelled' && orderDate === todayString)
            {
                failedCount++;
            }
            totalOrdersToday = pendingCount + completedCount + failedCount;
        });

        document.getElementById('stat-total-sales').innerText = `PHP ${totalSalesToday.toLocaleString()}`;
        document.getElementById('stat-orders-today').innerText = `${totalOrdersToday}`;
        document.getElementById('stat-pending-today').innerText = `${pendingCount}`;
        document.getElementById('stat-completed-today').innerText = `${completedCount}`;

        //show recent 3 orders
        // sort
        todaysOrders.sort((a, b) => b.order_id - a.order_id);

        const recentThree = todaysOrders.slice(0, 3);

        let tableContentHtml = `
        <div class="table-head">
        <span>Order #</span>
        <span>Type</span>
        <span>Items</span>
        <span>Amount</span>
        <span>Status</span>
        </div>`;

        recentThree.forEach(order => {
            let badgeClass = "pending";
            if (order.status === "Paid" || order.status === "Completed" || order.status === "Done") {
                badgeClass = "done";
            }

            const formattedId = String(order.order_id).padStart(3, '0');

            tableContentHtml += `
        <div class="order-row">
          <span class="order-id">#${formattedId}</span>
          <span class="order-cell">${order.order_mode || 'Dine In'}</span>
          <span class="order-cell">System Order</span>
          <span class="order-price">₱${order.price}</span>
          <span><span class="badge ${badgeClass}">${order.status}</span></span>
        </div>`;
        });

        const tableContainer = document.querySelector('.orders-table');
        if (tableContainer) {
            tableContainer.innerHTML = tableContentHtml;
        }


    }
    catch
    {
        alert("Error loading dashboard stats:");
    }
}
