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
        alert("Error loading profile. Please try again.");
    }
});

// Logout Function
function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}
