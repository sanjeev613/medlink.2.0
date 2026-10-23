import React, { useState, useRef, useEffect, useCallback } from 'react';

const DATA_API = import.meta.env.VITE_DATA_API_BASE_URL || 'http://localhost:5002/api';

// ── Demo patients hardcoded for offline fallback
const DEMO_PATIENTS = [
  {
    patientId: 'IRIS-001', name: 'Ravi Patel', age: 45, blood: 'O+',
    allergies: 'Penicillin', conditions: ['Hypertension Stage 1', 'Diabetes Type 2'],
    medications: ['Metformin 500mg', 'Amlodipine 5mg'], doctor: 'Dr. K. Sharma',
    room: 'Bed 12', aiRisk: { score: 74, level: 'Moderate', factors: ['HbA1c elevated', 'BP borderline'] },
    lastVisit: '04 Apr 2026', phone: '+91 98765 43210', aadhaar: '1234-5678-9012',
  },
];

// ── Ravi Patel's stored embedding (matching vector for demo)
const DEMO_MATCH_EMBEDDING = [
  0.12,0.08,0.15,0.21,0.07,0.18,0.11,0.24,0.09,0.17,0.13,0.20,0.06,0.16,0.22,0.10,
  0.14,0.19,0.08,0.23,0.11,0.17,0.05,0.20,0.13,0.09,0.18,0.15,0.22,0.07,0.16,0.12,
  0.21,0.08,0.14,0.19,0.11,0.24,0.06,0.17,0.13,0.20,0.09,0.15,0.22,0.10,0.18,0.07,
  0.16,0.23,0.12,0.08,0.19,0.14,0.21,0.06,0.17,0.11,0.24,0.09,0.15,0.20,0.13,0.08,
  0.18,0.22,0.07,0.16,0.12,0.21,0.10,0.17,0.05,0.14,0.19,0.23,0.11,0.08,0.20,0.15,
  0.09,0.22,0.12,0.17,0.06,0.21,0.14,0.08,0.18,0.11,0.24,0.07,0.15,0.20,0.13,0.09,
  0.19,0.16,0.22,0.10,0.17,0.05,0.14,0.21,0.08,0.18,0.11,0.23,0.07,0.16,0.12,0.20,
  0.09,0.15,0.22,0.13,0.08,0.19,0.11,0.17,0.06,0.24,0.14,0.21,0.10,0.18,0.07,0.15,
];

// ── Extract a 128-dim embedding from canvas ImageData (central circular region)
function extractEmbedding(imageData, width, height) {
  const data = imageData.data;
  const cx = width / 2, cy = height / 2;
  const r = Math.min(cx, cy) * 0.9;
  const sampleCount = 128;
  const vec = new Array(sampleCount).fill(0);

  for (let i = 0; i < sampleCount; i++) {
    const angle = (i / sampleCount) * 2 * Math.PI;
    const rFrac = (i % 8) / 8;
    const px = Math.round(cx + Math.cos(angle) * r * rFrac);
    const py = Math.round(cy + Math.sin(angle) * r * rFrac);
    const idx = (py * width + px) * 4;
    // Convert to grayscale brightness
    const intensity = (data[idx] * 0.299 + data[idx+1] * 0.587 + data[idx+2] * 0.114) / 255;
    vec[i] = intensity;
  }

  // Histogram equalization: normalize
  const min = Math.min(...vec), max = Math.max(...vec);
  const range = max - min || 1;
  return vec.map(v => (v - min) / range);
}

// ── Cosine similarity
function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; magA += a[i]*a[i]; magB += b[i]*b[i]; }
  return magA === 0 || magB === 0 ? 0 : dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ──────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────
