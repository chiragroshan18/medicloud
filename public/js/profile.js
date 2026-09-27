function calculateBmiScore(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return { score: "N/A", category: "Incomplete Vitals", badgeClass: "badge-blue" };
  }
  const hMeters = heightCm / 100;
  const bmi = (weightKg / (hMeters * hMeters)).toFixed(1);
  const val = parseFloat(bmi);

  let category = "Normal Weight";
  let badgeClass = "badge-green";

  if (val < 18.5) {
    category = "Underweight";
    badgeClass = "badge-amber";
  } else if (val >= 25 && val < 30) {
    category = "Overweight";
    badgeClass = "badge-amber";
  } else if (val >= 30) {
    category = "Obese";
    badgeClass = "badge-purple";
  }

  return { score: bmi, category, badgeClass };
}

function updateBmiLive() {
  const h = parseFloat(document.getElementById("height").value);
  const w = parseFloat(document.getElementById("weight").value);
  const bmiData = calculateBmiScore(h, w);

  const display = document.getElementById("profile-bmi-display");
  const badge = document.getElementById("profile-bmi-badge");

  if (display) display.innerText = bmiData.score;
  if (badge) {
    badge.innerHTML = `<span class="card-badge ${bmiData.badgeClass}">${escapeHtml(bmiData.category)}</span>`;
  }
}

async function loadProfile() {
  try {
    const res = await apiRequest("/api/profile");
    const p = res.data;

    document.getElementById("profile-name-display").innerText = p.name;
    document.getElementById("profile-blood-display").innerText = p.bloodGroup;
    document.getElementById("profile-phone-display").innerText = p.phone;

    document.getElementById("name").value = p.name;
    document.getElementById("dob").value = p.dob;
    document.getElementById("gender").value = p.gender;
    document.getElementById("bloodGroup").value = p.bloodGroup;
    document.getElementById("height").value = p.height || 175;
    document.getElementById("weight").value = p.weight || 70;
    document.getElementById("bloodPressure").value = p.bloodPressure || "120/80";
    document.getElementById("phone").value = p.phone;
    document.getElementById("emergencyContact").value = p.emergencyContact || "";
    document.getElementById("allergies").value = p.allergies || "";
    document.getElementById("existingConditions").value = p.existingConditions || "";

    updateBmiLive();

    const userMiniName = document.querySelector(".user-name");
    if (userMiniName) userMiniName.innerText = p.name;
  } catch (err) {
    handleApiError(err);
  }
}

async function handleProfileSubmit(e) {
  e.preventDefault();

  const payload = {
    name: document.getElementById("name").value.trim(),
    dob: document.getElementById("dob").value,
    gender: document.getElementById("gender").value,
    bloodGroup: document.getElementById("bloodGroup").value,
    height: parseFloat(document.getElementById("height").value) || 0,
    weight: parseFloat(document.getElementById("weight").value) || 0,
    bloodPressure: document.getElementById("bloodPressure").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    emergencyContact: document.getElementById("emergencyContact").value.trim(),
    allergies: document.getElementById("allergies").value.trim(),
    existingConditions: document.getElementById("existingConditions").value.trim()
  };

  try {
    await apiRequest("/api/profile", {
      method: "PATCH",
      body: payload
    });

    showToast("Health profile and clinical vitals updated successfully", "success");
    loadProfile();
  } catch (err) {
    handleApiError(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("name");
  if (nameInput) {
    nameInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      document.getElementById("profile-name-display").innerText = val || "Your Name";
      applyUserProfileHeader(val || "MediCloud");
    });
  }

  const heightInput = document.getElementById("height");
  const weightInput = document.getElementById("weight");
  if (heightInput) heightInput.addEventListener("input", updateBmiLive);
  if (weightInput) weightInput.addEventListener("input", updateBmiLive);

  document.getElementById("profile-form").addEventListener("submit", handleProfileSubmit);
  loadProfile();
});
