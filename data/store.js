const initialProfile = {
  name: "Roshan Sharma",
  dob: "1998-05-14",
  gender: "Male",
  bloodGroup: "B+",
  phone: "+91 98765 43210",
  emergencyContact: "Anita Sharma (+91 98765 43211)",
  allergies: "Penicillin, Pollen",
  existingConditions: "Mild Seasonal Asthma, Hypertension (Borderline)",
  height: 175,
  weight: 71,
  bloodPressure: "124/82"
};

const initialRecords = [
  {
    id: "REC-101",
    title: "Annual Health Assessment",
    type: "General Checkup",
    date: "2026-08-15",
    doctor: "Dr. Arvind Mehta",
    hospital: "Apex Multispeciality Hospital",
    diagnosis: "Healthy baseline with mild vitamin D deficiency",
    symptoms: "Occasional morning fatigue and mild joint stiffness",
    notes: "Advised 20 minutes daily morning sunlight and dietary calcium enhancement.",
    prescription: "Cholecalciferol 60,000 IU once weekly for 8 weeks"
  },
  {
    id: "REC-102",
    title: "Seasonal Bronchitis Follow-up",
    type: "Consultation",
    date: "2026-07-20",
    doctor: "Dr. Sunita Rao",
    hospital: "City Pulmonology Center",
    diagnosis: "Acute Bronchial Spasm secondary to viral infection",
    symptoms: "Wheezing, nocturnal dry cough, shortness of breath on exertion",
    notes: "Chest clear on auscultation. Peak flow reading within 85% of normal.",
    prescription: "Levosalbutamol Inhaler (100mcg) PRN, Montelukast 10mg daily"
  },
  {
    id: "REC-103",
    title: "Complete Metabolic & Lipid Panel",
    type: "Lab Report",
    date: "2026-06-10",
    doctor: "Dr. Rajesh Kulkarni",
    hospital: "Metropolis Diagnostics",
    diagnosis: "Serum cholesterol slightly elevated (208 mg/dL)",
    symptoms: "Routine preventive screening",
    notes: "Fasting blood sugar normal (92 mg/dL), HbA1c 5.4%, Liver and Kidney functions normal.",
    prescription: "Lifestyle modification: Mediterranean diet and brisk walking"
  },
  {
    id: "REC-104",
    title: "Adult Booster Immunization",
    type: "Vaccination",
    date: "2026-05-04",
    doctor: "Dr. Arvind Mehta",
    hospital: "Apex Multispeciality Hospital",
    diagnosis: "Routine Tdap vaccine booster administered",
    symptoms: "None",
    notes: "Site: Left deltoid intramuscular. Observed for 15 minutes without adverse reaction.",
    prescription: "Paracetamol 650mg if fever or local soreness occurs"
  },
  {
    id: "REC-105",
    title: "Dermatology Skin Evaluation",
    type: "Consultation",
    date: "2026-03-18",
    doctor: "Dr. Priya Nair",
    hospital: "Skin & Aesthetic Care Clinic",
    diagnosis: "Mild Seborrheic Dermatitis of scalp and T-zone",
    symptoms: "Flaking, itching along hairline and side of nose",
    notes: "Stress-related flare up. Avoid harsh chemical shampoos.",
    prescription: "Ketoconazole 2% shampoo twice weekly, Calamine lotion"
  },
  {
    id: "REC-106",
    title: "Cardiology Stress Echocardiogram & ECG",
    type: "Consultation",
    date: "2026-02-28",
    doctor: "Dr. Sandeep Kapoor",
    hospital: "Heart & Vascular Care Institute",
    diagnosis: "Normal sinus rhythm, normal left ventricular systolic function (EF 64%)",
    symptoms: "Occasional post-workout palpitations and chest tightness",
    notes: "Bruce protocol stress test completed without ischemic ST deviations. Blood pressure normalized within 4 minutes post-exercise.",
    prescription: "Magnesium Glycinate 200mg daily, hydrate adequately during endurance cardio"
  },
  {
    id: "REC-107",
    title: "Orthopedic Knee Joint & Meniscus Assessment",
    type: "Lab Report",
    date: "2026-01-15",
    doctor: "Dr. Vikram Joshi",
    hospital: "OrthoCare Advanced Sports Center",
    diagnosis: "Grade 1 medial collateral ligament sprain, no meniscal tear",
    symptoms: "Mild localized right knee tenderness following recreational badminton",
    notes: "Lachman test negative, McMurray test negative. Joint effusion resolved.",
    prescription: "Ice packs 15 mins TID, Glucosamine Sulfate 1500mg, quadriceps strengthening exercises"
  },
  {
    id: "REC-108",
    title: "Preventive Dental Prophylaxis & Examination",
    type: "General Checkup",
    date: "2025-11-20",
    doctor: "Dr. Meera Shenoy",
    hospital: "SmileCraft Dental & Maxillofacial Clinic",
    diagnosis: "Early localized gingival inflammation, zero dental caries",
    symptoms: "Mild bleeding upon flossing lower molars",
    notes: "Ultrasonic scaling performed. Recommended soft-bristle toothbrush and daily interdental brushing.",
    prescription: "Chlorhexidine Gluconate 0.2% mouthwash for 10 days"
  }
];

