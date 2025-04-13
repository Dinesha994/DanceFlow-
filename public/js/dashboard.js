document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
  setupDanceMoveSearch();
  setupSequenceForm();
  setupSequenceSearch();
  setupEditSequenceForm();
  setupEditProfileForm();
  setupNavigation();
  setupEventListeners();
  setupProgressFilters();
});

// Init user info 
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

    await loadDanceMoves();
    await loadProgressData();

  } catch (err) {
    localStorage.removeItem("token");
    window.location.href = "index.html";
  }
}


// Load dance moves for users
let allDances = [];

async function loadDanceMoves() {
  const baseURL = window.location.origin;
  try {
    const res = await fetch("/api/dances/dancemoves");
    allDances = await res.json();
    generateCategoryFilters(allDances);
    renderDanceCards(allDances);
  } catch (err) {
    console.error("Error fetching dance moves:", err);
  }
}

function renderDanceCards(dances) {
  const list = document.getElementById("userDanceList");
  list.innerHTML = "";

  dances.forEach(dance => {
    const card = document.createElement("div");
    card.className = "dance-card";
    card.innerHTML = `
      <img src="${dance.image ? window.location.origin + dance.image : window.location.origin + '/assets/no-image.png'}" alt="${dance.name}" />
      <div class="dance-name">${dance.name}</div>
    `;
    card.addEventListener("click", () => {
      window.location.href = `userdance-detail.html?id=${dance._id}`;
    });
    list.appendChild(card);
  });
}

function applyDanceFilters() {
  const searchInput = document.getElementById("danceMoveSearchInput").value.toLowerCase();
  const activeCategory = document.querySelector(".category-option.active").dataset.category;

  const filtered = allDances.filter(dance => {
    const matchesCategory = activeCategory ? dance.category === activeCategory : true;
    const matchesSearch = dance.name.toLowerCase().includes(searchInput);
    return matchesCategory && matchesSearch;
  });

  renderDanceCards(filtered);
}

async function generateCategoryFilters(dances) {
  const container = document.getElementById("danceCategoryFilterContainer");
  container.innerHTML = `<span class="category-option active" data-category="">All</span>`;

  const categories = [...new Set(dances.map(d => d.category).filter(Boolean))];

  categories.forEach(category => {
    const span = document.createElement("span");
    span.classList.add("category-option");
    span.dataset.category = category;
    span.textContent = category;
    container.appendChild(span);
  });

  // Add event listener to each category
  container.querySelectorAll(".category-option").forEach(option => {
    option.addEventListener("click", () => {
      container.querySelectorAll(".category-option").forEach(opt => opt.classList.remove("active"));
      option.classList.add("active");
      applyDanceFilters();

      // Close filter dropdown after selection
      container.classList.add("hidden");
    });
  });

  setupFilterDropdownToggle(); 
}


function setupFilterDropdownToggle() {
    const toggleButton = document.getElementById("filterToggleBtn");
    const filterContainer = document.getElementById("danceCategoryFilterContainer");
  
    toggleButton.addEventListener("click", () => {
      filterContainer.classList.toggle("hidden");
    });
  
    // Optional: close when clicking outside
    document.addEventListener("click", (event) => {
      if (!filterContainer.contains(event.target) && !toggleButton.contains(event.target)) {
        filterContainer.classList.add("hidden");
      }
    });
}
  

// Helper for rendering selected moves
function formatMoves(moves) {
  if (!moves || !moves.length) return "None";
  return moves.map(m => typeof m === "string" ? m : m.name || "").join(", ");
}

function setupDanceMoveSearch() {
  const searchInput = document.getElementById("danceMoveSearchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", applyDanceFilters);
}

// Load sequences to view
let allSequences = [];
let activeSequenceMoves = new Set();

async function loadUserSequences() {
  const token = localStorage.getItem("token");
  const list = document.getElementById("sequenceList");

  try {
    const res = await fetch("/api/sequences", {
      headers: { Authorization: `Bearer ${token}` },
    });
    allSequences = await res.json();

    console.log("Loaded sequences:", allSequences);

    generateSequenceMoveFilters(allSequences);
    renderSequenceList(allSequences); 
    setupSequenceSearch();

  } catch (err) {
    console.error("Error loading sequences:", err);
  }
}

