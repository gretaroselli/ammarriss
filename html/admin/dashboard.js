//dashboard
async function updateDashboardStats() {
    try {
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
            const updatedOrderDate = order.updated_at.split('T')[0];
            const createdOrderDate = order.created_at.split('T')[0];




            if (createdOrderDate === todayString) {
                totalOrdersToday++;
                todaysOrders.push(order);
            }

            if (order.status === "Completed" && updatedOrderDate === todayString || order.status === "Paid" && updatedOrderDate === todayString) {
                completedCount++;
                totalSalesToday += price;
            }
            else if (order.status === "Pending" && updatedOrderDate === todayString) {
                pendingCount++;
            }
            else if (order.status === 'Failed' && updatedOrderDate === todayString || order.status === 'Cancelled' && updatedOrderDate === todayString) {
                failedCount++;
            }

        });


        document.getElementById('stat-total-sales').innerText = `PHP ${totalSalesToday.toLocaleString()}`;
        document.getElementById('stat-orders-today').innerText = `${totalOrdersToday}`;
        document.getElementById('stat-pending-today').innerText = `${pendingCount}`;
        document.getElementById('stat-completed-today').innerText = `${completedCount}`;


        //recentOrders
        todaysOrders.sort((a, b) => b.order_id - a.order_id);

        // Take only top 3
        const recentThree = todaysOrders.slice(0, 3);

        let tableContentHtml = "";

        recentThree.forEach(order => {
            // Assign Bootstrap 5 pill contextual styles dynamically
            let badgeClass = "bg-warning text-dark"; // Default for Pending / Preparing / Ready

            if (order.status === "Paid" || order.status === "Completed" || order.status === "Done") {
                badgeClass = "bg-success text-white";
            } else if (order.status === "Failed" || order.status === "Cancelled") {
                badgeClass = "bg-danger text-white";
            }

            const formattedId = String(order.order_id).padStart(3, '0');
            const orderMode = order.order_mode || 'Dine In';
            const priceFormatted = parseFloat(order.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

            // Generates raw <tr> rows fitting your 4-column layout exactly
            tableContentHtml += `
                <tr>
                    <td class="ps-3 fw-bold">#${formattedId}</td>
                    <td>${orderMode}</td>
                    <td>
                        <span class="badge ${badgeClass} rounded-pill px-2">${order.status}</span>
                    </td>
                    <td class="text-end pe-3 fw-bold">₱${priceFormatted}</td>
                </tr>
            `;
        });

        // Target the element with ID 'recent-orders-rows' matching your <tbody>
        const tableBodyContainer = document.getElementById('recent-orders-rows');

        if (tableBodyContainer) {
            if (tableContentHtml !== "") {
                tableBodyContainer.innerHTML = tableContentHtml;
            } else {
                tableBodyContainer.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted py-4">No incoming orders captured yet today.</td>
                    </tr>
                `;
            }
        }

        const tableContainer = document.querySelector('.orders-table');
        if (tableContainer) {
            tableContainer.innerHTML = tableContentHtml;
        }


    }
    catch {
        alert("Error loading dashboard stats:");
    }
}
