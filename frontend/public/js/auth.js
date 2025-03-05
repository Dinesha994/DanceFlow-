const API_URL = "http://localhost:5000/api/auth"; // Backend URL

// Register User
async function register() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "user" }),
    });

    const data = await res.json();
    if (res.ok) {
        alert("Registered Successfully! Please login.");
        window.location.href = "index.html";
    } else {
        alert(data.error);
    }
}

// Login User
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        window.location.href = data.role === "admin" ? "admin.html" : "dashboard.html";
    } else {
        alert(data.error);
    }
}

// Logout User
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "index.html";
}
