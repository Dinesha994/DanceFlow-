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

  // Challenges
  const challengeList = document.getElementById("challengeList");
  const newChForm     = document.getElementById("newChallengeForm");

  let myEmail      = "";
  let shareContext = null;


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
    container.innerHTML = shares.map(s => {
      // Decide if this entry is “mine” or “incoming”
      const isMine = s.from.email === myEmail;
      const other  = isMine
        ? `<strong>To:</strong>   ${s.to.name} `
        : `<strong>From:</strong> ${s.from.name} `;

      const captionHtml = s.caption
        ? `<p class="caption">“${s.caption}”</p>`
        : "";

      const when = new Date(s.createdAt).toLocaleString();

      return `
        <li>
          ${other}<br>
          <strong>Sequence:</strong> 
          <a href="#" class="shared-sequence-link" data-id="${typeof s.reference === 'object' ? s.reference._id : s.reference}">
          ${s.reference?.name || s.caption || "Unnamed"}
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
                link.href = `userdancedetails.html?id=${moveId}`;
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
      shareContext = {
        type:      e.target.dataset.type,
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
    const res = await fetch(`/api/community/threads/${threadId}/posts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const posts = res.ok ? await res.json() : [];
    const container = document.getElementById("postContainer");
    container.innerHTML = "";
    posts.forEach(p => {
      const div = document.createElement("div");
      div.className = "post";
      div.innerHTML = `<strong>${p.author.name}:</strong> ${p.content}`;
      container.appendChild(div);
    });
  }
  
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
    challenges.forEach(c => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${c.name} by ${c.creator.name}
        <button data-id="${c._id}" class="join-challenge">Join</button>
      `;
      challengeList.appendChild(li);
    });
    document.querySelectorAll(".join-challenge").forEach(btn =>
      btn.addEventListener("click", async () => {
        await fetch(`/api/community/challenges/${btn.dataset.id}/join`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        await loadChallenges();
      })
    );
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

  closeSharedModalBtn.addEventListener("click", () => {
    sharedModal.classList.add("hidden");
  });

  loadShares();
  loadThreads();
  loadChallenges();
});
