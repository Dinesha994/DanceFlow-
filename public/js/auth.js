document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const registerBtn = document.getElementById("registerBtn");
  const passwordStrength = document.getElementById("passwordStrength");
  const passwordError = document.getElementById("passwordError");

  // Show/hide register password
  document.getElementById("toggleRegisterPassword")?.addEventListener("change", function () {
    const type = this.checked ? "text" : "password";
    passwordInput.type = type;
    confirmPasswordInput.type = type;
  });

  // Show/hide login password
  document.getElementById("toggleLoginPassword")?.addEventListener("change", function () {
    const loginPassword = document.getElementById("loginPassword");
    loginPassword.type = this.checked ? "text" : "password";
  });

  // Password validation
  registerForm?.addEventListener("input", () => {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password && confirmPassword && password !== confirmPassword) {
      passwordError.style.display = "block";
      registerBtn.disabled = true;
    } else {
      passwordError.style.display = "none";
      registerBtn.disabled = !password || !confirmPassword;
    }

    if (password.length === 0) {
      passwordStrength.textContent = "";
    } else if (password.length < 6) {
      passwordStrength.textContent = "Password too short";
      passwordStrength.style.color = "red";
    } else if (!/[A-Z]/.test(password)) {
      passwordStrength.textContent = "Include uppercase letter";
      passwordStrength.style.color = "orange";
    } else if (!/[0-9]/.test(password)) {
      passwordStrength.textContent = "Include a number";
      passwordStrength.style.color = "orange";
    } else {
      passwordStrength.textContent = "Strong Password";
      passwordStrength.style.color = "green";
    }
  });

  // Register submit
  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    alert(data.message || data.error);
    if (res.ok) {
      switchToLogin();
    }
  });

  // Login submit
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem("token", data.token);
      window.location.href = data.role === "admin" ? "admin-dashboard.html" : "dashboard.html";
    } else {
      alert(data.error || "Login failed");
    }
  });

  // Forgot password modal
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const forgotPasswordModal = document.getElementById("forgotPasswordModal");
  const resetPasswordBtn = document.getElementById("resetPasswordBtn");
  const resetMessage = document.getElementById("resetMessage");

  forgotPasswordLink?.addEventListener("click", (e) => {
    e.preventDefault();
    forgotPasswordModal.style.display = "flex";
  });

  document.querySelector(".close")?.addEventListener("click", () => {
    forgotPasswordModal.style.display = "none";
  });

  resetPasswordBtn?.addEventListener("click", async () => {
    const email = document.getElementById("resetEmail").value.trim();
    if (!email) {
      resetMessage.textContent = "Please enter your email.";
      resetMessage.style.color = "red";
      return;
    }

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    resetMessage.textContent = data.message || data.error;
    resetMessage.style.color = res.ok ? "green" : "red";
  });
});

// FORM SWITCHING FUNCTIONS
function switchToRegister() {
  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("registerContainer").style.display = "block";
}

function switchToLogin() {
  document.getElementById("registerContainer").style.display = "none";
  document.getElementById("loginContainer").style.display = "block";
}

function closeForgotPasswordModal() {
  document.getElementById("forgotPasswordModal").style.display = "none";
}
