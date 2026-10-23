const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Drug = require('../models/drug.model');

const additionalDrugs = [
  {"drug_name": "Levosetirizine + Montelukast", "aliases": ["Montair-LC", "Telekast-L", "Montek-LC"], "category": "Respiratory", "expected_unit": "mg", "min_dose": 10, "max_dose": 15, "common_doses": [15], "allowed_frequencies": ["OD", "HS"], "default_food_timing": "bedtime"},
  {"drug_name": "Amoxicillin", "aliases": ["Mox", "Novamox"], "category": "Antibiotic", "expected_unit": "mg", "min_dose": 250, "max_dose": 1000, "common_doses": [500], "allowed_frequencies": ["TDS"], "default_food_timing": "after_food"},
  {"drug_name": "Clarithromycin", "aliases": ["Claribid", "Biaxin"], "category": "Antibiotic", "expected_unit": "mg", "min_dose": 250, "max_dose": 500, "common_doses": [500], "allowed_frequencies": ["BD"], "default_food_timing": "after_food"},
  {"drug_name": "Linagliptin", "aliases": ["Trajenta", "Ondero"], "category": "Antidiabetic", "expected_unit": "mg", "min_dose": 5, "max_dose": 5, "common_doses": [5], "allowed_frequencies": ["OD"], "default_food_timing": "after_food"},
  {"drug_name": "Glipizide", "aliases": ["Glynase", "Minidiab"], "category": "Antidiabetic", "expected_unit": "mg", "min_dose": 2.5, "max_dose": 20, "common_doses": [5, 10], "allowed_frequencies": ["OD", "BD"], "default_food_timing": "before_food"},
  {"drug_name": "Gliclazide", "aliases": ["Diamicron", "Glycinorm"], "category": "Antidiabetic", "expected_unit": "mg", "min_dose": 30, "max_dose": 120, "common_doses": [40, 60, 80], "allowed_frequencies": ["OD", "BD"], "default_food_timing": "before_food"},
  {"drug_name": "Pioglitazone", "aliases": ["Pioz", "Actos"], "category": "Antidiabetic", "expected_unit": "mg", "min_dose": 15, "max_dose": 45, "common_doses": [15, 30], "allowed_frequencies": ["OD"], "default_food_timing": "after_food"},
  {"drug_name": "Acarbose", "aliases": ["Glucobay", "Asucrose"], "category": "Antidiabetic", "expected_unit": "mg", "min_dose": 25, "max_dose": 100, "common_doses": [50], "allowed_frequencies": ["TDS"], "default_food_timing": "with_food"},
  {"drug_name": "Voglibose", "aliases": ["Volibo", "Vogli"], "category": "Antidiabetic", "expected_unit": "mg", "min_dose": 0.2, "max_dose": 0.3, "common_doses": [0.2, 0.3], "allowed_frequencies": ["TDS"], "default_food_timing": "before_food"},
  {"drug_name": "Insulin Glargine", "aliases": ["Lantus", "Basalog", "Toujeo"], "category": "Antidiabetic", "expected_unit": "IU", "min_dose": 4, "max_dose": 80, "common_doses": [10, 15, 20, 30], "allowed_frequencies": ["OD", "HS"], "default_food_timing": "bedtime"},
  {"drug_name": "Insulin Degludec", "aliases": ["Tresiba"], "category": "Antidiabetic", "expected_unit": "IU", "min_dose": 10, "max_dose": 80, "common_doses": [10, 20], "allowed_frequencies": ["OD"], "default_food_timing": "anytime"},
  {"drug_name": "Insulin Aspart", "aliases": ["NovoRapid"], "category": "Antidiabetic", "expected_unit": "IU", "min_dose": 2, "max_dose": 30, "common_doses": [4, 6, 8, 12], "allowed_frequencies": ["TDS"], "default_food_timing": "before_food"},
  {"drug_name": "Nebivolol", "aliases": ["Nebicard", "Nebistar", "Bystolic"], "category": "Cardiovascular", "expected_unit": "mg", "min_dose": 2.5, "max_dose": 10, "common_doses": [2.5, 5], "allowed_frequencies": ["OD"], "default_food_timing": "after_food"},
  {"drug_name": "Atenolol", "aliases": ["Aten", "Tenormin"], "category": "Cardiovascular", "expected_unit": "mg", "min_dose": 25, "max_dose": 100, "common_doses": [25, 50], "allowed_frequencies": ["OD"], "default_food_timing": "after_food"},
  {"drug_name": "Labetalol", "aliases": ["Gravidol", "Trandate"], "category": "Cardiovascular", "expected_unit": "mg", "min_dose": 100, "max_dose": 400, "common_doses": [100, 200], "allowed_frequencies": ["BD"], "default_food_timing": "after_food"},
  {"drug_name": "Olmesartan", "aliases": ["Olmat", "Benicar"], "category": "Cardiovascular", "expected_unit": "mg", "min_dose": 10, "max_dose": 40, "common_doses": [20, 40], "allowed_frequencies": ["OD"], "default_food_timing": "after_food"},
  {"drug_name": "Candesartan", "aliases": ["Canderlong", "Atacand"], "category": "Cardiovascular", "expected_unit": "mg", "min_dose": 4, "max_dose": 32, "common_doses": [8, 16], "allowed_frequencies": ["OD"], "default_food_timing": "after_food"},
  {"drug_name": "Irbesartan", "aliases": ["Irovel", "Avapro"], "category": "Cardiovascular", "expected_unit": "mg", "min_dose": 75, "max_dose": 300, "common_doses": [150, 300], "allowed_frequencies": ["OD"], "default_food_timing": "after_food"},
  {"drug_name": "Nifedipine", "aliases": ["Depin", "Adalat", "Nicardia"], "category": "Cardiovascular", "expected_unit": "mg", "min_dose": 10, "max_dose": 60, "common_doses": [20, 30], "allowed_frequencies": ["OD", "BD"], "default_food_timing": "after_food"},
  {"drug_name": "Cilnidipine", "aliases": ["Cilacar", "Nexovas"], "category": "Cardiovascular", "expected_unit": "mg", "min_dose": 5, "max_dose": 20, "common_doses": [10, 20], "allowed_frequencies": ["OD"], "default_food_timing": "after_food"},
  {"drug_name": "Benidipine", "aliases": ["Caritec", "Benitres"], "category": "Cardiovascular", "expected_unit": "mg", "min_dose": 4, "max_dose": 8, "common_doses": [4, 8], "allowed_frequencies": ["OD", "BD"], "default_food_timing": "after_food"},
  {"drug_name": "Ranolazine", "aliases": ["Ranx", "Rancad", "Ranexa"], "category": "Cardiovascular", "expected_unit": "mg", "min_dose": 500, "max_dose": 1000, "common_doses": [500], "allowed_frequencies": ["BD"], "default_food_timing": "after_food"},
  {"drug_name": "Trimetazidine", "aliases": ["Flavedon", "Carvidon"], "category": "Cardiovascular", "expected_unit": "mg", "min_dose": 35, "max_dose": 70, "common_doses": [35], "allowed_frequencies": ["BD"], "default_food_timing": "after_food"},
  {"drug_name": "Nicorandil", "aliases": ["Nikoran", "Korandil"], "category": "Cardiovascular", "expected_unit": "mg", "min_dose": 5, "max_dose": 20, "common_doses": [5, 10], "allowed_frequencies": ["BD"], "default_food_timing": "after_food"},
  {"drug_name": "Amiodarone", "aliases": ["Cordarone", "Tachyra"], "category": "Cardiovascular", "expected_unit": "mg", "min_dose": 100, "max_dose": 400, "common_doses": [100, 200], "allowed_frequencies": ["OD", "BD"], "default_food_timing": "after_food"},
  {"drug_name": "Fenofibrate", "aliases": ["Lipicard", "Tricor"], "category": "Cardiovascular", "expected_unit": "mg", "min_dose": 67, "max_dose": 200, "common_doses": [145, 160, 200], "allowed_frequencies": ["OD"], "default_food_timing": "with_food"},
  {"drug_name": "Esomeprazole", "aliases": ["Nexpro", "Nexium"], "category": "Gastrointestinal", "expected_unit": "mg", "min_dose": 20, "max_dose": 40, "common_doses": [40], "allowed_frequencies": ["OD", "BD"], "default_food_timing": "before_food"},
  {"drug_name": "Ilaprazole", "aliases": ["Ilapro", "Adiza"], "category": "Gastrointestinal", "expected_unit": "mg", "min_dose": 10, "max_dose": 10, "common_doses": [10], "allowed_frequencies": ["OD"], "default_food_timing": "before_food"},
  {"drug_name": "Vonoprazan", "aliases": ["Vocinti", "Vonopraz"], "category": "Gastrointestinal", "expected_unit": "mg", "min_dose": 10, "max_dose": 20, "common_doses": [20], "allowed_frequencies": ["OD", "BD"], "default_food_timing": "before_food"},
  {"drug_name": "Mesalamine", "aliases": ["Mesacol", "Asacol"], "category": "Gastrointestinal", "expected_unit": "mg", "min_dose": 400, "max_dose": 2400, "common_doses": [800, 1200], "allowed_frequencies": ["BD", "TDS"], "default_food_timing": "after_food"},
  {"drug_name": "Dicyclomine", "aliases": ["Cyclopam", "Colimex"], "category": "Gastrointestinal", "expected_unit": "mg", "min_dose": 10, "max_dose": 20, "common_doses": [10, 20], "allowed_frequencies": ["TDS", "SOS"], "default_food_timing": "before_food"},
  {"drug_name": "Drotaverine", "aliases": ["Drotikind", "No-Spa"], "category": "Gastrointestinal", "expected_unit": "mg", "min_dose": 40, "max_dose": 80, "common_doses": [40, 80], "allowed_frequencies": ["TDS", "SOS"], "default_food_timing": "after_food"},
  {"drug_name": "Mebeverine", "aliases": ["Colospa", "Morease"], "category": "Gastrointestinal", "expected_unit": "mg", "min_dose": 135, "max_dose": 200, "common_doses": [135, 200], "allowed_frequencies": ["BD", "TDS"], "default_food_timing": "before_food"},
  {"drug_name": "Metoclopramide", "aliases": ["Reglan", "Perinorm"], "category": "Gastrointestinal", "expected_unit": "mg", "min_dose": 5, "max_dose": 10, "common_doses": [10], "allowed_frequencies": ["TDS", "before_food"], "default_food_timing": "before_food"},
  {"drug_name": "Ispaghula Husk", "aliases": ["Isabgol", "Fybogel"], "category": "Gastrointestinal", "expected_unit": "g", "min_dose": 3.5, "max_dose": 10, "common_doses": [5], "allowed_frequencies": ["HS", "BD"], "default_food_timing": "bedtime"},
  {"drug_name": "Polyethylene Glycol", "aliases": ["Pegmove", "Peglec", "Miralax"], "category": "Gastrointestinal", "expected_unit": "g", "min_dose": 8.5, "max_dose": 17, "common_doses": [17], "allowed_frequencies": ["HS", "OD"], "default_food_timing": "bedtime"},
  {"drug_name": "Amikacin", "aliases": ["Amicin", "Mikacin"], "category": "Antibiotic", "expected_unit": "mg", "min_dose": 250, "max_dose": 500, "common_doses": [500], "allowed_frequencies": ["OD", "BD"], "default_food_timing": "after_food"},
  {"drug_name": "Meropenem", "aliases": ["Meronem", "Meromac"], "category": "Antibiotic", "expected_unit": "g", "min_dose": 0.5, "max_dose": 2, "common_doses": [1], "allowed_frequencies": ["TDS"], "default_food_timing": "after_food"},
  {"drug_name": "Piperacillin-Tazobactam", "aliases": ["Pipzo", "Tazact", "Zosyn"], "category": "Antibiotic", "expected_unit": "g", "min_dose": 2.25, "max_dose": 4.5, "common_doses": [4.5], "allowed_frequencies": ["TDS", "QID"], "default_food_timing": "after_food"},
  {"drug_name": "Ceftriaxone", "aliases": ["Monocef", "Rocephin"], "category": "Antibiotic", "expected_unit": "g", "min_dose": 1, "max_dose": 2, "common_doses": [1, 2], "allowed_frequencies": ["OD", "BD"], "default_food_timing": "after_food"},
  {"drug_name": "Cefotaxime", "aliases": ["Taxim", "Claforan"], "category": "Antibiotic", "expected_unit": "g", "min_dose": 1, "max_dose": 2, "common_doses": [1], "allowed_frequencies": ["BD", "TDS"], "default_food_timing": "after_food"},
  {"drug_name": "Cotrimoxazole", "aliases": ["Bactrim", "Septrin"], "category": "Antibiotic", "expected_unit": "mg", "min_dose": 480, "max_dose": 960, "common_doses": [960], "allowed_frequencies": ["BD"], "default_food_timing": "after_food"},
  {"drug_name": "Levocetirizine", "aliases": ["T-Cet", "1-AL", "Cetzine"], "category": "Respiratory", "expected_unit": "mg", "min_dose": 2.5, "max_dose": 10, "common_doses": [5], "allowed_frequencies": ["OD", "HS"], "default_food_timing": "bedtime"},
  {"drug_name": "Cetirizine", "aliases": ["Alerid", "Zyrtec", "Okacet"], "category": "Respiratory", "expected_unit": "mg", "min_dose": 5, "max_dose": 10, "common_doses": [10], "allowed_frequencies": ["OD", "HS"], "default_food_timing": "bedtime"},
  {"drug_name": "Fexofenadine", "aliases": ["Allegra", "Fexova"], "category": "Respiratory", "expected_unit": "mg", "min_dose": 120, "max_dose": 180, "common_doses": [120, 180], "allowed_frequencies": ["OD"], "default_food_timing": "after_food"},
  {"drug_name": "Bilastine", "aliases": ["Bilaxten", "Bilasure"], "category": "Respiratory", "expected_unit": "mg", "min_dose": 20, "max_dose": 20, "common_doses": [20], "allowed_frequencies": ["OD"], "default_food_timing": "empty_stomach"},
  {"drug_name": "Formoterol + Budesonide", "aliases": ["Foracort", "Symbicort"], "category": "Respiratory", "expected_unit": "mcg", "min_dose": 100, "max_dose": 400, "common_doses": [200, 400], "allowed_frequencies": ["BD"], "default_food_timing": "after_food"},
  {"drug_name": "Salmeterol + Fluticasone", "aliases": ["Seretide", "Maxiflo"], "category": "Respiratory", "expected_unit": "mcg", "min_dose": 100, "max_dose": 500, "common_doses": [250], "allowed_frequencies": ["BD"], "default_food_timing": "after_food"},
  {"drug_name": "Tiotropium", "aliases": ["Tiova", "Spiriva"], "category": "Respiratory", "expected_unit": "mcg", "min_dose": 9, "max_dose": 18, "common_doses": [18], "allowed_frequencies": ["OD"], "default_food_timing": "morning"},
  {"drug_name": "Ipratropium", "aliases": ["Ipravent", "Atrovent"], "category": "Respiratory", "expected_unit": "mcg", "min_dose": 20, "max_dose": 40, "common_doses": [20], "allowed_frequencies": ["TDS"], "default_food_timing": "after_food"},
  {"drug_name": "N-Acetylcysteine", "aliases": ["Mucinac", "Fluimucil"], "category": "Respiratory", "expected_unit": "mg", "min_dose": 600, "max_dose": 1200, "common_doses": [600], "allowed_frequencies": ["OD", "BD"], "default_food_timing": "after_food"},
  {"drug_name": "Acebrophylline", "aliases": ["AB Phylline", "Acepbro"], "category": "Respiratory", "expected_unit": "mg", "min_dose": 100, "max_dose": 200, "common_doses": [100], "allowed_frequencies": ["BD"], "default_food_timing": "after_food"},
  {"drug_name": "Phenytoin", "aliases": ["Dilantin", "Eptoin"], "category": "Neurology / Psychiatry", "expected_unit": "mg", "min_dose": 100, "max_dose": 300, "common_doses": [100, 300], "allowed_frequencies": ["OD", "BD"], "default_food_timing": "after_food"},
  {"drug_name": "Carbamazepine", "aliases": ["Tegretol", "Mazetol"], "category": "Neurology / Psychiatry", "expected_unit": "mg", "min_dose": 100, "max_dose": 800, "common_doses": [200, 400], "allowed_frequencies": ["BD", "TDS"], "default_food_timing": "with_food"},
  {"drug_name": "Oxcarbazepine", "aliases": ["Trileptal", "Oxetol"], "category": "Neurology / Psychiatry", "expected_unit": "mg", "min_dose": 150, "max_dose": 600, "common_doses": [300], "allowed_frequencies": ["BD"], "default_food_timing": "after_food"},
  {"drug_name": "Lamotrigine", "aliases": ["Lamictal", "Lamitor"], "category": "Neurology / Psychiatry", "expected_unit": "mg", "min_dose": 25, "max_dose": 200, "common_doses": [50, 100], "allowed_frequencies": ["BD"], "default_food_timing": "after_food"},
  {"drug_name": "Clobazam", "aliases": ["Frisium", "Cloba"], "category": "Neurology / Psychiatry", "expected_unit": "mg", "min_dose": 5, "max_dose": 20, "common_doses": [5, 10], "allowed_frequencies": ["HS", "BD"], "default_food_timing": "bedtime"},
  {"drug_name": "Lorazepam", "aliases": ["Ativan", "Trapex"], "category": "Neurology / Psychiatry", "expected_unit": "mg", "min_dose": 1, "max_dose": 3, "common_doses": [1, 2], "allowed_frequencies": ["HS", "SOS"], "default_food_timing": "bedtime"},
  {"drug_name": "Flunarizine", "aliases": ["Sibelium", "Flunarin"], "category": "Neurology / Psychiatry", "expected_unit": "mg", "min_dose": 5, "max_dose": 10, "common_doses": [5, 10], "allowed_frequencies": ["HS"], "default_food_timing": "bedtime"},
  {"drug_name": "Propranolol + Flunarizine", "aliases": ["Betacap Plus", "Ciplar Plus"], "category": "Neurology / Psychiatry", "expected_unit": "mg", "min_dose": 40, "max_dose": 40, "common_doses": [40], "allowed_frequencies": ["HS"], "default_food_timing": "bedtime"},
  {"drug_name": "Betahistine", "aliases": ["Vertin", "Betavert"], "category": "Neurology / Psychiatry", "expected_unit": "mg", "min_dose": 8, "max_dose": 48, "common_doses": [8, 16, 24], "allowed_frequencies": ["BD", "TDS"], "default_food_timing": "after_food"},
  {"drug_name": "Cinnarizine", "aliases": ["Stugeron", "Vertigon"], "category": "Neurology / Psychiatry", "expected_unit": "mg", "min_dose": 25, "max_dose": 75, "common_doses": [25], "allowed_frequencies": ["TDS"], "default_food_timing": "after_food"},
  {"drug_name": "Citicoline", "aliases": ["Ceham", "Strocit", "Citistar"], "category": "Neurology / Psychiatry", "expected_unit": "mg", "min_dose": 500, "max_dose": 1000, "common_doses": [500], "allowed_frequencies": ["BD"], "default_food_timing": "after_food"},
  {"drug_name": "Piracetam", "aliases": ["Nootropil", "Normabrain"], "category": "Neurology / Psychiatry", "expected_unit": "mg", "min_dose": 400, "max_dose": 2400, "common_doses": [800], "allowed_frequencies": ["BD", "TDS"], "default_food_timing": "after_food"},
  {"drug_name": "Donepezil", "aliases": ["Aricept", "Donecept"], "category": "Neurology / Psychiatry", "expected_unit": "mg", "min_dose": 5, "max_dose": 10, "common_doses": [5, 10], "allowed_frequencies": ["HS"], "default_food_timing": "bedtime"},
  {"drug_name": "Memantine", "aliases": ["Admenta", "Namenda"], "category": "Neurology / Psychiatry", "expected_unit": "mg", "min_dose": 5, "max_dose": 20, "common_doses": [10], "allowed_frequencies": ["OD", "BD"], "default_food_timing": "after_food"},
  {"drug_name": "Ketorolac", "aliases": ["Ketanov", "Toradol"], "category": "Analgesic / Anti-inflammatory", "expected_unit": "mg", "min_dose": 10, "max_dose": 20, "common_doses": [10], "allowed_frequencies": ["BD", "SOS"], "default_food_timing": "after_food"},
  {"drug_name": "Piroxicam", "aliases": ["Dolonex", "Feldene"], "category": "Analgesic / Anti-inflammatory", "expected_unit": "mg", "min_dose": 10, "max_dose": 20, "common_doses": [20], "allowed_frequencies": ["OD"], "default_food_timing": "after_food"},
  {"drug_name": "Indomethacin", "aliases": ["Indocap", "Inmecin"], "category": "Analgesic / Anti-inflammatory", "expected_unit": "mg", "min_dose": 25, "max_dose": 75, "common_doses": [25, 75], "allowed_frequencies": ["BD", "TDS"], "default_food_timing": "after_food"},
  {"drug_name": "Colchicine", "aliases": ["Zycolchin", "Colchicindo"], "category": "Analgesic / Anti-inflammatory", "expected_unit": "mg", "min_dose": 0.5, "max_dose": 1.5, "common_doses": [0.5], "allowed_frequencies": ["OD", "BD"], "default_food_timing": "after_food"},
  {"drug_name": "Dexona (Dexamethasone)", "aliases": ["Dexona", "Decadron"], "category": "Analgesic / Anti-inflammatory", "expected_unit": "mg", "min_dose": 0.5, "max_dose": 4, "common_doses": [0.5, 2], "allowed_frequencies": ["OD", "BD"], "default_food_timing": "after_food"},
  {"drug_name": "Hydrocortisone", "aliases": ["Wysolone", "Efcorlin"], "category": "Analgesic / Anti-inflammatory", "expected_unit": "mg", "min_dose": 10, "max_dose": 40, "common_doses": [20], "allowed_frequencies": ["OD", "BD"], "default_food_timing": "after_food"},
  {"drug_name": "L-Carnitine", "aliases": ["Carnitor", "Carnisure"], "category": "Vitamins & Minerals", "expected_unit": "mg", "min_dose": 330, "max_dose": 1000, "common_doses": [500], "allowed_frequencies": ["BD"], "default_food_timing": "after_food"},
  {"drug_name": "Coenzyme Q10", "aliases": ["CoQ", "Ubiquinone"], "category": "Vitamins & Minerals", "expected_unit": "mg", "min_dose": 50, "max_dose": 300, "common_doses": [100], "allowed_frequencies": ["OD"], "default_food_timing": "after_food"},
  {"drug_name": "Zinc Sulphate", "aliases": ["Zinconia", "Zincovit"], "category": "Vitamins & Minerals", "expected_unit": "mg", "min_dose": 20, "max_dose": 50, "common_doses": [50], "allowed_frequencies": ["OD"], "default_food_timing": "after_food"},
  {"drug_name": "Multivitamin Multimineral", "aliases": ["Becadexamin", "Supradyn", "A to Z NS"], "category": "Vitamins & Minerals", "expected_unit": "tab", "min_dose": 1, "max_dose": 1, "common_doses": [1], "allowed_frequencies": ["OD"], "default_food_timing": "after_food"}
];

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilink_demo';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB.');

    // Load initial seeds
    const seedPath = path.join(__dirname, '../data/seed_drugs.json');
    const baseDrugs = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

    const allDrugs = [...baseDrugs, ...additionalDrugs];
    console.log(`Preparing to seed ${allDrugs.length} Indian hospital discharge medicines...`);

    let inserted = 0;
    let updated = 0;

    for (const item of allDrugs) {
      const res = await Drug.findOneAndUpdate(
        { drug_name: { $regex: new RegExp(`^${item.drug_name}$`, 'i') } },
        { $set: item },
        { upsert: true, new: true }
      );
      if (res) inserted++;
    }

    const totalCount = await Drug.countDocuments();
    console.log(`✓ Seeding complete! Total drugs in DB: ${totalCount}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedDatabase();
