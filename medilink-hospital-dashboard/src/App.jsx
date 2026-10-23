import React, { useState, useEffect, useRef } from 'react';
import './MediCore.css';
import './Emergency2.css';
import IrisScanModule from './IrisScanModule';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import EmergencyCommandCenter from './components/EmergencyCommandCenter';
import HospitalReadinessHub from './components/HospitalReadinessHub';
import AmbulanceCoordinationView from './components/AmbulanceCoordinationView';
import EmergencyAnalyticsView from './components/EmergencyAnalyticsView';
import PatientMobileSosModal from './components/PatientMobileSosModal';
import * as emergencyService from './services/emergencyService';

const API_BASE_URL      = 'http://localhost:5002/api';
const DATA_API_BASE_URL = 'http://localhost:5002/api';
const PATIENT_ID        = 'P-1234';

// ── Fix Leaflet marker icons (Vite compat)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
const userMapIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34],
});
const hospMapIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34],
});
function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 15); }, [lat, lng, map]);
  return null;
}

// ── i18n
const T = {
  en: {
    signIn:'Sign In to Your Portal', aadhaar:'Aadhaar / User ID', pass:'Password / OTP',
    access:'→ Access Dashboard', quickDemo:'Quick Access', language:'Language',
    overview:'Overview', records:'Medical Records', ai:'AI Prediction', sos:'SOS Ambulance',
    wallet:'Wallet', insurance:'Insurance', qr:'QR Code', analytics:'Analytics',
    patientList:'Patient List', attendance:'Attendance', rx:'Prescriptions', emergency:'Emergency',
    patients:'Patients', meds:'Med Tracker', reminders:'Reminders', notes:'Notes', sync:'Doctor Sync',
    logout:'Logout', notifications:'Notifications', patientPortal:'Patient Portal',
    doctorPortal:'Doctor Portal', nursePortal:'Nurse Portal',
  },
  hi: {
    signIn:'अपने पोर्टल में साइन इन करें', aadhaar:'आधार / यूज़र ID', pass:'पासवर्ड / OTP',
    access:'→ डैशबोर्ड खोलें', quickDemo:'त्वरित पहुंच', language:'भाषा',
    overview:'अवलोकन', records:'चिकित्सा रिकॉर्ड', ai:'AI भविष्यवाणी', sos:'SOS एम्बुलेंस',
    wallet:'वॉलेट', insurance:'बीमा', qr:'QR कोड', analytics:'स्वास्थ्य विश्लेषण',
    patientList:'रोगी सूची', attendance:'उपस्थिति', rx:'नुस्खे', emergency:'आपातकाल',
    patients:'रोगी', meds:'दवा ट्रैकर', reminders:'अनुस्मारक', notes:'नोट्स', sync:'डॉक्टर सिंक',
    logout:'लॉग आउट', notifications:'सूचनाएं', patientPortal:'रोगी पोर्टल',
    doctorPortal:'डॉक्टर पोर्टल', nursePortal:'नर्स पोर्टल',
  },
};

// ── Analytics mock data
const bpData = [
  {day:'Mon',sys:125,dia:82},{day:'Tue',sys:122,dia:80},{day:'Wed',sys:128,dia:84},
  {day:'Thu',sys:120,dia:79},{day:'Fri',sys:130,dia:87},{day:'Sat',sys:118,dia:76},{day:'Sun',sys:121,dia:80},
];
const sugarData = [
  {day:'Mon',fasting:145,post:195},{day:'Tue',fasting:138,post:182},{day:'Wed',fasting:152,post:210},
  {day:'Thu',fasting:140,post:188},{day:'Fri',fasting:135,post:178},{day:'Sat',fasting:142,post:193},{day:'Sun',fasting:136,post:180},
];
const heartData = [
  {day:'Mon',hr:96},{day:'Tue',hr:98},{day:'Wed',hr:101},
  {day:'Thu',hr:94},{day:'Fri',hr:97},{day:'Sat',hr:92},{day:'Sun',hr:98},
];

// ── Insurance plans
const INSURANCE_PLANS = [
  { id:'p1', name:'PMJAY Basic', provider:'Government', coverage:'₹5,00,000', premium:'₹0 / year', aiMatch:72, tag:'Free', color:'var(--accent-patient)',
    features:['Hospitalization','Surgery Cover','ICU Care','Lab Tests','Day-care Procedures'] },
  { id:'p2', name:'Star Health Premium', provider:'Star Health Ins.', coverage:'₹10,00,000', premium:'₹8,400 / year', aiMatch:89, tag:'AI Recommended', color:'var(--accent-doctor)',
    features:['Cashless Hospitalization','Critical Illness','OPD Cover','Dental & Vision','Mental Health'] },
  { id:'p3', name:'Senior Care Plus', provider:'Max Bupa', coverage:'₹15,00,000', premium:'₹14,200 / year', aiMatch:95, tag:'Best Match', color:'var(--accent-nurse)',
    features:['No Age Limit','Diabetes Cover','Heart Disease','Cancer Treatment','Unlimited Renewal'] },
];

// ── Wallet transactions
const WALLET_TXN = [
  { id:'TX001', date:'04 Apr 2026', hospital:'Apollo Hospital', purpose:'Cardiology Consultation', amount:500, type:'debit' },
  { id:'TX002', date:'03 Apr 2026', hospital:'Apollo Pharmacy', purpose:'Medicines — Metformin, Amlodipine', amount:1240, type:'debit' },
  { id:'TX003', date:'20 Mar 2026', hospital:'Govt. Health Scheme', purpose:'PMJAY Credit', amount:5000, type:'credit' },
  { id:'TX004', date:'15 Mar 2026', hospital:'Fortis Hospital', purpose:'X-Ray + Lab Tests', amount:2400, type:'debit' },
  { id:'TX005', date:'01 Mar 2026', hospital:'ABHA Scheme', purpose:'Initial Wallet Credit', amount:25000, type:'credit' },
];

// ── Notifications
const NOTIFS = [
  { id:1, icon:'💊', title:'Medicine Reminder', msg:'Metformin 500mg — take with lunch', time:'12:00 PM', read:false },
  { id:2, icon:'⚠️', title:'BP Alert', msg:'Blood pressure slightly elevated (130/85)', time:'09:14 AM', read:false },
  { id:3, icon:'📅', title:'Appointment Tomorrow', msg:'Dr. Kavitha Sharma — Cardiology, 10:30 AM', time:'Yesterday', read:false },
  { id:4, icon:'🧪', title:'Lab Report Ready', msg:'HbA1c results available', time:'3 Apr', read:true },
  { id:5, icon:'💰', title:'Wallet Credit', msg:'PMJAY credited ₹5,000 to your health wallet', time:'20 Mar', read:true },
];

// ── SOS hospital builder (dynamic based on GPS)
const buildSosHospitals = (lat, lng) => [
  { id:'H1', name:'Apollo Hospital', lat:lat+0.004, lng:lng+0.003, dist:'0.4 km', eta:'2 min', beds:28, phone:'080-4000-0000' },
  { id:'H2', name:'Fortis Hospital', lat:lat-0.006, lng:lng+0.005, dist:'0.9 km', eta:'4 min', beds:12, phone:'080-6611-1111' },
  { id:'H3', name:'Manipal Hospital', lat:lat+0.009, lng:lng-0.007, dist:'1.3 km', eta:'7 min', beds:35, phone:'080-2502-7000' },
];

