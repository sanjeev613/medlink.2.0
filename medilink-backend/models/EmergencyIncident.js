const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  incidentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  idempotencyKey: {
    type: String,
    index: true
  },
  patientInfo: {
    name: { type: String, required: true },
    phone: { type: String, default: '+91-98401-23456' },
    age: { type: Number, default: 34 },
    gender: { type: String, default: 'Male' },
    bloodGroup: { type: String, default: 'O+' },
    allergies: { type: [String], default: [] },
    medicalConditions: { type: [String], default: [] },
    currentMedications: { type: [String], default: [] },
    emergencyContact: {
      name: { type: String, default: 'Ananya Ramanathan' },
      phone: { type: String, default: '+91-98409-87654' },
      relation: { type: String, default: 'Spouse' }
    },
    vitals: {
      bp: { type: String, default: '135/85' },
      pulse: { type: Number, default: 112 },
      spO2: { type: Number, default: 94 },
      consciousness: { type: String, default: 'Pain Responsive' }
    }
  },
  location: {
    address: { type: String, default: 'Anna Salai near Guindy Flyover, Chennai, Tamil Nadu' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  triage: {
    emergencyType: {
      type: String,
      enum: ['Accident', 'Cardiac', 'Trauma', 'Stroke', 'Respiratory', 'Pediatric', 'Burn', 'Other'],
      default: 'Accident'
    },
    priority: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'],
      default: 'CRITICAL'
    },
    symptoms: { type: [String], default: [] },
    consciousness: { type: String, default: 'Pain Responsive' },
    breathingDifficulty: { type: Boolean, default: false },
    severeBleeding: { type: Boolean, default: false },
    accidentDetails: { type: String, default: '' },
    ruleExplanation: { type: String, default: '' },
    warningSigns: { type: [String], default: [] },
    missingInfo: { type: [String], default: [] },
    escalationAdvice: { type: String, default: '' },
    clinicianOverride: {
      overridden: { type: Boolean, default: false },
      originalPriority: String,
      overriddenBy: String,
      reason: String,
      timestamp: Date
    },
    disclaimer: {
      type: String,
      default: 'Experimental decision-support only. Unvalidated research prototype. Does not replace clinician diagnosis or dispatcher judgment.'
    }
  },
  status: {
    type: String,
    enum: [
      'SOS_ACTIVATED',
      'REQUEST_RECEIVED',
      'AMBULANCE_ASSIGNED',
      'AMBULANCE_EN_ROUTE',
      'PATIENT_PICKED_UP',
      'HOSPITAL_NOTIFIED',
      'HOSPITAL_ACKNOWLEDGED',
      'PATIENT_ARRIVED',
      'EMERGENCY_COMPLETED',
      'CANCELLED'
    ],
    default: 'SOS_ACTIVATED',
    index: true
  },
  hospitalMatching: {
    suggestedHospitals: [{
      hospitalId: String,
      name: String,
      phone: String,
      distanceKm: Number,
      etaMinutes: Number,
      travelTimeScore: Number,
      capabilityScore: Number,
      availabilityScore: Number,
      readinessScore: Number,
      totalScore: Number,
      availabilityVerified: Boolean,
      keyCapabilities: [String],
      recommendationReason: String
    }],
    selectedHospital: {
      hospitalId: String,
      name: String,
      phone: String,
      status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Declined'],
        default: 'Pending'
      },
      rejectionReason: String,
      respondedAt: Date
    }
  },
  ambulance: {
    ambulanceId: { type: String, default: 'AMB-09' },
    driverName: { type: String, default: 'M. Saravanan' },
    driverPhone: { type: String, default: '+91-94440-11223' },
    vehicleNumber: { type: String, default: 'TN-09-EM-9901' },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ASSIGNED', 'EN_ROUTE', 'PATIENT_PICKED_UP', 'TRANSPORTING', 'ARRIVED', 'UNAVAILABLE'],
      default: 'AVAILABLE'
    },
    currentLocation: {
      latitude: { type: Number, default: 13.0067 },
      longitude: { type: Number, default: 80.2036 }
    },
    routeWaypoints: [{
      lat: Number,
      lng: Number,
      label: String
    }],
    waypointStep: { type: Number, default: 0 },
    etaMinutes: { type: Number, default: 8 },
    distanceRemainingKm: { type: Number, default: 4.2 }
  },
  medicalTeam: {
    assigned: { type: Boolean, default: false },
    leadDoctor: { type: String, default: '' },
    leadNurse: { type: String, default: '' },
    specialists: { type: [String], default: [] },
    teamReady: { type: Boolean, default: false },
    teamReadyAt: Date,
    checklist: [{
      item: String,
      done: { type: Boolean, default: false },
      checkedAt: Date
    }]
  },
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    actor: String,
    description: String
  }],
  metrics: {
    sosActivatedAt: { type: Date, default: Date.now },
    serverAckAt: Date,
    coordinatorNotifiedAt: Date,
    ambulanceAssignedAt: Date,
    hospitalNotifiedAt: Date,
    hospitalAckAt: Date,
    teamReadyAt: Date,
    patientPickedUpAt: Date,
    patientArrivedAt: Date,
    completedAt: Date
  },
  isSimulation: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EmergencyIncident', incidentSchema);
