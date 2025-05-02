document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("resetPasswordForm");
    const resetMessage = document.getElementById("resetMessage");

    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
        resetMessage.innerText = "Invalid or expired reset link.";
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (newPassword !== confirmPassword) {
            resetMessage.innerText = "Passwords do not match!";
            return;
        }

        // Send request to backend
        const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();
        resetMessage.innerText = data.message || data.error;

        if (response.ok) {
            setTimeout(() => window.location.href = "index.html", 2000);
        }
    });
});
