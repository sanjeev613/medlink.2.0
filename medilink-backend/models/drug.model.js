const mongoose = require('mongoose');

const DrugSchema = new mongoose.Schema({
  drug_name: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  aliases: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: [
      'Cardiovascular',
      'Antidiabetic',
      'Gastrointestinal',
      'Antibiotic',
      'Analgesic / Anti-inflammatory',
      'Respiratory',
      'Neurology / Psychiatry',
      'Vitamins & Minerals',
      'Anticoagulant / Antiplatelet',
      'Thyroid',
      'Other'
    ],
    default: 'Other'
  },
  expected_unit: {
    type: String,
    required: true,
    default: 'mg'
  },
  min_dose: {
    type: Number,
    required: true
  },
  max_dose: {
    type: Number,
    required: true
  },
  common_doses: [{
    type: Number
  }],
  allowed_frequencies: [{
    type: String
  }],
  default_food_timing: {
    type: String,
    enum: ['before_food', 'after_food', 'with_food', 'empty_stomach', 'anytime'],
    default: 'after_food'
  },
  warning_notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Drug', DrugSchema);