const initialVisits = [
  {
    id: "VST-101",
    doctor: "Dr. Arvind Mehta",
    specialization: "Internal Medicine",
    hospital: "Apex Multispeciality Hospital",
    visitDate: "2026-08-15",
    reason: "Annual full body physical and bloodwork review",
    notes: "Overall vitals stable. Blood pressure 124/82 mmHg. Pulse 72 bpm. Weight 71 kg.",
    followUpDate: "2027-02-15"
  },
  {
    id: "VST-102",
    doctor: "Dr. Sunita Rao",
    specialization: "Pulmonology",
    hospital: "City Pulmonology Center",
    visitDate: "2026-07-20",
    reason: "Chest congestion and cough evaluation",
    notes: "Spirometry showed mild airway obstruction. Symptoms improving with bronchodilator.",
    followUpDate: "2026-10-20"
  },
  {
    id: "VST-103",
    doctor: "Dr. Priya Nair",
    specialization: "Dermatology",
    hospital: "Skin & Aesthetic Care Clinic",
    visitDate: "2026-03-18",
    reason: "Scalp irritation and facial redness",
    notes: "Dermoscopy negative for fungal infection. Recommended gentle barrier repair cream.",
    followUpDate: "2026-09-18"
  },
  {
    id: "VST-104",
    doctor: "Dr. Rohan Verma",
    specialization: "Ophthalmology",
    hospital: "Vision Care Eye Institute",
    visitDate: "2026-02-10",
    reason: "Routine eye exam and digital screen eye strain",
    notes: "Vision 20/20 with -0.50 D correction. Mild dry eyes due to prolonged laptop exposure.",
    followUpDate: "2027-02-10"
  }
];

