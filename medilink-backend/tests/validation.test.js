const { validateMedicine, validateMedicationPlan, fuzzyMatch } = require('../services/validationService');
const fs = require('fs');
const path = require('path');

// Load sample seed drugs
const seedPath = path.join(__dirname, '../data/seed_drugs.json');
const drugDB = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

describe('Medication Plan Validation Service', () => {
  test('Test 1: High confidence valid medicine (Metformin 500 BD)', () => {
    const test1 = {
      raw_text: "T. Metformin 500 BD x 3 months",
      drug_name: "Metformin",
      dose: "500",
      unit: "mg",
      frequency_code: "BD",
      frequency_human: "Twice a day",
      duration_days: 90,
      food_timing: "after_food",
      confidence: 0.95
    };
    const res1 = validateMedicine(test1, drugDB);
    expect(res1.status).toBe('ok');
    expect(res1.dose).toBe('500');
  });

  test('Test 2: Low OCR confidence (< 0.75)', () => {
    const test2 = {
      raw_text: "T. Atorvas... ??mg HS",
      drug_name: "Atorvastatin",
      dose: "20",
      unit: "mg",
      frequency_code: "HS",
      confidence: 0.62
    };
    const res2 = validateMedicine(test2, drugDB);
    expect(res2.status).toBe('needs_review');
    expect(res2.reason).toBe('low_ocr_confidence');
    expect(res2.dose).toBeNull();
  });

  test('Test 3: Unrecognized drug name', () => {
    const test3 = {
      raw_text: "T. Xylofonariz 50mg OD",
      drug_name: "Xylofonariz",
      dose: "50",
      unit: "mg",
      frequency_code: "OD",
      confidence: 0.92
    };
    const res3 = validateMedicine(test3, drugDB);
    expect(res3.status).toBe('needs_review');
    expect(res3.reason).toBe('unrecognized_drug_name');
    expect(res3.dose).toBeNull();
  });

  test('Test 4: Dose out of plausible range', () => {
    const test4 = {
      raw_text: "T. Amlodipine 50mg OD",
      drug_name: "Amlodipine",
      dose: "50",
      unit: "mg",
      frequency_code: "OD",
      confidence: 0.90
    };
    const res4 = validateMedicine(test4, drugDB);
    expect(res4.status).toBe('needs_review');
    expect(res4.reason).toBe('dose_out_of_plausible_range');
    expect(res4.dose).toBeNull();
  });

  test('Test 5: Unit mismatch', () => {
    const test5 = {
      raw_text: "T. Pantoprazole 40g OD",
      drug_name: "Pantoprazole",
      dose: "40",
      unit: "g",
      frequency_code: "OD",
      confidence: 0.92
    };
    const res5 = validateMedicine(test5, drugDB);
    expect(res5.status).toBe('needs_review');
    expect(res5.reason).toBe('unit_mismatch');
    expect(res5.dose).toBeNull();
  });

  test('Test 6: Fuzzy match brand alias', () => {
    const test6 = {
      raw_text: "T. Dolo 650 TDS SOS",
      drug_name: "Dolo 650",
      dose: "650",
      unit: "mg",
      frequency_code: "TDS",
      confidence: 0.94
    };
    const res6 = validateMedicine(test6, drugDB);
    expect(res6.status).toBe('ok');
    expect(res6.matched_drug).toBe('Paracetamol');
  });
});
