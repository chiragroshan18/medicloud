function successResponse(res, data, statusCode = 200, message = null) {
  const payload = { success: true };
  if (message) payload.message = message;
  if (data !== undefined) payload.data = data;
  return res.status(statusCode).json(payload);
}

function errorResponse(res, message, statusCode = 400, details = null) {
  const payload = { success: false, error: message };
  if (details) payload.details = details;
  return res.status(statusCode).json(payload);
}

const VALID_RECORD_TYPES = [
  "Consultation",
  "General Checkup",
  "Lab Report",
  "Prescription",
  "Vaccination",
  "Other"
];

const VALID_DOCUMENT_TYPES = [
  "Prescription",
  "Lab Report",
  "Medical Certificate",
  "Scan/Report",
  "Other"
];

function isNonEmptyString(val) {
  return typeof val === "string" && val.trim().length > 0;
}

function isValidDate(dateStr) {
  if (!isNonEmptyString(dateStr)) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

function validateRecord(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    if (!isNonEmptyString(data.title)) errors.push("Title is required and cannot be empty");
  }
  if (!isUpdate || data.type !== undefined) {
    if (!VALID_RECORD_TYPES.includes(data.type)) {
      errors.push(`Type must be one of: ${VALID_RECORD_TYPES.join(", ")}`);
    }
  }
  if (!isUpdate || data.date !== undefined) {
    if (!isValidDate(data.date)) errors.push("A valid date (YYYY-MM-DD) is required");
  }
  if (!isUpdate || data.doctor !== undefined) {
    if (!isNonEmptyString(data.doctor)) errors.push("Doctor name is required");
  }
  if (!isUpdate || data.hospital !== undefined) {
    if (!isNonEmptyString(data.hospital)) errors.push("Hospital/Clinic name is required");
  }

  return errors;
}

function validateVisit(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.doctor !== undefined) {
    if (!isNonEmptyString(data.doctor)) errors.push("Doctor name is required");
  }
  if (!isUpdate || data.specialization !== undefined) {
    if (!isNonEmptyString(data.specialization)) errors.push("Specialization is required");
  }
  if (!isUpdate || data.hospital !== undefined) {
    if (!isNonEmptyString(data.hospital)) errors.push("Hospital/Clinic name is required");
  }
  if (!isUpdate || data.visitDate !== undefined) {
    if (!isValidDate(data.visitDate)) errors.push("A valid visit date (YYYY-MM-DD) is required");
  }
  if (!isUpdate || data.reason !== undefined) {
    if (!isNonEmptyString(data.reason)) errors.push("Reason for visit is required");
  }
  if (data.followUpDate !== undefined && data.followUpDate !== null && data.followUpDate !== "") {
    if (!isValidDate(data.followUpDate)) errors.push("Follow-up date must be a valid date (YYYY-MM-DD)");
  }

  return errors;
}

function validatePrescription(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.medicine !== undefined) {
    if (!isNonEmptyString(data.medicine)) errors.push("Medicine name is required");
  }
  if (!isUpdate || data.dosage !== undefined) {
    if (!isNonEmptyString(data.dosage)) errors.push("Dosage is required");
  }
  if (!isUpdate || data.frequency !== undefined) {
    if (!isNonEmptyString(data.frequency)) errors.push("Frequency is required");
  }
  if (!isUpdate || data.duration !== undefined) {
    if (!isNonEmptyString(data.duration)) errors.push("Duration is required");
  }
  if (!isUpdate || data.doctor !== undefined) {
    if (!isNonEmptyString(data.doctor)) errors.push("Prescribing doctor is required");
  }
  if (!isUpdate || data.date !== undefined) {
    if (!isValidDate(data.date)) errors.push("A valid prescription date (YYYY-MM-DD) is required");
  }

  return errors;
}

function validateDocument(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    if (!isNonEmptyString(data.title)) errors.push("Document title is required");
  }
  if (!isUpdate || data.type !== undefined) {
    if (!VALID_DOCUMENT_TYPES.includes(data.type)) {
      errors.push(`Document type must be one of: ${VALID_DOCUMENT_TYPES.join(", ")}`);
    }
  }
  if (!isUpdate || data.date !== undefined) {
    if (!isValidDate(data.date)) errors.push("A valid document date (YYYY-MM-DD) is required");
  }

  return errors;
}

function validateProfile(data) {
  const errors = [];
  if (data.name !== undefined && !isNonEmptyString(data.name)) {
    errors.push("Name cannot be empty");
  }
  if (data.dob !== undefined && !isValidDate(data.dob)) {
    errors.push("Date of birth must be a valid date");
  }
  if (data.phone !== undefined && !isNonEmptyString(data.phone)) {
    errors.push("Phone cannot be empty");
  }
  return errors;
}

