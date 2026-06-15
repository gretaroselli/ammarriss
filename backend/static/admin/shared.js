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
        sessionStorage.setItem('userName', username);
        sessionStorage.setItem('userRole', 'admin');
        sessionStorage.setItem('admin_id', admin.admin_id);
        sessionStorage.setItem('token', admin.token);

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
async function handleSignOut()
{
    const token = sessionStorage.getItem('token') || "null";
    const response = await fetch("/signout",
        {
            "method": "POST",
            "headers":
            {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify(token)
        });

    if (response.ok) {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = "/static/admin/index.html";
    }


}
async function handleAccountCreation()
{
    const username = document.getElementById("adminName").value;
    const password = document.getElementById("adminPass").value;
    const email = document.getElementById("adminEmail").value;

    try
    {
        const response = await fetch("/register",
            {
                "method": "POST",
                "headers":
                {
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify({
                    "username": username,
                    "password": password,
                    "email": email
                })
            });

        if (response.ok) {
            alert("Account created successfully");
        }
    }
    catch
    {
        alert("Error creating account");
    }

}

function setSidebarUserInfo()
{
    const savedUsername = sessionStorage.getItem('userName');
    const savedRole = sessionStorage.getItem('userRole');

    const nameElement = document.getElementById('user-name');
    const roleElement = document.getElementById('user-role');


    if (nameElement && savedUsername) {
        nameElement.innerText = savedUsername;
    }

    if (roleElement && savedRole) {
        roleElement.innerText = savedRole; 
    }


}

async function authenticate()
{
    try
    {
        const token = sessionStorage.getItem('token') || "null";
        const response = await fetch("/authenticate-user",
            {
                
                "method": "POST",
                "headers":
                {
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify(token)
            });
        const message = await response.json();

        if (response.status === 401)
        {
            handleSignOut();
            alert("UNAUTHORIZED: Invalid session token!");
            
        }
        else if(response.ok)
        {
            document.body.style.display = "block";
        }
    }
    catch
    {
        alert("UNAUTHORIZED!!!!!");
        handleSignOut();
    }


    
}