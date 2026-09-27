const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { successResponse, errorResponse, validateVisit } = require("../utils/helpers");

router.get("/", (req, res) => {
  const { doctor, specialization, search, sortBy } = req.query;
  let results = [...store.visits];

  if (doctor && doctor.trim() !== "") {
    const docQuery = doctor.trim().toLowerCase();
    results = results.filter(v => v.doctor.toLowerCase().includes(docQuery));
  }

  if (specialization && specialization !== "All") {
    results = results.filter(v => v.specialization.toLowerCase() === specialization.toLowerCase());
  }

  if (search && search.trim() !== "") {
    const q = search.trim().toLowerCase();
    results = results.filter(v =>
      v.doctor.toLowerCase().includes(q) ||
      v.specialization.toLowerCase().includes(q) ||
      v.hospital.toLowerCase().includes(q) ||
      v.reason.toLowerCase().includes(q) ||
      (v.notes && v.notes.toLowerCase().includes(q))
    );
  }

  if (sortBy === "oldest") {
    results.sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
  } else if (sortBy === "alphabetical") {
    results.sort((a, b) => a.doctor.localeCompare(b.doctor));
  } else {
    results.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
  }

  return successResponse(res, results);
});

router.get("/:id", (req, res) => {
  const visit = store.findVisit(req.params.id);
  if (!visit) {
    return errorResponse(res, `Doctor visit with ID '${req.params.id}' was not found`, 404);
  }
  return successResponse(res, visit);
});

router.post("/", (req, res) => {
  const errors = validateVisit(req.body, false);
  if (errors.length > 0) {
    return errorResponse(res, "Validation failed for doctor visit", 400, errors);
  }

  const { doctor, specialization, hospital, visitDate, reason, notes, followUpDate } = req.body;
  const newVisit = {
    id: store.generateId("VST"),
    doctor: doctor.trim(),
    specialization: specialization.trim(),
    hospital: hospital.trim(),
    visitDate: visitDate.trim(),
    reason: reason.trim(),
    notes: notes ? notes.trim() : "",
    followUpDate: followUpDate ? followUpDate.trim() : ""
  };

  store.visits.unshift(newVisit);
  return successResponse(res, newVisit, 201, "Doctor visit recorded successfully");
});

router.patch("/:id", (req, res) => {
  const index = store.visits.findIndex(v => v.id === req.params.id);
  if (index === -1) {
    return errorResponse(res, `Doctor visit with ID '${req.params.id}' was not found`, 404);
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return errorResponse(res, "Update payload cannot be empty", 400);
  }

  const errors = validateVisit(req.body, true);
  if (errors.length > 0) {
    return errorResponse(res, "Validation failed for doctor visit update", 400, errors);
  }

  const existing = store.visits[index];
  const updated = {
    ...existing,
    ...(req.body.doctor !== undefined && { doctor: req.body.doctor.trim() }),
    ...(req.body.specialization !== undefined && { specialization: req.body.specialization.trim() }),
    ...(req.body.hospital !== undefined && { hospital: req.body.hospital.trim() }),
    ...(req.body.visitDate !== undefined && { visitDate: req.body.visitDate.trim() }),
    ...(req.body.reason !== undefined && { reason: req.body.reason.trim() }),
    ...(req.body.notes !== undefined && { notes: req.body.notes.trim() }),
    ...(req.body.followUpDate !== undefined && { followUpDate: req.body.followUpDate ? req.body.followUpDate.trim() : "" })
  };

  store.visits[index] = updated;
  return successResponse(res, updated, 200, "Doctor visit updated successfully");
});

router.delete("/:id", (req, res) => {
  const index = store.visits.findIndex(v => v.id === req.params.id);
  if (index === -1) {
    return errorResponse(res, `Doctor visit with ID '${req.params.id}' was not found`, 404);
  }

  const deleted = store.visits.splice(index, 1)[0];
  return successResponse(res, { id: deleted.id }, 200, "Doctor visit deleted successfully");
});

module.exports = router;
