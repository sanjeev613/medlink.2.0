import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 5002;

// ── Directories & DB paths
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE     = path.join(__dirname, 'records_db.json');
const NOTES_FILE  = path.join(__dirname, 'notes_db.json');
const INSURANCE_FILE = path.join(__dirname, 'insurance_db.json');
const WALLET_FILE = path.join(__dirname, 'wallet_db.json');
const IRIS_FILE   = path.join(__dirname, 'iris_db.json');
const IRIS_AUDIT_FILE = path.join(__dirname, 'iris_audit.json');
const APPOINTMENTS_FILE = path.join(__dirname, 'appointments_db.json');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// ── Init Iris Audit Log
if (!fs.existsSync(IRIS_AUDIT_FILE)) {
  fs.writeFileSync(IRIS_AUDIT_FILE, JSON.stringify([], null, 2));
}

// ── Vector Normalization & Biometric Data Augmentation helpers
const normalizeVector = (v) => {
  let mag = 0;
  for (let i = 0; i < v.length; i++) mag += v[i] * v[i];
  mag = Math.sqrt(mag);
  return mag === 0 ? v : v.map(val => val / mag);
};

const generateTemplates = (baseVec) => {
  if (!baseVec || !Array.isArray(baseVec)) return [];
  const templates = [normalizeVector(baseVec)];
  const len = baseVec.length;

  const t2 = baseVec.map(val => Math.min(1.0, val + 0.02));
  templates.push(normalizeVector(t2));

  const t3 = baseVec.map(val => Math.max(0.0, val - 0.02));
  templates.push(normalizeVector(t3));

  const t4 = baseVec.map((val, idx) => {
    const ramp = -0.015 + (idx / len) * 0.03;
    return Math.max(0.0, Math.min(1.0, val + ramp));
  });
  templates.push(normalizeVector(t4));

  const t5 = baseVec.map((val, idx) => {
    const noise = (Math.sin(idx) * 0.01) + (Math.cos(idx * 2) * 0.01);
    return Math.max(0.0, Math.min(1.0, val + noise));
  });
  templates.push(normalizeVector(t5));

  return templates;
};

// Feed/upgrade Iris DB with augmented sample template data on start for improved accuracy
if (fs.existsSync(IRIS_FILE)) {
  try {
    const db = JSON.parse(fs.readFileSync(IRIS_FILE, 'utf8'));
    let updated = false;
    db.forEach(patient => {
      if (!patient.embeddings || !Array.isArray(patient.embeddings) || patient.embeddings.length < 5) {
        patient.embeddings = generateTemplates(patient.embedding);
        updated = true;
      }
    });
    if (updated) {
      fs.writeFileSync(IRIS_FILE, JSON.stringify(db, null, 2));
      console.log("⚡ Iris DB successfully upgraded and populated with augmented templates for improved accuracy!");
    }
  } catch (e) {
    console.error("Failed to upgrade Iris Database", e);
  }
}

// ── Init Records DB
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([
    { id:'R001', patientId:'P-1234', date:'04-01-2026', doctor:'Dr. K. Sharma', diagnosis:'Hypertension (Stage 1)', status:'Ongoing', photo:null, notes:'', uploadedBy:'patient', createdAt:'2026-01-04T09:00:00Z' },
    { id:'R002', patientId:'P-1234', date:'15-12-2025', doctor:'Dr. A. Menon',  diagnosis:'Diabetes Type 2',       status:'Controlled', photo:null, notes:'', uploadedBy:'patient', createdAt:'2025-12-15T10:00:00Z' },
    { id:'R003', patientId:'P-1234', date:'03-10-2025', doctor:'Dr. P. Nair',   diagnosis:'Seasonal Flu',           status:'Resolved',   photo:null, notes:'', uploadedBy:'patient', createdAt:'2025-10-03T08:30:00Z' },
  ], null, 2));
}

