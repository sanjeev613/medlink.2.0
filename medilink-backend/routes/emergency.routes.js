const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const EmergencyIncident = require('../models/EmergencyIncident');
const { evaluateTriage } = require('../services/triageEngine');
const { matchHospitals } = require('../services/matchingEngine');

// SSE clients for real-time broadcasts
let sseClients = [];

function broadcastEvent(eventType, payload) {
  const data = JSON.stringify({ type: eventType, payload, timestamp: new Date().toISOString() });
  sseClients.forEach(client => {
    try {
      client.res.write(`data: ${data}\n\n`);
    } catch (e) {
      // client disconnected
    }
  });
}

// In-memory incidents store for fast real-time access + Mongo sync
let inMemoryIncidents = new Map();

// Realistic Chennai road coordinates for ambulance route (Guindy to Apollo Greams Road)
const CHENNAI_ROAD_ROUTE = [
  { lat: 13.0067, lng: 80.2036, label: 'Accident Site - Guindy Flyover' },
  { lat: 13.0132, lng: 80.2104, label: 'Passing Saidapet Metro' },
  { lat: 13.0245, lng: 80.2215, label: 'Navigating Nandanam Junction' },
  { lat: 13.0360, lng: 80.2330, label: 'Passing Teynampet / DMS' },
  { lat: 13.0455, lng: 80.2435, label: 'Thousand Lights Anna Salai' },
  { lat: 13.0530, lng: 80.2490, label: 'Turning off Gemini Circle' },
  { lat: 13.0569, lng: 80.2525, label: 'Apollo ER Trauma Bay Entrance' }
];

// Helper: Create default demo incident
function buildDemoIncident() {
  const now = new Date();
  const triageResult = evaluateTriage({
    emergencyType: 'Accident',
    symptoms: ['Severe blunt thoracic impact', 'Arterial leg laceration', 'Labored breathing'],
    consciousness: 'Pain Responsive',
    breathingDifficulty: true,
    severeBleeding: true,
    accidentDetails: 'Two-wheeler and commercial vehicle collision at Guindy flyover junction',
    medicalHistory: ['Mild Asthma', 'Penicillin Allergy']
  });

  const matchingResult = matchHospitals({
    patientLat: 13.0067,
    patientLng: 80.2036,
    emergencyType: 'Accident',
    priority: triageResult.priority
  });

  return {
    incidentId: 'INC-2026-CH01',
    idempotencyKey: 'DEMO-SFIC-2026-KEY-01',
    isSimulation: true,
    status: 'SOS_ACTIVATED',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    patientInfo: {
      name: 'Karthik Ramanathan',
      phone: '+91-98401-23456',
      age: 34,
      gender: 'Male',
      bloodGroup: 'O+',
      allergies: ['Penicillin', 'Sulfa Drugs'],
      medicalConditions: ['Mild Asthma'],
      currentMedications: ['Salbutamol Inhaler SOS'],
      emergencyContact: {
        name: 'Ananya Ramanathan',
        phone: '+91-98409-87654',
        relation: 'Spouse'
      },
      vitals: {
        bp: '135/85',
        pulse: 112,
        spO2: 94,
        consciousness: 'Pain Responsive'
      }
    },
    location: {
      address: 'Anna Salai near Guindy Flyover, Chennai, Tamil Nadu 600032',
      latitude: 13.0067,
      longitude: 80.2036
    },
    triage: triageResult,
    hospitalMatching: {
      suggestedHospitals: matchingResult.recommendations,
      selectedHospital: {
        hospitalId: matchingResult.recommendations[0]?.hospitalId,
        name: matchingResult.recommendations[0]?.name,
        phone: matchingResult.recommendations[0]?.phone,
        status: 'Pending',
        rejectionReason: '',
        respondedAt: null
      }
    },
    ambulance: {
      ambulanceId: 'AMB-09',
      driverName: 'M. Saravanan',
      driverPhone: '+91-94440-11223',
      vehicleNumber: 'TN-09-EM-9901',
      status: 'ASSIGNED',
      currentLocation: {
        latitude: CHENNAI_ROAD_ROUTE[0].lat,
        longitude: CHENNAI_ROAD_ROUTE[0].lng
      },
      routeWaypoints: CHENNAI_ROAD_ROUTE,
      waypointStep: 0,
      etaMinutes: 8,
      distanceRemainingKm: 4.2
    },
    medicalTeam: {
      assigned: false,
      leadDoctor: '',
      leadNurse: '',
      specialists: ['Trauma Surgeon', 'ER Triage Nurse', 'Anesthesiologist'],
      teamReady: false,
      teamReadyAt: null,
      checklist: [
        { item: 'Trauma Resuscitation Bay 1 Sterilized & Cleared', done: false, checkedAt: null },
        { item: 'O-Negative Packed Red Blood Cells (PRBC) on Standby', done: false, checkedAt: null },
        { item: 'Rapid Infuser & Level 1 Warmer Preheated', done: false, checkedAt: null },
        { item: 'Emergency CT Trauma Protocol Angio Scanner Reserved', done: false, checkedAt: null },
        { item: 'Emergency Airway & Fiberoptic Intubation Kit Checked', done: false, checkedAt: null }
      ]
    },
    timeline: [
      {
        status: 'SOS_ACTIVATED',
        timestamp: now.toISOString(),
        actor: 'Patient / Mobile App',
        description: 'Emergency SOS activated at Guindy Flyover. GPS coordinates acquired.'
      },
      {
        status: 'REQUEST_RECEIVED',
        timestamp: new Date(now.getTime() + 1200).toISOString(),
        actor: 'MediLink Gateway',
        description: 'Incident verified and acknowledged by Central Gateway. AI Triage classified as CRITICAL.'
      }
    ],
    metrics: {
      sosActivatedAt: now.toISOString(),
      serverAckAt: new Date(now.getTime() + 1200).toISOString(),
      coordinatorNotifiedAt: new Date(now.getTime() + 2400).toISOString(),
      ambulanceAssignedAt: new Date(now.getTime() + 5000).toISOString(),
      hospitalNotifiedAt: null,
      hospitalAckAt: null,
      teamReadyAt: null,
      patientPickedUpAt: null,
      patientArrivedAt: null,
      completedAt: null
    }
  };
}

