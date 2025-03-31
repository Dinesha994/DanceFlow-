document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
  setupNavigation();
  setupEventListeners();
  setupSequenceForm();
  setupEditSequenceForm();
  setupEditProfileForm();
});

// Init user info and dance moves
async function initDashboard() {
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "index.html");

  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    document.getElementById("userName").innerText = data.name;
    document.getElementById("userEmail").innerText = data.email;
    document.getElementById("userRole").innerText = data.role;
    loadDanceMoves();
  } catch (err) {
    localStorage.removeItem("token");
    window.location.href = "index.html";
  }
}

// Load dance moves for display
async function loadDanceMoves() {
  try {
    const res = await fetch("/api/dances");
    const moves = await res.json();
    const tableBody = document.getElementById("danceList");

    if (!tableBody) return;
    tableBody.innerHTML = "";
    moves.forEach(move => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${move.name}</td><td>${move.category}</td><td>${move.description}</td>`;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading dance moves:", err);
  }
}

// Helper for rendering selected moves
function formatMoves(moves) {
  if (!moves || !moves.length) return "None";
  return moves.map(m => typeof m === "string" ? m : m.name || "").join(", ");
}

// Load sequences to view
async function loadUserSequences() {
  const token = localStorage.getItem("token");
  const list = document.getElementById("sequenceList");
  try {
    const res = await fetch("/api/sequences", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const sequences = await res.json();
    list.innerHTML = sequences.length
      ? sequences.map(seq => `
          <tr>
            <td>${seq.name}</td>
            <td>${seq.description}</td>
            <td>${formatMoves(seq.moves)}</td>
            <td>
              <button class="edit-btn" data-id="${seq._id}" data-name="${seq.name}" data-description="${seq.description}">Edit</button>
              <button class="delete-btn" data-id="${seq._id}">Delete</button>
            </td>
          </tr>
        `).join("")
      : `<tr><td colspan="4">You haven't added any sequences yet.</td></tr>`;
    setupSequenceButtons();
  } catch (err) {
    console.error("Error loading sequences:", err);
  }
}

function setupSequenceButtons(sequences) {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const token = localStorage.getItem("token");
      if (confirm("Delete this sequence?")) {
        await fetch(`/api/sequences/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        loadUserSequences();
      }
    });
  });

  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const description = btn.dataset.description;

      // Show edit section
      const editSection = document.getElementById("editSequenceSection");
      editSection.style.display = "block";

      // Set form values
      document.getElementById("editSequenceForm").dataset.id = id;
      document.getElementById("editSequenceName").value = name;
      document.getElementById("editSequenceDescription").value = description;

      // Load moves for this sequence
      loadEditDanceMoveOptions(id);
    });
  });
}

// create sequence form 
function setupSequenceForm() {
  const form = document.getElementById("createSequenceForm");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const name = document.getElementById("sequenceName").value;
    const description = document.getElementById("sequenceDescription").value;
    const selected = document.getElementById("danceMovesSelect");
    const moves = Array.from(selected.selectedOptions).map(opt => opt.value);

    try {
      const res = await fetch("/api/sequences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, moves }),
      });

      if (res.ok) {
        form.reset();
        loadUserSequences();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to create sequence.");
      }
    } catch (err) {
      console.error("Error creating sequence:", err);
      alert("Something went wrong.");
    }
  });
}

// edit sequence form
function setupEditSequenceForm() {
  const form = document.getElementById("editSequenceForm");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const id = form.dataset.id;
    const name = document.getElementById("editSequenceName").value;
    const description = document.getElementById("editSequenceDescription").value;
    const selected = document.getElementById("editDanceMovesSelect");
    const moves = Array.from(selected.selectedOptions).map(opt => opt.value);

    try {
      const response = await fetch(`/api/sequences/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description, moves }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update");
      }

      await response.json();
      document.getElementById("editSequenceSection").style.display = "none";
      form.reset();
      delete form.dataset.id;
      await loadUserSequences();

    } catch (err) {
      console.error("Update error:", err);
      alert("Could not update sequence.");
    }
  });
}

let danceChoices;
let editDanceChoices;

// load dance moves 
async function loadDanceMoveOptions() {
  try {
    const res = await fetch("/api/dances");
    const moves = await res.json();
    const select = document.getElementById("danceMovesSelect");

    if (!select) return;

    select.innerHTML = ""; // Clear existing options

    moves.forEach(move => {
      const value = `${move.name} (${move.category})`;
      const option = document.createElement("option");
      option.value = value;
      option.text = value;
      select.appendChild(option);
    });

    if (danceChoices) danceChoices.destroy();
    danceChoices = new Choices(select, {
      removeItemButton: true,
      placeholderValue: "Select dance moves",
      searchPlaceholderValue: "Search...",
    });

  } catch (err) {
    console.error("Failed to load dance moves:", err);
  }
}


