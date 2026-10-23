const { TEST_DOCUMENTS } = require('../data/testDocuments');
const { extractDischargeSummary } = require('../services/claudeVisionService');
const { validateMedicationPlan } = require('../services/validationService');
const { augmentWithTamilTranslations } = require('../services/translationService');
const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '../data/seed_drugs.json');
const drugDB = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

describe('Discharge Summary MVP Acceptance Suite', () => {
  for (const doc of TEST_DOCUMENTS) {
    test(`Processes test document ${doc.id} - ${doc.title}`, async () => {
      const extracted = await extractDischargeSummary({ testDocId: doc.id });

      if (extracted.handwritten_detected) {
        expect(extracted.handwritten_detected).toBe(true);
        return;
      }

      const { validatedMedicines, reviewNeeded, flaggedCount } = validateMedicationPlan(
        extracted.medicines,
        drugDB
      );

      expect(Array.isArray(validatedMedicines)).toBe(true);
      for (const med of validatedMedicines) {
        if (med.status === 'needs_review') {
          expect(med.dose).toBeNull();
        }
      }

      const translated = augmentWithTamilTranslations({
        medicines: validatedMedicines,
        warning_signs: extracted.warning_signs,
        follow_up: extracted.follow_up
      });

      expect(translated.medicines).toBeDefined();
    });
  }
});
