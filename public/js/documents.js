let currentDocuments = [];

async function loadDocuments() {
  const typeFilter = document.getElementById("filter-type").value;
  const sortBy = document.getElementById("filter-sort").value;

  const params = new URLSearchParams();
  if (typeFilter && typeFilter !== "All") params.append("type", typeFilter);
  if (sortBy) params.append("sortBy", sortBy);

  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get("search");
  if (searchParam) {
    params.append("search", searchParam);
    const searchInput = document.getElementById("search-input");
    if (searchInput) searchInput.value = searchParam;
  }

  try {
    const res = await apiRequest(`/api/documents?${params.toString()}`);
    currentDocuments = res.data;
    renderDocuments(currentDocuments);
  } catch (err) {
    handleApiError(err);
  }
}

function renderDocuments(documents) {
  const container = document.getElementById("documents-container");
  if (!container) return;

  if (!documents || documents.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
        </div>
        <h3>No Health Documents Found</h3>
        <p>No document metadata matches your query.</p>
        <button class="btn btn-primary btn-sm" onclick="openAddDocumentModal()">+ Catalog Document</button>
      </div>
    `;
    return;
  }

  const badgeMap = {
    "Prescription": "badge-blue",
    "Lab Report": "badge-teal",
    "Medical Certificate": "badge-green",
    "Scan/Report": "badge-purple",
    "Other": "badge-amber"
  };

  container.innerHTML = documents.map(d => `
    <div class="card">
      <div class="card-header">
        <div>
          <h3 style="font-size: 1.05rem;">${escapeHtml(d.title)}</h3>
          <span style="font-size: 0.76rem; color: var(--text-muted); font-weight: 600;">Doc ID: ${escapeHtml(d.id)}</span>
        </div>
        <span class="card-badge ${badgeMap[d.type] || 'badge-blue'}">${escapeHtml(d.type)}</span>
      </div>

      <div class="card-meta">
        <div class="card-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>Date: <strong>${formatDate(d.date)}</strong></span>
        </div>
        ${d.reference ? `
          <div class="card-meta-item" style="color: var(--medical-blue);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            <span>Reference / Link: <strong>${escapeHtml(d.reference)}</strong></span>
          </div>
        ` : ""}
      </div>

      <div class="card-body">
        <p>${escapeHtml(d.description || 'No additional summary provided.')}</p>
      </div>

      <div class="card-actions">
        <button class="btn btn-secondary btn-sm" onclick="openEditDocumentModal('${d.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="handleDeleteDocument('${d.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

function openAddDocumentModal() {
  document.getElementById("doc-modal-title").innerText = "Catalog Health Document";
  document.getElementById("doc-form").reset();
  document.getElementById("doc-id").value = "";
  document.getElementById("doc-date").value = new Date().toISOString().split("T")[0];
  openModal("doc-modal");
}

function openEditDocumentModal(id) {
  const doc = currentDocuments.find(item => item.id === id);
  if (!doc) return;

  document.getElementById("doc-modal-title").innerText = "Edit Document Information";
  document.getElementById("doc-id").value = doc.id;
  document.getElementById("doc-title").value = doc.title;
  document.getElementById("doc-type").value = doc.type;
  document.getElementById("doc-date").value = doc.date;
  document.getElementById("doc-reference").value = doc.reference || "";
  document.getElementById("doc-description").value = doc.description || "";

  openModal("doc-modal");
}

async function handleDocumentSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("doc-id").value;
  const payload = {
    title: document.getElementById("doc-title").value.trim(),
    type: document.getElementById("doc-type").value,
    date: document.getElementById("doc-date").value,
    reference: document.getElementById("doc-reference").value.trim(),
    description: document.getElementById("doc-description").value.trim()
  };

  try {
    if (id) {
      await apiRequest(`/api/documents/${id}`, {
        method: "PATCH",
        body: payload
      });
      showToast("Document info updated successfully", "success");
    } else {
      await apiRequest("/api/documents", {
        method: "POST",
        body: payload
      });
      showToast("Document info recorded successfully", "success");
    }

    closeModal("doc-modal");
    loadDocuments();
  } catch (err) {
    handleApiError(err);
  }
}

function handleDeleteDocument(id) {
  confirmAction("Are you sure you want to delete this health document record?", async () => {
    try {
      await apiRequest(`/api/documents/${id}`, { method: "DELETE" });
      showToast("Document record deleted", "success");
      loadDocuments();
    } catch (err) {
      handleApiError(err);
    }
  });
}

function resetDocFilters() {
  document.getElementById("filter-type").value = "All";
  document.getElementById("filter-sort").value = "newest";
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
  window.history.replaceState({}, document.title, window.location.pathname);
  loadDocuments();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("filter-type").addEventListener("change", loadDocuments);
  document.getElementById("filter-sort").addEventListener("change", loadDocuments);

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = currentDocuments.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        (d.reference && d.reference.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q))
      );
      renderDocuments(filtered);
    });
  }

  document.getElementById("doc-form").addEventListener("submit", handleDocumentSubmit);
  loadDocuments();
});