// ── Init Notes DB with seed data
if (!fs.existsSync(NOTES_FILE)) {
  fs.writeFileSync(NOTES_FILE, JSON.stringify([
    {
      id: 'N001', patientId: 'P-1234', type: 'doctor',
      author: 'Dr. K. Sharma', role: 'Cardiologist',
      note: 'Patient presented with Stage 1 Hypertension. Blood pressure consistently elevated at 140/90. Started on Amlodipine 5mg once daily. Advised low-sodium DASH diet, daily walks of 30 minutes, and home BP monitoring twice a day.',
      date: '04 Jan 2026', time: '09:30 AM', createdAt: '2026-01-04T09:30:00Z',
    },
    {
      id: 'N002', patientId: 'P-1234', type: 'doctor',
      author: 'Dr. A. Menon', role: 'Endocrinologist',
      note: 'HbA1c at 7.8% — Diabetes Type 2 moderately controlled. Continue Metformin 500mg twice daily. Advised against refined sugars and white rice. Schedule 3-month follow-up with repeat HbA1c.',
      date: '15 Dec 2025', time: '11:00 AM', createdAt: '2025-12-15T11:00:00Z',
    },
    {
      id: 'N003', patientId: 'P-1234', type: 'nurse',
      author: 'Nurse Sunita Lal', role: 'Ward Nurse - 3B',
      note: 'Patient vitals checked at morning rounds. BP: 138/88, Pulse: 82, Temp: 98.4°F. Patient reports mild headache. Informed Dr. Sharma. Patient advised to rest and hydrate. Evening medication administered on time.',
      date: '04 Apr 2026', time: '08:45 AM', createdAt: '2026-04-04T08:45:00Z',
    },
  ], null, 2));
}

if (!fs.existsSync(WALLET_FILE)) {
  fs.writeFileSync(WALLET_FILE, JSON.stringify({
    'P-1234': {
      patientId: 'P-1234',
      walletBalance: 24500,
      abhaId: '14-1234-5678-9012',
      transactions: [
        { id:'TX001', date:'04 Apr 2026', hospital:'Apollo Hospital', purpose:'Cardiology Consultation', amount:500, type:'debit' },
        { id:'TX002', date:'03 Apr 2026', hospital:'Apollo Pharmacy', purpose:'Medicines - Metformin, Amlodipine', amount:1240, type:'debit' },
        { id:'TX003', date:'20 Mar 2026', hospital:'Govt. Health Scheme', purpose:'PMJAY Credit', amount:5000, type:'credit' },
        { id:'TX004', date:'15 Mar 2026', hospital:'Fortis Hospital', purpose:'X-Ray + Lab Tests', amount:2400, type:'debit' },
        { id:'TX005', date:'01 Mar 2026', hospital:'ABHA Scheme', purpose:'Initial Wallet Credit', amount:25000, type:'credit' }
      ]
    }
  }, null, 2));
}

// ── Multer (all file types: images, PDF, DOCX, etc.)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    cb(null, `${randomUUID()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    // Accept images, PDF, Word docs, text files
    const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|bmp|tiff/i;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) return cb(null, true);
    cb(new Error('File type not supported. Use JPG, PNG, PDF, DOC, DOCX, TXT'));
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));

// ── DB helpers
const readDB    = ()   => JSON.parse(fs.readFileSync(DB_FILE,    'utf8'));
const writeDB   = (d)  => fs.writeFileSync(DB_FILE,    JSON.stringify(d, null, 2));
const readNotes = ()   => JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
const writeNotes= (d)  => fs.writeFileSync(NOTES_FILE, JSON.stringify(d, null, 2));
const readInsurance = () => fs.existsSync(INSURANCE_FILE) ? JSON.parse(fs.readFileSync(INSURANCE_FILE, 'utf8')) : {};
const writeInsurance = (d) => fs.writeFileSync(INSURANCE_FILE, JSON.stringify(d, null, 2));
const readWallet = () => fs.existsSync(WALLET_FILE) ? JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8')) : {};
const writeWallet = (d) => fs.writeFileSync(WALLET_FILE, JSON.stringify(d, null, 2));
const readAppointments = () => fs.existsSync(APPOINTMENTS_FILE) ? JSON.parse(fs.readFileSync(APPOINTMENTS_FILE, 'utf8')) : [];
const writeAppointments = (d) => fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(d, null, 2));

const extractAmountFromText = (text) => {
  const patterns = [
    /AMT[:=]\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
    /amount[:=]\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
    /Rs\.?\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
    /INR\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
    /([0-9]+(?:\.[0-9]{1,2})?)/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1]);
  }

  return NaN;
};

