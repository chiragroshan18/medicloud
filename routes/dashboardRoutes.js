const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { successResponse, calculateDashboard } = require("../utils/helpers");

router.get("/", (req, res) => {
  const dashboardData = calculateDashboard(store);
  return successResponse(res, dashboardData);
});

router.post("/clear", (req, res) => {
  store.clearData();
  const dashboardData = calculateDashboard(store);
  return successResponse(res, dashboardData, 200, "All medical records and activity cleared to 0");
});

router.post("/reset", (req, res) => {
  store.reset();
  const dashboardData = calculateDashboard(store);
  return successResponse(res, dashboardData, 200, "Sample data restored successfully");
});

router.get("/export", (req, res) => {
  const exportData = {
    exportedAt: new Date().toISOString(),
    application: "MediCloud Health Management",
    version: "1.0.0",
    profile: store.profile,
    records: store.records,
    visits: store.visits,
    prescriptions: store.prescriptions,
    documents: store.documents
  };
  return successResponse(res, exportData, 200, "Health data exported successfully");
});

module.exports = router;
