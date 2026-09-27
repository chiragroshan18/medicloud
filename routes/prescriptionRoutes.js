const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { successResponse, errorResponse, validatePrescription } = require("../utils/helpers");

router.get("/", (req, res) => {
  const { medicine, doctor, search, sortBy, status } = req.query;
  let results = [...store.prescriptions];

  if (status && status !== "All") {
    results = results.filter(p => (p.status || "Active").toLowerCase() === status.toLowerCase());
  }

  if (medicine && medicine.trim() !== "") {
    const medQuery = medicine.trim().toLowerCase();
    results = results.filter(p => p.medicine.toLowerCase().includes(medQuery));
  }

  if (doctor && doctor.trim() !== "") {
    const docQuery = doctor.trim().toLowerCase();
    results = results.filter(p => p.doctor.toLowerCase().includes(docQuery));
  }

  if (search && search.trim() !== "") {
    const q = search.trim().toLowerCase();
    results = results.filter(p =>
      p.medicine.toLowerCase().includes(q) ||
      p.doctor.toLowerCase().includes(q) ||
      p.dosage.toLowerCase().includes(q) ||
      p.frequency.toLowerCase().includes(q) ||
      p.duration.toLowerCase().includes(q) ||
      (p.instructions && p.instructions.toLowerCase().includes(q))
    );
  }

  if (sortBy === "oldest") {
    results.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sortBy === "alphabetical") {
    results.sort((a, b) => a.medicine.localeCompare(b.medicine));
  } else {
    results.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  return successResponse(res, results);
});

router.get("/:id", (req, res) => {
  const item = store.findPrescription(req.params.id);
  if (!item) {
    return errorResponse(res, `Prescription with ID '${req.params.id}' was not found`, 404);
  }
  return successResponse(res, item);
});

router.post("/", (req, res) => {
  const errors = validatePrescription(req.body, false);
  if (errors.length > 0) {
    return errorResponse(res, "Validation failed for prescription", 400, errors);
  }

  const { medicine, dosage, frequency, duration, doctor, date, instructions, status } = req.body;
  const newRx = {
    id: store.generateId("RX"),
    medicine: medicine.trim(),
    dosage: dosage.trim(),
    frequency: frequency.trim(),
    duration: duration.trim(),
    doctor: doctor.trim(),
    date: date.trim(),
    status: status === "Completed" ? "Completed" : "Active",
    instructions: instructions ? instructions.trim() : ""
  };

  store.prescriptions.unshift(newRx);
  return successResponse(res, newRx, 201, "Prescription recorded successfully");
});

router.patch("/:id/toggle", (req, res) => {
  const index = store.prescriptions.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return errorResponse(res, `Prescription with ID '${req.params.id}' was not found`, 404);
  }

  const existing = store.prescriptions[index];
  const newStatus = existing.status === "Completed" ? "Active" : "Completed";
  existing.status = newStatus;
  store.prescriptions[index] = existing;

  return successResponse(res, existing, 200, `Prescription marked as ${newStatus}`);
});

router.patch("/:id", (req, res) => {
  const index = store.prescriptions.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return errorResponse(res, `Prescription with ID '${req.params.id}' was not found`, 404);
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return errorResponse(res, "Update payload cannot be empty", 400);
  }

  const errors = validatePrescription(req.body, true);
  if (errors.length > 0) {
    return errorResponse(res, "Validation failed for prescription update", 400, errors);
  }

  const existing = store.prescriptions[index];
  const updated = {
    ...existing,
    ...(req.body.medicine !== undefined && { medicine: req.body.medicine.trim() }),
    ...(req.body.dosage !== undefined && { dosage: req.body.dosage.trim() }),
    ...(req.body.frequency !== undefined && { frequency: req.body.frequency.trim() }),
    ...(req.body.duration !== undefined && { duration: req.body.duration.trim() }),
    ...(req.body.doctor !== undefined && { doctor: req.body.doctor.trim() }),
    ...(req.body.date !== undefined && { date: req.body.date.trim() }),
    ...(req.body.status !== undefined && { status: req.body.status === "Completed" ? "Completed" : "Active" }),
    ...(req.body.instructions !== undefined && { instructions: req.body.instructions.trim() })
  };

  store.prescriptions[index] = updated;
  return successResponse(res, updated, 200, "Prescription updated successfully");
});

router.delete("/:id", (req, res) => {
  const index = store.prescriptions.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return errorResponse(res, `Prescription with ID '${req.params.id}' was not found`, 404);
  }

  const deleted = store.prescriptions.splice(index, 1)[0];
  return successResponse(res, { id: deleted.id }, 200, "Prescription deleted successfully");
});

module.exports = router;
