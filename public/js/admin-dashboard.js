document.addEventListener("DOMContentLoaded", async () => {
    console.log("Admin Dashboard Loaded");

    const token = localStorage.getItem("token");
    if (!token) {
        console.log("No token found, redirecting to login");
        window.location.href = "index.html";
        return;
    }

    try {
        // Fetch admin profile data
        const response = await fetch("/api/auth/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();
        console.log("Admin Profile Data:", data);

        if (!data || data.role !== "admin") {
            console.error("Access Denied. Not an admin.");
            window.location.href = "index.html";
            return;
        }

        document.getElementById("adminName").innerText = data.name;
        document.getElementById("adminEmail").innerText = data.email;
        document.getElementById("adminRole").innerText = data.role;

        loadUsers(); // Load users for admin

    } catch (error) {
        console.error("Error fetching admin profile:", error);
        localStorage.removeItem("token");
        window.location.href = "index.html";
    }
});

// Function to load all users for admin
async function loadUsers() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/users", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
        });

        const users = await response.json();
        console.log("Fetched Users:", users);

        const usersTableBody = document.querySelector("#usersTable tbody");
        usersTableBody.innerHTML = ""; // Clear previous data

        users.forEach(user => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
            `;
            usersTableBody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error fetching users:", error);
        document.querySelector("#usersTable tbody").innerHTML = "<tr><td colspan='3'>Failed to load users</td></tr>";
    }
}

// Logout Function
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token"); 
    localStorage.removeItem("role"); 
    alert("Logged out successfully!");
    setTimeout(() => {
        window.location.href = "index.html"; // Ensure it redirects
    }, 500);
});
