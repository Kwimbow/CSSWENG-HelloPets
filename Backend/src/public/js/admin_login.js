loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch("/admin/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const message = await response.text();
            alert(message);
            return;
        }

        const messageObj = await response.json();
        const { success } = messageObj;

        if (success) {
            window.location.href = "/admin/manage_page"
        } else {
            throw new Error("Login unsuccessful");
        }
    } catch (error) {
        alert("There was an error with the login process. Please try again.");
        console.error('Login failed:', error);
    }
});