// ═══════════════════════════════════════
// CONFIG API (Centralized Master Data)
// ═══════════════════════════════════════
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    doctors: [
      { id: 'D1', name: 'Dr. K. Sharma', role: 'Cardiologist', avatar: 'KS' },
      { id: 'D2', name: 'Dr. A. Menon', role: 'Endocrinologist', avatar: 'AM' },
      { id: 'D3', name: 'Dr. P. Nair', role: 'General Physician', avatar: 'PN' },
    ],
    hospitals: [
      { id: 'H1', name: 'Apollo Hospital', lat: 12.9715, lng: 77.5960, distance: 0.3, specialty: 'Multi-specialty', beds: 450, rating: 4.8, phone: '080-4000-0000' },
      { id: 'H2', name: 'Fortis Hospital', lat: 12.9750, lng: 77.5950, distance: 0.8, specialty: 'Multi-specialty', beds: 400, rating: 4.6, phone: '080-6611-1111' },
      { id: 'H3', name: 'Max Healthcare', lat: 12.9680, lng: 77.5920, distance: 1.5, specialty: 'Tertiary Care', beds: 380, rating: 4.7, phone: '080-4444-4444' },
    ],
    ambulances: [
      { id: 'A1', name: 'Unit AMB-04', lat: 12.9720, lng: 77.5950, distance: 1.2, eta: '4 mins', status: 'Available', driver: 'Rajesh' },
      { id: 'A2', name: 'Unit AMB-07', lat: 12.9700, lng: 77.5920, distance: 2.5, eta: '7 mins', status: 'Available', driver: 'Priya' },
      { id: 'A3', name: 'Unit AMB-12', lat: 12.9730, lng: 77.5970, distance: 3.1, eta: '10 mins', status: 'On Call', driver: 'Amit' },
    ]
  });
});

// ═══════════════════════════════════════
// RECORDS API
// ═══════════════════════════════════════
app.get('/api/records', (req, res) => {
  const { patientId } = req.query;
  let records = readDB().map(r => ({
    ...r,
    photoUrl: r.photo ? `http://localhost:${PORT}/uploads/${r.photo}` : null,
    fileUrl:  r.photo ? `http://localhost:${PORT}/uploads/${r.photo}` : null,
    isPDF:    r.mimeType === 'application/pdf' || (r.photo || '').endsWith('.pdf'),
    isImage:  r.mimeType ? r.mimeType.startsWith('image/') : /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(r.photo || ''),
  }));
  if (patientId) records = records.filter(r => r.patientId === patientId);
  res.json({ success: true, records });
});

// ═══════════════════════════════════════
// APPOINTMENTS API
// ═══════════════════════════════════════
app.get('/api/appointments', (req, res) => {
  const { patientId, doctorId } = req.query;
  let appointments = readAppointments();
  
  if (patientId) appointments = appointments.filter(a => a.patientId === patientId);
  if (doctorId) appointments = appointments.filter(a => a.doctorId === doctorId);
  
  res.json({ success: true, appointments });
});

app.post('/api/appointments', (req, res) => {
  const { patientId, patientName, doctorId, doctorName, reason, requestedDate, requestedTime } = req.body;
  if (!patientId || !doctorId || !reason || !requestedDate || !requestedTime) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  const appointments = readAppointments();
  const newAppointment = {
    id: `APT${String(appointments.length + 1).padStart(3, '0')}_${Date.now()}`,
    patientId, patientName, doctorId, doctorName, reason,
    requestedDate, requestedTime,
    status: 'Pending',
    approvedTime: null,
    createdAt: new Date().toISOString()
  };

  appointments.unshift(newAppointment);
  writeAppointments(appointments);
  res.json({ success: true, appointment: newAppointment });
});

app.patch('/api/appointments/:id', (req, res) => {
  const { status, approvedTime } = req.body;
  const { id } = req.params;

  const appointments = readAppointments();
  const index = appointments.findIndex(a => a.id === id);
  
  if (index === -1) return res.status(404).json({ success: false, error: 'Appointment not found' });

  appointments[index] = { 
    ...appointments[index], 
    status: status || appointments[index].status,
    approvedTime: approvedTime || appointments[index].approvedTime
  };

  writeAppointments(appointments);
  res.json({ success: true, appointment: appointments[index] });
});

app.delete('/api/appointments/:id', (req, res) => {
  const { id } = req.params;
  const filtered = readAppointments().filter(a => a.id !== id);
  writeAppointments(filtered);
  res.json({ success: true });
});

app.post('/api/records', (req, res) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err.message);
      return res.status(400).json({ success: false, error: err.message });
    }
    const { date, doctor, diagnosis, status, notes, uploadedBy, patientId, reportType } = req.body;
    if (!diagnosis) return res.status(400).json({ success: false, error: 'Diagnosis is required' });
    const records = readDB();
    const now = new Date();
    const newRecord = {
      id: `R${String(Date.now()).slice(-6)}`,
      patientId: patientId || 'P-1234',
      date: date || now.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
      doctor: doctor || 'Self-uploaded',
      diagnosis,
      reportType: reportType || 'General Report',
      status: status || 'Ongoing',
      notes: notes || '',
      // File info
      photo:        req.file ? req.file.filename     : null,
      originalName: req.file ? req.file.originalname : null,
      mimeType:     req.file ? req.file.mimetype     : null,
      fileSize:     req.file ? req.file.size         : null,
      uploadedBy:   uploadedBy || 'patient',
      createdAt:    now.toISOString(),
    };
    records.unshift(newRecord);
    writeDB(records);
    const fileUrl = newRecord.photo ? `http://localhost:${PORT}/uploads/${newRecord.photo}` : null;
    res.json({ success: true, record: { ...newRecord, photoUrl: fileUrl, fileUrl } });
  });
});

