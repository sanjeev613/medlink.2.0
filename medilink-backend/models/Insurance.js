const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema({
  // Insurance Provider Details
  providerName: {
    type: String,
    required: true
  },
  registrationNumber: String,
  
  // Plan Information
  planName: {
    type: String,
    required: true
  },
  planCode: {
    type: String,
    required: true,
    unique: true
  },
  coverageType: {
    type: String,
    enum: ['Individual', 'Family', 'Group'],
    required: true
  },
  
  // Coverage Details
  baseCoverageAmount: {
    type: Number,
    required: true
  },
  maxClaimAmount: Number,
  deductible: Number,
  copayPercentage: Number,
  
  // Coverage Inclusions
  coveredServices: [{
    type: String,
    enum: ['Hospitalization', 'Surgery', 'Maternity', 'Dental', 'Eye Care', 'Mental Health', 'Lab Tests', 'Prescriptions']
  }],
  
  // Premium Details
  monthlyPremium: {
    type: Number,
    required: true
  },
  annualPremium: Number,
  paymentFrequency: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Annual'],
    default: 'Monthly'
  },
  
  // AI Recommendation Criteria
  minAgeEligibility: Number,
  maxAgeEligibility: Number,
  targetRiskProfiles: [String], // e.g., ['Diabetes', 'Hypertension', 'Low-Risk']
  
  // Network Hospitals
  networkHospitals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  }],
  networkHospitalsCount: Number,
  
  // Policy Terms
  waitingPeriod: Number, // in days
  claimProcessingTime: Number, // in days
  
  // Description
  description: String,
  benefits: [String],
  exclusions: [String],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Insurance', insuranceSchema);
