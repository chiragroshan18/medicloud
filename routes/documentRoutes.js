const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { successResponse, errorResponse, validateDocument } = require("../utils/helpers");

router.get("/", (req, res) => {
  const { type, search, sortBy } = req.query;
  let results = [...store.documents];

  if (type && type !== "All") {
    results = results.filter(d => d.type.toLowerCase() === type.toLowerCase());
  }

  if (search && search.trim() !== "") {
    const q = search.trim().toLowerCase();
    results = results.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q) ||
      (d.description && d.description.toLowerCase().includes(q)) ||
      (d.reference && d.reference.toLowerCase().includes(q))
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
  const doc = store.findDocument(req.params.id);
  if (!doc) {
    return errorResponse(res, `Health document with ID '${req.params.id}' was not found`, 404);
  }
  return successResponse(res, doc);
});

router.post("/", (req, res) => {
  const errors = validateDocument(req.body, false);
  if (errors.length > 0) {
    return errorResponse(res, "Validation failed for health document", 400, errors);
  }

  const { title, type, date, description, reference } = req.body;
  const newDoc = {
    id: store.generateId("DOC"),
    title: title.trim(),
    type: type.trim(),
    date: date.trim(),
    description: description ? description.trim() : "",
    reference: reference ? reference.trim() : ""
  };

  store.documents.unshift(newDoc);
  return successResponse(res, newDoc, 201, "Health document metadata recorded successfully");
});

router.patch("/:id", (req, res) => {
  const index = store.documents.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return errorResponse(res, `Health document with ID '${req.params.id}' was not found`, 404);
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return errorResponse(res, "Update payload cannot be empty", 400);
  }

  const errors = validateDocument(req.body, true);
  if (errors.length > 0) {
    return errorResponse(res, "Validation failed for health document update", 400, errors);
  }

  const existing = store.documents[index];
  const updated = {
    ...existing,
    ...(req.body.title !== undefined && { title: req.body.title.trim() }),
    ...(req.body.type !== undefined && { type: req.body.type.trim() }),
    ...(req.body.date !== undefined && { date: req.body.date.trim() }),
    ...(req.body.description !== undefined && { description: req.body.description.trim() }),
    ...(req.body.reference !== undefined && { reference: req.body.reference.trim() })
  };

  store.documents[index] = updated;
  return successResponse(res, updated, 200, "Health document updated successfully");
});

router.delete("/:id", (req, res) => {
  const index = store.documents.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return errorResponse(res, `Health document with ID '${req.params.id}' was not found`, 404);
  }

  const deleted = store.documents.splice(index, 1)[0];
  return successResponse(res, { id: deleted.id }, 200, "Health document metadata deleted successfully");
});

module.exports = router;