app.delete('/api/records/:id', (req, res) => {
  let records = readDB();
  const rec = records.find(r => r.id === req.params.id);
  if (rec?.photo) { const fp = path.join(UPLOADS_DIR, rec.photo); if (fs.existsSync(fp)) fs.unlinkSync(fp); }
  writeDB(records.filter(r => r.id !== req.params.id));
  res.json({ success: true });
});

// ═══════════════════════════════════════
// NOTES API  (doctor / nurse → patient read-only)
// ═══════════════════════════════════════

// GET all notes
app.get('/api/notes', (req, res) => {
  const notes = readNotes();
  res.json({ success: true, notes });
});

// POST a new note  — only doctor or nurse roles allowed
app.post('/api/notes', (req, res) => {
  const { patientId, type, author, role, note } = req.body;
  if (!note || !note.trim()) return res.status(400).json({ success: false, error: 'Note text is required' });
  const noteType = type || (['doctor', 'nurse'].includes(role) ? role : 'doctor');

  const notes = readNotes();
  const now = new Date();
  const newNote = {
    id: `N${String(notes.length + 1).padStart(3, '0')}_${Date.now()}`,
    patientId: patientId || 'P-1234',
    type: noteType,        // 'doctor' | 'nurse'
    author: author || (noteType === 'doctor' ? 'Dr. Kavitha Sharma' : 'Nurse Sunita Lal'),
    role:   role   || (noteType === 'doctor' ? 'General Physician' : 'Ward Nurse'),
    note: note.trim(),
    date: now.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
    time: now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12: true }),
    createdAt: now.toISOString(),
  };
  notes.unshift(newNote);
  writeNotes(notes);
  res.json({ success: true, note: newNote });
});

// DELETE a note
app.delete('/api/notes/:id', (req, res) => {
  writeNotes(readNotes().filter(n => n.id !== req.params.id));
  res.json({ success: true });
});

// ═══════════════════════════════════════
// INSURANCE API
// ═══════════════════════════════════════
app.get('/api/insurance/:patientId', (req, res) => {
  const insuranceData = readInsurance();
  res.json({ success: true, appliedPlan: insuranceData[req.params.patientId] || null });
});

app.post('/api/insurance', (req, res) => {
  const { patientId, plan } = req.body;
  if (!patientId || !plan) return res.status(400).json({ success: false, error: 'Patient ID and Plan are required' });
  const insuranceData = readInsurance();
  insuranceData[patientId] = { ...plan, appliedAt: new Date().toISOString(), status: 'Under Review' };
  writeInsurance(insuranceData);
  res.json({ success: true, appliedPlan: insuranceData[patientId] });
});

app.get('/api/wallet/:patientId', (req, res) => {
  const walletData = readWallet();
  const wallet = walletData[req.params.patientId];

  if (!wallet) {
    return res.status(404).json({ success: false, error: 'Wallet not found' });
  }

  res.json({ success: true, wallet });
});

app.post('/api/wallet/scan-credit', (req, res) => {
  const { patientId, scannedText, source } = req.body;

  if (!patientId || !scannedText?.trim()) {
    return res.status(400).json({ success: false, error: 'Patient ID and scanned text are required' });
  }

  const walletData = readWallet();
  const wallet = walletData[patientId];

  if (!wallet) {
    return res.status(404).json({ success: false, error: 'Wallet not found' });
  }

  const amount = extractAmountFromText(scannedText);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Could not extract a valid amount from scanned text' });
  }

  wallet.walletBalance += amount;
  const transaction = {
    id: `TX${String(wallet.transactions.length + 1).padStart(3, '0')}_${Date.now()}`,
    date: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
    hospital: source || 'QR Scan Credit',
    purpose: `QR scanned amount credited from text: ${scannedText.trim().slice(0, 80)}`,
    amount,
    type: 'credit'
  };

  wallet.transactions.unshift(transaction);
  walletData[patientId] = wallet;
  writeWallet(walletData);

  res.json({ success: true, amount, wallet, transaction });
});