function generateSequenceMoveFilters(sequences) {
  const container = document.getElementById("sequenceCategoryFilterContainer");
  container.innerHTML = "";

  const movesSet = new Set();

  sequences.forEach(seq => {
    seq.moves.forEach(move => {
      if (typeof move === "string") {
        movesSet.add(move);
      }
    });
  });

  // Add "All" option
  const allSpan = document.createElement("span");
  allSpan.classList.add("category-option");
  allSpan.dataset.move = "all";
  allSpan.textContent = "All";
  allSpan.addEventListener("click", () => {
    activeSequenceMoves.clear();
    container.querySelectorAll(".category-option").forEach(opt => opt.classList.remove("active"));
    allSpan.classList.add("active");
    applySequenceFilters();
  });
  container.appendChild(allSpan);

  movesSet.forEach(move => {
    const span = document.createElement("span");
    span.classList.add("category-option");
    span.dataset.move = move;
    span.textContent = move;

    span.addEventListener("click", () => {
      const moveValue = span.dataset.move;

      // Toggle selection
      if (activeSequenceMoves.has(moveValue)) {
        activeSequenceMoves.delete(moveValue);
        span.classList.remove("active");
      } else {
        activeSequenceMoves.add(moveValue);
        span.classList.add("active");
      }

      // If no moves selected, make sure "All" looks active
      if (activeSequenceMoves.size === 0) {
        allSpan.classList.add("active");
      } else {
        allSpan.classList.remove("active");
      }

      applySequenceFilters();
    });

    container.appendChild(span);
  });

  setupSequenceFilterDropdownToggle();
}


function renderSequenceList(sequences) {
  const list = document.getElementById("sequenceList");

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
}


function setupSequenceFilterDropdownToggle() {
  const toggleButton = document.getElementById("sequenceFilterToggleBtn");
  const filterContainer = document.getElementById("sequenceCategoryFilterContainer");

  if (!toggleButton || !filterContainer) return;

  toggleButton.addEventListener("click", () => {
    filterContainer.classList.toggle("hidden");
  });

  document.addEventListener("click", (event) => {
    if (!filterContainer.contains(event.target) && !toggleButton.contains(event.target)) {
      filterContainer.classList.add("hidden");
    }
  });
}