export default function IrisScanModule({ mode = 'scan', emergencyMode = false, onStaffLogin }) {
  // state machine: idle | guide | capturing | processing | matching | matched | no_match | enroll_flow | audit
  const [screen, setScreen] = useState(mode === 'enroll' ? 'enroll_flow' : mode === 'audit' ? 'audit' : 'idle');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [captureCount, setCaptureCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [matchedPatient, setMatchedPatient] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [forceDemo, setForceDemo] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [enrollStep, setEnrollStep] = useState(0); // 0=form, 1=capture, 2=done
  const [enrollForm, setEnrollForm] = useState({ patientId: '', name: '', age: '', blood: 'O+', allergies: '' });
  const [enrolledEmbeddings, setEnrolledEmbeddings] = useState([]);
  const [enrollSaving, setEnrollSaving] = useState(false);
  const [showFullRecords, setShowFullRecords] = useState(!emergencyMode);
  const [countdown, setCountdown] = useState(3);
  const [cameraFacing, setCameraFacing] = useState('environment');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const capturedEmbeddings = useRef([]);
  const countdownRef = useRef(null);

  // ── Camera helpers
  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const constraints = { video: { facingMode: cameraFacing, width: { ideal: 640 }, height: { ideal: 480 } } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCameraActive(true);
    } catch (e) {
      if (e.name === 'NotAllowedError') setCameraError('Camera permission denied. Please allow camera access and try again.');
      else if (e.name === 'NotFoundError') setCameraError('No camera found on this device.');
      else setCameraError('Camera unavailable: ' + e.message);
    }
  }, [cameraFacing]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Start scan flow
  const startScan = async () => {
    capturedEmbeddings.current = [];
    setCaptureCount(0);
    setScreen('guide');
    setCountdown(3);
    await startCamera();
    // Begin countdown
    let c = 3;
    countdownRef.current = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) { clearInterval(countdownRef.current); runCapture(); }
    }, 1000);
  };

  // ── Capture 3 frames
  const runCapture = async () => {
    setScreen('capturing');
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      if (videoRef.current && canvasRef.current) {
        const v = videoRef.current;
        const c = canvasRef.current;
        c.width = v.videoWidth || 640;
        c.height = v.videoHeight || 480;
        const ctx = c.getContext('2d');
        ctx.drawImage(v, 0, 0);
        // Grayscale
        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const grey = ctx.createImageData(c.width, c.height);
        for (let p = 0; p < imgData.data.length; p += 4) {
          const g = imgData.data[p]*0.299 + imgData.data[p+1]*0.587 + imgData.data[p+2]*0.114;
          grey.data[p] = grey.data[p+1] = grey.data[p+2] = g;
          grey.data[p+3] = 255;
        }
        ctx.putImageData(grey, 0, 0);
        const emb = extractEmbedding(ctx.getImageData(0, 0, c.width, c.height), c.width, c.height);
        capturedEmbeddings.current.push(emb);
        setCaptureCount(i + 1);
      }
    }
    stopCamera();
    await processEmbeddings();
  };

  // ── Average embeddings + match
  const processEmbeddings = async () => {
    setScreen('processing');
    setProgress(0); setProgressLabel('Preprocessing frames…');
    await animateProgress(0, 40, 600);
    setProgressLabel('Extracting iris features…');
    await animateProgress(40, 75, 700);
    setProgressLabel('Building biometric vector…');
    await animateProgress(75, 95, 500);

    // Average all captured embeddings
    const len = capturedEmbeddings.current[0]?.length || 128;
    const avg = new Array(len).fill(0);
    for (const emb of capturedEmbeddings.current) emb.forEach((v, i) => { avg[i] += v; });
    avg.forEach((_, i) => { avg[i] /= capturedEmbeddings.current.length || 1; });

    // If forceDemo or camera unavailable, nudge embedding toward match
    let finalEmbedding = avg;
    if (forceDemo || capturedEmbeddings.current.length === 0) {
      finalEmbedding = DEMO_MATCH_EMBEDDING.map((v, i) => v * 0.95 + (avg[i] || 0) * 0.05);
    }

    setProgressLabel('Matching against database…');
    setScreen('matching');
    await new Promise(r => setTimeout(r, 800));

    try {
      const res = await fetch(`${DATA_API}/iris/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedding: finalEmbedding, staffId: 'Dr. K. Sharma', method: 'iris-webcam' }),
      });
      const data = await res.json();
      setProgress(100);
      if (data.matched) {
        setMatchedPatient(data.patient);
        setConfidence(data.confidence);
        setScreen('matched');
      } else {
        // Fallback: try offline cosine match against DEMO_PATIENTS
        const offlineSim = cosineSimilarity(finalEmbedding, DEMO_MATCH_EMBEDDING) * 100;
        if (offlineSim > 72) {
          setMatchedPatient(DEMO_PATIENTS[0]);
          setConfidence(Math.round(offlineSim));
          setScreen('matched');
        } else {
          setConfidence(data.confidence || 0);
          setScreen('no_match');
        }
      }
    } catch {
      // Server offline — use local demo match
      const sim = cosineSimilarity(finalEmbedding, DEMO_MATCH_EMBEDDING);
      if (forceDemo || sim > 0.6) {
        setMatchedPatient(DEMO_PATIENTS[0]);
        setConfidence(Math.round((forceDemo ? 0.94 : sim) * 100));
        setScreen('matched');
      } else {
        setScreen('no_match');
      }
    }
  };

  // ── Progress animator
  const animateProgress = (from, to, ms) => new Promise(resolve => {
    let v = from;
    const step = (to - from) / (ms / 30);
    const iv = setInterval(() => {
      v = Math.min(v + step, to);
      setProgress(Math.round(v));
      if (v >= to) { clearInterval(iv); resolve(); }
    }, 30);
  });

  // ── Enrollment flow
  const startEnrollCapture = async () => {
    setEnrolledEmbeddings([]);
    setEnrollStep(1);
    await startCamera();
  };

  const captureEnrollFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
    const ctx = c.getContext('2d');
    ctx.drawImage(v, 0, 0);
    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    const emb = extractEmbedding(imgData, c.width, c.height);
    const next = [...enrolledEmbeddings, emb];
    setEnrolledEmbeddings(next);
    if (next.length >= 3) { stopCamera(); await saveEnrollment(next); }
  };

  const saveEnrollment = async (embeddings) => {
    setEnrollSaving(true);
    const len = embeddings[0]?.length || 128;
    const avg = new Array(len).fill(0);
    for (const e of embeddings) e.forEach((v, i) => { avg[i] += v; });
    avg.forEach((_, i) => { avg[i] /= embeddings.length; });
    try {
      await fetch(`${DATA_API}/iris/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...enrollForm, conditions: [], embedding: avg }),
      });
    } catch { /* offline — still show success for demo */ }
    setEnrollSaving(false);
    setEnrollStep(2);
  };

  // ── Load audit log
  const loadAudit = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch(`${DATA_API}/iris/audit`);
      const data = await res.json();
      if (data.success) setAuditLog(data.audit);
    } catch { setAuditLog([]); }
    setAuditLoading(false);
  };

  useEffect(() => { if (screen === 'audit') loadAudit(); }, [screen]);

  // ── Colours & utilities
  const AC = { teal: '#00d4aa', blue: '#4f8ef7', pink: '#ff6b9d', warn: '#ffb347', danger: '#ff5566', purple: '#a78bfa' };

  const RiskBadge = ({ score }) => {
    const col = score >= 80 ? AC.danger : score >= 60 ? AC.warn : AC.teal;
    return (
      <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:`${col}18`, border:`1px solid ${col}44`, borderRadius:'20px', padding:'4px 12px' }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:col, boxShadow:`0 0 6px ${col}` }} />
        <span style={{ color:col, fontWeight:700, fontSize:13 }}>{score}% Risk</span>
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────
  // RENDER SCREENS
  // ──────────────────────────────────────────────────────────

  // ── IDLE
  if (screen === 'idle') return (
    <div className="iris-module-wrap">
      <div className="iris-landing">
        <div className="iris-landing-icon">
          <svg viewBox="0 0 120 120" width="100" height="100" style={{ filter:'drop-shadow(0 0 24px #00d4aa88)' }}>
            <circle cx="60" cy="60" r="55" fill="none" stroke="#00d4aa22" strokeWidth="4" />
            <circle cx="60" cy="60" r="40" fill="none" stroke="#00d4aa55" strokeWidth="3" />
            <circle cx="60" cy="60" r="26" fill="none" stroke="#00d4aa" strokeWidth="2" />
            <circle cx="60" cy="60" r="13" fill="#00d4aa33" stroke="#00d4aa" strokeWidth="2" />
            <circle cx="60" cy="60" r="5" fill="#00d4aa" />
            <line x1="60" y1="5" x2="60" y2="20" stroke="#00d4aa" strokeWidth="2" strokeLinecap="round" />
            <line x1="60" y1="100" x2="60" y2="115" stroke="#00d4aa" strokeWidth="2" strokeLinecap="round" />
            <line x1="5" y1="60" x2="20" y2="60" stroke="#00d4aa" strokeWidth="2" strokeLinecap="round" />
            <line x1="100" y1="60" x2="115" y2="60" stroke="#00d4aa" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="iris-landing-title">Iris Scan <span className="iris-demo-tag">DEMO</span></h2>
        <p className="iris-landing-sub">
          {emergencyMode
            ? '🔴 Emergency Mode — No login required. Limited data shown after match.'
            : 'Biometric patient identification using iris recognition. Instant access to medical records.'}
        </p>
        {emergencyMode && (
          <div className="iris-emergency-banner">
            <span>🚨</span>
            <div>
              <strong>Emergency Mode Active</strong>
              <div>Blood group and allergies shown immediately. Full records require staff login.</div>
            </div>
          </div>
        )}

        <div className="iris-tips">
          <div className="iris-tip-row"><span>📏</span> Hold device 10–15 cm from eye</div>
          <div className="iris-tip-row"><span>💡</span> Ensure good, even lighting</div>
          <div className="iris-tip-row"><span>👁️</span> Keep eye open, look at camera</div>
          <div className="iris-tip-row"><span>🚫</span> Remove glasses or contacts</div>
        </div>

        <button className="iris-scan-btn" onClick={startScan}>
          <span>👁️</span> Begin Iris Scan
        </button>
        <button className="iris-demo-force-btn" onClick={() => { setForceDemo(true); startScan(); }}>
          ⚡ Force Demo Match (Ravi Patel)
        </button>
        {mode === 'scan' && (
          <button className="iris-audit-link" onClick={() => setScreen('audit')}>
            📋 View Access Audit Log
          </button>
        )}
      </div>
    </div>
  );

  // ── GUIDE + CAMERA
  if (screen === 'guide' || screen === 'capturing') return (
    <div className="iris-module-wrap">
      <div style={{ textAlign:'center', marginBottom:'12px' }}>
        <h3 style={{ fontFamily:'var(--font-head)', fontSize:'18px', margin:'0 0 4px' }}>
          {screen === 'guide' ? `🔢 Starting in ${countdown}…` : `📸 Capturing ${captureCount}/3 frames…`}
        </h3>
        <p style={{ color:'var(--muted)', fontSize:'12px', margin:0 }}>
          {screen === 'guide' ? 'Position your eye within the circle' : 'Hold still — processing each frame'}
        </p>
      </div>

      <div className="iris-camera-container">
        <video ref={videoRef} autoPlay playsInline muted className="iris-video" />
        <canvas ref={canvasRef} style={{ display:'none' }} />
        {/* SVG circle overlay */}
        <svg className="iris-overlay-svg" viewBox="0 0 400 300" preserveAspectRatio="none">
          <defs>
            <mask id="iris-hole">
              <rect width="400" height="300" fill="white" />
              <ellipse cx="200" cy="150" rx="100" ry="80" fill="black" />
            </mask>
          </defs>
          <rect width="400" height="300" fill="rgba(0,0,0,0.55)" mask="url(#iris-hole)" />
          <ellipse cx="200" cy="150" rx="100" ry="80" fill="none" stroke="#00d4aa" strokeWidth="2.5" className="iris-oval-ring" />
          {/* Corner brackets */}
          <path d="M100 70 L100 82 M88 70 L100 70" stroke="#00d4aa" strokeWidth="2" fill="none" />
          <path d="M300 70 L300 82 M312 70 L300 70" stroke="#00d4aa" strokeWidth="2" fill="none" />
          <path d="M100 230 L100 218 M88 230 L100 230" stroke="#00d4aa" strokeWidth="2" fill="none" />
          <path d="M300 230 L300 218 M312 230 L300 230" stroke="#00d4aa" strokeWidth="2" fill="none" />
        </svg>
        {/* Scanning line */}
        {screen === 'capturing' && <div className="iris-scan-line" />}
        {/* Capture dots */}
        <div className="iris-capture-dots">
          {[0,1,2].map(i => (
            <div key={i} className={`iris-dot ${i < captureCount ? 'captured' : ''}`} />
          ))}
        </div>
      </div>

      {cameraError && (
        <div className="iris-error-box">{cameraError}</div>
      )}

      <div className="iris-camera-tips">
        <span>👁️ Keep eye centred inside the oval</span>
        <span>· Don't blink rapidly ·</span>
        <span>💡 Good lighting is essential</span>
      </div>
    </div>
  );

  // ── PROCESSING / MATCHING
  if (screen === 'processing' || screen === 'matching') return (
    <div className="iris-module-wrap">
      <div className="iris-processing-wrap">
        <div className="iris-proc-icon">
          {screen === 'processing' ? '🧬' : '🔍'}
        </div>
        <h3>{screen === 'processing' ? 'Extracting Iris Features' : 'Searching Database'}</h3>
        <p style={{ color:'var(--muted)', fontSize:'13px' }}>{progressLabel || 'Comparing biometric vectors…'}</p>
        <div className="iris-progress-wrap">
          <div className="iris-progress-bar" style={{ width:`${progress}%` }} />
        </div>
        <div style={{ fontSize:'12px', color:'var(--muted)', fontFamily:'var(--font-mono)', marginTop:'8px' }}>{progress}%</div>
        <div className="iris-step-indicators">
          {['Capturing', 'Processing', 'Matching'].map((label, i) => {
            const active = (screen === 'processing' && i <= 1) || (screen === 'matching' && i <= 2);
            return (
              <div key={label} className={`iris-step ${active ? 'done' : ''}`}>
                <div className="iris-step-dot" />
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── MATCHED
  if (screen === 'matched' && matchedPatient) {
    const p = matchedPatient;
    return (
      <div className="iris-module-wrap">
        <div className="iris-result-header matched">
          <div className="iris-result-icon">✅</div>
          <div>
            <h3>Match Found</h3>
            <div className="iris-confidence-badge">
              <div className="iris-conf-bar"><div style={{ width:`${confidence}%`, background:'#00d4aa' }} /></div>
              <span>{confidence}% confidence</span>
            </div>
          </div>
          {emergencyMode && <div className="iris-emg-tag">🚨 Emergency</div>}
        </div>

        {/* Patient card */}
        <div className="iris-patient-card">
          <div className="iris-patient-avatar">{p.name.split(' ').map(n => n[0]).join('')}</div>
          <div className="iris-patient-meta">
            <div className="iris-patient-name">{p.name}</div>
            <div style={{ fontSize:'13px', color:'var(--muted)' }}>
              Age {p.age} · {p.room} · Last visit: {p.lastVisit}
            </div>
          </div>
        </div>

        {/* Critical data — always shown */}
        <div className="iris-vitals-row">
          <div className="iris-vital-chip blood">
            <span>🩸</span>
            <div><div style={{ fontSize:'10px', color:'var(--muted)' }}>Blood Group</div><strong>{p.blood}</strong></div>
          </div>
          <div className="iris-vital-chip allergy">
            <span>⚠️</span>
            <div><div style={{ fontSize:'10px', color:'var(--muted)' }}>Allergies</div><strong>{p.allergies}</strong></div>
          </div>
        </div>

        {/* Emergency mode — gate full records */}
        {emergencyMode && !showFullRecords ? (
          <div className="iris-emg-gate">
            <p>🔒 Full medical records are locked. Staff login required to unlock.</p>
            <button className="iris-unlock-btn" onClick={onStaffLogin}>
              🔐 Staff Login to Unlock Full Records
            </button>
          </div>
        ) : (
          <>
            {/* Conditions & Medications */}
            <div className="iris-detail-grid">
              <div className="iris-detail-panel">
                <div className="iris-detail-label">🩺 Conditions</div>
                {(p.conditions || []).map((c, i) => (
                  <div key={i} className="iris-detail-item">{c}</div>
                ))}
              </div>
              <div className="iris-detail-panel">
                <div className="iris-detail-label">💊 Medications</div>
                {(p.medications || []).map((m, i) => (
                  <div key={i} className="iris-detail-item">{m}</div>
                ))}
              </div>
            </div>

            {/* AI Risk */}
            {p.aiRisk && (
              <div className="iris-ai-panel">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                  <div style={{ fontWeight:700 }}>🤖 AI Risk Prediction</div>
                  <RiskBadge score={p.aiRisk.score} />
                </div>
                <div style={{ fontSize:'13px', color:'var(--muted)', lineHeight:'1.6' }}>
                  {(p.aiRisk.factors || []).map((f, i) => (
                    <span key={i} style={{ display:'inline-block', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'3px 10px', fontSize:'12px', margin:'3px 4px 3px 0' }}>{f}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Info row */}
        {showFullRecords && (
          <div className="iris-info-row">
            {[['Doctor', p.doctor || '—'], ['ABHA/Aadhaar', p.aadhaar || '—'], ['Contact', p.phone || '—']].map(([k,v]) => (
              <div key={k} className="iris-info-chip">
                <div style={{ fontSize:'10px', color:'var(--muted)' }}>{k}</div>
                <div style={{ fontWeight:600, fontSize:'12px' }}>{v}</div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="iris-action-row">
          <button className="iris-action-btn primary" onClick={() => setScreen('idle')}>
            🔄 New Scan
          </button>
          <button className="iris-action-btn secondary" onClick={() => {
            alert(`SOS Info:\n\nPatient: ${p.name}\nBlood: ${p.blood}\nAllergies: ${p.allergies}\nContact: ${p.phone || 'N/A'}`);
          }}>
            🆘 SOS Info
          </button>
          <button className="iris-action-btn audit-btn" onClick={() => setScreen('audit')}>
            📋 Audit
          </button>
        </div>
      </div>
    );
  }

  // ── NO MATCH
  if (screen === 'no_match') return (
    <div className="iris-module-wrap">
      <div className="iris-result-header no-match">
        <div className="iris-result-icon">❌</div>
        <div>
          <h3>No Match Found</h3>
          <p style={{ margin:0, color:'var(--muted)', fontSize:'13px' }}>
            Iris not recognised in database (Confidence: {confidence}%)
          </p>
        </div>
      </div>

      <div className="iris-fallback-panel">
        <div className="iris-fallback-title">🔁 Try Alternative Identification</div>
        <div className="iris-fallback-row">
          <span className="iris-fallback-icon">📱</span>
          <div>
            <strong>Scan QR Code</strong>
            <div style={{ fontSize:'12px', color:'var(--muted)' }}>Patient's emergency QR from their MediCore profile</div>
          </div>
          <button className="iris-fallback-btn qr" onClick={() => alert('Switching to QR scanner…')}>Scan QR</button>
        </div>
        <div className="iris-fallback-row">
          <span className="iris-fallback-icon">🪪</span>
          <div>
            <strong>Search by Aadhaar / Phone</strong>
            <div style={{ fontSize:'12px', color:'var(--muted)' }}>Enter 12-digit Aadhaar or registered phone number</div>
          </div>
          <button className="iris-fallback-btn aadhaar" onClick={() => {
            const id = prompt('Enter Aadhaar number (12 digits) or mobile number:');
            if (id && id.replace(/\D/g,'').length >= 10) {
              setMatchedPatient(DEMO_PATIENTS[0]);
              setConfidence(100);
              setScreen('matched');
            } else alert('Not found or invalid ID.');
          }}>Search</button>
        </div>
        <div className="iris-fallback-row">
          <span className="iris-fallback-icon">🔄</span>
          <div>
            <strong>Try Iris Scan Again</strong>
            <div style={{ fontSize:'12px', color:'var(--muted)' }}>Better lighting and closer positioning may improve accuracy</div>
          </div>
          <button className="iris-fallback-btn retry" onClick={() => { setForceDemo(false); startScan(); }}>Retry</button>
        </div>
      </div>

      <button className="iris-demo-force-btn" style={{ marginTop:'12px' }} onClick={() => {
        setMatchedPatient(DEMO_PATIENTS[0]); setConfidence(94); setScreen('matched');
      }}>
        ⚡ Force Demo Match for Presentation
      </button>
      <button className="iris-audit-link" style={{ marginTop:'8px' }} onClick={() => setScreen('audit')}>
        📋 View Audit Log
      </button>
    </div>
  );

  // ── ENROLL FLOW
  if (screen === 'enroll_flow' || mode === 'enroll') {
    if (enrollStep === 0) return (
      <div className="iris-module-wrap">
        <div className="iris-enroll-header">
          <h3>📸 Enroll Patient Iris</h3>
          <p>Capture 3 close-up eye images to store iris biometric for this patient.</p>
        </div>
        <div className="iris-enroll-form">
          {[
            ['Patient ID', 'patientId', 'text', 'e.g. IRIS-004'],
            ['Full Name', 'name', 'text', 'Patient full name'],
            ['Age', 'age', 'number', 'Age'],
            ['Allergies', 'allergies', 'text', 'e.g. Penicillin, None'],
          ].map(([label, key, type, ph]) => (
            <div className="field" key={key}>
              <label>{label}</label>
              <input type={type} placeholder={ph} value={enrollForm[key]}
                onChange={e => setEnrollForm({ ...enrollForm, [key]: e.target.value })}
                style={{ width:'100%', background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:'12px', padding:'12px 16px', color:'var(--text)' }} />
            </div>
          ))}
          <div className="field">
            <label>Blood Group</label>
            <select value={enrollForm.blood} onChange={e => setEnrollForm({ ...enrollForm, blood: e.target.value })}
              style={{ width:'100%', background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:'12px', padding:'12px 16px', color:'var(--text)' }}>
              {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <button className="iris-scan-btn" onClick={startEnrollCapture} disabled={!enrollForm.patientId || !enrollForm.name}>
            📷 Start Capture (3 frames)
          </button>
        </div>
      </div>
    );

    if (enrollStep === 1) return (
      <div className="iris-module-wrap">
        <div style={{ textAlign:'center', marginBottom:'12px' }}>
          <h3 style={{ fontFamily:'var(--font-head)' }}>📸 Enrolling: {enrollForm.name}</h3>
          <p style={{ color:'var(--muted)', fontSize:'13px' }}>Capture {3 - enrolledEmbeddings.length} more frame(s)</p>
          <div className="iris-capture-dots" style={{ justifyContent:'center', margin:'10px auto' }}>
            {[0,1,2].map(i => <div key={i} className={`iris-dot ${i < enrolledEmbeddings.length ? 'captured' : ''}`} />)}
          </div>
        </div>
        <div className="iris-camera-container">
          <video ref={videoRef} autoPlay playsInline muted className="iris-video" />
          <canvas ref={canvasRef} style={{ display:'none' }} />
          <svg className="iris-overlay-svg" viewBox="0 0 400 300" preserveAspectRatio="none">
            <defs>
              <mask id="iris-hole2"><rect width="400" height="300" fill="white" /><ellipse cx="200" cy="150" rx="100" ry="80" fill="black" /></mask>
            </defs>
            <rect width="400" height="300" fill="rgba(0,0,0,0.55)" mask="url(#iris-hole2)" />
            <ellipse cx="200" cy="150" rx="100" ry="80" fill="none" stroke="#a78bfa" strokeWidth="2.5" className="iris-oval-ring" />
          </svg>
        </div>
        {enrollSaving ? (
          <div style={{ textAlign:'center', padding:'16px', color:'var(--muted)' }}>⏳ Saving enrollment…</div>
        ) : (
          <button className="iris-scan-btn" style={{ background:'linear-gradient(135deg,#a78bfa,#7c3aed)', marginTop:'12px' }} onClick={captureEnrollFrame}>
            📸 Capture Frame {enrolledEmbeddings.length + 1} / 3
          </button>
        )}
        {cameraError && <div className="iris-error-box">{cameraError}</div>}
      </div>
    );

    if (enrollStep === 2) return (
      <div className="iris-module-wrap">
        <div className="iris-enroll-success">
          <div style={{ fontSize:'60px' }}>✅</div>
          <h3>Iris Enrolled Successfully!</h3>
          <p style={{ color:'var(--muted)' }}>
            <strong>{enrollForm.name}</strong> (ID: {enrollForm.patientId}) has been added to the biometric database.
          </p>
          <div className="iris-vitals-row" style={{ justifyContent:'center', marginBottom:'20px' }}>
            <div className="iris-vital-chip blood"><span>🩸</span><div><div style={{ fontSize:'10px', color:'var(--muted)' }}>Blood</div><strong>{enrollForm.blood}</strong></div></div>
            <div className="iris-vital-chip allergy"><span>⚠️</span><div><div style={{ fontSize:'10px', color:'var(--muted)' }}>Allergies</div><strong>{enrollForm.allergies || 'None'}</strong></div></div>
          </div>
          <button className="iris-scan-btn" onClick={() => { setEnrollStep(0); setEnrolledEmbeddings([]); setEnrollForm({ patientId:'', name:'', age:'', blood:'O+', allergies:'' }); }}>
            + Enroll Another Patient
          </button>
        </div>
      </div>
    );
  }

  // ── AUDIT LOG
  if (screen === 'audit') return (
    <div className="iris-module-wrap">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
        <div>
          <h3 style={{ fontFamily:'var(--font-head)', margin:'0 0 4px' }}>🗂️ Iris Access Audit Log</h3>
          <p style={{ margin:0, color:'var(--muted)', fontSize:'13px' }}>Every iris scan attempt is logged with outcome and timestamp</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button className="iris-audit-link" onClick={loadAudit}>🔄 Refresh</button>
          <button className="iris-audit-link" onClick={() => setScreen('idle')}>← Back</button>
        </div>
      </div>

      {auditLoading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'var(--muted)' }}>⏳ Loading logs…</div>
      ) : auditLog.length === 0 ? (
        <div className="iris-audit-empty">
          <div style={{ fontSize:'40px', marginBottom:'12px' }}>📭</div>
          <div>No audit records yet. Perform a scan to create log entries.</div>
        </div>
      ) : (
        <div className="iris-audit-table-wrap">
          <table className="patient-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Outcome</th>
                <th>Patient</th>
                <th>Confidence</th>
                <th>Staff</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry, i) => (
                <tr key={entry.id || i}>
                  <td><span style={{ fontFamily:'var(--font-mono)', fontSize:'11px' }}>{entry.date}<br/>{entry.time}</span></td>
                  <td>
                    <span className={`badge ${entry.outcome === 'MATCH' ? 'present' : 'absent'}`}>
                      {entry.outcome === 'MATCH' ? '✓ Matched' : '✗ No Match'}
                    </span>
                  </td>
                  <td>{entry.patientName || <span style={{ color:'var(--muted)', fontSize:'12px' }}>Not identified</span>}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <div style={{ width:'50px', height:'5px', background:'var(--border)', borderRadius:'3px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${entry.confidence}%`, background: entry.outcome === 'MATCH' ? '#00d4aa' : '#ff5566' }} />
                      </div>
                      <span style={{ fontSize:'12px', fontFamily:'var(--font-mono)' }}>{entry.confidence}%</span>
                    </div>
                  </td>
                  <td><span style={{ fontSize:'12px', color:'var(--muted)' }}>{entry.staffId}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return null;
}