// load dance moves in edit form
async function loadEditDanceMoveOptions(sequenceId) {
  try {
    const token = localStorage.getItem("token");
    const [danceRes, sequenceRes] = await Promise.all([
      fetch("/api/dances"),
      fetch(`/api/sequences/${sequenceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ]);

    if (!sequenceRes.ok) {
      console.error("Failed to fetch sequence", await sequenceRes.text());
      return;
    }

    const allMoves = await danceRes.json();
    const sequenceData = await sequenceRes.json();
    const selectedMoves = sequenceData.moves || [];

    const select = document.getElementById("editDanceMovesSelect");
    if (!select) return;

    select.innerHTML = "";

    allMoves.forEach(move => {
      const value = `${move.name} (${move.category})`;
      const option = document.createElement("option");
      option.value = value;
      option.text = value;

      if (selectedMoves.includes(value) ||
      selectedMoves.includes(move.name) || 
      selectedMoves.includes(move._id)
    ) {
        option.selected = true;
      }

      select.appendChild(option);
    });

    if (editDanceChoices) editDanceChoices.destroy();
    editDanceChoices = new Choices(select, {
      removeItemButton: true,
      placeholderValue: "Select dance moves",
      searchPlaceholderValue: "Search...",
    });

  } catch (err) {
    console.error("Error loading edit dance moves:", err);
  }
}

// update profile form
function setupEditProfileForm() {
  const form = document.getElementById("updateProfileForm");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const name = document.getElementById("newName").value;
    const password = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password && password !== confirmPassword) {
      return alert("Passwords do not match!");
    }

    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return alert(data.error || "Failed to update profile.");
      }

      alert("Profile updated!");
      form.reset();

      strengthText.textContent = "";
      mismatchError.style.display = "none";

      // Re-enable button
      if (updateBtn) updateBtn.disabled = true;

    } catch (err) {
      console.error("Update error:", err);
      alert("Something went wrong.");
    }
  });

  const toggle = document.getElementById("togglePassword");
  toggle?.addEventListener("change", function () {
    const pwd = document.getElementById("newPassword");
    const confirm = document.getElementById("confirmPassword");
    const type = this.checked ? "text" : "password";
    pwd.type = type;
    confirm.type = type;
  });

  const passwordInput = document.getElementById("newPassword");
  const confirmInput = document.getElementById("confirmPassword");
  const strengthText = document.getElementById("editPasswordStrength");
  const mismatchError = document.getElementById("editPasswordError");
  const updateBtn = document.getElementById("updateProfileBtn");

  mismatchError.style.display = "none";
  strengthText.textContent = "";


  // Realtime strength + match check
  form?.addEventListener("input", () => {

    const password = passwordInput.value;
    const confirm = confirmInput.value;

    // Password strength
    if (password.length < 6) {
      strengthText.textContent = "Password too short";
      strengthText.style.color = "red";
      updateBtn.disabled = true;
    } else if (!/[A-Z]/.test(password)) {
      strengthText.textContent = "Include uppercase letter";
      strengthText.style.color = "orange";
      updateBtn.disabled = true;
    } else if (!/[0-9]/.test(password)) {
      strengthText.textContent = "Include a number";
      strengthText.style.color = "orange";
      updateBtn.disabled = true;
    } else {
      strengthText.textContent = "Strong Password";
      strengthText.style.color = "green";
    }

    // Confirm match
    if (password && confirm && password !== confirm) {
      mismatchError.style.display = "block";
      updateBtn.disabled = true;
    } else {
      mismatchError.style.display = "none";
      // Only enable if both filled + strong password + match
      updateBtn.disabled = password && confirm && password === confirm && strengthText.style.color === "green" ? false : true;
    }
  });

}


function setupNavigation() {
  const showSections = {
    showProfile: "profileSection",
    showDanceMoves: "danceMovesSection",
    showSequences: "sequenceSection",
    showCreateSequence: "createSequenceSection",
    showEditProfile: "editProfileSection"
  };

  // Only reset on first visit (not every reload)
  if (!sessionStorage.getItem("visitedOnce")) {
    localStorage.setItem("activeSection", "welcomeSection");
    sessionStorage.setItem("visitedOnce", "true");
  }

  Object.entries(showSections).forEach(([btnId, sectionId]) => {
    const btn = document.getElementById(btnId);
    btn?.addEventListener("click", () => {
      // Update last section
      localStorage.setItem("activeSection", sectionId);

      // Hide all
      document.querySelectorAll(".content-section").forEach(sec => {
        sec.style.display = "none";
      });

      // Reset forms
      if (sectionId === "editProfileSection") {
        document.getElementById("updateProfileForm").reset();
        document.getElementById("editPasswordStrength").textContent = "";
        document.getElementById("editPasswordError").style.display = "none";
      }

      if (sectionId === "createSequenceSection") {
        document.getElementById("createSequenceForm")?.reset();
      }

      // Loaders
      if (sectionId === "sequenceSection") loadUserSequences();
      if (sectionId === "createSequenceSection") loadDanceMoveOptions();

      // Show selected
      document.getElementById(sectionId).style.display = "block";
    });
  });

  // Restore from localStorage (default to welcomeSection)
  const lastSection = localStorage.getItem("activeSection") || "welcomeSection";

  // Hide all sections first
  document.querySelectorAll(".content-section").forEach(sec => {
    sec.style.display = "none";
  });

  const show = document.getElementById(lastSection);
  if (show) {
    show.style.display = "block";

    // Load data if needed
    if (lastSection === "sequenceSection") loadUserSequences();
    if (lastSection === "createSequenceSection") loadDanceMoveOptions();
  } else {
    document.getElementById("welcomeSection").style.display = "block";
  }
}



function setupEventListeners() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault(); 
      localStorage.removeItem("token");
      localStorage.removeItem("activeSection");
      sessionStorage.removeItem("visitedOnce");
      alert("Logged out");
      window.location.href = "index.html";
    });
  }
}