// ═══════════════════════════════════════
// IRIS SCAN API
// ═══════════════════════════════════════

// Helpers
const readIrisDB    = ()  => fs.existsSync(IRIS_FILE) ? JSON.parse(fs.readFileSync(IRIS_FILE, 'utf8')) : [];
const writeIrisDB   = (d) => fs.writeFileSync(IRIS_FILE, JSON.stringify(d, null, 2));
const readIrisAudit = ()  => fs.existsSync(IRIS_AUDIT_FILE) ? JSON.parse(fs.readFileSync(IRIS_AUDIT_FILE, 'utf8')) : [];
const writeIrisAudit= (d) => fs.writeFileSync(IRIS_AUDIT_FILE, JSON.stringify(d, null, 2));

// Cosine similarity between two equal-length vectors
const cosineSim = (a, b) => {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; magA += a[i]*a[i]; magB += b[i]*b[i]; }
  return magA === 0 || magB === 0 ? 0 : dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

// GET /api/iris/patients — list patients (no embeddings)
app.get('/api/iris/patients', (req, res) => {
  const patients = readIrisDB().map(({ embedding, ...rest }) => rest);
  res.json({ success: true, patients });
});

// POST /api/iris/match — compare incoming embedding against DB
app.post('/api/iris/match', (req, res) => {
  const { embedding, staffId, method } = req.body;
  if (!embedding || !Array.isArray(embedding)) {
    return res.status(400).json({ success: false, error: 'Invalid embedding' });
  }

  const irisDB = readIrisDB();
  const THRESHOLD = 0.72;

  let best = null, bestScore = -1;
  for (const patient of irisDB) {
    const templates = patient.embeddings && Array.isArray(patient.embeddings) ? patient.embeddings : [patient.embedding];
    
    // Find the maximum similarity score across all templates for this patient
    let patientBestScore = -1;
    for (const temp of templates) {
      if (!temp || !Array.isArray(temp)) continue;
      const sim = cosineSim(embedding, temp);
      if (sim > patientBestScore) {
        patientBestScore = sim;
      }
    }
    
    if (patientBestScore > bestScore) {
      bestScore = patientBestScore;
      best = patient;
    }
  }

  const matched = bestScore >= THRESHOLD;
  const now = new Date();

  // Log the access attempt
  const audit = readIrisAudit();
  audit.unshift({
    id: `IA${Date.now()}`,
    staffId: staffId || 'unknown',
    method: method || 'iris',
    outcome: matched ? 'MATCH' : 'NO_MATCH',
    patientId: matched ? best.patientId : null,
    patientName: matched ? best.name : null,
    confidence: Math.round(bestScore * 100),
    timestamp: now.toISOString(),
    date: now.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
    time: now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12: true }),
  });
  writeIrisAudit(audit.slice(0, 200)); // Keep last 200

  if (!matched) {
    return res.json({ success: true, matched: false, confidence: Math.round(bestScore * 100) });
  }

  const { embedding: _emb, embeddings: _embs, ...patientData } = best;
  res.json({ success: true, matched: true, confidence: Math.round(bestScore * 100), patient: patientData });
});

// POST /api/iris/enroll — store/update a patient's iris embedding
app.post('/api/iris/enroll', (req, res) => {
  const { patientId, name, age, blood, allergies, conditions, embedding } = req.body;
  if (!patientId || !embedding || !Array.isArray(embedding)) {
    return res.status(400).json({ success: false, error: 'patientId and embedding are required' });
  }

  const irisDB = readIrisDB();
  const existing = irisDB.findIndex(p => p.patientId === patientId);
  const record = {
    patientId, name: name || 'Unknown Patient',
    age: age || '—', blood: blood || 'Unknown',
    allergies: allergies || 'None', conditions: conditions || [],
    medications: [], doctor: 'Dr. K. Sharma', room: 'Pending',
    aiRisk: { score: 50, level: 'Moderate', factors: ['Newly enrolled'] },
    lastVisit: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
    enrolledAt: new Date().toISOString(),
    embedding,
    embeddings: generateTemplates(embedding)
  };

  if (existing >= 0) irisDB[existing] = record;
  else irisDB.push(record);
  writeIrisDB(irisDB);

  res.json({ success: true, patientId, message: 'Iris enrolled successfully' });
});

