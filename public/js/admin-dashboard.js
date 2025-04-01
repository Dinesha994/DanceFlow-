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
  setupNavigation();
  setupLogout();

  loadUsers();
  loadDanceMoves();
});

// add dance form
function setupAddDanceForm() {
  document.getElementById("addDanceForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const name = document.getElementById("danceName").value.trim();
    const category = document.getElementById("danceCategory").value.trim();
    const description = document.getElementById("danceDescription").value.trim();
    const imageUrl = document.getElementById("danceImage").value.trim();

    const res = await fetch("/api/admin/add-dance", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, category, description, image: imageUrl }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Dance move added!");
      e.target.reset();
      loadDanceMoves();
    } else {
      alert(data.error || "Error adding dance move");
    }
  });
}

function setupDanceMoveSearch() {
  const searchInput = document.getElementById("danceSearchInput");
  const tableBody = document.getElementById("danceList");

  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();

    Array.from(tableBody.getElementsByTagName("tr")).forEach((row) => {
      const [nameCell, categoryCell, descriptionCell] = row.getElementsByTagName("td");

      const name = nameCell?.textContent.toLowerCase() || "";
      const category = categoryCell?.textContent.toLowerCase() || "";
      const description = descriptionCell?.textContent.toLowerCase() || "";

      const matches = name.includes(query) || category.includes(query) || description.includes(query);
      row.style.display = matches ? "" : "none";
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

    try {
      const res = await fetch(`/api/admin/dances/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, category, description }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Dance move updated!");

        // Hide the edit form
        document.getElementById("editDanceForm").style.display = "none";
        
        // Clear the form (optional)
        form.reset();

        // Refresh dance move list
        loadDanceMoves();
      } else {
        alert(data.error || "Error updating dance move");
      }
    } catch (err) {
      console.error("Error updating dance move:", err);
    }
  });
}

function showEditModal(dance) {
  document.getElementById("edit-id").value = dance._id;
  document.getElementById("edit-name").value = dance.name;
  document.getElementById("edit-category").value = dance.category;
  document.getElementById("edit-description").value = dance.description;

  const editFormContainer = document.getElementById("editDanceForm");
  if (editFormContainer) {
    editFormContainer.style.display = "block";
  } else {
    console.error("Missing #edit-form-container in your HTML");
  }
}



function hideEditForm() {
  document.getElementById("editDanceForm").style.display = "none";
  document.getElementById("edit-form").reset();
}

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

// load dance moves
async function loadDanceMoves() {
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
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${dance.name}</td>
        <td>${dance.category}</td>
        <td>${dance.description}</td>
        <td>
          ${dance.image ? `<img src="${dance.image}" alt="${dance.name}" class="dance-move-image" />` : "—"}
        </td>

        <td>
          <button onclick='showEditModal(${JSON.stringify(dance)})'>Edit</button>
          <button onclick='deleteDanceMove("${dance._id}")'>Delete</button>
        </td>
      `;
      list.appendChild(row);
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

// navigation
function setupNavigation() {
  const sections = {
    showAllUsers: "allUsersSection",
    showAddDanceMove: "addDanceMoveSection",
    showAllDanceMoves: "allDanceMovesSection",
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


function setupLogout() {
  document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    window.location.href = "index.html";
  });
}