// ── Recharts custom tooltip
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'10px', padding:'10px 14px' }}>
      <p style={{ color:'var(--muted)', fontSize:'11px', fontFamily:'var(--font-mono)', marginBottom:'4px' }}>{label}</p>
      {payload.map((p,i) => <p key={i} style={{ color:p.color, fontSize:'13px', fontWeight:'600' }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

// ── Skeleton Loader Component
const Skeleton = ({ width='100%', height='20px', borderRadius='8px', margin='10px 0' }) => (
  <div className="skeleton-loader" style={{ width, height, borderRadius, margin }}></div>
);

// ── Live Pulse Indicator
const ConnectionPulse = () => (
  <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,0.03)', padding:'4px 12px', borderRadius:'20px', border:'1px solid var(--border)' }}>
    <div className="pulse-dot green"></div>
    <span style={{ fontSize:'10px', color:'var(--muted)', fontWeight:'700', fontFamily:'var(--font-mono)', textTransform:'uppercase' }}>Live System</span>
  </div>
);

// ── Dashboard Sub-Components (Efficiency Extract)

const PatientAppointments = ({ doctors, bookingForm, setBookingForm, bookAppointment, appsLoading, appointments }) => (
  <div className="view">
    <div className="dash-header"><h2>📅 My Appointments</h2><p>Book & manage your hospital visits</p></div>
    <div className="grid-2">
      <div className="panel">
        <div className="panel-header"><div className="panel-title">➕ Book New Appointment</div></div>
        <div className="field">
          <label>Select Doctor</label>
          <select value={bookingForm.doctorId} onChange={e => setBookingForm({...bookingForm, doctorId: e.target.value})} style={{ width:'100%', background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:'12px', padding:'12px', color:'var(--text)', fontSize:'14px' }}>
            <option value="">— Select a Specialist —</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.role})</option>)}
          </select>
        </div>
        <div className="field">
          <label>Reason for Visit</label>
          <input type="text" placeholder="e.g. Annual physical, chronic pain" value={bookingForm.reason} onChange={e => setBookingForm({...bookingForm, reason: e.target.value})} style={{ width:'100%', background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:'12px', padding:'12px', color:'var(--text)' }} />
        </div>
        <div className="grid-2" style={{ gap:'10px' }}>
          <div className="field">
            <label>Date</label>
            <input type="date" value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} style={{ width:'100%', background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:'12px', padding:'12px', color:'var(--text)' }} />
          </div>
          <div className="field">
            <label>Preferred Time</label>
            <input type="time" value={bookingForm.time} onChange={e => setBookingForm({...bookingForm, time: e.target.value})} style={{ width:'100%', background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:'12px', padding:'12px', color:'var(--text)' }} />
          </div>
        </div>
        <button className="panel-action" style={{ width:'100%', marginTop:'10px' }} onClick={bookAppointment}>🚀 Send Booking Request</button>
      </div>
      
      <div className="panel">
        <div className="panel-header"><div className="panel-title">🗓️ Current Status</div></div>
        {appsLoading ? (
          <div style={{ padding:'10px' }}>
            <Skeleton height="60px" />
            <Skeleton height="60px" />
            <Skeleton height="60px" />
          </div>
        ) : appointments.length === 0 ? <div style={{ textAlign:'center', color:'var(--muted)', padding:'20px' }}>No appointments yet.</div> : 
          appointments.map(apt => (
            <div key={apt.id} className="note-card" style={{ borderLeft:`4px solid ${apt.status==='Approved'?'var(--accent-patient)':apt.status==='Rejected'?'var(--danger)':'var(--warn)'}`, background:'rgba(255,255,255,0.02)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                <span style={{ fontWeight:'700' }}>{apt.doctorName}</span>
                <span className={`badge ${apt.status.toLowerCase()}`}>{apt.status}</span>
              </div>
              <div style={{ fontSize:'12px', color:'var(--muted)', marginBottom:'4px' }}>Reason: {apt.reason}</div>
              <div style={{ fontSize:'12px', fontWeight:'600' }}>
                {apt.status === 'Approved' ? `📅 Confirmed: ${apt.requestedDate} @ ${apt.approvedTime}` : `⏳ Requested: ${apt.requestedDate} @ ${apt.requestedTime}`}
              </div>
            </div>
          ))}
      </div>
    </div>
  </div>
);

const DoctorAppointments = ({ appointments, updateAppointment }) => (
  <div className="view">
    <div className="dash-header"><h2>🗓️ Appointment Requests</h2><p>Review and confirm your patient schedule</p></div>
    <div className="panel">
      <div className="panel-header"><div className="panel-title">Incoming Requests</div></div>
      <div className="record-list">
        {appointments.filter(a => a.status === 'Pending').length === 0 ? 
          <div style={{ textAlign:'center', color:'var(--muted)', padding:'30px' }}>✅ You are all caught up!</div> :
          appointments.filter(a => a.status === 'Pending').map(apt => (
            <div key={apt.id} className="record-item">
              <div className="record-info">
                <div style={{ fontWeight:'700', fontSize:'15px' }}>{apt.patientName}</div>
                <div style={{ fontSize:'12px', color:'var(--muted)' }}>Reason: {apt.reason}</div>
                <div style={{ fontSize:'12px', color:'var(--accent-doctor)', fontWeight:'600' }}>Requested: {apt.requestedDate} @ {apt.requestedTime}</div>
              </div>
              <div className="action-btns">
                <button className="tiny-btn" onClick={() => {
                  const time = prompt('Assign Confirmed Time Slot (e.g. 10:45 AM):', apt.requestedTime);
                  if (time) updateAppointment(apt.id, 'Approved', time);
                }}>Approve</button>
                <button className="tiny-btn danger" onClick={() => updateAppointment(apt.id, 'Rejected')}>Reject</button>
              </div>
            </div>
          ))}
      </div>
    </div>
    
    <div className="panel" style={{ marginTop:'20px' }}>
      <div className="panel-header"><div className="panel-title">📅 Confirmed Today</div></div>
      <div className="record-list">
        {appointments.filter(a => a.status === 'Approved').length === 0 ? 
          <div style={{ textAlign:'center', color:'var(--muted)', padding:'30px' }}>No bookings for today yet.</div> :
          appointments.filter(a => a.status === 'Approved').map(apt => (
            <div key={apt.id} className="record-item">
              <div className="record-info">
                <div style={{ fontWeight:'700' }}>{apt.patientName}</div>
                <div style={{ fontSize:'12px' }}>{apt.reason}</div>
              </div>
              <div style={{ color:'var(--accent-patient)', fontWeight:'700' }}>{apt.approvedTime}</div>
            </div>
          ))}
      </div>
    </div>
  </div>
);

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
  const [globalToast, setGlobalToast] = useState('');
  
  // Iris Scan State
  const [irisEmergencyMode, setIrisEmergencyMode] = useState(false);
  const [showIrisLogin, setShowIrisLogin] = useState(false);

  // Appointments State
  const [appointments, setAppointments] = useState(() => {
    try {
      const cached = localStorage.getItem('medicore_cached_appointments');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [appsLoading, setAppsLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState({ doctorId: '', reason: '', date: '', time: '' });

  // ═══════════════════════════════════════════════════════
  // MEDILINK AI 2.0 (SFIC 2026) EMERGENCY COORDINATION STATE
  // ═══════════════════════════════════════════════════════
  const [emergencyIncidents, setEmergencyIncidents] = useState([]);
  const [activeIncident, setActiveIncident] = useState(null);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [showPatientSosModal, setShowPatientSosModal] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Auto-fetch active incidents on mount and refresh periodically
  useEffect(() => {
    loadEmergencyData();
    const emgTimer = setInterval(() => {
      loadEmergencyData();
    }, 4000);
    return () => clearInterval(emgTimer);
  }, []);

  const loadEmergencyData = async () => {
    try {
      const list = await emergencyService.fetchIncidents();
      setEmergencyIncidents(list);
      if (list && list.length > 0) {
        setActiveIncident(prev => {
          if (!prev) return list[0];
          const found = list.find(i => i.incidentId === prev.incidentId);
          return found || list[0];
        });
      }
      const ana = await emergencyService.fetchAnalytics();
      if (ana) setAnalyticsData(ana);
    } catch (e) {
      console.warn('Emergency sync notice:', e);
    }
  };

  const handleTriggerSOS = async (payload) => {
    setEmergencyLoading(true);
    try {
      const inc = await emergencyService.triggerSOS(payload);
      setActiveIncident(inc);
      setEmergencyIncidents(prev => [inc, ...prev.filter(i => i.incidentId !== inc.incidentId)]);
      showToast(`🚨 Incident ${inc.incidentId} Created! Triage Priority: ${inc.triage?.priority}`);
    } catch (e) {
      showToast('⚠️ SOS Broadcast Notice: Local cache active');
    } finally {
      setEmergencyLoading(false);
    }
  };

  const handleAssignHospital = async (hosp) => {
    if (!activeIncident) return;
    setEmergencyLoading(true);
    try {
      const updated = await emergencyService.assignHospital(activeIncident.incidentId, hosp);
      if (updated) {
        setActiveIncident(updated);
        showToast(`🏥 Pre-arrival alert sent to ${hosp.name}`);
      }
    } finally {
      setEmergencyLoading(false);
    }
  };

  const handleHospitalAck = async (decision, reason) => {
    if (!activeIncident) return;
    setEmergencyLoading(true);
    try {
      const updated = await emergencyService.hospitalAck(activeIncident.incidentId, decision, reason);
      if (updated) {
        setActiveIncident(updated);
        showToast(decision === 'Accepted' ? '✓ Hospital ER Accepted Emergency!' : 'Hospital declined. Alerting coordinator.');
      }
    } finally {
      setEmergencyLoading(false);
    }
  };

  const handleAssignTeam = async (team) => {
    if (!activeIncident) return;
    setEmergencyLoading(true);
    try {
      const updated = await emergencyService.assignMedicalTeam(activeIncident.incidentId, team);
      if (updated) {
        setActiveIncident(updated);
        showToast('🩺 Trauma Medical Team Assigned!');
      }
    } finally {
      setEmergencyLoading(false);
    }
  };

  const handleToggleChecklist = async (itemIndex) => {
    if (!activeIncident) return;
    const updatedChecklist = await emergencyService.toggleChecklistItem(activeIncident.incidentId, itemIndex);
    if (updatedChecklist) {
      setActiveIncident(prev => ({
        ...prev,
        medicalTeam: { ...prev.medicalTeam, checklist: updatedChecklist }
      }));
    }
  };

  const handleMarkTeamReady = async () => {
    if (!activeIncident) return;
    setEmergencyLoading(true);
    try {
      const updated = await emergencyService.markTeamReady(activeIncident.incidentId);
      if (updated) {
        setActiveIncident(updated);
        showToast('🚨 Trauma Bay & Medical Team Marked READY!');
      }
    } finally {
      setEmergencyLoading(false);
    }
  };

  const handleAdvanceAmbulance = async () => {
    if (!activeIncident) return;
    setEmergencyLoading(true);
    try {
      const updated = await emergencyService.advanceAmbulance(activeIncident.incidentId);
      if (updated) {
        setActiveIncident(updated);
        showToast(`Ambulance Advanced: ${updated.ambulance?.routeWaypoints?.[updated.ambulance?.waypointStep]?.label || 'On Route'}`);
      }
    } finally {
      setEmergencyLoading(false);
    }
  };

  const handleAmbulanceStatusChange = async (newStatus) => {
    if (!activeIncident) return;
    setEmergencyLoading(true);
    try {
      const updated = await emergencyService.updateIncidentStatus(activeIncident.incidentId, newStatus, 'Ambulance Driver', `Status changed to ${newStatus}`);
      if (updated) {
        setActiveIncident(updated);
        showToast(`Ambulance Status: ${newStatus}`);
      }
    } finally {
      setEmergencyLoading(false);
    }
  };

  const handleOverridePriority = async (incidentId, newPriority, reason) => {
    setEmergencyLoading(true);
    try {
      const updated = await emergencyService.overrideTriagePriority(incidentId, newPriority, reason);
      if (updated) {
        setActiveIncident(updated);
        showToast(`Triage Priority Overridden to ${newPriority}`);
      }
    } finally {
      setEmergencyLoading(false);
    }
  };

  // 1-Click Automated Scenario Step-by-Step Walkthrough
  const handleWorkflowStep = async () => {
    if (!activeIncident) {
      const res = await emergencyService.resetDemoScenario();
      setActiveIncident(res);
      showToast('Step 1: SOS Activated for Road Accident at Guindy');
      return;
    }

    const st = activeIncident.status;
    const isAccepted = activeIncident.hospitalMatching?.selectedHospital?.status === 'Accepted';
    const isTeamReady = activeIncident.medicalTeam?.teamReady;
    const currentStep = activeIncident.ambulance?.waypointStep || 0;

    if (st === 'SOS_ACTIVATED' || st === 'REQUEST_RECEIVED') {
      const topHosp = activeIncident.hospitalMatching?.suggestedHospitals?.[0];
      if (topHosp) {
        await handleAssignHospital(topHosp);
        showToast('Step 2: Coordinator confirmed Apollo Speciality Hospital');
      }
    } else if (st === 'HOSPITAL_NOTIFIED' && !isAccepted) {
      await handleHospitalAck('Accepted', '');
      showToast('Step 3: Apollo ER Accepted Emergency Alert');
    } else if (isAccepted && !activeIncident.medicalTeam?.assigned) {
      await handleAssignTeam({
        leadDoctor: 'Dr. Anand Krishnamoorthy (Chief Trauma Surgeon)',
        leadNurse: 'Sister Priya Selvam (Senior ER Triage Nurse)'
      });
      showToast('Step 4: Trauma Surgeon & ER Triage Team Assigned');
    } else if (!isTeamReady) {
      await handleMarkTeamReady();
      showToast('Step 5: Trauma Bay 1 & Level-1 Equipment Prepped');
    } else if (currentStep < 6) {
      await handleAdvanceAmbulance();
    } else if (st === 'PATIENT_ARRIVED') {
      await emergencyService.updateIncidentStatus(activeIncident.incidentId, 'EMERGENCY_COMPLETED', 'Hospital Staff', 'Patient stabilized in Trauma Bay. Emergency completed.');
      await loadEmergencyData();
      showToast('Step 11: Emergency Completed! Review Coordination Analytics.');
    } else {
      showToast('Scenario completed! Click "Reset Scenario" to rerun.');
    }
  };

  const handleResetDemo = async () => {
    setEmergencyLoading(true);
    try {
      const res = await emergencyService.resetDemoScenario();
      setActiveIncident(res);
      setEmergencyIncidents([res]);
      showToast('🔄 Demo Scenario Reset to Baseline (Guindy Accident)');
    } finally {
      setEmergencyLoading(false);
    }
  };

  const showToast = (msg) => {
    setGlobalToast(msg);
    setTimeout(() => setGlobalToast(''), 3000);
  };

  const ToastNotification = () => globalToast ? (
    <div style={{ position:'fixed', bottom:'30px', left:'50%', transform:'translateX(-50%)', background:'var(--card)', border:'1px solid var(--accent-patient)', color:'var(--text)', padding:'12px 24px', borderRadius:'30px', boxShadow:'0 10px 30px rgba(0,0,0,0.4)', zIndex:9999, display:'flex', alignItems:'center', gap:'10px', fontWeight:'600', fontSize:'14px' }}>
      <span style={{color:'var(--accent-patient)'}}>✓</span> {globalToast}
    </div>
  ) : null;

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
  
  const [ambulanceList, setAmbulanceList] = useState([]);

  const [hospitalList, setHospitalList] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medications] = useState([
    { name: 'Metformin 500mg', detail: '1 tablet after breakfast + dinner', status: 'Active' },
    { name: 'Amlodipine 5mg', detail: '1 tablet after breakfast', status: 'Active' },
    { name: 'Atorvastatin 20mg', detail: '1 tablet after dinner', status: 'Active' },
  ]);

  const [bookedHospital, setBookedHospital] = useState(null);
  const [recordsSent, setRecordsSent] = useState(false);
  const [sendingRecords, setSendingRecords] = useState(false);

  const [recordsViewMode, setRecordsViewMode] = useState('table'); // table, gallery
  const [pendingUpload, setPendingUpload] = useState(null); // { file, preview, diagnosis }
  const [uploading, setUploading] = useState(false);

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

  const [doctorAttendance, setDoctorAttendance] = useState(() => {
    try {
      const saved = localStorage.getItem('medicore_doctor_attendance');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      P1: 'present',
      P2: 'emergency',
      P3: 'present',
    };
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

  const [medicineStatus, setMedicineStatus] = useState(() => {
    try {
      const saved = localStorage.getItem('medicore_medicine_status');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      M1: 'given',
      M2: 'missed',
      M3: 'given',
      M4: 'given',
    };
  });

  const [nursNotesList, setNurseNotesList] = useState(() => {
    try {
      const saved = localStorage.getItem('medicore_nurse_notes');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { patient: 'Bed 7', note: 'Patient Priya Menon complaining of severe headache. BP 160/100. Dr. Sharma informed. IV line secured.', time: '08:30 AM' },
      { patient: 'Bed 12', note: 'Ravi Patel missed evening Metformin dose. Patient said "felt nauseous." Noted and reported to doctor.', time: '07:00 PM (3 Apr)' },
      { patient: 'Bed 9', note: 'Anjali Lakshmanan post-op wound dressing changed. No signs of infection. Vitals stable.', time: '10:00 AM (3 Apr)' },
    ];
  });

  const [nurseNoteInput, setNurseNoteInput] = useState('');

  const [sosActive, setSosActive] = useState(false);

  // ═══════════════════════════════════════════════════════
  // DATA ACTIONS
  // ═══════════════════════════════════════════════════════
  
  // Auto-load on mount
  useEffect(() => { 
    loadConfig();
    loadRecords();
    loadAppointments();
    loadNotes();
    loadFamily();
    loadMeds();
    loadMentalLogs();
    loadVerifiedMeds();
    loadFraudClaims();

    const interval = setInterval(() => {
      loadAppointments();
      if (currentPage === 'nurse') loadNotes(); 
    }, 15000); // Poll every 15s for efficiency

    return () => clearInterval(interval);
  }, [currentPage]);

  const loadConfig = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/config`);
      const data = await res.json();
      if (data.success) {
        setDoctors(data.doctors);
        setHospitalList(data.hospitals);
        setAmbulanceList(data.ambulances);
      }
    } catch (e) { console.warn('Config server offline'); }
  };

  // Records
  const [medicalRecords, setMedicalRecords] = useState(() => {
    try {
      const cached = localStorage.getItem('medicore_cached_records');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [recordsLoading, setRecordsLoading] = useState(false);
  const loadRecords = async () => {
    setRecordsLoading(true);
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/records?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setMedicalRecords(data.records || []);
        try { localStorage.setItem('medicore_cached_records', JSON.stringify(data.records || [])); } catch {}
      }
    } catch (e) {
      console.warn('Records server offline, reading cache');
      try {
        const cached = localStorage.getItem('medicore_cached_records');
        if (cached) setMedicalRecords(JSON.parse(cached));
      } catch {}
    } finally {
      setRecordsLoading(false);
    }
  };

  const deleteRecord = async (id) => {
    console.log('🗑️ Deleting record:', id);
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/records/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { 
        showToast('🗑️ Record removed'); 
        await loadRecords(); 
      } else {
        console.error('Failed to delete:', data.error);
      }
    } catch (err) { 
      console.error('Delete error:', err);
      showToast('❌ Server offline'); 
    }
  };

  // Appointments
  const loadAppointments = async () => {
    setAppsLoading(true);
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/appointments`);
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments || []);
        try { localStorage.setItem('medicore_cached_appointments', JSON.stringify(data.appointments || [])); } catch {}
      }
    } catch (e) {
      console.warn('Appointments server offline');
      try {
        const cached = localStorage.getItem('medicore_cached_appointments');
        if (cached) setAppointments(JSON.parse(cached));
      } catch {}
    } finally {
      setAppsLoading(false);
    }
  };

  const bookAppointment = async () => {
    if (!bookingForm.doctorId || !bookingForm.reason || !bookingForm.date || !bookingForm.time) {
      showToast('⚠️ Please fill all fields');
      return;
    }
    const doc = doctors.find(d => d.id === bookingForm.doctorId);
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingForm,
          patientId: PATIENT_ID,
          patientName: 'Ravi Patel',
          doctorName: doc?.name || 'Hospital Doctor',
          requestedDate: bookingForm.date,
          requestedTime: bookingForm.time
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('📅 Appointment request sent!');
        
        // Also log into permanent medical records history
        try {
          const formData = new FormData();
          formData.append('diagnosis', `Appointment Request: ${doc?.name || 'Doctor'} - ${bookingForm.reason}`);
          formData.append('reportType', 'Doctor Consultation');
          formData.append('status', 'Pending');
          formData.append('doctor', doc?.name || 'Hospital Doctor');
          formData.append('notes', `Requested: ${bookingForm.date} at ${bookingForm.time}. Reason: ${bookingForm.reason}`);
          formData.append('patientId', PATIENT_ID);
          formData.append('uploadedBy', 'patient');
          await fetch(`${DATA_API_BASE_URL}/records`, { method: 'POST', body: formData });
          loadRecords();
        } catch {}

        setBookingForm({ doctorId: '', reason: '', date: '', time: '' });
        loadAppointments();
      }
    } catch {
      showToast('❌ Failed to book appointment');
    }
  };

  const updateAppointment = async (id, status, approvedTime = null) => {
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, approvedTime })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Appointment ${status.toLowerCase()}`);
        loadAppointments();
      }
    } catch {
      showToast('❌ Update failed');
    }
  };

  // Shared Notes
  const [sharedNotes, setSharedNotes] = useState(() => {
    try {
      const cached = localStorage.getItem('medicore_cached_notes');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [notesLoading, setNotesLoading] = useState(false);
  const loadNotes = async () => {
    setNotesLoading(true);
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/notes?patientId=${PATIENT_ID}`);
      const data = await res.json();
      if (data.success) {
        setSharedNotes(data.notes || []);
        try { localStorage.setItem('medicore_cached_notes', JSON.stringify(data.notes || [])); } catch {}
      }
    } catch { console.warn('Notes server offline'); }
    finally { setNotesLoading(false); }
  };

  const [sosStep, setSosStep] = useState(0); // 0=idle, 1=dispatching, 2=en_route, 3=arriving, 4=arrived
  const [sosEta, setSosEta] = useState(4);
  const sosIntervalRef = useRef(null);

  const [addPatientForm, setAddPatientForm] = useState({ name: '', age: '', diagnosis: '', room: '', blood: 'O+', condition: 'Stable' });
  const [addPatientList, setAddPatientList] = useState(() => {
    try {
      const saved = localStorage.getItem('medicore_added_patients');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [diagnosisForm, setDiagnosisForm] = useState({ patient: '', diagnosis: '', notes: '' });
  const [savedDiagnoses, setSavedDiagnoses] = useState(() => {
    try {
      const saved = localStorage.getItem('medicore_saved_diagnoses');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [diagSaved, setDiagSaved] = useState(false);

  // ═══════════════════════════════════════════════════════
  // NEW FEATURE STATE
  // ═══════════════════════════════════════════════════════
  const [language, setLanguage] = useState('en');
  const t = (key) => T[language]?.[key] || key;

  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [sosHospitalsList, setSosHospitalsList] = useState([]);
  const [assignedHospital, setAssignedHospital] = useState(null);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const [showQRPay, setShowQRPay] = useState(false);
  const [payConfirmed, setPayConfirmed] = useState(false);

  const [insuranceApplied, setInsuranceApplied] = useState(null);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);

  // ═══════════════════════════════════════════════════════
  // ADVANCED HEALTHCARE STATES
  // ═══════════════════════════════════════════════════════
  // Family Health Switcher
  const [familyMembers, setFamilyMembers] = useState(() => {
    try {
      const saved = localStorage.getItem('medicore_cached_family');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [selectedFamilyMember, setSelectedFamilyMember] = useState(null); // null = Ravi Patel (primary)

  // Medication Intelligence
  const [patientMeds, setPatientMeds] = useState(() => {
    try {
      const saved = localStorage.getItem('medicore_cached_meds');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [medsLoading, setMedsLoading] = useState(false);
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [newMedForm, setNewMedForm] = useState({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });

  // Mental Health Assessment
  const [mentalLogs, setMentalLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('medicore_cached_mental');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [mentalSurvey, setMentalSurvey] = useState({ stress: 5, anxiety: 5, burnout: 5, sleep: 7, mood: 'Neutral' });

  // Predictive Healthcare Inputs & Outputs
  const [predictiveInput, setPredictiveInput] = useState({ bp: '138/88', sugar: 145, bmi: 28.5, hr: 82, cholesterol: 210, stress: 'High', smoking: false, sleep: 6, exercise: 'Rarely' });
  const [predictiveResults, setPredictiveResults] = useState(() => {
    try {
      const saved = localStorage.getItem('medicore_cached_prediction');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { healthScore: 68, diabetesRisk: 72.4, heartRisk: 58.2, hypertensionRisk: 65.0, kidneyRisk: 42.1, aiExplanation: 'Diabetes risk is elevated (72.4%) based on glucose level (145 mg/dL) and elevated BMI. Hypertension risk (65%) is moderate. General kidney function is currently stable (Kidney risk 42.1%).', recommendations: ['Restrict sodium intake', 'Increase high-fiber diet', 'Follow up with HbA1c testing'] };
  });
  const [predictiveLoading, setPredictiveLoading] = useState(false);

  // AI Doctor Copilot / Clinical Assistant
  const [showCopilotPanel, setShowCopilotPanel] = useState(false);
  const [copilotDocName, setCopilotDocName] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResults, setCopilotResults] = useState(null);

  // Fake Medicine Verifier
  const [verifyingBarcode, setVerifyingBarcode] = useState('');
  const [verifiedMedsList, setVerifiedMedsList] = useState(() => {
    try {
      const saved = localStorage.getItem('medicore_cached_verified_meds');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifyingMed, setVerifyingMed] = useState(false);

  // AI Prescription Scanner
  const [prescriptionScannerFile, setPrescriptionScannerFile] = useState(null);
  const [scanningPrescription, setScanningPrescription] = useState(false);
  const [scannerResult, setScannerResult] = useState(null);

  // AI Fraud Detection Anomaly list
  const [flaggedClaims, setFlaggedClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  
  // Smart Hospital Control Center Resources
  const [hospitalBeds, setHospitalBeds] = useState({ available: 14, icu: 3, ventilators: 2, total: 50 });
  const [hospitalStaff, setHospitalStaff] = useState({ doctors: 8, nurses: 12 });
  const [averageWaitTime, setAverageWaitTime] = useState('12 mins');
  const [waitingQueue, setWaitingQueue] = useState(4);

  // ═══════════════════════════════════════════════════════
  // ADVANCED HEALTHCARE INTEGRATION CALLS
  // ═══════════════════════════════════════════════════════
  const loadFamily = async () => {
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/family`);
      const data = await res.json();
      if (data.success) setFamilyMembers(data.family || []);
    } catch (e) { console.warn('Family API offline'); }
  };

  const addFamilyMember = async (memberData) => {
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/family`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData)
      });
      const data = await res.json();
      if (data.success) {
        showToast('👪 Family member added successfully!');
        loadFamily();
      }
    } catch { showToast('❌ Failed to add family member'); }
  };

  const loadMeds = async () => {
    setMedsLoading(true);
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/meds`);
      const data = await res.json();
      if (data.success) {
        setPatientMeds(data.meds || []);
        try { localStorage.setItem('medicore_cached_meds', JSON.stringify(data.meds || [])); } catch {}
      }
    } catch (e) {
      console.warn('Meds API offline');
      try {
        const saved = localStorage.getItem('medicore_cached_meds');
        if (saved) setPatientMeds(JSON.parse(saved));
      } catch {}
    } finally {
      setMedsLoading(false);
    }
  };

  const addMed = async () => {
    if (!newMedForm.name || !newMedForm.dosage) {
      showToast('⚠️ Name and Dosage are required');
      return;
    }
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/meds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMedForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast('💊 Medication added successfully!');
        
        // Also log into permanent medical records history
        try {
          const formData = new FormData();
          formData.append('diagnosis', `Prescription Added: ${newMedForm.name} (${newMedForm.dosage})`);
          formData.append('reportType', 'Prescription');
          formData.append('status', 'Ongoing');
          formData.append('doctor', 'Self-Reported Rx');
          formData.append('notes', `Freq: ${newMedForm.frequency || 'Daily'}, Duration: ${newMedForm.duration || 'Ongoing'}. ${newMedForm.instructions || ''}`);
          formData.append('patientId', PATIENT_ID);
          formData.append('uploadedBy', 'patient');
          await fetch(`${DATA_API_BASE_URL}/records`, { method: 'POST', body: formData });
          loadRecords();
        } catch {}

        setNewMedForm({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
        setShowAddMedModal(false);
        loadMeds();
      }
    } catch { showToast('❌ Failed to save medication'); }
  };

  const toggleAdherence = async (medId, date, taken) => {
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/meds/adherence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medId, date, taken })
      });
      const data = await res.json();
      if (data.success) {
        loadMeds();
        showToast(taken ? '✅ Marked as taken!' : '❌ Marked as missed');
      }
    } catch { showToast('❌ Adherence update failed'); }
  };

  const loadMentalLogs = async () => {
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/mental-health`);
      const data = await res.json();
      if (data.success) {
        setMentalLogs(data.logs || []);
        try { localStorage.setItem('medicore_cached_mental', JSON.stringify(data.logs || [])); } catch {}
      }
    } catch (e) {
      console.warn('Mental Health API offline');
      try {
        const saved = localStorage.getItem('medicore_cached_mental');
        if (saved) setMentalLogs(JSON.parse(saved));
      } catch {}
    }
  };

  const saveMentalSurvey = async () => {
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/mental-health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mentalSurvey)
      });
      const data = await res.json();
      if (data.success) {
        showToast('🧘 Weekly wellness assessment logged!');
        
        // Also log into permanent medical records history
        try {
          const formData = new FormData();
          formData.append('diagnosis', `Mental Health Assessment: Mood ${mentalSurvey.mood}, Stress ${mentalSurvey.stress}/10`);
          formData.append('reportType', 'Psychological Evaluation');
          formData.append('status', mentalSurvey.stress > 7 ? 'Ongoing' : 'Controlled');
          formData.append('doctor', 'MediCore Wellness Tracker');
          formData.append('notes', `Stress: ${mentalSurvey.stress}/10, Anxiety: ${mentalSurvey.anxiety}/10, Burnout: ${mentalSurvey.burnout}/10, Sleep: ${mentalSurvey.sleep} hrs/night.`);
          formData.append('patientId', PATIENT_ID);
          formData.append('uploadedBy', 'patient');
          await fetch(`${DATA_API_BASE_URL}/records`, { method: 'POST', body: formData });
          loadRecords();
        } catch {}

        loadMentalLogs();
      }
    } catch { showToast('❌ Failed to save assessment'); }
  };

  const verifyMedicine = async (barcodeVal) => {
    const code = barcodeVal || verifyingBarcode;
    if (!code.trim()) { showToast('⚠️ Please enter a barcode or scan code'); return; }
    setVerifyingMed(true);
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/medicine/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: code })
      });
      const data = await res.json();
      if (data.success) {
        setVerificationResult(data.medicine);
        loadVerifiedMeds();
        showToast(data.medicine.status === 'Genuine' ? '✅ Medicine Verified: Genuine!' : '❌ WARNING: Suspicious/Counterfeit!');
      }
    } catch { showToast('❌ Verification server offline'); }
    finally { setVerifyingMed(false); }
  };

  const loadVerifiedMeds = async () => {
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/medicine/history`);
      const data = await res.json();
      if (data.success) {
        setVerifiedMedsList(data.history || []);
        try { localStorage.setItem('medicore_cached_verified_meds', JSON.stringify(data.history || [])); } catch {}
      }
    } catch (e) {
      console.warn('Medicine history API offline');
      try {
        const saved = localStorage.getItem('medicore_cached_verified_meds');
        if (saved) setVerifiedMedsList(JSON.parse(saved));
      } catch {}
    }
  };

  const loadFraudClaims = async () => {
    setClaimsLoading(true);
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/admin/fraud-claims`);
      const data = await res.json();
      if (data.success) setFlaggedClaims(data.claims || []);
    } catch (e) { console.warn('Claims API offline'); }
    finally { setClaimsLoading(false); }
  };

  const takeClaimAction = async (id, status) => {
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/admin/fraud-claims/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`⚖️ Claim marked as ${status}`);
        loadFraudClaims();
      }
    } catch { showToast('❌ Action failed'); }
  };

  const runPredictiveAnalysis = async () => {
    setPredictiveLoading(true);
    try {
      const res = await fetch('http://localhost:5001/predict-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(predictiveInput)
      });
      const data = await res.json();
      if (data.success) {
        setPredictiveResults(data);
        try { localStorage.setItem('medicore_cached_prediction', JSON.stringify(data)); } catch {}
        showToast('🧠 Health prediction complete!');

        // Also save risk assessment into permanent medical records history
        try {
          const formData = new FormData();
          formData.append('diagnosis', `AI Health Risk Assessment: Health Score ${data.healthScore || 68}/100`);
          formData.append('reportType', 'AI Prediction');
          formData.append('status', (data.heartRisk > 60 || data.diabetesRisk > 60) ? 'Ongoing' : 'Controlled');
          formData.append('doctor', 'MediCore Intelligence Engine');
          formData.append('notes', `BP: ${predictiveInput.bp}, Sugar: ${predictiveInput.sugar} mg/dL, BMI: ${predictiveInput.bmi}, HR: ${predictiveInput.hr}. Diabetes Risk: ${data.diabetesRisk}%, Heart Risk: ${data.heartRisk}%.`);
          formData.append('patientId', PATIENT_ID);
          formData.append('uploadedBy', 'ai_engine');
          await fetch(`${DATA_API_BASE_URL}/records`, { method: 'POST', body: formData });
          loadRecords();
        } catch {}
      }
    } catch { showToast('❌ Python AI service offline'); }
    finally { setPredictiveLoading(false); }
  };

  const ocrPrescriptionScan = async (file) => {
    setScanningPrescription(true);
    try {
      const res = await fetch('http://localhost:5001/ocr-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: "Rx prescription file scan" })
      });
      const data = await res.json();
      if (data.success) {
        setScannerResult(data);
        showToast('📄 Prescription parsed!');
      }
    } catch { showToast('❌ AI OCR scanner offline'); }
    finally { setScanningPrescription(false); }
  };

  const saveOcrMedicines = async () => {
    if (!scannerResult?.medicines) return;
    try {
      for (const m of scannerResult.medicines) {
        await fetch(`${DATA_API_BASE_URL}/meds`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            instructions: `Self-scanned from Rx by ${scannerResult.doctor || 'doctor'}`
          })
        });
      }

      // Also log scanned prescription to permanent medical records history
      try {
        const medNames = scannerResult.medicines.map(m => m.name).join(', ');
        const formData = new FormData();
        formData.append('diagnosis', `Scanned Prescription: ${medNames}`);
        formData.append('reportType', 'Prescription');
        formData.append('status', 'Ongoing');
        formData.append('doctor', scannerResult.doctor || 'Examining Physician');
        formData.append('notes', `Extracted medicines: ${medNames}. Rx Date: ${scannerResult.date || 'Recent'}`);
        formData.append('patientId', PATIENT_ID);
        formData.append('uploadedBy', 'ocr_scanner');
        await fetch(`${DATA_API_BASE_URL}/records`, { method: 'POST', body: formData });
        loadRecords();
      } catch {}

      showToast('💾 Extracted medicines saved to records!');
      setScannerResult(null);
      setPrescriptionScannerFile(null);
      loadMeds();
    } catch { showToast('❌ Failed to save medicines'); }
  };

  const clinicalCopilotAnalyze = async (fileName) => {
    setCopilotLoading(true);
    setCopilotDocName(fileName);
    try {
      const res = await fetch('http://localhost:5001/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docName: fileName })
      });
      const data = await res.json();
      if (data.success) {
        setCopilotResults(data);
        showToast('🏥 AI Clinical Summary generated!');
      }
    } catch { showToast('❌ Doctor Copilot AI offline'); }
    finally { setCopilotLoading(false); }
  };
  
  // Smart Hospital Simulation: periodically adjust ICU beds/queue in background
  useEffect(() => {
    const timer = setInterval(() => {
      setHospitalBeds(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const nextAvail = Math.min(30, Math.max(5, prev.available + delta));
        return { ...prev, available: nextAvail };
      });
      setWaitingQueue(prev => Math.max(1, prev + (Math.random() > 0.6 ? 1 : -1)));
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  // ═══════════════════════════════════════════════════════
  // FUNCTIONS
  // ═══════════════════════════════════════════════════════

  const doLogin = (overrideRole) => {
    const roleToUse = overrideRole || selectedRole;
    if (!overrideRole) {
      const { userid, password } = loginForm;
      if (!userid || !password) {
        setError('Please enter User ID and Password');
        return;
      }
    }
    
    // Simulate login
    setCurrentUser({
      firstName: 'Ravi',
      lastName: 'Patel',
      walletBalance: 24500,
    });
    setUserRole(roleToUse);
    setAuthToken('demo-token-' + Date.now());
    localStorage.setItem('authToken', 'demo-token-' + Date.now());
    localStorage.setItem('userRole', roleToUse);
    
    setPatientActiveView('overview');
    setDoctorActiveView('overview');
    setNurseActiveView('overview');
    
    setCurrentPage(roleToUse);
    setError('');
  };

  const logout = () => {
    setCurrentPage('login');
    setCurrentUser(null);
    setUserRole(null);
    setAuthToken(null);
    setSosActive(false);
    setSosStep(0);
    clearInterval(sosIntervalRef.current);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
  };

  const handleSendRecordsToHospital = (hospital) => {
    setSendingRecords(true);
    setTimeout(() => {
      setSendingRecords(false);
      setBookedHospital(hospital);
      setRecordsSent(true);
      showToast(`Medical records sent to ${hospital.name}!`);
    }, 1500);
  };

  const toggleMedicineStatus = (id, status) => {
    setMedicineStatus(prev => {
      const next = { ...prev, [id]: status };
      try { localStorage.setItem('medicore_medicine_status', JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(`Medicine status updated to ${status}`);
  };

  const updateDoctorAttendance = (id, status) => {
    setDoctorAttendance(prev => {
      const next = { ...prev, [id]: status };
      try { localStorage.setItem('medicore_doctor_attendance', JSON.stringify(next)); } catch {}
      return next;
    });
    showToast(`Attendance updated: ${status}`);
  };

  const addNurseNote = async () => {
    if (!nurseNoteInput.trim()) return;
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const newEntry = { patient: 'Ward 3B', note: nurseNoteInput.trim(), time: `${now}, ${today}` };
    const updated = [newEntry, ...nursNotesList];
    setNurseNotesList(updated);
    try { localStorage.setItem('medicore_nurse_notes', JSON.stringify(updated)); } catch {}

    // Post to persistent clinical notes database
    try {
      await fetch(`${DATA_API_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: PATIENT_ID,
          note: nurseNoteInput.trim(),
          author: 'Nurse Sunita Lal',
          role: 'nurse'
        })
      });
      loadNotes();
    } catch {}

    setNurseNoteInput('');
    showToast('📝 Nurse clinical note saved to history!');
  };

  const triggerSOS = () => {
    setSosActive(true);
    setSosStep(1); // dispatching
    setSosEta(4);
    
    clearInterval(sosIntervalRef.current);
    let currentEta = 4;
    sosIntervalRef.current = setInterval(() => {
      currentEta -= 1;
      if (currentEta <= 1) {
        clearInterval(sosIntervalRef.current);
        setSosStep(4); // arrived
        setSosEta(0);
      } else {
        if (currentEta === 3) setSosStep(2); // en route
        if (currentEta === 2) setSosStep(3); // arriving
        setSosEta(currentEta);
      }
    }, 3000); // simulate 1 min every 3s
  };

  const saveDiagnosis = async () => {
    if (!diagnosisForm.patient || !diagnosisForm.diagnosis) return;
    
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const newDiag = {
      patient: diagnosisForm.patient,
      diagnosis: diagnosisForm.diagnosis,
      notes: diagnosisForm.notes || '',
      date: dateStr
    };
    const updated = [newDiag, ...savedDiagnoses];
    setSavedDiagnoses(updated);
    try { localStorage.setItem('medicore_saved_diagnoses', JSON.stringify(updated)); } catch {}
    
    // Save into permanent medical records database so patient sees it
    try {
      const formData = new FormData();
      formData.append('diagnosis', diagnosisForm.diagnosis);
      formData.append('doctor', 'Dr. Kavitha Sharma');
      formData.append('patientId', PATIENT_ID);
      formData.append('reportType', 'Clinical Diagnosis');
      formData.append('status', 'Ongoing');
      formData.append('notes', `Patient: ${diagnosisForm.patient}. Notes: ${diagnosisForm.notes || 'Clinical consultation'}`);
      formData.append('uploadedBy', 'doctor');
      await fetch(`${DATA_API_BASE_URL}/records`, { method: 'POST', body: formData });
      loadRecords();
    } catch {}

    // Save into shared notes database
    try {
      await fetch(`${DATA_API_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: PATIENT_ID,
          patientName: diagnosisForm.patient,
          note: `${diagnosisForm.diagnosis} - ${diagnosisForm.notes || 'Consultation completed'}`,
          author: 'Dr. Kavitha Sharma',
          role: 'doctor'
        })
      });
      loadNotes();
    } catch {}

    setDiagSaved(true);
    showToast(`✅ Diagnosis for ${diagnosisForm.patient} permanently saved!`);
    setDiagnosisForm({ patient: '', diagnosis: '', notes: '' });
    setTimeout(() => setDiagSaved(false), 3000);
  };

  const addNewPatient = () => {
    if (!addPatientForm.name || !addPatientForm.diagnosis) {
      showToast("Name and diagnosis are required");
      return;
    }
    
    const newP = {
      id: 'NP' + Date.now().toString().slice(-4),
      avatar: addPatientForm.name.substring(0, 2).toUpperCase(),
      name: addPatientForm.name,
      age: addPatientForm.age || '—',
      diagnosis: addPatientForm.diagnosis,
      condition: addPatientForm.condition,
      room: addPatientForm.room || 'Assigned soon',
    };
    
    const updated = [...addPatientList, newP];
    setAddPatientList(updated);
    try { localStorage.setItem('medicore_added_patients', JSON.stringify(updated)); } catch {}

    // Also log patient admission in permanent medical records history
    try {
      const formData = new FormData();
      formData.append('diagnosis', `Patient Admission: ${newP.name} (${newP.diagnosis})`);
      formData.append('reportType', 'Admission Record');
      formData.append('status', newP.condition || 'Stable');
      formData.append('doctor', 'Dr. Kavitha Sharma');
      formData.append('notes', `Admitted to ${newP.room}, Age: ${newP.age}`);
      formData.append('patientId', PATIENT_ID);
      formData.append('uploadedBy', 'doctor');
      fetch(`${DATA_API_BASE_URL}/records`, { method: 'POST', body: formData }).then(() => loadRecords()).catch(() => {});
    } catch {}

    showToast(`✅ Patient ${newP.name} added to permanent registry`);
    setAddPatientForm({ name: '', age: '', diagnosis: '', room: '', blood: 'O+', condition: 'Stable' });
  };

  // ═══════════════════════════════════════════════════════
  // NEW FUNCTIONS
  // ═══════════════════════════════════════════════════════

  const captureGPS = () => {
    setGpsLoading(true);
    setSosActive(false); setSosStep(0);
    clearInterval(sosIntervalRef.current);

    const startTracking = (lat, lng) => {
      setGpsCoords({ lat, lng });
      const hosp = buildSosHospitals(lat, lng);
      setSosHospitalsList(hosp);
      setAssignedHospital(hosp[0]);
      setGpsLoading(false);
      setSosActive(true); setSosStep(1); setSosEta(4);
      
      let currentEta = 4;
      sosIntervalRef.current = setInterval(() => {
        currentEta -= 1;
        if (currentEta <= 1) {
          clearInterval(sosIntervalRef.current);
          setSosStep(4);
          setSosEta(0);
        } else {
          if (currentEta === 3) setSosStep(2);
          if (currentEta === 2) setSosStep(3);
          setSosEta(currentEta);
        }
      }, 3000);
    };

    // Fast robust demo simulation to prevent browser GPS hanging
    setTimeout(() => {
      startTracking(12.9716, 77.5946);
    }, 1200);
  };

  const handleFileUpload = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    // Reset so same file can be re-selected
    if (e.target) e.target.value = '';
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');
    const preview = isImage ? URL.createObjectURL(file) : null;
    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    setPendingUpload({
      file,
      preview,
      isPDF,
      isImage,
      diagnosis: baseName || 'Medical Report',
      reportType: 'General Report',
      doctor: '',
      status: 'Ongoing',
    });
  };

  const confirmUpload = async () => {
    if (!pendingUpload) return;
    const { file, diagnosis, status, reportType, doctor } = pendingUpload;
    if (!diagnosis || !diagnosis.trim()) { showToast('⚠️ Please enter a diagnosis / report name'); return; }

    const formData = new FormData();
    if (file) {
      formData.append('photo', file);
    }
    formData.append('diagnosis', diagnosis.trim());
    formData.append('reportType', reportType || 'General Report');
    formData.append('status', status || 'Ongoing');
    formData.append('doctor', doctor?.trim() || 'Self-uploaded');
    formData.append('patientId', PATIENT_ID);
    formData.append('uploadedBy', 'patient');

    setUploading(true);
    try {
      const res = await fetch(`${DATA_API_BASE_URL}/records`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Report saved successfully!');
        setPendingUpload(null);
        await loadRecords();
      } else {
        showToast('❌ Upload failed: ' + (data.error || data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast('❌ Server offline — could not upload');
    } finally {
      setUploading(false);
    }
  };

  const applyInsurancePlan = (plan) => { setPendingPlan(plan); setShowInsuranceModal(true); };
  const confirmInsurance = async () => {
    if (!pendingPlan) return;
    const plan = pendingPlan;
    
    // Create a persistent medical record for this application
    const formData = new FormData();
    formData.append('diagnosis', `Insurance Application: ${plan.name}`);
    formData.append('status', 'Ongoing');
    formData.append('patientId', PATIENT_ID);
    formData.append('uploadedBy', 'patient');
    formData.append('doctor', plan.provider); // Use provider as the 'doctor/specialist'

    try {
      const res = await fetch(`${DATA_API_BASE_URL}/records`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setInsuranceApplied(plan);
        setShowInsuranceModal(false);
        setPendingPlan(null);
        showToast(`✅ Applied for ${plan.name} successfully!`);
        loadRecords(); // Refresh the Records view
      } else {
        showToast('❌ Application failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      showToast('❌ Server error during application');
    }
  };

  // Notification Drawer (renders on top of any dashboard)
  const NotifDrawer = () => (
    <>
      {notifOpen && <div onClick={() => setNotifOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300, backdropFilter:'blur(2px)' }} />}
      <div className={`notif-drawer ${notifOpen ? 'open' : ''}`}>
        <div className="notif-header">
          <span>🔔 {t('notifications')}</span>
          <button onClick={() => setNotifOpen(false)} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:'18px' }}>✕</button>
        </div>
        {NOTIFS.map(n => (
          <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
            <div className="notif-icon">{n.icon}</div>
            <div style={{ flex:1 }}>
              <div className="notif-title">{n.title}</div>
              <div className="notif-msg">{n.msg}</div>
              <div className="notif-time">{n.time}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  // ── Upload Modal (supports images AND PDFs)
  const REPORT_TYPES = ['Blood Test','X-Ray','MRI Scan','CT Scan','ECG Report','Prescription','Discharge Summary','Lab Report','Ultrasound','General Report'];
  const RecordUploadModal = () => !pendingUpload ? null : (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(10px)', padding:'20px' }}>
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'24px', width:'100%', maxWidth:'520px', maxHeight:'90vh', overflowY:'auto', overflowX:'hidden', boxShadow:'0 30px 80px rgba(0,0,0,0.5)' }}>

        {/* Header preview area */}
        <div style={{ position:'relative', height:'200px', background:'linear-gradient(135deg,#1a1f3a,#0f1628)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
          {pendingUpload.isImage && pendingUpload.preview ? (
            <img src={pendingUpload.preview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.7 }} />
          ) : (
            <div style={{ textAlign:'center', color:'#fff' }}>
              <div style={{ fontSize:'64px', marginBottom:'8px' }}>
                {pendingUpload.isPDF ? '📕' : '📄'}
              </div>
              <div style={{ fontSize:'13px', opacity:0.7 }}>{pendingUpload.file.name}</div>
            </div>
          )}
          {/* Dark gradient overlay */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8))' }} />
          {/* File info badge */}
          <div style={{ position:'absolute', top:'14px', left:'14px', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', borderRadius:'10px', padding:'4px 12px', fontSize:'11px', color:'#fff', border:'1px solid rgba(255,255,255,0.15)' }}>
            {pendingUpload.isPDF ? '📕 PDF' : pendingUpload.isImage ? '🖼️ Image' : '📄 Document'}
            {' · '}{(pendingUpload.file.size / 1024).toFixed(0)} KB
          </div>
          {/* Close button */}
          <button onClick={() => setPendingUpload(null)} style={{ position:'absolute', top:'12px', right:'12px', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', width:'32px', height:'32px', borderRadius:'50%', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          {/* Bottom label */}
          <div style={{ position:'absolute', bottom:'16px', left:'20px', color:'#fff' }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:'18px', fontWeight:'700' }}>Upload Medical Report</div>
            <div style={{ fontSize:'11px', opacity:0.7, marginTop:'2px' }}>Saved permanently · Persists across restarts</div>
          </div>
        </div>

        {/* Form body */}
        <div style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'16px' }}>
          {/* Report Name */}
          <div>
            <label style={{ display:'block', fontSize:'11px', color:'var(--muted)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Report Name / Diagnosis *</label>
            <input
              className="note-input"
              style={{ margin:0, padding:'11px 14px', fontSize:'14px' }}
              value={pendingUpload.diagnosis}
              onChange={(e) => setPendingUpload({...pendingUpload, diagnosis: e.target.value})}
              placeholder="e.g. Blood Test, MRI Spine, HbA1c..."
              autoFocus
            />
          </div>

          {/* Report Type */}
          <div>
            <label style={{ display:'block', fontSize:'11px', color:'var(--muted)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Report Type</label>
            <select
              style={{ width:'100%', padding:'11px 14px', borderRadius:'10px', border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text)', fontSize:'13px', cursor:'pointer' }}
              value={pendingUpload.reportType}
              onChange={(e) => setPendingUpload({...pendingUpload, reportType: e.target.value})}
            >
              {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Doctor / Source */}
          <div>
            <label style={{ display:'block', fontSize:'11px', color:'var(--muted)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Doctor / Hospital (optional)</label>
            <input
              className="note-input"
              style={{ margin:0, padding:'11px 14px', fontSize:'14px' }}
              value={pendingUpload.doctor}
              onChange={(e) => setPendingUpload({...pendingUpload, doctor: e.target.value})}
              placeholder="e.g. Dr. K. Sharma, Apollo Hospital..."
            />
          </div>

          {/* Status */}
          <div>
            <label style={{ display:'block', fontSize:'11px', color:'var(--muted)', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Record Status</label>
            <div style={{ display:'flex', gap:'8px' }}>
              {['Ongoing','Controlled','Resolved'].map(s => (
                <button
                  key={s}
                  onClick={() => setPendingUpload({...pendingUpload, status: s})}
                  style={{
                    flex:1, padding:'9px 6px', borderRadius:'10px', fontSize:'12px', fontWeight:'600', cursor:'pointer',
                    border:`2px solid ${pendingUpload.status===s ? (s==='Ongoing'?'#ffb347':s==='Controlled'?'#00d4aa':'#4f8ef7') : 'var(--border)'}`,
                    background: pendingUpload.status===s ? (s==='Ongoing'?'rgba(255,179,71,0.15)':s==='Controlled'?'rgba(0,212,170,0.15)':'rgba(79,142,247,0.15)') : 'transparent',
                    color: pendingUpload.status===s ? (s==='Ongoing'?'#ffb347':s==='Controlled'?'#00d4aa':'#4f8ef7') : 'var(--muted)',
                    transition:'all 0.2s'
                  }}
                >{s==='Ongoing'?'🔶':s==='Controlled'?'✅':'🏁'} {s}</button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:'10px', marginTop:'4px' }}>
            <button
              onClick={() => setPendingUpload(null)}
              style={{ padding:'12px 20px', borderRadius:'12px', border:'1px solid var(--border)', background:'transparent', color:'var(--muted)', cursor:'pointer', fontSize:'13px' }}
            >Cancel</button>
            <button
              style={{ flex:1, padding:'12px', borderRadius:'12px', border:'none', background: uploading ? 'var(--border)' : 'linear-gradient(135deg,var(--accent-doctor),var(--accent-patient))', color:'#fff', fontWeight:'700', cursor: uploading ? 'not-allowed':'pointer', fontSize:'14px', fontFamily:'var(--font-head)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.2s' }}
              disabled={uploading}
              onClick={confirmUpload}
            >
              {uploading ? (
                <><div style={{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}></div> Uploading...</>
              ) : (
                <>💾 Save to Medical Records</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  const InsuranceModal = () => !showInsuranceModal ? null : (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'20px', padding:'32px', maxWidth:'420px', width:'90%' }}>
        <h3 style={{ fontFamily:'var(--font-head)', fontSize:'20px', marginBottom:'12px' }}>✅ Confirm Application</h3>
        <p style={{ color:'var(--muted)', fontSize:'13px', lineHeight:'1.6', marginBottom:'20px' }}>
          You are applying for <strong style={{ color:'var(--text)' }}>{pendingPlan?.name}</strong> by {pendingPlan?.provider}.<br/>
          Coverage: <strong style={{ color:'var(--accent-patient)' }}>{pendingPlan?.coverage}</strong> · Premium: {pendingPlan?.premium}
        </p>
        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={confirmInsurance} style={{ flex:1, padding:'12px', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,var(--accent-doctor),var(--accent-patient))', color:'#fff', fontWeight:'700', cursor:'pointer', fontFamily:'var(--font-head)' }}>Apply Now</button>
          <button onClick={() => setShowInsuranceModal(false)} style={{ padding:'12px 20px', borderRadius:'10px', border:'1px solid var(--border)', background:'transparent', color:'var(--muted)', cursor:'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );

  // Bottom Navigation Bar
  const BottomNavBar = ({ role, active, setter }) => {
    const menus = {
      patient: [
        { id:'overview', icon:'🏠', label:t('overview') },
        { id:'records', icon:'📁', label:t('records') },
        { id:'sos', icon:'🚨', label:t('sos') },
        { id:'wallet', icon:'💳', label:t('wallet') },
        { id:'qr', icon:'👤', label:'Profile' }
      ],
      doctor: [
        { id:'overview', icon:'🏠', label:t('overview') },
        { id:'emergency', icon:'🚨', label:'SOS' },
        { id:'patients', icon:'👥', label:'Ward' },
        { id:'records', icon:'📁', label:t('records') },
        { id:'rx', icon:'💊', label:'Rx' }
      ],
      nurse: [
        { id:'overview', icon:'🏠', label:t('overview') },
        { id:'patients', icon:'📋', label:'Patients' },
        { id:'meds', icon:'💊', label:'Meds' },
        { id:'reminders', icon:'⏰', label:'Alarms' },
        { id:'sync', icon:'📡', label:'Sync' }
      ]
    };

    return (
      <div className="bottom-nav">
        {menus[role].map(item => (
          <div 
            key={item.id} 
            className={`b-nav-item ${active === item.id ? 'active ' + role.charAt(0) : ''}`} 
            onClick={() => setter(item.id)}
          >
            <span className="bn-icon">{item.icon}</span>
            <span className="bn-label">{item.label}</span>
          </div>
        ))}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════
  // RENDER: LOGIN PAGE
  // ═══════════════════════════════════════════════════════

  if (currentPage === 'login') {
    return (
      <div id="login-page" className="page active" style={{ display: 'flex', flexDirection: 'column' }}>
        <ToastNotification />
        <div className="login-bg"></div>
        <div className="login-grid"></div>
        <div className="login-wrap">
          <div className="login-logo">
            <div className="logo-icon">🏥</div>
            <h1>MediLink AI 2.0</h1>
            <p>Intelligent Emergency Response & Pre-Hospital Medical Readiness</p>
          </div>
          <div className="login-card">
            <h2>{t('signIn')}</h2>
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
              <label>{t('aadhaar')}</label>
              <input
                type="text"
                placeholder="XXXX-XXXX-XXXX"
                value={loginForm.userid}
                onChange={(e) => setLoginForm({ ...loginForm, userid: e.target.value })}
              />
            </div>
            <div className="field">
              <label>{t('pass')}</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>
            <button className="login-btn" onClick={() => doLogin()}>
              {t('access')}
            </button>
            {error && <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '10px' }}>{error}</div>}
            <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                🚀 Direct Role Access
              </div>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div className="demo-chip d" style={{ background: '#0284c7', color: '#fff' }} onClick={() => setCurrentPage('coordinator')}>📡 Command Center</div>
                <div className="demo-chip" style={{ background: '#dc2626', color: '#fff' }} onClick={() => setCurrentPage('hospital_er')}>🏥 Hospital ER</div>
                <div className="demo-chip" style={{ background: '#0891b2', color: '#fff' }} onClick={() => setCurrentPage('ambulance')}>🚑 Ambulance</div>
                <div className="demo-chip" style={{ background: '#10b981', color: '#fff' }} onClick={() => setCurrentPage('analytics')}>📊 Analytics</div>
                <div className="demo-chip p" onClick={() => { setSelectedRole('patient'); setTimeout(() => doLogin('patient'), 100); }}>👤 Patient</div>
                <div className="demo-chip d" onClick={() => { setSelectedRole('doctor'); setTimeout(() => doLogin('doctor'), 100); }}>🩺 Doctor</div>
                <div className="demo-chip n" onClick={() => { setSelectedRole('nurse'); setTimeout(() => doLogin('nurse'), 100); }}>👩‍⚕️ Nurse</div>
              </div>
            </div>
            <button className="iris-emg-login-btn" onClick={() => { setShowIrisLogin(true); setIrisEmergencyMode(true); }}>
              👁️ Emergency Iris Scan
            </button>
          </div>
        </div>
        {showIrisLogin && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
            <div style={{ position:'relative', width:'100%', maxWidth:'600px' }}>
              <button 
                onClick={() => { setShowIrisLogin(false); setIrisEmergencyMode(false); }}
                style={{ position:'absolute', top:'-40px', right:'0', background:'none', border:'none', color:'#fff', fontSize:'24px', cursor:'pointer' }}
              >✕</button>
              <IrisScanModule mode="scan" isEmergency={irisEmergencyMode} onStaffLogin={doLogin} />
            </div>
          </div>
        )}
      </div>
    );
  }

  const PortalHeader = ({ roleName, roleBadgeClass }) => (
    <>
      <nav className="topnav" style={{ gap: '12px', flexWrap: 'wrap', padding: '10px 20px', background: 'var(--surface)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="topnav-logo" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setCurrentPage('coordinator')}>
          <span style={{ fontSize: '20px' }}>🏥</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ fontSize: '15px', color: '#fff' }}>MediLink AI</strong>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>
              Pre-Hospital Medical Readiness Network
            </div>
          </div>
        </div>
        <span className={`role-badge ${roleBadgeClass || 'patient'}`}>{roleName}</span>

        {/* Coordinated Portal Switcher Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Emergency Operations Suite */}
          <div style={{ display: 'flex', gap: '3px', background: 'rgba(255,255,255,0.04)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setCurrentPage('coordinator')}
              style={{
                background: currentPage === 'coordinator' ? '#0284c7' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Central Emergency Command Center & Triage Map"
            >
              📡 Command Center
            </button>

            <button
              onClick={() => setCurrentPage('hospital_er')}
              style={{
                background: currentPage === 'hospital_er' ? '#dc2626' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Hospital Pre-Arrival Readiness & Trauma Checklist Hub"
            >
              🏥 Pre-Arrival ER
            </button>

            <button
              onClick={() => setCurrentPage('ambulance')}
              style={{
                background: currentPage === 'ambulance' ? '#0284c7' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Ambulance Telemetry & Turn-by-Turn Route Navigation"
            >
              🚑 Ambulance
            </button>

            <button
              onClick={() => setCurrentPage('analytics')}
              style={{
                background: currentPage === 'analytics' ? '#10b981' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Emergency Operations Performance & Response Time Metrics"
            >
              📊 Analytics
            </button>
          </div>

          {/* Quick SOS Trigger Button */}
          <button
            onClick={() => setShowPatientSosModal(true)}
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: '#fff',
              border: 'none',
              padding: '6px 13px',
              borderRadius: '7px',
              fontSize: '11px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(220,38,38,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            title="Patient Emergency SOS Simulator (Low-Network & Offline Resilient)"
          >
            <span>🚨</span>
            <span>Patient SOS</span>
          </button>

          {/* Core Healthcare Modules */}
          <div style={{ display: 'flex', gap: '4px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
            <button
              onClick={() => setCurrentPage('patient')}
              style={{
                background: currentPage === 'patient' ? '#00d4aa' : 'rgba(255,255,255,0.05)',
                color: currentPage === 'patient' ? '#000' : '#cbd5e1',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              title="Patient Health Vault, Records & Insurance"
            >
              👤 Vault
            </button>

            <button
              onClick={() => setCurrentPage('doctor')}
              style={{
                background: currentPage === 'doctor' ? '#4f8ef7' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              title="Doctor OPD, Ward & Prescriptions"
            >
              🩺 Doctor
            </button>

            <button
              onClick={() => setCurrentPage('nurse')}
              style={{
                background: currentPage === 'nurse' ? '#f76fa8' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              title="Nurse Ward Station & Doctor Sync"
            >
              👩‍⚕️ Nurse
            </button>

            <button
              onClick={logout}
              style={{
                background: 'transparent',
                color: 'var(--muted)',
                border: '1px solid var(--border)',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
              title="Sign out of current portal"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </nav>
    </>
  );

  // ═══════════════════════════════════════════════════════
  // RENDER: COORDINATOR COMMAND CENTER
  // ═══════════════════════════════════════════════════════
  if (currentPage === 'coordinator') {
    return (
      <div className="page dashboard-page active">
        <ToastNotification />
        <PortalHeader roleName="Emergency Coordinator" roleBadgeClass="doctor" />
        <div style={{ padding: '20px' }}>
          <EmergencyCommandCenter
            incidents={emergencyIncidents}
            activeIncident={activeIncident}
            onSelectIncident={(inc) => setActiveIncident(inc)}
            onAssignHospital={handleAssignHospital}
            onAdvanceAmbulance={handleAdvanceAmbulance}
            onOverridePriority={handleOverridePriority}
            loading={emergencyLoading}
          />
        </div>
        <PatientMobileSosModal
          isOpen={showPatientSosModal}
          onClose={() => setShowPatientSosModal(false)}
          activeIncident={activeIncident}
          onTriggerSOS={handleTriggerSOS}
          loading={emergencyLoading}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // RENDER: HOSPITAL PRE-ARRIVAL ER HUB (PRIMARY INNOVATION)
  // ═══════════════════════════════════════════════════════
  if (currentPage === 'hospital_er') {
    return (
      <div className="page dashboard-page active">
        <ToastNotification />
        <PortalHeader roleName="Apollo Emergency Operations" roleBadgeClass="nurse" />
        <div style={{ padding: '20px' }}>
          <HospitalReadinessHub
            incident={activeIncident}
            onAccept={() => handleHospitalAck('Accepted', '')}
            onDecline={(reason) => handleHospitalAck('Declined', reason)}
            onAssignTeam={handleAssignTeam}
            onToggleChecklist={handleToggleChecklist}
            onMarkTeamReady={handleMarkTeamReady}
            loading={emergencyLoading}
          />
        </div>
        <PatientMobileSosModal
          isOpen={showPatientSosModal}
          onClose={() => setShowPatientSosModal(false)}
          activeIncident={activeIncident}
          onTriggerSOS={handleTriggerSOS}
          loading={emergencyLoading}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // RENDER: AMBULANCE COORDINATION VIEW
  // ═══════════════════════════════════════════════════════
  if (currentPage === 'ambulance') {
    return (
      <div className="page dashboard-page active">
        <ToastNotification />
        <PortalHeader roleName="Ambulance Unit AMB-09" roleBadgeClass="patient" />
        <div style={{ padding: '20px' }}>
          <AmbulanceCoordinationView
            incident={activeIncident}
            onStatusChange={handleAmbulanceStatusChange}
            onAdvanceAmbulance={handleAdvanceAmbulance}
            loading={emergencyLoading}
          />
        </div>
        <PatientMobileSosModal
          isOpen={showPatientSosModal}
          onClose={() => setShowPatientSosModal(false)}
          activeIncident={activeIncident}
          onTriggerSOS={handleTriggerSOS}
          loading={emergencyLoading}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // RENDER: SFIC EMERGENCY ANALYTICS
  // ═══════════════════════════════════════════════════════
  if (currentPage === 'analytics') {
    return (
      <div className="page dashboard-page active">
        <ToastNotification />
        <PortalHeader roleName="Emergency Operations Analytics" roleBadgeClass="doctor" />
        <div style={{ padding: '20px' }}>
          <EmergencyAnalyticsView
            analyticsData={analyticsData}
          />
        </div>
        <PatientMobileSosModal
          isOpen={showPatientSosModal}
          onClose={() => setShowPatientSosModal(false)}
          activeIncident={activeIncident}
          onTriggerSOS={handleTriggerSOS}
          loading={emergencyLoading}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // RENDER: PATIENT DASHBOARD
  // ═══════════════════════════════════════════════════════
  if (currentPage === 'patient') {
    return (
      <div className="page dashboard-page active">
        <ToastNotification />
        <NotifDrawer />
        <InsuranceModal />
        <RecordUploadModal />
        <nav className="topnav" style={{ gap:'15px' }}>
          <div className="topnav-logo">🏥 MediCore</div>
          <span className="role-badge patient">{t('patientPortal')}</span>
          
          {/* Family Switcher Dropdown */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginLeft:'auto', background:'rgba(255,255,255,0.03)', padding:'4px 12px', borderRadius:'14px', border:'1px solid var(--border)' }}>
            <span style={{ fontSize:'12px', color:'var(--muted)' }}>Member Profile:</span>
            <select
              value={selectedFamilyMember ? selectedFamilyMember.id : 'primary'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'primary') {
                  setSelectedFamilyMember(null);
                } else {
                  const m = familyMembers.find(f => f.id === val);
                  setSelectedFamilyMember(m);
                }
              }}
              style={{ background:'transparent', border:'none', color:'var(--accent-patient)', fontSize:'13px', fontWeight:'700', cursor:'pointer', padding:'2px 4px', outline:'none' }}
            >
              <option value="primary" style={{ background:'var(--card)', color:'var(--text)' }}>Ravi Patel (Self)</option>
              {familyMembers.map(m => (
                <option key={m.id} value={m.id} style={{ background:'var(--card)', color:'var(--text)' }}>
                  {m.name} ({m.relation})
                </option>
              ))}
            </select>
          </div>

          <div className="nav-user">
            <div className="nav-avatar patient" style={{ background: selectedFamilyMember ? 'var(--accent-nurse)' : 'var(--accent-patient)' }}>
              {selectedFamilyMember ? selectedFamilyMember.relation.slice(0,2).toUpperCase() : 'RP'}
            </div>
            <span className="nav-name">{selectedFamilyMember ? selectedFamilyMember.name : 'Ravi Patel'}</span>
          </div>
          <ConnectionPulse />
          <div className="lang-toggle">
            <span className={`lang-mini ${language==='en'?'active':''}`} onClick={() => setLanguage('en')}>EN</span>
            <span className={`lang-mini ${language==='hi'?'active':''}`} onClick={() => setLanguage('hi')}>हिं</span>
          </div>
          <button className="notif-bell" onClick={() => { setNotifOpen(true); setUnreadCount(0); }}>
            🔔{unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
          <button className="logout-btn" onClick={logout}>{t('logout')}</button>
        </nav>
        <div className="dash-layout">
          <aside className="sidebar">
            <div className="sidebar-section-label">Menu</div>
            {[
              { id: 'overview', icon: '📊', label: t('overview') },
              { id: 'records', icon: '📋', label: t('records') },
              { id: 'ai', icon: '🧠', label: t('ai') },
              { id: 'medication', icon: '💊', label: 'Medications Adherence' },
              { id: 'prescription-scanner', icon: '📸', label: 'Rx Scanner' },
              { id: 'mental', icon: '🧘', label: 'Mental Wellness' },
              { id: 'family', icon: '👪', label: 'Family Dashboard' },
              { id: 'medicine-verify', icon: '🛡️', label: 'Verify Medicine' },
              { id: 'sos', icon: '🚑', label: t('sos') },
              { id: 'wallet', icon: '💳', label: t('wallet') },
              { id: 'insurance', icon: '🛡️', label: t('insurance') },
              { id: 'appointments', icon: '📅', label: 'Appointments' },
              { id: 'qr', icon: '📲', label: t('qr') },
              { id: 'analytics', icon: '📈', label: t('analytics') },
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
                  <h2>Good Morning, {selectedFamilyMember ? selectedFamilyMember.name : 'Ravi'} 👋</h2>
                  <p>Here's the health summary for {selectedFamilyMember ? `${selectedFamilyMember.name} (${selectedFamilyMember.relation})` : 'today — 4 April 2026'}</p>
                </div>

                {/* AI Emergency Health Summary Card */}
                <div className="panel" style={{ background:'linear-gradient(135deg, #1b2035, #141727)', border:'1.5px solid rgba(255, 85, 102, 0.25)', borderRadius:'24px', padding:'24px', marginBottom:'24px', boxShadow:'0 15px 40px rgba(255, 85, 102, 0.08)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px', borderBottom:'1px solid rgba(255,255,255,0.08)', paddingBottom:'16px', marginBottom:'16px' }}>
                    <div>
                      <span style={{ fontSize:'10px', textTransform:'uppercase', fontWeight:'800', color:'var(--danger)', letterSpacing:'1px', background:'rgba(255,85,102,0.12)', padding:'4px 10px', borderRadius:'12px' }}>🚨 AI Emergency Health Summary</span>
                      <h3 style={{ fontFamily:'var(--font-head)', fontSize:'22px', fontWeight:'700', marginTop:'8px', color:'#fff' }}>
                        {selectedFamilyMember ? selectedFamilyMember.name : 'Ravi Patel'}
                      </h3>
                      <div style={{ fontSize:'12px', color:'var(--muted)', marginTop:'2px', fontFamily:'var(--font-mono)' }}>ABHA: {selectedFamilyMember ? '14-8839-4421-9921' : '14-1234-5678-9012'}</div>
                    </div>
                    
                    {/* Color-coded risk status badge */}
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(255, 179, 71, 0.1)', border:'1px solid var(--warn)', padding:'6px 14px', borderRadius:'14px' }}>
                      <div className="pulse-dot orange"></div>
                      <span style={{ fontSize:'11px', fontWeight:'700', color:'var(--warn)', textTransform:'uppercase', fontFamily:'var(--font-mono)' }}>AI Risk: {selectedFamilyMember ? 'Moderate' : 'Medium (68)'}</span>
                    </div>
                  </div>

                  <div className="grid-4" style={{ gap:'16px' }}>
                    <div style={{ background:'rgba(255,255,255,0.02)', padding:'12px', borderRadius:'14px', border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:'11px', color:'var(--muted)', textTransform:'uppercase' }}>🩸 Blood Group</div>
                      <div style={{ fontSize:'16px', fontWeight:'700', marginTop:'4px', color:'var(--accent-patient)' }}>{selectedFamilyMember ? selectedFamilyMember.blood : 'O+'}</div>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.02)', padding:'12px', borderRadius:'14px', border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:'11px', color:'var(--muted)', textTransform:'uppercase' }}>⚠️ Allergies</div>
                      <div style={{ fontSize:'13px', fontWeight:'600', marginTop:'4px', color:'#ff5566' }}>{selectedFamilyMember ? selectedFamilyMember.allergies : 'Sulfa, Dust, Pollen'}</div>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.02)', padding:'12px', borderRadius:'14px', border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:'11px', color:'var(--muted)', textTransform:'uppercase' }}>🩺 Chronic Diseases</div>
                      <div style={{ fontSize:'13px', fontWeight:'600', marginTop:'4px' }}>{selectedFamilyMember ? selectedFamilyMember.conditions.join(', ') : 'Hypertension, Type 2 Diabetes'}</div>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.02)', padding:'12px', borderRadius:'14px', border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:'11px', color:'var(--muted)', textTransform:'uppercase' }}>📞 Emergency Contact</div>
                      <div style={{ fontSize:'13px', fontWeight:'600', marginTop:'4px' }}>Kiran Patel (Spouse) · 98765 09212</div>
                    </div>
                  </div>

                  <div style={{ marginTop:'18px', display:'flex', gap:'16px', flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:'200px' }}>
                      <div style={{ fontSize:'11px', color:'var(--muted)', textTransform:'uppercase', marginBottom:'6px' }}>💊 Active Medications</div>
                      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                        {selectedFamilyMember ? (
                          <span className="badge present" style={{ fontSize:'10px' }}>Loaded via profile</span>
                        ) : (
                          <>
                            <span className="badge present" style={{ fontSize:'10px' }}>Metformin 500mg</span>
                            <span className="badge present" style={{ fontSize:'10px' }}>Amlodipine 5mg</span>
                            <span className="badge present" style={{ fontSize:'10px' }}>Atorvastatin 20mg</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ width:'220px' }}>
                      <div style={{ fontSize:'11px', color:'var(--muted)', textTransform:'uppercase', marginBottom:'6px' }}>🛡️ Insurance Cover</div>
                      <div style={{ fontSize:'13px', fontWeight:'700', color:'var(--accent-patient)' }}>
                        {selectedFamilyMember ? selectedFamilyMember.insurance : 'Star Health Premium (Active)'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="stat-grid">
                  <div className="stat-card teal"><div className="stat-icon">❤️</div><div className="stat-val">{selectedFamilyMember ? (74 + selectedFamilyMember.age % 10) : 98}</div><div className="stat-label">Heart Rate (bpm)</div></div>
                  <div className="stat-card blue"><div className="stat-icon">🩸</div><div className="stat-val">{selectedFamilyMember ? (selectedFamilyMember.conditions.includes('Hypertension') ? '142/92' : '122/82') : '120/80'}</div><div className="stat-label">Blood Pressure</div></div>
                  <div className="stat-card pink"><div className="stat-icon">🌡️</div><div className="stat-val">98.6°</div><div className="stat-label">Temperature (F)</div></div>
                  <div className="stat-card warn"><div className="stat-icon">⚖️</div><div className="stat-val">{selectedFamilyMember ? `${selectedFamilyMember.age + 8}kg` : '72kg'}</div><div className="stat-label">Body Weight</div></div>
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
                <div className="dash-header">
                  <h2>📋 Medical Records</h2>
                  <p>Your complete health history · All files saved permanently</p>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div className="panel-title">📁 Uploaded Reports & Records</div>
                    <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
                      <div style={{ display:'flex', gap:'4px', background:'var(--surface)', padding:'4px', borderRadius:'10px', border:'1px solid var(--border)' }}>
                        <button
                          onClick={() => setRecordsViewMode('table')}
                          style={{ padding:'4px 10px', borderRadius:'6px', border:'none', background:recordsViewMode==='table'?'var(--accent-patient)':'transparent', color:recordsViewMode==='table'?'#fff':'var(--muted)', cursor:'pointer', fontSize:'11px', fontWeight:'600' }}
                        >☰ List</button>
                        <button
                          onClick={() => setRecordsViewMode('gallery')}
                          style={{ padding:'4px 10px', borderRadius:'6px', border:'none', background:recordsViewMode==='gallery'?'var(--accent-patient)':'transparent', color:recordsViewMode==='gallery'?'#fff':'var(--muted)', cursor:'pointer', fontSize:'11px', fontWeight:'600' }}
                        >⊞ Gallery</button>
                      </div>
                      <button className="panel-action secondary" onClick={loadRecords}>🔄 Refresh</button>
                      <button
                        className="panel-action"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ background:'linear-gradient(135deg,var(--accent-doctor),var(--accent-patient))', border:'none' }}
                      >📤 Upload Report</button>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      style={{ display:'none' }}
                      accept="image/*,application/pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                    />
                  </div>

                  {/* Upload drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload({ target: { files: e.dataTransfer.files, value: '' } });
                      }
                    }}
                    style={{
                      margin:'0 0 16px', padding:'20px', borderRadius:'14px',
                      border:'2px dashed var(--border)', background:'rgba(79,142,247,0.03)',
                      display:'flex', alignItems:'center', gap:'16px', cursor:'pointer',
                      transition:'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent-doctor)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
                  >
                    <div style={{ fontSize:'36px' }}>📎</div>
                    <div>
                      <div style={{ fontWeight:'700', fontSize:'14px', color:'var(--text)' }}>Drop or click to upload</div>
                      <div style={{ fontSize:'12px', color:'var(--muted)', marginTop:'3px' }}>Supports PDF, JPG, PNG, DOCX, TXT · Max 25MB · Saved permanently</div>
                    </div>
                    <div style={{ marginLeft:'auto', padding:'8px 16px', borderRadius:'10px', background:'var(--accent-doctor)', color:'#fff', fontSize:'12px', fontWeight:'700' }}>Browse Files</div>
                  </div>

                  {recordsLoading ? (
                    <div style={{ padding:'20px' }}>
                      {[1,2,3].map(i => <div key={i} className="skeleton-line" style={{ height:'56px', marginBottom:'10px', borderRadius:'10px' }}></div>)}
                    </div>
                  ) : medicalRecords.length === 0 ? (
                    <div style={{ textAlign:'center', color:'var(--muted)', padding:'50px 20px' }}>
                      <div style={{ fontSize:'60px', marginBottom:'16px' }}>📂</div>
                      <div style={{ fontSize:'16px', fontWeight:'700', color:'var(--text)', marginBottom:'8px' }}>No records yet</div>
                      <p style={{ fontSize:'13px', lineHeight:'1.6' }}>Upload your first report — it will be saved<br/>permanently and available even after restart.</p>
                      <button className="panel-action" onClick={() => fileInputRef.current.click()} style={{ marginTop:'16px', display:'inline-block' }}>📤 Upload First Report</button>
                    </div>
                  ) : recordsViewMode === 'table' ? (
                    <div style={{ overflowX:'auto' }}>
                      <table className="patient-table">
                        <thead>
                          <tr>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Report / Diagnosis</th>
                            <th>Doctor</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {medicalRecords.map((record) => (
                            <tr key={record.id}>
                              <td>
                                <div style={{ fontSize:'22px', textAlign:'center' }}>
                                  {record.isPDF ? '📕' : record.isImage ? '🖼️' : record.photo ? '📄' : '📝'}
                                </div>
                              </td>
                              <td><span style={{ fontFamily:'var(--font-mono)', fontSize:'12px' }}>{record.date}</span></td>
                              <td>
                                <div style={{ fontWeight:'600', fontSize:'13px' }}>{record.diagnosis}</div>
                                {record.reportType && <div style={{ fontSize:'11px', color:'var(--muted)', marginTop:'2px' }}>{record.reportType}</div>}
                                {record.originalName && <div style={{ fontSize:'10px', color:'var(--muted)', marginTop:'1px', fontFamily:'var(--font-mono)' }}>📎 {record.originalName}</div>}
                              </td>
                              <td style={{ fontSize:'12px' }}>{record.doctor}</td>
                              <td>
                                <span className={`badge ${record.status==='Ongoing'?'warn':record.status==='Controlled'?'success':'stable'}`}>{record.status}</span>
                              </td>
                              <td>
                                <div className="action-btns">
                                  {record.fileUrl ? (
                                    <button
                                      className="tiny-btn"
                                      onClick={() => window.open(record.fileUrl, '_blank')}
                                      style={{ background:'rgba(79,142,247,0.15)', color:'var(--accent-doctor)', border:'1px solid rgba(79,142,247,0.3)' }}
                                    >{record.isPDF ? '📖 View PDF' : '🔍 View'}</button>
                                  ) : (
                                    <span style={{ fontSize:'11px', color:'var(--muted)' }}>No file</span>
                                  )}
                                  <button className="tiny-btn danger" onClick={() => deleteRecord(record.id)}>🗑️</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="records-gallery">
                      {medicalRecords.map((record) => (
                        <div key={record.id} className="record-card">
                          <div
                            className="record-img-wrap"
                            onClick={() => record.fileUrl && window.open(record.fileUrl, '_blank')}
                            style={{ cursor: record.fileUrl ? 'pointer' : 'default' }}
                          >
                            {record.isImage && record.photoUrl ? (
                              <img src={record.photoUrl} alt={record.diagnosis} />
                            ) : (
                              <div className="record-placeholder" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px', fontSize:'13px', color:'var(--muted)', height:'100%' }}>
                                <div style={{ fontSize:'42px' }}>{record.isPDF ? '📕' : record.photo ? '📄' : '📝'}</div>
                                <div style={{ fontSize:'10px', textAlign:'center', padding:'0 8px' }}>{record.isPDF ? 'PDF Document' : record.photo ? 'Document' : 'Text Record'}</div>
                              </div>
                            )}
                            <div className="record-overlay">
                              <span>{record.isPDF ? '📖 Open PDF' : record.isImage ? '🔍 View' : '📂 Open'}</span>
                            </div>
                          </div>
                          <div className="record-info-wrap">
                            <div className="record-diag">{record.diagnosis}</div>
                            {record.reportType && <div style={{ fontSize:'10px', color:'var(--accent-doctor)', marginBottom:'4px' }}>{record.reportType}</div>}
                            <div className="record-meta">
                              <span style={{ fontSize:'11px' }}>{record.date}</span>
                              <span className={`badge-dot ${record.status.toLowerCase()}`}></span>
                            </div>
                            {record.fileSize && <div style={{ fontSize:'10px', color:'var(--muted)', marginTop:'4px' }}>📎 {(record.fileSize/1024).toFixed(0)} KB</div>}
                            <div style={{ display:'flex', gap:'5px', marginTop:'10px' }}>
                              {record.fileUrl && (
                                <button className="tiny-btn" style={{ flex:1 }} onClick={() => window.open(record.fileUrl, '_blank')}>
                                  {record.isPDF ? '📖 PDF' : '🔍 View'}
                                </button>
                              )}
                              <button className="tiny-btn danger" onClick={() => deleteRecord(record.id)}>🗑️</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Add new card */}
                      <div className="record-card add-new" onClick={() => fileInputRef.current.click()}>
                        <div className="add-icon">+</div>
                        <div>Upload New Report</div>
                        <div style={{ fontSize:'10px', color:'var(--muted)', marginTop:'4px' }}>PDF · Image · Doc</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="panel" style={{ marginTop:'20px' }}>
                  <div className="panel-header"><div className="panel-title">💊 Current Medications</div></div>
                  {medications.map((med, idx) => (
                    <div key={idx} className="med-row">
                      <div style={{ fontSize:'20px' }}>💊</div>
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
                    {gpsLoading ? (
                      <div style={{ textAlign:'center', padding:'30px 0' }}>
                        <div style={{ fontSize:'36px', marginBottom:'12px', animation:'pulse 1s infinite' }}>📡</div>
                        <div style={{ fontFamily:'var(--font-head)', color:'var(--accent-patient)', fontSize:'16px' }}>Acquiring GPS Location...</div>
                        <div style={{ color:'var(--muted)', fontSize:'12px', marginTop:'6px' }}>Please allow location access</div>
                      </div>
                    ) : !sosActive ? (
                      <>
                        <button className="sos-btn" onClick={captureGPS}>🚨 &nbsp; SOS — CALL AMBULANCE NOW</button>
                        <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '12px' }}>Tap to instantly alert nearest emergency unit.<br/>Your GPS location will be shared automatically.</p>
                      </>
                    ) : (
                      <div className="sos-tracking">
                        <div className="sos-status-card" style={{ background: 'rgba(255,85,102,0.1)', border: '1px solid var(--danger)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                          <h3 style={{ color: 'var(--danger)', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <div className="pulse-dot"></div> Live Tracking Active
                          </h3>
                          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)', fontWeight: '600' }}>
                            {sosStep === 1 && "Dispatching Unit AMB-04..."}
                            {sosStep === 2 && "Unit AMB-04 is en route to your location."}
                            {sosStep === 3 && "Unit AMB-04 is arriving..."}
                            {sosStep === 4 && "Ambulance has arrived at your location."}
                          </p>
                          <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-mono)', margin: '15px 0', color: 'var(--danger)' }}>
                            {sosStep < 4 ? `ETA: ${sosEta} min` : "Arrived"}
                          </div>
                        </div>
                        {/* Progress visualizer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', margin: '20px auto', maxWidth: '300px' }}>
                          <div style={{ height: '4px', background: 'var(--border)', position: 'absolute', top: '50%', left: 0, right: 0, zIndex: 0, transform: 'translateY(-50%)' }}>
                            <div style={{ height: '100%', background: 'var(--danger)', transition: 'width 1s ease', width: sosStep === 1 ? '10%' : sosStep === 2 ? '50%' : sosStep === 3 ? '90%' : '100%' }}></div>
                          </div>
                          {[1,2,3,4].map(step => (
                            <div key={step} style={{ 
                              width: '24px', height: '24px', borderRadius: '50%', 
                              background: sosStep >= step ? 'var(--danger)' : 'var(--surface)', 
                              border: `2px solid ${sosStep >= step ? 'var(--danger)' : 'var(--border)'}`,
                              zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 'bold'
                            }}>
                              {sosStep > step ? '✓' : step}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', maxWidth: '340px', margin: '0 auto' }}>
                          <span>Alerted</span><span>Dispatched</span><span>En Route</span><span>Arrived</span>
                        </div>
                        <button style={{ marginTop: '20px', background: 'var(--surface)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '8px', color: 'var(--text)', cursor: 'pointer' }} onClick={() => { setSosActive(false); clearInterval(sosIntervalRef.current); }}>Cancel Request</button>
                      </div>
                    )}
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


            {/* GPS Leaflet Map */}
            {gpsCoords && patientActiveView === 'sos' && (
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">🗺️ Live Location Map</div>
                  {assignedHospital && <span className="badge present">✓ {assignedHospital.name} Assigned</span>}
                </div>
                <div style={{ height:'280px', borderRadius:'12px', overflow:'hidden', border:'1px solid var(--border)' }}>
                  <MapContainer center={[gpsCoords.lat, gpsCoords.lng]} zoom={15} style={{ height:'100%', width:'100%' }} zoomControl={true}>
                    <MapRecenter lat={gpsCoords.lat} lng={gpsCoords.lng} />
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                    <Marker position={[gpsCoords.lat, gpsCoords.lng]} icon={userMapIcon}>
                      <Popup><strong>📍 Your Location</strong><br/>GPS Acquired</Popup>
                    </Marker>
                    {sosHospitalsList.map(h => (
                      <Marker key={h.id} position={[h.lat, h.lng]} icon={hospMapIcon}>
                        <Popup><strong>🏥 {h.name}</strong><br/>{h.dist} • ETA {h.eta}<br/>Beds: {h.beds}</Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
                <div style={{ display:'flex', gap:'10px', marginTop:'14px', flexWrap:'wrap' }}>
                  {sosHospitalsList.map((h,i) => (
                    <div key={h.id} style={{ flex:1, minWidth:'140px', background: i===0?'rgba(255,85,102,0.08)':'var(--surface)', border:`1px solid ${i===0?'var(--danger)':'var(--border)'}`, borderRadius:'10px', padding:'12px' }}>
                      <div style={{ fontWeight:'700', fontSize:'13px', marginBottom:'4px' }}>{h.name}</div>
                      <div style={{ fontSize:'12px', color:'var(--muted)' }}>{h.dist} • ETA {h.eta}</div>
                      <div style={{ fontSize:'11px', color:'var(--accent-patient)', marginTop:'4px' }}>🛏 {h.beds} beds free</div>
                      {i===0 && <div style={{ fontSize:'11px', color:'var(--danger)', fontWeight:'700', marginTop:'4px' }}>⚡ AUTO-ASSIGNED</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wallet */}
            {patientActiveView === 'wallet' && (
              <div className="view">
                <div className="dash-header"><h2>💳 Health Wallet</h2><p>Government Health Account — spend only on medical expenses</p></div>
                <div className="wallet-card">
                  <div className="wallet-label">Available Balance</div>
                  <div className="wallet-balance">₹ 24,500.00</div>
                  <div style={{ fontSize:'12px', color:'var(--muted)' }}>ABHA Health Account • ID: 14-1234-5678-9012</div>
                  <div style={{ marginTop:'16px', display:'flex', gap:'10px' }}>
                    <button onClick={() => setShowQRPay(!showQRPay)} style={{ padding:'8px 16px', borderRadius:'8px', border:'1px solid rgba(0,212,170,0.4)', background:'rgba(0,212,170,0.08)', color:'var(--accent-patient)', cursor:'pointer', fontSize:'12px', fontWeight:'600' }}>📲 Pay via QR</button>
                    <span style={{ fontSize:'11px', color:'var(--muted)', display:'flex', alignItems:'center' }}>🔒 No withdrawal • Medical use only</span>
                  </div>
                  {showQRPay && (
                    <div style={{ marginTop:'16px', padding:'16px', background:'rgba(0,0,0,0.2)', borderRadius:'12px', textAlign:'center' }}>
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=MEDICORE-PAY|ABHA:14-1234-5678-9012|AMT:0|HOSP:Scan-to-Pay&bgcolor=0a0d14&color=00d4aa`} alt="Pay QR" style={{ borderRadius:'8px', marginBottom:'8px' }} />
                      <div style={{ fontSize:'12px', color:'var(--muted)' }}>Scan at Apollo, Fortis, Max, or Govt. hospitals</div>
                      {payConfirmed && <div style={{ color:'var(--accent-patient)', fontSize:'12px', marginTop:'8px', fontWeight:'600' }}>✓ Payment confirmed!</div>}
                      <button onClick={() => { setPayConfirmed(true); setTimeout(() => setPayConfirmed(false), 3000); }} style={{ marginTop:'10px', padding:'6px 16px', borderRadius:'8px', border:'none', background:'var(--accent-patient)', color:'#000', fontWeight:'700', cursor:'pointer', fontSize:'12px' }}>Simulate Payment</button>
                    </div>
                  )}
                </div>
                <div className="panel" style={{ marginTop:'0' }}>
                  <div className="panel-header"><div className="panel-title">📋 Transaction History</div></div>
                  <table className="patient-table">
                    <thead>
                      <tr><th>Date</th><th>Hospital/Pharmacy</th><th>Purpose</th><th>Amount</th><th>Type</th></tr>
                    </thead>
                    <tbody>
                    {WALLET_TXN.map(tx => (
                      <tr key={tx.id}>
                        <td><span style={{ fontFamily:'var(--font-mono)', fontSize:'11px' }}>{tx.date}</span></td>
                        <td>{tx.hospital}</td>
                        <td style={{ fontSize:'12px', color:'var(--muted)' }}>{tx.purpose}</td>
                        <td><span style={{ fontFamily:'var(--font-mono)', fontWeight:'700', color: tx.type==='credit'?'var(--accent-patient)':'var(--danger)' }}>{tx.type==='credit'?'+':'-'}₹{tx.amount.toLocaleString()}</span></td>
                        <td><span className={`badge ${tx.type==='credit'?'present':'absent'}`}>{tx.type==='credit'?'Credit':'Debit'}</span></td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Insurance */}
            {patientActiveView === 'insurance' && (
              <div className="view">
                <div className="dash-header"><h2>🛡️ Insurance Plans</h2><p>Compare & apply — AI-matched to your health profile</p></div>
                {insuranceApplied && (
                  <div className="alert-card info" style={{ marginBottom:'0' }}>
                    <span className="alert-icon">✅</span>
                    <div className="alert-body"><strong>Applied: {insuranceApplied.name}</strong><span>Your application is under review. Coverage: {insuranceApplied.coverage}</span></div>
                  </div>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'14px' }}>
                  {INSURANCE_PLANS.map(plan => (
                    <div key={plan.id} className="panel" style={{ border:`1px solid ${plan.color}33`, position:'relative', overflow:'visible' }}>
                      <div style={{ position:'absolute', top:'-10px', right:'14px', background:plan.color, color:'#000', fontSize:'10px', fontWeight:'800', padding:'3px 10px', borderRadius:'20px', fontFamily:'var(--font-mono)' }}>{plan.tag}</div>
                      <div style={{ fontFamily:'var(--font-head)', fontSize:'17px', fontWeight:'800', marginBottom:'4px' }}>{plan.name}</div>
                      <div style={{ fontSize:'12px', color:'var(--muted)', marginBottom:'12px' }}>{plan.provider}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'12px' }}>
                        <div><div style={{ fontSize:'11px', color:'var(--muted)' }}>Coverage</div><div style={{ fontWeight:'700', color:plan.color }}>{plan.coverage}</div></div>
                        <div style={{ textAlign:'right' }}><div style={{ fontSize:'11px', color:'var(--muted)' }}>Premium</div><div style={{ fontWeight:'700', fontSize:'13px' }}>{plan.premium}</div></div>
                      </div>
                      <div style={{ marginBottom:'12px' }}>
                        <div style={{ fontSize:'11px', color:'var(--muted)', marginBottom:'6px', fontFamily:'var(--font-mono)' }}>FEATURES</div>
                        {plan.features.map((f,i) => <div key={i} style={{ fontSize:'12px', padding:'3px 0', color:'var(--text)' }}>✓ {f}</div>)}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                        <div style={{ fontSize:'12px', color:'var(--muted)' }}>AI Match</div>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <div style={{ width:'80px', height:'6px', background:'var(--border)', borderRadius:'3px', overflow:'hidden' }}><div style={{ height:'100%', width:`${plan.aiMatch}%`, background:plan.color, borderRadius:'3px' }}></div></div>
                          <span style={{ fontSize:'13px', fontWeight:'700', color:plan.color }}>{plan.aiMatch}%</span>
                        </div>
                      </div>
                      <button onClick={() => applyInsurancePlan(plan)} disabled={insuranceApplied?.id===plan.id} style={{ width:'100%', padding:'10px', borderRadius:'10px', border:'none', background: insuranceApplied?.id===plan.id?'var(--surface)':`linear-gradient(135deg,${plan.color},${plan.color}aa)`, color: insuranceApplied?.id===plan.id?'var(--muted)':'#fff', fontWeight:'700', cursor: insuranceApplied?.id===plan.id?'default':'pointer', fontFamily:'var(--font-head)', fontSize:'13px' }}>
                        {insuranceApplied?.id===plan.id ? '✓ Applied' : 'Apply Now'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appointments — Patient Side */}
            {patientActiveView === 'appointments' && (
              <PatientAppointments 
                doctors={doctors}
                bookingForm={bookingForm}
                setBookingForm={setBookingForm}
                bookAppointment={bookAppointment}
                appsLoading={appsLoading}
                appointments={appointments}
              />
            )}


            {/* QR Code View */}
            {patientActiveView === 'qr' && (
              <div className="view">
                <div className="dash-header"><h2>📲 Emergency QR Code</h2><p>Hospitals scan this for instant access to your medical data</p></div>
                <div className="grid-2">
                  <div className="panel" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>
                    <div style={{ fontFamily:'var(--font-head)', fontSize:'15px', fontWeight:'700', alignSelf:'flex-start' }}>🆔 Your Medical ID Card</div>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent('MEDICORE|ID:1234-5678-9012|NAME:Ravi Patel|DOB:15-Jun-1981|BLOOD:O+|ALLERGY:Penicillin|DIAG:Hypertension+Diabetes T2|EMGCY:+91-98765-43210|DOCTOR:Dr.K.Sharma')}&bgcolor=111621&color=00d4aa&margin=10`}
                      alt="Medical QR" style={{ borderRadius:'12px', border:'2px solid rgba(0,212,170,0.3)' }}
                    />
                    <div style={{ textAlign:'center', fontSize:'12px', color:'var(--muted)' }}>Scan with any hospital terminal for instant patient access</div>
                    <a href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent('MEDICORE|ID:1234-5678-9012|NAME:Ravi Patel|BLOOD:O+|ALLERGY:Penicillin|DIAG:Hypertension+Diabetes T2|EMGCY:+91-98765-43210')}`} download="MediCore_QR.png" target="_blank" style={{ padding:'8px 20px', borderRadius:'8px', border:'1px solid rgba(0,212,170,0.3)', background:'rgba(0,212,170,0.08)', color:'var(--accent-patient)', fontSize:'12px', fontWeight:'600', textDecoration:'none' }}>⬇ Download QR</a>
                  </div>
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">📋 Encoded Data</div></div>
                    {[['Patient Name','Ravi Patel'],['ABHA ID','1234-5678-9012'],['Blood Group','O+'],['Allergies','Penicillin'],['Primary Doctor','Dr. K. Sharma'],['Emergency Contact','+91 98765 43210'],['Conditions','Hypertension, Diabetes T2']].map(([k,v]) => (
                      <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:'13px' }}>
                        <span style={{ color:'var(--muted)' }}>{k}</span>
                        <span style={{ fontWeight:'600', color:'var(--text)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Analytics View */}
            {patientActiveView === 'analytics' && (
              <div className="view">
                <div className="dash-header"><h2>📈 Health Analytics</h2><p>7-day trends — powered by MediCore Intelligence</p></div>
                <div className="grid-2">
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">🩸 Blood Pressure (mmHg)</div></div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={bpData}>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="day" tick={{ fill:'var(--muted)', fontSize:11 }} />
                        <YAxis tick={{ fill:'var(--muted)', fontSize:11 }} />
                        <Tooltip content={<ChartTip />} />
                        <Line type="monotone" dataKey="sys" name="Systolic" stroke="#ff5566" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="dia" name="Diastolic" stroke="#4f8ef7" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">🍬 Blood Sugar (mg/dL)</div></div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={sugarData}>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="day" tick={{ fill:'var(--muted)', fontSize:11 }} />
                        <YAxis tick={{ fill:'var(--muted)', fontSize:11 }} />
                        <Tooltip content={<ChartTip />} />
                        <Bar dataKey="fasting" name="Fasting" fill="#ffb347" radius={[4,4,0,0]} />
                        <Bar dataKey="post" name="Post-meal" fill="#ff5566" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">❤️ Heart Rate (bpm)</div></div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={heartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="day" tick={{ fill:'var(--muted)', fontSize:11 }} />
                      <YAxis domain={[85,110]} tick={{ fill:'var(--muted)', fontSize:11 }} />
                      <Tooltip content={<ChartTip />} />
                      <defs><linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3}/><stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/></linearGradient></defs>
                      <Area type="monotone" dataKey="hr" name="Heart Rate" stroke="#00d4aa" strokeWidth={2} fill="url(#hrGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            {/* Medication Adherence & Drug Interaction Intelligence */}
            {patientActiveView === 'medication' && (
              <div className="view active">
                <div className="dash-header">
                  <h2>💊 Medication Intelligence</h2>
                  <p>Adherence calendar, drug interaction check, and dosage schedule</p>
                </div>

                <div className="grid-2">
                  <div className="panel">
                    <div className="panel-header">
                      <div className="panel-title">📅 Adherence Calendar</div>
                      <button className="panel-action" onClick={() => setShowAddMedModal(true)}>+ Add Medicine</button>
                    </div>
                    {medsLoading ? <p>Loading medicines...</p> : patientMeds.length === 0 ? <p style={{ color:'var(--muted)' }}>No medications active.</p> : (
                      <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                        {patientMeds.map(med => {
                          const isTodayTaken = med.takenDays?.includes('2026-07-30');
                          const isYesterdayTaken = med.takenDays?.includes('2026-07-29');
                          return (
                            <div key={med.id} className="med-row" style={{ padding:'16px', background:'rgba(255,255,255,0.02)', borderRadius:'14px', border:'1px solid var(--border)' }}>
                              <div style={{ fontSize:'24px' }}>💊</div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontWeight:'700', fontSize:'15px' }}>{med.name}</div>
                                <div style={{ fontSize:'12px', color:'var(--muted)', marginTop:'2px' }}>{med.dosage} · {med.frequency}</div>
                                {med.instructions && <div style={{ fontSize:'11px', color:'var(--accent-patient)', marginTop:'4px' }}>💡 {med.instructions}</div>}
                              </div>
                              <div style={{ display:'flex', gap:'8px' }}>
                                <label style={{ display:'flex', flexDirection:'column', alignItems:'center', cursor:'pointer' }}>
                                  <span style={{ fontSize:'9px', color:'var(--muted)', marginBottom:'2px' }}>YESTERDAY</span>
                                  <input 
                                    type="checkbox" 
                                    checked={isYesterdayTaken || false}
                                    onChange={(e) => toggleAdherence(med.id, '2026-07-29', e.target.checked)}
                                    style={{ width:'20px', height:'20px', accentColor:'var(--accent-patient)' }}
                                  />
                                </label>
                                <label style={{ display:'flex', flexDirection:'column', alignItems:'center', cursor:'pointer' }}>
                                  <span style={{ fontSize:'9px', color:'var(--muted)', marginBottom:'2px' }}>TODAY</span>
                                  <input 
                                    type="checkbox" 
                                    checked={isTodayTaken || false}
                                    onChange={(e) => toggleAdherence(med.id, '2026-07-30', e.target.checked)}
                                    style={{ width:'20px', height:'20px', accentColor:'var(--accent-patient)' }}
                                  />
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">🚨 Drug Interaction Checker</div></div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                      {patientMeds.filter(m => m.severity === 'High' || m.severity === 'Moderate').length === 0 ? (
                        <div style={{ background:'rgba(0,212,170,0.05)', border:'1px solid var(--accent-patient)', borderRadius:'14px', padding:'16px', color:'var(--accent-patient)', fontSize:'13px' }}>
                          ✅ All active drugs check out. No critical interactions found.
                        </div>
                      ) : (
                        patientMeds.filter(m => m.severity === 'High' || m.severity === 'Moderate').map(m => (
                          <div key={m.id} className={`alert-card ${m.severity==='High'?'danger':'warn'}`} style={{ margin:0 }}>
                            <span style={{ fontSize:'24px' }}>⚠️</span>
                            <div>
                              <div style={{ fontWeight:'700' }}>Interaction Flagged: {m.name}</div>
                              <div style={{ fontSize:'12px', marginTop:'2px' }}>{m.interaction}</div>
                              <div style={{ fontSize:'10px', marginTop:'4px', textTransform:'uppercase', color: m.severity==='High'?'#ff5566':'#ffb347', fontWeight:'800' }}>Severity: {m.severity}</div>
                            </div>
                          </div>
                        ))
                      )}
                      
                      <div style={{ borderTop:'1px solid var(--border)', paddingTop:'15px', marginTop:'10px' }}>
                        <div style={{ fontWeight:'700', fontSize:'14px', marginBottom:'8px' }}>Adherence Insight</div>
                        <div style={{ fontSize:'12px', color:'var(--muted)', lineHeight:'1.5' }}>
                          If more than **2 consecutive doses** of critical hypertension medicines (Amlodipine) are missed, the system will automatically dispatch an alert to **Dr. Sharma**'s copilot clinical queue.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add Med Modal */}
                {showAddMedModal && (
                  <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(5px)' }}>
                    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'20px', padding:'24px', width:'90%', maxWidth:'400px' }}>
                      <h3 style={{ fontFamily:'var(--font-head)', fontSize:'18px', marginBottom:'16px' }}>💊 Prescribe/Add Medicine</h3>
                      <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                        <div>
                          <label style={{ fontSize:'11px', color:'var(--muted)' }}>Medicine Name</label>
                          <input type="text" className="note-input" style={{ margin:0 }} value={newMedForm.name} onChange={e => setNewMedForm({...newMedForm, name: e.target.value})} placeholder="e.g. Amlodipine 5mg" />
                        </div>
                        <div>
                          <label style={{ fontSize:'11px', color:'var(--muted)' }}>Dosage</label>
                          <input type="text" className="note-input" style={{ margin:0 }} value={newMedForm.dosage} onChange={e => setNewMedForm({...newMedForm, dosage: e.target.value})} placeholder="e.g. 1 tablet" />
                        </div>
                        <div>
                          <label style={{ fontSize:'11px', color:'var(--muted)' }}>Frequency</label>
                          <input type="text" className="note-input" style={{ margin:0 }} value={newMedForm.frequency} onChange={e => setNewMedForm({...newMedForm, frequency: e.target.value})} placeholder="e.g. After breakfast" />
                        </div>
                        <div>
                          <label style={{ fontSize:'11px', color:'var(--muted)' }}>Instructions</label>
                          <input type="text" className="note-input" style={{ margin:0 }} value={newMedForm.instructions} onChange={e => setNewMedForm({...newMedForm, instructions: e.target.value})} placeholder="e.g. Avoid grapefruit juice" />
                        </div>
                        <div style={{ display:'flex', gap:'8px', marginTop:'10px' }}>
                          <button className="panel-action" style={{ flex:1 }} onClick={addMed}>Save Medicine</button>
                          <button className="panel-action secondary" onClick={() => setShowAddMedModal(false)}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Prescription Scanner */}
            {patientActiveView === 'prescription-scanner' && (
              <div className="view active">
                <div className="dash-header">
                  <h2>📸 AI Prescription Scanner</h2>
                  <p>Upload a doctor's hand-written prescription or print to extract schedules automatically</p>
                </div>

                <div className="grid-2">
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">📤 Upload Prescription Scan</div></div>
                    <div style={{ border:'2px dashed var(--border)', background:'rgba(255,255,255,0.01)', borderRadius:'16px', padding:'40px 20px', textAlign:'center', cursor:'pointer' }} onClick={() => document.getElementById('rx-scan-input').click()}>
                      <div style={{ fontSize:'48px', marginBottom:'12px' }}>📸</div>
                      <div style={{ fontWeight:'700', fontSize:'14px' }}>Upload photo or scan</div>
                      <div style={{ fontSize:'11px', color:'var(--muted)', marginTop:'4px' }}>Supports JPG, PNG, PDF</div>
                      <input 
                        type="file" 
                        id="rx-scan-input" 
                        style={{ display:'none' }} 
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            setPrescriptionScannerFile(e.target.files[0]);
                            ocrPrescriptionScan(e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                    {prescriptionScannerFile && (
                      <div style={{ marginTop:'15px', background:'rgba(255,255,255,0.02)', padding:'10px 15px', borderRadius:'10px', border:'1px solid var(--border)', display:'flex', justifyContent:'between', alignItems:'center' }}>
                        <span style={{ fontSize:'12px', fontFamily:'var(--font-mono)' }}>📎 {prescriptionScannerFile.name}</span>
                        <button className="tiny-btn danger" onClick={() => { setPrescriptionScannerFile(null); setScannerResult(null); }}>Remove</button>
                      </div>
                    )}
                  </div>

                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">🤖 AI Extraction Preview</div></div>
                    {scanningPrescription ? (
                      <div style={{ padding:'20px', textAlign:'center' }}>
                        <div style={{ width:'30px', height:'30px', border:'3px solid rgba(255,255,255,0.1)', borderTop:'3px solid var(--accent-patient)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 15px' }}></div>
                        <p style={{ color:'var(--muted)', fontSize:'13px' }}>AI OCR extracting dosage info & medicine names...</p>
                      </div>
                    ) : !scannerResult ? (
                      <div style={{ textAlign:'center', color:'var(--muted)', padding:'30px' }}>
                        Upload a file on the left to run simulated AI text scanning.
                      </div>
                    ) : (
                      <div>
                        <div style={{ borderBottom:'1px solid var(--border)', paddingBottom:'10px', marginBottom:'15px' }}>
                          <span style={{ fontSize:'11px', color:'var(--muted)' }}>EXTRACTED CLINICIAN:</span>
                          <div style={{ fontWeight:'700', fontSize:'15px', color:'var(--accent-patient)' }}>{scannerResult.doctor}</div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                          {scannerResult.medicines.map((m, idx) => (
                            <div key={idx} style={{ background:'var(--surface)', padding:'10px 14px', borderRadius:'10px', border:'1px solid var(--border)' }}>
                              <div style={{ fontWeight:'700', fontSize:'13px' }}>{m.name}</div>
                              <div style={{ fontSize:'11px', color:'var(--muted)', marginTop:'2px' }}>Dosage: {m.dosage} | Frequency: {m.frequency} | Duration: {m.duration}</div>
                            </div>
                          ))}
                        </div>
                        <button className="panel-action" style={{ width:'100%', marginTop:'20px' }} onClick={saveOcrMedicines}>
                          💾 Confirm & Save to Health Records
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mental Health Assessment */}
            {patientActiveView === 'mental' && (
              <div className="view active">
                <div className="dash-header">
                  <h2>🧘 Mental Wellness Center</h2>
                  <p>Calm space weekly assessment & diagnostic support logs</p>
                </div>

                <div className="grid-2">
                  <div className="panel" style={{ background:'linear-gradient(135deg, #132420, #0f1614)', border:'1.5px solid rgba(0, 212, 170, 0.15)' }}>
                    <div className="panel-header"><div className="panel-title" style={{ color:'var(--accent-patient)' }}>🧘 Weekly Questionnaire Assessment</div></div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginTop:'10px' }}>
                      <div>
                        <label style={{ display:'block', fontSize:'12px', color:'var(--text)', marginBottom:'6px' }}>Stress Level (1-10): {mentalSurvey.stress}</label>
                        <input type="range" min="1" max="10" value={mentalSurvey.stress} onChange={e => setMentalSurvey({...mentalSurvey, stress: Number(e.target.value)})} style={{ width:'100%', accentColor:'var(--accent-patient)' }} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:'12px', color:'var(--text)', marginBottom:'6px' }}>Anxiety (1-10): {mentalSurvey.anxiety}</label>
                        <input type="range" min="1" max="10" value={mentalSurvey.anxiety} onChange={e => setMentalSurvey({...mentalSurvey, anxiety: Number(e.target.value)})} style={{ width:'100%', accentColor:'var(--accent-patient)' }} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:'12px', color:'var(--text)', marginBottom:'6px' }}>Burnout (1-10): {mentalSurvey.burnout}</label>
                        <input type="range" min="1" max="10" value={mentalSurvey.burnout} onChange={e => setMentalSurvey({...mentalSurvey, burnout: Number(e.target.value)})} style={{ width:'100%', accentColor:'var(--accent-patient)' }} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:'12px', color:'var(--text)', marginBottom:'6px' }}>Sleep Quality (Hours): {mentalSurvey.sleep}</label>
                        <input type="range" min="1" max="12" value={mentalSurvey.sleep} onChange={e => setMentalSurvey({...mentalSurvey, sleep: Number(e.target.value)})} style={{ width:'100%', accentColor:'var(--accent-patient)' }} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontSize:'12px', color:'var(--text)', marginBottom:'6px' }}>Overall Mood</label>
                        <div style={{ display:'flex', gap:'8px' }}>
                          {['Good','Neutral','Stressed'].map(m => (
                            <button 
                              key={m} 
                              onClick={() => setMentalSurvey({...mentalSurvey, mood: m})}
                              style={{ flex:1, padding:'8px', borderRadius:'10px', border:'1px solid var(--border)', background: mentalSurvey.mood===m ? 'var(--accent-patient)':'transparent', color: mentalSurvey.mood===m ? '#000':'var(--text)', cursor:'pointer', fontSize:'12px', fontWeight:'700' }}
                            >
                              {m === 'Good' ? '😊 Good' : m === 'Neutral' ? '😐 Neutral' : '😫 Stressed'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button className="panel-action" style={{ width:'100%', marginTop:'10px', background:'var(--accent-patient)', color:'#000' }} onClick={saveMentalSurvey}>
                        🧘 Submit Weekly Survey
                      </button>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">📈 Mental Wellness Log & Suggestions</div></div>
                    {mentalLogs.length === 0 ? <p style={{ color:'var(--muted)' }}>No logs submitted yet.</p> : (
                      <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                        {/* Latest score gauge */}
                        <div style={{ background:'rgba(255,255,255,0.01)', padding:'15px', borderRadius:'14px', border:'1px solid var(--border)', textAlign:'center' }}>
                          <span style={{ fontSize:'11px', color:'var(--muted)', textTransform:'uppercase' }}>Latest Wellness Index Score</span>
                          <div style={{ fontSize:'36px', fontWeight:'800', color: mentalLogs[mentalLogs.length-1].score < 60 ? 'var(--danger)' : 'var(--accent-patient)', marginTop:'5px' }}>
                            {mentalLogs[mentalLogs.length-1].score} / 100
                          </div>
                          <div style={{ fontSize:'12px', color:'var(--text)', marginTop:'8px', lineHeight:'1.5' }}>
                            {mentalLogs[mentalLogs.length-1].suggestions}
                          </div>
                        </div>

                        <div style={{ overflowX:'auto' }}>
                          <table className="patient-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Score</th>
                                <th>Mood</th>
                                <th>Sleep</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mentalLogs.map((l, i) => (
                                <tr key={i}>
                                  <td>{l.date}</td>
                                  <td><strong style={{ color: l.score<65?'var(--warn)':'var(--accent-patient)' }}>{l.score}</strong></td>
                                  <td>{l.mood}</td>
                                  <td>{l.sleep} hrs</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Family Health Dashboard */}
            {patientActiveView === 'family' && (
              <div className="view active">
                <div className="dash-header">
                  <h2>👪 Family Health Center</h2>
                  <p>Manage health summaries, records, and alarms for family members from a single account</p>
                </div>

                <div className="panel">
                  <div className="panel-header"><div className="panel-title">👥 Family Member Profiles</div></div>
                  <div className="records-gallery" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))' }}>
                    {familyMembers.map(m => (
                      <div key={m.id} className="record-card" style={{ padding:'20px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
                          <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'var(--accent-nurse)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'800', fontSize:'14px' }}>
                            {m.relation.slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight:'700', fontSize:'15px' }}>{m.name}</div>
                            <div style={{ fontSize:'11px', color:'var(--accent-patient)' }}>{m.relation} · {m.age} yrs</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:'6px', fontSize:'12px', borderTop:'1px solid var(--border)', paddingTop:'10px' }}>
                          <div>🩸 Blood: <strong>{m.blood}</strong></div>
                          <div>⚠️ Allergies: <span style={{ color:'var(--danger)' }}>{m.allergies}</span></div>
                          <div>🛡️ Policy: <strong>{m.insurance}</strong></div>
                          <div style={{ color:'var(--muted)' }}>🩺 Chronic: {m.conditions.join(', ') || 'None'}</div>
                        </div>
                        <button 
                          className="tiny-btn" 
                          style={{ width:'100%', marginTop:'12px', background:'rgba(79,142,247,0.15)', color:'var(--accent-doctor)' }}
                          onClick={() => {
                            setSelectedFamilyMember(m);
                            setPatientActiveView('overview');
                            showToast(`👪 Switched profile to ${m.name}`);
                          }}
                        >
                          View Member Dashboard
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Verify Medicine Authenticity */}
            {patientActiveView === 'medicine-verify' && (
              <div className="view active">
                <div className="dash-header">
                  <h2>🛡️ Fake Medicine Verification</h2>
                  <p>Scan pharmaceutical codes to confirm authenticity against manufacturer batch logs</p>
                </div>

                <div className="grid-2">
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">🔍 Scan QR / Barcode</div></div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                      <div style={{ background:'rgba(255,255,255,0.02)', border:'2px dashed var(--border)', padding:'30px', borderRadius:'14px', textAlign:'center', position:'relative', overflow:'hidden' }}>
                        <div style={{ position:'absolute', top:'10px', left:'10px', background:'rgba(255,85,102,0.1)', border:'1px solid var(--danger)', padding:'2px 8px', borderRadius:'8px', fontSize:'9px', color:'var(--danger)', fontWeight:'800' }}>CAMERA SCANNER SIMULATOR</div>
                        <div style={{ fontSize:'48px', marginBottom:'10px' }}>🔲</div>
                        <div style={{ width:'80%', height:'4px', background:'red', margin:'0 auto 10px', borderRadius:'2px', animation:'pulse 1s infinite' }}></div>
                        <span style={{ fontSize:'12px', color:'var(--muted)' }}>Position medicine barcode inside camera frame</span>
                      </div>
                      
                      <div className="field">
                        <label>Barcode / GTIN Number</label>
                        <div style={{ display:'flex', gap:'8px' }}>
                          <input 
                            type="text" 
                            className="note-input" 
                            style={{ margin:0 }} 
                            value={verifyingBarcode} 
                            onChange={e => setVerifyingBarcode(e.target.value)} 
                            placeholder="e.g. 8901234567890" 
                          />
                          <button className="panel-action" style={{ margin:0 }} onClick={() => verifyMedicine()}>Verify Code</button>
                        </div>
                      </div>

                      <div style={{ marginTop:'10px', fontSize:'11px', color:'var(--muted)' }}>
                        Sample barcode: `8901234567890` (GSK Crocin 650mg) or enter manufacturer batch code.
                      </div>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">📄 Verification Result</div></div>
                    {verifyingMed ? (
                      <p>Verifying with pharmaceutical log ledger...</p>
                    ) : !verificationResult ? (
                      <p style={{ color:'var(--muted)', textAlign:'center', padding:'30px' }}>No scanned results. Enter barcode to start.</p>
                    ) : (
                      <div style={{ background:'rgba(255,255,255,0.01)', border:`1px solid ${verificationResult.status==='Genuine'?'var(--accent-patient)':'var(--danger)'}`, borderRadius:'16px', padding:'20px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--border)', paddingBottom:'10px', marginBottom:'15px' }}>
                          <strong style={{ fontSize:'16px' }}>{verificationResult.name}</strong>
                          <span className={`badge ${verificationResult.status==='Genuine'?'success':verificationResult.status==='Suspicious'?'warn':'danger'}`}>
                            {verificationResult.status==='Genuine'?'✅ Genuine':'❌ '+verificationResult.status}
                          </span>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:'8px', fontSize:'13px' }}>
                          <div>🏭 Manufacturer: <strong>{verificationResult.manufacturer}</strong></div>
                          <div>📦 Batch Number: <code>{verificationResult.batch}</code></div>
                          <div>📅 MFG Date: {verificationResult.mfgDate}</div>
                          <div>📅 EXP Date: <strong style={{ color:'var(--warn)' }}>{verificationResult.expDate}</strong></div>
                          <div style={{ fontSize:'10px', color:'var(--muted)', marginTop:'10px', fontFamily:'var(--font-mono)' }}>Verified timestamp: {new Date(verificationResult.verifiedAt).toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="panel" style={{ marginTop:'20px' }}>
                  <div className="panel-header"><div className="panel-title">📋 Verification History Log</div></div>
                  <div style={{ overflowX:'auto' }}>
                    <table className="patient-table">
                      <thead>
                        <tr>
                          <th>Barcode</th>
                          <th>Medicine</th>
                          <th>Manufacturer</th>
                          <th>Status</th>
                          <th>Verified At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verifiedMedsList.map((h, i) => (
                          <tr key={i}>
                            <td><code>{h.barcode}</code></td>
                            <td>{h.name}</td>
                            <td>{h.manufacturer}</td>
                            <td><span className={`badge ${h.status==='Genuine'?'success':'danger'}`}>{h.status}</span></td>
                            <td>{new Date(h.verifiedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
        <PatientMobileSosModal
          isOpen={showPatientSosModal}
          onClose={() => setShowPatientSosModal(false)}
          activeIncident={activeIncident}
          onTriggerSOS={handleTriggerSOS}
          loading={emergencyLoading}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // RENDER: DOCTOR DASHBOARD
  // ═══════════════════════════════════════════════════════
  if (currentPage === 'doctor') {
    return (
      <div className="page dashboard-page active">
        <ToastNotification />
        <NotifDrawer />
        <RecordUploadModal />
        <nav className="topnav">
          <div className="topnav-logo">🏥 MediCore</div>
          <span className="role-badge doctor">{t('doctorPortal')}</span>
          <div className="nav-user" style={{ marginLeft:'auto' }}>
            <div className="nav-avatar doctor">KS</div>
            <span className="nav-name">Dr. Kavitha Sharma</span>
          </div>
          <ConnectionPulse />
          <div className="lang-toggle">
            <span className={`lang-mini ${language==='en'?'active':''}`} onClick={() => setLanguage('en')}>EN</span>
            <span className={`lang-mini ${language==='hi'?'active':''}`} onClick={() => setLanguage('hi')}>हिं</span>
          </div>

          {/* AI Copilot Slideout Trigger Button */}
          <button 
            onClick={() => setShowCopilotPanel(!showCopilotPanel)}
            style={{ display:'flex', alignItems:'center', gap:'8px', background:'linear-gradient(135deg,#ff5566,var(--accent-nurse))', border:'none', color:'#fff', padding:'8px 16px', borderRadius:'14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', animation:'pulse 1.8s infinite', marginRight:'10px' }}
          >
            🤖 AI Clinical Assistant
          </button>

          <button className="notif-bell" onClick={() => { setNotifOpen(true); setUnreadCount(0); }}>
            🔔{unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
          <button className="logout-btn" onClick={logout}>{t('logout')}</button>
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
              { id: 'appointments', icon: '🗓️', label: 'Requests' },
              { id: 'iris-scan', icon: '👁️', label: 'Iris Scan' },
              { id: 'iris-enroll', icon: '📸', label: 'Enroll Iris' },
              { id: 'predictive', icon: '🧠', label: 'Predictive Analytics' },
              { id: 'fraud', icon: '⚖️', label: 'Fraud Detection' },
              { id: 'emergency', icon: '🚨', label: 'Emergency SOS' },
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
          <main className="main-content" id="doctor-main" style={{ position:'relative', display:'flex', flex:1, padding:0 }}>
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'auto', padding:'28px' }}>
            {/* Smart Hospital Control Center Overview */}
            {doctorActiveView === 'overview' && (
              <div className="view active">
                <div className="dash-header">
                  <h2>Good Morning, Dr. Sharma 🩺</h2>
                  <p>Smart Hospital Control Center — Ward 3B & ER Emergency Operations</p>
                </div>

                {/* Resource Counters Grid */}
                <div className="stat-grid" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', marginBottom:'24px' }}>
                  <div className="stat-card blue" style={{ background:'linear-gradient(135deg, #1e3c72, #2a5298)' }}>
                    <div className="stat-icon">🛏️</div>
                    <div className="stat-val">{hospitalBeds.available} / {hospitalBeds.total}</div>
                    <div className="stat-label">Beds Available</div>
                    <div style={{ fontSize:'10px', opacity:0.8, marginTop:'4px' }}>ICU: {hospitalBeds.icu} | Vent: {hospitalBeds.ventilators}</div>
                  </div>
                  <div className="stat-card teal">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-val">{averageWaitTime}</div>
                    <div className="stat-label">Avg. ER Waiting Time</div>
                    <div style={{ fontSize:'10px', opacity:0.8, marginTop:'4px' }}>Queue length: {waitingQueue} cases</div>
                  </div>
                  <div className="stat-card warn">
                    <div className="stat-icon">🚨</div>
                    <div className="stat-val">1 Active</div>
                    <div className="stat-label">Emergency SOS Requests</div>
                    <div style={{ fontSize:'10px', opacity:0.8, marginTop:'4px' }}>1 Ambulance in transit</div>
                  </div>
                  <div className="stat-card pink">
                    <div className="stat-icon">👩‍⚕️</div>
                    <div className="stat-val">{hospitalStaff.doctors} Docs / {hospitalStaff.nurses} Nurses</div>
                    <div className="stat-label">On-duty Shift Staff</div>
                    <div style={{ fontSize:'10px', opacity:0.8, marginTop:'4px' }}>Shift overlap active</div>
                  </div>
                </div>

                <div className="grid-2">
                  {/* Real-time Map Simulator */}
                  <div className="panel" style={{ height:'400px', display:'flex', flexDirection:'column' }}>
                    <div className="panel-header">
                      <div className="panel-title">🗺️ Real-Time Ambulance & ER Ward Map</div>
                      <span className="pulse-dot green"></span>
                    </div>
                    <div style={{ flex:1, position:'relative', background:'#0a0d14', borderRadius:'14px', border:'1px solid var(--border)', overflow:'hidden', marginTop:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {/* Grid representation of Chennai/Bangalore map */}
                      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize:'20px 20px' }}></div>
                      
                      {/* Hospital Marker */}
                      <div style={{ position:'absolute', top:'45%', left:'50%', transform:'translate(-50%, -50%)', display:'flex', flexDirection:'column', alignItems:'center', zIndex:10 }}>
                        <div style={{ fontSize:'24px', animation:'bounce 2s infinite' }}>🏥</div>
                        <span style={{ fontSize:'9px', background:'rgba(0,0,0,0.8)', padding:'2px 6px', borderRadius:'6px', border:'1px solid var(--accent-doctor)', fontWeight:'700', color:'#fff', whiteSpace:'nowrap' }}>APOLLO WARD 3B</span>
                      </div>

                      {/* Ambulance Marker */}
                      <div style={{ position:'absolute', top:'65%', left:'42%', display:'flex', flexDirection:'column', alignItems:'center', zIndex:10 }}>
                        <div style={{ fontSize:'20px', animation:'pulse 1.2s infinite' }}>🚑</div>
                        <span style={{ fontSize:'9px', background:'rgba(255,85,102,0.9)', padding:'2px 6px', borderRadius:'6px', color:'#fff', fontWeight:'700', whiteSpace:'nowrap' }}>AMB-04 (ETA 3m)</span>
                      </div>

                      {/* Compass widget */}
                      <div style={{ position:'absolute', bottom:'10px', right:'10px', width:'40px', height:'40px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', color:'var(--muted)' }}>N</div>
                      <span style={{ fontSize:'12px', color:'var(--muted)' }}>GPS Map Tracking active (Chennai Suburban Sector)</span>
                    </div>
                  </div>

                  {/* ICU & ER Live alerts list */}
                  <div className="panel" style={{ height:'400px', display:'flex', flexDirection:'column', overflow:'hidden' }}>
                    <div className="panel-header"><div className="panel-title">🤖 AI Assistant Patient Alerts</div></div>
                    <div style={{ overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:'10px', marginTop:'10px' }}>
                      <div className="alert-card danger" style={{ margin:0 }}>
                        <span className="alert-icon">🚨 <span className="pulse-dot"></span></span>
                        <div className="alert-body">
                          <strong>Biometrics Spike — Bed 12</strong>
                          <span>Ravi Patel: Sudden BP rise (142/92) and sugar spike. Immediate consult suggested.</span>
                        </div>
                        <span className="alert-time">Now</span>
                      </div>
                      <div className="alert-card warn" style={{ margin:0 }}>
                        <span className="alert-icon">⚠️</span>
                        <div className="alert-body">
                          <strong>Adherence Alarm — Missed Dose</strong>
                          <span>Bed 7 Priya Menon: 2 consecutive missed doses of Amlodipine.</span>
                        </div>
                        <span className="alert-time">08:30 AM</span>
                      </div>
                      <div className="alert-card info" style={{ margin:0 }}>
                        <span className="alert-icon">📋</span>
                        <div className="alert-body">
                          <strong>Lab Analysis Ready</strong>
                          <span>Suresh Kumar: Lipid profile results parsed by Doctor Copilot.</span>
                        </div>
                        <span className="alert-time">07:45 AM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Patient List */}
            {doctorActiveView === 'patients' && (
              <div className="view">
                <div className="dash-header"><h2>👥 Patient List</h2><p>Your assigned patients</p></div>
                
                {/* Add Patient Form */}
                <div className="panel" style={{ marginBottom: '20px', background: 'var(--surface)' }}>
                  <div className="panel-header"><div className="panel-title">➕ Add New Patient</div></div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <input type="text" placeholder="Patient Name" value={addPatientForm.name} onChange={e => setAddPatientForm({...addPatientForm, name: e.target.value})} style={{ flex: 1, minWidth: '150px', background: 'var(--bg)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)' }} />
                    <input type="number" placeholder="Age" value={addPatientForm.age} onChange={e => setAddPatientForm({...addPatientForm, age: e.target.value})} style={{ width: '80px', background: 'var(--bg)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)' }} />
                    <input type="text" placeholder="Diagnosis" value={addPatientForm.diagnosis} onChange={e => setAddPatientForm({...addPatientForm, diagnosis: e.target.value})} style={{ flex: 2, minWidth: '200px', background: 'var(--bg)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)' }} />
                    <select value={addPatientForm.condition} onChange={e => setAddPatientForm({...addPatientForm, condition: e.target.value})} style={{ width: '120px', background: 'var(--bg)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', color: 'var(--text)' }}>
                      <option>Stable</option>
                      <option>Moderate</option>
                      <option>Critical</option>
                    </select>
                    <button onClick={addNewPatient} style={{ background: 'linear-gradient(135deg, var(--accent-doctor), #7ab3ff)', border: 'none', borderRadius: '8px', padding: '10px 20px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>✓ Admit</button>
                  </div>
                </div>

                <div className="panel">
                  <div className="search-bar"><span>🔍</span><input type="text" placeholder="Search patients by name, ID, diagnosis..." /></div>
                  <table className="patient-table">
                    <thead>
                      <tr><th>Patient</th><th>Age</th><th>Diagnosis</th><th>Condition</th><th>Room</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
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
                    {/* Newly added patients */}
                    {addPatientList.map((patient) => (
                      <tr key={patient.id} style={{ background: 'rgba(79,142,247,0.04)' }}>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span className="patient-avatar" style={{ background: 'rgba(79,142,247,0.2)', color: 'var(--accent-doctor)', fontSize: '14px', fontWeight: '700' }}>{patient.avatar}</span><div><div style={{ fontWeight: '700', color: 'var(--text)' }}>{patient.name}</div><div style={{ fontSize: '11px', color: 'var(--accent-doctor)' }}>NEW ADMIT</div></div></div></td>
                        <td>{patient.age}</td>
                        <td>{patient.diagnosis}</td>
                        <td><span className={`badge ${patient.condition === 'Critical' ? 'critical' : patient.condition === 'Moderate' ? 'moderate' : 'stable'}`}>{patient.condition}</span></td>
                        <td>{patient.room}</td>
                        <td><div className="action-btns"><button className="tiny-btn">View</button><button className="tiny-btn">Rx</button></div></td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Attendance */}
            {doctorActiveView === 'attendance' && (
              <div className="view">
                <div className="dash-header"><h2>✅ Patient Attendance</h2><p>Daily rounds & OP visit tracking</p></div>
                <div className="panel">
                  <div className="panel-header"><div className="panel-title">📋 Today — 4 April 2026</div><button className="panel-action" onClick={() => showToast('Attendance saved!')}>Save All</button></div>
                  <table className="patient-table">
                    <thead>
                      <tr><th>Patient</th><th>Room</th><th>Mark Status</th><th>Current</th></tr>
                    </thead>
                    <tbody>
                    {doctorPatients.map((patient) => (
                      <tr key={patient.id}>
                        <td><span className="patient-avatar">{patient.avatar}</span>{patient.name}</td>
                        <td>{patient.room}</td>
                        <td><div className="action-btns">
                          <button className="tiny-btn success" onClick={() => updateDoctorAttendance(patient.id, 'present')}>✓ Present</button>
                          <button className="tiny-btn danger" onClick={() => updateDoctorAttendance(patient.id, 'absent')}>✗ Absent</button>
                          <button className="tiny-btn" style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }} onClick={() => updateDoctorAttendance(patient.id, 'emergency')}>🚨 Emg</button>
                        </div></td>
                        <td id={`att-${patient.id}`}><span className={`badge ${doctorAttendance[patient.id] === 'present' ? 'present' : doctorAttendance[patient.id] === 'emergency' ? 'emergency' : 'absent'}`}>{(doctorAttendance[patient.id] || 'absent').charAt(0).toUpperCase() + (doctorAttendance[patient.id] || 'absent').slice(1)}</span></td>
                      </tr>
                    ))}
                    </tbody>
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
                    {diagSaved && (
                      <div style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)', padding: '10px', borderRadius: '8px', marginBottom: '10px', color: 'var(--accent-patient)', fontSize: '13px' }}>
                        ✓ Diagnosis successfully saved!
                      </div>
                    )}
                    <div className="field"><label>Patient</label>
                      <select value={diagnosisForm.patient} onChange={e => setDiagnosisForm({...diagnosisForm, patient: e.target.value})} style={{ width: '100%', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '12px 16px', color: 'var(--text)', fontSize: '14px', outline: 'none' }}>
                        <option value="">— Select Patient —</option>
                        {[...doctorPatients, ...addPatientList].map(p => <option key={p.id} value={p.name}>{p.name} — {p.room}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Diagnosis</label>
                      <input type="text" placeholder="e.g. Hypertension Stage 2" value={diagnosisForm.diagnosis} onChange={e => setDiagnosisForm({...diagnosisForm, diagnosis: e.target.value})} style={{ width: '100%', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '12px 16px', color: 'var(--text)' }} />
                    </div>
                    <div className="field">
                      <label>Notes</label>
                      <textarea className="note-input" placeholder="Clinical observations, treatment plan..." value={diagnosisForm.notes} onChange={e => setDiagnosisForm({...diagnosisForm, notes: e.target.value})} style={{ width: '100%', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '12px 16px', color: 'var(--text)', resize: 'vertical' }}></textarea>
                    </div>
                    <button className="panel-action" style={{ width: '100%', padding: '12px', marginTop: '8px', fontSize: '14px', fontWeight: 'bold' }} onClick={saveDiagnosis}>💾 Save Record</button>
                  </div>
                  <div className="panel" style={{ overflowY: 'auto' }}>
                    <div className="panel-header"><div className="panel-title">📋 Recent Diagnoses</div></div>
                    
                    {savedDiagnoses.map((note, idx) => (
                      <div key={'s'+idx} className="note-card" style={{ borderLeft: '3px solid var(--accent-doctor)', background: 'rgba(79,142,247,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold' }}>{note.patient}</span>
                          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{note.date}</span>
                        </div>
                        <p style={{ margin: '5px 0', fontSize: '13px', fontWeight: '600' }}>{note.diagnosis}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>{note.notes}</p>
                      </div>
                    ))}
                    
                    {doctorNotes.map((note, idx) => (
                      <div key={idx} className="note-card">
                        <p>Patient diagnosed with <strong>{note.note.split('diagnosed with')[1]?.split('.')[0] || note.note.split('.')[0]}</strong>. {note.note.split('.')[1] || ''}</p>
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
                  <div className="panel-header"><div className="panel-title">🖊️ New Prescription</div><button className="panel-action" onClick={() => showToast('Prescription saved & synced to Nurse portal!')}>Save & Sync →</button></div>
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

            {/* Appointment Management — Doctor Side */}
            {doctorActiveView === 'appointments' && (
              <DoctorAppointments 
                appointments={appointments}
                updateAppointment={updateAppointment}
              />
            )}

            {/* Iris Scan (Demo) View — Doctor Side */}
            {doctorActiveView === 'iris-scan' && (
              <div className="view">
                <div className="dash-header"><h2>👁️ Biometric Iris Scanner</h2><p>Biometric patient identification and immediate record retrieval</p></div>
                <div style={{ display:'flex', justifyContent:'center', marginTop:'20px' }}>
                  <IrisScanModule mode="scan" onStaffLogin={() => {}} />
                </div>
              </div>
            )}

            {/* Enroll Patient Iris View — Doctor Side */}
            {doctorActiveView === 'iris-enroll' && (
              <div className="view">
                <div className="dash-header"><h2>📸 Enroll Patient Iris</h2><p>Register new patient biometric iris data</p></div>
                <div style={{ display:'flex', justifyContent:'center', marginTop:'20px' }}>
                  <IrisScanModule mode="enroll" onStaffLogin={() => {}} />
                </div>
              </div>
            )}


            {/* Smart Emergency Mode Workspace */}
            {doctorActiveView === 'emergency' && (
              <div className="view active">
                <div className="dash-header">
                  <h2>🚨 Smart Emergency SOS Center</h2>
                  <p>Real-time ambulance dispatch tracker, event timelines, and medical record sharing</p>
                </div>

                <div className="grid-2">
                  <div className="panel" style={{ border:'1.5px solid var(--danger)', background:'rgba(255, 85, 102, 0.02)' }}>
                    <div className="panel-header">
                      <div className="panel-title" style={{ color:'var(--danger)' }}>🔴 Live Emergency Request</div>
                      <span className="badge critical" style={{ animation:'pulse 1.2s infinite' }}>SOS Active</span>
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginTop:'10px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid var(--border)', paddingBottom:'10px' }}>
                        <div>
                          <strong style={{ fontSize:'16px' }}>Ravi Patel</strong>
                          <div style={{ fontSize:'11px', color:'var(--muted)', marginTop:'2px' }}>Aadhaar: 1234-5678-9012 · Age: 45</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <span style={{ fontSize:'12px', color:'var(--muted)' }}>Type:</span>
                          <div style={{ fontWeight:'700', color:'var(--danger)' }}>Medical / Chest Pain</div>
                        </div>
                      </div>

                      {/* GPS & ETA */}
                      <div className="grid-2" style={{ gap:'10px' }}>
                        <div style={{ background:'rgba(255,255,255,0.02)', padding:'10px', borderRadius:'10px', border:'1px solid var(--border)' }}>
                          <span style={{ fontSize:'10px', color:'var(--muted)' }}>GPS COORDINATES</span>
                          <div style={{ fontSize:'12px', fontWeight:'700', marginTop:'2px', fontFamily:'var(--font-mono)' }}>12.9716° N, 77.5946° E</div>
                        </div>
                        <div style={{ background:'rgba(255,255,255,0.02)', padding:'10px', borderRadius:'10px', border:'1px solid var(--border)' }}>
                          <span style={{ fontSize:'10px', color:'var(--muted)' }}>ESTIMATED REACH TIME</span>
                          <div style={{ fontSize:'12px', fontWeight:'700', marginTop:'2px', color:'var(--warn)', fontFamily:'var(--font-mono)' }}>AMB-04 · 3 mins</div>
                        </div>
                      </div>

                      {/* AI Health Summary Shared */}
                      <div style={{ background:'linear-gradient(135deg, rgba(27,32,53,0.8), rgba(20,23,39,0.8))', border:'1px solid rgba(255,85,102,0.15)', borderRadius:'14px', padding:'15px' }}>
                        <div style={{ fontWeight:'700', fontSize:'12px', color:'var(--danger)', marginBottom:'8px', textTransform:'uppercase' }}>📋 Shared AI Emergency Summary</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 12px', fontSize:'11px' }}>
                          <div>Blood: <strong style={{ color:'var(--accent-patient)' }}>O+</strong></div>
                          <div>Allergies: <strong style={{ color:'#ff5566' }}>Sulfa Drugs, Pollen</strong></div>
                          <div>Meds: <strong>Metformin, Amlodipine</strong></div>
                          <div>Chronic: <strong>Hypertension, Diabetes</strong></div>
                          <div>Contact: <strong>Kiran Patel (98765 09212)</strong></div>
                        </div>
                      </div>

                      {/* Accept / Reject controls */}
                      <div style={{ display:'flex', gap:'10px', marginTop:'8px' }}>
                        <button 
                          className="panel-action" 
                          style={{ flex:1, margin:0, background:'var(--success)', color:'#000' }}
                          onClick={() => {
                            setSosStep(2); // In transit
                            showToast('🚑 Emergency Accepted. Dispatched Trauma Response Unit.');
                          }}
                        >
                          Accept & Dispatch
                        </button>
                        <button 
                          className="panel-action secondary" 
                          style={{ flex:1, margin:0 }}
                          onClick={() => {
                            showToast('⚠️ Alert rerouted to Max Healthcare.');
                          }}
                        >
                          Reroute Case
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">⏱️ SOS Status & Event Timeline</div></div>
                    
                    {/* Timeline */}
                    <div style={{ display:'flex', flexDirection:'column', gap:'15px', padding:'10px' }}>
                      <div style={{ display:'flex', gap:'15px' }}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                          <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:'var(--success)' }}></div>
                          <div style={{ width:'2px', height:'35px', background:'var(--border)' }}></div>
                        </div>
                        <div>
                          <div style={{ fontWeight:'700', fontSize:'13px', color:'var(--text)' }}>11:39 AM — Emergency Initiated</div>
                          <div style={{ fontSize:'11px', color:'var(--muted)' }}>Patient triggered SOS on mobile device. GPS verified.</div>
                        </div>
                      </div>

                      <div style={{ display:'flex', gap:'15px' }}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                          <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:'var(--success)' }}></div>
                          <div style={{ width:'2px', height:'35px', background:'var(--border)' }}></div>
                        </div>
                        <div>
                          <div style={{ fontWeight:'700', fontSize:'13px', color:'var(--text)' }}>11:40 AM — Ambulance Assigned</div>
                          <div style={{ fontSize:'11px', color:'var(--muted)' }}>AMB-04 dispatched under Rajesh Kumar (Driver).</div>
                        </div>
                      </div>

                      <div style={{ display:'flex', gap:'15px' }}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                          <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:'var(--warn)' }}></div>
                          <div style={{ width:'2px', height:'35px', background:'var(--border)' }}></div>
                        </div>
                        <div>
                          <div style={{ fontWeight:'700', fontSize:'13px', color:'var(--warn)' }}>11:42 AM — In Transit (Ambulance En Route)</div>
                          <div style={{ fontSize:'11px', color:'var(--muted)' }}>Ambulance coordinates updated to 12.9720 N, 77.5950 E.</div>
                        </div>
                      </div>

                      <div style={{ display:'flex', gap:'15px' }}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                          <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:'var(--border)' }}></div>
                        </div>
                        <div>
                          <div style={{ fontWeight:'700', fontSize:'13px', color:'var(--muted)' }}>Pending — Trauma Arrival</div>
                          <div style={{ fontSize:'11px', color:'var(--muted)' }}>Estimated reach to ER ward: 3 mins.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Predictive Healthcare Module */}
            {doctorActiveView === 'predictive' && (
              <div className="view active">
                <div className="dash-header">
                  <h2>🧠 Predictive Disease Analytics</h2>
                  <p>AI-driven model risk scoring and explanation support</p>
                </div>

                <div className="grid-2">
                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">✏️ Clinical Diagnostic Inputs</div></div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginTop:'10px' }}>
                      <div className="grid-2" style={{ gap:'10px' }}>
                        <div>
                          <label style={{ fontSize:'11px', color:'var(--muted)' }}>BP (systolic/diastolic)</label>
                          <input type="text" className="note-input" style={{ margin:0 }} value={predictiveInput.bp} onChange={e => setPredictiveInput({...predictiveInput, bp: e.target.value})} />
                        </div>
                        <div>
                          <label style={{ fontSize:'11px', color:'var(--muted)' }}>Fasting Glucose (mg/dL)</label>
                          <input type="number" className="note-input" style={{ margin:0 }} value={predictiveInput.sugar} onChange={e => setPredictiveInput({...predictiveInput, sugar: Number(e.target.value)})} />
                        </div>
                      </div>
                      <div className="grid-3" style={{ gap:'10px' }}>
                        <div>
                          <label style={{ fontSize:'11px', color:'var(--muted)' }}>BMI</label>
                          <input type="number" step="0.1" className="note-input" style={{ margin:0 }} value={predictiveInput.bmi} onChange={e => setPredictiveInput({...predictiveInput, bmi: Number(e.target.value)})} />
                        </div>
                        <div>
                          <label style={{ fontSize:'11px', color:'var(--muted)' }}>Heart Rate (bpm)</label>
                          <input type="number" className="note-input" style={{ margin:0 }} value={predictiveInput.hr} onChange={e => setPredictiveInput({...predictiveInput, hr: Number(e.target.value)})} />
                        </div>
                        <div>
                          <label style={{ fontSize:'11px', color:'var(--muted)' }}>Cholesterol</label>
                          <input type="number" className="note-input" style={{ margin:0 }} value={predictiveInput.cholesterol} onChange={e => setPredictiveInput({...predictiveInput, cholesterol: Number(e.target.value)})} />
                        </div>
                      </div>
                      <div className="grid-3" style={{ gap:'10px' }}>
                        <div>
                          <label style={{ fontSize:'11px', color:'var(--muted)' }}>Stress Level</label>
                          <select style={{ width:'100%', padding:'10px', border:'1px solid var(--border)', background:'var(--surface)', color:'#fff', borderRadius:'10px' }} value={predictiveInput.stress} onChange={e => setPredictiveInput({...predictiveInput, stress: e.target.value})}>
                            <option>Low</option><option>Medium</option><option>High</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize:'11px', color:'var(--muted)' }}>Smoking</label>
                          <select style={{ width:'100%', padding:'10px', border:'1px solid var(--border)', background:'var(--surface)', color:'#fff', borderRadius:'10px' }} value={predictiveInput.smoking ? 'true':'false'} onChange={e => setPredictiveInput({...predictiveInput, smoking: e.target.value === 'true'})}>
                            <option value="false">Non-smoker</option><option value="true">Active Smoker</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize:'11px', color:'var(--muted)' }}>Sleep (Hours)</label>
                          <input type="number" className="note-input" style={{ margin:0 }} value={predictiveInput.sleep} onChange={e => setPredictiveInput({...predictiveInput, sleep: Number(e.target.value)})} />
                        </div>
                      </div>
                      <button className="panel-action" style={{ width:'100%', marginTop:'10px' }} onClick={runPredictiveAnalysis}>
                        {predictiveLoading ? 'Running AI Engine...' : '🧠 Run Predictive ML Analytics'}
                      </button>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-header"><div className="panel-title">🎯 AI Risk Projections</div></div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'15px' }}>
                      
                      {/* Score card */}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.01)', border:'1px solid var(--border)', padding:'15px', borderRadius:'14px' }}>
                        <div>
                          <div style={{ fontSize:'11px', color:'var(--muted)', textTransform:'uppercase' }}>Overall Health Index</div>
                          <div style={{ fontSize:'32px', fontWeight:'800', color:'var(--accent-patient)', marginTop:'5px' }}>{predictiveResults.healthScore} / 100</div>
                        </div>
                        <div style={{ textTransform:'uppercase', fontWeight:'800', fontSize:'12px', color:'var(--warn)' }}>Risk: Moderate</div>
                      </div>

                      {/* Risks Grid */}
                      <div className="grid-2" style={{ gap:'10px' }}>
                        <div style={{ padding:'12px', background:'var(--surface)', border:'1.5px solid rgba(255, 85, 102, 0.25)', borderRadius:'12px', textAlign:'center' }}>
                          <span style={{ fontSize:'11px', color:'var(--muted)' }}>Diabetes Risk</span>
                          <div style={{ fontSize:'20px', fontWeight:'800', marginTop:'4px', color:'var(--danger)' }}>{predictiveResults.diabetesRisk}%</div>
                        </div>
                        <div style={{ padding:'12px', background:'var(--surface)', border:'1.5px solid rgba(255, 179, 71, 0.2)', borderRadius:'12px', textAlign:'center' }}>
                          <span style={{ fontSize:'11px', color:'var(--muted)' }}>Heart Disease</span>
                          <div style={{ fontSize:'20px', fontWeight:'800', marginTop:'4px', color:'var(--warn)' }}>{predictiveResults.heartRisk}%</div>
                        </div>
                        <div style={{ padding:'12px', background:'var(--surface)', border:'1.5px solid rgba(255, 179, 71, 0.2)', borderRadius:'12px', textAlign:'center' }}>
                          <span style={{ fontSize:'11px', color:'var(--muted)' }}>Hypertension</span>
                          <div style={{ fontSize:'20px', fontWeight:'800', marginTop:'4px', color:'var(--warn)' }}>{predictiveResults.hypertensionRisk}%</div>
                        </div>
                        <div style={{ padding:'12px', background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:'12px', textAlign:'center' }}>
                          <span style={{ fontSize:'11px', color:'var(--muted)' }}>Kidney Disease</span>
                          <div style={{ fontSize:'20px', fontWeight:'800', marginTop:'4px', color:'var(--accent-patient)' }}>{predictiveResults.kidneyRisk}%</div>
                        </div>
                      </div>

                      <div style={{ background:'rgba(79,142,247,0.03)', border:'1px solid rgba(79,142,247,0.2)', borderRadius:'14px', padding:'15px' }}>
                        <div style={{ fontWeight:'700', fontSize:'12px', color:'var(--accent-doctor)', marginBottom:'6px', textTransform:'uppercase' }}>🤖 AI Clinical Explanation</div>
                        <p style={{ fontSize:'12px', lineHeight:'1.5', color:'var(--text)' }}>{predictiveResults.aiExplanation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Claims Fraud Auditing */}
            {doctorActiveView === 'fraud' && (
              <div className="view active">
                <div className="dash-header">
                  <h2>⚖️ AI Claims Fraud Auditing</h2>
                  <p>Insurance double claims, fake diagnostics, and billing pattern anomalies</p>
                </div>

                <div className="panel">
                  <div className="panel-header"><div className="panel-title">🚨 Flagged Claims Ledger</div></div>
                  {claimsLoading ? <p>Loading claims log...</p> : (
                    <div style={{ overflowX:'auto' }}>
                      <table className="patient-table">
                        <thead>
                          <tr>
                            <th>Claim ID</th>
                            <th>Patient</th>
                            <th>Purpose</th>
                            <th>Amount</th>
                            <th>Score</th>
                            <th>Risk</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {flaggedClaims.map((c) => (
                            <tr key={c.id}>
                              <td><code>{c.claimId}</code></td>
                              <td>{c.patientName}</td>
                              <td>
                                <div style={{ fontWeight:'700' }}>{c.purpose}</div>
                                <div style={{ fontSize:'11px', color:'var(--muted)' }}>{c.reason}</div>
                              </td>
                              <td><strong>₹{c.amount}</strong></td>
                              <td><strong style={{ color: c.score>70?'var(--danger)':'var(--warn)' }}>{c.score}</strong></td>
                              <td><span className={`badge ${c.level==='Critical'||c.level==='High'?'danger':'warn'}`}>{c.level}</span></td>
                              <td>
                                <div className="action-btns">
                                  <button className="tiny-btn" onClick={() => takeClaimAction(c.id, 'Appr. Ledger')}>Verify</button>
                                  <button className="tiny-btn danger" onClick={() => takeClaimAction(c.id, 'Fraud Flagged')}>Flag</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>

            {/* AI Doctor Copilot: Side Panel (Clinical Assistant) */}
            {showCopilotPanel && (
              <aside style={{ width:'360px', background:'var(--card)', borderLeft:'1.5px solid var(--border)', display:'flex', flexDirection:'column', boxShadow:'-15px 0 40px rgba(0,0,0,0.3)', animation:'slideIn 0.3s' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ fontSize:'20px' }}>🤖</span>
                    <strong style={{ fontFamily:'var(--font-head)', fontSize:'15px' }}>AI Clinical Assistant</strong>
                  </div>
                  <button onClick={() => setShowCopilotPanel(false)} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:'16px' }}>✕</button>
                </div>

                <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:'18px', overflowY:'auto', flex:1 }}>
                  {/* Upload Drop area */}
                  <div 
                    onClick={() => document.getElementById('clinical-doc-input').click()}
                    style={{ border:'2px dashed var(--border)', background:'rgba(255,255,255,0.01)', borderRadius:'14px', padding:'24px', textAlign:'center', cursor:'pointer' }}
                  >
                    <div style={{ fontSize:'32px', marginBottom:'6px' }}>📤</div>
                    <div style={{ fontWeight:'700', fontSize:'12px' }}>Analyze Report PDF / Image</div>
                    <span style={{ fontSize:'10px', color:'var(--muted)' }}>Extract labs, scans, or Rx</span>
                    <input 
                      type="file" 
                      id="clinical-doc-input" 
                      style={{ display:'none' }}
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          clinicalCopilotAnalyze(e.target.files[0].name);
                        }
                      }}
                    />
                  </div>

                  {copilotLoading ? (
                    <div style={{ textAlign:'center', padding:'20px' }}>
                      <div style={{ width:'24px', height:'24px', border:'3px solid rgba(255,255,255,0.1)', borderTop:'3px solid var(--danger)', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 10px' }}></div>
                      <span style={{ fontSize:'12px', color:'var(--muted)' }}>Analyzing chemical values & parameters...</span>
                    </div>
                  ) : !copilotResults ? (
                    <div style={{ color:'var(--muted)', fontSize:'12px', textAlign:'center', marginTop:'20px' }}>
                      Select a patient lab report or scan on the left/upload a file to populate clinical copilot insights.
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                      
                      {/* Document analyzed badge */}
                      <div style={{ background:'rgba(255,255,255,0.02)', padding:'10px 14px', borderRadius:'10px', border:'1px solid var(--border)', fontSize:'11px', fontFamily:'var(--font-mono)' }}>
                        📄 Analyzed: {copilotDocName}
                      </div>

                      {/* Summary */}
                      <div>
                        <span style={{ fontSize:'10px', color:'var(--muted)', fontWeight:'700', textTransform:'uppercase' }}>Clinical Summary</span>
                        <div style={{ fontSize:'12px', lineHeight:'1.5', marginTop:'4px', color:'var(--text)' }}>
                          {copilotResults.summary}
                        </div>
                      </div>

                      {/* Abnormal parameters highlight */}
                      <div>
                        <span style={{ fontSize:'10px', color:'var(--muted)', fontWeight:'700', textTransform:'uppercase' }}>Abnormal Values (High Risk)</span>
                        <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginTop:'6px' }}>
                          {copilotResults.abnormalValues.map((v, i) => (
                            <div key={i} style={{ background:'rgba(255,85,102,0.08)', border:'1px solid rgba(255,85,102,0.2)', padding:'8px 12px', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                              <div>
                                <div style={{ fontSize:'12px', fontWeight:'700' }}>{v.parameter}</div>
                                <div style={{ fontSize:'10px', color:'var(--muted)' }}>Range: {v.range}</div>
                              </div>
                              <span style={{ fontSize:'12px', fontWeight:'800', color:'var(--danger)' }}>{v.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Suggested test */}
                      <div>
                        <span style={{ fontSize:'10px', color:'var(--muted)', fontWeight:'700', textTransform:'uppercase' }}>Suggested Follow-up Labs</span>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'6px' }}>
                          {copilotResults.recommendedTests.map((t, idx) => (
                            <span key={idx} className="badge present" style={{ fontSize:'10px' }}>{t}</span>
                          ))}
                        </div>
                      </div>

                      {/* Critical high-risk alert */}
                      <div>
                        <span style={{ fontSize:'10px', color:'var(--muted)', fontWeight:'700', textTransform:'uppercase' }}>High Risk Alerts</span>
                        <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginTop:'6px' }}>
                          {copilotResults.highRiskAlerts.map((a, idx) => (
                            <div key={idx} style={{ background:'rgba(255,179,71,0.08)', border:'1px solid rgba(255,179,71,0.2)', color:'var(--warn)', padding:'10px', borderRadius:'10px', fontSize:'11px', lineHeight:'1.5' }}>
                              ⚠️ {a}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </aside>
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
        <ToastNotification />
        <NotifDrawer />
        <nav className="topnav">
          <div className="topnav-logo">🏥 MediCore</div>
          <span className="role-badge nurse">{t('nursePortal')}</span>
          <div className="nav-user">
            <div className="nav-avatar nurse">SL</div>
            <span className="nav-name">Nurse Sunita Lal</span>
          </div>
          <ConnectionPulse />
          <div className="lang-toggle">
            <span className={`lang-mini ${language==='en'?'active':''}`} onClick={() => setLanguage('en')}>EN</span>
            <span className={`lang-mini ${language==='hi'?'active':''}`} onClick={() => setLanguage('hi')}>हिं</span>
          </div>
          <button className="notif-bell" onClick={() => { setNotifOpen(true); setUnreadCount(0); }}>
            🔔{unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
          <button className="logout-btn" onClick={logout}>{t('logout')}</button>
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
                    <thead>
                      <tr><th>Patient</th><th>Bed</th><th>Diagnosis</th><th>Last Vitals</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                    {doctorPatients.map((patient) => (
                      <tr key={patient.id}>
                        <td><span className="patient-avatar">{patient.avatar}</span>{patient.name}</td>
                        <td>{patient.room}</td>
                        <td>{patient.diagnosis}</td>
                        <td><span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>BP 130/85</span></td>
                        <td><span className={`badge ${patient.condition === 'Critical' ? 'critical' : patient.condition === 'Moderate' ? 'moderate' : 'stable'}`}>{patient.condition === 'Critical' ? 'Critical' : patient.condition === 'Moderate' ? 'Monitor' : 'Stable'}</span></td>
                      </tr>
                    ))}
                    </tbody>
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
