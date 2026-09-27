const express = require("express");
const path = require("path");

const dashboardRoutes = require("./routes/dashboardRoutes");
const recordRoutes = require("./routes/recordRoutes");
const visitRoutes = require("./routes/visitRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const documentRoutes = require("./routes/documentRoutes");
const profileRoutes = require("./routes/profileRoutes");
const searchRoutes = require("./routes/searchRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      error: "Malformed JSON payload in request body"
    });
  }
  next(err);
});

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/search", searchRoutes);

app.get("/api/export", (req, res) => {
  const store = require("./data/store");
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
  return res.json({
    success: true,
    data: exportData,
    message: "Health data exported successfully"
  });
});

app.all("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint '${req.method} ${req.originalUrl}' does not exist`
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MediCloud server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
