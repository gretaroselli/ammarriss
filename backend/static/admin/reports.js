//revenue overview
async function updateReportsStats()
{
    try
    {
        //get payments
        response = await fetch("/payments",
            {
                method: "GET",
                headers:
                {

                }
            });
        const payments = await response.json();
        
        //get orders
        response = await fetch("/orders",
            {
                method: "GET",
                headers:
                {

                }
            });
        const orders = await response.json();

                
        
        let totalOrders = 0;
        let totalCompletedOrders = 0;
        let totalSales = 0;
        let avgOrderValue = 0;

        let totalPendingOrders = 0;
        let completionRate = 0;

        let totalCashPayments = 0;
        let totalOnlinePayments = 0;
        let totalCashSales = 0;
        let totalOnlineSales = 0;

        let totalDineInOrders = 0;
        let totalTakeOutOrders = 0;





        //Revenue Overview
        payments.forEach(payment => {
            totalSales += payment.amount_paid;

            if(payment.payment_method === "Cash")
            {
                totalCashPayments += 1;
                totalCashSales += payment.amount_paid;
            }
            else
            {
                totalOnlinePayments += 1;
                totalOnlineSales += payment.amount_paid;
            }  
        });


        orders.forEach(order => {
            if(order.status === "Completed")
            {
                totalCompletedOrders += 1;
            }
            else if(order.status === "Pending")
            {
                totalPendingOrders += 1;
            }

            if(order.order_mode === "Dine-in")
            {
                totalDineInOrders += 1;
            }
            else if(order.order_mode === "Take-out")
            {
                totalTakeOutOrders += 1;
            }

            totalOrders += 1;
        });

        avgOrderValue = totalCompletedOrders > 0 ? (totalSales / totalCompletedOrders) : 0;



        document.getElementById("gross-sales").innerText = `₱ ${totalSales.toLocaleString()}`;
        document.getElementById("total-orders").innerText = totalOrders;
        document.getElementById("avg-order-value").innerText = `₱ ${avgOrderValue.toFixed(2)}`;

        //Order Status
        completionRate = (totalCompletedOrders / totalOrders) * 100;
        document.getElementById("complete-orders").innerText = totalCompletedOrders;
        document.getElementById("pending-orders").innerText = totalPendingOrders;
        document.getElementById("completion-rate").innerText = `%${completionRate.toFixed(2)}`;

        //Payment Mehtods
        document.getElementById("cash-sales").innerText = `${totalCashPayments} Orders - ₱ ${totalCashSales.toLocaleString()}`;
        document.getElementById("online-sales").innerText = `${totalOnlinePayments} Orders - ₱ ${totalOnlineSales.toLocaleString()}`;



        //Order Types
        document.getElementById("dine-in-orders").innerText = `${totalDineInOrders} Orders`;
        document.getElementById("take-out-orders").innerText = `${totalTakeOutOrders} Orders`;




        updateTopItemsSold();
    }
    catch
    {
        alert("Error");
        
    }


    



}
async function updateTopItemsSold()
{
    try
    {
        response = await fetch("/top-items",
        {
            method: "GET",
            headers:
            {

            }
        });
        const topSoldItems= await response.json();


        const container = document.getElementById("top-items-list");
        container.innerHTML = ""; 

        if (topSoldItems.length === 0) {
            container.innerHTML = `<p class="text-muted small mb-0 py-2">No items ordered yet today.</p>`;
            return;
        }

        topSoldItems.forEach((item, index) => {
            const itemHTML = `
                <div class="d-flex justify-content-between align-items-center border-bottom pb-2">
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-light text-dark rounded-circle px-2 py-1 small">${index + 1}</span>
                        <span class="fw-semibold text-dark">${item.product_name}</span>
                    </div>
                    <span class="badge bg-primary rounded-pill px-3">${item.total_qty_sold} sold</span>
                </div>
            `;
            container.insertAdjacentHTML("beforeend", itemHTML);
        });

    }
    catch
    {
        alert("Error");
    }
}