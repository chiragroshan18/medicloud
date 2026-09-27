let currentPrescriptions = [];

async function loadPrescriptions() {
  const medicine = document.getElementById("filter-medicine").value;
  const doctor = document.getElementById("filter-doctor").value;
  const sortBy = document.getElementById("filter-sort").value;
  const statusEl = document.getElementById("filter-status");
  const status = statusEl ? statusEl.value : "All";

  const params = new URLSearchParams();
  if (medicine && medicine.trim() !== "") params.append("medicine", medicine.trim());
  if (doctor && doctor.trim() !== "") params.append("doctor", doctor.trim());
  if (status && status !== "All") params.append("status", status);
  if (sortBy) params.append("sortBy", sortBy);

  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get("search");
  if (searchParam) {
    params.append("search", searchParam);
    const searchInput = document.getElementById("search-input");
    if (searchInput) searchInput.value = searchParam;
  }

  try {
    const res = await apiRequest(`/api/prescriptions?${params.toString()}`);
    currentPrescriptions = res.data;
    renderPrescriptions(currentPrescriptions);
  } catch (err) {
    handleApiError(err);
  }
}

function renderPrescriptions(prescriptions) {
  const container = document.getElementById("prescriptions-container");
  if (!container) return;

  if (!prescriptions || prescriptions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
          </svg>
        </div>
        <h3>No Prescriptions Found</h3>
        <p>No prescription entries matched your query.</p>
        <button class="btn btn-primary btn-sm" onclick="openAddPrescriptionModal()">+ Add Prescription</button>
      </div>
    `;
    return;
  }

  container.innerHTML = prescriptions.map(p => {
    const isCompleted = p.status === "Completed";
    const statusBadge = isCompleted ? '<span class="card-badge badge-blue">Completed Course</span>' : '<span class="card-badge badge-green">Active Regimen</span>';

    return `
      <div class="card" style="border-top: 4px solid ${isCompleted ? 'var(--medical-blue)' : 'var(--status-green)'}; opacity: ${isCompleted ? '0.88' : '1'};">
        <div class="card-header">
          <div style="flex: 1 1 180px; min-width: 0;">
            <h3 style="color: var(--brand-navy); font-size: 1.12rem; margin-bottom: 2px;">${escapeHtml(p.medicine)}</h3>
            <span style="font-size: 0.74rem; color: var(--text-muted); font-weight: 700;">Rx ID: ${escapeHtml(p.id)}</span>
          </div>
          <div style="flex-shrink: 0;">
            ${statusBadge}
          </div>
        </div>

        <div class="card-meta">
          <div class="card-meta-item">
            <span class="dosage-tag">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
              Dosage: <strong>${escapeHtml(p.dosage)}</strong>
            </span>
          </div>
          <div class="card-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span><strong>Frequency:</strong> ${escapeHtml(p.frequency)}</span>
          </div>
          <div class="card-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span><strong>Duration:</strong> ${escapeHtml(p.duration)} (Started ${formatDate(p.date)})</span>
          </div>
          <div class="card-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>Prescribing Physician: <strong>${escapeHtml(p.doctor)}</strong></span>
          </div>
        </div>

        <div class="card-body">
          ${p.instructions ? `
            <div style="background-color: var(--bg-subtle); padding: 10px 14px; border-radius: var(--radius-sm); border-left: 3px solid var(--medical-blue);">
              <p style="margin: 0; font-size: 0.84rem;"><strong>Instructions:</strong> ${escapeHtml(p.instructions)}</p>
            </div>
          ` : ""}
        </div>

        <div class="card-actions">
          <button class="btn btn-secondary btn-sm" onclick="handleToggleRx('${p.id}')">
            ${isCompleted ? '↩ Re-activate' : '✓ Mark Completed'}
          </button>
          <button class="btn btn-secondary btn-sm" onclick="openEditPrescriptionModal('${p.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="handleDeletePrescription('${p.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join("");
}

async function handleToggleRx(id) {
  try {
    const res = await apiRequest(`/api/prescriptions/${id}/toggle`, { method: "PATCH" });
    showToast(res.message || "Prescription status updated", "success");
    loadPrescriptions();
  } catch (err) {
    handleApiError(err);
  }
}

function openAddPrescriptionModal() {
  document.getElementById("rx-modal-title").innerText = "Add Prescription";
  document.getElementById("rx-form").reset();
  document.getElementById("rx-id").value = "";
  document.getElementById("rx-status").value = "Active";
  document.getElementById("rx-date").value = new Date().toISOString().split("T")[0];
  openModal("rx-modal");
}

function openEditPrescriptionModal(id) {
  const p = currentPrescriptions.find(item => item.id === id);
  if (!p) return;

  document.getElementById("rx-modal-title").innerText = "Edit Prescription";
  document.getElementById("rx-id").value = p.id;
  document.getElementById("rx-medicine").value = p.medicine;
  document.getElementById("rx-dosage").value = p.dosage;
  document.getElementById("rx-frequency").value = p.frequency;
  document.getElementById("rx-duration").value = p.duration;
  document.getElementById("rx-doctor").value = p.doctor;
  document.getElementById("rx-date").value = p.date;
  document.getElementById("rx-status").value = p.status || "Active";
  document.getElementById("rx-instructions").value = p.instructions || "";

  openModal("rx-modal");
}

async function handlePrescriptionSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("rx-id").value;
  const payload = {
    medicine: document.getElementById("rx-medicine").value.trim(),
    dosage: document.getElementById("rx-dosage").value.trim(),
    frequency: document.getElementById("rx-frequency").value.trim(),
    duration: document.getElementById("rx-duration").value.trim(),
    doctor: document.getElementById("rx-doctor").value.trim(),
    date: document.getElementById("rx-date").value,
    status: document.getElementById("rx-status").value,
    instructions: document.getElementById("rx-instructions").value.trim()
  };

  try {
    if (id) {
      await apiRequest(`/api/prescriptions/${id}`, {
        method: "PATCH",
        body: payload
      });
      showToast("Prescription updated successfully", "success");
    } else {
      await apiRequest("/api/prescriptions", {
        method: "POST",
        body: payload
      });
      showToast("Prescription added successfully", "success");
    }

    closeModal("rx-modal");
    loadPrescriptions();
  } catch (err) {
    handleApiError(err);
  }
}

function handleDeletePrescription(id) {
  confirmAction("Are you sure you want to delete this prescription?", async () => {
    try {
      await apiRequest(`/api/prescriptions/${id}`, { method: "DELETE" });
      showToast("Prescription deleted", "success");
      loadPrescriptions();
    } catch (err) {
      handleApiError(err);
    }
  });
}

function resetRxFilters() {
  document.getElementById("filter-medicine").value = "";
  document.getElementById("filter-doctor").value = "";
  const statusEl = document.getElementById("filter-status");
  if (statusEl) statusEl.value = "All";
  document.getElementById("filter-sort").value = "newest";
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
  window.history.replaceState({}, document.title, window.location.pathname);
  loadPrescriptions();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("filter-medicine").addEventListener("input", () => {
    clearTimeout(window.rxMedTimeout);
    window.rxMedTimeout = setTimeout(loadPrescriptions, 300);
  });
  document.getElementById("filter-doctor").addEventListener("input", () => {
    clearTimeout(window.rxDocTimeout);
    window.rxDocTimeout = setTimeout(loadPrescriptions, 300);
  });
  const statusEl = document.getElementById("filter-status");
  if (statusEl) {
    statusEl.addEventListener("change", loadPrescriptions);
  }
  document.getElementById("filter-sort").addEventListener("change", loadPrescriptions);

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = currentPrescriptions.filter(p =>
        p.medicine.toLowerCase().includes(q) ||
        p.doctor.toLowerCase().includes(q) ||
        p.dosage.toLowerCase().includes(q) ||
        p.instructions.toLowerCase().includes(q)
      );
      renderPrescriptions(filtered);
    });
  }

  document.getElementById("rx-form").addEventListener("submit", handlePrescriptionSubmit);
  loadPrescriptions();
});
