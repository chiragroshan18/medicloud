let currentVisits = [];

async function loadVisits() {
  const specialization = document.getElementById("filter-specialization").value;
  const doctor = document.getElementById("filter-doctor").value;
  const sortBy = document.getElementById("filter-sort").value;

  const params = new URLSearchParams();
  if (specialization && specialization !== "All") params.append("specialization", specialization);
  if (doctor && doctor.trim() !== "") params.append("doctor", doctor.trim());
  if (sortBy) params.append("sortBy", sortBy);

  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get("search");
  if (searchParam) {
    params.append("search", searchParam);
    const searchInput = document.getElementById("search-input");
    if (searchInput) searchInput.value = searchParam;
  }

  try {
    const res = await apiRequest(`/api/visits?${params.toString()}`);
    currentVisits = res.data;
    renderVisits(currentVisits);
  } catch (err) {
    handleApiError(err);
  }
}

function renderVisits(visits) {
  const container = document.getElementById("visits-container");
  if (!container) return;

  if (!visits || visits.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
          </svg>
        </div>
        <h3>No Doctor Visits Found</h3>
        <p>No visits matched your filter criteria.</p>
        <button class="btn btn-primary btn-sm" onclick="openAddVisitModal()">+ Log New Visit</button>
      </div>
    `;
    return;
  }

  container.innerHTML = visits.map(v => `
    <div class="card" style="border-left: 4px solid var(--teal-accent);">
      <div class="card-header">
        <div>
          <h3>${escapeHtml(v.doctor)}</h3>
          <span style="font-size: 0.76rem; font-weight: 600; color: var(--teal-accent);">${escapeHtml(v.specialization)}</span>
        </div>
        <span class="card-badge badge-teal">${formatDate(v.visitDate)}</span>
      </div>

      <div class="card-meta">
        <div class="card-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
          <span>${escapeHtml(v.hospital)}</span>
        </div>
        ${v.followUpDate ? `
          <div class="card-meta-item" style="color: var(--medical-blue); font-weight: 500;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>Next Follow-up: <strong>${formatDate(v.followUpDate)}</strong></span>
          </div>
        ` : ""}
      </div>

      <div class="card-body">
        <p><strong>Reason for Visit:</strong> ${escapeHtml(v.reason)}</p>
        ${v.notes ? `<p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 6px;"><em>Notes:</em> ${escapeHtml(v.notes)}</p>` : ""}
      </div>

      <div class="card-actions">
        <button class="btn btn-secondary btn-sm" onclick="openEditVisitModal('${v.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="handleDeleteVisit('${v.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

function openAddVisitModal() {
  document.getElementById("visit-modal-title").innerText = "Log Doctor Visit";
  document.getElementById("visit-form").reset();
  document.getElementById("visit-id").value = "";
  document.getElementById("visit-date").value = new Date().toISOString().split("T")[0];
  openModal("visit-modal");
}

function openEditVisitModal(id) {
  const visit = currentVisits.find(v => v.id === id);
  if (!visit) return;

  document.getElementById("visit-modal-title").innerText = "Edit Doctor Visit";
  document.getElementById("visit-id").value = visit.id;
  document.getElementById("visit-doctor").value = visit.doctor;
  document.getElementById("visit-specialization").value = visit.specialization;
  document.getElementById("visit-hospital").value = visit.hospital;
  document.getElementById("visit-date").value = visit.visitDate;
  document.getElementById("visit-reason").value = visit.reason;
  document.getElementById("visit-notes").value = visit.notes || "";
  document.getElementById("visit-followup").value = visit.followUpDate || "";

  openModal("visit-modal");
}

async function handleVisitSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("visit-id").value;
  const payload = {
    doctor: document.getElementById("visit-doctor").value.trim(),
    specialization: document.getElementById("visit-specialization").value.trim(),
    hospital: document.getElementById("visit-hospital").value.trim(),
    visitDate: document.getElementById("visit-date").value,
    reason: document.getElementById("visit-reason").value.trim(),
    notes: document.getElementById("visit-notes").value.trim(),
    followUpDate: document.getElementById("visit-followup").value
  };

  try {
    if (id) {
      await apiRequest(`/api/visits/${id}`, {
        method: "PATCH",
        body: payload
      });
      showToast("Visit updated successfully", "success");
    } else {
      await apiRequest("/api/visits", {
        method: "POST",
        body: payload
      });
      showToast("Visit logged successfully", "success");
    }

    closeModal("visit-modal");
    loadVisits();
  } catch (err) {
    handleApiError(err);
  }
}

function handleDeleteVisit(id) {
  confirmAction("Are you sure you want to delete this doctor visit record?", async () => {
    try {
      await apiRequest(`/api/visits/${id}`, { method: "DELETE" });
      showToast("Doctor visit deleted", "success");
      loadVisits();
    } catch (err) {
      handleApiError(err);
    }
  });
}

function resetVisitFilters() {
  document.getElementById("filter-specialization").value = "All";
  document.getElementById("filter-doctor").value = "";
  document.getElementById("filter-sort").value = "newest";
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
  window.history.replaceState({}, document.title, window.location.pathname);
  loadVisits();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("filter-specialization").addEventListener("change", loadVisits);
  document.getElementById("filter-doctor").addEventListener("input", () => {
    clearTimeout(window.visitFilterTimeout);
    window.visitFilterTimeout = setTimeout(loadVisits, 300);
  });
  document.getElementById("filter-sort").addEventListener("change", loadVisits);

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = currentVisits.filter(v =>
        v.doctor.toLowerCase().includes(q) ||
        v.specialization.toLowerCase().includes(q) ||
        v.hospital.toLowerCase().includes(q) ||
        v.reason.toLowerCase().includes(q)
      );
      renderVisits(filtered);
    });
  }

  document.getElementById("visit-form").addEventListener("submit", handleVisitSubmit);
  loadVisits();
});
