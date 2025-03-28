document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("adminLoginForm");
  
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const email = document.getElementById("adminEmail").value.trim();
      const password = document.getElementById("adminPassword").value.trim();
  
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await res.json();
  
      if (res.ok && data.token) {
        if (data.role !== "admin") {
          return alert("Not authorized as an admin.");
        }
        localStorage.setItem("token", data.token);
        window.location.href = "admin-dashboard.html";
      } else {
        alert(data.error || "Login failed");
      }
    });
  });
  