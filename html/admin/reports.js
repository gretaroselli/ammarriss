//revenue overview
async function updateReportsStats()
{
    try
    {
        //get payments
        response = await fetch("http://127.0.0.1:8000/payments",
            {
                method: "GET",
                headers:
                {

                }
            });
        const payments = await response.json();
        
        //get orders
        response = await fetch("http://127.0.0.1:8000/orders",
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
            totalOrders += 1;
        });

        avgOrderValue = totalSales / totalCompletedOrders;



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








    }
    catch
    {
        alert("Error");
        
    }


    



}
// function getAverageOrderValue()
// {
    
// }