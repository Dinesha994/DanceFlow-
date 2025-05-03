document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
  setupReminderToast()
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
    const nameInput = document.getElementById("newName");
    if (nameInput) nameInput.value = data.name;

    await loadDanceMoves();
    await loadProgressData();

  } catch (err) {
    localStorage.removeItem("token");
    window.location.href = "index.html";
  }
}

async function setupReminderToast() {
  const token = localStorage.getItem("token");
  if (!token) return;

  if (sessionStorage.getItem("reminderShown")) return;

  try {
    const res = await fetch("/api/sessions", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const sessions = await res.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions = sessions.filter(session => {
      const date = new Date(session.date);
      date.setHours(0, 0, 0, 0);
      return date.getTime() === today.getTime() && !session.completed;
    });

    if (!todaySessions.length) return;

    const list = document.getElementById("todaySessionsList");
    const toast = document.getElementById("reminderToast");
    const closeBtn = document.getElementById("closeReminderToast");

    list.innerHTML = todaySessions.map(s =>
      `<li><strong>${s.sequence?.name || 'Unnamed'}</strong> - ${s.description || 'No description'}</li>`
    ).join("");

    toast.classList.remove("hidden");
    toast.classList.add("show");

    closeBtn.addEventListener("click", () => {
      toast.classList.remove("show");
      sessionStorage.setItem("reminderShown", "true");
    });

  } catch (err) {
    console.error("Failed to load reminder:", err);
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

// shows the dance cards
function renderDanceCards(dances) {
  const list = document.getElementById("userDanceList");
  list.className = "dance-list-grid";
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

  renderDanceCards(filtered); // filtered as card 
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
  
    // close when clicking outside
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

  const movesSet = new Set(); // stores unique values 

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




// create sequence form 
function setupSequenceForm() {
  const form = document.getElementById("createSequenceForm");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const name = document.getElementById("sequenceName").value;
    const description = document.getElementById("sequenceDescription").value;
    const selected = moveChoices.getValue();
    const moves = selected.map(item => item.value);

    try {
      const res = await fetch("/api/sequences", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
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
    const select = document.getElementById("editDanceMoveSelect");
    const moves = editMoveChoices.getValue(true); 

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

let moveChoices;

async function loadDanceMoveOptions() {
  try {
    const res = await fetch("/api/dances");
    allDanceMoves = await res.json();

    const selectEl = document.getElementById("sequenceMoves");
    selectEl.innerHTML = "";

    allDanceMoves.forEach(move => {
      const option = document.createElement("option");
      option.value = `${move.name} (${move.category})`;
      option.text = `${move.name} (${move.category})`;
      selectEl.appendChild(option);
    });

    // Initialize Choices.js
    if (moveChoices) moveChoices.destroy();
    moveChoices = new Choices(selectEl, {
      removeItemButton: true,
      searchEnabled: true,
      placeholderValue: "Select moves...",
      noResultsText: "No matching moves",
      shouldSort: false
    });

  } catch (err) {
    console.error("Error loading dance moves:", err);
  }
}

//load edit dance moves options
let editMoveChoices; 

async function loadEditDanceMoveOptions(sequenceId) {
  try {
    const token = localStorage.getItem("token");

    const [danceRes, sequenceRes] = await Promise.all([
      fetch("/api/dances"),
      fetch(`/api/sequences/${sequenceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ]);

    const allMoves = await danceRes.json();
    const sequenceData = await sequenceRes.json();
    const selectedMoves = sequenceData.moves || [];

    const select = document.getElementById("editDanceMoveSelect");
    select.innerHTML = ""; 

    allMoves.forEach(move => {
      const label = `${move.name} (${move.category})`;
      const option = document.createElement("option");
      option.value = label;
      option.textContent = label;

      // Pre-select if it's part of current sequence
      if (
        selectedMoves.includes(label) ||
        selectedMoves.includes(move.name) ||
        selectedMoves.includes(move._id)
      ) {
        option.selected = true;
      }

      select.appendChild(option);
    });

    // Destroy existing instance if present
    if (editMoveChoices) editMoveChoices.destroy();

    // Initialize new Choices instance
    editMoveChoices = new Choices(select, {
      removeItemButton: true,
      placeholder: true,
      placeholderValue: "Select moves...",
      searchPlaceholderValue: "Search dance moves..."
    });

  } catch (err) {
    console.error("Error loading edit dance move options:", err);
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
  
    const isPasswordFilled = password.length > 0 || confirm.length > 0;
  
    if (isPasswordFilled) {
      // Password strength validation
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
  
      if (password && confirm && password !== confirm) {
        mismatchError.style.display = "block";
        updateBtn.disabled = true;
      } else if (strengthText.style.color === "green") {
        mismatchError.style.display = "none";
        updateBtn.disabled = false;
      }
    } else {
      // Password fields are empty — allow update of name only
      strengthText.textContent = "";
      mismatchError.style.display = "none";
      updateBtn.disabled = false;
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
    isReadOnly: false,
    calendars: [{
      id: '1',
      name: 'Dance Sessions',
    }],
    template: {
      time: function(schedule) {
        return `<span class="${schedule.classNames?.[0] || ''}">${schedule.title}</span>`;
      },
      schedule: function(schedule) {
        const { classNames, title } = schedule;
        const customClass = (classNames && classNames.length) ? classNames[0] : "";
        return `<span class="${customClass}">${title}</span>`;
      }
    }
  });
  

  calendar.on('selectDateTime', async (eventData) => {
    const selected = eventData.start;
    const selectedDateStr = selected.getFullYear() + '-' + 
      String(selected.getMonth() + 1).padStart(2, '0') + '-' + 
      String(selected.getDate()).padStart(2, '0');

    const todayStr = new Date().toISOString().split('T')[0];

    if (selectedDateStr < todayStr) {
      alert("You can't create sessions in the past.");
      return;
    }

  
    const formatted = selectedDateStr;
    await openSessionCreationFlow(selectedDateStr);
    openCreateSessionModal(selectedDateStr);

  });
  
  

  calendar.on('clickEvent', async (eventData) => {
    const event = eventData.event;
    const form = document.getElementById("createSessionForm");
    form.reset();
    form.dataset.sessionId = event.id;
  
    document.getElementById("sessionDate").value = new Date(event.start).toISOString().split('T')[0];
    document.getElementById("sessionDescription").value = event.raw.description || "";
  
    document.getElementById("modalTitle").textContent = "Edit Dance Session";
    await populateSequencesDropdown(event.raw.sequenceId);
  
    const isToday = new Date(event.start).toDateString() === new Date().toDateString();
    const practiceBtn = document.getElementById("practiceNowBtn");
  
    practiceBtn.style.display = isToday ? "inline-block" : "none";
    practiceBtn.onclick = () => openPracticeSession(event.raw.sequenceId, event.id);
  
    document.getElementById("deleteSessionBtn").style.display = "inline-block";
    document.getElementById("markDoneSessionBtn").style.display = "none";
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
  
  await loadCalendarEvents();
  await loadUserSessionsAndRecommend();
  setupCustomDropdownControls();
  setupModalActionButtons();
  setupOutsideClickListener();

}

function formatDateLocal(dateInput) {
  const date = (typeof dateInput === 'string') ? new Date(dateInput) : dateInput;
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');
}


function setupOutsideClickListener() {
  const calendarElement = document.getElementById("calendar");

  window.addEventListener("click", function(event) {
    const modal = document.getElementById("createSessionModal");

    const isClickInsideCalendar = calendarElement.contains(event.target);
    const isClickInsideModal = modal && modal.contains(event.target); 

    if (!isClickInsideCalendar && !isClickInsideModal) {

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
  }, true); 
}

function openCreateSessionModal(date) {
  const form = document.getElementById("createSessionForm");

  // Reset form
  form.reset();
  form.dataset.sessionId = ""; 

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
  if (!calendar || typeof calendar.createEvents !== "function") {
    console.warn("Calendar is not fully initialized.");
    return;
  }  

  const token = localStorage.getItem("token");

  try {
    const res = await fetch("/api/sessions", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const sessions = await res.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight

    sessions.forEach(session => {
      const sessionDate = new Date(session.date + "T00:00:00");

      // Only mark skipped if it's efore today
      session.skipped = !session.completed && sessionDate < today;
    });


    console.log("Sessions with skip status:", sessions);
    
    calendar.clear();

    const events = sessions.map(session => {
      const sessionDate = new Date(session.date);
      let icon = "🟣"; 
    
      if (session.completed) {
        icon = "✅"; 
      } else if (!session.completed && sessionDate < today) {
        icon = "⚠️"; 
      }
    
      return {
        id: String(session._id),
        calendarId: '1',
        title: `${icon} ${session.sequence?.name || "Unnamed Sequence"}`,
        start: new Date(session.date),
        end: new Date(session.date),
        isReadOnly: true,
        raw: {
          description: session.description,
          completed: session.completed,
          skipped: session.skipped, 
          sequenceId: session.sequence?._id
        }
      };
    });
    
    console.log("Final calendar events to render:", events);

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

    const payload = {
      sequence: sequenceId,
      date, 
      description,
      duration
    };

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

     
      document.querySelectorAll('.tui-calendar-weekday-grid-cell-selected').forEach(cell => {
        cell.classList.remove('tui-calendar-weekday-grid-cell-selected');
      });
      document.querySelectorAll('.tui-calendar-weekday-grid-cell-range').forEach(cell => {
        cell.classList.remove('tui-calendar-weekday-grid-cell-range');
      });

      await loadCalendarEvents();
      await loadProgressData();
      await loadUserSessionsAndRecommend();

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
    const sessionDateStr = document.getElementById("sessionDate").value;
    const sessionDate = new Date(sessionDateStr);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    if (sessionDate > today) {
      alert("You can’t mark future sessions as done.");
      return;
    }
  
    if (sessionId) {
      await completeSession(sessionId);
    }
  });
    
  
}

async function openPracticeSession(sequenceId, sessionId) {
  try {
    const res = await fetch(`/api/sequences/${sequenceId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    const sequence = await res.json();

    document.getElementById("practiceTitle").textContent = `Practice: ${sequence.name}`;
    document.getElementById("practiceSequenceName").textContent = sequence.name;
    document.getElementById("practiceDescription").textContent = sequence.description || "No description provided";

    const movesList = document.getElementById("practiceMovesList");
    movesList.innerHTML = "";

    sequence.moves.forEach(move => {
      const li = document.createElement("li");
    
      const moveLabel = typeof move === "object" ? move.name : move;
    
      const nameOnly = moveLabel.split(" (")[0];
    
      const matchedMove = allDances.find(d => d.name === nameOnly);
    
      if (matchedMove) {
        const link = document.createElement("a");
        link.href = `userdance-detail.html?id=${matchedMove._id}`;
        link.textContent = `${matchedMove.name} (${matchedMove.category})`;
        link.classList.add("practice-move-link");
        li.appendChild(link);
      } else {
        li.textContent = moveLabel;
      }
    
      movesList.appendChild(li);
    });    
    
    
    const markBtn = document.getElementById("markAsPracticedBtn");
    if (markBtn) {
      markBtn.onclick = () => markSessionAsPracticed(sessionId);
    }

    document.getElementById("createSessionModal").style.display = "none";
    document.getElementById("calendarSection").style.display = "none";
    document.getElementById("practiceSessionView").style.display = "block";

    window.currentPracticeSequenceId = sequenceId;
    window.currentPracticeSessionId = sessionId;
    
  } catch (err) {
    console.error("Error loading practice session:", err);
    alert("Couldn't load practice session.");
  }
}

function backToCalendar() {
  document.getElementById("practiceSessionView").style.display = "none";
  document.getElementById("calendarSection").style.display = "block";
}

async function markSessionAsPracticed(sessionId) {
  try {
    sessionId = sessionId || window.currentPracticeSessionId;
    if (!sessionId) {
      alert("Session ID is missing.");
      return;
    }

    await completeSession(sessionId);

    alert("Session marked as completed!");

    // Hide the practice view
    document.getElementById("practiceSessionView").style.display = "none";

    // Refresh calendar and progress data
    await loadCalendarEvents();
    await loadProgressData();
    await loadUserSessionsAndRecommend();


    // Show calendar
    document.getElementById("calendarSection").style.display = "block";
    localStorage.setItem("activeSection", "calendarSection");
  } catch (err) {
    console.error("Failed to mark session as practiced:", err);
    alert("Could not mark as practiced.");
  }
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
  const startYear = currentYear - 10;
  const endYear = currentYear + 10;

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
    const selectedSequence = sequenceDropdown.value;
    sequenceDropdown.innerHTML = `<option value="all" selected>All Sequences</option>`;
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

    if ([...sequencesSet].includes(selectedSequence) || selectedSequence === "all") {
      sequenceDropdown.value = selectedSequence;
    }
    const fromDateValue = document.getElementById("filterFromDate").value;
    const toDateValue = document.getElementById("filterToDate").value;
    const sequenceFilter = document.getElementById("filterSequence").value.toLowerCase();
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

function recommendNextSession(sessions) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pastSessions = sessions
    .filter(s => {
      const sessionDate = new Date(s.date);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate <= today && (s.completed || s.skipped);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const futureSessions = sessions.filter(s => {
    const sessionDate = new Date(s.date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate > today && !s.completed;
  });

  if (futureSessions.length > 0) {
    return null; // Don't suggest if user already has sessions coming up
  }

  const lastSession = pastSessions[0];
  const lastDate = lastSession ? new Date(lastSession.date) : today;

  lastDate.setHours(0, 0, 0, 0);
  const gapDays = Math.ceil((today - lastDate) / (1000 * 60 * 60 * 24));

  if (gapDays > 3) {
    return {
      suggestedDate: addDays(today, 1),
      note: "You've been away for a while. Let's get back!"
    };
  } else if (gapDays <= 2) {
    return {
      suggestedDate: addDays(today, 3),
      note: "Keep up the good rhythm!"
    };
  } else {
    return {
      suggestedDate: addDays(today, 2),
      note: "Maintain consistency!"
    };
  }
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split("T")[0]; 
}

function showRecommendedSession(suggestion) {
  // Remove existing suggestion event if already present
  const existing = calendar.getEvent("suggestion", "1");
  if (existing) {
    calendar.deleteEvent("suggestion", "1");
  }

  calendar.createEvents([
    {
      id: "suggestion",
      calendarId: "1",
      title: `💥 ${suggestion.note}`,
      start: suggestion.suggestedDate,
      end: suggestion.suggestedDate,
      isReadOnly: true,
      raw: { description: suggestion.note }
    }
  ]);
}

function showRecommendationToast(recommendation) {
  const toast = document.getElementById("recommendationToast");
  const content = document.getElementById("recommendationContentList");

  content.innerHTML = `
    <li><strong>Date:</strong> ${recommendation.suggestedDate}</li>
    <li><em>${recommendation.note}</em></li>
  `;

  toast.classList.remove("hidden");
  toast.classList.add("show");

  document.getElementById("closeRecommendationToast").addEventListener("click", () => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
  });
}



let hasSuggestedSessionShown = false; // Global tracker

async function loadUserSessionsAndRecommend() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch("/api/sessions", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const sessions = await res.json();

    const suggestion = recommendNextSession(sessions);
    if (suggestion) {
      showRecommendedSession(suggestion);
      if (!sessionStorage.getItem("recommendationShown")) {
        showRecommendationToast(suggestion);
        sessionStorage.setItem("recommendationShown", "true");
      }
    }



  } catch (error) {
    console.error("Recommendation fetch error:", error);
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
      
        const currentName = document.getElementById("userName").innerText;
        const nameInput = document.getElementById("newName");
        if (nameInput) nameInput.value = currentName;
      }
      
      if (sectionId === "createSequenceSection") {
        document.getElementById("createSequenceForm")?.reset();
      }

      // Loaders
      if (sectionId === "sequenceSection") loadUserSequences();
      if (sectionId === "createSequenceSection") loadDanceMoveOptions();
      if (sectionId === "calendarSection") {
        setTimeout(() => {
          if (!calendar) {
            initCalendar();
          } else {
            loadCalendarEvents();
            loadUserSessionsAndRecommend();
          }
        }, 50);
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
    
    if (lastSection === "progressSection") loadProgressData();
    if (lastSection === "calendarSection") {
      setTimeout(() => {
        if (!calendar) {
          initCalendar();
        } else {
          loadCalendarEvents();
          loadUserSessionsAndRecommend();
        }
      }, 100); // Delay ensures the calendar container is fully rendered
    }

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

