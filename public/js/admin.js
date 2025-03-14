document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "index.html";
        return;
    }

    // Fetch Admin Profile
    try {
        const response = await fetch("/api/auth/me", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await response.json();
        if (response.ok && data.role === "admin") {
            loadUsers();
            loadDanceMoves();
        } else {
            alert("Unauthorized access!");
            window.location.href = "index.html";
        }
    } catch (error) {
        console.error("Error fetching admin data:", error);
    }
});

// Load Users
async function loadUsers() {
    const response = await fetch("/api/admin/users", {
        method: "GET",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    });
    const users = await response.json();

    const userList = document.getElementById("userList");
    userList.innerHTML = "";
    users.forEach(user => {
        const li = document.createElement("li");
        li.innerText = `${user.name} (${user.email}) - ${user.role}`;
        userList.appendChild(li);
    });
}

// Load Dance Moves
async function loadDanceMoves() {
    const response = await fetch("/api/dances", {
        method: "GET",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    });
    const danceMoves = await response.json();

    const danceList = document.getElementById("danceList");
    danceList.innerHTML = "";
    danceMoves.forEach(move => {
        const li = document.createElement("li");
        li.innerText = `${move.name} - ${move.category}`;
        danceList.appendChild(li);
    });
}

// Add New Dance Move
document.getElementById("addDanceForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const newDanceMove = {
        name: document.getElementById("danceName").value,
        category: document.getElementById("danceCategory").value,
        description: document.getElementById("danceDescription").value
    };

    try {
        const response = await fetch("/api/dances", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(newDanceMove)
        });

        const result = await response.json();
        if (response.ok) {
            alert("Dance Move Added!");
            loadDanceMoves();
        } else {
            alert("Error adding dance move: " + result.error);
        }
    } catch (error) {
        console.error("Error:", error);
    }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "index.html";
});