// ═══════════════════════════════════════
// NEW FEATURES DATABASE INITIALIZATIONS
// ═══════════════════════════════════════
const FAMILY_FILE    = path.join(__dirname, 'family_db.json');
const APPMEDS_FILE   = path.join(__dirname, 'appointments_db.json'); // already exists
const MEDS_FILE      = path.join(__dirname, 'meds_db.json');
const MENTAL_FILE    = path.join(__dirname, 'mental_db.json');
const FAKEMEDS_FILE  = path.join(__dirname, 'fake_meds_db.json');
const FRAUD_FILE     = path.join(__dirname, 'fraud_db.json');

// Init Family members for patient P-1234
if (!fs.existsSync(FAMILY_FILE)) {
  fs.writeFileSync(FAMILY_FILE, JSON.stringify([
    { id: 'FM001', patientId: 'P-1234', relation: 'Grandfather', name: 'Dharampal Patel', age: 78, blood: 'O+', allergies: 'Sulfa Drugs', conditions: ['Diabetes', 'Hypertension'], insurance: 'Senior Care Plus', activeMeds: 3 },
    { id: 'FM002', patientId: 'P-1234', relation: 'Mother', name: 'Sarita Patel', age: 68, blood: 'A+', allergies: 'Penicillin', conditions: ['Osteoporosis'], insurance: 'PMJAY Basic', activeMeds: 1 },
    { id: 'FM003', patientId: 'P-1234', relation: 'Son', name: 'Aarav Patel', age: 14, blood: 'AB+', allergies: 'Dust/Pollen', conditions: ['Asthma'], insurance: 'Star Health Premium', activeMeds: 1 }
  ], null, 2));
}

// Init Meds Database with seed data and drug interactions
if (!fs.existsSync(MEDS_FILE)) {
  fs.writeFileSync(MEDS_FILE, JSON.stringify([
    { id: 'M001', name: 'Metformin 500mg', dosage: '1 tablet', frequency: 'After breakfast + dinner', duration: '30 days', severity: 'Low', interaction: 'No significant immediate interactions.', instructions: 'Take with food to avoid gastric upset.', takenDays: ['2026-07-28', '2026-07-29', '2026-07-30'] },
    { id: 'M002', name: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'After breakfast', duration: '30 days', severity: 'Moderate', interaction: 'Interaction risk: Simvastatin (Limitation on statin dosage recommended).', instructions: 'Monitor BP daily.', takenDays: ['2026-07-29', '2026-07-30'] },
    { id: 'M003', name: 'Atorvastatin 20mg', dosage: '1 tablet', frequency: 'After dinner', duration: '30 days', severity: 'High', interaction: 'Interaction risk: Amlodipine (Increases statin systemic exposure risk).', instructions: 'Avoid grapefruit juice.', takenDays: ['2026-07-28', '2026-07-30'] }
  ], null, 2));
}

// Init Mental Health Weekly Logs
if (!fs.existsSync(MENTAL_FILE)) {
  fs.writeFileSync(MENTAL_FILE, JSON.stringify([
    { id: 'MT001', date: '14 Jul 2026', score: 72, stress: 3, anxiety: 4, burnout: 2, sleep: 8, mood: 'Good', suggestions: 'Maintain current balance. Spend time outdoors.' },
    { id: 'MT002', date: '21 Jul 2026', score: 65, stress: 5, anxiety: 4, burnout: 3, sleep: 7, mood: 'Neutral', suggestions: 'Slight stress elevation. Try morning meditation.' },
    { id: 'MT003', date: '28 Jul 2026', score: 58, stress: 6, anxiety: 5, burnout: 4, sleep: 6, mood: 'Stressed', suggestions: 'High work pressure. Practice breathing exercises and ensure screen-free wind-down time before bed.' }
  ], null, 2));
}

// Init Fake Medicine Database
if (!fs.existsSync(FAKEMEDS_FILE)) {
  fs.writeFileSync(FAKEMEDS_FILE, JSON.stringify([
    { barcode: '8901234567890', name: 'Paracetamol 650mg (Crocin)', manufacturer: 'GSK Healthcare', batch: 'BAT-202604', mfgDate: '12-04-2026', expDate: '11-04-2028', status: 'Genuine', verifiedAt: '2026-07-29T10:15:00Z' },
    { barcode: '8909876543210', name: 'Pantocid 40mg', manufacturer: 'Sun Pharma Ltd.', batch: 'BAT-9930X', mfgDate: '01-02-2026', expDate: '31-01-2029', status: 'Suspicious', verifiedAt: '2026-07-30T09:20:00Z' }
  ], null, 2));
}

