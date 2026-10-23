/**
 * AI-Assisted Emergency Triage Engine
 * Decision-support only - Experimental & Unvalidated Prototype
 * Adheres to National Guidelines (Swasth & Samavesh Bharat / SFIC 2026)
 */

function evaluateTriage({
  emergencyType = 'Accident',
  symptoms = [],
  consciousness = 'Alert',
  breathingDifficulty = false,
  severeBleeding = false,
  accidentDetails = '',
  medicalHistory = []
}) {
  const warningSigns = [];
  const missingInfo = [];
  let score = 0; // 0 to 100 risk score
  const rulesTriggered = [];

  // 1. Consciousness / Neurological (AVPU Scale)
  if (consciousness === 'Unresponsive') {
    score += 45;
    warningSigns.push('Critical: Patient is completely unresponsive (GCS < 8 equivalent)');
    rulesTriggered.push('Unresponsive AVPU state indicates immediate airway/cerebral threat');
  } else if (consciousness === 'Pain' || consciousness === 'Pain Responsive') {
    score += 35;
    warningSigns.push('Severe: Patient only responsive to noxious/pain stimuli');
    rulesTriggered.push('Impaired consciousness requires immediate trauma airway stabilization');
  } else if (consciousness === 'Voice' || consciousness === 'Confused') {
    score += 20;
    warningSigns.push('Moderate: Altered mental status / confusion detected');
    rulesTriggered.push('Confusion post-trauma signals possible concussion or hypoperfusion');
  }

  // 2. Airway & Respiratory Effort
  if (breathingDifficulty) {
    score += 35;
    warningSigns.push('Critical: Compromised respiratory effort / labored breathing');
    rulesTriggered.push('Respiratory distress triggers high-urgency oxygenation protocol');
  }

  // 3. Circulation & Hemorrhage
  if (severeBleeding) {
    score += 35;
    warningSigns.push('Critical: Active severe or arterial bleeding reported');
    rulesTriggered.push('Severe hemorrhage carries acute risk of class III/IV hypovolemic shock');
  }

  // 4. Emergency Type & High-Energy Mechanism of Injury
  const typeLower = (emergencyType || '').toLowerCase();
  if (typeLower.includes('accident') || typeLower.includes('trauma')) {
    score += 15;
    rulesTriggered.push('High-kinetic blunt trauma or motor vehicular collision suspected');
    if (!accidentDetails) {
      missingInfo.push('Collision speed, seatbelt/helmet status, and rollover impact details');
    }
  } else if (typeLower.includes('cardiac') || typeLower.includes('heart')) {
    score += 25;
    warningSigns.push('Cardiac etiology suspected (acute coronary syndrome / arrhythmia risk)');
    rulesTriggered.push('Chest pain or suspected cardiac arrest requires catheterization standby');
  } else if (typeLower.includes('stroke')) {
    score += 30;
    warningSigns.push('Acute stroke protocol: Thrombolysis window is time-critical');
    rulesTriggered.push('Suspected neurological deficit requires immediate neuroimaging');
  }

  // 5. Patient Underlying Comorbidities
  if (Array.isArray(medicalHistory)) {
    const histStr = medicalHistory.join(' ').toLowerCase();
    if (histStr.includes('anticoagulant') || histStr.includes('blood thinner') || histStr.includes('warfarin') || histStr.includes('aspirin')) {
      score += 15;
      warningSigns.push('Patient is on blood thinners — high risk of accelerated internal hemorrhage');
    }
    if (histStr.includes('asthma') || histStr.includes('copd')) {
      score += 10;
      warningSigns.push('Underlying pulmonary comorbidity impairs respiratory reserve');
    }
  }

  if (symptoms.length === 0) {
    missingInfo.push('Detailed patient-reported symptom checklist');
  }
  missingInfo.push('First responder baseline vital signs (NIBP, SpO2, Heart Rate)');

  // Determine Priority Category
  let priority = 'LOW';
  let escalationAdvice = 'Standard ambulance dispatch with routine emergency department reception.';

  if (score >= 60 || severeBleeding || (consciousness !== 'Alert' && breathingDifficulty)) {
    priority = 'CRITICAL';
    escalationAdvice = 'IMMEDIATE Level-1 Trauma / Resuscitation Bay activation. Pre-alert receiving hospital trauma lead, prepare O-Negative blood, and alert airway team.';
  } else if (score >= 35 || breathingDifficulty || severeBleeding) {
    priority = 'HIGH';
    escalationAdvice = 'Priority emergency dispatch. Alert hospital triage for priority assessment on arrival; reserve monitored cubicle.';
  } else if (score >= 20) {
    priority = 'MODERATE';
    escalationAdvice = 'Urgent dispatch. Continuous vital monitoring during transport; standard emergency cubicle assignment.';
  }

  const ruleExplanation = rulesTriggered.length > 0
    ? rulesTriggered.join('. ') + '.'
    : 'Standard triage assessment based on patient symptoms and vital indications.';

  return {
    priority,
    score: Math.min(100, score),
    warningSigns,
    missingInfo,
    ruleExplanation,
    escalationAdvice,
    disclaimer: 'EXPERIMENTAL DECISION SUPPORT ONLY. This rule-based algorithm assists human triage dispatchers and does NOT replace doctor diagnosis or paramedic clinical judgment.',
    evaluatedAt: new Date().toISOString()
  };
}

module.exports = { evaluateTriage };
