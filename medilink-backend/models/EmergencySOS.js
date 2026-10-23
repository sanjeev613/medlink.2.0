const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Emergency Details
  emergencyType: {
    type: String,
    enum: ['Medical', 'Accident', 'Other'],
    default: 'Medical'
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'High'
  },
  description: String,
  
  // Location Data
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  address: String,
  
  // Ambulance Assignment
  ambulanceId: mongoose.Schema.Types.ObjectId,
  ambulanceDriverName: String,
  ambulanceDriverPhone: String,
  ambulanceLicense: String,
  ambulanceLocation: {
    latitude: Number,
    longitude: Number
  },
  estimatedArrivalTime: Number, // in minutes
  
  // Hospital Selection
  selectedHospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  selectedHospitalName: String,
  hospitalLatitude: Number,
  hospitalLongitude: Number,
  estimatedReachTime: Number, // in minutes
  
  // Status Tracking
  status: {
    type: String,
    enum: ['Initiated', 'Ambulance_Assigned', 'In_Transit', 'Hospital_Alert_Sent', 'Arrived', 'Cancelled', 'Completed'],
    default: 'Initiated'
  },
  
  // Hospital Response
  hospitalResponseStatus: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending'
  },
  hospitalReceivedAt: Date,
  hospitalAcceptedAt: Date,
  hospitalRejectionReason: String,
  
  // Medical Data Sent
  medicalDataSent: {
    type: Boolean,
    default: false
  },
  medicalDataSentAt: Date,
  
  // AI Prediction Data
  aiPredictionShared: {
    type: Boolean,
    default: false
  },
  aiPredictionData: {
    primaryRisk: String,
    riskLevel: String,
    suggestedTests: [String],
    preventiveMeasures: [String]
  },
  
  // Timeline
  createdAt: {
    type: Date,
    default: Date.now
  },
  activatedAt: Date,
  ambulanceArrivedAt: Date,
  completedAt: Date,
  
  // Notifications
  notificationsSent: [{
    type: {
      type: String,
      enum: ['AmbulanceDispatched', 'HospitalAlert', 'AmbulanceArrived']
    },
    sentAt: Date
  }],
  
  // Additional Details
  patientName: String,
  patientAge: Number,
  patientBloodGroup: String,
  allergies: [String],
  currentMedications: [String],
  recentAiRiskPrediction: String
});

// Index for quick lookups
sosSchema.index({ userId: 1, createdAt: -1 });
sosSchema.index({ status: 1 });
sosSchema.index({ selectedHospitalId: 1 });

module.exports = mongoose.model('EmergencySOS', sosSchema);
