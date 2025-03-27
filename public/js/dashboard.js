document.addEventListener("DOMContentLoaded", async () => {
    console.log("Dashboard loaded");

    const token = localStorage.getItem("token");
    if (!token) {
        console.log("No token found, redirecting to login");
        window.location.href = "index.html";
        return;
    }

    console.log("Fetching user profile...");
    try {
        const response = await fetch("/api/auth/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        console.log("Server Response Status:", response.status);
        const data = await response.json();
        console.log("API Response:", data);

        // Redirect admin to admin dashboard
        if (data.role === "admin") {
            console.log("Admin detected, redirecting to admin dashboard...");
            window.location.href = "admin-dashboard.html";
            return;
        }

        // If user is not admin, continue loading user dashboard
        document.getElementById("userName").innerText = data.name;
        document.getElementById("userEmail").innerText = data.email;
        document.getElementById("userRole").innerText = data.role || "user";

    } catch (error) {
        console.error("Error fetching profile data:", error);
        localStorage.removeItem("token");
        window.location.href = "index.html";
    }

    loadDanceMoves();
});


// Function to load dance moves
async function loadDanceMoves() {
    try {
        const response = await fetch("/api/dances/");
        const moves = await response.json();
        const list = document.getElementById("danceList");

        if (list) {
            list.innerHTML = "";
            moves.forEach(move => {
                const li = document.createElement("li");
                li.innerHTML = `<strong>${move.name}</strong> - ${move.category}<br>${move.description}`;
                list.appendChild(li);
            });
        }
    } catch (error) {
        console.error("Dance Load Error:", error);
    }
}


const editProfileBtn = document.getElementById("editProfileBtn");
if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
        console.log("Edit Profile Button Clicked");
        document.getElementById("editProfileModal").style.display = "block";
    });
}


const closeBtn = document.querySelector(".close");
if (closeBtn) {
    closeBtn.addEventListener("click", () => {
        console.log("Closing Edit Profile Modal");
        document.getElementById("editProfileModal").style.display = "none";
    });
}

// Profile Update Function (
const updateProfileForm = document.getElementById("updateProfileForm");
if (updateProfileForm) {
    updateProfileForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const newName = document.getElementById("newName").value;
        const newPassword = document.getElementById("newPassword").value;
        const token = localStorage.getItem("token");

        console.log("Sending Token:", token);  

        if (!token) {
            alert("You are not logged in. Please log in first.");
            window.location.href = "index.html";
            return;
        }

        const updateData = {};
        if (newName) updateData.name = newName;
        if (newPassword) updateData.password = newPassword;

        try {
            const response = await fetch("/api/auth/update", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();
            console.log("Profile Update Response:", result);

            if (response.ok) {
                alert("Profile updated successfully!");
                window.location.reload();
            } else {
                alert("Error updating profile: " + result.error);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Error updating profile. Please try again.");
        }
    });
}

// Logout Function 
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        alert("Logged out successfully!");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);
    });
}
