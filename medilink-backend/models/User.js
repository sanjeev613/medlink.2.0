const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Authentication
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^[0-9]{10}$/
  },
  aadhaarNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^[0-9]{12}$/
  },
  aadhaarVerified: {
    type: Boolean,
    default: false
  },
  
  // Personal Information
  firstName: {
    type: String,
    default: 'User'
  },
  lastName: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Not Specified'],
    default: 'Not Specified'
  },
  
  // Contact Information
  emergencyContactName: String,
  emergencyContactPhone: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  
  // Medical Profile
  bloodGroup: {
    type: String,
    enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Not Specified'],
    default: 'Not Specified'
  },
  height: Number, // in cm
  weight: Number, // in kg
  
  // Medical History
  medicalConditions: [String], // e.g., ["Diabetes", "Hypertension"]
  allergies: [String],
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String
  }],
  previousSurgeries: [{
    name: String,
    date: Date,
    description: String
  }],
  
  // Medical Records Storage
  labReports: [{
    reportName: String,
    date: Date,
    fileUrl: String,
    description: String
  }],
  prescriptions: [{
    doctorName: String,
    date: Date,
    fileUrl: String,
    medications: [String]
  }],
  
  // Wallet & Financial
  walletBalance: {
    type: Number,
    default: 5000
  },
  insurancePolicy: {
    providerId: mongoose.Schema.Types.ObjectId,
    policyNumber: String,
    coverageAmount: Number,
    status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'inactive' }
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'nurse', 'admin'],
    default: 'patient'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Location & Devices
  lastKnownLocation: {
    latitude: Number,
    longitude: Number,
    updatedAt: Date
  },
  deviceTokens: [String], // For push notifications
  
  // App Settings
  language: {
    type: String,
    enum: ['en', 'ta'],
    default: 'en'
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  dataSharing: {
    type: Boolean,
    default: false
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Remove sensitive data from response
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
