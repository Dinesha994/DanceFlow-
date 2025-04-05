document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const danceId = params.get("id");
    const token = localStorage.getItem("token");
  
    if (!danceId) {
      alert("No dance move specified.");
      return;
    }
  
    if (!token) {
      alert("You are not logged in!");
      window.location.href = "index.html";
      return;
    }
  
    try {
      const res = await fetch(`/api/admin/dancemoves/${danceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      if (!res.ok) {
        throw new Error("Failed to load dance move details");
      }
  
      const dance = await res.json();
  
      document.getElementById("danceName").textContent = dance.name;
      document.getElementById("danceImage").src = dance.image || "assets/no-image.png";
      document.getElementById("danceCategory").textContent = dance.category;
      document.getElementById("danceDescription").textContent = dance.description;
  
    } catch (error) {
      console.error("Error loading dance move:", error);
      alert("Failed to load dance move details.");
    }
  });
  