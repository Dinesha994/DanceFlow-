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
  let myUserId = null;

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
    await loadShares();  
    alert("Shared successfully!");
  });


  //  FORUM THREADS
  async function loadThreads() {
    const res = await fetch("/api/community/threads", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const threads = res.ok ? await res.json() : [];
  
    const meRes = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const me = await meRes.json(); 
  
    threadList.innerHTML = "";
  
    threads.forEach(t => {
      const li = document.createElement("li");
      li.dataset.id = t._id;
  
      const titleSpan = document.createElement("span");
      titleSpan.textContent = `${t.title} (by ${t.createdBy.name})`;
      titleSpan.style.cursor = "pointer";
  
      titleSpan.addEventListener("click", () => loadPosts(t._id));
      li.appendChild(titleSpan);
  

      if (t.createdBy._id === me._id) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.className = "delete-btn";
        delBtn.dataset.type = "thread";
        delBtn.dataset.id = t._id;  
        delBtn.style.marginLeft = "1em";
        li.appendChild(delBtn);
      }
  
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
  
    if (threadId === currentThreadId) {
      replyArea.classList.add("hidden");
      currentThreadId = null;
      return;
    }

    const userRes = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const me = await userRes.json();
  
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
    myUserId = me._id;
  
    const template = document.getElementById("challengeTemplate");
  
    challenges.forEach(c => {
      const isJoined = Array.isArray(c.participants) &&
        c.participants.some(p =>
          (typeof p === "string" && p === myUserId) ||
          (typeof p === "object" && p._id === myUserId)
        );
  
      const clone = template.content.cloneNode(true);
      const li = clone.querySelector("li");
      li.dataset.id = c._id;
  
      clone.querySelector(".challenge-name").textContent = c.name;
      clone.querySelector(".challenge-creator").textContent = c.creator.name;

      // Add delete button if user is the creator
      if (c.creator._id === myUserId) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.className = "danger-btn delete-btn";
        delBtn.dataset.type = "challenge";
        delBtn.dataset.id = c._id;
        li.appendChild(delBtn);
      }

      // Handle join visibility
      const joinBtn = clone.querySelector(".join-challenge");
      const joinedLabel = clone.querySelector(".joined-label");
      const toggleComments = clone.querySelector(".toggle-comments-btn");
      const commentsSection = clone.querySelector(".comments-section");

      if (isJoined) {
        joinBtn.classList.add("hidden");
        joinedLabel.classList.remove("hidden");
        toggleComments.classList.remove("hidden");
        commentsSection.classList.add("hidden");
      } else {
        toggleComments.classList.add("hidden");
        commentsSection.classList.add("hidden");
        joinBtn.dataset.id = c._id;
      }

      const form = clone.querySelector(".challenge-comment-form");
      form.dataset.id = c._id;
  
      challengeList.appendChild(clone);
    });
  }
   

  if (newChForm) {
    newChForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = e.target.challengeName.value.trim();
      const endsAt = e.target.challengeEnds.value;
      const desc = e.target.challengeDesc.value.trim();
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
  }

challengeList.addEventListener("click", async (e) => {
  const challengeId = e.target.closest("li")?.dataset.id;

  if (e.target.matches(".join-challenge")) {
    await fetch(`/api/community/challenges/${challengeId}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    await loadChallenges();
  }

  if (e.target.matches(".toggle-comments-btn")) {
    const li = e.target.closest("li");
    const challengeId = li.dataset.id; 
    const section = li.querySelector(".comments-section");
    section.classList.toggle("hidden");

    const commentList = li.querySelector(".challenge-comments");
    commentList.innerHTML = "Loading...";

    const res = await fetch(`/api/community/challenges/${challengeId}/comments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const comments = await res.json();

    commentList.innerHTML = comments.map((c) => `
      <div class="comment" data-id="${challengeId}">
        <strong>${c.user || "Anonymous"}</strong>: ${c.content}
      </div>
    `).join("") || "<em>No comments yet.</em>";

  }

  // Handles comment posting
  if (e.target.closest(".challenge-comment-form")) {
    e.preventDefault();
    const form = e.target.closest("form");
    const challengeId = form.dataset.id; 
    const input = form.querySelector(".comment-input");
    const content = input.value.trim();
    if (!content || !challengeId) return;
  
    try {
      await fetch(`/api/community/challenges/${challengeId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
  
      input.value = "";
      
      form.closest("li").querySelector(".toggle-comments-btn").click();
      form.closest("li").querySelector(".toggle-comments-btn").click();
    } catch (err) {
      console.error("Failed to post comment:", err);
      alert("Could not post your comment.");
    }
  }
  
});


document.body.addEventListener("click", async (e) => {
  if (!e.target.matches(".delete-btn")) return;

  const type = e.target.dataset.type;
  const id = e.target.dataset.id;

  if (!type || !id) return;

  const confirmed = confirm("Are you sure you want to delete this?");
  if (!confirmed) return;

  let endpoint = "";
  if (type === "thread") {
    endpoint = `/api/community/threads/${id}`;
  } else if (type === "challenge") {
    endpoint = `/api/community/challenges/${id}`;
  } else {
    return; 
  }

  try {
    const res = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to delete");
      return;
    }

    if (type === "thread") await loadThreads();
    if (type === "challenge") await loadChallenges();

  } catch (err) {
    console.error("Delete failed:", err);
    alert("An error occurred while deleting.");
  }
});

  
  closeSharedModalBtn.addEventListener("click", () => {
    sharedModal.classList.add("hidden");
  });

  const calendarDateParam = getQueryParam("date");
  if (calendarDateParam) {
    const targetDate = new Date(calendarDateParam);
    highlightCalendarDate(targetDate);
  }

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

