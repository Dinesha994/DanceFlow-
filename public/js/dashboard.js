
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
  setupNavigation();
  setupEventListeners();

  const sequenceForm = document.getElementById("createSequenceForm");
  if (sequenceForm) {
    sequenceForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("sequenceName").value.trim();
      const description = document.getElementById("sequenceDescription").value.trim();
      const token = localStorage.getItem("token");

      if (!name || !description) {
        alert("Please fill in all fields.");
        return;
      }

      try {
        const response = await fetch("/api/sequences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ name, description }),
        });

        const result = await response.json();

        if (response.ok) {
          alert("Sequence created successfully!");
          sequenceForm.reset();
          loadUserSequences(); // refresh sequence list after creation
        } else {
          alert(result.error || "Failed to create sequence.");
        }
      } catch (err) {
        console.error("Error creating sequence:", err);
        alert("Something went wrong.");
      }
    });
  }
});

// INIT USER DATA
async function initDashboard() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("No token found. Redirecting...");
    return (window.location.href = "index.html");
  }

  try {
    const res = await fetch("/api/auth/me", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Invalid or expired token");

    const data = await res.json();
    document.getElementById("userName").innerText = data.name;
    document.getElementById("userEmail").innerText = data.email;
    document.getElementById("userRole").innerText = data.role || "user";

    loadDanceMoves();
  } catch (err) {
    console.error("Auth failed:", err);
    localStorage.removeItem("token");
    window.location.href = "index.html";
  }
}

// LOAD DANCE MOVES
async function loadDanceMoves() {
  try {
    const res = await fetch("/api/dances");
    const moves = await res.json();
    const tableBody = document.getElementById("danceList");

    if (tableBody) {
      tableBody.innerHTML = "";
      moves.forEach(move => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${move.name}</td>
          <td>${move.category}</td>
          <td>${move.description}</td>
        `;
        tableBody.appendChild(row);
      });
    }
  } catch (err) {
    console.error("Failed to load dances:", err);
  }
}

// LOAD USER SEQUENCES
async function loadUserSequences() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch("/api/sequences", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const sequences = await res.json();
    const section = document.getElementById("sequenceSection");

    section.innerHTML = "<h2>Your Dance Sequences</h2>";

    if (sequences.length === 0) {
      section.innerHTML += "<p>You haven't added any sequences yet.</p>";
    } else {
      const table = document.createElement("table");
      table.classList.add("sequence-table");
      table.innerHTML = `
        <thead>
          <tr><th>Name</th><th>Description</th><th>Created At</th></tr>
        </thead>
        <tbody>
          ${sequences.map(seq => `
            <tr>
              <td>${seq.name}</td>
              <td>${seq.description}</td>
              <td>${new Date(seq.createdAt).toLocaleString()}</td>
            </tr>
          `).join("")}
        </tbody>
      `;
      section.appendChild(table);
    }
  } catch (err) {
    console.error("Error loading sequences:", err);
  }
}

// NAVIGATION SECTION TOGGLING
function setupNavigation() {
  const showProfile = document.getElementById("showProfile");
  const showDanceMoves = document.getElementById("showDanceMoves");
  const showSequences = document.getElementById("showSequences");
  const showCreateSequence = document.getElementById("showCreateSequence");
  const showEditProfile = document.getElementById("showEditProfile");

  const sections = {
    welcome: document.getElementById("welcomeSection"),
    profile: document.getElementById("profileSection"),
    dances: document.getElementById("danceMovesSection"),
    sequences: document.getElementById("sequenceSection"),
    create: document.getElementById("createSequenceSection"),
    edit: document.getElementById("editProfileSection")
  };

  function hideAllSections() {
    Object.values(sections).forEach(section => {
      if (section) section.style.display = "none";
    });
  }

  function show(section) {
    hideAllSections();
    if (section) section.style.display = "block";
  }

  if (showProfile) showProfile.addEventListener("click", () => show(sections.profile));
  if (showDanceMoves) showDanceMoves.addEventListener("click", () => show(sections.dances));
  if (showSequences) showSequences.addEventListener("click", () => {
    show(sections.sequences);
    loadUserSequences();
  });
  if (showCreateSequence) showCreateSequence.addEventListener("click", () => show(sections.create));
  if (showEditProfile) showEditProfile.addEventListener("click", () => show(sections.edit));

  show(sections.welcome);
}

// PROFILE EVENTS
function setupEventListeners() {
  const editProfileBtn = document.getElementById("editProfileBtn");
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      document.getElementById("editProfileModal").style.display = "block";
    });
  }

  const closeBtn = document.querySelector(".close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("editProfileModal").style.display = "none";
    });
  }

  const updateProfileForm = document.getElementById("updateProfileForm");
  if (updateProfileForm) {
    updateProfileForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const newName = document.getElementById("newName").value;
      const newPassword = document.getElementById("newPassword").value;
      const token = localStorage.getItem("token");

      if (!token) {
        alert("You are not logged in. Please log in first.");
        window.location.href = "index.html";
        return;
      }

      const updateData = {};
      if (newName) updateData.name = newName;
      if (newPassword) updateData.password = newPassword;

      try {
        const response = await fetch("/api/auth/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        });

        const result = await response.json();
        if (response.ok) {
          alert("Profile updated successfully!");
          window.location.reload();
        } else {
          alert("Error updating profile: " + result.error);
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        alert("Error updating profile. Please try again.");
      }
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      alert("Logged out successfully!");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    });
  }
}