function calculateDashboard(store) {
  const totalRecords = store.records.length;
  const totalVisits = store.visits.length;
  const totalPrescriptions = store.prescriptions.length;
  const totalDocuments = store.documents.length;

  const allActivity = [];

  store.records.forEach(r => {
    allActivity.push({
      id: r.id,
      module: "Medical Record",
      title: r.title,
      type: r.type,
      date: r.date,
      subtitle: `${r.doctor} • ${r.hospital}`,
      details: r.diagnosis || r.symptoms || ""
    });
  });

  store.visits.forEach(v => {
    allActivity.push({
      id: v.id,
      module: "Doctor Visit",
      title: `${v.doctor} (${v.specialization})`,
      type: "Doctor Visit",
      date: v.visitDate,
      subtitle: v.hospital,
      details: v.reason
    });
  });

  store.prescriptions.forEach(p => {
    allActivity.push({
      id: p.id,
      module: "Prescription",
      title: p.medicine,
      type: "Prescription",
      date: p.date,
      subtitle: `By ${p.doctor} • ${p.dosage}`,
      details: p.instructions || ""
    });
  });

  store.documents.forEach(d => {
    allActivity.push({
      id: d.id,
      module: "Health Document",
      title: d.title,
      type: d.type,
      date: d.date,
      subtitle: d.reference ? `Ref: ${d.reference}` : d.type,
      details: d.description || ""
    });
  });

  allActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentActivity = allActivity.slice(0, 6);

  let bmi = null;
  let bmiCategory = "N/A";
  if (store.profile.height > 0 && store.profile.weight > 0) {
    const hMeters = store.profile.height / 100;
    bmi = (store.profile.weight / (hMeters * hMeters)).toFixed(1);
    const val = parseFloat(bmi);
    if (val < 18.5) bmiCategory = "Underweight";
    else if (val < 25) bmiCategory = "Normal Weight";
    else if (val < 30) bmiCategory = "Overweight";
    else bmiCategory = "Obese";
  }

  const patientVitals = {
    bloodGroup: store.profile.bloodGroup || "N/A",
    bmi: bmi ? `${bmi}` : "N/A",
    bmiCategory,
    bloodPressure: store.profile.bloodPressure || "120/80",
    emergencyContact: store.profile.emergencyContact || "None listed",
    allergies: store.profile.allergies || "None declared"
  };

  const upcomingVisits = store.visits
    .filter(v => v.followUpDate && v.followUpDate.trim() !== "")
    .map(v => {
      const fDate = new Date(v.followUpDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      fDate.setHours(0, 0, 0, 0);
      const diffTime = fDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      let countdown = "";
      if (diffDays < 0) countdown = `${Math.abs(diffDays)}d overdue`;
      else if (diffDays === 0) countdown = "Due Today";
      else if (diffDays === 1) countdown = "Tomorrow";
      else countdown = `In ${diffDays} days`;

      return {
        id: v.id,
        doctor: v.doctor,
        specialization: v.specialization,
        hospital: v.hospital,
        date: v.followUpDate,
        countdown,
        isOverdue: diffDays < 0,
        type: "Follow-up Visit"
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  return {
    counts: {
      totalRecords,
      totalVisits,
      totalPrescriptions,
      totalDocuments
    },
    patientVitals,
    recentActivity,
    upcomingVisits,
    recentRecords: store.records.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4),
    activePrescriptions: store.prescriptions.filter(p => p.status !== "Completed").slice(0, 3)
  };
}

function searchStore(store, query) {
  if (!query || typeof query !== "string") {
    return {
      records: [],
      visits: [],
      prescriptions: [],
      documents: [],
      totalMatches: 0
    };
  }

  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return {
      records: [],
      visits: [],
      prescriptions: [],
      documents: [],
      totalMatches: 0
    };
  }

  const match = (field) => field && typeof field === "string" && field.toLowerCase().includes(q);

  const records = store.records.filter(r =>
    match(r.title) ||
    match(r.type) ||
    match(r.doctor) ||
    match(r.hospital) ||
    match(r.diagnosis) ||
    match(r.symptoms) ||
    match(r.notes) ||
    match(r.prescription)
  );

  const visits = store.visits.filter(v =>
    match(v.doctor) ||
    match(v.specialization) ||
    match(v.hospital) ||
    match(v.reason) ||
    match(v.notes)
  );

  const prescriptions = store.prescriptions.filter(p =>
    match(p.medicine) ||
    match(p.dosage) ||
    match(p.frequency) ||
    match(p.duration) ||
    match(p.doctor) ||
    match(p.instructions)
  );

  const documents = store.documents.filter(d =>
    match(d.title) ||
    match(d.type) ||
    match(d.description) ||
    match(d.reference)
  );

  return {
    query,
    totalMatches: records.length + visits.length + prescriptions.length + documents.length,
    records,
    visits,
    prescriptions,
    documents
  };
}

module.exports = {
  successResponse,
  errorResponse,
  validateRecord,
  validateVisit,
  validatePrescription,
  validateDocument,
  validateProfile,
  calculateDashboard,
  searchStore,
  VALID_RECORD_TYPES,
  VALID_DOCUMENT_TYPES
};
