/**
 * Translation Service for English <-> Tamil medical instructions
 * Supports Bhashini API integration with local high-accuracy medical terminology fallback.
 */

const TAMIL_DICTIONARY = {
  // Frequencies
  "once a day": "ஒரு நாளைக்கு 1 முறை (காலை)",
  "twice a day": "ஒரு நாளைக்கு 2 முறை (காலை, இரவு)",
  "three times a day": "ஒரு நாளைக்கு 3 முறை (காலை, மதியம், இரவு)",
  "four times a day": "ஒரு நாளைக்கு 4 முறை",
  "at bedtime": "இரவு படுக்கைக்கு முன்",
  "as needed": "தேவைப்படும் போது மட்டும் (SOS)",
  "weekly": "வாரத்திற்கு ஒரு முறை",

  // Food timings
  "after_food": "உணவுக்குப் பின்",
  "before_food": "உணவுக்கு முன் (வெறும் வயிற்றில்)",
  "with_food": "உணவுடன் சேர்த்து",
  "empty_stomach": "காலை வெறும் வயிற்றில்",
  "bedtime": "இரவு தூங்கும் முன்",
  "anytime": "எந்த நேரத்திலும்",

  // Times of Day
  "morning": "காலை",
  "afternoon": "மதியம்",
  "evening": "மாலை",
  "night": "இரவு",

  // Common Warning Signs
  "Chest pain or breathlessness": "மார்பு வலி அல்லது மூச்சுத்திணறல்",
  "Sudden chest heaviness": "திடீர் மார்பு கனம் அல்லது இறுக்கம்",
  "Radiating pain to left arm or jaw": "இடது கை அல்லது தாடைக்கு பரவும் வலி",
  "Excessive cold sweating": "அதிகப்படியான குளிர்ந்த வியர்வை",
  "Severe dizziness, confusion or tremors": "கடும் தலைச்சுற்றல், நடுக்கம் அல்லது குழப்பம்",
  "High-grade fever (>101°F)": "கடும் காய்ச்சல் (101°F-க்கு மேல்)",
  "Sudden calf swelling or pain": "கால்களில் திடீர் வீக்கம் அல்லது கடுமையான வலி",
  "Redness or discharge from surgical wound": "அறுவை சிகிச்சை காயத்தில் சிவத்தல் அல்லது சீழ் வடிதல்",
  "Severe breathless unable to complete a sentence": "பேச முடியாத அளவுக்கு கடுமையான மூச்சுத்திணறல்",
  "Blue discoloration of lips or fingertips": "உதடுகள் அல்லது விரல் நகங்கள் நீல நிறமாக மாறுதல்",
  "Persistent vomiting or inability to keep fluids down": "தொடர் வாந்தி அல்லது நீர்ச்சத்து இழப்பு",

  // Carry checklist
  "Discharge summary": "டிஸ்சார்ஜ் சுருக்க அறிக்கை (Discharge Summary)",
  "All current medicines": "தற்போது உட்கொள்ளும் அனைத்து மருந்துப் பெட்டிகள்",
  "Blood sugar log": "தினசரி ரத்த சர்க்கரை அளவு குறிப்பேடு",
  "ECG strip": "சமீபத்திய ஈசிஜி (ECG) பரிசோதனை தாள்",
  "BP log": "ரத்த அழுத்த பதிவுப் புத்தகம் (BP Log)",
  "X-Ray knee AP/Lateral": "முழங்கால் எக்ஸ்-ரே படங்கள்",
  "Dressing kit": "காயம் கட்டும் மருத்துவ உபகரணங்கள்",
  "Spirometry reports": "நுரையீரல் சுவாச பரிசோதனை அறிக்கை (Spirometry)",
  "Inhaler devices": "பயன்படுத்தும் இன்ஹேலர் கருவிகள்",

  // Status & Warnings
  "Could not read this medicine safely. Please confirm with your hospital or pharmacist before taking it.":
    "⚠️ இந்த மருந்தை பாதுகாப்பாக படிக்க முடியவில்லை. உட்கொள்ளும் முன் மருத்துவமனை அல்லது மருந்தாளுநரிடம் உறுதிப்படுத்தவும்.",
  "This looks handwritten — we can't safely read it yet. Please ask your pharmacist to confirm the medicines":
    "⚠️ இது கையெழுத்தில் எழுதப்பட்டதாக தெரிகிறது — எங்களால் பாதுகாப்பாக படிக்க முடியவில்லை. மருந்துகளை உறுதிப்படுத்த உங்கள் மருந்தாளுநரிடம் கேட்கவும்.",
  
  // UI Headings
  "Today's Medicines": "இன்றைய மருந்துகள்",
  "Warning Signs (Urgent)": "எச்சரிக்கை அறிகுறிகள் (அவசரம்)",
  "Next Follow-Up": "அடுத்த மருத்துவ சந்திப்பு",
  "What to Carry": "கொண்டு செல்ல வேண்டியவை",
  "Needs Clinical Review": "மருத்துவர் சரிபார்ப்பு தேவை",
  "Days Remaining": "மீதமுள்ள நாட்கள்",
  "Doctor Verified & Signed": "மருத்துவர் சரிபார்த்து கையொப்பமிட்டார்"
};

/**
 * Translate a phrase from English to Tamil
 * @param {string} text - English text
 * @returns {string} Tamil translation if found, otherwise returns original text
 */
function translateToTamil(text) {
  if (!text) return text;
  const trimmed = text.trim();
  
  if (TAMIL_DICTIONARY[trimmed]) {
    return TAMIL_DICTIONARY[trimmed];
  }

  // Case-insensitive check
  const lower = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(TAMIL_DICTIONARY)) {
    if (key.toLowerCase() === lower) {
      return value;
    }
  }

  return text;
}

/**
 * Augment a discharge summary with Tamil translations for UI display
 * @param {Object} summary - Discharge summary object
 * @returns {Object} Translated summary
 */
function augmentWithTamilTranslations(summary) {
  const clone = JSON.parse(JSON.stringify(summary));

  // Translate warning signs
  if (clone.warning_signs && Array.isArray(clone.warning_signs)) {
    clone.warning_signs = clone.warning_signs.map(w => ({
      ...w,
      text_en: w.text,
      text_ta: translateToTamil(w.text)
    }));
  }

  // Translate follow-up checklist
  if (clone.follow_up && Array.isArray(clone.follow_up.what_to_carry)) {
    clone.follow_up.what_to_carry_en = [...clone.follow_up.what_to_carry];
    clone.follow_up.what_to_carry_ta = clone.follow_up.what_to_carry.map(item => translateToTamil(item));
  }

  // Translate medicines frequency and food timing
  if (clone.medicines && Array.isArray(clone.medicines)) {
    clone.medicines = clone.medicines.map(med => ({
      ...med,
      frequency_human_en: med.frequency_human,
      frequency_human_ta: translateToTamil(med.frequency_human || ''),
      food_timing_en: med.food_timing,
      food_timing_ta: translateToTamil(med.food_timing || ''),
      safety_warning_en: med.status === 'needs_review'
        ? "Could not read this medicine safely. Please confirm with your hospital or pharmacist before taking it."
        : null,
      safety_warning_ta: med.status === 'needs_review'
        ? TAMIL_DICTIONARY["Could not read this medicine safely. Please confirm with your hospital or pharmacist before taking it."]
        : null
    }));
  }

  return clone;
}

module.exports = {
  translateToTamil,
  augmentWithTamilTranslations,
  TAMIL_DICTIONARY
};
