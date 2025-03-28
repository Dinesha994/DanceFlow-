document.addEventListener("DOMContentLoaded", () => {
    console.log("user-login.js loaded");
    const loginForm = document.getElementById("userLoginForm");
    if (!loginForm) {
        console.warn("Login form not found!");
        return;
      }
  
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Form submitted");

  
      const email = document.getElementById("userEmail").value.trim();
      const password = document.getElementById("userPassword").value.trim();
  
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
  
        const data = await res.json();
        console.log("Response:", data);

  
        if (res.ok && data.token && data.role === "user") {

            console.log("Saving token:", data.token);
            localStorage.setItem("token", data.token);
            console.log("Token after save:", localStorage.getItem("token"));
            window.location.href = "dashboard.html";

          } else {
            alert(data.error || "Invalid credentials");
          }
      } catch (error) {
        console.error("Login Error:", error);
        alert("An error occurred during login.");
      }
    });
  });
  