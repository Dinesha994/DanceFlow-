window.onerror = function (message, source, lineno, colno, error) {
  console.error("JavaScript Error:", message, source, lineno, colno, error);
  return true; // Prevent default handling
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("auth.js is now loading");

  // REGISTER FORM
  const registerForm = document.getElementById("registerForm");
  const registerBtn = document.getElementById("registerBtn");
  const passwordInput = document.getElementById("password");
  const passwordStrength = document.getElementById("passwordStrength");

  if (registerForm) {
    registerForm.addEventListener("input", () => {
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const passwordError = document.getElementById("passwordError");

      if (password && confirmPassword && password !== confirmPassword) {
        passwordError.style.display = "block";
        registerBtn.disabled = true;
      } else {
        passwordError.style.display = "none";
        registerBtn.disabled = !password || !confirmPassword;
      }
    });

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      alert(data.message || data.error);
    });

    passwordInput.addEventListener("input", () => {
      const password = passwordInput.value;
      if (password.length < 6) {
        passwordStrength.textContent = "Password too short";
        passwordStrength.style.color = "red";
        registerBtn.disabled = true;
      } else if (!/[A-Z]/.test(password)) {
        passwordStrength.textContent = "Include uppercase letter";
        passwordStrength.style.color = "orange";
        registerBtn.disabled = true;
      } else if (!/[0-9]/.test(password)) {
        passwordStrength.textContent = "Include a number";
        passwordStrength.style.color = "orange";
        registerBtn.disabled = true;
      } else {
        passwordStrength.textContent = "Strong Password";
        passwordStrength.style.color = "green";
        registerBtn.disabled = false;
      }
    });
  }

  // LOGIN FORM
  const loginForm = document.getElementById("loginForm");
  const loginButton = document.getElementById("loginBtn"); 

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Login form submitted");

      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();

      console.log("Login Values:", email, password); 

      try {
        console.log("Sending request to server for login");
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        console.log("Login Response:", data);

        if (res.ok && data.token) {
          
          localStorage.setItem("token", data.token);
          console.log("Token saved in localStorage");

         
          if (data.role === "admin") {
            window.location.href = "admin-dashboard.html";
          } else {
            window.location.href = "dashboard.html";
          }
        } else {
          alert(data.error || "Login failed");
        }
      } catch (error) {
        console.error("Error during login:", error);
      }
    });
  }

  // FORGOT PASSWORD
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const forgotPasswordModal = document.getElementById("forgotPasswordModal");
  const closeForgotPasswordModal = document.querySelector(".close");
  const resetPasswordBtn = document.getElementById("resetPasswordBtn");
  const resetMessage = document.getElementById("resetMessage");

  if (forgotPasswordLink && forgotPasswordModal) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      forgotPasswordModal.style.display = "block";
    });

    closeForgotPasswordModal.addEventListener("click", () => {
      forgotPasswordModal.style.display = "none";
    });

    resetPasswordBtn.addEventListener("click", async () => {
      const email = document.getElementById("resetEmail").value;
      if (!email) {
        resetMessage.textContent = "Please enter your email.";
        resetMessage.style.color = "red";
        return;
      }

      try {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();
        resetMessage.textContent = data.message || data.error;
        resetMessage.style.color = response.ok ? "green" : "red";
      } catch (err) {
        resetMessage.textContent = "Something went wrong.";
        resetMessage.style.color = "red";
      }
    });
  }
});