function applySequenceFilters() {
  const query = document.getElementById("sequenceSearchInput").value.toLowerCase();

  const filtered = allSequences.filter(seq => {
    const nameMatch = seq.name.toLowerCase().includes(query);
    const descMatch = seq.description.toLowerCase().includes(query);
    const movesMatch = formatMoves(seq.moves).toLowerCase().includes(query);

    const moveFilterMatch = activeSequenceMoves.size > 0
      ? seq.moves.some(move => activeSequenceMoves.has(move))
      : true;

    return (nameMatch || descMatch || movesMatch) && moveFilterMatch;
  });

  renderSequenceList(filtered);
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
    const moves = Array.from(document.querySelectorAll('#danceMovesList input:checked')).map(cb => cb.value);

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
        alert("Dance Sequence created Successfully!");
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

function setupSequenceSearch() {
  const searchInput = document.getElementById("sequenceSearchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", applySequenceFilters);
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
    const moves = Array.from(document.querySelectorAll('#editDanceMovesList input:checked')).map(cb => cb.value);

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

// load dance moves in sequence form 
let allDanceMoves = [];
let selectedMoves = new Set();

async function loadDanceMoveOptions() {
  try {
    const res = await fetch("/api/dances");
    allDanceMoves = await res.json();

    const container = document.getElementById("danceMovesList");
    const searchInput = document.getElementById("danceMoveSearch");

    searchInput.addEventListener("focus", () => {
      container.style.display = "block";
    });
    
    document.addEventListener("click", (event) => {
      if (!container.contains(event.target) && event.target !== searchInput) {
        container.style.display = "none";
      }
    });
    

    const renderList = (query = "") => {
      container.innerHTML = "";

      const filtered = allDanceMoves.filter(move => {
        const label = `${move.name} (${move.category})`.toLowerCase();
        return label.includes(query.toLowerCase()) || selectedMoves.has(label);
      });

      filtered.forEach(move => {
        const value = `${move.name} (${move.category})`;
        const label = document.createElement("label");

        label.innerHTML = `
          <input type="checkbox" value="${value}" ${selectedMoves.has(value) ? "checked" : ""}/>
          ${value}
        `;

        label.querySelector("input").addEventListener("change", (e) => {
          if (e.target.checked) {
            selectedMoves.add(value);
          } else {
            selectedMoves.delete(value);
          }
        });

        container.appendChild(label);
      });
    };

    searchInput.addEventListener("input", () => {
      renderList(searchInput.value);
    });

    renderList(); // Initial load

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

    const container = document.getElementById("editDanceMovesList");
    const searchInput = document.getElementById("editDanceMoveSearch");

    const renderList = (query = "") => {
      container.innerHTML = "";

      const filtered = allMoves.filter(move => {
        const value = `${move.name} (${move.category})`.toLowerCase();
        return value.includes(query.toLowerCase());
      });

      filtered.forEach(move => {
        const value = `${move.name} (${move.category})`;
        const isChecked = selectedMoves.includes(value) || selectedMoves.includes(move.name) || selectedMoves.includes(move._id);
        
        const label = document.createElement("label");
        label.innerHTML = `
          <input type="checkbox" value="${value}" ${isChecked ? "checked" : ""} />
          ${value}
        `;
        container.appendChild(label);
      });
    };

    // Clear previous input listeners to prevent duplicates
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    newSearchInput.addEventListener("input", () => {
      renderList(newSearchInput.value);
    });

    renderList(); // Initial load

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

// Calendar Integration
let calendar;

async function initCalendar() {
  const calendarEl = document.getElementById("calendar");
  calendarEl.innerHTML = "";

  const Calendar = window.tui.Calendar;

  calendar = new Calendar(calendarEl, {
    defaultView: 'month',
    usageStatistics: false,
    taskView: false,
    scheduleView: true,
    useFormPopup: false,
    useDetailPopup: false,
    isReadOnly: false,
    template: {},
    calendars: [{
      id: '1',
      name: 'Dance Sessions',
      backgroundColor: '#9e5fff',
    }],
    createOptions: {
      showQuickCreate: true,
      showCreateButton: true,
    },
  });

  calendar.on('selectDateTime', async (eventData) => {
    const selectedDate = formatDateLocal(eventData.start);
    await openSessionCreationFlow(selectedDate);
    openCreateSessionModal(selectedDate);
  });

  calendar.on('clickEvent', async (eventData) => {
    const event = eventData.event;
  
    // Reset form before populating
    const form = document.getElementById("createSessionForm");
    form.reset();
    form.dataset.sessionId = event.id;
  
    document.getElementById("sessionDate").value = new Date(event.start).toISOString().split('T')[0];
    document.getElementById("sessionDescription").value = event.raw.description || "";
  
    document.getElementById("modalTitle").textContent = "Edit Dance Session";
  
    // Load dropdown data THEN set the selected sequence
    await populateSequencesDropdown(event.raw.sequenceId);
  
    // Show modal + buttons
    document.getElementById("deleteSessionBtn").style.display = "inline-block";
    document.getElementById("markDoneSessionBtn").style.display = "inline-block";
    document.getElementById("createSessionModal").style.display = "block";
  });

  async function populateSequencesDropdown(selectedId = "") {
    const dropdown = document.getElementById("sessionSequence");
    dropdown.innerHTML = `<option disabled selected>Loading...</option>`;
  
    try {
      const res = await fetch("/api/sequences", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const sequences = await res.json();
  
      if (!sequences.length) {
        dropdown.innerHTML = `<option disabled>No sequences available</option>`;
        return;
      }
  
      dropdown.innerHTML = `<option value="">Select a sequence</option>` +
        sequences.map(s => `<option value="${s._id}">${s.name}</option>`).join("");
  
      if (selectedId) {
        dropdown.value = selectedId;
      }
  
    } catch (err) {
      console.error("Error loading sequences:", err);
      dropdown.innerHTML = `<option disabled>Error loading</option>`;
    }
  }
  
  setupCustomDropdownControls();
  await loadCalendarEvents();

  setupModalActionButtons();
  setupOutsideClickListener();

}

function formatDateLocal(date) {
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');
}

function setupOutsideClickListener() {
  const calendarElement = document.getElementById("calendar");

  window.addEventListener("click", function(event) {
    const modal = document.getElementById("createSessionModal"); // move this inside event listener!

    const isClickInsideCalendar = calendarElement.contains(event.target);
    const isClickInsideModal = modal && modal.contains(event.target); // ✅ add this check!

    if (!isClickInsideCalendar && !isClickInsideModal) {
      // Remove selection classes manually
      document.querySelectorAll('.tui-calendar-weekday-grid-cell-selected').forEach(cell => {
        cell.classList.remove('tui-calendar-weekday-grid-cell-selected');
      });
      document.querySelectorAll('.tui-calendar-weekday-grid-cell-range').forEach(cell => {
        cell.classList.remove('tui-calendar-weekday-grid-cell-range');
      });

      if (calendar?.clearSelection) {
        calendar.clearSelection();
      }
    }
  }, true); // Important to use capture phase
}

function openCreateSessionModal(date) {
  const form = document.getElementById("createSessionForm");

  // Reset form
  form.reset();
  form.dataset.sessionId = ""; // Important: clear previous session id

  document.getElementById("sessionDate").value = date;
  document.getElementById("sessionSequence").selectedIndex = 0;
  document.getElementById("sessionDescription").value = "";

  document.getElementById("deleteSessionBtn").style.display = "none";
  document.getElementById("markDoneSessionBtn").style.display = "none";

  document.getElementById("modalTitle").textContent = "Create Dance Session";

  document.getElementById("createSessionModal").style.display = "block";
}

function openEditSessionModal(session) {
  const form = document.getElementById("createSessionForm");

  form.dataset.sessionId = session.id;
  document.getElementById("sessionDate").value = new Date(session.start).toISOString().split('T')[0];
  document.getElementById("sessionSequence").value = session.raw.sequenceId;
  document.getElementById("sessionDescription").value = session.raw.description;

  document.getElementById("deleteSessionBtn").style.display = "inline-block";
  document.getElementById("markDoneSessionBtn").style.display = "inline-block";

  document.getElementById("modalTitle").textContent = "Edit Dance Session";

  document.getElementById("createSessionModal").style.display = "block";
}

async function openSessionCreationFlow(selectedDate) {
  try {
    const sequencesRes = await fetch("/api/sequences", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    const sequences = await sequencesRes.json();

    if (!sequences.length) {
      alert("No sequences available. Please create one first.");
      return;
    }

    const sequenceDropdown = document.getElementById("sessionSequence");
    sequenceDropdown.innerHTML =
      `<option value="" disabled selected>Select a sequence</option>` +
      sequences.map(s => `<option value="${s._id}">${s.name}</option>`).join("");

    document.getElementById("sessionDate").value = selectedDate;

  } catch (error) {
    console.error("Error loading sequences:", error);
    alert("Failed to load sequences.");
  }
}


async function loadCalendarEvents() {
  if (!calendar) {
    console.warn("Calendar is not initialized yet.");
    return;
  }
  const token = localStorage.getItem("token");

  try {
    const res = await fetch("/api/sessions", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const sessions = await res.json();

    calendar.clear();

    const events = sessions.map(session => ({
      id: String(session._id),
      calendarId: '1',
      title: session.sequence?.name || "Unnamed Sequence",
      category: 'time',
      start: new Date(session.date),
      end: new Date(session.date),
      isReadOnly: true,
      classNames: session.completed ? ['event-completed'] : ['event-scheduled'],
      raw: {
        description: session.description,
        completed: session.completed,
        sequenceId: session.sequence?._id
      }
    }));
    
    calendar.createEvents(events);
  } catch (error) {
    console.error("Error loading calendar sessions:", error);
  }
}

async function deleteSession(sessionId) {
  try {
    await fetch(`/api/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    alert("Session deleted!");
  } catch (error) {
    console.error("Error deleting session:", error);
    alert("Failed to delete session.");
  } finally {
    document.getElementById("createSessionModal").style.display = "none";
    await loadCalendarEvents();
    await loadProgressData();

  }
}

async function completeSession(sessionId) {
  try {
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ completed: true })
    });
    alert("Session marked as completed!");

    const event = calendar.getEvent(sessionId, '1');
    if (event) {
      // Instead of deleting and recreating, update the event directly!
      calendar.updateEvent(sessionId, '1', {
        classNames: ['event-completed'],
        raw: { ...event.raw, completed: true }
      });
    }

  } catch (error) {
    console.error("Error completing session:", error);
    alert("Failed to complete session.");
  } finally {
    document.getElementById("createSessionModal").style.display = "none";
    calendar.clearSelection?.(); 
    await loadCalendarEvents();
    await loadProgressData();

  }
}



function setupModalActionButtons() {
  // Close modal
  document.querySelector(".close-button").addEventListener("click", () => {
    document.getElementById("createSessionModal").style.display = "none";
  });

  // Form submit (Create or Update)
  document.getElementById("createSessionForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const sessionId = form.dataset.sessionId;
    const sequenceId = document.getElementById("sessionSequence").value;
    const description = document.getElementById("sessionDescription").value;
    const date = document.getElementById("sessionDate").value;
    const duration = document.getElementById("sessionDuration")?.value;

    const payload = { sequence: sequenceId, date, description, duration };
    const url = sessionId ? `/api/sessions/${sessionId}` : "/api/sessions";
    const method = sessionId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Failed to save session");

      alert(sessionId ? "Session updated!" : "Session created successfully!");

    } catch (error) {
      console.error("Error saving session:", error);
      alert("Failed to save session.");
    } finally {
      document.getElementById("createSessionModal").style.display = "none";

      // Manually remove selection classes
      document.querySelectorAll('.tui-calendar-weekday-grid-cell-selected').forEach(cell => {
        cell.classList.remove('tui-calendar-weekday-grid-cell-selected');
      });
      document.querySelectorAll('.tui-calendar-weekday-grid-cell-range').forEach(cell => {
        cell.classList.remove('tui-calendar-weekday-grid-cell-range');
      });

      await loadCalendarEvents();
      await loadProgressData();

    }
  });
  
  // delete button
  document.getElementById("deleteSessionBtn").addEventListener("click", async () => {
    const sessionId = document.getElementById("createSessionForm").dataset.sessionId;
    if (sessionId && confirm("Are you sure you want to delete this session?")) {
      await deleteSession(sessionId);
    }
  });

  // Mark done button
  document.getElementById("markDoneSessionBtn").addEventListener("click", async () => {
    const sessionId = document.getElementById("createSessionForm").dataset.sessionId;
    if (sessionId) {
      await completeSession(sessionId);
    }
  });
}

function setupCustomDropdownControls() {
  const monthSelect = document.getElementById("monthSelect");
  const yearSelect = document.getElementById("yearSelect");
  const currentDate = new Date();

  if (!monthSelect || !yearSelect) return;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  monthSelect.innerHTML = monthNames
    .map((month, index) => `<option value="${index}" ${index === currentDate.getMonth() ? 'selected' : ''}>${month}</option>`)
    .join('');

  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 20;
  const endYear = currentYear + 20;

  yearSelect.innerHTML = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
    .map(year => `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`)
    .join('');

  const updateCalendarDate = () => {
    const year = parseInt(yearSelect.value, 10);
    const month = parseInt(monthSelect.value, 10);
    calendar.setDate(new Date(year, month, 1));
    loadCalendarEvents();
  };

  monthSelect.addEventListener("change", updateCalendarDate);
  yearSelect.addEventListener("change", updateCalendarDate);
}

// Progress tracking 
async function loadProgressData() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch("/api/sessions", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const sessions = await res.json();

    const tbody = document.getElementById("progressTableBody");
    tbody.innerHTML = "";

    const sequenceDropdown = document.getElementById("filterSequence");
    sequenceDropdown.innerHTML = `<option value="all">All Sequences</option>`;
    const sequencesSet = new Set();

    sessions.forEach(session => {
      if (session.sequence?.name) {
        sequencesSet.add(session.sequence.name.toLowerCase());
      }
    });

    sequencesSet.forEach(seq => {
      const option = document.createElement("option");
      option.value = seq;
      option.textContent = seq;
      sequenceDropdown.appendChild(option);
    });

    const fromDateValue = document.getElementById("filterFromDate").value;
    const toDateValue = document.getElementById("filterToDate").value;
    const sequenceFilter = document.getElementById("filterSequence").value;
    const statusFilter = document.getElementById("filterStatus").value;

    const fromDate = fromDateValue ? new Date(fromDateValue) : null;
    const toDate = toDateValue ? new Date(toDateValue) : null;

    const filteredSessions = sessions.filter(session => {
      const sessionDate = new Date(session.date);
      const sessionSequenceName = session.sequence?.name?.toLowerCase() || '';
      const sessionStatus = session.completed ? "completed" : "scheduled";

      const matchesDate =
        (!fromDate || sessionDate >= fromDate) &&
        (!toDate || sessionDate <= toDate);

      const matchesSequence =
        !sequenceFilter || sequenceFilter === "all" || sessionSequenceName === sequenceFilter;

      const matchesStatus =
        !statusFilter || statusFilter === "all" || sessionStatus === statusFilter;

      return matchesDate && matchesSequence && matchesStatus;
    });

    if (filteredSessions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">No records found.</td></tr>`;
      return;
    }

    filteredSessions.forEach(session => {
      const row = `
        <tr>
          <td>${new Date(session.date).toLocaleDateString()}</td>
          <td>${session.sequence?.name || 'N/A'}</td>
          <td>${session.duration || 0}</td>
          <td>${session.completed ? 'Completed' : 'Scheduled'}</td>
        </tr>
      `;
      tbody.insertAdjacentHTML('beforeend', row);
    });

  } catch (error) {
    console.error("Error loading progress data:", error);
  }
}


function setupProgressFilters() {
  const applyBtn = document.getElementById("applyFiltersBtn");
  const clearBtn = document.getElementById("clearFiltersBtn");

  if (applyBtn && clearBtn) {
    applyBtn.addEventListener("click", loadProgressData);
    clearBtn.addEventListener("click", () => {
      document.getElementById("filterFromDate").value = "";
      document.getElementById("filterToDate").value = "";
      document.getElementById("filterSequence").value = "";
      document.getElementById("filterStatus").value = "";
      loadProgressData();
    });
  }
}



function setupNavigation() {
  const showSections = {
    showProfile: "profileSection",
    showDanceMoves: "danceMovesSection",
    showSequences: "sequenceSection",
    showCreateSequence: "createSequenceSection",
    showCalendar: "calendarSection",
    showProgress: "progressSection",
    showEditProfile: "editProfileSection"
  };

  // Only reset on first visit (not every reload)
  if (!sessionStorage.getItem("visitedOnce")) {
    localStorage.setItem("activeSection", "welcomeSection");
    sessionStorage.setItem("visitedOnce", "true");
  }

  Object.entries(showSections).forEach(([btnId, sectionId]) => {
    const btn = document.getElementById(btnId);
    if (!btn) return; 
  
    btn.addEventListener("click", () => {
      localStorage.setItem("activeSection", sectionId);
  
      document.querySelectorAll(".content-section").forEach(sec => {
        sec.style.display = "none";
      });
  
      document.getElementById(sectionId).style.display = "block";
      if (sectionId === "calendarSection") {
        setTimeout(() => {
          if (!calendar) {
            initCalendar(); 
          } else {
            loadCalendarEvents(); 
          }
        }, 0);
      }
  

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
      if (sectionId === "calendarSection") {
        setTimeout(() => {
          initCalendar();
        }, 0);
      }

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
    if (lastSection === "calendarSection") {
      setTimeout(() => {
        initCalendar();
      }, 0);
    }
    if (lastSection === "progressSection") loadProgressData();

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

