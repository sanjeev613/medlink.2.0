import React, { useState, useEffect } from 'react';
import './MediCore.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function App() {
  // ═══════════════════════════════════════════════════════
  // AUTHENTICATION & GLOBAL STATE
  // ═══════════════════════════════════════════════════════
  const [currentPage, setCurrentPage] = useState('login'); // login, patient, doctor, nurse
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || null);
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ═══════════════════════════════════════════════════════
  // LOGIN STATE
  // ═══════════════════════════════════════════════════════
  const [selectedRole, setSelectedRole] = useState('patient');
  const [loginForm, setLoginForm] = useState({ userid: '1234-5678-9012', password: 'demo1234' });

  // ═══════════════════════════════════════════════════════
  // PATIENT STATE
  // ═══════════════════════════════════════════════════════
  const [patientActiveView, setPatientActiveView] = useState('overview');
  const [patientLocation] = useState({ lat: 12.9716, lng: 77.5946, address: 'Bangalore, India' });
  
  const [ambulanceList] = useState([
    { id: 'A1', name: 'Unit AMB-04', lat: 12.9720, lng: 77.5950, distance: 1.2, eta: '4 mins', status: 'Available', driver: 'Rajesh' },
    { id: 'A2', name: 'Unit AMB-07', lat: 12.9700, lng: 77.5920, distance: 2.5, eta: '7 mins', status: 'Available', driver: 'Priya' },
    { id: 'A3', name: 'Unit AMB-12', lat: 12.9730, lng: 77.5970, distance: 3.1, eta: '10 mins', status: 'On Call', driver: 'Amit' },
  ]);

  const [hospitalList] = useState([
    { id: 'H1', name: 'Apollo Hospital', lat: 12.9715, lng: 77.5960, distance: 0.3, specialty: 'Multi-specialty', beds: 450, rating: 4.8, phone: '080-4000-0000' },
    { id: 'H2', name: 'Fortis Hospital', lat: 12.9750, lng: 77.5950, distance: 0.8, specialty: 'Multi-specialty', beds: 400, rating: 4.6, phone: '080-6611-1111' },
    { id: 'H3', name: 'Max Healthcare', lat: 12.9680, lng: 77.5920, distance: 1.5, specialty: 'Tertiary Care', beds: 380, rating: 4.7, phone: '080-4444-4444' },
  ]);

  const [medicalRecords] = useState([
    { date: '04-01-2026', doctor: 'Dr. K. Sharma', diagnosis: 'Hypertension (Stage 1)', status: 'Ongoing' },
    { date: '15-12-2025', doctor: 'Dr. A. Menon', diagnosis: 'Diabetes Type 2', status: 'Controlled' },
    { date: '03-10-2025', doctor: 'Dr. P. Nair', diagnosis: 'Seasonal Flu', status: 'Resolved' },
  ]);

  const [medications] = useState([
    { name: 'Metformin 500mg', detail: 'For Diabetes — Twice daily with meals', status: 'Active' },
    { name: 'Amlodipine 5mg', detail: 'For Hypertension — Once daily', status: 'Active' },
  ]);

  const [bookedHospital, setBookedHospital] = useState(null);
  const [recordsSent, setRecordsSent] = useState(false);
  const [sendingRecords, setSendingRecords] = useState(false);

  // ═══════════════════════════════════════════════════════
  // DOCTOR STATE
  // ═══════════════════════════════════════════════════════
  const [doctorActiveView, setDoctorActiveView] = useState('overview');
  const [doctorPatients] = useState([
    { id: 'P1', avatar: 'RP', name: 'Ravi Patel', age: 45, diagnosis: 'Hypertension + Diabetes', condition: 'Moderate', room: 'Bed 12' },
    { id: 'P2', avatar: 'PM', name: 'Priya Menon', age: 52, diagnosis: 'Hypertensive Crisis', condition: 'Critical', room: 'Bed 7' },
    { id: 'P3', avatar: 'SK', name: 'Suresh Kumar', age: 38, diagnosis: 'Dyslipidemia', condition: 'Stable', room: 'Bed 3' },
    { id: 'P4', avatar: 'AL', name: 'Anjali Lakshmanan', age: 29, diagnosis: 'Post-op Recovery', condition: 'Stable', room: 'Bed 9' },
  ]);

  const [doctorAttendance, setDoctorAttendance] = useState({
    P1: 'present',
    P2: 'emergency',
    P3: 'present',
  });

  const [doctorNotes] = useState([
    { patient: 'Ravi Patel', note: 'Patient diagnosed with Hypertension Stage 1. Started on Amlodipine 5mg OD. Advised DASH diet + BP monitoring.', date: '04 Apr 2026' },
    { patient: 'Priya Menon', note: 'Hypertensive crisis. IV labetalol initiated. Transferred to high-dependency unit for monitoring.', date: '04 Apr 2026' },
    { patient: 'Suresh Kumar', note: 'Lipid panel: LDL 168 mg/dL. Initiated Atorvastatin 20mg. Lifestyle counseling done.', date: '03 Apr 2026' },
  ]);

  // ═══════════════════════════════════════════════════════
  // NURSE STATE
  // ═══════════════════════════════════════════════════════
  const [nurseActiveView, setNurseActiveView] = useState('overview');
  const [nurseMedicines] = useState([
    { id: 'M1', patient: 'Ravi Patel', bed: 'Bed 12', medicine: 'Metformin 500mg + Amlodipine 5mg', time: '08:00 AM', status: 'given' },
    { id: 'M2', patient: 'Priya Menon', bed: 'Bed 7', medicine: 'Amlodipine 10mg + IV Labetalol', time: '08:30 AM', status: 'missed' },
    { id: 'M3', patient: 'Suresh Kumar', bed: 'Bed 3', medicine: 'Atorvastatin 20mg', time: '09:00 AM', status: 'given' },
    { id: 'M4', patient: 'Anjali Lakshmanan', bed: 'Bed 9', medicine: 'Cefuroxime 500mg + Paracetamol 650mg', time: '08:00 AM', status: 'given' },
  ]);

  const [medicineStatus, setMedicineStatus] = useState({
    M1: 'given',
    M2: 'missed',
    M3: 'given',
    M4: 'given',
  });

  const [nursNotesList, setNurseNotesList] = useState([
    { patient: 'Bed 7', note: 'Patient Priya Menon complaining of severe headache. BP 160/100. Dr. Sharma informed. IV line secured.', time: '08:30 AM' },
    { patient: 'Bed 12', note: 'Ravi Patel missed evening Metformin dose. Patient said "felt nauseous." Noted and reported to doctor.', time: '07:00 PM (3 Apr)' },
    { patient: 'Bed 9', note: 'Anjali Lakshmanan post-op wound dressing changed. No signs of infection. Vitals stable.', time: '10:00 AM (3 Apr)' },
  ]);

  const [nurseNoteInput, setNurseNoteInput] = useState('');

  // ═══════════════════════════════════════════════════════
  // FUNCTIONS
  // ═══════════════════════════════════════════════════════

  const doLogin = () => {
    const { userid, password } = loginForm;
    if (!userid || !password) {
      setError('Please enter User ID and Password');
      return;
    }
    
    // Simulate login
    setCurrentUser({
      firstName: 'Ravi',
      lastName: 'Patel',
      walletBalance: 24500,
    });
    setUserRole(selectedRole);
    setAuthToken('demo-token-' + Date.now());
    localStorage.setItem('authToken', 'demo-token-' + Date.now());
    localStorage.setItem('userRole', selectedRole);
    
    setCurrentPage(selectedRole);
    setError('');
  };

  const logout = () => {
    setCurrentPage('login');
    setCurrentUser(null);
    setUserRole(null);
    setAuthToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
  };

  const handleSendRecordsToHospital = (hospital) => {
    setSendingRecords(true);
    setTimeout(() => {
      setSendingRecords(false);
      setBookedHospital(hospital);
      setRecordsSent(true);
      alert(`✓ Medical records sent to ${hospital.name}!`);
    }, 1500);
  };

  const toggleMedicineStatus = (id, status) => {
    setMedicineStatus(prev => ({ ...prev, [id]: status }));
  };

  const addNurseNote = () => {
    if (!nurseNoteInput.trim()) return;
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setNurseNotesList([
      { patient: 'Ward 3B', note: nurseNoteInput, time: `${now}, 4 Apr 2026` },
      ...nursNotesList,
    ]);
    setNurseNoteInput('');
  };

  const triggerSOS = () => {
    alert('🚨 SOS ACTIVATED!\n\nAmbulance AMB-04 dispatched.\nETA: 4 minutes\n\nYour location has been shared with:\n• Emergency Team\n• Dr. Kavitha Sharma\n• Apollo Hospital ER');
  };

  // ═══════════════════════════════════════════════════════
  // RENDER: LOGIN PAGE
  // ═══════════════════════════════════════════════════════
  if (currentPage === 'login') {
    return (
      <div id="login-page" className="page active">
        <div className="login-bg"></div>
        <div className="login-grid"></div>
        <div className="login-wrap">
          <div className="login-logo">
            <div className="logo-icon">🏥</div>
            <h1>MediCore</h1>
            <p>Smart Hospital Management System</p>
          </div>
          <div className="login-card">
            <h2>Sign In to Your Portal</h2>
            <div className="role-selector">
              <div
                className={`role-btn ${selectedRole === 'patient' ? 'active' : ''}`}
                data-role="patient"
                onClick={() => setSelectedRole('patient')}
              >
                <div className="role-icon">👤</div>
                <div className="role-label">Patient</div>
              </div>
              <div
                className={`role-btn ${selectedRole === 'doctor' ? 'active' : ''}`}
                data-role="doctor"
                onClick={() => setSelectedRole('doctor')}
              >
                <div className="role-icon">🩺</div>
                <div className="role-label">Doctor</div>
              </div>
              <div
                className={`role-btn ${selectedRole === 'nurse' ? 'active' : ''}`}
                data-role="nurse"
                onClick={() => setSelectedRole('nurse')}
              >
                <div className="role-icon">👩‍⚕️</div>
                <div className="role-label">Nurse</div>
              </div>
            </div>
            <div className="field">
              <label>Aadhaar / User ID</label>
              <input
                type="text"
                placeholder="XXXX-XXXX-XXXX"
                value={loginForm.userid}
                onChange={(e) => setLoginForm({ ...loginForm, userid: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Password / OTP</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>
            <button className="login-btn" onClick={doLogin}>
              → Access Dashboard
            </button>
            {error && <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '10px' }}>{error}</div>}
            <div className="login-demo">
              <p>Quick Demo Access</p>
              <div className="demo-chips">
                <div className="demo-chip p" onClick={() => { setSelectedRole('patient'); setTimeout(doLogin, 100); }}>👤 Patient</div>
                <div className="demo-chip d" onClick={() => { setSelectedRole('doctor'); setTimeout(doLogin, 100); }}>🩺 Doctor</div>
                <div className="demo-chip n" onClick={() => { setSelectedRole('nurse'); setTimeout(doLogin, 100); }}>👩‍⚕️ Nurse</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // RENDER: PATIENT DASHBOARD
  // ═══════════════════════════════════════════════════════
  if (currentPage === 'patient') {
    return (
      <div className="page dashboard-page active">
        <nav className="topnav">
          <div className="topnav-logo">🏥 MediCore</div>
          <span className="role-badge patient">Patient Portal</span>
          <div className="nav-user">
            <div className="nav-avatar patient">RP</div>
            <span className="nav-name">Ravi Patel</span>
          </div>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </nav>
        <div className="dash-layout">
          <aside className="sidebar">
            <div className="sidebar-section-label">Menu</div>
            {[
              { id: 'overview', icon: '📊', label: 'Overview' },
              { id: 'records', icon: '📋', label: 'Medical Records' },
              { id: 'ai', icon: '🧠', label: 'AI Prediction' },
              { id: 'sos', icon: '🚑', label: 'SOS Ambulance' },
              { id: 'wallet', icon: '💳', label: 'Wallet' },
              { id: 'insurance', icon: '🛡️', label: 'Insurance' },
            ].map(item => (
              <div
                key={item.id}
                className={`sidebar-item ${patientActiveView === item.id ? 'active p' : ''}`}
                onClick={() => setPatientActiveView(item.id)}
              >
                <span className="si-icon">{item.icon}</span> {item.label}
              </div>
            ))}
          </aside>
          <main className="main-content" id="patient-main">
            {/* Overview */}
            {patientActiveView === 'overview' && (
              <div className="view active">
                <div className="dash-header">
                  <h2>Good Morning, Ravi 👋</h2>
                  <p>Here's your health summary for today — 4 April 2026</p>
                </div>
                <div className="stat-grid">
                  <div className="stat-card teal"><div className="stat-icon">❤️</div><div className="stat-val">98</div><div className="stat-label">Heart Rate (bpm)</div></div>
                  <div className="stat-card blue"><div className="stat-icon">🩸</div><div className="stat-val">120/80</div><div className="stat-label">Blood Pressure</div></div>
                  <div className="stat-card pink"><div className="stat-icon">🌡️</div><div className="stat-val">98.6°</div><div className="stat-label">Temperature (F)</div></div>
                  <div className="stat-card warn"><div className="stat-icon">⚖️</div><div className="stat-val">72kg</div><div className="stat-label">Body Weight</div></div>
                </div>
                <div className="grid-2">
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">⚠️ AI Health Alerts</div></div>
                    <div className="alert-card warn">
                      <span className="alert-icon">⚠️</span>
                      <div className="alert-body"><strong>Blood Pressure Elevated</strong><span>Slightly above normal range. Monitor closely.</span></div>
                      <span className="alert-time">09:14</span>
                    </div>
                    <div className="alert-card info">
                      <span className="alert-icon">💊</span>
                      <div className="alert-body"><strong>Medication Reminder</strong><span>Metformin 500mg — take with lunch</span></div>
                      <span className="alert-time">12:00</span>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">📅 Upcoming Appointments</div></div>
                    <div className="med-row">
                      <div>🩺</div>
                      <div className="med-info"><div className="med-name">Dr. Kavitha Sharma</div><div className="med-detail">Cardiology • Tomorrow 10:30 AM</div></div>
                      <span className="badge moderate">Scheduled</span>
                    </div>
                    <div className="med-row">
                      <div>🩻</div>
                      <div className="med-info"><div className="med-name">X-Ray Scan</div><div className="med-detail">Radiology • 6 April 2:00 PM</div></div>
                      <span className="badge present">Confirmed</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Medical Records */}
            {patientActiveView === 'records' && (
              <div className="view">
                <div className="dash-header"><h2>📋 Medical Records</h2><p>Your complete health history</p></div>
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">📁 Recent Records</div><button className="panel-action">+ Request Record</button></div>
                  <table className="patient-table">
                    <tr><th>Date</th><th>Doctor</th><th>Diagnosis</th><th>Status</th><th>Action</th></tr>
                    {medicalRecords.map((record, idx) => (
                      <tr key={idx}>
                        <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{record.date}</span></td>
                        <td>{record.doctor}</td>
                        <td>{record.diagnosis}</td>
                        <td><span className={`badge ${record.status === 'Ongoing' ? 'moderate' : record.status === 'Controlled' ? 'present' : 'stable'}`}>{record.status}</span></td>
                        <td><button className="tiny-btn">View</button></td>
                      </tr>
                    ))}
                  </table>
                </div>
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">💊 Current Medications</div></div>
                  {medications.map((med, idx) => (
                    <div key={idx} className="med-row">
                      <div style={{ fontSize: '20px' }}>💊</div>
                      <div className="med-info">
                        <div className="med-name">{med.name}</div>
                        <div className="med-detail">{med.detail}</div>
                      </div>
                      <span className="badge present">{med.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Prediction */}
            {patientActiveView === 'ai' && (
              <div className="view">
                <div className="dash-header"><h2>🧠 AI Health Prediction</h2><p>Powered by MediCore Intelligence Engine</p></div>
                <div className="grid-2">
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">🎯 Risk Score</div></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div className="ai-ring">
                        <svg width="120" height="120" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12"/>
                          <circle cx="60" cy="60" r="50" fill="none" stroke="url(#rg)" strokeWidth="12" strokeDasharray="314" strokeDashoffset="94" strokeLinecap="round"/>
                          <defs><linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ffb347"/><stop offset="100%" stopColor="#ff5566"/></linearGradient></defs>
                        </svg>
                        <div className="ring-val" style={{ color: '#ffb347' }}>70%<small>risk</small></div>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-head)', fontSize: '20px', fontWeight: '700', color: 'var(--warn)' }}>Moderate Risk</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>Cardiovascular risk elevated<br/>due to hypertension + diabetes</div>
                      </div>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">📈 Risk Factors</div></div>
                    <div className="health-metric"><div className="hm-icon">🩸</div><div className="hm-info"><div className="hm-label">Blood Pressure</div><div className="hm-val" style={{ color: 'var(--warn)' }}>120/85</div></div><div className="hm-bar"><div className="hm-fill" style={{ width: '75%', background: 'var(--warn)' }}></div></div></div>
                    <div className="health-metric"><div className="hm-icon">🍬</div><div className="hm-info"><div className="hm-label">Blood Sugar</div><div className="hm-val" style={{ color: 'var(--danger)' }}>180 mg/dL</div></div><div className="hm-bar"><div className="hm-fill" style={{ width: '85%', background: 'var(--danger)' }}></div></div></div>
                    <div className="health-metric"><div className="hm-icon">❤️</div><div className="hm-info"><div className="hm-label">Heart Rate</div><div className="hm-val" style={{ color: 'var(--accent-patient)' }}>98 bpm</div></div><div className="hm-bar"><div className="hm-fill" style={{ width: '50%', background: 'var(--accent-patient)' }}></div></div></div>
                  </div>
                </div>
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">🤖 AI Recommendations</div></div>
                  <div className="alert-card danger"><span className="alert-icon">🚨</span><div className="alert-body"><strong>Urgent: Monitor Blood Sugar</strong><span>HbA1c levels suggest poor glycemic control. Schedule endocrinology consult within 7 days.</span></div></div>
                  <div className="alert-card warn"><span className="alert-icon">🥗</span><div className="alert-body"><strong>Diet Adjustment Needed</strong><span>Reduce sodium intake. DASH diet recommended for hypertension management.</span></div></div>
                  <div className="alert-card info"><span className="alert-icon">🏃</span><div className="alert-body"><strong>Exercise Prescription</strong><span>30 minutes moderate cardio daily. Avoid high-intensity without doctor clearance.</span></div></div>
                </div>
              </div>
            )}

            {/* SOS Ambulance */}
            {patientActiveView === 'sos' && (
              <div className="view">
                <div className="dash-header"><h2>🚑 SOS Ambulance</h2><p>Emergency services — available 24/7</p></div>
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">🆘 Emergency Request</div></div>
                  <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
                    <button className="sos-btn" onClick={triggerSOS}>🚨 &nbsp; SOS — CALL AMBULANCE NOW</button>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '12px' }}>Tap to instantly alert nearest emergency unit.<br/>Your GPS location will be shared automatically.</p>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">📍 Nearest Units</div></div>
                    {ambulanceList.map((ambulance) => (
                      <div key={ambulance.id} className="med-row">
                        <div style={{ fontSize: '20px' }}>🚑</div>
                        <div className="med-info">
                          <div className="med-name">{ambulance.name}</div>
                          <div className="med-detail">{ambulance.distance} km away • ETA {ambulance.eta}</div>
                        </div>
                        <span className={`badge ${ambulance.status === 'Available' ? 'present' : 'absent'}`}>{ambulance.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">📞 Emergency Contacts</div></div>
                    <div className="med-row"><div style={{ fontSize: '20px' }}>👨‍👩‍👦</div><div className="med-info"><div className="med-name">Sunita Patel</div><div className="med-detail">Mother • +91 98765 43210</div></div><button className="tiny-btn success">Call</button></div>
                    <div className="med-row"><div style={{ fontSize: '20px' }}>🩺</div><div className="med-info"><div className="med-name">Dr. K. Sharma</div><div className="med-detail">Primary Doctor • +91 99887 12345</div></div><button className="tiny-btn success">Call</button></div>
                  </div>
                </div>
              </div>
            )}

            {/* Wallet */}
            {patientActiveView === 'wallet' && (
              <div className="view">
                <div className="dash-header"><h2>💳 Health Wallet</h2><p>Manage your healthcare payments</p></div>
                <div className="wallet-card">
                  <div className="wallet-label">Available Balance</div>
                  <div className="wallet-balance">₹ 24,500.00</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>ABHA Health Account • ID: 14-1234-5678-9012</div>
                </div>
                <div className="grid-2" style={{ marginTop: '0' }}>
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">💳 Recent Transactions</div></div>
                    <div className="med-row"><div style={{ fontSize: '18px' }}>🩺</div><div className="med-info"><div className="med-name">Dr. Sharma Consultation</div><div className="med-detail">01 Apr 2026</div></div><span style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>−₹500</span></div>
                    <div className="med-row"><div style={{ fontSize: '18px' }}>💊</div><div className="med-info"><div className="med-name">Pharmacy — Apollo</div><div className="med-detail">28 Mar 2026</div></div><span style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>−₹1,240</span></div>
                    <div className="med-row"><div style={{ fontSize: '18px' }}>💰</div><div className="med-info"><div className="med-name">Insurance Reimbursement</div><div className="med-detail">20 Mar 2026</div></div><span style={{ color: 'var(--accent-patient)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>+₹3,500</span></div>
                  </div>
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">🛡️ Coverage Summary</div></div>
                    <div className="stat-card teal" style={{ marginBottom: '10px' }}><div className="stat-val">₹5L</div><div className="stat-label">Annual Coverage</div></div>
                    <div className="stat-card blue"><div className="stat-val">₹3.8L</div><div className="stat-label">Remaining This Year</div></div>
                  </div>
                </div>
              </div>
            )}

            {/* Insurance */}
            {patientActiveView === 'insurance' && (
              <div className="view">
                <div className="dash-header"><h2>🛡️ Insurance</h2><p>Your active policies</p></div>
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">📄 Active Policy</div><button className="panel-action">Claim</button></div>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ fontSize: '22px', marginBottom: '8px' }}>🏥</div>
                      <div style={{ fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: '700' }}>Star Health Premium</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Policy No: STH-2025-88421</div>
                      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: 'var(--muted)' }}>Sum Insured</span><span>₹5,00,000</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: 'var(--muted)' }}>Claimed</span><span style={{ color: 'var(--accent-patient)' }}>₹1,20,000</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: 'var(--muted)' }}>Valid Until</span><span>31 Mar 2027</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: 'var(--muted)' }}>Status</span><span className="badge present">Active</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // RENDER: DOCTOR DASHBOARD
  // ═══════════════════════════════════════════════════════
  if (currentPage === 'doctor') {
    return (
      <div className="page dashboard-page active">
        <nav className="topnav">
          <div className="topnav-logo">🏥 MediCore</div>
          <span className="role-badge doctor">Doctor Portal</span>
          <div className="nav-user">
            <div className="nav-avatar doctor">KS</div>
            <span className="nav-name">Dr. Kavitha Sharma</span>
          </div>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </nav>
        <div className="dash-layout">
          <aside className="sidebar">
            <div className="sidebar-section-label">Clinical</div>
            {[
              { id: 'overview', icon: '📊', label: 'Overview' },
              { id: 'patients', icon: '👥', label: 'Patient List' },
              { id: 'attendance', icon: '✅', label: 'Attendance' },
              { id: 'records', icon: '📁', label: 'Medical Records' },
              { id: 'rx', icon: '💊', label: 'Prescriptions' },
              { id: 'emergency', icon: '🚨', label: 'Emergency' },
            ].map(item => (
              <div
                key={item.id}
                className={`sidebar-item ${doctorActiveView === item.id ? 'active d' : ''}`}
                onClick={() => setDoctorActiveView(item.id)}
              >
                <span className="si-icon">{item.icon}</span> {item.label}
              </div>
            ))}
          </aside>
          <main className="main-content" id="doctor-main">
            {/* Doctor Overview */}
            {doctorActiveView === 'overview' && (
              <div className="view active">
                <div className="dash-header"><h2>Good Morning, Dr. Sharma 🩺</h2><p>4 April 2026 — Ward 3B, Apollo Hospital</p></div>
                <div className="stat-grid">
                  <div className="stat-card blue"><div className="stat-icon">👥</div><div className="stat-val">24</div><div className="stat-label">Assigned Patients</div></div>
                  <div className="stat-card teal"><div className="stat-icon">✅</div><div className="stat-val">18</div><div className="stat-label">Present Today</div></div>
                  <div className="stat-card warn"><div className="stat-icon">🚨</div><div className="stat-val">2</div><div className="stat-label">Emergency Cases</div></div>
                  <div className="stat-card pink"><div className="stat-icon">💊</div><div className="stat-val">47</div><div className="stat-label">Prescriptions Today</div></div>
                </div>
                <div className="grid-2">
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">🤖 AI Alerts — Doctor</div></div>
                    <div className="alert-card danger">
                      <span className="alert-icon">🔴 <span className="pulse-dot"></span></span>
                      <div className="alert-body"><strong>Patient Risk Increased — Bed 12</strong><span>Ravi Patel: HbA1c spike detected. Immediate review recommended.</span></div>
                      <span className="alert-time">Now</span>
                    </div>
                    <div className="alert-card warn">
                      <span className="alert-icon">⚠️</span>
                      <div className="alert-body"><strong>Vitals Anomaly — Bed 7</strong><span>Priya Menon: BP 160/100. Antihypertensive dosage review needed.</span></div>
                      <span className="alert-time">08:45</span>
                    </div>
                    <div className="alert-card info">
                      <span className="alert-icon">📋</span>
                      <div className="alert-body"><strong>Lab Report Available</strong><span>Suresh Kumar — Lipid panel results ready for review.</span></div>
                      <span className="alert-time">07:30</span>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">📅 Today's Schedule</div></div>
                    <div className="med-row"><div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-doctor)' }}>09:00</div><div className="med-info"><div className="med-name">Ward Round — 3B</div><div className="med-detail">12 patients</div></div></div>
                    <div className="med-row"><div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-doctor)' }}>11:00</div><div className="med-info"><div className="med-name">OP Clinic</div><div className="med-detail">8 appointments</div></div></div>
                    <div className="med-row"><div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-doctor)' }}>14:30</div><div className="med-info"><div className="med-name">Case Review Meeting</div><div className="med-detail">Conference Room B</div></div></div>
                    <div className="med-row"><div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--warn)' }}>16:00</div><div className="med-info"><div className="med-name">ICU Consult — Bed 2</div><div className="med-detail">Emergency</div></div></div>
                  </div>
                </div>
              </div>
            )}

            {/* Patient List */}
            {doctorActiveView === 'patients' && (
              <div className="view">
                <div className="dash-header"><h2>👥 Patient List</h2><p>Your assigned patients</p></div>
                <div className="panel">
                  <div className="search-bar"><span>🔍</span><input type="text" placeholder="Search patients by name, ID, diagnosis..." /></div>
                  <table className="patient-table">
                    <tr><th>Patient</th><th>Age</th><th>Diagnosis</th><th>Condition</th><th>Room</th><th>Actions</th></tr>
                    {doctorPatients.map((patient) => (
                      <tr key={patient.id}>
                        <td><span className="patient-avatar">{patient.avatar}</span>{patient.name}</td>
                        <td>{patient.age}</td>
                        <td>{patient.diagnosis}</td>
                        <td><span className={`badge ${patient.condition === 'Critical' ? 'critical' : patient.condition === 'Moderate' ? 'moderate' : 'stable'}`}>{patient.condition}</span></td>
                        <td>{patient.room}</td>
                        <td><div className="action-btns"><button className="tiny-btn">View</button><button className="tiny-btn">Rx</button></div></td>
                      </tr>
                    ))}
                  </table>
                </div>
              </div>
            )}

            {/* Attendance */}
            {doctorActiveView === 'attendance' && (
              <div className="view">
                <div className="dash-header"><h2>✅ Patient Attendance</h2><p>Daily rounds & OP visit tracking</p></div>
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">📋 Today — 4 April 2026</div><button className="panel-action" onClick={() => alert('Attendance saved!')}>Save All</button></div>
                  <table className="patient-table">
                    <tr><th>Patient</th><th>Room</th><th>Mark Status</th><th>Current</th></tr>
                    {doctorPatients.map((patient) => (
                      <tr key={patient.id}>
                        <td><span className="patient-avatar">{patient.avatar}</span>{patient.name}</td>
                        <td>{patient.room}</td>
                        <td><div className="action-btns">
                          <button className="tiny-btn success" onClick={() => setDoctorAttendance(prev => ({ ...prev, [patient.id]: 'present' }))}>✓ Present</button>
                          <button className="tiny-btn danger" onClick={() => setDoctorAttendance(prev => ({ ...prev, [patient.id]: 'absent' }))}>✗ Absent</button>
                          <button className="tiny-btn" style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }} onClick={() => setDoctorAttendance(prev => ({ ...prev, [patient.id]: 'emergency' }))}>🚨 Emg</button>
                        </div></td>
                        <td id={`att-${patient.id}`}><span className={`badge ${doctorAttendance[patient.id] === 'present' ? 'present' : doctorAttendance[patient.id] === 'emergency' ? 'emergency' : 'absent'}`}>{doctorAttendance[patient.id].charAt(0).toUpperCase() + doctorAttendance[patient.id].slice(1)}</span></td>
                      </tr>
                    ))}
                  </table>
                </div>
              </div>
            )}

            {/* Medical Records */}
            {doctorActiveView === 'records' && (
              <div className="view">
                <div className="dash-header"><h2>📁 Medical Records</h2><p>Add diagnosis & update patient records</p></div>
                <div className="grid-2">
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">➕ Add New Record</div></div>
                    <div className="field"><label>Patient</label>
                      <select style={{ width: '100%', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '12px 16px', color: 'var(--text)', fontSize: '14px', outline: 'none' }}>
                        {doctorPatients.map(p => <option key={p.id}>{p.name} — {p.room}</option>)}
                      </select>
                    </div>
                    <div className="field"><label>Diagnosis</label><input type="text" placeholder="e.g. Hypertension Stage 2" /></div>
                    <div className="field"><label>Notes</label><textarea className="note-input" placeholder="Clinical observations, treatment plan..."></textarea></div>
                    <button className="panel-action" style={{ width: '100%', padding: '10px', marginTop: '4px', fontSize: '13px' }} onClick={() => alert('Record saved!')}>Save Record</button>
                  </div>
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">📋 Recent Diagnoses</div></div>
                    {doctorNotes.map((note, idx) => (
                      <div key={idx} className="note-card">
                        <p>Patient diagnosed with <strong>{note.note.split('diagnosed with')[1]?.split('.')[0]}</strong>. {note.note.split('diagnosed with')[1]?.split('.')[1]}</p>
                        <div className="note-meta">{note.patient} — Dr. Sharma • {note.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Prescription */}
            {doctorActiveView === 'rx' && (
              <div className="view">
                <div className="dash-header"><h2>💊 Prescriptions</h2><p>Write & manage patient prescriptions</p></div>
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">🖊️ New Prescription</div><button className="panel-action" onClick={() => alert('Prescription saved & synced to Nurse portal!')}>Save & Sync →</button></div>
                  <div className="field">
                    <label>Patient</label>
                    <select style={{ width: '100%', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '12px 16px', color: 'var(--text)', fontSize: '14px', outline: 'none' }}>
                      {doctorPatients.map(p => <option key={p.id}>{p.name} — {p.room}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: '8px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Medicines</div>
                  <div className="rx-row">
                    <input type="text" placeholder="Medicine name" defaultValue="Metformin 500mg" />
                    <input type="text" placeholder="Dosage" defaultValue="1-0-1" />
                    <select><option>7 days</option><option>14 days</option><option>30 days</option></select>
                  </div>
                  <div className="rx-row">
                    <input type="text" placeholder="Medicine name" defaultValue="Amlodipine 5mg" />
                    <input type="text" placeholder="Dosage" defaultValue="0-0-1" />
                    <select><option>30 days</option><option>7 days</option><option>14 days</option></select>
                  </div>
                  <div style={{ color: 'var(--accent-doctor)', fontSize: '12px', cursor: 'pointer', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>+ Add Medicine</div>
                </div>
              </div>
            )}

            {/* Emergency */}
            {doctorActiveView === 'emergency' && (
              <div className="view">
                <div className="dash-header"><h2>🚨 Emergency Alerts</h2><p>Live SOS & incoming patient data</p></div>
                <div className="alert-card danger">
                  <span className="alert-icon">🔴 <span className="pulse-dot"></span></span>
                  <div className="alert-body"><strong>LIVE — SOS Request — Ravi Patel</strong><span>Chest pain reported. Ambulance AMB-04 dispatched. ETA 4 min. GPS: 13.082, 80.270</span></div>
                  <div className="action-btns"><button className="tiny-btn success">Accept</button><button className="tiny-btn danger">Escalate</button></div>
                </div>
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">🚑 Incoming Patients (Ambulance)</div></div>
                  <table className="patient-table">
                    <tr><th>Patient</th><th>Condition</th><th>ETA</th><th>Vitals</th><th>Action</th></tr>
                    <tr>
                      <td>Unknown / Trauma-01</td>
                      <td><span className="badge critical">Critical</span></td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--danger)' }}>3 min</span></td>
                      <td><span style={{ fontSize: '12px' }}>BP: 80/50 | HR: 130</span></td>
                      <td><button className="tiny-btn danger">Prep ER</button></td>
                    </tr>
                    <tr>
                      <td>Ravi Patel</td>
                      <td><span className="badge emergency">SOS</span></td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--warn)' }}>7 min</span></td>
                      <td><span style={{ fontSize: '12px' }}>BP: 165/95 | HR: 110</span></td>
                      <td><button className="tiny-btn">Assign Bed</button></td>
                    </tr>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // RENDER: NURSE DASHBOARD
  // ═══════════════════════════════════════════════════════
  if (currentPage === 'nurse') {
    return (
      <div className="page dashboard-page active">
        <nav className="topnav">
          <div className="topnav-logo">🏥 MediCore</div>
          <span className="role-badge nurse">Nurse Portal</span>
          <div className="nav-user">
            <div className="nav-avatar nurse">SL</div>
            <span className="nav-name">Nurse Sunita Lal</span>
          </div>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </nav>
        <div className="dash-layout">
          <aside className="sidebar">
            <div className="sidebar-section-label">Care</div>
            {[
              { id: 'overview', icon: '📊', label: 'Overview' },
              { id: 'patients', icon: '📋', label: 'Patients' },
              { id: 'meds', icon: '💊', label: 'Med Tracker' },
              { id: 'reminders', icon: '⏰', label: 'Reminders' },
              { id: 'notes', icon: '📝', label: 'Notes' },
              { id: 'sync', icon: '📡', label: 'Doctor Sync' },
            ].map(item => (
              <div
                key={item.id}
                className={`sidebar-item ${nurseActiveView === item.id ? 'active n' : ''}`}
                onClick={() => setNurseActiveView(item.id)}
              >
                <span className="si-icon">{item.icon}</span> {item.label}
              </div>
            ))}
          </aside>
          <main className="main-content" id="nurse-main">
            {/* Nurse Overview */}
            {nurseActiveView === 'overview' && (
              <div className="view active">
                <div className="dash-header"><h2>Good Morning, Sunita 👩‍⚕️</h2><p>Ward 3B • Morning Shift — 4 April 2026</p></div>
                <div className="stat-grid">
                  <div className="stat-card pink"><div className="stat-icon">🛏️</div><div className="stat-val">8</div><div className="stat-label">Ward Patients</div></div>
                  <div className="stat-card teal"><div className="stat-icon">✅</div><div className="stat-val">14</div><div className="stat-label">Meds Given</div></div>
                  <div className="stat-card warn"><div className="stat-icon">❌</div><div className="stat-val">2</div><div className="stat-label">Missed Doses</div></div>
                  <div className="stat-card blue"><div className="stat-icon">⏰</div><div className="stat-val">3</div><div className="stat-label">Pending Reminders</div></div>
                </div>
                <div className="grid-2">
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">🤖 AI Alerts — Nurse</div></div>
                    <div className="alert-card danger">
                      <span className="alert-icon">💊 <span className="pulse-dot"></span></span>
                      <div className="alert-body"><strong>Missed Medication — Bed 12</strong><span>Ravi Patel missed evening Metformin dose. Doctor notified.</span></div>
                      <span className="alert-time">Just now</span>
                    </div>
                    <div className="alert-card warn">
                      <span className="alert-icon">⏰</span>
                      <div className="alert-body"><strong>Medicine Due in 15 mins</strong><span>Priya Menon — Amlodipine 5mg due at 08:30</span></div>
                      <span className="alert-time">08:15</span>
                    </div>
                    <div className="alert-card info">
                      <span className="alert-icon">📡</span>
                      <div className="alert-body"><strong>New Prescription Synced</strong><span>Dr. Sharma added Atorvastatin for Suresh Kumar</span></div>
                      <span className="alert-time">07:45</span>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">📊 Shift Summary</div></div>
                    <div className="health-metric"><div className="hm-icon">💊</div><div className="hm-info"><div className="hm-label">Medicines Given</div><div className="hm-val" style={{ color: 'var(--accent-patient)' }}>14 / 16</div></div><div className="hm-bar"><div className="hm-fill" style={{ width: '88%', background: 'var(--accent-patient)' }}></div></div></div>
                    <div className="health-metric"><div className="hm-icon">🩺</div><div className="hm-info"><div className="hm-label">Vitals Checked</div><div className="hm-val" style={{ color: 'var(--accent-doctor)' }}>8 / 8</div></div><div className="hm-bar"><div className="hm-fill" style={{ width: '100%', background: 'var(--accent-doctor)' }}></div></div></div>
                    <div className="health-metric"><div className="hm-icon">📝</div><div className="hm-info"><div className="hm-label">Notes Added</div><div className="hm-val" style={{ color: 'var(--accent-nurse)' }}>5</div></div><div className="hm-bar"><div className="hm-fill" style={{ width: '60%', background: 'var(--accent-nurse)' }}></div></div></div>
                  </div>
                </div>
              </div>
            )}

            {/* Nurse Patients */}
            {nurseActiveView === 'patients' && (
              <div className="view">
                <div className="dash-header"><h2>📋 Ward Patients</h2><p>Your assigned ward — 3B</p></div>
                <div className="panel">
                  <table className="patient-table">
                    <tr><th>Patient</th><th>Bed</th><th>Diagnosis</th><th>Last Vitals</th><th>Status</th></tr>
                    {doctorPatients.map((patient) => (
                      <tr key={patient.id}>
                        <td><span className="patient-avatar">{patient.avatar}</span>{patient.name}</td>
                        <td>{patient.room}</td>
                        <td>{patient.diagnosis}</td>
                        <td><span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>BP 130/85</span></td>
                        <td><span className={`badge ${patient.condition === 'Critical' ? 'critical' : patient.condition === 'Moderate' ? 'moderate' : 'stable'}`}>{patient.condition === 'Critical' ? 'Critical' : patient.condition === 'Moderate' ? 'Monitor' : 'Stable'}</span></td>
                      </tr>
                    ))}
                  </table>
                </div>
              </div>
            )}

            {/* Medicine Tracker */}
            {nurseActiveView === 'meds' && (
              <div className="view">
                <div className="dash-header"><h2>💊 Tablet Distribution Tracker</h2><p>Track medicine distribution — Morning shift</p></div>
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">🌅 Morning Medicines — 4 April</div></div>
                  {nurseMedicines.map((med) => (
                    <div key={med.id} className="med-row">
                      <div className="med-info">
                        <div className="med-name">{med.patient} — {med.bed}</div>
                        <div className="med-detail">{med.medicine}</div>
                      </div>
                      <span className="med-time">{med.time}</span>
                      <div className="med-toggle">
                        <button
                          className={`toggle-btn ${medicineStatus[med.id] === 'given' ? 'given' : ''}`}
                          onClick={() => toggleMedicineStatus(med.id, 'given')}
                        >✅ Given</button>
                        <button
                          className={`toggle-btn ${medicineStatus[med.id] === 'missed' ? 'missed' : ''}`}
                          onClick={() => toggleMedicineStatus(med.id, 'missed')}
                        >❌ Missed</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reminders */}
            {nurseActiveView === 'reminders' && (
              <div className="view">
                <div className="dash-header"><h2>⏰ Reminder System</h2><p>Upcoming medication alerts</p></div>
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">📅 Today's Schedule</div></div>
                  <div className="alert-card danger"><span className="alert-icon">🔴 <span className="pulse-dot"></span></span><div className="alert-body"><strong>NOW — Bed 7: Priya Menon</strong><span>Amlodipine 10mg due. Check BP before administering.</span></div></div>
                  <div className="alert-card warn"><span className="alert-icon">⏰</span><div className="alert-body"><strong>10:00 AM — Bed 12: Ravi Patel</strong><span>Insulin injection + blood glucose check</span></div><span className="alert-time">In 2h</span></div>
                  <div className="alert-card info"><span className="alert-icon">💊</span><div className="alert-body"><strong>12:00 PM — All Patients</strong><span>Afternoon medicines round — Ward 3B</span></div><span className="alert-time">In 4h</span></div>
                  <div className="alert-card info"><span className="alert-icon">🌙</span><div className="alert-body"><strong>08:00 PM — Night Round</strong><span>Night shift medicines + vitals check</span></div><span className="alert-time">Evening</span></div>
                </div>
              </div>
            )}

            {/* Notes */}
            {nurseActiveView === 'notes' && (
              <div className="view">
                <div className="dash-header"><h2>📝 Nurse Notes</h2><p>Patient observations & care notes</p></div>
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">➕ Add Note</div></div>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                    <select style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '10px', color: 'var(--text)', fontSize: '13px', outline: 'none' }}>
                      {doctorPatients.map(p => <option key={p.id}>{p.name} — {p.room}</option>)}
                    </select>
                  </div>
                  <textarea className="note-input" value={nurseNoteInput} onChange={(e) => setNurseNoteInput(e.target.value)} placeholder="e.g. Patient feeling weak, complaining of dizziness..."></textarea>
                  <button className="panel-action" style={{ marginTop: '10px', padding: '8px 20px' }} onClick={addNurseNote}>Save Note</button>
                </div>
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">📋 Recent Notes</div></div>
                  {nursNotesList.map((note, idx) => (
                    <div key={idx} className="note-card">
                      <p>{note.note}</p>
                      <div className="note-meta">{note.patient} — Nurse Sunita Lal • {note.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Doctor Sync */}
            {nurseActiveView === 'sync' && (
              <div className="view">
                <div className="dash-header"><h2>📡 Doctor Sync</h2><p>Live prescription updates from doctors</p></div>
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">🔄 Latest Synced Prescriptions</div></div>
                  <div className="note-card">
                    <p><strong>Ravi Patel — Bed 12</strong><br/>Dr. Sharma updated: Added <span style={{ color: 'var(--accent-patient)' }}>Glipizide 5mg OD</span> for glycemic control. Start from today evening.</p>
                    <div className="note-meta" style={{ color: 'var(--accent-doctor)' }}>📡 Synced • 07:30 AM, 4 Apr 2026 — Dr. K. Sharma</div>
                  </div>
                  <div className="note-card">
                    <p><strong>Suresh Kumar — Bed 3</strong><br/>Dr. Sharma prescribed <span style={{ color: 'var(--accent-patient)' }}>Atorvastatin 20mg OD</span>. Take at night after dinner.</p>
                    <div className="note-meta" style={{ color: 'var(--accent-doctor)' }}>📡 Synced • 06:45 AM, 4 Apr 2026 — Dr. K. Sharma</div>
                  </div>
                  <div className="alert-card info" style={{ marginTop: '8px' }}>
                    <span className="alert-icon">📡</span>
                    <div className="alert-body"><strong>Auto-Sync Active</strong><span>Doctor prescriptions update in real-time. Last sync: 2 minutes ago.</span></div>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-patient)', display: 'inlineBlock', animation: 'pulse 1.5s infinite' }}></span>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }
}
