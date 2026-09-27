async function apiRequest(endpoint, options = {}) {
  const defaultHeaders = {
    "Accept": "application/json"
  };

  if (options.body && typeof options.body === "object") {
    defaultHeaders["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const res = await fetch(endpoint, config);
    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      data = { success: false, error: "Non-JSON response from server" };
    }

    if (!res.ok) {
      const errorMsg = data.error || (data.details ? data.details.join(", ") : `HTTP ${res.status}`);
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    throw err;
  }
}

function showToast(message, type = "info", duration = 3500) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

function handleApiError(err) {
  console.error("API Error:", err);
  showToast(err.message || "An unexpected error occurred", "error");
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }
  }
  return dateStr;
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
    const modalBody = modal.querySelector(".modal-body");
    if (modalBody) {
      modalBody.scrollTop = 0;
    }
    const firstInput = modal.querySelector("input:not([type=hidden]), select, textarea");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("show");
    const openModals = document.querySelectorAll(".modal-backdrop.show");
    if (openModals.length === 0) {
      document.body.style.overflow = "";
    }
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const openModal = document.querySelector(".modal-backdrop.show");
    if (openModal) {
      closeModal(openModal.id);
    }
  }
});

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-backdrop") && e.target.classList.contains("show")) {
    closeModal(e.target.id);
  }
});

function confirmAction(message, onConfirm) {
  if (window.confirm(message)) {
    onConfirm();
  }
}

function initGlobalSearch() {
  const searchInput = document.getElementById("global-search-input");
  const dropdown = document.getElementById("search-results-dropdown");
  if (!searchInput || !dropdown) return;

  let debounceTimer;

  searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    const q = e.target.value.trim();

    if (q.length < 2) {
      dropdown.classList.remove("show");
      dropdown.innerHTML = "";
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const res = await apiRequest(`/api/search?q=${encodeURIComponent(q)}`);
        const { records, visits, prescriptions, documents, totalMatches } = res.data;

        if (totalMatches === 0) {
          dropdown.innerHTML = `
            <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.84rem;">
              No records found matching "<strong>${escapeHtml(q)}</strong>"
            </div>
          `;
          dropdown.classList.add("show");
          return;
        }

        let html = "";

        if (records.length > 0) {
          html += `<div class="search-section-header">Medical Records (${records.length})</div>`;
          records.slice(0, 3).forEach(r => {
            html += `
              <div class="search-item" onclick="window.location.href='records.html?search=${encodeURIComponent(r.title)}'">
                <div class="search-item-info">
                  <h4>${escapeHtml(r.title)}</h4>
                  <p>${escapeHtml(r.doctor)} • ${escapeHtml(r.type)}</p>
                </div>
                <span class="card-badge badge-blue">Record</span>
              </div>
            `;
          });
        }

        if (visits.length > 0) {
          html += `<div class="search-section-header">Doctor Visits (${visits.length})</div>`;
          visits.slice(0, 3).forEach(v => {
            html += `
              <div class="search-item" onclick="window.location.href='visits.html?search=${encodeURIComponent(v.doctor)}'">
                <div class="search-item-info">
                  <h4>${escapeHtml(v.doctor)} (${escapeHtml(v.specialization)})</h4>
                  <p>${escapeHtml(v.hospital)} • ${formatDate(v.visitDate)}</p>
                </div>
                <span class="card-badge badge-teal">Visit</span>
              </div>
            `;
          });
        }

        if (prescriptions.length > 0) {
          html += `<div class="search-section-header">Prescriptions (${prescriptions.length})</div>`;
          prescriptions.slice(0, 3).forEach(p => {
            html += `
              <div class="search-item" onclick="window.location.href='prescriptions.html?search=${encodeURIComponent(p.medicine)}'">
                <div class="search-item-info">
                  <h4>${escapeHtml(p.medicine)}</h4>
                  <p>${escapeHtml(p.dosage)} • By ${escapeHtml(p.doctor)}</p>
                </div>
                <span class="card-badge badge-green">Rx</span>
              </div>
            `;
          });
        }

        if (documents.length > 0) {
          html += `<div class="search-section-header">Documents (${documents.length})</div>`;
          documents.slice(0, 3).forEach(d => {
            html += `
              <div class="search-item" onclick="window.location.href='documents.html?search=${encodeURIComponent(d.title)}'">
                <div class="search-item-info">
                  <h4>${escapeHtml(d.title)}</h4>
                  <p>${escapeHtml(d.type)} • ${formatDate(d.date)}</p>
                </div>
                <span class="card-badge badge-amber">Document</span>
              </div>
            `;
          });
        }

        dropdown.innerHTML = html;
        dropdown.classList.add("show");
      } catch (err) {
        console.error("Search failed:", err);
      }
    }, 250);
  });

  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });
}

