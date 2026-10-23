const BACKEND_URL = 'http://localhost:5000/api/emergency';

// Fallback initial incident state
const DEFAULT_DEMO_INCIDENT = {
  incidentId: 'INC-2026-CH01',
  idempotencyKey: 'INC-EMG-CHN-01',
  status: 'SOS_ACTIVATED',
  patientInfo: {
    name: 'Karthik Ramanathan',
    phone: '+91-98401-23456',
    age: 34,
    gender: 'Male',
    bloodGroup: 'O+',
    allergies: ['Penicillin', 'Sulfa Drugs'],
    medicalConditions: ['Mild Asthma'],
    currentMedications: ['Salbutamol Inhaler SOS'],
    emergencyContact: { name: 'Ananya Ramanathan (Spouse)', phone: '+91-98409-87654' },
    vitals: { bp: '135/85', pulse: 112, spO2: 94, consciousness: 'Pain Responsive' }
  },
  location: {
    address: 'Anna Salai near Guindy Flyover, Chennai, Tamil Nadu',
    latitude: 13.0067,
    longitude: 80.2036
  },
  triage: {
    emergencyType: 'Accident',
    priority: 'CRITICAL',
    ruleExplanation: 'Critical triage assigned due to severe active bleeding and compromised respiratory effort following high-impact road traffic incident.',
    warningSigns: ['Suspected hemorrhagic shock', 'Tension pneumothorax risk', 'Uncontrolled external hemorrhage'],
    missingInfo: ['Exact speed of collision', 'C-Spine imaging pending'],
    escalationAdvice: 'Immediate Trauma Level 1 dispatch. Notify receiving hospital to prepare trauma resuscitation bay.',
    disclaimer: 'Experimental decision support only. Unvalidated research prototype. Does not replace clinician diagnosis.'
  },
  hospitalMatching: {
    suggestedHospitals: [
      {
        hospitalId: 'HOSP-CHN-01',
        name: 'Apollo Speciality Hospital, OMR / Greams Road',
        distanceKm: 4.2,
        etaMinutes: 8,
        totalScore: 93.85,
        availabilityVerified: true,
        verifiedStatusLabel: 'Verified live by hospital staff',
        readinessStatus: 'Ready',
        keyCapabilities: ['Level 1 Trauma Center', '24/7 Blood Bank', 'Neuro ICU'],
        recommendationReason: 'Optimal Level-1 trauma capability within rapid 8 min transit window.'
      },
      {
        hospitalId: 'HOSP-CHN-02',
        name: 'Rajiv Gandhi Government General Hospital (RGGGH)',
        distanceKm: 7.8,
        etaMinutes: 14,
        totalScore: 88.4,
        availabilityVerified: true,
        verifiedStatusLabel: 'Verified live by hospital staff',
        readinessStatus: 'Ready',
        keyCapabilities: ['Apex Government Trauma Center', '24/7 Blood Bank', 'Burn ICU'],
        recommendationReason: 'Comprehensive tertiary trauma facilities (14 min transit).'
      },
      {
        hospitalId: 'HOSP-CHN-03',
        name: 'MIOT International Hospital',
        distanceKm: 6.1,
        etaMinutes: 12,
        totalScore: 83.1,
        availabilityVerified: false,
        verifiedStatusLabel: 'Availability not verified',
        readinessStatus: 'Normal',
        keyCapabilities: ['Level 1 Trauma Center', 'Orthopedic Specialty'],
        recommendationReason: 'Secondary trauma hospital option.'
      }
    ],
    selectedHospital: {
      hospitalId: 'HOSP-CHN-01',
      name: 'Apollo Speciality Hospital, OMR / Greams Road',
      phone: '+91-44-2829-0200',
      status: 'Pending'
    }
  },
  ambulance: {
    ambulanceId: 'AMB-09',
    driverName: 'M. Saravanan',
    driverPhone: '+91-94440-11223',
    vehicleNumber: 'TN-09-EM-9901',
    status: 'ASSIGNED',
    currentLocation: { latitude: 13.0067, longitude: 80.2036 },
    routeWaypoints: [
      { lat: 13.0067, lng: 80.2036, label: 'Accident Site - Guindy Flyover' },
      { lat: 13.0132, lng: 80.2104, label: 'Saidapet Metro / Bridge' },
      { lat: 13.0245, lng: 80.2215, label: 'Nandanam Junction' },
      { lat: 13.0360, lng: 80.2330, label: 'Teynampet / DMS Metro' },
      { lat: 13.0455, lng: 80.2435, label: 'Thousand Lights Anna Salai' },
      { lat: 13.0530, lng: 80.2490, label: 'Gemini Circle Turn' },
      { lat: 13.0569, lng: 80.2525, label: 'Apollo ER Bay (Greams Road)' }
    ],
    waypointStep: 0,
    etaMinutes: 8,
    distanceRemainingKm: 4.2
  },
  medicalTeam: {
    assigned: false,
    leadDoctor: '',
    leadNurse: '',
    specialists: ['Trauma Surgeon', 'ER Triage Nurse'],
    teamReady: false,
    checklist: [
      { item: 'Trauma Resuscitation Bay 1 Sterilized & Cleared', done: false },
      { item: 'O-Negative Packed Red Blood Cells (PRBC) on Standby', done: false },
      { item: 'Rapid Infuser & Level 1 Warmer Preheated', done: false },
      { item: 'Emergency CT Trauma Protocol Angio Scanner Reserved', done: false },
      { item: 'Emergency Airway & Fiberoptic Intubation Kit Checked', done: false }
    ]
  },
  timeline: [
    {
      status: 'SOS_ACTIVATED',
      timestamp: new Date().toISOString(),
      actor: 'Patient / Mobile App',
      description: 'Emergency SOS activated at Guindy Flyover. GPS coordinates acquired.'
    },
    {
      status: 'REQUEST_RECEIVED',
      timestamp: new Date().toISOString(),
      actor: 'MediLink Gateway',
      description: 'Incident verified. AI Triage classified as CRITICAL.'
    }
  ]
};

