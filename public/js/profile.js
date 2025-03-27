document.addEventListener("DOMContentLoaded", async () => {
    console.log("Profile page loaded");

    const token = localStorage.getItem("token");
    if (!token) {
        console.log("No token found, redirecting to login");
        window.location.href = "index.html";
        return;
    }

    console.log("Fetching user profile with token:", token);
    
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
        alert("Error loading profile. Please try again.");
    }
});


// Profile Update Form
document.getElementById("editProfileForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    
    const token = localStorage.getItem("token");
    const newName = document.getElementById("newName").value;
    const newPassword = document.getElementById("newPassword").value;

    const updateData = {};
    if (newName) updateData.name = newName;
    if (newPassword) updateData.password = newPassword;

    const response = await fetch("/api/auth/update", {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
    });

    const data = await response.json();

    if (response.ok) {
        alert("Profile updated successfully! Please log in again.");
        localStorage.removeItem("token");
        window.location.href = "index.html"; // Redirect to login page
    } else {
        alert(data.error);
    }
});

// Logout Function
function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}
