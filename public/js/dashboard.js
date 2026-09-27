async function loadDashboard() {
  try {
    const res = await apiRequest("/api/dashboard");
    const { counts, recentActivity, upcomingVisits, recentRecords, activePrescriptions, patientVitals } = res.data;

    document.getElementById("stat-records").innerText = counts.totalRecords;
    document.getElementById("stat-visits").innerText = counts.totalVisits;
    document.getElementById("stat-prescriptions").innerText = counts.totalPrescriptions;
    document.getElementById("stat-documents").innerText = counts.totalDocuments;

    if (patientVitals) {
      renderPatientVitals(patientVitals);
    }

    renderRecentActivity(recentActivity);
    renderUpcomingVisits(upcomingVisits);
    renderRecentRecords(recentRecords);
    renderActivePrescriptions(activePrescriptions);
  } catch (err) {
    handleApiError(err);
  }
}

function renderPatientVitals(vitals) {
  const container = document.getElementById("vitals-banner-container");
  if (!container) return;

  const bmiClass = vitals.bmiCategory === "Normal Weight" ? "badge-green" : (vitals.bmiCategory === "Underweight" || vitals.bmiCategory === "Overweight" ? "badge-amber" : "badge-blue");

  container.innerHTML = `
    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 18px 24px; margin-bottom: 24px; box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
      <div style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">
        <div>
          <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Blood Group</span>
          <p style="font-size: 1.2rem; font-weight: 800; color: var(--brand-navy); margin: 0;">${escapeHtml(vitals.bloodGroup)}</p>
        </div>
        <div style="border-left: 1px solid var(--border-color); padding-left: 20px;">
          <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Calculated BMI</span>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 2px;">
            <p style="font-size: 1.2rem; font-weight: 800; color: var(--brand-navy); margin: 0;">${escapeHtml(vitals.bmi)}</p>
            <span class="card-badge ${bmiClass}">${escapeHtml(vitals.bmiCategory)}</span>
          </div>
        </div>
        <div style="border-left: 1px solid var(--border-color); padding-left: 20px;">
          <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Baseline Blood Pressure</span>
          <p style="font-size: 1.05rem; font-weight: 700; color: var(--brand-navy); margin: 0;">${escapeHtml(vitals.bloodPressure)} mmHg</p>
        </div>
        <div style="border-left: 1px solid var(--border-color); padding-left: 20px;">
          <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Allergies Alert</span>
          <p style="font-size: 0.88rem; font-weight: 700; color: var(--status-rose); margin: 0;">⚠️ ${escapeHtml(vitals.allergies)}</p>
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-secondary btn-sm" onclick="openEmergencyCardModal()" title="View printable Emergency ID card">
          🪪 Emergency ID Card
        </button>
      </div>
    </div>
  `;
}

async function handleClearAllData() {
  confirmAction("Are you sure you want to clear all data to 0? This lets you test a completely empty state.", async () => {
    try {
      const res = await apiRequest("/api/dashboard/clear", { method: "POST" });
      showToast(res.message || "All records cleared to 0", "info");
      loadDashboard();
    } catch (err) {
      handleApiError(err);
    }
  });
}

async function handleResetSampleData() {
  confirmAction("Restore realistic sample data for demo?", async () => {
    try {
      const res = await apiRequest("/api/dashboard/reset", { method: "POST" });
      showToast(res.message || "Sample medical data restored", "success");
      loadDashboard();
    } catch (err) {
      handleApiError(err);
    }
  });
}

function renderRecentActivity(activities) {
  const container = document.getElementById("recent-activity-container");
  if (!container) return;

  if (!activities || activities.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No recent activity recorded yet.</p>
      </div>
    `;
    return;
  }

  const badgeClass = {
    "Medical Record": "badge-blue",
    "Doctor Visit": "badge-teal",
    "Prescription": "badge-green",
    "Health Document": "badge-amber"
  };

  container.innerHTML = activities.map(act => `
    <div class="activity-item">
      <div class="activity-bullet">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
      <div class="activity-content">
        <div class="activity-title">
          <span>${escapeHtml(act.title)}</span>
          <span class="activity-time">${formatDate(act.date)}</span>
        </div>
        <div class="activity-subtitle">${escapeHtml(act.subtitle)}</div>
        <div style="margin-top: 6px;">
          <span class="card-badge ${badgeClass[act.module] || 'badge-blue'}">${escapeHtml(act.module)}</span>
        </div>
      </div>
    </div>
  `).join("");
}

function renderUpcomingVisits(visits) {
  const container = document.getElementById("upcoming-visits-container");
  if (!container) return;

  if (!visits || visits.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px;">
        <p>No upcoming follow-up visits scheduled.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = visits.map(v => `
    <div style="padding: 14px 16px; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 12px; background-color: var(--bg-surface); transition: var(--transition-fast);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h4 style="font-size: 0.94rem; font-weight: 700; color: var(--brand-navy);">${escapeHtml(v.doctor)}</h4>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">${escapeHtml(v.specialization)} • ${escapeHtml(v.hospital)}</p>
        </div>
        <div style="text-align: right;">
          <span class="card-badge ${v.isOverdue ? 'badge-amber' : 'badge-teal'}">${escapeHtml(v.countdown || formatDate(v.date))}</span>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">${formatDate(v.date)}</div>
        </div>
      </div>
    </div>
  `).join("");
}

function renderRecentRecords(records) {
  const container = document.getElementById("recent-records-container");
  if (!container) return;

  if (!records || records.length === 0) {
    container.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.86rem;">No records found.</p>`;
    return;
  }

  container.innerHTML = records.map(r => `
    <div style="padding: 14px; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 10px; background-color: var(--bg-surface); transition: var(--transition-fast);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--brand-navy);">${escapeHtml(r.title)}</h4>
        <span class="card-badge badge-blue">${escapeHtml(r.type)}</span>
      </div>
      <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;"><strong>Doctor:</strong> ${escapeHtml(r.doctor)} (${formatDate(r.date)})</p>
      <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px;"><strong>Diagnosis:</strong> ${escapeHtml(r.diagnosis || 'Routine review')}</p>
      <div style="text-align: right;">
        <a href="records.html?search=${encodeURIComponent(r.title)}" style="font-size: 0.78rem; color: var(--medical-blue); font-weight: 600;">View in Records &rarr;</a>
      </div>
    </div>
  `).join("");
}

function renderActivePrescriptions(prescriptions) {
  const container = document.getElementById("active-prescriptions-container");
  if (!container) return;

  if (!prescriptions || prescriptions.length === 0) {
    container.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.86rem;">No active prescriptions.</p>`;
    return;
  }

  container.innerHTML = prescriptions.map(p => `
    <div style="padding: 14px; border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 10px; background-color: var(--bg-surface); transition: var(--transition-fast);">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="font-size: 0.92rem; color: var(--brand-navy);">${escapeHtml(p.medicine)}</strong>
        <span class="card-badge badge-green">${escapeHtml(p.dosage)}</span>
      </div>
      <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">${escapeHtml(p.frequency)} • ${escapeHtml(p.duration)}</p>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
        <span style="font-size: 0.74rem; color: var(--text-muted);">Prescribed by ${escapeHtml(p.doctor)}</span>
        <button class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 3px 8px;" onclick="toggleRxStatus('${p.id}')">✓ Mark Done</button>
      </div>
    </div>
  `).join("");
}

async function toggleRxStatus(id) {
  try {
    await apiRequest(`/api/prescriptions/${id}/toggle`, { method: "PATCH" });
    showToast("Prescription status updated", "success");
    loadDashboard();
  } catch (err) {
    handleApiError(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
});
