const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { successResponse, errorResponse, validateRecord } = require("../utils/helpers");

router.get("/", (req, res) => {
  const { type, doctor, date, search, sortBy } = req.query;
  let results = [...store.records];

  if (type && type !== "All") {
    results = results.filter(r => r.type.toLowerCase() === type.toLowerCase());
  }

  if (doctor && doctor.trim() !== "") {
    const docQuery = doctor.trim().toLowerCase();
    results = results.filter(r => r.doctor.toLowerCase().includes(docQuery));
  }

  if (date && date.trim() !== "") {
    results = results.filter(r => r.date.startsWith(date.trim()));
  }

  if (search && search.trim() !== "") {
    const q = search.trim().toLowerCase();
    results = results.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.doctor.toLowerCase().includes(q) ||
      r.hospital.toLowerCase().includes(q) ||
      (r.diagnosis && r.diagnosis.toLowerCase().includes(q)) ||
      (r.symptoms && r.symptoms.toLowerCase().includes(q))
    );
  }

  if (sortBy === "oldest") {
    results.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sortBy === "alphabetical") {
    results.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    results.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  return successResponse(res, results);
});

router.get("/:id", (req, res) => {
  const record = store.findRecord(req.params.id);
  if (!record) {
    return errorResponse(res, `Medical record with ID '${req.params.id}' was not found`, 404);
  }
  return successResponse(res, record);
});

router.post("/", (req, res) => {
  const errors = validateRecord(req.body, false);
  if (errors.length > 0) {
    return errorResponse(res, "Validation failed for medical record", 400, errors);
  }

  const { title, type, date, doctor, hospital, diagnosis, symptoms, notes, prescription } = req.body;
  const newRecord = {
    id: store.generateId("REC"),
    title: title.trim(),
    type: type.trim(),
    date: date.trim(),
    doctor: doctor.trim(),
    hospital: hospital.trim(),
    diagnosis: diagnosis ? diagnosis.trim() : "",
    symptoms: symptoms ? symptoms.trim() : "",
    notes: notes ? notes.trim() : "",
    prescription: prescription ? prescription.trim() : ""
  };

  store.records.unshift(newRecord);
  return successResponse(res, newRecord, 201, "Medical record created successfully");
});

router.patch("/:id", (req, res) => {
  const index = store.records.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return errorResponse(res, `Medical record with ID '${req.params.id}' was not found`, 404);
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return errorResponse(res, "Update payload cannot be empty", 400);
  }

  const errors = validateRecord(req.body, true);
  if (errors.length > 0) {
    return errorResponse(res, "Validation failed for medical record update", 400, errors);
  }

  const existing = store.records[index];
  const updated = {
    ...existing,
    ...(req.body.title !== undefined && { title: req.body.title.trim() }),
    ...(req.body.type !== undefined && { type: req.body.type.trim() }),
    ...(req.body.date !== undefined && { date: req.body.date.trim() }),
    ...(req.body.doctor !== undefined && { doctor: req.body.doctor.trim() }),
    ...(req.body.hospital !== undefined && { hospital: req.body.hospital.trim() }),
    ...(req.body.diagnosis !== undefined && { diagnosis: req.body.diagnosis.trim() }),
    ...(req.body.symptoms !== undefined && { symptoms: req.body.symptoms.trim() }),
    ...(req.body.notes !== undefined && { notes: req.body.notes.trim() }),
    ...(req.body.prescription !== undefined && { prescription: req.body.prescription.trim() })
  };

  store.records[index] = updated;
  return successResponse(res, updated, 200, "Medical record updated successfully");
});

router.delete("/:id", (req, res) => {
  const index = store.records.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return errorResponse(res, `Medical record with ID '${req.params.id}' was not found`, 404);
  }

  const deleted = store.records.splice(index, 1)[0];
  return successResponse(res, { id: deleted.id }, 200, "Medical record deleted successfully");
});

module.exports = router;