function getInitials(name) {
  if (!name || typeof name !== "string") return "MC";
  const cleaned = name.replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?)\s+/i, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "MC";
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function loadUserProfileHeader() {
  try {
    const res = await apiRequest("/api/profile");
    if (res && res.data) {
      applyUserProfileHeader(res.data.name);
    }
  } catch (err) {
    console.error("Could not load user profile header:", err);
  }
}

function applyUserProfileHeader(name) {
  if (!name) return;
  const initials = getInitials(name);
  
  const nameEls = document.querySelectorAll(".user-name");
  nameEls.forEach(el => { el.innerText = name; });

  const avatarEls = document.querySelectorAll(".user-avatar");
  avatarEls.forEach(el => { el.innerText = initials; });

  const bigAvatar = document.getElementById("profile-avatar-big");
  if (bigAvatar) {
    bigAvatar.innerText = initials;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function initThemeToggle() {
  const saved = localStorage.getItem("medicloud-theme");
  if (saved === "dark") {
    document.body.classList.add("dark-mode");
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("medicloud-theme", isDark ? "dark" : "light");
  showToast(`Switched to ${isDark ? "Dark" : "Light"} mode`, "info", 1500);
}

async function exportHealthReportPDF() {
  try {
    showToast("Generating Clinical Health Report PDF...", "info", 1800);

    let exportData;
    try {
      const res = await apiRequest("/api/dashboard/export");
      exportData = res.data;
    } catch (e1) {
      try {
        const res2 = await apiRequest("/api/export");
        exportData = res2.data;
      } catch (e2) {
        const [profRes, recsRes, visitsRes, rxsRes, docsRes] = await Promise.all([
          apiRequest("/api/profile").catch(() => ({ data: {} })),
          apiRequest("/api/records").catch(() => ({ data: [] })),
          apiRequest("/api/visits").catch(() => ({ data: [] })),
          apiRequest("/api/prescriptions").catch(() => ({ data: [] })),
          apiRequest("/api/documents").catch(() => ({ data: [] }))
        ]);
        exportData = {
          exportedAt: new Date().toISOString(),
          application: "MediCloud Health Management",
          version: "1.0.0",
          profile: profRes.data || {},
          records: recsRes.data || [],
          visits: visitsRes.data || [],
          prescriptions: rxsRes.data || [],
          documents: docsRes.data || []
        };
      }
    }

    if (!exportData) {
      throw new Error("Unable to assemble medical report data");
    }

    const { profile = {}, records = [], visits = [], prescriptions = [], documents = [] } = exportData;
    const dateStr = new Date().toISOString().split("T")[0];
    const patientName = (profile.name || "Patient").replace(/\s+/g, "_");

    // Calculate live BMI
    let bmiText = "N/A";
    if (profile.height && profile.weight) {
      const hM = profile.height / 100;
      const bmi = (profile.weight / (hM * hM)).toFixed(1);
      let cat = "Normal Weight";
      if (bmi < 18.5) cat = "Underweight";
      else if (bmi >= 25 && bmi < 30) cat = "Overweight";
      else if (bmi >= 30) cat = "Obese";
      bmiText = `${bmi} (${cat})`;
    }

    const reportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MediCloud_Health_Report_${patientName}_${dateStr}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      padding: 30px;
      font-size: 13px;
      line-height: 1.5;
    }
    .action-toolbar {
      position: sticky;
      top: 10px;
      z-index: 1000;
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
      background: #ffffff;
      max-width: 920px;
      margin: 0 auto;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 18px;
      margin-bottom: 22px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .report-meta {
      text-align: right;
      font-size: 12px;
      color: #475569;
    }
    .patient-box {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 18px 20px;
      margin-bottom: 24px;
    }
    .patient-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      font-size: 12.5px;
    }
    .allergy-alert {
      background: #fee2e2;
      border-left: 4px solid #ef4444;
      color: #991b1b;
      padding: 8px 12px;
      border-radius: 4px;
      margin-top: 12px;
      font-size: 12px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 6px;
      margin: 24px 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 16px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border-bottom: 2px solid #cbd5e1;
      font-size: 11px;
      text-transform: uppercase;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
      vertical-align: top;
    }
    tr:nth-child(even) td { background-color: #f8fafc; }
    .pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .pill-green { background: #dcfce7; color: #15803d; }
    .pill-blue { background: #e0f2fe; color: #0369a1; }
    .pill-amber { background: #fef3c7; color: #b45309; }
    .footer-note {
      margin-top: 36px;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
    }

    @media print {
      body { background: #ffffff; padding: 0; font-size: 11pt; }
      .action-toolbar { display: none !important; }
      .report-sheet { border: none; box-shadow: none; padding: 0; max-width: 100%; }
      tr { page-break-inside: avoid; }
      .section-title { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <div class="action-toolbar">
    <div>
      <strong>MediCloud Patient Dossier</strong> &bull; Click 'Save as PDF' in the print dialog
    </div>
    <div>
      <button class="btn" onclick="window.print()">🖨️ Save as PDF / Print</button>
      <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="report-sheet">
    <div class="header-row">
      <div>
        <div class="brand-title">MediCloud Health Systems</div>
        <div class="brand-sub">Official Patient Health Dossier & Clinical Summary</div>
      </div>
      <div class="report-meta">
        <div><strong>Document ID:</strong> DOC-MED-${dateStr}</div>
        <div><strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        <div><strong>Architecture:</strong> Cloud-Ready REST Decoupled Tier</div>
      </div>
    </div>

    <div class="patient-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #bae6fd; padding-bottom: 8px;">
        <h2 style="font-size: 18px; color: #0369a1;">Patient: ${escapeHtml(profile.name || "Roshan Sharma")}</h2>
        <span class="pill pill-blue" style="font-size: 12px; padding: 4px 12px;">Blood Group: ${escapeHtml(profile.bloodGroup || "B+")}</span>
      </div>
      <div class="patient-grid">
        <div><strong>Date of Birth:</strong> ${formatDate(profile.dob)}</div>
        <div><strong>Gender:</strong> ${escapeHtml(profile.gender || "N/A")}</div>
        <div><strong>Contact Phone:</strong> ${escapeHtml(profile.phone || "N/A")}</div>
        <div><strong>Emergency Contact:</strong> ${escapeHtml(profile.emergencyContact || "N/A")}</div>
        <div><strong>Resting BP:</strong> ${escapeHtml(profile.bloodPressure || "120/80 mmHg")}</div>
        <div><strong>Height / Weight:</strong> ${profile.height ? profile.height + ' cm' : 'N/A'} / ${profile.weight ? profile.weight + ' kg' : 'N/A'}</div>
        <div><strong>Calculated BMI:</strong> ${bmiText}</div>
        <div><strong>Existing Conditions:</strong> ${escapeHtml(profile.existingConditions || "None")}</div>
      </div>
      ${profile.allergies ? `
        <div class="allergy-alert">
          <strong>⚠️ Known Critical Allergies:</strong> ${escapeHtml(profile.allergies)}
        </div>
      ` : ""}
    </div>

    <div class="section-title">1. Prescriptions & Medications (${prescriptions.length})</div>
    <table>
      <thead>
        <tr>
          <th>Medicine</th>
          <th>Dosage</th>
          <th>Frequency</th>
          <th>Duration</th>
          <th>Doctor</th>
          <th>Status</th>
          <th>Instructions</th>
        </tr>
      </thead>
      <tbody>
        ${prescriptions.map(p => `
          <tr>
            <td><strong>${escapeHtml(p.medicine)}</strong></td>
            <td>${escapeHtml(p.dosage)}</td>
            <td>${escapeHtml(p.frequency)}</td>
            <td>${escapeHtml(p.duration)}</td>
            <td>${escapeHtml(p.doctor)}</td>
            <td><span class="pill ${p.status === 'Completed' ? 'pill-blue' : 'pill-green'}">${escapeHtml(p.status || 'Active')}</span></td>
            <td>${escapeHtml(p.instructions || '-')}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="section-title">2. Clinical Consultations & Diagnostic Records (${records.length})</div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Record Title</th>
          <th>Category</th>
          <th>Clinician / Hospital</th>
          <th>Diagnosis / Findings</th>
          <th>Prescription & Notes</th>
        </tr>
      </thead>
      <tbody>
        ${records.map(r => `
          <tr>
            <td>${formatDate(r.date)}</td>
            <td><strong>${escapeHtml(r.title)}</strong></td>
            <td><span class="pill pill-blue">${escapeHtml(r.type)}</span></td>
            <td>${escapeHtml(r.doctor)}<br><small style="color: #64748b;">${escapeHtml(r.hospital)}</small></td>
            <td>${escapeHtml(r.diagnosis || '-')}</td>
            <td>${escapeHtml(r.prescription || r.notes || '-')}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="section-title">3. Physician Consultations & Follow-up Timeline (${visits.length})</div>
    <table>
      <thead>
        <tr>
          <th>Visit Date</th>
          <th>Physician</th>
          <th>Specialization</th>
          <th>Hospital / Clinic</th>
          <th>Reason for Consultation</th>
          <th>Scheduled Follow-up</th>
        </tr>
      </thead>
      <tbody>
        ${visits.map(v => `
          <tr>
            <td>${formatDate(v.visitDate)}</td>
            <td><strong>${escapeHtml(v.doctor)}</strong></td>
            <td>${escapeHtml(v.specialization)}</td>
            <td>${escapeHtml(v.hospital)}</td>
            <td>${escapeHtml(v.reason)}</td>
            <td><strong>${v.followUpDate ? formatDate(v.followUpDate) : 'None'}</strong></td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="section-title">4. Cataloged Diagnostic Scans & Documents (${documents.length})</div>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Document Title</th>
          <th>Category</th>
          <th>Reference ID</th>
          <th>Summary / Description</th>
        </tr>
      </thead>
      <tbody>
        ${documents.map(d => `
          <tr>
            <td>${formatDate(d.date)}</td>
            <td><strong>${escapeHtml(d.title)}</strong></td>
            <td><span class="pill pill-amber">${escapeHtml(d.type)}</span></td>
            <td><code>${escapeHtml(d.reference || d.id)}</code></td>
            <td>${escapeHtml(d.description || '-')}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="footer-note">
      <div>
        <strong>MediCloud Health Document Management</strong> &bull; Client-Server Electronic Medical Summary
      </div>
      <div>
        Page 1 of 1 &bull; Certified Confidential Record
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
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
    } else {
      // In-page fallback if popups are blocked
      let modal = document.getElementById("pdf-report-modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "pdf-report-modal";
        modal.className = "modal-backdrop";
        document.body.appendChild(modal);
      }
      modal.innerHTML = `
        <div class="modal" style="max-width: 860px; max-height: 90vh;">
          <div class="modal-header">
            <h3>Medical Health Report PDF Preview</h3>
            <button class="modal-close" onclick="closeModal('pdf-report-modal')">&times;</button>
          </div>
          <div class="modal-body" style="padding: 16px;">
            <iframe id="pdf-report-iframe" style="width: 100%; height: 60vh; border: 1px solid var(--border-color); border-radius: var(--radius-sm);"></iframe>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('pdf-report-modal')">Close</button>
            <button class="btn btn-primary" onclick="const iframe = document.getElementById('pdf-report-iframe'); iframe.contentWindow.focus(); iframe.contentWindow.print();">🖨️ Save as PDF / Print</button>
          </div>
        </div>
      `;
      const iframe = modal.querySelector("#pdf-report-iframe");
      iframe.srcdoc = reportHtml;
      openModal("pdf-report-modal");
    }

    showToast("PDF Print Dialog launched. Choose 'Save as PDF' to save your file.", "success", 4000);
  } catch (err) {
    handleApiError(err);
  }
}

// Backward-compatibility alias
async function exportHealthData() {
  return exportHealthReportPDF();
}

function openCloudArchitectureModal() {
  let modal = document.getElementById("architecture-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "architecture-modal";
    modal.className = "modal-backdrop";
    modal.innerHTML = `
      <div class="modal" style="max-width: 620px;">
        <div class="modal-header">
          <h3>Cloud Computing Architecture & Viva Guide</h3>
          <button class="modal-close" onclick="closeModal('architecture-modal')">&times;</button>
        </div>
        <div class="modal-body" style="font-size: 0.9rem; line-height: 1.6;">
          <div style="background: var(--medical-blue-light); padding: 14px 18px; border-radius: var(--radius-md); margin-bottom: 16px; border-left: 4px solid var(--medical-blue);">
            <strong style="color: var(--brand-navy);">Viva Defense Statement:</strong><br>
            <em>"MediCloud demonstrates a cloud-ready client-server architecture where a decoupled vanilla frontend communicates with a modular Node.js Express backend via stateless REST APIs and JSON serialization. It separates presentation from server-side computation and is engineered to be hosted across cloud environments without refactoring."</em>
          </div>
          <h4 style="margin-bottom: 8px; color: var(--brand-navy);">Architecture Pipeline:</h4>
          <div style="font-family: monospace; background: var(--bg-subtle); padding: 12px 16px; border-radius: var(--radius-md); margin-bottom: 16px; font-size: 0.82rem; border: 1px solid var(--border-color);">
            [Browser / Client UI]<br>
            &nbsp;&nbsp;&nbsp;&darr; (Stateless HTTP / JSON over Fetch API)<br>
            [Node.js + Express REST API Gateway]<br>
            &nbsp;&nbsp;&nbsp;&darr; (Router Modules & Data Layer Operations)<br>
            [Centralized In-Memory Application Store]<br>
            &nbsp;&nbsp;&nbsp;&darr; (Dynamic JSON Response Payload)<br>
            [Client-Side Real-Time Reactive DOM Rendering]
          </div>
          <h4 style="margin-bottom: 8px; color: var(--brand-navy);">Key Concepts Demonstrated:</h4>
          <ul style="padding-left: 20px; margin-bottom: 16px; color: var(--text-secondary);">
            <li><strong>Decoupled Tiers:</strong> Independent frontend & backend services.</li>
            <li><strong>Stateless HTTP:</strong> Every REST request carries complete context.</li>
            <li><strong>Portability:</strong> Zero local path dependencies; configured via <code>process.env.PORT</code>.</li>
            <li><strong>Pure Application Storage:</strong> In-memory data models (no database or cloud vendor lock-in).</li>
          </ul>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" onclick="closeModal('architecture-modal')">Close Guide</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  openModal("architecture-modal");
}

async function openEmergencyCardModal() {
  try {
    const res = await apiRequest("/api/dashboard");
    const profRes = await apiRequest("/api/profile");
    const user = profRes.data;
    const { activePrescriptions } = res.data;

    let modal = document.getElementById("emergency-card-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "emergency-card-modal";
      modal.className = "modal-backdrop";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal" style="max-width: 540px;">
        <div class="modal-header">
          <h3>Emergency Medical Health Card</h3>
          <button class="modal-close" onclick="closeModal('emergency-card-modal')">&times;</button>
        </div>
        <div class="modal-body" id="printable-emergency-card" style="padding: 24px;">
          <div style="border: 2px solid var(--medical-blue); border-radius: var(--radius-lg); padding: 20px; background: var(--bg-surface); box-shadow: 0 4px 12px rgba(2, 132, 199, 0.15);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--medical-blue); padding-bottom: 12px; margin-bottom: 16px;">
              <div>
                <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--brand-navy); margin: 0;">MediCloud Emergency ID</h2>
                <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Personal Medical Information</span>
              </div>
              <span class="card-badge badge-blue" style="font-size: 1.1rem; padding: 6px 14px;">${escapeHtml(user.bloodGroup)}</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; font-size: 0.86rem;">
              <div>
                <span style="color: var(--text-muted); font-size: 0.74rem; text-transform: uppercase; font-weight: 700;">Patient Name</span>
                <p style="font-weight: 700; color: var(--brand-navy); font-size: 1.05rem;">${escapeHtml(user.name)}</p>
              </div>
              <div>
                <span style="color: var(--text-muted); font-size: 0.74rem; text-transform: uppercase; font-weight: 700;">Date of Birth / Gender</span>
                <p style="font-weight: 600; color: var(--text-primary);">${formatDate(user.dob)} (${escapeHtml(user.gender)})</p>
              </div>
            </div>

            <div style="background: var(--status-rose-light); border-left: 4px solid var(--status-rose); padding: 10px 14px; border-radius: var(--radius-sm); margin-bottom: 14px;">
              <span style="font-size: 0.74rem; font-weight: 800; color: #be123c; text-transform: uppercase;">⚠️ Critical Known Allergies:</span>
              <p style="margin: 0; font-weight: 700; color: #9f1239; font-size: 0.92rem;">${escapeHtml(user.allergies || "None declared")}</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; font-size: 0.84rem;">
              <div>
                <span style="color: var(--text-muted); font-size: 0.74rem; text-transform: uppercase; font-weight: 700;">Existing Conditions</span>
                <p style="color: var(--text-primary); font-weight: 600;">${escapeHtml(user.existingConditions || "None")}</p>
              </div>
              <div>
                <span style="color: var(--text-muted); font-size: 0.74rem; text-transform: uppercase; font-weight: 700;">Emergency Contact</span>
                <p style="color: var(--text-primary); font-weight: 700;">${escapeHtml(user.emergencyContact || user.phone)}</p>
              </div>
            </div>

            ${activePrescriptions && activePrescriptions.length > 0 ? `
              <div style="border-top: 1px solid var(--border-color); padding-top: 10px; margin-top: 10px;">
                <span style="color: var(--text-muted); font-size: 0.74rem; text-transform: uppercase; font-weight: 700;">Active Daily Medications:</span>
                <ul style="padding-left: 18px; margin-top: 4px; font-size: 0.82rem; color: var(--text-secondary);">
                  ${activePrescriptions.map(p => `<li><strong>${escapeHtml(p.medicine)}</strong> (${escapeHtml(p.dosage)}) - ${escapeHtml(p.frequency)}</li>`).join("")}
                </ul>
              </div>
            ` : ""}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal('emergency-card-modal')">Close</button>
          <button type="button" class="btn btn-primary" onclick="printEmergencyCardPDF()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print Card (PDF)
          </button>
        </div>
      </div>
    `;

    openModal("emergency-card-modal");
  } catch (err) {
    handleApiError(err);
  }
}

async function printEmergencyCardPDF() {
  try {
    const res = await apiRequest("/api/dashboard");
    const profRes = await apiRequest("/api/profile");
    const user = profRes.data;
    const { activePrescriptions } = res.data;
    const dateStr = new Date().toISOString().split("T")[0];
    const patientName = (user.name || "Patient").replace(/\s+/g, "_");

    const cardHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MediCloud_Emergency_ID_${patientName}_${dateStr}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      padding: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .action-toolbar {
      width: 100%;
      max-width: 540px;
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

    .id-card-wrapper {
      width: 100%;
      max-width: 540px;
      background: #ffffff;
      border: 3px solid #dc2626;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 12px 30px rgba(0,0,0,0.12);
    }
    .id-header {
      background: linear-gradient(135deg, #b91c1c, #dc2626);
      color: #ffffff;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .id-header h1 {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .id-header p {
      font-size: 11px;
      color: #fecaca;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .blood-badge {
      background: #ffffff;
      color: #b91c1c;
      font-size: 18px;
      font-weight: 900;
      padding: 6px 14px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .id-body {
      padding: 22px 24px;
      font-size: 13px;
    }
    .patient-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 12px;
    }
    .patient-name {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
    }
    .patient-meta {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .info-label {
      font-size: 10.5px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
    }
    .info-value {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
    }
    .allergy-banner {
      background: #fee2e2;
      border-left: 5px solid #dc2626;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .allergy-banner strong {
      color: #991b1b;
      font-size: 11.5px;
      text-transform: uppercase;
      display: block;
      margin-bottom: 2px;
    }
    .allergy-banner p {
      color: #7f1d1d;
      font-size: 13px;
      font-weight: 700;
      margin: 0;
    }
    .medications-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 16px;
    }
    .medications-box strong {
      font-size: 11px;
      text-transform: uppercase;
      color: #475569;
      display: block;
      margin-bottom: 6px;
    }
    .med-list {
      padding-left: 18px;
      font-size: 12px;
      color: #1e293b;
    }
    .id-footer {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 10px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #64748b;
    }

    @media print {
      body { background: #ffffff; padding: 0; }
      .action-toolbar { display: none !important; }
      .id-card-wrapper {
        border: 2px solid #dc2626;
        box-shadow: none;
        page-break-inside: avoid;
        margin: 20px auto;
      }
    }
  </style>
</head>
<body>
  <div class="action-toolbar">
    <div><strong>Emergency Medical ID Card</strong> &bull; Print or Save as PDF</div>
    <div>
      <button class="btn" onclick="window.print()">🖨️ Save as PDF / Print</button>
      <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="id-card-wrapper">
    <div class="id-header">
      <div>
        <h1>🚑 Emergency Medical ID</h1>
        <p>Personal Health Identification & Triage Data</p>
      </div>
      <div class="blood-badge">${escapeHtml(user.bloodGroup || "B+")}</div>
    </div>

    <div class="id-body">
      <div class="patient-row">
        <div>
          <div class="patient-name">${escapeHtml(user.name || "Patient")}</div>
          <div class="patient-meta">DOB: ${formatDate(user.dob)} &bull; Gender: ${escapeHtml(user.gender || "N/A")}</div>
        </div>
      </div>

      <div class="allergy-banner">
        <strong>⚠️ Critical Medical Allergies:</strong>
        <p>${escapeHtml(user.allergies || "None Declared")}</p>
      </div>

      <div class="info-grid">
        <div>
          <div class="info-label">Primary Emergency Contact</div>
          <div class="info-value">${escapeHtml(user.emergencyContact || user.phone || "N/A")}</div>
        </div>
        <div>
          <div class="info-label">Patient Contact Phone</div>
          <div class="info-value">${escapeHtml(user.phone || "N/A")}</div>
        </div>
        <div>
          <div class="info-label">Existing Conditions</div>
          <div class="info-value">${escapeHtml(user.existingConditions || "None recorded")}</div>
        </div>
        <div>
          <div class="info-label">Baseline Blood Pressure</div>
          <div class="info-value">${escapeHtml(user.bloodPressure || "120/80 mmHg")}</div>
        </div>
      </div>

      ${activePrescriptions && activePrescriptions.length > 0 ? `
        <div class="medications-box">
          <strong>Active Daily Prescriptions:</strong>
          <ul class="med-list">
            ${activePrescriptions.map(p => `
              <li><strong>${escapeHtml(p.medicine)}</strong> (${escapeHtml(p.dosage)}) - ${escapeHtml(p.frequency)}</li>
            `).join("")}
          </ul>
        </div>
      ` : ""}
    </div>

    <div class="id-footer">
      <span>MediCloud Healthcare System</span>
      <span>Official Medical ID Card &bull; Keep In Wallet</span>
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
      printWin.document.write(cardHtml);
      printWin.document.close();
      printWin.focus();
    }
  } catch (err) {
    handleApiError(err);
  }
}

function setupNavigation() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll(".sidebar-nav .nav-link");
  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPath || (currentPath === "" && href === "index.html")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  const mobileBtn = document.getElementById("mobile-menu-btn");
  const sidebar = document.querySelector(".sidebar");
  if (mobileBtn && sidebar) {
    mobileBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  const cloudBadge = document.querySelector(".cloud-badge");
  if (cloudBadge) {
    cloudBadge.style.cursor = "pointer";
    cloudBadge.setAttribute("title", "Click to view Cloud Architecture & Viva Guide");
    cloudBadge.addEventListener("click", openCloudArchitectureModal);
  }

  initThemeToggle();
  initGlobalSearch();
  loadUserProfileHeader();
}

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
});
