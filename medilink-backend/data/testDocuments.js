/**
 * 5 Test Discharge Documents for MVP Acceptance Criteria
 * Covers:
 * 1. Clean cardiology post-stent printed summary (All OK)
 * 2. T2DM with deliberately ambiguous/blurry line (Needs Review - low confidence / missing dose)
 * 3. Orthopedic post-op with unit error (40g vs 40mg - Needs Review)
 * 4. Respiratory asthma with unrecognized drug (Needs Review)
 * 5. Purely handwritten summary (Triggers handwritten_detected refusal)
 */

const TEST_DOCUMENTS = [
  {
    id: "doc-1-cardiology",
    title: "1. Cardiology Post-PTCA Discharge Summary (Clear - All OK)",
    hospital_name: "Apollo Multi-Speciality Hospitals, Greams Road, Chennai",
    hospital_phone: "+91 44 2829 0200",
    patient_name: "K. R. Ramanathan (62M)",
    admission_date: "2026-09-20",
    discharge_date: "2026-09-24",
    diagnosis: "Coronary Artery Disease - NSTEMI - Post PTCA to LAD with DES",
    document_type: "printed",
    handwritten_detected: false,
    raw_document_text: `APOLLO HOSPITALS CHENNAI - DISCHARGE SUMMARY
PATIENT: K. R. Ramanathan | AGE/SEX: 62/M | UHID: APO-CHE-89421
CONSULTANT: Dr. V. Sundaram, MD, DM (Cardiology)
DATE OF ADMISSION: 20/09/2026 | DATE OF DISCHARGE: 24/09/2026
DIAGNOSIS: Coronary Artery Disease - Acute Coronary Syndrome (NSTEMI) s/p PTCA to LAD with 3.0 x 24 mm Drug Eluting Stent (DES).

DISCHARGE MEDICATIONS:
1. Tab. Aspirin 75 mg - 1 tab OD after lunch x 3 months
2. Tab. Clopidogrel 75 mg - 1 tab OD after lunch x 3 months
3. Tab. Atorvastatin 40 mg - 1 tab HS at bedtime x 3 months
4. Tab. Metoprolol 25 mg - 1 tab OD morning after food x 1 month
5. Tab. Pantoprazole 40 mg - 1 tab OD early morning before breakfast x 1 month

EMERGENCY WARNING SIGNS:
- Sudden chest heaviness or pressure
- Radiating pain to left arm or jaw
- Excessive cold sweating or breathlessness

FOLLOW-UP APPOINTMENT:
Date: 2026-10-15 at 10:30 AM (Cardiology OPD Room 204)
What to carry:
- Discharge summary
- ECG strip
- BP log
- All current medicines`,
    extracted_raw: {
      medicines: [
        {
          raw_text: "Tab. Aspirin 75 mg - 1 tab OD after lunch x 3 months",
          drug_name: "Aspirin",
          dose: "75",
          unit: "mg",
          frequency_code: "OD",
          frequency_human: "Once a day",
          duration_days: 90,
          food_timing: "after_food",
          confidence: 0.98
        },
        {
          raw_text: "Tab. Clopidogrel 75 mg - 1 tab OD after lunch x 3 months",
          drug_name: "Clopidogrel",
          dose: "75",
          unit: "mg",
          frequency_code: "OD",
          frequency_human: "Once a day",
          duration_days: 90,
          food_timing: "after_food",
          confidence: 0.97
        },
        {
          raw_text: "Tab. Atorvastatin 40 mg - 1 tab HS at bedtime x 3 months",
          drug_name: "Atorvastatin",
          dose: "40",
          unit: "mg",
          frequency_code: "HS",
          frequency_human: "At bedtime",
          duration_days: 90,
          food_timing: "bedtime",
          confidence: 0.96
        },
        {
          raw_text: "Tab. Metoprolol 25 mg - 1 tab OD morning after food x 1 month",
          drug_name: "Metoprolol",
          dose: "25",
          unit: "mg",
          frequency_code: "OD",
          frequency_human: "Once a day",
          duration_days: 30,
          food_timing: "after_food",
          confidence: 0.95
        },
        {
          raw_text: "Tab. Pantoprazole 40 mg - 1 tab OD early morning before breakfast x 1 month",
          drug_name: "Pantoprazole",
          dose: "40",
          unit: "mg",
          frequency_code: "OD",
          frequency_human: "Once a day",
          duration_days: 30,
          food_timing: "before_food",
          confidence: 0.98
        }
      ],
      follow_up: {
        date: "2026-10-15",
        what_to_carry: ["Discharge summary", "ECG strip", "BP log", "All current medicines"],
        confidence: 0.95,
        status: "ok"
      },
      warning_signs: [
        { text: "Sudden chest heaviness", confidence: 0.96 },
        { text: "Radiating pain to left arm or jaw", confidence: 0.95 },
        { text: "Excessive cold sweating", confidence: 0.94 }
      ]
    }
  },
  {
    id: "doc-2-diabetes-ambiguous",
    title: "2. Diabetes & HTN Summary (Deliberately Blurry/Ambiguous Dose)",
    hospital_name: "Fortis Malar Hospital, Adyar, Chennai",
    hospital_phone: "+91 44 4289 2222",
    patient_name: "Meenakshi Sundaram (58F)",
    admission_date: "2026-09-18",
    discharge_date: "2026-09-22",
    diagnosis: "Type 2 Diabetes Mellitus with Poor Glycemic Control, Essential HTN",
    document_type: "printed_with_ink_smudge",
    handwritten_detected: false,
    raw_document_text: `FORTIS MALAR HOSPITAL - DISCHARGE SUMMARY
PATIENT: Meenakshi Sundaram | AGE/SEX: 58/F | IP NO: FM-2026-0912
DIAGNOSIS: T2DM with secondary hyperglycemia, Grade II Hypertension.

MEDICATIONS PRESCRIBED:
1. Tab. Metformin 500 mg - 1 tab BD after meals x 60 days
2. Tab. Glimepiride 2 mg - 1 tab OD before breakfast x 60 days
3. Tab. Telmisartan 40 mg - 1 tab OD morning x 60 days
4. Tab. Amlodipine [***INK BLOT SMUDGE - UNREADABLE DOSE***] OD morning x 30 days

WARNING SIGNS:
- Severe dizziness, confusion or tremors
- Profuse cold sweating or blurred vision
- Persistent vomiting or inability to keep fluids down

NEXT FOLLOW-UP:
Date: 2026-10-08 at 09:00 AM (Endocrinology Clinic)
Bring along:
- Discharge summary
- Blood sugar log
- All current medicines`,
    extracted_raw: {
      medicines: [
        {
          raw_text: "Tab. Metformin 500 mg - 1 tab BD after meals x 60 days",
          drug_name: "Metformin",
          dose: "500",
          unit: "mg",
          frequency_code: "BD",
          frequency_human: "Twice a day",
          duration_days: 60,
          food_timing: "after_food",
          confidence: 0.96
        },
        {
          raw_text: "Tab. Glimepiride 2 mg - 1 tab OD before breakfast x 60 days",
          drug_name: "Glimepiride",
          dose: "2",
          unit: "mg",
          frequency_code: "OD",
          frequency_human: "Once a day",
          duration_days: 60,
          food_timing: "before_food",
          confidence: 0.94
        },
        {
          raw_text: "Tab. Telmisartan 40 mg - 1 tab OD morning x 60 days",
          drug_name: "Telmisartan",
          dose: "40",
          unit: "mg",
          frequency_code: "OD",
          frequency_human: "Once a day",
          duration_days: 60,
          food_timing: "after_food",
          confidence: 0.95
        },
        {
          // Deliberately ambiguous / smudged line: Dose is unreadable, low confidence
          raw_text: "Tab. Amlodipine [INK SMUDGED] OD morning x 30 days",
          drug_name: "Amlodipine",
          dose: null, // DO NOT invent a value!
          unit: "mg",
          frequency_code: "OD",
          frequency_human: "Once a day",
          duration_days: 30,
          food_timing: "after_food",
          confidence: 0.42, // Under 0.75 threshold
          status: "needs_review"
        }
      ],
      follow_up: {
        date: "2026-10-08",
        what_to_carry: ["Discharge summary", "Blood sugar log", "All current medicines"],
        confidence: 0.92,
        status: "ok"
      },
      warning_signs: [
        { text: "Severe dizziness, confusion or tremors", confidence: 0.94 },
        { text: "Persistent vomiting or inability to keep fluids down", confidence: 0.93 }
      ]
    }
  },
  {
    id: "doc-3-orthopedic-unit-mismatch",
    title: "3. Knee Surgery Summary (Unit Mismatch Error: 40g Pantoprazole)",
    hospital_name: "MIOT International Hospitals, Manapakkam, Chennai",
    hospital_phone: "+91 44 4200 2288",
    patient_name: "S. Murugan (67M)",
    admission_date: "2026-09-17",
    discharge_date: "2026-09-23",
    diagnosis: "Severe Osteoarthritis Right Knee - s/p Total Knee Arthroplasty (TKR)",
    document_type: "printed_with_clerical_typo",
    handwritten_detected: false,
    raw_document_text: `MIOT INTERNATIONAL - DEPT OF ORTHOPAEDICS
PATIENT: S. Murugan | 67 Yrs / Male | IPD: MIOT-ORTH-5521
PROCEDURE: Right Total Knee Replacement (TKR)

DISCHARGE MEDICATIONS:
1. Tab. Paracetamol 650 mg - 1 tab TDS after food x 7 days
2. Tab. Tramadol 50 mg - 1 tab SOS for severe pain x 5 days
3. Tab. Cefuroxime 500 mg - 1 tab BD after food x 5 days
4. Tab. Pantoprazole 40 g - 1 tab OD before breakfast x 14 days (Note: Typo in hospital print: "g" instead of "mg")

DANGER SIGNS / WARNINGS:
- High-grade fever (>101°F)
- Sudden calf swelling or pain
- Redness or discharge from surgical wound

FOLLOW UP:
Date: 2026-10-05 at 11:00 AM (Orthopaedic OPD)
What to carry:
- Discharge summary
- X-Ray knee AP/Lateral
- Dressing kit
- All current medicines`,
    extracted_raw: {
      medicines: [
        {
          raw_text: "Tab. Paracetamol 650 mg - 1 tab TDS after food x 7 days",
          drug_name: "Paracetamol",
          dose: "650",
          unit: "mg",
          frequency_code: "TDS",
          frequency_human: "Three times a day",
          duration_days: 7,
          food_timing: "after_food",
          confidence: 0.97
        },
        {
          raw_text: "Tab. Tramadol 50 mg - 1 tab SOS for severe pain x 5 days",
          drug_name: "Tramadol",
          dose: "50",
          unit: "mg",
          frequency_code: "SOS",
          frequency_human: "As needed",
          duration_days: 5,
          food_timing: "after_food",
          confidence: 0.94
        },
        {
          raw_text: "Tab. Cefuroxime 500 mg - 1 tab BD after food x 5 days",
          drug_name: "Cefuroxime",
          dose: "500",
          unit: "mg",
          frequency_code: "BD",
          frequency_human: "Twice a day",
          duration_days: 5,
          food_timing: "after_food",
          confidence: 0.96
        },
        {
          // Erroneous unit line: "g" instead of "mg"
          raw_text: "Tab. Pantoprazole 40 g - 1 tab OD before breakfast x 14 days",
          drug_name: "Pantoprazole",
          dose: "40",
          unit: "g", // MISMATCH: Drug DB expects "mg"
          frequency_code: "OD",
          frequency_human: "Once a day",
          duration_days: 14,
          food_timing: "before_food",
          confidence: 0.92
        }
      ],
      follow_up: {
        date: "2026-10-05",
        what_to_carry: ["Discharge summary", "X-Ray knee AP/Lateral", "Dressing kit", "All current medicines"],
        confidence: 0.94,
        status: "ok"
      },
      warning_signs: [
        { text: "High-grade fever (>101°F)", confidence: 0.96 },
        { text: "Sudden calf swelling or pain", confidence: 0.95 },
        { text: "Redness or discharge from surgical wound", confidence: 0.94 }
      ]
    }
  },
  {
    id: "doc-4-asthma-unrecognized",
    title: "4. Pulmonology Asthma Summary (Unrecognized Drug Line)",
    hospital_name: "Kauvery Hospital, Alwarpet, Chennai",
    hospital_phone: "+91 44 4000 6000",
    patient_name: "Anandhi Subramanian (44F)",
    admission_date: "2026-09-19",
    discharge_date: "2026-09-23",
    diagnosis: "Acute Severe Asthma Exacerbation, Allergic Rhinitis",
    document_type: "printed_with_unknown_entity",
    handwritten_detected: false,
    raw_document_text: `KAUVERY HOSPITAL CHENNAI - PULMONOLOGY CARE
PATIENT: Anandhi Subramanian | AGE: 44/F | REG: KH-PULM-771
DIAGNOSIS: Acute Exacerbation of Bronchial Asthma

POST-DISCHARGE MEDICATION REGIMEN:
1. Cap. Levocetirizine 5 mg - 1 cap HS bedtime x 14 days
2. Tab. Deriphyllin 150 mg - 1 tab BD after food x 10 days
3. Tab. Prednisolone 10 mg - 1 tab OD after food x 5 days
4. Tab. Pulmo-Mystifex-Z 800 mg - 1 tab BD x 10 days (Experimental / Non-formulary drug)

DANGER SIGNS REQUIRING IMMEDIATE EMERGENCY CARE:
- Severe breathless unable to complete a sentence
- Blue discoloration of lips or fingertips
- Failure to respond to rescue inhaler

FOLLOW UP:
Date: 2026-10-12 at 04:00 PM (Pulmonology Suite)
What to carry:
- Discharge summary
- Spirometry reports
- Inhaler devices
- All current medicines`,
    extracted_raw: {
      medicines: [
        {
          raw_text: "Cap. Levocetirizine 5 mg - 1 cap HS bedtime x 14 days",
          drug_name: "Levocetirizine",
          dose: "5",
          unit: "mg",
          frequency_code: "HS",
          frequency_human: "At bedtime",
          duration_days: 14,
          food_timing: "bedtime",
          confidence: 0.96
        },
        {
          raw_text: "Tab. Deriphyllin 150 mg - 1 tab BD after food x 10 days",
          drug_name: "Deriphyllin",
          dose: "150",
          unit: "mg",
          frequency_code: "BD",
          frequency_human: "Twice a day",
          duration_days: 10,
          food_timing: "after_food",
          confidence: 0.95
        },
        {
          raw_text: "Tab. Prednisolone 10 mg - 1 tab OD after food x 5 days",
          drug_name: "Prednisolone",
          dose: "10",
          unit: "mg",
          frequency_code: "OD",
          frequency_human: "Once a day",
          duration_days: 5,
          food_timing: "after_food",
          confidence: 0.93
        },
        {
          // Non-existent / unrecognized drug in Indian formulary
          raw_text: "Tab. Pulmo-Mystifex-Z 800 mg - 1 tab BD x 10 days",
          drug_name: "Pulmo-Mystifex-Z",
          dose: "800",
          unit: "mg",
          frequency_code: "BD",
          frequency_human: "Twice a day",
          duration_days: 10,
          food_timing: "after_food",
          confidence: 0.89 // High OCR confidence, but unrecognized drug name!
        }
      ],
      follow_up: {
        date: "2026-10-12",
        what_to_carry: ["Discharge summary", "Spirometry reports", "Inhaler devices", "All current medicines"],
        confidence: 0.94,
        status: "ok"
      },
      warning_signs: [
        { text: "Severe breathless unable to complete a sentence", confidence: 0.97 },
        { text: "Blue discoloration of lips or fingertips", confidence: 0.95 }
      ]
    }
  },
  {
    id: "doc-5-handwritten-refusal",
    title: "5. Handwritten Doctor Prescription (Handwriting Refusal Trigger)",
    hospital_name: "Government General Hospital, Park Town, Chennai",
    hospital_phone: "+91 44 2530 5000",
    patient_name: "C. Balakrishnan (55M)",
    admission_date: "2026-09-21",
    discharge_date: "2026-09-25",
    diagnosis: "General Medicine Ward - Acute Febrile Illness",
    document_type: "handwritten",
    handwritten_detected: true,
    raw_document_text: `[HANDWRITTEN DISCHARGE NOTE - ILLEGIBLE CURSIVE SCRIPT]
Dr. Scribble, MD (Gen Med)
Rx:
- Parac.... 650 ??? TDS
- Amox... ???? BD
- Pan... 40 mg OD
[Scribbled follow-up in cursive: "Review next Sat with CBC"]
[Illegible signature and doctor stamp]`,
    extracted_raw: {
      handwritten_detected: true,
      medicines: [],
      warning_signs: [],
      follow_up: null
    }
  }
];

module.exports = {
  TEST_DOCUMENTS
};