// Init AI Fraud Detection claims logs
if (!fs.existsSync(FRAUD_FILE)) {
  fs.writeFileSync(FRAUD_FILE, JSON.stringify([
    { id: 'F001', claimId: 'CLM-90982', patientId: 'P-1234', patientName: 'Ravi Patel', amount: 24500, hospital: 'Apollo Hospital', purpose: 'Double Billing: Cardiology consultation & lab test combo', score: 78, level: 'High', reason: 'Billing amount exceeds cap limits for listed outpatient codes.', status: 'Pending Review' },
    { id: 'F002', claimId: 'CLM-77821', patientId: 'P-1234', patientName: 'Ravi Patel', amount: 2400, hospital: 'Fortis Hospital', purpose: 'Duplicate claim check against TX004 transaction', score: 92, level: 'Critical', reason: 'Claim matches existing TX004 transaction date, hospital, and services.', status: 'Under Investigation' },
    { id: 'F003', claimId: 'CLM-45210', patientId: 'P-1234', patientName: 'Ravi Patel', amount: 500, hospital: 'General OPD clinic', purpose: 'Multiple registrations / Same-day duplicate visits', score: 45, level: 'Medium', reason: 'Claim filed within 2 hours of a pre-existing consulting record.', status: 'Reviewed & Auto-Resolved' }
  ], null, 2));
}

// Helpers
const readFamily = () => JSON.parse(fs.readFileSync(FAMILY_FILE, 'utf8'));
const writeFamily = (d) => fs.writeFileSync(FAMILY_FILE, JSON.stringify(d, null, 2));
const readMeds = () => JSON.parse(fs.readFileSync(MEDS_FILE, 'utf8'));
const writeMeds = (d) => fs.writeFileSync(MEDS_FILE, JSON.stringify(d, null, 2));
const readMental = () => JSON.parse(fs.readFileSync(MENTAL_FILE, 'utf8'));
const writeMental = (d) => fs.writeFileSync(MENTAL_FILE, JSON.stringify(d, null, 2));
const readFakeMeds = () => JSON.parse(fs.readFileSync(FAKEMEDS_FILE, 'utf8'));
const writeFakeMeds = (d) => fs.writeFileSync(FAKEMEDS_FILE, JSON.stringify(d, null, 2));
const readFraud = () => JSON.parse(fs.readFileSync(FRAUD_FILE, 'utf8'));
const writeFraud = (d) => fs.writeFileSync(FRAUD_FILE, JSON.stringify(d, null, 2));

// ═══════════════════════════════════════
// NEW APP ROUTING
// ═══════════════════════════════════════

// Family Switcher API
app.get('/api/family', (req, res) => {
  res.json({ success: true, family: readFamily() });
});

app.post('/api/family', (req, res) => {
  const { relation, name, age, blood, allergies, conditions, insurance } = req.body;
  if (!relation || !name || !age) {
    return res.status(400).json({ success: false, error: 'Relation, Name and Age are required' });
  }
  const family = readFamily();
  const newMember = {
    id: `FM${String(family.length + 1).padStart(3, '0')}`,
    patientId: 'P-1234',
    relation, name, age: Number(age),
    blood: blood || 'O+',
    allergies: allergies || 'None',
    conditions: conditions || [],
    insurance: insurance || 'Govt. Basic',
    activeMeds: 0
  };
  family.push(newMember);
  writeFamily(family);
  res.json({ success: true, member: newMember });
});

// Medications adherence API
app.get('/api/meds', (req, res) => {
  res.json({ success: true, meds: readMeds() });
});

app.post('/api/meds', (req, res) => {
  const { name, dosage, frequency, duration, instructions } = req.body;
  if (!name || !dosage) return res.status(400).json({ success: false, error: 'Name and Dosage are required' });
  
  const meds = readMeds();
  
  // Detect simulated drug interactions
  let severity = 'Low';
  let interaction = 'No significant immediate interactions.';
  
  if (name.toLowerCase().includes('simvastatin') || name.toLowerCase().includes('atorvastatin')) {
    const hasAmlodipine = meds.some(m => m.name.toLowerCase().includes('amlodipine'));
    if (hasAmlodipine) {
      severity = 'High';
      interaction = 'Statin exposure is increased; monitor for myopathy/rhabdomyolysis.';
    }
  }

  const newMed = {
    id: `M${String(meds.length + 1).padStart(3, '0')}`,
    name, dosage, frequency, duration: duration || '30 days',
    severity, interaction, instructions: instructions || '',
    takenDays: []
  };

  meds.push(newMed);
  writeMeds(meds);
  res.json({ success: true, med: newMed });
});

