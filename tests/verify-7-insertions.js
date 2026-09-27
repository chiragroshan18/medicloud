const store = require("../data/store");
const app = require("../server");
const http = require("http");

let server;
let baseUrl;
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, options);
  let body;
  try {
    body = await res.json();
  } catch (err) {
    body = null;
  }
  return { status: res.status, ok: res.ok, body };
}

async function run7TestCases() {
  console.log("================================================================================");
  console.log("   MEDICLOUD LIVE VERIFICATION: INSERTING 7 DETAILED CLINICAL TEST CASES");
  console.log("================================================================================");

  // Snapshot initial counts
  const initialDashboard = await request("/api/dashboard");
  const initRecCount = initialDashboard.body.data.counts.totalRecords;
  const initVisCount = initialDashboard.body.data.counts.totalVisits;
  const initRxCount = initialDashboard.body.data.counts.totalPrescriptions;
  const initDocCount = initialDashboard.body.data.counts.totalDocuments;

  console.log(`Initial Dashboard Counts -> Records: ${initRecCount}, Visits: ${initVisCount}, Prescriptions: ${initRxCount}, Documents: ${initDocCount}`);

  // Test Case 1: Insert Medical Record - Allergic Rhinitis Consultation
  console.log("\n--------------------------------------------------------------------------------");
  console.log("[TEST CASE 1/7] POST /api/records — Allergic Rhinitis Clinical Consultation");
  console.log("--------------------------------------------------------------------------------");
  const tc1Payload = {
    title: "Acute Allergic Rhinitis & Sinusitis Review",
    type: "Consultation",
    date: "2026-09-20",
    doctor: "Dr. Ananya Sen",
    hospital: "Allergy & Asthma Care Pavilion",
    diagnosis: "Moderate persistent allergic rhinitis with mucosal edema",
    symptoms: "Nasal congestion, watery rhinorrhea, morning sneezing spells",
    notes: "Skin prick test demonstrated sensitivity to grass pollen and dust mites. Advised HEPA room filtration.",
    prescription: "Fluticasone Furoate nasal spray (27.5mcg) 2 sprays daily, Fexofenadine 120mg OD"
  };
  const tc1Res = await request("/api/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tc1Payload)
  });
  console.log("Request Payload:", JSON.stringify(tc1Payload, null, 2));
  console.log("Server Response:", JSON.stringify(tc1Res.body, null, 2));
  assert(tc1Res.status === 201, "Test Case 1 created with HTTP 201 Created");
  assert(tc1Res.body.data.id && tc1Res.body.data.id.startsWith("REC-"), "Generated Record ID: " + tc1Res.body.data.id);
  assert(tc1Res.body.data.title === tc1Payload.title, "Title matches inserted data");
  const rec1Id = tc1Res.body.data.id;

  // Test Case 2: Insert Medical Record - Diabetic Panel & HbA1c Lab Report
  console.log("\n--------------------------------------------------------------------------------");
  console.log("[TEST CASE 2/7] POST /api/records — Comprehensive Diabetic & Glycemic Panel");
  console.log("--------------------------------------------------------------------------------");
  const tc2Payload = {
    title: "Glycated Hemoglobin (HbA1c) & Renal Panel",
    type: "Lab Report",
    date: "2026-09-15",
    doctor: "Dr. Rajesh Kulkarni",
    hospital: "Metropolis Clinical Diagnostic Center",
    diagnosis: "Optimal glycemic control; early normoglycemic trajectory",
    symptoms: "Routine preventive 6-month biochemical surveillance",
    notes: "HbA1c: 5.4% (Ref: <5.7%). Fasting blood glucose: 88 mg/dL. Serum Creatinine: 0.9 mg/dL. eGFR > 90 mL/min.",
    prescription: "Continue balanced low-glycemic dietary regimen and daily aerobic exercise"
  };
  const tc2Res = await request("/api/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tc2Payload)
  });
  console.log("Request Payload:", JSON.stringify(tc2Payload, null, 2));
  console.log("Server Response:", JSON.stringify(tc2Res.body, null, 2));
  assert(tc2Res.status === 201, "Test Case 2 created with HTTP 201 Created");
  assert(tc2Res.body.data.id && tc2Res.body.data.id.startsWith("REC-"), "Generated Record ID: " + tc2Res.body.data.id);
  assert(tc2Res.body.data.diagnosis.includes("glycemic control"), "Diagnosis stored accurately");
  const rec2Id = tc2Res.body.data.id;

  // Test Case 3: Insert Medical Record - Seasonal Influenza Vaccination
  console.log("\n--------------------------------------------------------------------------------");
  console.log("[TEST CASE 3/7] POST /api/records — Quadrivalent Influenza Vaccine Administration");
  console.log("--------------------------------------------------------------------------------");
  const tc3Payload = {
    title: "Annual Quadrivalent Influenza Immunization",
    type: "Vaccination",
    date: "2026-09-10",
    doctor: "Dr. Arvind Mehta",
    hospital: "Apex Multispeciality Hospital",
    diagnosis: "Prophylactic immunization against influenza strains A & B",
    symptoms: "Asymptomatic; annual seasonal occupational immunization",
    notes: "Administered 0.5 mL FluQuadri intramuscularly into left deltoid. Batch #INF-2026-8841. No acute hypersensitivity observed after 15 min.",
    prescription: "Paracetamol 500mg SOS for mild injection site discomfort"
  };
  const tc3Res = await request("/api/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tc3Payload)
  });
  console.log("Request Payload:", JSON.stringify(tc3Payload, null, 2));
  console.log("Server Response:", JSON.stringify(tc3Res.body, null, 2));
  assert(tc3Res.status === 201, "Test Case 3 created with HTTP 201 Created");
  assert(tc3Res.body.data.id && tc3Res.body.data.id.startsWith("REC-"), "Generated Record ID: " + tc3Res.body.data.id);
  assert(tc3Res.body.data.type === "Vaccination", "Record classified correctly as Vaccination");
  const rec3Id = tc3Res.body.data.id;

  // Test Case 4: Insert Doctor Visit - Neurology Consultation
  console.log("\n--------------------------------------------------------------------------------");
  console.log("[TEST CASE 4/7] POST /api/visits — Neurology Clinical Consultation & Cranial Exam");
  console.log("--------------------------------------------------------------------------------");
  const tc4Payload = {
    doctor: "Dr. Kavita Deshmukh",
    specialization: "Neurology",
    hospital: "NeuroSpine Advanced Brain Institute",
    visitDate: "2026-09-18",
    reason: "Evaluation of episodic tension headaches and computer visual fatigue",
    notes: "Cranial nerves II through XII intact. Funduscopic examination normal; no papilledema. Diagnosed with tension-type headache exacerbated by prolonged screen glare.",
    followUpDate: "2026-11-18"
  };
  const tc4Res = await request("/api/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tc4Payload)
  });
  console.log("Request Payload:", JSON.stringify(tc4Payload, null, 2));
  console.log("Server Response:", JSON.stringify(tc4Res.body, null, 2));
  assert(tc4Res.status === 201, "Test Case 4 created with HTTP 201 Created");
  assert(tc4Res.body.data.id && tc4Res.body.data.id.startsWith("VST-"), "Generated Visit ID: " + tc4Res.body.data.id);
  assert(tc4Res.body.data.doctor === tc4Payload.doctor, "Physician name stored correctly");
  const visit1Id = tc4Res.body.data.id;

  // Test Case 5: Insert Doctor Visit - Cardiology Follow-up
  console.log("\n--------------------------------------------------------------------------------");
  console.log("[TEST CASE 5/7] POST /api/visits — Cardiovascular Stress Review & Hemodynamic Check");
  console.log("--------------------------------------------------------------------------------");
  const tc5Payload = {
    doctor: "Dr. Sandeep Kapoor",
    specialization: "Cardiology",
    hospital: "Heart & Vascular Care Institute",
    visitDate: "2026-09-22",
    reason: "Routine cardiovascular follow-up and ambulatory blood pressure review",
    notes: "Resting BP 118/76 mmHg. Resting pulse 68 bpm. Heart sounds S1/S2 present, no murmurs. Advised continuation of endurance cardio 150 mins/week.",
    followUpDate: "2027-03-22"
  };
  const tc5Res = await request("/api/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tc5Payload)
  });
  console.log("Request Payload:", JSON.stringify(tc5Payload, null, 2));
  console.log("Server Response:", JSON.stringify(tc5Res.body, null, 2));
  assert(tc5Res.status === 201, "Test Case 5 created with HTTP 201 Created");
  assert(tc5Res.body.data.id && tc5Res.body.data.id.startsWith("VST-"), "Generated Visit ID: " + tc5Res.body.data.id);
  assert(tc5Res.body.data.specialization === "Cardiology", "Specialization stored correctly");
  const visit2Id = tc5Res.body.data.id;

  // Test Case 6: Insert Prescription - Metformin Extended Release
  console.log("\n--------------------------------------------------------------------------------");
  console.log("[TEST CASE 6/7] POST /api/prescriptions — Metformin HCl Extended-Release Prescription");
  console.log("--------------------------------------------------------------------------------");
  const tc6Payload = {
    medicine: "Metformin Hydrochloride ER",
    dosage: "500 mg",
    frequency: "Once daily with evening meal",
    duration: "90 days",
    doctor: "Dr. Rajesh Kulkarni",
    date: "2026-09-15",
    status: "Active",
    instructions: "Take with food to minimize gastrointestinal discomfort. Swallow whole with water; do not crush."
  };
  const tc6Res = await request("/api/prescriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tc6Payload)
  });
  console.log("Request Payload:", JSON.stringify(tc6Payload, null, 2));
  console.log("Server Response:", JSON.stringify(tc6Res.body, null, 2));
  assert(tc6Res.status === 201, "Test Case 6 created with HTTP 201 Created");
  assert(tc6Res.body.data.id && tc6Res.body.data.id.startsWith("RX-"), "Generated Prescription ID: " + tc6Res.body.data.id);
  assert(tc6Res.body.data.dosage === "500 mg", "Dosage stored accurately");
  assert(tc6Res.body.data.status === "Active", "Prescription status defaults to Active");
  const rx1Id = tc6Res.body.data.id;

  // Test Case 7: Insert Health Document - High-Resolution MRI Lumbar Spine Scan
  console.log("\n--------------------------------------------------------------------------------");
  console.log("[TEST CASE 7/7] POST /api/documents — 3.0 Tesla MRI Lumbar Spine Diagnostic Report");
  console.log("--------------------------------------------------------------------------------");
  const tc7Payload = {
    title: "High-Resolution 3.0 Tesla Lumbar Spine MRI Scan",
    type: "Scan/Report",
    date: "2026-09-12",
    description: "Multiplanar T1 and T2 weighted imaging of lumbar vertebrae L1-S1. Normal lordotic curvature, no disc herniation or spinal canal stenosis detected.",
    reference: "REF-MRI-LUMB-2026-9902"
  };
  const tc7Res = await request("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tc7Payload)
  });
  console.log("Request Payload:", JSON.stringify(tc7Payload, null, 2));
  console.log("Server Response:", JSON.stringify(tc7Res.body, null, 2));
  assert(tc7Res.status === 201, "Test Case 7 created with HTTP 201 Created");
  assert(tc7Res.body.data.id && tc7Res.body.data.id.startsWith("DOC-"), "Generated Document ID: " + tc7Res.body.data.id);
  assert(tc7Res.body.data.reference === tc7Payload.reference, "Reference tracking ID preserved");
  const doc1Id = tc7Res.body.data.id;

  // VERIFICATION OF CROSS-FUNCTIONAL FEATURES
  console.log("\n================================================================================");
  console.log("   CROSS-FEATURE VERIFICATION (DASHBOARD, SEARCH, FILTERS, VITALS & EXPORT)");
  console.log("================================================================================");

  // 1. Dashboard Count Verification
  const updatedDashboard = await request("/api/dashboard");
  const newCounts = updatedDashboard.body.data.counts;
  console.log(`Updated Dashboard Counts -> Records: ${newCounts.totalRecords}, Visits: ${newCounts.totalVisits}, Prescriptions: ${newCounts.totalPrescriptions}, Documents: ${newCounts.totalDocuments}`);
  assert(newCounts.totalRecords === initRecCount + 3, `Records count incremented by 3 (from ${initRecCount} to ${newCounts.totalRecords})`);
  assert(newCounts.totalVisits === initVisCount + 2, `Visits count incremented by 2 (from ${initVisCount} to ${newCounts.totalVisits})`);
  assert(newCounts.totalPrescriptions === initRxCount + 1, `Prescriptions count incremented by 1 (from ${initRxCount} to ${newCounts.totalPrescriptions})`);
  assert(newCounts.totalDocuments === initDocCount + 1, `Documents count incremented by 1 (from ${initDocCount} to ${newCounts.totalDocuments})`);

  // 2. Global Search for newly inserted items
  const searchKavita = await request("/api/search?q=Kavita");
  assert(searchKavita.status === 200 && searchKavita.body.data.totalMatches > 0, "Global search successfully finds 'Dr. Kavita Deshmukh'");
  assert(searchKavita.body.data.visits.some(v => v.id === visit1Id), "Search result contains new neurology visit");

  const searchMetformin = await request("/api/search?q=Metformin");
  assert(searchMetformin.status === 200 && searchMetformin.body.data.prescriptions.some(p => p.id === rx1Id), "Global search finds newly inserted Metformin prescription");

  // 3. Status Toggle for Prescription
  const toggleRes = await request(`/api/prescriptions/${rx1Id}/toggle`, { method: "PATCH" });
  assert(toggleRes.status === 200 && toggleRes.body.data.status === "Completed", "Prescription status toggled to 'Completed'");

  const toggleBackRes = await request(`/api/prescriptions/${rx1Id}/toggle`, { method: "PATCH" });
  assert(toggleBackRes.status === 200 && toggleBackRes.body.data.status === "Active", "Prescription status toggled back to 'Active'");

  // 4. Update Profile Vitals and verify BMI
  const updateVitals = await request("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      height: 178,
      weight: 74,
      bloodPressure: "118/76"
    })
  });
  assert(updateVitals.status === 200, "Patient clinical vitals updated via PATCH /api/profile");
  assert(updateVitals.body.data.height === 178, "Height updated to 178 cm");
  assert(updateVitals.body.data.weight === 74, "Weight updated to 74 kg");

  const dashWithBmi = await request("/api/dashboard");
  console.log("Calculated BMI on Dashboard:", dashWithBmi.body.data.patientVitals.bmi, `(${dashWithBmi.body.data.patientVitals.bmiCategory})`);
  assert(dashWithBmi.body.data.patientVitals.bmi === "23.4", "BMI calculated accurately as 23.4");
  assert(dashWithBmi.body.data.patientVitals.bmiCategory === "Normal Weight", "BMI category is 'Normal Weight'");

  // 5. Verification of Export Payload
  const exportPayload = await request("/api/dashboard/export");
  assert(exportPayload.status === 200, "GET /api/dashboard/export returns 200");
  assert(exportPayload.body.data.records.some(r => r.id === rec1Id), "Export contains Test Case 1 record");
  assert(exportPayload.body.data.records.some(r => r.id === rec2Id), "Export contains Test Case 2 record");
  assert(exportPayload.body.data.records.some(r => r.id === rec3Id), "Export contains Test Case 3 record");
  assert(exportPayload.body.data.visits.some(v => v.id === visit1Id), "Export contains Test Case 4 visit");
  assert(exportPayload.body.data.visits.some(v => v.id === visit2Id), "Export contains Test Case 5 visit");
  assert(exportPayload.body.data.prescriptions.some(p => p.id === rx1Id), "Export contains Test Case 6 prescription");
  assert(exportPayload.body.data.documents.some(d => d.id === doc1Id), "Export contains Test Case 7 document");

  console.log("\n================================================================================");
  console.log(`LIVE VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  server.close(() => {
    process.exit(failed > 0 ? 1 : 0);
  });
}

server = app.listen(0, () => {
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  run7TestCases().catch(err => {
    console.error("Test execution error:", err);
    server.close();
    process.exit(1);
  });
});
