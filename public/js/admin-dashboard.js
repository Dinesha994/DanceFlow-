document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) return redirectToLogin("You are not logged in.");

  const userRes = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const userData = await userRes.json();
  if (userData.role !== "admin") return redirectToLogin("Access denied. Admins only.");

  setupAddDanceForm();
  setupDanceMoveSearch();
  setupEditDanceForm();
  setupSearch();
  setupEditProfileForm();
  setupNavigation();
  setupLogout();

  loadUsers();
  loadDanceMoves();
});

// load all users
async function loadUsers(search = "") {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const users = await res.json();
    const table = document.getElementById("userTableBody");
    table.innerHTML = "";

    users.forEach(user => {
      const row = table.insertRow();
      row.innerHTML = `
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
      `;
    });
  } catch (err) {
    console.error("Error fetching users:", err);
  }
}

// add dance form
function setupAddDanceForm() {
  document.getElementById("addDanceForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const name = document.getElementById("danceName").value.trim();
    const category = document.getElementById("danceCategory").value.trim();
    const description = document.getElementById("danceDescription").value.trim();
    const imageFile = document.getElementById("danceImageFile").files[0];

    if (!imageFile) {
      alert("Please select an image file.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("image", imageFile);

    try {
      const res = await fetch("/api/admin/add-dance", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("Dance move added!");
        e.target.reset();
        loadDanceMoves();
      } else {
        alert(data.error || "Error adding dance move");
      }
    } catch (err) {
      console.error("Error adding dance move:", err);
      alert("Something went wrong. Please try again.");
    }
  });
}


function setupDanceMoveSearch() {
  const searchInput = document.getElementById("danceSearchInput");
  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll(".dance-card");

    cards.forEach(card => {
      const name = card.querySelector(".dance-name")?.textContent.toLowerCase() || "";
      const matches = name.includes(query);
      card.style.display = matches ? "block" : "none";
    });
  });
}

// edit dance form
function setupEditDanceForm() {
  const form = document.getElementById("edit-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const id = document.getElementById("edit-id").value;
    const name = document.getElementById("edit-name").value.trim();
    const category = document.getElementById("edit-category").value.trim();
    const description = document.getElementById("edit-description").value.trim();
    const imageFile = document.getElementById("edit-image").files[0];

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("description", description);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const res = await fetch(`/api/admin/dances/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("Dance move updated!");

        hideEditForm();
        loadDanceMoves();
      } else {
        alert(data.error || "Error updating dance move");
      }
    } catch (err) {
      console.error("Error updating dance move:", err);
      alert("Something went wrong. Please try again.");
    }
  });
}


function showEditModal(dance) {
  // Hide all other content sections
  document.querySelectorAll(".content-section").forEach(sec => sec.style.display = "none");

  // Populate form fields
  document.getElementById("edit-id").value = dance._id;
  document.getElementById("edit-name").value = dance.name;
  document.getElementById("edit-category").value = dance.category;
  document.getElementById("edit-description").value = dance.description;

  // Show edit form
  const editFormContainer = document.getElementById("editDanceForm");
  if (editFormContainer) {
    editFormContainer.style.display = "block";
  } else {
    console.error("Missing #editDanceForm in your HTML");
  }
}

function hideEditForm() {
  document.getElementById("editDanceForm").style.display = "none";
  document.getElementById("edit-form").reset();
}

// load dance moves
async function loadDanceMoves() {
  const baseURL = window.location.origin;
  const token = localStorage.getItem("token");
  try {
    const res = await fetch("/api/admin/dancemoves", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const dances = await res.json();
    const list = document.getElementById("danceList");
    list.innerHTML = "";

    dances.forEach(dance => {
      const card = document.createElement("div");
      card.className = "dance-card";

      card.innerHTML = `
        <img src="${dance.image ? baseURL + dance.image : baseURL + '/assets/no-image.png'}" alt="${dance.name}" />
        <div class="dance-name">${dance.name}</div>
        <div class="dance-actions">
          <button class="edit-btn" data-id="${dance._id}">Edit</button>
          <button class="delete-btn" data-id="${dance._id}">Delete</button>
        </div>
      `;

      card.querySelector(".edit-btn").addEventListener("click", (e) => {
        e.stopPropagation(); // Important: Prevent card click
        showEditModal(dance);
      });
    
      card.querySelector(".delete-btn").addEventListener("click", async (e) => {
        e.stopPropagation(); // Important: Prevent card click
        if (confirm("Are you sure you want to delete this dance move?")) {
          await deleteDanceMove(dance._id);
        }
      });

      card.addEventListener("click", () => {
        window.location.href = `dance-detail.html?id=${dance._id}`;
      });
      
      list.appendChild(card);
    });
  } catch (err) {
    console.error("Error fetching dance moves:", err);
  }
}




// delete dance moves
async function deleteDanceMove(id) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`/api/admin/dances/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (res.ok) {
      alert("Dance move deleted!");
      loadDanceMoves();
    } else {
      alert(data.error || "Error deleting dance move");
    }
  } catch (err) {
    console.error("Error deleting dance move:", err);
  }
}

function setupSearch() {
  const searchInput = document.getElementById("userSearchInput");
  if (searchInput) {
    searchInput.classList.add("search-input"); 
    searchInput.addEventListener("input", (e) => {
      loadUsers(e.target.value);
    });
  }
}

function redirectToLogin(message) {
  alert(message);
  window.location.href = "index.html";
}

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

  const togglePassword = document.getElementById("togglePassword");
  togglePassword?.addEventListener("change", () => {
  const type = togglePassword.checked ? "text" : "password";
  document.getElementById("newPassword").type = type;
  document.getElementById("confirmPassword").type = type;
});

}

// navigation
function setupNavigation() {
  const sections = {
    showAllUsers: "allUsersSection",
    showAddDanceMove: "addDanceMoveSection",
    showAllDanceMoves: "allDanceMovesSection",
    showEditProfile: "editProfileSection",
  };

  Object.entries(sections).forEach(([btnId, sectionId]) => {
    document.getElementById(btnId)?.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".content-section").forEach(sec => sec.style.display = "none");
      document.getElementById(sectionId).style.display = "block";
    });
  });

  document.querySelectorAll(".content-section").forEach(sec => sec.style.display = "none");
}

// Handle URL hash navigation
const hash = window.location.hash;
if (hash) {
  const targetBtn = document.getElementById(hash.replace("#", ""));
  targetBtn?.click();
}



function setupLogout() {
  document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    window.location.href = "index.html";
  });
}


