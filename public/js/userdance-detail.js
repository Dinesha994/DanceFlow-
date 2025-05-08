document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const danceId = params.get("id");

  if (!danceId) {
    alert("No dance move specified.");
    return;
  }

  try {
    const res = await fetch(`/api/dances/dancemoves`);
    if (!res.ok) throw new Error("Failed to load dance moves");

    const dances = await res.json();
    const dance = dances.find(d => d._id === danceId);

    if (!dance) {
      alert("Dance move not found.");
      return;
    }

    document.getElementById("danceName").textContent = dance.name;
    document.getElementById("danceImage").src = dance.image || "assets/no-image.png";
    document.getElementById("danceCategory").textContent = dance.category;
    document.getElementById("danceDescription").textContent = dance.description;

    const videoLink = document.getElementById("moveVideoLink");
    const videoContainer = document.getElementById("moveVideoLinkContainer");

    if (dance.video && videoLink && videoContainer) {
      videoLink.href = dance.video;
      videoLink.textContent = "Watch Video";
      videoLink.target = "_blank";
    } else if (videoContainer) {
      videoContainer.style.display = "none";
    }

  } catch (error) {
    console.error("Error loading dance move:", error);
    alert("Failed to load dance move details.");
  }
});
