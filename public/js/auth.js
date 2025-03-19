document.getElementById("registerForm").addEventListener("input", function () {
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const registerBtn = document.getElementById("registerBtn");
    const passwordError = document.getElementById("passwordError");

    if (password && confirmPassword && password !== confirmPassword) {
        passwordError.style.display = "block";
        registerBtn.disabled = true;
    } else {
        passwordError.style.display = "none";
        registerBtn.disabled = !password || !confirmPassword;
    }
});

document.getElementById("registerForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    

    // Check if button is enabled before proceeding
    if (document.getElementById("registerBtn").disabled) {
        alert("Please enter a strong password before registering.");
        return;
    }

    const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    alert(data.message || data.error);
});

document.addEventListener("DOMContentLoaded", () => {
    // Password Toggle
    document.querySelectorAll(".toggle-password").forEach(icon => {
        icon.addEventListener("click", () => {
            const targetId = icon.getAttribute("data-target");
            const passwordInput = document.getElementById(targetId);
            passwordInput.type = passwordInput.type === "password" ? "text" : "password";
        });
    });

    // Password Strength Checker
    const passwordInput = document.getElementById("password");
    const passwordStrength = document.getElementById("passwordStrength");
    const registerBtn = document.getElementById("registerBtn");

    passwordInput.addEventListener("input", () => {
        const password = passwordInput.value;
        if (password.length < 6) {
            passwordStrength.textContent = "Password too short (min 6 characters)";
            passwordStrength.style.color = "red";
            registerBtn.disabled = true;
        } else if (!/[A-Z]/.test(password)) {
            passwordStrength.textContent = "Include at least one uppercase letter";
            passwordStrength.style.color = "orange";
            registerBtn.disabled = true;
        } else if (!/[0-9]/.test(password)) {
            passwordStrength.textContent = "Include at least one number";
            passwordStrength.style.color = "orange";
            registerBtn.disabled = true;
        } else {
            passwordStrength.textContent = "Strong Password";
            passwordStrength.style.color = "green";
            registerBtn.disabled = false;
        }
    });
});


document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        alert("All fields are required!");
        return;
    }

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
             localStorage.setItem("token", data.token); // Store JWT token
             window.location.href = "dashboard.html";
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("Login failed. Please try again.");
    }    
});

document.addEventListener("DOMContentLoaded", function () {
    const forgotPasswordLink = document.getElementById("forgotPasswordLink");
    const forgotPasswordModal = document.getElementById("forgotPasswordModal");
    const closeForgotPasswordModal = document.querySelector(".close");
    const resetPasswordBtn = document.getElementById("resetPasswordBtn");
    const resetMessage = document.getElementById("resetMessage");

    // Open Forgot Password Modal
    forgotPasswordLink.addEventListener("click", function (event) {
        event.preventDefault();
        forgotPasswordModal.style.display = "block";
    });

    // Close the modal
    closeForgotPasswordModal.addEventListener("click", function () {
        forgotPasswordModal.style.display = "none";
    });

    // Handle Reset Password Request
    resetPasswordBtn.addEventListener("click", async function () {
        const email = document.getElementById("resetEmail").value;

        if (!email) {
            resetMessage.innerText = "Please enter your email.";
            resetMessage.style.color = "red";
            return;
        }

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                resetMessage.innerText = data.message;
                resetMessage.style.color = "green";
            } else {
                resetMessage.innerText = data.error;
                resetMessage.style.color = "red";
            }
        } catch (error) {
            console.error("Error sending reset request:", error);
            resetMessage.innerText = "An error occurred. Try again later.";
            resetMessage.style.color = "red";
        }
    });
});
