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
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await response.json();
        console.log("API Response:", data);

        if (response.ok) {
            document.getElementById("userName").innerText = data.name;
            document.getElementById("userEmail").innerText = data.email;
            document.getElementById("userRole").innerText = data.role;
        } else {
            alert("Session expired. Please login again.");
            localStorage.removeItem("token");
            window.location.href = "index.html";
        }
    } catch (error) {
        console.error("Error fetching profile data:", error);
        
    }
});

//Open Edit Profile Modal
document.getElementById("editProfileBtn").addEventListener("click", () => {
    console.log("Edit Profile Button Clicked");
    document.getElementById("editProfileModal").style.display = "block";
});

//Close Modal
document.querySelector(".close").addEventListener("click", () => {
    console.log("Closing Edit Profile Modal");
    document.getElementById("editProfileModal").style.display = "none";
});


// Profile Update Function
document.getElementById("updateProfileForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const newName = document.getElementById("newName").value;
    const newPassword = document.getElementById("newPassword").value;
    const token = localStorage.getItem("token");

    console.log("Sending Token:", token);  // ✅ Check if token exists

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

// Logout Function
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "index.html";
});

