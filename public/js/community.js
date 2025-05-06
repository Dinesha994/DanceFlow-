document.addEventListener("DOMContentLoaded", () => {

  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  // Shares lists
  const mySharesList     = document.getElementById("mySharesList");
  const sharedWithMeList = document.getElementById("sharedWithMeList");

  // Share modal elements
  const shareModal   = document.getElementById("shareModal");
  const shareEmail   = document.getElementById("shareEmail");
  const shareCaption = document.getElementById("shareCaption");
  const cancelBtn    = document.getElementById("shareCancelBtn");
  const confirmBtn   = document.getElementById("shareConfirmBtn");
  const sharedModal = document.getElementById("sharedSequenceModal");
  const sharedTitle = document.getElementById("sharedSequenceTitle");
  const sharedDescription = document.getElementById("sharedSequenceDescription");
  const sharedMoveList = document.getElementById("sharedSequenceMovesList");
  const closeSharedModalBtn = document.getElementById("closeSharedSequenceModal");


  // Forum threads
  const threadList    = document.getElementById("threadList");
  const newThreadForm = document.getElementById("newThreadForm");
  const postForm = document.getElementById("newPostForm");
  const postContentInput = document.getElementById("postContent");
  let currentThreadId = null;


  // Challenges
  const challengeList = document.getElementById("challengeList");
  const newChForm     = document.getElementById("newChallengeForm");

  let myEmail      = "";
  let shareContext = null;

  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }
  


  // LOAD MY EMAIL 
  async function fetchMyEmail() {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return "";
    const me = await res.json();
    return me.email || "";
  }

  function renderShares(container, shares, emptyText) {
    if (!Array.isArray(shares) || shares.length === 0) {
      container.innerHTML = `<li>${emptyText}</li>`;
      return;
    }
  
    container.innerHTML = shares
    .filter(s => {
      if (!s.reference) return false;
      if (s.type === "Sequence") {
        return s.reference.name && s.reference.name.trim().toLowerCase() !== "unnamed";
      }
      if (s.type === "Session") {
        return s.reference.description && s.reference.description.trim() !== "";
      }
      return false;
    })    
      .map(s => {
        const isMine = s.from.email === myEmail;
        const other = isMine
          ? `<strong>To:</strong>   ${s.to.name}`
          : `<strong>From:</strong> ${s.from.name}`;
  
        const captionHtml = s.caption
          ? `<p class="caption">“${s.caption}”</p>`
          : "";

        const when = new Date(s.createdAt).toLocaleString();
  
        if (s.type === "Session") {
          const sessionDate = new Date(s.reference.date).toISOString().split("T")[0]; 

          return `
            <li>
              ${other}<br>
              <strong>Session:</strong> ${s.reference?.description?.trim() || "Untitled Session"}<br>
              ${captionHtml}
              <small>${when}</small>
              <br>
              <a href="dashboard.html?date=${sessionDate}#calendarSection" class="view-calendar-link"> View in Calendar</a>
            </li>
          `;

        }
  
        return `
          <li>
            ${other}<br>
            <strong>Sequence:</strong> 
            <a href="#" class="shared-sequence-link" data-id="${typeof s.reference === 'object' ? s.reference._id : s.reference}">
              ${s.reference?.name?.trim() || s.caption || "Unnamed"}
            </a><br>
            ${captionHtml}
            <small>${when}</small>
          </li>
        `;
      }).join("");
  }
  

  // LOAD & RENDER SHARES
  async function loadShares() {
    try {
      if (!myEmail) myEmail = await fetchMyEmail();

      // — My Shares —
      let res = await fetch("/api/community/shares?mine=true", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const mine = res.ok ? await res.json() : [];
      renderShares(mySharesList, mine, "You haven't shared any sequences yet.");

      // — Shared With Me —
      res = await fetch("/api/community/shares?mine=false", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const incoming = res.ok ? await res.json() : [];
      renderShares(sharedWithMeList, incoming, "No one has shared a sequence with you.");

          // Attach click handlers to shared sequence links
          sharedWithMeList.querySelectorAll(".shared-sequence-link").forEach(link => {
            link.addEventListener("click", async (e) => {
              e.preventDefault();
              const sequenceId = e.currentTarget.dataset.id;
              if (!sequenceId) return alert("Sequence not found");
          
              try {
                const res = await fetch(`/api/sequences/public/${sequenceId}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Could not load sequence");
          
                const sequence = await res.json();
                console.log("Fetched sequence:", sequence);
          
                // Fill modal content
                sharedTitle.textContent = sequence.name;
                sharedDescription.textContent = sequence.description || "No description.";
                sharedMoveList.innerHTML = "";

                (sequence.moves || []).forEach(move => {
                const li = document.createElement("li");
                const link = document.createElement("a");
                const moveName = move?.name || "Unnamed";
                const moveCategory = move?.category || "Uncategorized";
                const moveId = move?._id || "#";
                link.href = `userdance-detail.html?id=${moveId}`;
                link.textContent = `${moveName} (${moveCategory})`;
                link.target = "_blank";
                li.appendChild(link);
                sharedMoveList.appendChild(li);
                });

                sharedModal.classList.remove("hidden");
              } catch (err) {
                console.error("Failed to load sequence:", err);
                alert("Failed to load shared sequence.");
              }
            });
          });
          
    } catch (err) {
      console.error("Error loading shares:", err);
      mySharesList.innerHTML     = "<li>Error loading shares.</li>";
      sharedWithMeList.innerHTML = "<li>Error loading shares.</li>";
    }
  }

  // SHARE MODAL 
  document.body.addEventListener("click", e => {
    if (e.target.matches(".share-btn")) {
      let type = e.target.dataset.type;
      type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(); 
  
      shareContext = {
        type:      type,
        reference: e.target.dataset.ref
      };
  
      shareEmail.value   = "";
      shareCaption.value = "";
      shareModal.classList.remove("hidden");
    }
  });
  

  cancelBtn.addEventListener("click", () => {
    shareModal.classList.add("hidden");
  });

  confirmBtn.addEventListener("click", async () => {
    const email = shareEmail.value.trim();
    if (!email) {
      alert("Please enter an email.");
      return;
    }

    // lookup user by email
    const lookup = await fetch(
      `/api/community/users?email=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!lookup.ok) {
      alert("Error looking up user.");
      return;
    }
    const users = await lookup.json();
    if (!Array.isArray(users) || users.length === 0) {
      alert("No user found with that email.");
      return;
    }
    const toUserId = users[0]._id;

    // post the share
    const shareRes = await fetch("/api/community/share", {
      method:  "POST",
      headers: {
        "Content-Type": `application/json`,
        Authorization:  `Bearer ${token}`
      },
      body: JSON.stringify({
        type:      shareContext.type,
        reference: shareContext.reference,
        caption:   shareCaption.value.trim() || null,
        toUser:    toUserId
      })
    });
    if (!shareRes.ok) {
      alert("Failed to share.");
      return;
    }

    shareModal.classList.add("hidden");
    await loadShares();  // refresh both lists
    alert("Shared successfully!");
  });


  //  FORUM THREADS
  async function loadThreads() {
    const res = await fetch("/api/community/threads", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const threads = res.ok ? await res.json() : [];
    threadList.innerHTML = "";
    threads.forEach(t => {
      const li = document.createElement("li");
      li.textContent = `${t.title} (by ${t.createdBy.name})`;
      li.dataset.id = t._id;
      li.addEventListener("click", () => loadPosts(t._id));
      threadList.appendChild(li);
    });    
  }

  newThreadForm?.addEventListener("submit", async e => {
    e.preventDefault();
    const title = e.target.threadTitle.value.trim();
    if (!title) return;
    await fetch("/api/community/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title })
    });
    e.target.reset();
    await loadThreads();
  });

 async function loadPosts(threadId) {
  const container = document.getElementById("postContainer");
  const replyArea = document.getElementById("threadInteractionArea");

  if (!container || !replyArea) return;

  // Toggle logic
  if (threadId === currentThreadId) {
    // Same thread clicked again — hide it
    replyArea.classList.add("hidden");
    currentThreadId = null;
    return;
  }

  const res = await fetch(`/api/community/threads/${threadId}/posts`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const posts = res.ok ? await res.json() : [];

  container.innerHTML = "";
  posts.forEach(p => {
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `<strong>${p.author.name}:</strong> ${p.content}`;
    container.appendChild(div);
  });

  replyArea.classList.remove("hidden");
  currentThreadId = threadId;
 }

    
  postForm?.addEventListener("submit", async e => {
    e.preventDefault();
    const content = postContentInput.value.trim();
    if (!content || !currentThreadId) return;
  
    const res = await fetch(`/api/community/threads/${currentThreadId}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });
  
    if (res.ok) {
      postContentInput.value = "";
      await loadPosts(currentThreadId);
    } else {
      alert("Failed to post.");
    }
  });
  
  
  // challenges
  async function loadChallenges() {
    const res = await fetch("/api/community/challenges", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      challengeList.innerText = "Failed to load challenges.";
      return;
    }
    const challenges = await res.json();
    challengeList.innerHTML = "";

    const userRes = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const me = await userRes.json();
    const userId = me._id;

    challenges.forEach(c => {
      const li = document.createElement("li");

      const isJoined = c.participants?.some(p => p._id === userId);
    
      const noteValue = c.userNotes?.[userId] || "";  
    
      li.innerHTML = `
        <div class="challenge-header">
          <strong>${c.name}</strong> by ${c.creator.name}
        </div>

        <button class="toggle-note-btn" data-id="${c._id}">📝 Note</button>

        <div class="note-area hidden" id="note-${c._id}">
          <textarea class="challenge-note" placeholder="Write your note..." data-id="${c._id}"></textarea>
          <button class="save-note-btn" data-id="${c._id}">💾 Save Note</button>
        </div>

        ${
          isJoined

          ? `<span class="joined-label">Joined</span>` 
          : `<button data-id="${c._id}" class="join-challenge">Join</button>`
        }
        <button data-id="${c._id}" class="save-note">💾 Save Note</button>
      `;
    
      challengeList.appendChild(li);
    });
    
    
    
    document.querySelectorAll(".join-challenge").forEach(btn => {
      btn.addEventListener("click", async () => {
        const challengeId = btn.dataset.id;
        const noteInput = document.querySelector(`.challenge-note[data-id="${challengeId}"]`);
        const note = noteInput?.value?.trim() || "";
    
        await fetch(`/api/community/challenges/${challengeId}/join`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ note })  
        });
    
        await loadChallenges(); 
      });
    });
    
  }

  newChForm?.addEventListener("submit", async e => {
    e.preventDefault();
    const name   = e.target.challengeName.value.trim();
    const endsAt = e.target.challengeEnds.value;
    const desc   = e.target.challengeDesc.value.trim();
    if (!name || !endsAt) return;
    await fetch("/api/community/challenges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, description: desc, endsAt })
    });
    e.target.reset();
    await loadChallenges();
  });

  document.querySelectorAll(".save-note").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const noteEl = document.querySelector(`.challenge-note-input[data-id="${id}"]`);
      const note = noteEl?.value.trim() || "";
  
      await fetch(`/api/community/challenges/${id}/note`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ note })
      });
  
      alert("Note saved!");
    });
  });
  

  closeSharedModalBtn.addEventListener("click", () => {
    sharedModal.classList.add("hidden");
  });

  const calendarDateParam = getQueryParam("date");
  if (calendarDateParam) {
    const targetDate = new Date(calendarDateParam);
    highlightCalendarDate(targetDate);
  }


  let currentShareType = null;
  let currentShareRef = null;

  function openShareModal({ type, refId }) {
    currentShareType = type;
    currentShareRef = refId;
    document.getElementById("shareModal").classList.remove("hidden");
  }

  window.openShareModal = openShareModal;

  loadShares();
  loadThreads();
  loadChallenges();
});

function highlightCalendarDate(date) {
  const formatted = date.toISOString().split("T")[0]; 

  const el = document.querySelector(`[data-session-date="${formatted}"]`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("highlight");
  } else {
    console.warn("No calendar session found for date:", formatted);
  }
}

