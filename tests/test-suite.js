const http = require("http");
const app = require("../server");
const store = require("../data/store");

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

async function runTests() {
  console.log("==================================================");
  console.log("       STARTING MEDICLOUD AUTOMATED TESTS        ");
  console.log("==================================================");

  store.reset();

  console.log("\n[1] Testing Dashboard APIs & Dynamic Calculation...");
  {
    const res = await request("/api/dashboard");
    assert(res.status === 200, "GET /api/dashboard returns 200");
    assert(res.body.success === true, "Dashboard response indicates success");
    assert(res.body.data.counts.totalRecords === store.records.length, "Dashboard counts reflect live store.records.length");
    assert(res.body.data.counts.totalVisits === store.visits.length, "Dashboard counts reflect live store.visits.length");
    assert(res.body.data.counts.totalPrescriptions === store.prescriptions.length, "Dashboard counts reflect live store.prescriptions.length");
    assert(res.body.data.counts.totalDocuments === store.documents.length, "Dashboard counts reflect live store.documents.length");
    assert(Array.isArray(res.body.data.recentActivity), "Recent activity list is returned");

    // Test clearing to 0
    const clearRes = await request("/api/dashboard/clear", { method: "POST" });
    assert(clearRes.status === 200, "POST /api/dashboard/clear returns 200");
    assert(clearRes.body.data.counts.totalRecords === 0, "Cleared data has exactly 0 records");
    assert(clearRes.body.data.counts.totalVisits === 0, "Cleared data has exactly 0 visits");
    assert(clearRes.body.data.counts.totalPrescriptions === 0, "Cleared data has exactly 0 prescriptions");
    assert(clearRes.body.data.counts.totalDocuments === 0, "Cleared data has exactly 0 documents");
    assert(clearRes.body.data.recentActivity.length === 0, "Cleared data has empty activity list");

    // Test restoring sample data
    const resetRes = await request("/api/dashboard/reset", { method: "POST" });
    assert(resetRes.status === 200, "POST /api/dashboard/reset returns 200");
    assert(resetRes.body.data.counts.totalRecords === 8, "Reset restored records to 8");
    assert(resetRes.body.data.counts.totalVisits === 4, "Reset restored visits to 4");
    assert(resetRes.body.data.counts.totalPrescriptions === 5, "Reset restored prescriptions to 5");
    assert(resetRes.body.data.counts.totalDocuments === 5, "Reset restored documents to 5");

    // Test export backup
    const exportRes = await request("/api/dashboard/export");
    assert(exportRes.status === 200, "GET /api/dashboard/export returns 200");
    assert(exportRes.body.data.version === "1.0.0", "Export payload contains version 1.0.0");
    assert(Array.isArray(exportRes.body.data.records), "Export payload contains records array");
    assert(Array.isArray(exportRes.body.data.prescriptions), "Export payload contains prescriptions array");

    const exportAliasRes = await request("/api/export");
    assert(exportAliasRes.status === 200, "GET /api/export returns 200");
    assert(exportAliasRes.body.data.version === "1.0.0", "Export alias payload contains version 1.0.0");
  }

  console.log("\n[2] Testing Medical Records CRUD & Validation...");
  let createdRecordId;
  {
    const resAll = await request("/api/records");
    assert(resAll.status === 200 && resAll.body.data.length >= 5, "GET /api/records lists records");

    const resSingle = await request("/api/records/REC-101");
    assert(resSingle.status === 200 && resSingle.body.data.id === "REC-101", "GET /api/records/REC-101 returns specific record");

    const badPost = await request("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" })
    });
    assert(badPost.status === 400 && badPost.body.success === false, "POST /api/records fails on missing fields");

    const goodPost = await request("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Cardiology Stress Echocardiogram",
        type: "Lab Report",
        date: "2026-09-01",
        doctor: "Dr. Sandeep Kapoor",
        hospital: "Heart & Vascular Care Institute",
        diagnosis: "Normal sinus rhythm with normal left ventricular function",
        symptoms: "Occasional post-exercise palpitations",
        notes: "Treadmill Bruce protocol achieved target heart rate without ischemic changes.",
        prescription: "Magnesium supplement 250mg daily"
      })
    });
    assert(goodPost.status === 201 && goodPost.body.data.id.startsWith("REC-"), "POST /api/records creates record with generated ID");
    createdRecordId = goodPost.body.data.id;

    const patchRes = await request(`/api/records/${createdRecordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diagnosis: "Updated echocardiogram report: Normal ejection fraction 62%" })
    });
    assert(patchRes.status === 200 && patchRes.body.data.diagnosis.includes("62%"), "PATCH /api/records/:id updates record");

    const delRes = await request(`/api/records/${createdRecordId}`, { method: "DELETE" });
    assert(delRes.status === 200 && delRes.body.success === true, "DELETE /api/records/:id deletes record");

    const checkDel = await request(`/api/records/${createdRecordId}`);
    assert(checkDel.status === 404, "GET /api/records/:id returns 404 for deleted record");
  }

  console.log("\n[3] Testing Doctor Visits CRUD & Validation...");
  let createdVisitId;
  {
    const resAll = await request("/api/visits");
    assert(resAll.status === 200 && resAll.body.data.length >= 4, "GET /api/visits lists visits");

    const badVisit = await request("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctor: "" })
    });
    assert(badVisit.status === 400, "POST /api/visits rejects missing doctor/fields");

    const goodVisit = await request("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctor: "Dr. Sandeep Kapoor",
        specialization: "Cardiology",
        hospital: "Heart & Vascular Care Institute",
        visitDate: "2026-09-01",
        reason: "Cardiac health checkup",
        notes: "Resting ECG normal",
        followUpDate: "2027-09-01"
      })
    });
    assert(goodVisit.status === 201 && goodVisit.body.data.id.startsWith("VST-"), "POST /api/visits creates visit");
    createdVisitId = goodVisit.body.data.id;

    const patchVisit = await request(`/api/visits/${createdVisitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "Vitals normal: BP 120/80" })
    });
    assert(patchVisit.status === 200, "PATCH /api/visits/:id updates visit");

    const delVisit = await request(`/api/visits/${createdVisitId}`, { method: "DELETE" });
    assert(delVisit.status === 200, "DELETE /api/visits/:id deletes visit");
  }

  console.log("\n[4] Testing Prescriptions CRUD & Validation...");
  let createdRxId;
  {
    const resAll = await request("/api/prescriptions");
    assert(resAll.status === 200 && resAll.body.data.length >= 5, "GET /api/prescriptions lists prescriptions");

    const badRx = await request("/api/prescriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medicine: "" })
    });
    assert(badRx.status === 400, "POST /api/prescriptions rejects invalid data");

    const goodRx = await request("/api/prescriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medicine: "Amoxicillin Trihydrate",
        dosage: "500 mg",
        frequency: "Three times daily",
        duration: "5 days",
        doctor: "Dr. Sunita Rao",
        date: "2026-08-20",
        instructions: "Complete entire course with food"
      })
    });
    assert(goodRx.status === 201 && goodRx.body.data.id.startsWith("RX-"), "POST /api/prescriptions creates prescription");
    createdRxId = goodRx.body.data.id;

    const patchRx = await request(`/api/prescriptions/${createdRxId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duration: "7 days" })
    });
    assert(patchRx.status === 200 && patchRx.body.data.duration === "7 days", "PATCH /api/prescriptions/:id updates prescription");

    const toggleRx = await request(`/api/prescriptions/${createdRxId}/toggle`, { method: "PATCH" });
    assert(toggleRx.status === 200 && toggleRx.body.data.status === "Completed", "PATCH /api/prescriptions/:id/toggle switches to Completed");

    const toggleBackRx = await request(`/api/prescriptions/${createdRxId}/toggle`, { method: "PATCH" });
    assert(toggleBackRx.status === 200 && toggleBackRx.body.data.status === "Active", "PATCH /api/prescriptions/:id/toggle switches back to Active");

    const activeFilter = await request("/api/prescriptions?status=Active");
    assert(activeFilter.status === 200 && activeFilter.body.data.every(p => p.status === "Active"), "Filtering prescriptions by status=Active works");

    const delRx = await request(`/api/prescriptions/${createdRxId}`, { method: "DELETE" });
    assert(delRx.status === 200, "DELETE /api/prescriptions/:id deletes prescription");
  }

  console.log("\n[5] Testing Health Documents Metadata CRUD & Validation...");
  let createdDocId;
  {
    const resAll = await request("/api/documents");
    assert(resAll.status === 200 && resAll.body.data.length >= 5, "GET /api/documents lists document metadata");

    const badDoc = await request("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" })
    });
    assert(badDoc.status === 400, "POST /api/documents rejects empty title");

    const goodDoc = await request("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Thyroid Function Test Panel",
        type: "Lab Report",
        date: "2026-08-25",
        description: "TSH, Free T3, and Free T4 values within normal reference limits.",
        reference: "LAB-THY-2026-90"
      })
    });
    assert(goodDoc.status === 201 && goodDoc.body.data.id.startsWith("DOC-"), "POST /api/documents creates document metadata");
    createdDocId = goodDoc.body.data.id;

    const patchDoc = await request(`/api/documents/${createdDocId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "Updated thyroid panel notes" })
    });
    assert(patchDoc.status === 200, "PATCH /api/documents/:id updates document metadata");

    const delDoc = await request(`/api/documents/${createdDocId}`, { method: "DELETE" });
    assert(delDoc.status === 200, "DELETE /api/documents/:id deletes document metadata");
  }

  console.log("\n[6] Testing Health Profile APIs...");
  {
    const getProf = await request("/api/profile");
    assert(getProf.status === 200 && getProf.body.data.bloodGroup === "B+", "GET /api/profile returns profile data");

    const patchName = await request("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Rohit Sharma",
        bloodGroup: "O+"
      })
    });
    assert(patchName.status === 200 && patchName.body.data.name === "Rohit Sharma", "PATCH /api/profile updates user name to Rohit Sharma");
    assert(patchName.body.data.bloodGroup === "O+", "PATCH /api/profile updates blood group");

    const patchProf = await request("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allergies: "Penicillin, Pollen, Peanuts",
        existingConditions: "Mild Seasonal Asthma"
      })
    });
    assert(patchProf.status === 200 && patchProf.body.data.allergies.includes("Peanuts"), "PATCH /api/profile updates allergies");

    const patchVitals = await request("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        height: 175,
        weight: 70,
        bloodPressure: "120/80"
      })
    });
    assert(patchVitals.status === 200 && patchVitals.body.data.height === 175, "PATCH /api/profile updates height to 175");
    assert(patchVitals.body.data.weight === 70, "PATCH /api/profile updates weight to 70");
    assert(patchVitals.body.data.bloodPressure === "120/80", "PATCH /api/profile updates bloodPressure to 120/80");

    const badPatchProf = await request("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" })
    });
    assert(badPatchProf.status === 400, "PATCH /api/profile rejects empty name");
  }

  console.log("\n[7] Testing Global Search...");
  {
    const emptySearch = await request("/api/search");
    assert(emptySearch.status === 400, "GET /api/search without query returns 400");

    const searchArvind = await request("/api/search?q=Arvind");
    assert(searchArvind.status === 200 && searchArvind.body.data.totalMatches > 0, "GET /api/search?q=Arvind returns matches");
    assert(searchArvind.body.data.records.length > 0, "Search matches records for Dr. Arvind");

    const searchNonexistent = await request("/api/search?q=Zyxwvutsrqp");
    assert(searchNonexistent.status === 200 && searchNonexistent.body.data.totalMatches === 0, "Search for nonexistent term returns 0 matches");
  }

  console.log("\n[8] Testing Filtering and Sorting...");
  {
    const filterType = await request("/api/records?type=Consultation");
    assert(filterType.status === 200 && filterType.body.data.every(r => r.type === "Consultation"), "Filtering records by type works");

    const filterDoctor = await request("/api/records?doctor=Sunita");
    assert(filterDoctor.status === 200 && filterDoctor.body.data.every(r => r.doctor.includes("Sunita")), "Filtering records by doctor works");

    const sortOldest = await request("/api/records?sortBy=oldest");
    const dates = sortOldest.body.data.map(r => r.date);
    const isSorted = dates.slice(1).every((d, i) => new Date(d) >= new Date(dates[i]));
    assert(sortOldest.status === 200 && isSorted, "Sorting records by oldest works");

    const sortAlpha = await request("/api/records?sortBy=alphabetical");
    const titles = sortAlpha.body.data.map(r => r.title.toLowerCase());
    const isAlpha = titles.slice(1).every((t, i) => t >= titles[i]);
    assert(sortAlpha.status === 200 && isAlpha, "Sorting records alphabetically works");
  }

  console.log("\n[9] Testing Edge Cases & Negative Scenarios...");
  {
    const nonExistentRec = await request("/api/records/REC-9999");
    assert(nonExistentRec.status === 404, "GET nonexistent record returns 404");

    const patchNonExistent = await request("/api/records/REC-9999", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Doesn't exist" })
    });
    assert(patchNonExistent.status === 404, "PATCH nonexistent record returns 404");

    const deleteNonExistent = await request("/api/records/REC-9999", { method: "DELETE" });
    assert(deleteNonExistent.status === 404, "DELETE nonexistent record returns 404");

    const emptyBodyPatch = await request("/api/records/REC-101", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    assert(emptyBodyPatch.status === 400, "Empty body PATCH returns 400");

    const nonExistentRoute = await request("/api/nonexistent-endpoint");
    assert(nonExistentRoute.status === 404, "Undefined API endpoint returns 404");

    const malformedJsonRes = await fetch(`${baseUrl}/api/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ invalid json format"
    });
    assert(malformedJsonRes.status === 400, "Malformed JSON request payload returns 400");
  }

  console.log("\n[10] Testing Frontend Static File Delivery...");
  {
    const htmlFiles = ["/", "/records.html", "/visits.html", "/prescriptions.html", "/documents.html", "/profile.html"];
    for (const file of htmlFiles) {
      const res = await fetch(`${baseUrl}${file}`);
      assert(res.status === 200, `Static route '${file}' delivers status 200`);
    }

    const assetFiles = ["/css/style.css", "/js/api.js", "/js/dashboard.js", "/js/records.js", "/js/visits.js", "/js/prescriptions.js", "/js/documents.js", "/js/profile.js"];
    for (const asset of assetFiles) {
      const res = await fetch(`${baseUrl}${asset}`);
      assert(res.status === 200, `Asset route '${asset}' delivers status 200`);
    }
  }

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  server.close(() => {
    process.exit(failed > 0 ? 1 : 0);
  });
}

server = app.listen(0, () => {
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  runTests().catch(err => {
    console.error("Test execution error:", err);
    server.close();
    process.exit(1);
  });
});
