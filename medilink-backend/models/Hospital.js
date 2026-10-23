const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  // Contact Information
  phoneNumber: String,
  email: String,
  website: String,
  
  // Location
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  address: String,
  city: String,
  state: String,
  pincode: String,
  
  // Hospital Details
  bedCapacity: Number,
  availableBeds: Number,
  ambulanceCount: Number,
  
  // Departments
  departments: [{
    name: String,
    specializations: [String],
    doctorCount: Number,
    availableDoctors: Number
  }],
  
  // API Integration
  apiKey: {
    type: String,
    unique: true
  },
  apiSecret: String,
  webhookUrl: String,
  
  // Emergency Response
  acceptanceRadius: {
    type: Number,
    default: 15 // km
  },
  maxSimultaneousEmergencies: {
    type: Number,
    default: 5
  },
  currentEmergencies: {
    type: Number,
    default: 0
  },
  
  // Operating Hours
  operatingHours: {
    monday: { opens: String, closes: String },
    tuesday: { opens: String, closes: String },
    wednesday: { opens: String, closes: String },
    thursday: { opens: String, closes: String },
    friday: { opens: String, closes: String },
    saturday: { opens: String, closes: String },
    sunday: { opens: String, closes: String }
  },
  
  // Services
  services: [{
    type: String,
    enum: ['Emergency', 'ICU', 'Surgery', 'Cardiology', 'Neurology', 'Orthopedics', 'Psychiatry', 'OBG']
  }],
  
  // Statistics
  emergenciesResponseTime: Number, // average in minutes
  acceptanceRate: Number, // percentage
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: Date,
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isAcceptingEmergencies: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

hospitalSchema.index({ latitude: 1, longitude: 1 });
hospitalSchema.index({ city: 1 });
hospitalSchema.index({ isActive: 1, isAcceptingEmergencies: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);
