const mongoose = require('mongoose');

const MedicineItemSchema = new mongoose.Schema({
  raw_text: { type: String, required: true },
  drug_name: { type: String, default: null },
  dose: { type: String, default: null },
  unit: { type: String, default: 'mg' },
  frequency_code: { type: String, default: null },
  frequency_human: { type: String, default: null },
  duration_days: { type: Number, default: 7 },
  food_timing: {
    type: String,
    enum: ['before_food', 'after_food', 'with_food', 'empty_stomach', 'bedtime', 'anytime'],
    default: 'after_food'
  },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  status: {
    type: String,
    enum: ['ok', 'needs_review', 'rejected'],
    default: 'ok'
  },
  reason: {
    type: String,
    enum: [
      'low_ocr_confidence',
      'unrecognized_drug_name',
      'dose_out_of_plausible_range',
      'unit_mismatch',
      'missing_dose_or_frequency',
      null
    ],
    default: null
  },
  matched_drug: { type: String, default: null },
  match_score: { type: Number, default: null }
}, { _id: false });

const FollowUpSchema = new mongoose.Schema({
  date: { type: String, default: null },
  what_to_carry: [{ type: String }],
  confidence: { type: Number, default: 0.9 },
  status: { type: String, default: 'ok' }
}, { _id: false });

const WarningSignSchema = new mongoose.Schema({
  text: { type: String, required: true },
  confidence: { type: Number, default: 0.95 }
}, { _id: false });

const DoctorSignoffSchema = new mongoose.Schema({
  signed: { type: Boolean, default: false },
  reviewed_by: { type: String, default: null },
  role: { type: String, enum: ['Doctor', 'Clinical Pharmacist', 'Chief Medical Officer', null], default: null },
  registration_no: { type: String, default: null },
  notes: { type: String, default: null },
  signed_at: { type: Date, default: null }
}, { _id: false });

const DischargeSummarySchema = new mongoose.Schema({
  summary_id: { type: String, required: true, unique: true, index: true },
  patient_name: { type: String, default: 'Patient' },
  hospital_name: { type: String, default: 'Apollo Multi-Speciality Hospitals' },
  hospital_phone: { type: String, default: '+91 44 2829 0200' },
  admission_date: { type: String, default: null },
  discharge_date: { type: String, default: null },
  diagnosis: { type: String, default: null },
  extracted_at: { type: Date, default: Date.now },
  medicines: [MedicineItemSchema],
  follow_up: FollowUpSchema,
  warning_signs: [WarningSignSchema],
  language: { type: String, default: 'en' },
  review_needed: { type: Boolean, default: false },
  handwritten_detected: { type: Boolean, default: false },
  doctor_signoff: { type: DoctorSignoffSchema, default: () => ({}) },
  raw_image_url: { type: String, default: null },
  audit_logs: [{
    timestamp: { type: Date, default: Date.now },
    action: String,
    details: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('DischargeSummary', DischargeSummarySchema);
