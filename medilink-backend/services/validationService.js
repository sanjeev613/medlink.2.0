/**
 * Standalone Refusal / Validation Module for Indian Discharge Summaries
 * Strictly enforces safety guards before any medicine dosage reaches a patient.
 */

// Levenshtein similarity calculation
function levenshteinSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  const a = s1.trim().toLowerCase();
  const b = s2.trim().toLowerCase();
  if (a === b) return 1.0;
  
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  const distance = dp[m][n];
  const maxLen = Math.max(m, n);
  return maxLen === 0 ? 1.0 : Math.max(0, 1 - distance / maxLen);
}

// Token bigram / Jaccard similarity for multi-word or compound drug names
function tokenSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  const t1 = s1.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  const t2 = s2.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  if (!t1.length || !t2.length) return 0;

  const set1 = new Set(t1);
  const set2 = new Set(t2);
  let intersection = 0;
  for (const t of set1) {
    if (set2.has(t)) intersection++;
  }
  const union = new Set([...set1, ...set2]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Fuzzy match a candidate drug name against the Drug Validation Database
 * @param {string} candidateName - Raw or extracted drug name
 * @param {Array} drugDB - Array of drug documents from MongoDB or in-memory seed
 * @returns {{ dbEntry: Object|null, matchScore: number }}
 */
function fuzzyMatch(candidateName, drugDB) {
  if (!candidateName || typeof candidateName !== 'string') {
    return { dbEntry: null, matchScore: 0 };
  }

  const cleanCandidate = candidateName
    .replace(/^(Tab\.|T\.|Cap\.|Capsule\.|Inj\.|Syp\.|Tablet\s+)/i, '')
    .trim()
    .toLowerCase();

  let bestEntry = null;
  let highestScore = 0;

  for (const drug of drugDB) {
    // 1. Direct match on main drug name
    const drugNameClean = drug.drug_name.toLowerCase();
    if (cleanCandidate === drugNameClean) {
      return { dbEntry: drug, matchScore: 1.0 };
    }

    const levScore = levenshteinSimilarity(cleanCandidate, drugNameClean);
    const tokScore = tokenSimilarity(cleanCandidate, drugNameClean);
    let score = Math.max(levScore, (levScore * 0.7) + (tokScore * 0.3));

    if (score > highestScore) {
      highestScore = score;
      bestEntry = drug;
    }

    // 2. Check aliases / brand names
    if (drug.aliases && Array.isArray(drug.aliases)) {
      for (const alias of drug.aliases) {
        const aliasClean = alias.toLowerCase();
        if (cleanCandidate === aliasClean) {
          return { dbEntry: drug, matchScore: 1.0 };
        }
        const aliasLev = levenshteinSimilarity(cleanCandidate, aliasClean);
        if (aliasLev > highestScore) {
          highestScore = aliasLev;
          bestEntry = drug;
        }
      }
    }
  }

  return { dbEntry: bestEntry, matchScore: highestScore };
}

/**
 * Validates a single extracted medicine against the Drug Validation DB
 * Follows the strict 4-step safety gating logic:
 * 1. Confidence threshold >= 0.75
 * 2. Fuzzy match against Drug DB >= 0.85
 * 3. Dose within plausible [min_dose, max_dose] range
 * 4. Expected unit match (e.g. "mg" vs "g" vs "mcg")
 * 
 * @param {Object} med - Medicine object from OCR/LLM
 * @param {Array} drugDB - Reference drug list
 * @returns {Object} Validated medicine with status, reason, and safety logs
 */
function validateMedicine(med, drugDB) {
  const result = {
    ...med,
    status: 'ok',
    reason: null,
    matched_drug: null,
    match_score: 0,
    audit_notes: []
  };

  // 1. OCR Confidence check
  const confidence = typeof med.confidence === 'number' ? med.confidence : parseFloat(med.confidence || 0);
  result.confidence = confidence;

  if (confidence < 0.75) {
    result.status = 'needs_review';
    result.reason = 'low_ocr_confidence';
    result.audit_notes.push(`OCR confidence ${confidence.toFixed(2)} is below minimum safety threshold (0.75)`);
    // Mask dose/time for safety
    result.dose = null;
    result.frequency_code = null;
    return result;
  }

  // 2. Drug Name Existence and Fuzzy Match
  if (!med.drug_name || med.drug_name.trim() === '') {
    result.status = 'needs_review';
    result.reason = 'unrecognized_drug_name';
    result.audit_notes.push('Drug name is missing or empty');
    result.dose = null;
    result.frequency_code = null;
    return result;
  }

  const { dbEntry, matchScore } = fuzzyMatch(med.drug_name, drugDB);
  result.match_score = parseFloat(matchScore.toFixed(3));

  if (!dbEntry || matchScore < 0.85) {
    result.status = 'needs_review';
    result.reason = 'unrecognized_drug_name';
    result.audit_notes.push(
      `Drug "${med.drug_name}" match score (${result.match_score}) is below clinical safety threshold (0.85)`
    );
    result.dose = null;
    result.frequency_code = null;
    return result;
  }

  result.matched_drug = dbEntry.drug_name;
  if (!result.food_timing || result.food_timing === 'after_food') {
    result.food_timing = dbEntry.default_food_timing || 'after_food';
  }

  // 3. Dose Parsing and Range Check
  let doseNum = null;
  if (med.dose !== null && med.dose !== undefined && med.dose !== '') {
    const parsed = parseFloat(String(med.dose).replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed)) {
      doseNum = parsed;
    }
  }

  if (doseNum === null) {
    result.status = 'needs_review';
    result.reason = 'missing_dose_or_frequency';
    result.audit_notes.push('Dose value is missing or unparseable');
    result.dose = null;
    result.frequency_code = null;
    return result;
  }

  if (doseNum < dbEntry.min_dose || doseNum > dbEntry.max_dose) {
    result.status = 'needs_review';
    result.reason = 'dose_out_of_plausible_range';
    result.audit_notes.push(
      `Dose ${doseNum} is outside clinical plausible range [${dbEntry.min_dose}, ${dbEntry.max_dose}] ${dbEntry.expected_unit} for ${dbEntry.drug_name}`
    );
    result.dose = null;
    result.frequency_code = null;
    return result;
  }

  // 4. Expected Unit Verification
  const medUnit = (med.unit || '').trim().toLowerCase();
  const expectedUnit = (dbEntry.expected_unit || 'mg').trim().toLowerCase();

  // Allow standard equivalents: e.g. "milligram" -> "mg", "microgram" -> "mcg"
  const normalizedMedUnit = medUnit === 'milligram' || medUnit === 'mgs' ? 'mg'
    : medUnit === 'microgram' || medUnit === 'mcgs' ? 'mcg'
    : medUnit === 'units' || medUnit === 'u' ? 'iu'
    : medUnit;

  if (normalizedMedUnit !== expectedUnit) {
    result.status = 'needs_review';
    result.reason = 'unit_mismatch';
    result.audit_notes.push(
      `Unit "${med.unit}" does not match expected unit "${dbEntry.expected_unit}" for ${dbEntry.drug_name}`
    );
    result.dose = null;
    result.frequency_code = null;
    return result;
  }

  // Validated OK!
  result.status = 'ok';
  result.reason = null;
  result.dose = String(doseNum);
  result.unit = expectedUnit;
  result.audit_notes.push(`Validated against DB: ${dbEntry.drug_name} (${dbEntry.category})`);

  return result;
}

/**
 * Validates an entire extraction payload containing multiple medicines
 * @param {Array} medicines - List of extracted medicines
 * @param {Array} drugDB - Reference drug catalog
 * @returns {{ validatedMedicines: Array, reviewNeeded: boolean, flaggedCount: number }}
 */
function validateMedicationPlan(medicines, drugDB) {
  if (!Array.isArray(medicines)) {
    return { validatedMedicines: [], reviewNeeded: false, flaggedCount: 0 };
  }

  const validatedMedicines = medicines.map(med => validateMedicine(med, drugDB));
  const flaggedCount = validatedMedicines.filter(m => m.status === 'needs_review').length;
  const reviewNeeded = flaggedCount > 0;

  return {
    validatedMedicines,
    reviewNeeded,
    flaggedCount
  };
}

module.exports = {
  fuzzyMatch,
  validateMedicine,
  validateMedicationPlan,
  levenshteinSimilarity
};
