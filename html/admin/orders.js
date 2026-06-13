async function updateOrdersCards(orders)
{
    try
    {

        const cardsContainer = document.getElementById('orders-cards-container');
        if(!cardsContainer)
        {
            return;
        }

        let cardsHtml = "";

        orders.forEach(order => {
            const formattedId = String(order.order_id).padStart(3, '0');
            // const itemsText = order.order_items;
            const orderPrice = parseFloat(order.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
            
            const itemsText = order.items && order.items.length > 0
                ? order.items.map(item => `${item.product_name} x${item.quantity}`).join(' - ')
                : 'No Items';

            let statusColorClass = "text-warning";
            if(order.status === "Completed")
            {
                statusColorClass = "text-success";

            }
            else if(order.status === "Cancelled")
            {
                statusColorClass = "text-danger";
            }

            let displayDate = "Today";
            if(order.created_at)
            {
                displayDate = order.created_at.split('T')[0];
            }

            //add buttons if not complete or cancelled
            let btnsHtml = "";
            if (order.status !== "Completed" && order.status !== "Cancelled")
            {
                btnsHtml += `
                    <button type="button"
                        class="btn btn-sm btn-success text-dark fw-bold rounded-pill px-3 shadow-sm"
                        id="edit-order-btn" onClick="completeOrder(${order.order_id})">
                        Complete
                    </button>
                    <button type="button"
                        class="btn btn-sm btn-danger text-white fw-bold rounded-pill px-3 shadow-sm"
                        id="delete-order-btn" onClick="cancelOrder(${order.order_id})">
                        Cancel
                    </button>
                `;
            }

            cardsHtml += `<div class="col-12">
                    <div class="card border-0 shadow-sm h-100 p-3">
                        <div class="card-body p-2">

                            <div class="row align-items-center">

                                <div class="col-7 col-sm-8">
                                    <h6 class="text-danger fs-3 fw-extrabold mb-0" id="order-id">${formattedId}</h6>
                                    <h2 class="mb-0 fs-5 my-1" id="order-items">${itemsText}</h2>
                                    <small class="text-muted fw-semibold d-block" id="order-date">${displayDate}</small>
                                </div>

                                <div class="col-5 col-sm-4 text-end">
                                    <h2 class="fw-bold mb-2 fs-4" id="order-price">₱${orderPrice}</h2>
                                    <h2 class="${statusColorClass} fs-6">${order.status}</h2>
                                    ${btnsHtml}
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>`;


        });

        cardsContainer.innerHTML = cardsHtml;



        

    }
    catch
    {
        alert("error");
    }
}

//filtering orders
async function filterAll()
{
    const response = await fetch("http://127.0.0.1:8000/orders?include_items=true",
        {
            method: "GET",
            headers:
            {

            }
        });
    const orders = await response.json();
    updateOrdersCards(orders);
}
async function filterPending()
{
    const response = await fetch("http://127.0.0.1:8000/orders?include_items=true&status=Pending",
        {
            method: "GET",
            headers:
            {

            }
        });
    const orders = await response.json();
    updateOrdersCards(orders);
}
async function filterCompleted() {
    const response = await fetch("http://127.0.0.1:8000/orders?include_items=true&status=Completed",
        {
            method: "GET",
            headers:
            {

            }
        });
    const orders = await response.json();
    updateOrdersCards(orders);
}
async function filterCancelled()
{
    const response = await fetch("http://127.0.0.1:8000/orders?include_items=true&status=Cancelled",
        {
            method: "GET",
            headers:
            {

            }
        });
    const orders = await response.json();
    updateOrdersCards(orders);
}
function highlightButton(clickedButton) {
    const allButtons = document.querySelectorAll("#order-filters .filter-btn");

    allButtons.forEach(btn => {
        btn.classList.remove("btn-success", "active");
        btn.classList.add("btn-outline-secondary");
    });

    clickedButton.classList.remove("btn-outline-secondary");
    clickedButton.classList.add("btn-success", "active");
}

//updating orders
async function completeOrder(orderId)
{
    const response = await fetch(`http://127.0.0.1:8000/orders/${orderId}/status?status=Completed`, {
        method: "PUT"
    });

    if (response.ok) {
        alert("Success!");
        pageRefresh();
    }
}
async function cancelOrder(orderId)
{
    const response = await fetch(`http://127.0.0.1:8000/orders/${orderId}/status?status=Cancelled`, {
        method: "PUT"
    });

    if (response.ok) {
        alert("Success!");
        pageRefresh();
    }
}
//for page refreshes
function pageRefresh() {
    window.location.reload();
}