const initialPrescriptions = [
  {
    id: "RX-101",
    medicine: "Cholecalciferol (Vitamin D3)",
    dosage: "60,000 IU",
    frequency: "Once weekly",
    duration: "8 weeks",
    doctor: "Dr. Arvind Mehta",
    date: "2026-08-15",
    status: "Active",
    instructions: "Take with a warm glass of milk after breakfast"
  },
  {
    id: "RX-102",
    medicine: "Montelukast Sodium",
    dosage: "10 mg",
    frequency: "Once daily at night",
    duration: "30 days",
    doctor: "Dr. Sunita Rao",
    date: "2026-07-20",
    status: "Active",
    instructions: "Swallow whole before bedtime; avoid taking with citrus juices"
  },
  {
    id: "RX-103",
    medicine: "Levosalbutamol Inhaler",
    dosage: "100 mcg / puff",
    frequency: "As needed (Max 3 times daily)",
    duration: "Ongoing",
    doctor: "Dr. Sunita Rao",
    date: "2026-07-20",
    status: "Active",
    instructions: "Rinse mouth thoroughly with water after each use"
  },
  {
    id: "RX-104",
    medicine: "Ketoconazole Topical Shampoo",
    dosage: "2%",
    frequency: "Twice a week",
    duration: "4 weeks",
    doctor: "Dr. Priya Nair",
    date: "2026-03-18",
    status: "Completed",
    instructions: "Apply to wet scalp, leave for 5 minutes before rinsing off"
  },
  {
    id: "RX-105",
    medicine: "Carboxymethylcellulose Eye Drops",
    dosage: "0.5% w/v",
    frequency: "1 drop in each eye 3 times daily",
    duration: "60 days",
    doctor: "Dr. Rohan Verma",
    date: "2026-02-10",
    status: "Active",
    instructions: "Store in cool place. Discard vial 30 days after opening"
  }
];

const initialDocuments = [
  {
    id: "DOC-101",
    title: "Comprehensive Blood Test & Lipid Profile",
    type: "Lab Report",
    date: "2026-06-10",
    description: "Detailed biochemistry breakdown including CBC, LFT, KFT, and lipid levels.",
    reference: "REF-METRO-2026-0610"
  },
  {
    id: "DOC-102",
    title: "Chest X-Ray PA View Report",
    type: "Scan/Report",
    date: "2026-07-20",
    description: "Radiology assessment showing clear lung fields and normal cardiothoracic ratio.",
    reference: "REF-XRAY-LUNG-8821"
  },
  {
    id: "DOC-103",
    title: "Official Tdap Immunization Certificate",
    type: "Medical Certificate",
    date: "2026-05-04",
    description: "Certified record of Tdap adult booster vaccine batch #TD-9923.",
    reference: "CERT-VAX-2026-TDAP"
  },
  {
    id: "DOC-104",
    title: "Dr. Mehta Annual Consultation Rx Slip",
    type: "Prescription",
    date: "2026-08-15",
    description: "Signed prescription for Vitamin D3 course and preventive lifestyle regimen.",
    reference: "RX-SLIP-AM-8491"
  },
  {
    id: "DOC-105",
    title: "Computerized Vision Field Analysis",
    type: "Scan/Report",
    date: "2026-02-10",
    description: "Detailed ophthalmic refraction map and retinal fundus evaluation.",
    reference: "REF-EYE-VIS-2026"
  }
];

class Store {
  constructor() {
    this.reset();
  }

  reset() {
    this.profile = { ...initialProfile };
    this.records = JSON.parse(JSON.stringify(initialRecords));
    this.visits = JSON.parse(JSON.stringify(initialVisits));
    this.prescriptions = JSON.parse(JSON.stringify(initialPrescriptions));
    this.documents = JSON.parse(JSON.stringify(initialDocuments));
    this.counters = {
      record: 109,
      visit: 105,
      prescription: 106,
      document: 106
    };
  }

  clearData() {
    this.records = [];
    this.visits = [];
    this.prescriptions = [];
    this.documents = [];
    this.counters = {
      record: 1,
      visit: 1,
      prescription: 1,
      document: 1
    };
  }

  generateId(prefix) {
    const keyMap = {
      REC: "record",
      VST: "visit",
      RX: "prescription",
      DOC: "document"
    };
    const counterKey = keyMap[prefix] || "record";
    const id = `${prefix}-${this.counters[counterKey]++}`;
    return id;
  }

  findRecord(id) {
    return this.records.find(r => r.id === id);
  }

  findVisit(id) {
    return this.visits.find(v => v.id === id);
  }

  findPrescription(id) {
    return this.prescriptions.find(p => p.id === id);
  }

  findDocument(id) {
    return this.documents.find(d => d.id === id);
  }
}

const store = new Store();
module.exports = store;