// Initialize seed demo in memory
const initialDemo = buildDemoIncident();
inMemoryIncidents.set(initialDemo.incidentId, initialDemo);

/**
 * GET /api/emergency/events
 * Server-Sent Events stream for real-time reactive sync across all dashboards
 */
router.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const clientId = Date.now() + Math.random().toString();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial ping and active incidents snapshot
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId, activeCount: inMemoryIncidents.size })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

/**
 * POST /api/emergency/sos
 * Phase 1: One-tap Emergency SOS Activation with Offline Idempotency & Deduplication
 */
router.post('/sos', async (req, res) => {
  try {
    const {
      idempotencyKey,
      latitude,
      longitude,
      address,
      patientInfo = {},
      emergencyType = 'Accident',
      symptoms = [],
      consciousness = 'Alert',
      breathingDifficulty = false,
      severeBleeding = false,
      accidentDetails = ''
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, error: 'GPS coordinates (latitude, longitude) required' });
    }

    // Check duplicate submission
    if (idempotencyKey) {
      for (const [id, inc] of inMemoryIncidents.entries()) {
        if (inc.idempotencyKey === idempotencyKey) {
          return res.json({
            success: true,
            isDuplicate: true,
            incident: inc,
            message: 'Duplicate SOS request detected; returning active incident.'
          });
        }
      }
    }

    const incidentCount = inMemoryIncidents.size + 1;
    const incidentId = `INC-2026-CH${String(incidentCount).padStart(2, '0')}`;
    const now = new Date();

    // AI Triage
    const triage = evaluateTriage({
      emergencyType,
      symptoms,
      consciousness,
      breathingDifficulty,
      severeBleeding,
      accidentDetails,
      medicalHistory: patientInfo.medicalConditions || []
    });

    // Hospital Matching
    const matching = matchHospitals({
      patientLat: Number(latitude),
      patientLng: Number(longitude),
      emergencyType,
      priority: triage.priority
    });

    const topHospital = matching.recommendations[0] || null;

    const newIncident = {
      incidentId,
      idempotencyKey: idempotencyKey || `KEY-${Date.now()}`,
      isSimulation: true,
      status: 'SOS_ACTIVATED',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      patientInfo: {
        name: patientInfo.name || 'Emergency Patient',
        phone: patientInfo.phone || '+91-98401-23456',
        age: patientInfo.age || 34,
        gender: patientInfo.gender || 'Not Specified',
        bloodGroup: patientInfo.bloodGroup || 'O+',
        allergies: patientInfo.allergies || ['None Reported'],
        medicalConditions: patientInfo.medicalConditions || [],
        currentMedications: patientInfo.currentMedications || [],
        emergencyContact: patientInfo.emergencyContact || { name: 'Emergency Contact', phone: '112' },
        vitals: patientInfo.vitals || { bp: '120/80', pulse: 90, spO2: 98, consciousness }
      },
      location: {
        address: address || 'Current User GPS Location',
        latitude: Number(latitude),
        longitude: Number(longitude)
      },
      triage,
      hospitalMatching: {
        suggestedHospitals: matching.recommendations,
        selectedHospital: {
          hospitalId: topHospital?.hospitalId,
          name: topHospital?.name,
          phone: topHospital?.phone,
          status: 'Pending',
          rejectionReason: '',
          respondedAt: null
        }
      },
      ambulance: {
        ambulanceId: 'AMB-09',
        driverName: 'M. Saravanan',
        driverPhone: '+91-94440-11223',
        vehicleNumber: 'TN-09-EM-9901',
        status: 'ASSIGNED',
        currentLocation: {
          latitude: Number(latitude),
          longitude: Number(longitude)
        },
        routeWaypoints: CHENNAI_ROAD_ROUTE,
        waypointStep: 0,
        etaMinutes: topHospital ? topHospital.etaMinutes : 8,
        distanceRemainingKm: topHospital ? topHospital.distanceKm : 4.2
      },
      medicalTeam: {
        assigned: false,
        leadDoctor: '',
        leadNurse: '',
        specialists: ['Trauma Surgeon', 'ER Triage Nurse'],
        teamReady: false,
        teamReadyAt: null,
        checklist: [
          { item: 'Trauma Resuscitation Bay 1 Sterilized & Cleared', done: false, checkedAt: null },
          { item: 'O-Negative Packed Red Blood Cells (PRBC) on Standby', done: false, checkedAt: null },
          { item: 'Rapid Infuser & Level 1 Warmer Preheated', done: false, checkedAt: null },
          { item: 'Emergency CT Trauma Protocol Angio Scanner Reserved', done: false, checkedAt: null },
          { item: 'Emergency Airway & Fiberoptic Intubation Kit Checked', done: false, checkedAt: null }
        ]
      },
      timeline: [
        {
          status: 'SOS_ACTIVATED',
          timestamp: now.toISOString(),
          actor: 'Patient / Mobile App',
          description: `SOS activated. Incident ID ${incidentId} created.`
        },
        {
          status: 'REQUEST_RECEIVED',
          timestamp: new Date(now.getTime() + 1000).toISOString(),
          actor: 'MediLink Gateway',
          description: `Triage Priority: ${triage.priority}. Recommended ${matching.recommendations.length} suitable hospitals.`
        }
      ],
      metrics: {
        sosActivatedAt: now.toISOString(),
        serverAckAt: new Date(now.getTime() + 1000).toISOString(),
        coordinatorNotifiedAt: new Date(now.getTime() + 2000).toISOString(),
        ambulanceAssignedAt: null,
        hospitalNotifiedAt: null,
        hospitalAckAt: null,
        teamReadyAt: null,
        patientPickedUpAt: null,
        patientArrivedAt: null,
        completedAt: null
      }
    };

    inMemoryIncidents.set(incidentId, newIncident);

    // Also persist to MongoDB asynchronously
    EmergencyIncident.findOneAndUpdate(
      { incidentId: newIncident.incidentId },
      newIncident,
      { upsert: true, new: true }
    ).catch(e => console.warn('Mongo upsert notice:', e.message));

    // Broadcast SSE
    broadcastEvent('INCIDENT_CREATED', newIncident);

    res.status(201).json({
      success: true,
      message: 'Emergency incident created successfully',
      incident: newIncident
    });
  } catch (error) {
    console.error('SOS activation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/emergency/triage
 * Phase 2: Standalone AI Triage Evaluation Endpoint
 */
router.post('/triage', (req, res) => {
  try {
    const result = evaluateTriage(req.body);
    res.json({ success: true, triage: result });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/emergency/matching
 * Phase 3: Intelligent Hospital Matching Engine Endpoint
 */
router.get('/matching', (req, res) => {
  try {
    const { lat, lng, emergencyType, priority } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'Query parameters lat and lng are required' });
    }
    const result = matchHospitals({
      patientLat: parseFloat(lat),
      patientLng: parseFloat(lng),
      emergencyType: emergencyType || 'Accident',
      priority: priority || 'CRITICAL'
    });
    res.json({ success: true, matching: result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/emergency/incidents
 * Phase 7: List all emergency incidents with search & filters
 */
router.get('/incidents', (req, res) => {
  const { priority, status, search } = req.query;
  let list = Array.from(inMemoryIncidents.values());

  if (priority && priority !== 'ALL') {
    list = list.filter(i => i.triage?.priority === priority);
  }
  if (status && status !== 'ALL') {
    list = list.filter(i => i.status === status);
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(i =>
      i.incidentId.toLowerCase().includes(s) ||
      i.patientInfo?.name.toLowerCase().includes(s) ||
      i.location?.address.toLowerCase().includes(s)
    );
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, count: list.length, incidents: list });
});

/**
 * GET /api/emergency/incidents/:id
 * Retrieve single incident
 */
router.get('/incidents/:id', (req, res) => {
  const inc = inMemoryIncidents.get(req.params.id);
  if (!inc) {
    return res.status(404).json({ success: false, error: 'Incident not found' });
  }
  res.json({ success: true, incident: inc });
});

/**
 * PATCH /api/emergency/incidents/:id/status
 * Phase 1 & 4: Status progression with timeline event audit
 */
router.patch('/incidents/:id/status', async (req, res) => {
  const { status, actor = 'System', note = '' } = req.body;
  const inc = inMemoryIncidents.get(req.params.id);
  if (!inc) {
    return res.status(404).json({ success: false, error: 'Incident not found' });
  }

  const validStatuses = [
    'SOS_ACTIVATED', 'REQUEST_RECEIVED', 'AMBULANCE_ASSIGNED', 'AMBULANCE_EN_ROUTE',
    'PATIENT_PICKED_UP', 'HOSPITAL_NOTIFIED', 'HOSPITAL_ACKNOWLEDGED', 'PATIENT_ARRIVED',
    'EMERGENCY_COMPLETED', 'CANCELLED'
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: `Invalid status: ${status}` });
  }

  const now = new Date();
  inc.status = status;
  inc.updatedAt = now.toISOString();

  // Metrics tracking
  if (status === 'AMBULANCE_ASSIGNED') inc.metrics.ambulanceAssignedAt = now.toISOString();
  if (status === 'HOSPITAL_NOTIFIED') inc.metrics.hospitalNotifiedAt = now.toISOString();
  if (status === 'HOSPITAL_ACKNOWLEDGED') inc.metrics.hospitalAckAt = now.toISOString();
  if (status === 'PATIENT_PICKED_UP') inc.metrics.patientPickedUpAt = now.toISOString();
  if (status === 'PATIENT_ARRIVED') inc.metrics.patientArrivedAt = now.toISOString();
  if (status === 'EMERGENCY_COMPLETED') inc.metrics.completedAt = now.toISOString();

  // Add timeline entry
  inc.timeline.push({
    status,
    timestamp: now.toISOString(),
    actor,
    description: note || `Status progressed to ${status}`
  });

  inMemoryIncidents.set(inc.incidentId, inc);
  EmergencyIncident.findOneAndUpdate({ incidentId: inc.incidentId }, inc).catch(() => {});

  broadcastEvent('INCIDENT_STATUS_UPDATED', inc);

  res.json({ success: true, incident: inc });
});

/**
 * POST /api/emergency/incidents/:id/assign-hospital
 * Phase 3 & 4: Coordinator selects receiving hospital
 */
router.post('/incidents/:id/assign-hospital', (req, res) => {
  const { hospitalId, hospitalName, phone } = req.body;
  const inc = inMemoryIncidents.get(req.params.id);
  if (!inc) return res.status(404).json({ success: false, error: 'Incident not found' });

  const now = new Date();
  inc.hospitalMatching.selectedHospital = {
    hospitalId,
    name: hospitalName,
    phone,
    status: 'Pending',
    rejectionReason: '',
    respondedAt: null
  };
  inc.status = 'HOSPITAL_NOTIFIED';
  inc.metrics.hospitalNotifiedAt = now.toISOString();

  inc.timeline.push({
    status: 'HOSPITAL_NOTIFIED',
    timestamp: now.toISOString(),
    actor: 'Emergency Coordinator',
    description: `Dispatched pre-arrival alert to receiving hospital: ${hospitalName}`
  });

  inMemoryIncidents.set(inc.incidentId, inc);
  broadcastEvent('HOSPITAL_NOTIFIED', inc);

  res.json({ success: true, incident: inc });
});

/**
 * POST /api/emergency/incidents/:id/hospital-ack
 * Phase 4: Hospital reviews, accepts or declines emergency
 */
router.post('/incidents/:id/hospital-ack', (req, res) => {
  const { decision, reason = '', hospitalName = 'Apollo Hospital' } = req.body; // 'Accepted' | 'Declined'
  const inc = inMemoryIncidents.get(req.params.id);
  if (!inc) return res.status(404).json({ success: false, error: 'Incident not found' });

  const now = new Date();
  inc.hospitalMatching.selectedHospital.status = decision;
  inc.hospitalMatching.selectedHospital.rejectionReason = reason;
  inc.hospitalMatching.selectedHospital.respondedAt = now.toISOString();

  if (decision === 'Accepted') {
    inc.status = 'HOSPITAL_ACKNOWLEDGED';
    inc.metrics.hospitalAckAt = now.toISOString();
    inc.timeline.push({
      status: 'HOSPITAL_ACKNOWLEDGED',
      timestamp: now.toISOString(),
      actor: `${hospitalName} ER Desk`,
      description: `Hospital ACCEPTED emergency. Trauma team mobilization initiated.`
    });
  } else {
    inc.timeline.push({
      status: 'HOSPITAL_DECLINED',
      timestamp: now.toISOString(),
      actor: `${hospitalName} ER Desk`,
      description: `Hospital UNABLE TO ACCEPT: ${reason}. Alerting coordinator for immediate re-matching.`
    });
  }

  inMemoryIncidents.set(inc.incidentId, inc);
  broadcastEvent('HOSPITAL_ACKNOWLEDGED', inc);

  res.json({ success: true, decision, incident: inc });
});

/**
 * POST /api/emergency/incidents/:id/assign-team
 * Phase 4: Hospital assigns trauma doctors and nurses
 */
router.post('/incidents/:id/assign-team', (req, res) => {
  const { leadDoctor, leadNurse, specialists = [] } = req.body;
  const inc = inMemoryIncidents.get(req.params.id);
  if (!inc) return res.status(404).json({ success: false, error: 'Incident not found' });

  const now = new Date();
  inc.medicalTeam.assigned = true;
  inc.medicalTeam.leadDoctor = leadDoctor || 'Dr. Anand Krishnamoorthy (Chief Trauma Surgeon)';
  inc.medicalTeam.leadNurse = leadNurse || 'Sister Priya Selvam (Senior ER Triage Nurse)';
  if (specialists.length > 0) inc.medicalTeam.specialists = specialists;

  inc.timeline.push({
    status: 'TEAM_ASSIGNED',
    timestamp: now.toISOString(),
    actor: 'Hospital Administration',
    description: `Medical Team Assigned: ${inc.medicalTeam.leadDoctor} & ${inc.medicalTeam.leadNurse}`
  });

  inMemoryIncidents.set(inc.incidentId, inc);
  broadcastEvent('TEAM_ASSIGNED', inc);

  res.json({ success: true, incident: inc });
});

/**
 * POST /api/emergency/incidents/:id/toggle-checklist
 * Phase 4: Toggle pre-arrival readiness checklist items
 */
router.post('/incidents/:id/toggle-checklist', (req, res) => {
  const { itemIndex } = req.body;
  const inc = inMemoryIncidents.get(req.params.id);
  if (!inc) return res.status(404).json({ success: false, error: 'Incident not found' });

  if (inc.medicalTeam.checklist[itemIndex]) {
    const current = inc.medicalTeam.checklist[itemIndex].done;
    inc.medicalTeam.checklist[itemIndex].done = !current;
    inc.medicalTeam.checklist[itemIndex].checkedAt = !current ? new Date().toISOString() : null;
  }

  inMemoryIncidents.set(inc.incidentId, inc);
  broadcastEvent('CHECKLIST_UPDATED', inc);

  res.json({ success: true, checklist: inc.medicalTeam.checklist });
});

/**
 * POST /api/emergency/incidents/:id/mark-team-ready
 * Phase 4: Mark medical team and trauma bay ready
 */
router.post('/incidents/:id/mark-team-ready', (req, res) => {
  const inc = inMemoryIncidents.get(req.params.id);
  if (!inc) return res.status(404).json({ success: false, error: 'Incident not found' });

  const now = new Date();
  inc.medicalTeam.teamReady = true;
  inc.medicalTeam.teamReadyAt = now.toISOString();
  inc.metrics.teamReadyAt = now.toISOString();

  // Mark all checklist items as done
  inc.medicalTeam.checklist.forEach(item => {
    item.done = true;
    item.checkedAt = now.toISOString();
  });

  inc.timeline.push({
    status: 'TEAM_READY',
    timestamp: now.toISOString(),
    actor: 'Trauma Lead',
    description: 'Resuscitation Bay and Trauma Team are READY. Standing by for patient intake.'
  });

  inMemoryIncidents.set(inc.incidentId, inc);
  broadcastEvent('TEAM_READY', inc);

  res.json({ success: true, incident: inc });
});

/**
 * POST /api/emergency/incidents/:id/ambulance-step
 * Phase 5: Advances ambulance position along real road route
 */
router.post('/incidents/:id/ambulance-step', (req, res) => {
  const inc = inMemoryIncidents.get(req.params.id);
  if (!inc) return res.status(404).json({ success: false, error: 'Incident not found' });

  let step = (inc.ambulance.waypointStep || 0) + 1;
  if (step >= CHENNAI_ROAD_ROUTE.length) {
    step = CHENNAI_ROAD_ROUTE.length - 1;
  }

  const wp = CHENNAI_ROAD_ROUTE[step];
  inc.ambulance.waypointStep = step;
  inc.ambulance.currentLocation = { latitude: wp.lat, longitude: wp.lng };

  const fractionRemaining = (CHENNAI_ROAD_ROUTE.length - 1 - step) / (CHENNAI_ROAD_ROUTE.length - 1);
  inc.ambulance.distanceRemainingKm = parseFloat((4.2 * fractionRemaining).toFixed(1));
  inc.ambulance.etaMinutes = Math.max(0, Math.round(8 * fractionRemaining));

  if (step === 1 && inc.ambulance.status !== 'EN_ROUTE') {
    inc.ambulance.status = 'EN_ROUTE';
    inc.status = 'AMBULANCE_EN_ROUTE';
  } else if (step === 3 && inc.status !== 'PATIENT_PICKED_UP') {
    inc.ambulance.status = 'PATIENT_PICKED_UP';
    inc.status = 'PATIENT_PICKED_UP';
    inc.metrics.patientPickedUpAt = new Date().toISOString();
    inc.timeline.push({
      status: 'PATIENT_PICKED_UP',
      timestamp: new Date().toISOString(),
      actor: `Ambulance Driver (${inc.ambulance.driverName})`,
      description: 'Patient stabilized on stretcher. Departing scene toward receiving hospital.'
    });
  } else if (step === CHENNAI_ROAD_ROUTE.length - 1 && inc.status !== 'PATIENT_ARRIVED') {
    inc.ambulance.status = 'ARRIVED';
    inc.status = 'PATIENT_ARRIVED';
    inc.metrics.patientArrivedAt = new Date().toISOString();
    inc.timeline.push({
      status: 'PATIENT_ARRIVED',
      timestamp: new Date().toISOString(),
      actor: `Ambulance Unit ${inc.ambulance.ambulanceId}`,
      description: 'Ambulance arrived at Trauma Bay 1. Patient handed over to attending trauma team.'
    });
  }

  inMemoryIncidents.set(inc.incidentId, inc);
  broadcastEvent('AMBULANCE_UPDATED', inc);

  res.json({
    success: true,
    waypointStep: step,
    waypoint: wp,
    etaMinutes: inc.ambulance.etaMinutes,
    distanceRemainingKm: inc.ambulance.distanceRemainingKm,
    incident: inc
  });
});

/**
 * POST /api/emergency/incidents/:id/override-triage
 * Phase 2: Clinician Triage Override
 */
router.post('/incidents/:id/override-triage', (req, res) => {
  const { newPriority, clinicianName = 'Dr. Anand', reason = 'Clinical evaluation of chest injury' } = req.body;
  const inc = inMemoryIncidents.get(req.params.id);
  if (!inc) return res.status(404).json({ success: false, error: 'Incident not found' });

  const oldPriority = inc.triage.priority;
  inc.triage.priority = newPriority;
  inc.triage.clinicianOverride = {
    overridden: true,
    originalPriority: oldPriority,
    overriddenBy: clinicianName,
    reason,
    timestamp: new Date().toISOString()
  };

  inc.timeline.push({
    status: 'TRIAGE_OVERRIDDEN',
    timestamp: new Date().toISOString(),
    actor: clinicianName,
    description: `Triage priority overridden from ${oldPriority} to ${newPriority}. Rationale: ${reason}`
  });

  inMemoryIncidents.set(inc.incidentId, inc);
  broadcastEvent('TRIAGE_OVERRIDDEN', inc);

  res.json({ success: true, triage: inc.triage, incident: inc });
});

/**
 * GET /api/emergency/analytics
 * Phase 8: Measurable Impact & Baseline Comparison Dashboard
 */
router.get('/analytics', (req, res) => {
  const incidents = Array.from(inMemoryIncidents.values());

  // Metrics for SFIC comparison
  const analyticsData = {
    totalIncidents: incidents.length,
    criticalIncidents: incidents.filter(i => i.triage?.priority === 'CRITICAL').length,
    highIncidents: incidents.filter(i => i.triage?.priority === 'HIGH').length,
    moderateIncidents: incidents.filter(i => i.triage?.priority === 'MODERATE').length,
    lowIncidents: incidents.filter(i => i.triage?.priority === 'LOW').length,
    responseTimes: {
      averageAckSeconds: 1.2,
      averageAmbulanceDispatchMinutes: 2.4,
      averageHospitalAckSeconds: 38.0,
      averageMedicalTeamReadyMinutes: 4.5,
      p95ResponseTimeSeconds: 52.0,
      completionRatePercent: 98.2
    },
    // Comparison: Traditional Phone vs MediLink 2.0
    baselineComparison: [
      { metric: 'Incident Discovery to Dispatch', traditionalManualMinutes: 14.5, mediLinkMinutes: 2.1, improvementPercent: 85.5 },
      { metric: 'Hospital Identification & Selection', traditionalManualMinutes: 12.0, mediLinkMinutes: 0.8, improvementPercent: 93.3 },
      { metric: 'Hospital Pre-Alert & Acknowledgement', traditionalManualMinutes: 16.0, mediLinkMinutes: 1.2, improvementPercent: 92.5 },
      { metric: 'Medical Team Pre-Arrival Preparation', traditionalManualMinutes: 18.5, mediLinkMinutes: 4.5, improvementPercent: 75.7 },
      { metric: 'Total Pre-Hospital Coordination Delay', traditionalManualMinutes: 46.0, mediLinkMinutes: 12.0, improvementPercent: 73.9 }
    ],
    hourlyDistribution: [
      { hour: '00:00', calls: 3 },
      { hour: '04:00', calls: 2 },
      { hour: '08:00', calls: 14 },
      { hour: '12:00', calls: 18 },
      { hour: '16:00', calls: 22 },
      { hour: '20:00', calls: 15 }
    ],
    disclaimer: 'Simulated baseline benchmark comparison data compiled for SFIC 2026 prototype evaluation. Not a substitute for peer-reviewed clinical trial validation.'
  };

  res.json({ success: true, analytics: analyticsData });
});

/**
 * POST /api/emergency/demo/init
 * Phase 11: Initialize / Reset SFIC 2026 Chennai Road Accident Demo Scenario
 */
router.post('/demo/init', (req, res) => {
  const demoInc = buildDemoIncident();
  inMemoryIncidents.set(demoInc.incidentId, demoInc);
  broadcastEvent('DEMO_RESET', demoInc);
  res.json({
    success: true,
    message: 'SFIC 2026 Road Accident Demo scenario initialized successfully',
    incident: demoInc
  });
});

/**
 * POST /api/emergency/demo/reset
 * Clean reset
 */
router.post('/demo/reset', (req, res) => {
  inMemoryIncidents.clear();
  const demoInc = buildDemoIncident();
  inMemoryIncidents.set(demoInc.incidentId, demoInc);
  broadcastEvent('DEMO_RESET', demoInc);
  res.json({
    success: true,
    message: 'All demo data reset to clean baseline',
    incident: demoInc
  });
});

module.exports = router;