export async function fetchIncidents() {
  try {
    const res = await fetch(`${BACKEND_URL}/incidents`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.incidents && data.incidents.length > 0) {
      return data.incidents;
    }
  } catch (e) {
    console.warn('Backend offline, using local fallback:', e.message);
  }
  return [DEFAULT_DEMO_INCIDENT];
}

export async function triggerSOS(payload) {
  try {
    const res = await fetch(`${BACKEND_URL}/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) return data.incident;
  } catch (e) {
    console.warn('Failed to post SOS to backend, creating local incident:', e.message);
  }
  return {
    ...DEFAULT_DEMO_INCIDENT,
    incidentId: `INC-${Date.now().toString().slice(-4)}`,
    triage: {
      ...DEFAULT_DEMO_INCIDENT.triage,
      emergencyType: payload.emergencyType || 'Accident'
    }
  };
}

export async function updateIncidentStatus(incidentId, status, actor = 'System', note = '') {
  try {
    const res = await fetch(`${BACKEND_URL}/incidents/${incidentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, actor, note })
    });
    const data = await res.json();
    if (data.success) return data.incident;
  } catch (e) {
    console.warn('Status patch fallback:', e.message);
  }
  return null;
}

export async function assignHospital(incidentId, hosp) {
  try {
    const res = await fetch(`${BACKEND_URL}/incidents/${incidentId}/assign-hospital`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospitalId: hosp.hospitalId,
        hospitalName: hosp.name,
        phone: hosp.phone
      })
    });
    const data = await res.json();
    if (data.success) return data.incident;
  } catch (e) {
    console.warn('Assign hospital fallback:', e.message);
  }
  return null;
}

export async function hospitalAck(incidentId, decision, reason = '', hospitalName = 'Apollo Hospital') {
  try {
    const res = await fetch(`${BACKEND_URL}/incidents/${incidentId}/hospital-ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reason, hospitalName })
    });
    const data = await res.json();
    if (data.success) return data.incident;
  } catch (e) {
    console.warn('Hospital ack fallback:', e.message);
  }
  return null;
}

export async function assignMedicalTeam(incidentId, team) {
  try {
    const res = await fetch(`${BACKEND_URL}/incidents/${incidentId}/assign-team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team)
    });
    const data = await res.json();
    if (data.success) return data.incident;
  } catch (e) {
    console.warn('Assign team fallback:', e.message);
  }
  return null;
}

export async function toggleChecklistItem(incidentId, itemIndex) {
  try {
    const res = await fetch(`${BACKEND_URL}/incidents/${incidentId}/toggle-checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemIndex })
    });
    const data = await res.json();
    if (data.success) return data.checklist;
  } catch (e) {
    console.warn('Toggle checklist fallback:', e.message);
  }
  return null;
}

export async function markTeamReady(incidentId) {
  try {
    const res = await fetch(`${BACKEND_URL}/incidents/${incidentId}/mark-team-ready`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    if (data.success) return data.incident;
  } catch (e) {
    console.warn('Mark team ready fallback:', e.message);
  }
  return null;
}

export async function advanceAmbulance(incidentId) {
  try {
    const res = await fetch(`${BACKEND_URL}/incidents/${incidentId}/ambulance-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    if (data.success) return data.incident;
  } catch (e) {
    console.warn('Advance ambulance fallback:', e.message);
  }
  return null;
}

export async function overrideTriagePriority(incidentId, newPriority, reason) {
  try {
    const res = await fetch(`${BACKEND_URL}/incidents/${incidentId}/override-triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPriority, reason })
    });
    const data = await res.json();
    if (data.success) return data.incident;
  } catch (e) {
    console.warn('Override triage fallback:', e.message);
  }
  return null;
}

export async function fetchAnalytics() {
  try {
    const res = await fetch(`${BACKEND_URL}/analytics`);
    const data = await res.json();
    if (data.success) return data.analytics;
  } catch (e) {
    console.warn('Fetch analytics fallback:', e.message);
  }
  return null;
}

export async function resetDemoScenario() {
  try {
    const res = await fetch(`${BACKEND_URL}/demo/reset`, { method: 'POST' });
    const data = await res.json();
    if (data.success) return data.incident;
  } catch (e) {
    console.warn('Reset demo fallback:', e.message);
  }
  return DEFAULT_DEMO_INCIDENT;
}