app.post('/api/meds/adherence', (req, res) => {
  const { medId, date, taken } = req.body;
  if (!medId || !date) return res.status(400).json({ success: false, error: 'Med ID and Date are required' });

  const meds = readMeds();
  const index = meds.findIndex(m => m.id === medId);
  if (index === -1) return res.status(404).json({ success: false, error: 'Medication not found' });

  let takenDays = meds[index].takenDays || [];
  if (taken) {
    if (!takenDays.includes(date)) takenDays.push(date);
  } else {
    takenDays = takenDays.filter(d => d !== date);
  }

  meds[index].takenDays = takenDays;
  writeMeds(meds);
  res.json({ success: true, med: meds[index] });
});

// Mental Health Logs
app.get('/api/mental-health', (req, res) => {
  res.json({ success: true, logs: readMental() });
});

app.post('/api/mental-health', (req, res) => {
  const { stress, anxiety, burnout, sleep, mood } = req.body;
  
  // Calculate a wellness score out of 100
  // stress (1-10), anxiety (1-10), burnout (1-10), sleep (1-10), mood (Good=100, Neutral=70, Stressed=40)
  const numericStress = Number(stress) || 5;
  const numericAnxiety = Number(anxiety) || 5;
  const numericBurnout = Number(burnout) || 5;
  const numericSleep = Number(sleep) || 7;

  let moodMultiplier = 70;
  if (mood === 'Good') moodMultiplier = 100;
  if (mood === 'Stressed') moodMultiplier = 40;

  const score = Math.round(
    ( (10 - numericStress) * 3 + (10 - numericAnxiety) * 3 + (10 - numericBurnout) * 2 + (numericSleep / 10) * 10 * 2 + moodMultiplier ) / 2
  );

  const logs = readMental();
  const now = new Date();
  
  let suggestions = "Maintain current work-life balance.";
  if (score < 60) {
    suggestions = "High stress levels detected. We strongly suggest contacting a professional counselor. Engage in deep-breathing exercises daily.";
  } else if (score < 75) {
    suggestions = "Medium stress. Try morning yoga/stretching and limit screen time before sleeping.";
  }

  const newLog = {
    id: `MT${String(logs.length + 1).padStart(3, '0')}`,
    date: now.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
    score,
    stress: numericStress,
    anxiety: numericAnxiety,
    burnout: numericBurnout,
    sleep: numericSleep,
    mood,
    suggestions
  };

  logs.push(newLog);
  writeMental(logs);
  res.json({ success: true, log: newLog });
});

// Fake Medicine Verifier
app.post('/api/medicine/verify', (req, res) => {
  const { barcode } = req.body;
  if (!barcode) return res.status(400).json({ success: false, error: 'Barcode is required' });

  const fakeMeds = readFakeMeds();
  const index = fakeMeds.findIndex(m => m.barcode === barcode);
  
  if (index !== -1) {
    return res.json({ success: true, medicine: fakeMeds[index] });
  }

  // Return generated mock counterfeit for testing if not registered
  const newVerified = {
    barcode,
    name: 'Unknown Pharmaceutical Capsule',
    manufacturer: 'Suspicious Import Corp',
    batch: 'BAT-UNKNOWN',
    mfgDate: '10-10-2025',
    expDate: '10-10-2026',
    status: 'Counterfeit',
    verifiedAt: new Date().toISOString()
  };

  fakeMeds.push(newVerified);
  writeFakeMeds(fakeMeds);
  res.json({ success: true, medicine: newVerified });
});

app.get('/api/medicine/history', (req, res) => {
  res.json({ success: true, history: readFakeMeds() });
});

// Admin Claims Fraud Monitoring API
app.get('/api/admin/fraud-claims', (req, res) => {
  res.json({ success: true, claims: readFraud() });
});

app.post('/api/admin/fraud-claims/action', (req, res) => {
  const { id, status } = req.body;
  const claims = readFraud();
  const idx = claims.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Claim not found' });
  
  claims[idx].status = status;
  writeFraud(claims);
  res.json({ success: true, claim: claims[idx] });
});

// GET /api/iris/audit — access log
app.get('/api/iris/audit', (req, res) => {
  res.json({ success: true, audit: readIrisAudit() });
});

app.listen(PORT, () => {
  console.log(`\n✅  MediLink Server  →  http://localhost:${PORT}`);
  console.log(`📁  Uploads: ${UPLOADS_DIR}`);
  console.log(`🗄️   Records DB: ${DB_FILE}`);
  console.log(`📝  Notes DB:   ${NOTES_FILE}\n`);
});
