async function handleLogin()
{
    const username = document.getElementById("adminName").value;
    const password = document.getElementById("adminPass").value;

    const response = await fetch("/login",
        {
            "method": "POST",
            "headers":
            {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                "username": username,
                "password": password
            })
        });

    const admin = await response.json();
    if(response.ok)
    {
        localStorage.setItem('userName', username);
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('admin_id', admin.admin_id);

        // localStorage.setItem('token', token.access_token);


        window.location.href = "/static/admin/dashboard.html";
    }
    else if (response.status === 401)
    {
        document.getElementById('adminName').value = '';
        document.getElementById('adminPass').value = '';
        alert("Wrong Username or Password");
    }


}
function handleSignOut()
{
    localStorage.clear();
    window.location.href = "/static/admin/index.html";
}

function setSidebarUserInfo()
{
    const savedUsername = localStorage.getItem('userName');
    const savedRole = localStorage.getItem('userRole');

    const nameElement = document.getElementById('user-name');
    const roleElement = document.getElementById('user-role');


    if (nameElement && savedUsername) {
        nameElement.innerText = savedUsername;
    }

    if (roleElement && savedRole) {
        roleElement.innerText = savedRole; 
    }


}