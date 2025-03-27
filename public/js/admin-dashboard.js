document.addEventListener("DOMContentLoaded", async () => {
  // Check if token exists
  const token = localStorage.getItem("token");

  if (!token) {
      alert("You are not logged in.");
      return window.location.href = "index.html";
  }

  // Fetch user info
  const userRes = await fetch("/api/auth/me", {
      headers: { "Authorization": `Bearer ${token}` }
  });

  const userData = await userRes.json();
  if (userData.role !== "admin") {
      alert("Access denied. Admins only.");
      return window.location.href = "index.html";
  }

  loadUsers();
  loadDanceMoves();

  // Logout logic
  document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "index.html";
  });

  // Add new dance move
  document.getElementById("addDanceForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("danceName").value.trim();
      const category = document.getElementById("danceCategory").value.trim();
      const description = document.getElementById("danceDescription").value.trim();

      const token = localStorage.getItem("token");

      const res = await fetch("/api/admin/add-dance", {
          method: "POST",
          headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
          },
          body: JSON.stringify({ name, category, description })
      });

      const data = await res.json();
      if (res.ok) {
          alert("Dance move added!");
          document.getElementById("addDanceForm").reset();
          loadDanceMoves();
      } else {
          alert(data.error || "Error adding dance move");
      }
  });
});

// Load users into the table
async function loadUsers() {
  const token = localStorage.getItem("token"); // Get the token from localStorage

  if (!token) {
      console.log("User not authenticated. No token found.");
      return; // If no token, don't make the request
  }

  try {
      
      const response = await fetch("/api/admin/users", {
          method: "GET",
          headers: {
              "Authorization": `Bearer ${token}`, 
              "Content-Type": "application/json"
          }
      });

      
      if (!response.ok) {
          console.error("Failed to fetch users");
          return;
      }

      // If successful, parse the JSON response
      const users = await response.json();

      
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
  } catch (error) {
      console.error("Error fetching users:", error);
  }
}


document.addEventListener("DOMContentLoaded", loadUsers);


// Load dance moves into the table
async function loadDanceMoves() {
  const token = localStorage.getItem("token");

  

  try {
      const response = await fetch("/api/admin/dancemoves", {
          method: "GET",
          headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
          }
      });

      if (!response.ok) {
          throw new Error("Failed to fetch dance moves");
      }

      const dances = await response.json();
      const danceList = document.getElementById("danceList");
      danceList.innerHTML = ""; 

      dances.forEach(dance => {
          const row = document.createElement("tr");
          row.innerHTML = `
              <td>${dance.name}</td>
              <td>${dance.category}</td>
              <td>${dance.description}</td>
          `;
          danceList.appendChild(row);
      });
  } catch (error) {
      console.error("Error fetching dance moves:", error);
  }
}


document.addEventListener("DOMContentLoaded", () => {
  const showAllUsers = document.getElementById("showAllUsers");
  const showAddDanceMove = document.getElementById("showAddDanceMove");
  const showAllDanceMoves = document.getElementById("showAllDanceMoves");

  // Get all content sections
  const allUsersSection = document.getElementById("allUsersSection");
  const addDanceMoveSection = document.getElementById("addDanceMoveSection");
  const allDanceMovesSection = document.getElementById("allDanceMovesSection");

  // Function to hide all sections
  const hideAllSections = () => {
    allUsersSection.style.display = "none";
    addDanceMoveSection.style.display = "none";
    allDanceMovesSection.style.display = "none";
  };

  
  showAllUsers.addEventListener("click", (event) => {
    event.preventDefault(); 
    hideAllSections();
    allUsersSection.style.display = "block"; 
  });

 
  showAddDanceMove.addEventListener("click", (event) => {
    event.preventDefault();
    hideAllSections();
    addDanceMoveSection.style.display = "block"; 
  });

  
  showAllDanceMoves.addEventListener("click", (event) => {
    event.preventDefault();
    hideAllSections();
    allDanceMovesSection.style.display = "block"; 
  });

  
  hideAllSections();
});
