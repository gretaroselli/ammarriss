//revenue overview
async function getRevenue()
{
    response = await fetch("http://127.0.0.1:8000/orders",
        {
            method: "GET",
            headers:
            {

            }
        });
    const orders = await response.json();
}
function getAverageOrderValue()
{
    
}