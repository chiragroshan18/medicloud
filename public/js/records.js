let currentRecords = [];

async function loadRecords() {
  const typeFilter = document.getElementById("filter-type").value;
  const doctorFilter = document.getElementById("filter-doctor").value;
  const dateFilter = document.getElementById("filter-date").value;
  const sortFilter = document.getElementById("filter-sort").value;

  const params = new URLSearchParams();
  if (typeFilter && typeFilter !== "All") params.append("type", typeFilter);
  if (doctorFilter && doctorFilter.trim() !== "") params.append("doctor", doctorFilter.trim());
  if (dateFilter && dateFilter.trim() !== "") params.append("date", dateFilter.trim());
  if (sortFilter) params.append("sortBy", sortFilter);

  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get("search");
  if (searchParam) {
    params.append("search", searchParam);
    const searchInput = document.getElementById("search-input");
    if (searchInput) searchInput.value = searchParam;
  }

  try {
    const res = await apiRequest(`/api/records?${params.toString()}`);
    currentRecords = res.data;
    renderRecords(currentRecords);
  } catch (err) {
    handleApiError(err);
  }
}

function renderRecords(records) {
  const container = document.getElementById("records-container");
  if (!container) return;

  if (!records || records.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          </svg>
        </div>
        <h3>No Medical Records Found</h3>
        <p>No records matched your selected filters or search query.</p>
        <button class="btn btn-primary btn-sm" onclick="openAddRecordModal()">+ Add New Record</button>
      </div>
    `;
    return;
  }

  const badgeMap = {
    "Consultation": "badge-blue",
    "General Checkup": "badge-teal",
    "Lab Report": "badge-green",
    "Prescription": "badge-purple",
    "Vaccination": "badge-amber",
    "Other": "badge-blue"
  };

  container.innerHTML = records.map(r => `
    <div class="card">
      <div class="card-header">
        <div>
          <h3>${escapeHtml(r.title)}</h3>
          <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">ID: ${escapeHtml(r.id)}</span>
        </div>
        <span class="card-badge ${badgeMap[r.type] || 'badge-blue'}">${escapeHtml(r.type)}</span>
      </div>

      <div class="card-meta">
        <div class="card-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>${formatDate(r.date)}</span>
        </div>
        <div class="card-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span>${escapeHtml(r.doctor)}</span>
        </div>
        <div class="card-meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
          <span>${escapeHtml(r.hospital)}</span>
        </div>
      </div>

      <div class="card-body">
        ${r.diagnosis ? `<p><strong>Diagnosis:</strong> ${escapeHtml(r.diagnosis)}</p>` : ""}
        ${r.symptoms ? `<p><strong>Symptoms:</strong> ${escapeHtml(r.symptoms)}</p>` : ""}
        ${r.prescription ? `<p><strong>Prescription:</strong> ${escapeHtml(r.prescription)}</p>` : ""}
        ${r.notes ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 6px;"><em>Notes:</em> ${escapeHtml(r.notes)}</p>` : ""}
      </div>

      <div class="card-actions">
        <button class="btn btn-secondary btn-sm" onclick="openRecordDetailModal('${r.id}')">📄 View Report</button>
        <button class="btn btn-secondary btn-sm" onclick="openEditRecordModal('${r.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="handleDeleteRecord('${r.id}')">Delete</button>
      </div>
    </div>
  `).join("");
}

function openRecordDetailModal(id) {
  const r = currentRecords.find(item => item.id === id);
  if (!r) return;

  let modal = document.getElementById("record-detail-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "record-detail-modal";
    modal.className = "modal-backdrop";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal" style="max-width: 620px;">
      <div class="modal-header">
        <div>
          <h3 style="margin: 0; font-size: 1.18rem;">Clinical Record Summary</h3>
          <span style="font-size: 0.74rem; color: var(--text-muted); font-weight: 700;">Record ID: ${escapeHtml(r.id)}</span>
        </div>
        <button class="modal-close" onclick="closeModal('record-detail-modal')">&times;</button>
      </div>
      <div class="modal-body" style="padding: 26px;">
        <div style="border-bottom: 2px solid var(--border-color); padding-bottom: 16px; margin-bottom: 20px;">
          <span class="card-badge badge-blue" style="float: right;">${escapeHtml(r.type)}</span>
          <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--brand-navy); margin-bottom: 4px;">${escapeHtml(r.title)}</h2>
          <p style="font-size: 0.86rem; color: var(--text-secondary); margin: 0;">Date: <strong>${formatDate(r.date)}</strong></p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; background: var(--bg-subtle); padding: 14px 18px; border-radius: var(--radius-md);">
          <div>
            <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Attending Physician</span>
            <p style="font-weight: 700; color: var(--brand-navy); margin: 2px 0 0 0;">${escapeHtml(r.doctor)}</p>
          </div>
          <div>
            <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Clinical Facility</span>
            <p style="font-weight: 700; color: var(--brand-navy); margin: 2px 0 0 0;">${escapeHtml(r.hospital)}</p>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 0.88rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">Clinical Diagnosis & Findings</h4>
          <p style="font-size: 0.96rem; font-weight: 600; color: var(--brand-navy); background: var(--bg-surface); border: 1px solid var(--border-color); padding: 10px 14px; border-radius: var(--radius-sm); margin: 0;">
            ${escapeHtml(r.diagnosis || 'Routine evaluation with no active pathology.')}
          </p>
        </div>

        ${r.symptoms ? `
          <div style="margin-bottom: 16px;">
            <h4 style="font-size: 0.88rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">Presented Symptoms</h4>
            <p style="font-size: 0.9rem; color: var(--text-primary); margin: 0;">${escapeHtml(r.symptoms)}</p>
          </div>
        ` : ""}

        ${r.prescription ? `
          <div style="margin-bottom: 16px;">
            <h4 style="font-size: 0.88rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">Medication & Prescribed Regimen</h4>
            <div style="background: var(--teal-light); border-left: 4px solid var(--teal-accent); padding: 10px 14px; border-radius: var(--radius-sm);">
              <p style="font-size: 0.92rem; font-weight: 700; color: #115e59; margin: 0;">${escapeHtml(r.prescription)}</p>
            </div>
          </div>
        ` : ""}

        ${r.notes ? `
          <div style="margin-bottom: 16px;">
            <h4 style="font-size: 0.88rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">Doctor's Confidential Recommendations</h4>
            <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; margin: 0; font-style: italic;">
              "${escapeHtml(r.notes)}"
            </p>
          </div>
        ` : ""}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal('record-detail-modal')">Close</button>
        <button type="button" class="btn btn-secondary" onclick="printRecordDetailPDF('${r.id}')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Print Report (PDF)
        </button>
        <button type="button" class="btn btn-primary" onclick="closeModal('record-detail-modal'); openEditRecordModal('${r.id}')">Edit Record</button>
      </div>
    </div>
  `;

  openModal("record-detail-modal");
}

function printRecordDetailPDF(id) {
  const r = currentRecords.find(item => item.id === id);
  if (!r) return;

  const dateStr = new Date().toISOString().split("T")[0];
  const recordTitle = (r.title || "Clinical_Report").replace(/\s+/g, "_");

  const reportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MediCloud_Report_${r.id}_${recordTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      padding: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 13px;
      line-height: 1.5;
    }
    .action-toolbar {
      width: 100%;
      max-width: 720px;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
    }
    .action-toolbar .btn {
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      margin-left: 8px;
      transition: 0.2s;
    }
    .action-toolbar .btn:hover { background: #0369a1; }
    .action-toolbar .btn-secondary { background: #334155; }
    .action-toolbar .btn-secondary:hover { background: #475569; }

    .report-sheet {
      width: 100%;
      max-width: 720px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 36px 40px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
    }
    .meta-box {
      text-align: right;
      font-size: 12px;
      color: #475569;
    }
    .pill {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      background: #e0f2fe;
      color: #0369a1;
    }
    .title-banner {
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 1px solid #e2e8f0;
    }
    .title-banner h2 {
      font-size: 20px;
      font-weight: 800;
      color: #0369a1;
      margin-bottom: 4px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      background: #f8fafc;
      padding: 14px 18px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-bottom: 22px;
    }
    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
    }
    .info-value {
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
    }
    .section-block {
      margin-bottom: 20px;
    }
    .section-block h3 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
      font-weight: 800;
      margin-bottom: 6px;
    }
    .content-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 13.5px;
    }
    .rx-box {
      background: #f0fdfa;
      border-left: 4px solid #0d9488;
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 13.5px;
      font-weight: 700;
      color: #115e59;
    }
    .notes-box {
      background: #f8fafc;
      border-left: 4px solid #94a3b8;
      border-radius: 6px;
      padding: 12px 16px;
      font-style: italic;
      color: #334155;
    }
    .report-footer {
      margin-top: 36px;
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
    }

    @media print {
      body { background: #ffffff; padding: 0; }
      .action-toolbar { display: none !important; }
      .report-sheet {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="action-toolbar">
    <div><strong>Clinical Medical Report</strong> &bull; Print or Save as PDF</div>
    <div>
      <button class="btn" onclick="window.print()">🖨️ Save as PDF / Print</button>
      <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="report-sheet">
    <div class="header-row">
      <div>
        <div class="brand-title">MediCloud Health Systems</div>
        <div class="brand-sub">Official Clinical Record & Diagnostic Summary</div>
      </div>
      <div class="meta-box">
        <div><strong>Record ID:</strong> ${escapeHtml(r.id)}</div>
        <div><strong>Date:</strong> ${formatDate(r.date)}</div>
      </div>
    </div>

    <div class="title-banner">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2>${escapeHtml(r.title)}</h2>
        <span class="pill">${escapeHtml(r.type)}</span>
      </div>
    </div>

    <div class="info-grid">
      <div>
        <div class="info-label">Attending Physician</div>
        <div class="info-value">${escapeHtml(r.doctor)}</div>
      </div>
      <div>
        <div class="info-label">Clinical Facility / Hospital</div>
        <div class="info-value">${escapeHtml(r.hospital)}</div>
      </div>
    </div>

    <div class="section-block">
      <h3>Clinical Diagnosis & Medical Findings</h3>
      <div class="content-box">
        <strong>${escapeHtml(r.diagnosis || "Routine review with normal physiological indicators.")}</strong>
      </div>
    </div>

    ${r.symptoms ? `
      <div class="section-block">
        <h3>Reported Symptoms & Clinical Presentation</h3>
        <div class="content-box">
          ${escapeHtml(r.symptoms)}
        </div>
      </div>
    ` : ""}

    ${r.prescription ? `
      <div class="section-block">
        <h3>Prescribed Treatment & Medication Regimen</h3>
        <div class="rx-box">
          ${escapeHtml(r.prescription)}
        </div>
      </div>
    ` : ""}

    ${r.notes ? `
      <div class="section-block">
        <h3>Physician's Clinical Observations & Notes</h3>
        <div class="notes-box">
          "${escapeHtml(r.notes)}"
        </div>
      </div>
    ` : ""}

    <div class="report-footer">
      <div>MediCloud Health Document Management &bull; Verified Electronic Record</div>
      <div>Confidential Health Information</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  <\/script>
</body>
</html>
`;

  const printWin = window.open("", "_blank");
  if (printWin) {
    printWin.document.open();
    printWin.document.write(reportHtml);
    printWin.document.close();
    printWin.focus();
  }
}

function openAddRecordModal() {
  document.getElementById("record-modal-title").innerText = "Add Medical Record";
  document.getElementById("record-form").reset();
  document.getElementById("record-id").value = "";
  document.getElementById("record-date").value = new Date().toISOString().split("T")[0];
  openModal("record-modal");
}

function openEditRecordModal(id) {
  const record = currentRecords.find(r => r.id === id);
  if (!record) return;

  document.getElementById("record-modal-title").innerText = "Edit Medical Record";
  document.getElementById("record-id").value = record.id;
  document.getElementById("record-title").value = record.title;
  document.getElementById("record-type").value = record.type;
  document.getElementById("record-date").value = record.date;
  document.getElementById("record-doctor").value = record.doctor;
  document.getElementById("record-hospital").value = record.hospital;
  document.getElementById("record-diagnosis").value = record.diagnosis || "";
  document.getElementById("record-symptoms").value = record.symptoms || "";
  document.getElementById("record-prescription").value = record.prescription || "";
  document.getElementById("record-notes").value = record.notes || "";

  openModal("record-modal");
}

async function handleRecordSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("record-id").value;
  const payload = {
    title: document.getElementById("record-title").value.trim(),
    type: document.getElementById("record-type").value,
    date: document.getElementById("record-date").value,
    doctor: document.getElementById("record-doctor").value.trim(),
    hospital: document.getElementById("record-hospital").value.trim(),
    diagnosis: document.getElementById("record-diagnosis").value.trim(),
    symptoms: document.getElementById("record-symptoms").value.trim(),
    prescription: document.getElementById("record-prescription").value.trim(),
    notes: document.getElementById("record-notes").value.trim()
  };

  try {
    if (id) {
      await apiRequest(`/api/records/${id}`, {
        method: "PATCH",
        body: payload
      });
      showToast("Medical record updated successfully", "success");
    } else {
      await apiRequest("/api/records", {
        method: "POST",
        body: payload
      });
      showToast("Medical record added successfully", "success");
    }

    closeModal("record-modal");
    loadRecords();
  } catch (err) {
    handleApiError(err);
  }
}

function handleDeleteRecord(id) {
  confirmAction("Are you sure you want to delete this medical record?", async () => {
    try {
      await apiRequest(`/api/records/${id}`, { method: "DELETE" });
      showToast("Medical record deleted", "success");
      loadRecords();
    } catch (err) {
      handleApiError(err);
    }
  });
}

function resetFilters() {
  document.getElementById("filter-type").value = "All";
  document.getElementById("filter-doctor").value = "";
  document.getElementById("filter-date").value = "";
  document.getElementById("filter-sort").value = "newest";
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
  window.history.replaceState({}, document.title, window.location.pathname);
  loadRecords();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("filter-type").addEventListener("change", loadRecords);
  document.getElementById("filter-doctor").addEventListener("input", () => {
    clearTimeout(window.doctorFilterTimeout);
    window.doctorFilterTimeout = setTimeout(loadRecords, 300);
  });
  document.getElementById("filter-date").addEventListener("change", loadRecords);
  document.getElementById("filter-sort").addEventListener("change", loadRecords);

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = currentRecords.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.doctor.toLowerCase().includes(q) ||
        r.hospital.toLowerCase().includes(q) ||
        (r.diagnosis && r.diagnosis.toLowerCase().includes(q))
      );
      renderRecords(filtered);
    });
  }

  document.getElementById("record-form").addEventListener("submit", handleRecordSubmit);
  loadRecords();
});
