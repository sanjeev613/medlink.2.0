import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function App() {
  // Global State
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Patient Location State (Bangalore coordinates)
  const [patientLocation] = useState({ lat: 12.9716, lng: 77.5946, address: 'Bangalore, India' });
  
  // Login State
  const [loginData, setLoginData] = useState({ aadhaar: '', phone: '', otp: '', password: '', role: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [activeTab, setActiveTab] = useState('patient');
  
  // Ambulance & Hospital Tracking State
  const [nearestAmbulance, setNearestAmbulance] = useState(null);
  const [nearestHospital, setNearestHospital] = useState(null);
  const [bookedHospital, setBookedHospital] = useState(null);
  const [recordsSent, setRecordsSent] = useState(false);
  const [sendingRecords, setSendingRecords] = useState(false);
  const [ambulanceList] = useState([
    { id: 'A1', name: 'Ambulance Alpha', lat: 12.9720, lng: 77.5950, distance: 0.5, eta: '2 mins', status: 'Available', driver: 'Rajesh' },
    { id: 'A2', name: 'Ambulance Beta', lat: 12.9700, lng: 77.5920, distance: 1.2, eta: '5 mins', status: 'Available', driver: 'Priya' },
    { id: 'A3', name: 'Ambulance Gamma', lat: 12.9730, lng: 77.5970, distance: 1.8, eta: '7 mins', status: 'Busy', driver: 'Amit' },
  ]);
  const [hospitalList] = useState([
    { id: 'H1', name: 'Apollo Hospital', lat: 12.9715, lng: 77.5960, distance: 0.3, specialty: 'Multi-specialty', beds: 450, rating: 4.8, phone: '080-4000-0000' },
    { id: 'H2', name: 'Fortis Hospital', lat: 12.9750, lng: 77.5950, distance: 0.8, specialty: 'Multi-specialty', beds: 400, rating: 4.6, phone: '080-6611-1111' },
    { id: 'H3', name: 'Max Healthcare', lat: 12.9680, lng: 77.5920, distance: 1.5, specialty: 'Tertiary Care', beds: 380, rating: 4.7, phone: '080-4444-4444' },
  ]);
  const [emergencyActive, setEmergencyActive] = useState(false);
  
  // Initialize nearest ambulance and hospital on component mount
  useEffect(() => {
    // Calculate and set nearest ambulance (filter by available only)
    const available = ambulanceList.filter(a => a.status === 'Available');
    if (available.length > 0) {
      setNearestAmbulance(available[0]);
    }
    
    // Set nearest hospital
    if (hospitalList.length > 0) {
      setNearestHospital(hospitalList[0]);
    }
  }, []);
  
  const [uploadedRecords, setUploadedRecords] = useState([
    { type: 'Blood Test', date: 'Feb 20, 2024', icon: '🧪', file: 'blood_test.pdf' },
    { type: 'ECG Report', date: 'Feb 15, 2024', icon: '📊', file: 'ecg_report.pdf' },
    { type: 'X-Ray', date: 'Feb 10, 2024', icon: '🖼️', file: 'xray.pdf' },
  ]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileType, setUploadFileType] = useState('');
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [appliedInsurance, setAppliedInsurance] = useState(null);

  // Doctor Dashboard State
  const [doctorPatientList] = useState([
    { id: 'P1', name: 'Rajesh Kumar', age: 45, bloodGroup: 'O+', healthScore: 72, status: 'Moderate', attend: false },
    { id: 'P2', name: 'Priya Singh', age: 38, bloodGroup: 'B+', healthScore: 85, status: 'Good', attend: true },
    { id: 'P3', name: 'Amit Patel', age: 52, bloodGroup: 'AB-', healthScore: 58, status: 'Critical', attend: true },
  ]);
  const [doctorAttendance, setDoctorAttendance] = useState({ P1: false, P2: true, P3: true });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [emergencyAlerts] = useState([
    { id: 'E1', patient: 'Amit Patel', status: 'Critical', time: '2 mins ago', location: 'Ward B' },
  ]);

  // Nurse Dashboard State
  const [nurseMedicineList] = useState([
    { id: 'M1', patient: 'Rajesh Kumar', medicine: 'Metformin', dosage: '500mg', time: 'Morning', status: 'pending' },
    { id: 'M2', patient: 'Rajesh Kumar', medicine: 'Aspirin', dosage: '75mg', time: 'Night', status: 'given' },
    { id: 'M3', patient: 'Priya Singh', medicine: 'Paracetamol', dosage: '500mg', time: 'Afternoon', status: 'pending' },
  ]);
  const [medicineStatus, setMedicineStatus] = useState({ M1: 'pending', M2: 'given', M3: 'pending' });
  const [nurseNotes, setNurseNotes] = useState('');

  // Patient profile from database or default
  const patientProfile = currentUser ? {
    name: `${currentUser.firstName || ''} ${currentUser.lastName || 'User'}`.trim(),
    profilePic: '👨‍⚕️',
    bloodGroup: currentUser.bloodGroup || 'O+',
    healthScore: 72,
    healthStatus: 'Moderate Risk',
    nearestAmbulance: '5 mins away',
    assignedHospital: 'Apollo Hospital',
    walletBalance: currentUser.walletBalance || 5000,
    insurance: currentUser.insurancePolicy?.policyNumber ? `Policy: ${currentUser.insurancePolicy.policyNumber}` : 'Heart Care Insurance Plan',
  } : {
    name: 'Rajesh Kumar',
    profilePic: '👨‍⚕️',
    bloodGroup: 'O+',
    healthScore: 72,
    healthStatus: 'Moderate Risk',
    nearestAmbulance: '5 mins away',
    assignedHospital: 'Apollo Hospital',
    walletBalance: 5000,
    insurance: 'Heart Care Insurance Plan',
  };

  const aiHealthInsights = [
    {
      condition: 'Diabetes',
      risk: 'High',
      color: '#ef4444',
      icon: '🩺',
      reason: 'High blood glucose levels & BMI increase',
      amount: '₹2,50,000',
      hospital: 'Max Healthcare, Bengaluru',
      insurance: 'Diabetes Plus Plan',
    },
    {
      condition: 'Blood Pressure',
      risk: 'Medium',
      color: '#f59e0b',
      icon: '❤️',
      reason: 'Age & family history of hypertension',
      amount: '₹1,50,000',
      hospital: 'Fortis Hospital, Bengaluru',
      insurance: 'Heart Care Premium',
    },
    {
      condition: 'Cholesterol',
      risk: 'Low',
      color: '#10b981',
      icon: '💊',
      reason: 'Regular exercise & balanced diet',
      amount: '₹80,000',
      hospital: 'Apollo Hospital, Bengaluru',
      insurance: 'Wellness Plus',
    },
  ];

  const notifications = [
    { type: 'Appointment', message: 'Your appointment with Dr. Sharma on Mar 5', icon: '📅' },
    { type: 'Medicine', message: 'Take your BP medicine at 8 AM', icon: '💊' },
    { type: 'Alert', message: 'Weather alert: High temperature today', icon: '⚠️' },
  ];

  const recordTypes = [
    { label: 'Blood Test', icon: '🧪' },
    { label: 'ECG Report', icon: '📊' },
    { label: 'X-Ray', icon: '🖼️' },
    { label: 'Prescription', icon: '💊' },
    { label: 'Doctor Note', icon: '📝' },
    { label: 'Ultrasound', icon: '📡' },
  ];

  const insurancePlans = [
    {
      name: 'Diabetes Plus Plan',
      company: 'Max Bupa',
      coverage: '₹2,50,000',
      premium: '₹250/month',
      icon: '🩺',
      color: '#ef4444',
      terms: [
        'Coverage for diabetes management & treatment',
        'Annual health checkup included',
        'Pre-existing condition waiting period: 2 years',
        'Co-payment: 20% after deductible',
        'Emergency hospitalization: 100% covered',
        'Medicines: 75% covered up to ₹500/month',
      ],
      conditions: [
        'Age: 18-65 years',
        'Pre-medical checkup required',
        'No claims first year (except emergency)',
        'Renewal: Annual',
      ],
    },
    {
      name: 'Heart Care Premium',
      company: 'ICICI Lombard',
      coverage: '₹1,50,000',
      premium: '₹180/month',
      icon: '❤️',
      color: '#f59e0b',
      terms: [
        'Comprehensive heart disease coverage',
        'Network hospitals: 1000+ across India',
        'Cashless hospitalization available',
        'Pre-existing condition: 3 years waiting',
        'Emergency cover: 24/7',
        'Cardiac rehabilitation: 6 months covered',
      ],
      conditions: [
        'Age: 18-70 years',
        'Cardiac health screening required',
        'Premium varies by BP & cholesterol levels',
        'Annual increase: 2-3%',
      ],
    },
    {
      name: 'Wellness Plus',
      company: 'Apollo Munich',
      coverage: '₹80,000',
      premium: '₹120/month',
      icon: '💊',
      color: '#10b981',
      terms: [
        'Preventive health checkup: ₹10,000/year covered',
        'Wellness programs & fitness access',
        'Telemedicine consultations: Free',
        'Hospitalization: 90% covered',
        'Out-patient treatment: ₹500/consultation',
        'Maternity benefit: ₹50,000 included',
      ],
      conditions: [
        'Age: 18-60 years',
        'Family floater available',
        'Free health screening first year',
        'Claim settlement: 7-10 days',
      ],
    },
  ];

  // Authentication Functions
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!loginData.aadhaar || !loginData.phone) {
      setError('Aadhaar and phone number required');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarNumber: loginData.aadhaar, phoneNumber: loginData.phone })
      });
      const data = await response.json();
      if (response.ok) {
        setOtpSent(true);
        if (data.demo_otp) alert(`Demo OTP: ${data.demo_otp}`);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to send OTP: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!loginData.phone || !loginData.otp || !loginData.role) {
      setError('Phone, OTP, and role required');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: loginData.phone, otp: loginData.otp })
      });
      const data = await response.json();
      if (response.ok) {
        setAuthToken(data.token);
        localStorage.setItem('authToken', data.token);
        setCurrentUser(data.user);
        setUserRole(loginData.role);
        setLoginData({ aadhaar: '', phone: '', otp: '', password: '', role: '' });
        setOtpSent(false);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to verify OTP: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserRole(null);
    setAuthToken(null);
    localStorage.removeItem('authToken');
  };

  // Upload medical records to database
  const uploadRecordToDatabase = async (record) => {
    if (!authToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/medical/upload-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          reportName: record.type,
          date: new Date(),
          fileUrl: `file://${record.file}`,
          description: `Uploaded on ${record.date}`
        })
      });
      return response.ok;
    } catch (err) {
      console.error('Failed to upload record:', err);
      return false;
    }
  };

  // Send medical records to hospital
  const handleSendRecordsToHospital = async (hospital) => {
    setSendingRecords(true);
    // Simulate API call to send records
    setTimeout(() => {
      setBookedHospital(hospital);
      setRecordsSent(true);
      setSendingRecords(false);
      alert(`✅ Medical Records Transmitted!\n\n📋 Records Sent to: ${hospital.name}\n📊 Total Records: ${uploadedRecords.length}\n⏱️ Transmission Status: Complete\n\nThe hospital has received:\n${uploadedRecords.map(r => `• ${r.type}`).join('\n')}`);
    }, 1500);
  };

  // Helper functions
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) setUploadFileName(file.name);
  };

  const handleAddRecord = () => {
    if (uploadFileName && uploadFileType) {
      const newRecord = {
        type: uploadFileType,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        icon: recordTypes.find(r => r.label === uploadFileType)?.icon || '📄',
        file: uploadFileName,
      };
      setUploadedRecords([newRecord, ...uploadedRecords]);
      
      // Upload to database if authenticated
      if (authToken) {
        uploadRecordToDatabase(newRecord).then(success => {
          if (success) {
            alert('✅ Record saved successfully!');
          }
        });
      }
      
      setShowUploadModal(false);
      setUploadFileName('');
      setUploadFileType('');
    }
  };

  const handleDeleteRecord = (index) => {
    setUploadedRecords(uploadedRecords.filter((_, i) => i !== index));
  };

  const handleViewInsurance = (plan) => {
    setSelectedInsurance(plan);
    setShowInsuranceModal(true);
  };

  const handleApplyInsurance = () => {
    if (selectedInsurance) {
      setAppliedInsurance(selectedInsurance);
      alert(`✅ Insurance Plan Applied!\n\n${selectedInsurance.name} by ${selectedInsurance.company}\nPremium: ${selectedInsurance.premium}`);
      setShowInsuranceModal(false);
    }
  };

  const handleAttendance = (patientId) => {
    setDoctorAttendance({ ...doctorAttendance, [patientId]: !doctorAttendance[patientId] });
  };

  const handleMedicineStatus = (medicineId, status) => {
    setMedicineStatus({ ...medicineStatus, [medicineId]: status });
  };

  // LOGIN PAGE
  if (!currentUser) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', padding: '48px', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', width: '100%', maxWidth: '420px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1f2937' }}>🏥 MediLink</h1>
              <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>AI-Powered Healthcare Platform</p>
            </div>

            <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                  ⚠️ {error}
                </div>
              )}

              {!otpSent ? (
                <>
                  {/* Aadhaar Number */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#333' }}>
                      🆔 Aadhaar Number
                    </label>
                    <input
                      type="text"
                      placeholder="12 digit Aadhaar"
                      value={loginData.aadhaar}
                      onChange={(e) => setLoginData({ ...loginData, aadhaar: e.target.value })}
                      maxLength="12"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#333' }}>
                      📱 Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="10 digit mobile"
                      value={loginData.phone}
                      onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                      maxLength="10"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                      👥 Select Role
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      {[
                        { value: 'patient', label: '👤 Patient', color: '#0891b2' },
                        { value: 'doctor', label: '🩺 Doctor', color: '#8b5cf6' },
                        { value: 'nurse', label: '👩‍⚕️ Nurse', color: '#ec4899' },
                      ].map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => setLoginData({ ...loginData, role: role.value })}
                          style={{
                            padding: '10px',
                            background: loginData.role === role.value ? role.color : '#f3f4f6',
                            color: loginData.role === role.value ? 'white' : '#333',
                            border: `2px solid ${loginData.role === role.value ? role.color : '#e5e7eb'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            transition: 'all 0.2s',
                          }}
                        >
                          {role.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Send OTP Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '12px',
                      background: loading ? '#d1d5db' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      marginTop: '8px',
                    }}
                  >
                    {loading ? '📤 Sending OTP...' : '📤 Send OTP'}
                  </button>
                </>
              ) : (
                <>
                  {/* OTP Code */}
                  <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px', marginBottom: '8px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#0891b2' }}>Cheque your phone for OTP</p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>📱 {loginData.phone}</p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#333' }}>
                      🔐 Enter OTP
                    </label>
                    <input
                      type="text"
                      placeholder="6 digit OTP"
                      value={loginData.otp}
                      onChange={(e) => setLoginData({ ...loginData, otp: e.target.value })}
                      maxLength="6"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        letterSpacing: '2px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setLoginData({ ...loginData, otp: '' }); }}
                      style={{
                        padding: '12px',
                        background: '#f3f4f6',
                        color: '#333',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      }}
                    >
                      🔙 Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        padding: '12px',
                        background: loading ? '#d1d5db' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      }}
                    >
                      {loading ? '🔓 Verifying...' : '🔓 Verify & Login'}
                    </button>
                  </div>
                </>
              )}

              {/* Demo Credentials */}
              <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #0891b2' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold', color: '#0891b2' }}>Demo Credentials:</p>
                <p style={{ margin: '0', fontSize: '10px', color: '#333', lineHeight: '1.4' }}>
                  Aadhaar: 123456789012<br/>
                  Phone: 9876543210<br/>
                  OTP: Check console or backend logs
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Brand Section */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', color: 'white', textAlign: 'center' }}>
          <div>
            <h2 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 16px 0' }}>Welcome to MediLink</h2>
            <p style={{ fontSize: '16px', margin: '0 0 24px 0', opacity: 0.9 }}>Multi-Role Healthcare Management System</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', flex: '0 1 200px' }}>
                <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>👤</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0' }}>Patient Portal</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', flex: '0 1 200px' }}>
                <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>🩺</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0' }}>Doctor Dashboard</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', flex: '0 1 200px' }}>
                <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>👩‍⚕️</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0' }}>Nurse Management</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PATIENT DASHBOARD
  if (userRole === 'patient') {
    return (
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', background: '#f5f7fa', fontFamily: 'Arial, sans-serif' }}>
        {/* Sidebar */}
        <div style={{ width: '280px', background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', color: 'white', padding: '24px', overflowY: 'auto' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>🏥 MediLink</h1>
          <p style={{ fontSize: '12px', color: '#bfdbfe', marginBottom: '24px' }}>Patient Portal</p>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            <button onClick={() => setActiveTab('patient')} style={{ padding: '12px 16px', background: activeTab === 'patient' ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === 'patient' ? 'bold' : 'normal' }}>
              👤 Dashboard
            </button>
            <button onClick={() => setActiveTab('tracking')} style={{ padding: '12px 16px', background: activeTab === 'tracking' ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === 'tracking' ? 'bold' : 'normal' }}>
              🚑 Emergency & Tracking
            </button>
            <button onClick={() => setActiveTab('records')} style={{ padding: '12px 16px', background: activeTab === 'records' ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === 'records' ? 'bold' : 'normal' }}>
              📁 Medical Records
            </button>
            <button onClick={() => setActiveTab('insurance')} style={{ padding: '12px 16px', background: activeTab === 'insurance' ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === 'insurance' ? 'bold' : 'normal' }}>
              🛡️ Insurance
            </button>
          </nav>

          <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            🚪 Logout ({currentUser.name})
          </button>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {activeTab === 'patient' && (
            <div>
              {/* Profile Section */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '48px' }}>{patientProfile.profilePic}</div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{patientProfile.name}</h2>
                  <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Blood Group: <span style={{ fontWeight: 'bold', color: '#dc2626' }}>{patientProfile.bloodGroup}</span></p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0891b2' }}>{patientProfile.healthScore}</div>
                  <p style={{ fontSize: '12px', color: '#666', margin: '0' }}>Health Score</p>
                </div>
              </div>

              {/* SOS Button */}
              <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                <button onClick={() => setEmergencyActive(!emergencyActive)} style={{ width: '180px', height: '180px', borderRadius: '50%', background: emergencyActive ? '#991b1b' : '#dc2626', color: 'white', border: 'none', fontSize: '64px', cursor: 'pointer', boxShadow: emergencyActive ? '0 0 30px rgba(220, 38, 38, 0.8)' : '0 10px 25px rgba(220, 38, 38, 0.4)', transition: 'all 0.3s ease', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: emergencyActive ? 'scale(1.05)' : 'scale(1)' }}>
                  🚨
                </button>
                <p style={{ marginTop: '16px', fontSize: '18px', fontWeight: 'bold', color: emergencyActive ? '#dc2626' : '#333' }}>
                  {emergencyActive ? 'EMERGENCY ALERT SENT!' : 'TAP FOR SOS'}
                </p>
              </div>

              {/* Wallet Section */}
              <div style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', padding: '20px', borderRadius: '12px', marginBottom: '32px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 4px 0', opacity: 0.9 }}>💰 Health Wallet Balance</p>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0' }}>₹{patientProfile.walletBalance.toLocaleString()}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' }}>
                  <button onClick={() => alert('💳 Scan & Pay - Coming Soon!')} style={{ padding: '10px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}>
                    📱 Scan & Pay
                  </button>
                  <button onClick={() => alert('📊 View Transactions - Coming Soon!')} style={{ padding: '10px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}>
                    📊 Transactions
                  </button>
                </div>
              </div>

              {/* AI Health Predictions */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0' }}>📊 AI HEALTH PREDICTIONS</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {aiHealthInsights.map((insight, idx) => (
                    <div key={idx} style={{ border: `2px solid ${insight.color}`, borderRadius: '12px', padding: '16px', background: insight.color === '#10b981' ? '#f0fdf4' : insight.color === '#f59e0b' ? '#fffbeb' : '#fef2f2' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '28px' }}>{insight.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0', fontWeight: 'bold', fontSize: '16px', color: '#1f2937' }}>{insight.condition}</p>
                        </div>
                        <div style={{ padding: '6px 14px', background: insight.color, color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                          {insight.risk}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.6)', padding: '10px', borderRadius: '8px' }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold', color: '#666' }}>📌 REASON</p>
                          <p style={{ margin: '0', fontSize: '13px', color: '#1f2937', fontWeight: '500' }}>{insight.reason}</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.6)', padding: '10px', borderRadius: '8px' }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold', color: '#666' }}>💰 COVERAGE</p>
                          <p style={{ margin: '0', fontSize: '16px', fontWeight: 'bold', color: insight.color }}>{insight.amount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tracking' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>🚑 Emergency & Ambulance Tracking</h2>
              
              {/* Location Info Card */}
              <div style={{ background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', opacity: 0.9 }}>📍 YOUR CURRENT LOCATION</p>
                <p style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>{patientLocation.address}</p>
                <p style={{ margin: '0', fontSize: '11px', opacity: 0.8 }}>Coordinates: {patientLocation.lat.toFixed(4)}°N, {patientLocation.lng.toFixed(4)}°E</p>
              </div>

              {/* Google Maps Embed - Static Map as Fallback */}
              <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px', overflow: 'hidden' }}>
                <div style={{ position: 'relative', width: '100%', height: '400px', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Static Map Image (Google Maps Static API - no key required for simple embed) */}
                  <img 
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=12.9716,77.5946&zoom=15&size=800x400&markers=color:red%7C12.9716,77.5946&style=feature:all%7Celement:labels%7Cvisibility:on&style=feature:water%7Ccolor:0xb3d9ff&style=feature:land%7Ccolor:0xf3f3f3&style=feature:road%7Ccolor:0xffffff`}
                    alt="Patient Location Map"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  
                  {/* Overlay Info */}
                  <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'white', padding: '12px 16px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
                    🗺️ Live Location Map
                  </div>
                </div>
                
                {/* Setup Instructions */}
                <div style={{ background: '#fef3c7', padding: '12px', fontSize: '12px', color: '#92400e', borderTop: '1px solid #fcd34d' }}>
                  <p style={{ margin: '0' }}>💡 <strong>To enable interactive Google Maps:</strong> Add your Google Maps API key to environment variables (VITE_GOOGLE_MAPS_API_KEY)</p>
                </div>
              </div>

              {/* Nearest Ambulance Card */}
              {nearestAmbulance && (
                <div style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>🚑 Nearest Available Ambulance</h3>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>⏱️ {nearestAmbulance.eta}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', opacity: 0.9 }}>NAME</p>
                      <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>{nearestAmbulance.name}</p>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', opacity: 0.9 }}>DRIVER</p>
                      <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{nearestAmbulance.driver}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', opacity: 0.9 }}>DISTANCE</p>
                      <p style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>{nearestAmbulance.distance} km</p>
                      <button onClick={() => alert(`📞 Calling Ambulance: ${nearestAmbulance.name}`)} style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                        📞 Call Ambulance
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                    <p style={{ margin: '0', fontSize: '11px' }}>📍 GPS Location: {patientLocation.address}</p>
                  </div>
                </div>
              )}

              {/* Booked Hospital & Records Transmission */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px', border: bookedHospital ? '2px solid #10b981' : 'none' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0' }}>🏥 Hospital Booking & Records Transfer</h3>
                
                {!bookedHospital ? (
                  <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#333', fontWeight: 'bold' }}>📋 Select a hospital below to book and send your medical records automatically:</p>
                    <p style={{ margin: '0', fontSize: '11px', color: '#666' }}>Your records will be transmitted securely to help provide faster treatment.</p>
                  </div>
                ) : (
                  <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '2px solid #10b981' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: '#059669' }}>✅ BOOKED HOSPITAL</p>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>{bookedHospital.name}</p>
                    {recordsSent && (
                      <div style={{ padding: '8px 12px', background: '#059669', color: 'white', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                        ✓ Medical Records Transmitted Successfully
                      </div>
                    )}
                  </div>
                )}

                {/* Medical Records Preview */}
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold', color: '#333' }}>📋 Records to Send ({uploadedRecords.length}):</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                    {uploadedRecords.map((record, idx) => (
                      <div key={idx} style={{ background: '#f9fafb', padding: '8px 10px', borderRadius: '6px', textAlign: 'center', fontSize: '11px', fontWeight: '500', color: '#333', border: '1px solid #e5e7eb' }}>
                        <p style={{ margin: '0 0 2px 0', fontSize: '14px' }}>{record.icon}</p>
                        <p style={{ margin: '0', fontSize: '10px' }}>{record.type}</p>
                        <p style={{ margin: '0', fontSize: '9px', color: '#999' }}>{record.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nearby Hospitals */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0' }}>🏥 Nearby Hospitals</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {hospitalList.map((hospital, idx) => (
                    <div key={hospital.id} style={{ border: bookedHospital?.id === hospital.id ? '2px solid #10b981' : '2px solid #e5e7eb', borderRadius: '12px', padding: '16px', background: bookedHospital?.id === hospital.id ? '#f0fdf4' : idx === 0 ? '#f0fdf4' : 'white', borderLeft: bookedHospital?.id === hospital.id ? '4px solid #10b981' : idx === 0 ? '4px solid #10b981' : '4px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '14px' }}>{hospital.name} {idx === 0 ? '⭐' : ''} {bookedHospital?.id === hospital.id ? '✅ BOOKED' : ''}</p>
                          <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>{hospital.specialty}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{hospital.distance} km</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>~{Math.round(hospital.distance * 3)} mins</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ background: '#f9fafb', padding: '10px', borderRadius: '6px' }}>
                          <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#666' }}>BEDS AVAILABLE</p>
                          <p style={{ margin: '0', fontWeight: 'bold', fontSize: '14px' }}>{hospital.beds}</p>
                        </div>
                        <div style={{ background: '#f9fafb', padding: '10px', borderRadius: '6px' }}>
                          <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#666' }}>RATING</p>
                          <p style={{ margin: '0', fontWeight: 'bold', fontSize: '14px' }}>⭐ {hospital.rating}</p>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <button onClick={() => handleSendRecordsToHospital(hospital)} disabled={sendingRecords || bookedHospital?.id === hospital.id} style={{ padding: '8px 12px', background: bookedHospital?.id === hospital.id ? '#10b981' : sendingRecords ? '#d1d5db' : '#059269', color: 'white', border: 'none', borderRadius: '6px', cursor: bookedHospital?.id === hospital.id || sendingRecords ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '11px' }}>
                          {sendingRecords ? '📤 Sending...' : bookedHospital?.id === hospital.id ? '✓ Records Sent' : '📤 Book & Send'}
                        </button>
                        <button onClick={() => alert(`📞 Calling ${hospital.name}: ${hospital.phone}`)} style={{ padding: '8px 12px', background: '#0891b2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>
                          📞 Call
                        </button>
                        <button onClick={() => alert(`📍 Opening Google Maps for ${hospital.name}`)} style={{ padding: '8px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>
                          📍 Directions
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Ambulances List */}
              <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0' }}>🚑 All Available Ambulances</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {ambulanceList.map((ambulance) => (
                    <div key={ambulance.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: ambulance.status === 'Available' ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `1px solid ${ambulance.status === 'Available' ? '#10b981' : '#ef4444'}` }}>
                      <span style={{ fontSize: '24px' }}>🚑</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0', fontWeight: 'bold', fontSize: '13px' }}>{ambulance.name}</p>
                        <p style={{ margin: '0', fontSize: '11px', color: '#666' }}>Driver: {ambulance.driver} | {ambulance.distance} km away | ETA: {ambulance.eta}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ padding: '4px 8px', background: ambulance.status === 'Available' ? '#10b981' : '#ef4444', color: 'white', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                          {ambulance.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>📁 MEDICAL RECORDS ({uploadedRecords.length})</h3>
                <button onClick={() => setShowUploadModal(true)} style={{ padding: '8px 16px', background: '#0891b2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                  ➕ Upload
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {uploadedRecords.map((record, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                    <span style={{ fontSize: '24px' }}>{record.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0', fontWeight: 'bold', fontSize: '14px' }}>{record.type}</p>
                      <p style={{ margin: '0', fontSize: '11px', color: '#999' }}>{record.file} • {record.date}</p>
                    </div>
                    <button onClick={() => handleDeleteRecord(idx)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'insurance' && (
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0' }}>🛡️ INSURANCE PLANS</h3>
              {appliedInsurance && (
                <div style={{ background: '#dbeafe', border: '2px solid #0891b2', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                  <p style={{ margin: '0', fontSize: '13px', fontWeight: 'bold', color: '#0891b2' }}>✅ Active: {appliedInsurance.name}</p>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {insurancePlans.map((plan, idx) => (
                  <div key={idx} style={{ border: `2px solid ${plan.color}`, borderRadius: '12px', padding: '14px', background: plan.color === '#10b981' ? '#f0fdf4' : '#fef2f2', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div><span style={{ fontSize: '24px' }}>{plan.icon}</span></div>
                    <div><p style={{ margin: '0', fontWeight: 'bold', fontSize: '13px', color: '#1f2937' }}>{plan.name}</p></div>
                    <div><p style={{ margin: '0', fontSize: '11px', color: '#666' }}>{plan.coverage} | {plan.premium}</p></div>
                    <button onClick={() => handleViewInsurance(plan)} disabled={appliedInsurance?.name === plan.name} style={{ padding: '8px 12px', background: appliedInsurance?.name === plan.name ? '#d1d5db' : plan.color, color: 'white', border: 'none', borderRadius: '6px', cursor: appliedInsurance?.name === plan.name ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      {appliedInsurance?.name === plan.name ? '✓ Applied' : 'View'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Insurance Modal */}
        {showInsuranceModal && selectedInsurance && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
            <div style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>{selectedInsurance.name}</h2>
                <button onClick={() => setShowInsuranceModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>✕</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: `${selectedInsurance.color}20`, padding: '12px', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold', color: '#666' }}>Coverage</p>
                  <p style={{ margin: '0', fontSize: '16px', fontWeight: 'bold', color: selectedInsurance.color }}>{selectedInsurance.coverage}</p>
                </div>
                <div style={{ backgroundColor: `${selectedInsurance.color}20`, padding: '12px', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold', color: '#666' }}>Premium</p>
                  <p style={{ margin: '0', fontSize: '16px', fontWeight: 'bold', color: selectedInsurance.color }}>{selectedInsurance.premium}</p>
                </div>
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0' }}>Terms & Benefits</h3>
              <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', marginBottom: '24px' }}>
                {selectedInsurance.terms.map((term, idx) => (
                  <p key={idx} style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#333' }}>✓ {term}</p>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button onClick={() => setShowInsuranceModal(false)} style={{ padding: '12px', background: '#f3f4f6', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Cancel
                </button>
                <button onClick={handleApplyInsurance} style={{ padding: '12px', background: selectedInsurance.color, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ✓ Apply Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '32px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>📤 Upload Medical Report</h2>
                <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Select Report Type:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {recordTypes.map((type, idx) => (
                    <button key={idx} onClick={() => setUploadFileType(type.label)} type="button" style={{ padding: '12px', background: uploadFileType === type.label ? '#0891b2' : '#f3f4f6', color: uploadFileType === type.label ? 'white' : '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
                      {type.icon} {type.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} id="fileInput" style={{ display: 'none' }} />
                <label htmlFor="fileInput" style={{ display: 'block', border: '2px dashed #0891b2', borderRadius: '8px', padding: '20px', textAlign: 'center', background: '#e0f2fe', cursor: 'pointer' }}>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#0891b2' }}>Click to upload</p>
                </label>
                {uploadFileName && <p style={{ marginTop: '8px', fontSize: '12px', color: '#059269' }}>✓ {uploadFileName}</p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button onClick={() => setShowUploadModal(false)} style={{ padding: '12px', background: '#f3f4f6', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Cancel
                </button>
                <button onClick={handleAddRecord} disabled={!uploadFileName || !uploadFileType} style={{ padding: '12px', background: uploadFileName && uploadFileType ? '#0891b2' : '#d1d5db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ✓ Upload
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DOCTOR DASHBOARD
  if (userRole === 'doctor') {
    return (
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', background: '#f5f7fa', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ width: '280px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white', padding: '24px', overflowY: 'auto' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>🏥 MediLink</h1>
          <p style={{ fontSize: '12px', color: '#ede9fe', marginBottom: '24px' }}>Doctor Portal</p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            <button onClick={() => setActiveTab('patients')} style={{ padding: '12px 16px', background: activeTab === 'patients' ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === 'patients' ? 'bold' : 'normal' }}>
              👥 My Patients
            </button>
            <button onClick={() => setActiveTab('attendance')} style={{ padding: '12px 16px', background: activeTab === 'attendance' ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === 'attendance' ? 'bold' : 'normal' }}>
              ✅ Attendance
            </button>
            <button onClick={() => setActiveTab('diagnosis')} style={{ padding: '12px 16px', background: activeTab === 'diagnosis' ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === 'diagnosis' ? 'bold' : 'normal' }}>
              📝 Diagnosis
            </button>
            <button onClick={() => setActiveTab('emergency')} style={{ padding: '12px 16px', background: activeTab === 'emergency' ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === 'emergency' ? 'bold' : 'normal' }}>
              🚑 Emergencies
            </button>
          </nav>
          <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            🚪 Logout ({currentUser.name})
          </button>
        </div>

        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {activeTab === 'patients' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>👥 My Patients</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                {doctorPatientList.map((patient) => (
                  <div key={patient.id} onClick={() => setSelectedPatient(patient)} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer', border: selectedPatient?.id === patient.id ? '2px solid #8b5cf6' : 'none', transition: 'all 0.2s' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>{patient.name}</p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Age: {patient.age} | Blood: {patient.bloodGroup}</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>Score: <span style={{ fontWeight: 'bold', color: patient.healthScore > 80 ? '#10b981' : patient.healthScore > 60 ? '#f59e0b' : '#ef4444' }}>{patient.healthScore}</span></p>
                    <button onClick={() => handleAttendance(patient.id)} style={{ marginTop: '10px', width: '100%', padding: '8px', background: doctorAttendance[patient.id] ? '#10b981' : '#f3f4f6', color: doctorAttendance[patient.id] ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      {doctorAttendance[patient.id] ? '✅ Present' : '❌ Absent'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>✅ Patient Attendance</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {doctorPatientList.map((patient) => (
                  <div key={patient.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0', fontWeight: 'bold', fontSize: '14px' }}>{patient.name}</p>
                      <p style={{ margin: '0', fontSize: '11px', color: '#999' }}>ID: {patient.id}</p>
                    </div>
                    <button onClick={() => handleAttendance(patient.id)} style={{ padding: '6px 12px', background: doctorAttendance[patient.id] ? '#10b981' : '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      {doctorAttendance[patient.id] ? '✅ Present' : '❌ Absent'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'diagnosis' && (
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>📝 Add Diagnosis & Prescription</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {doctorPatientList.map((p) => (
                  <div key={p.id} onClick={() => setSelectedPatient(p)} style={{ padding: '12px', background: selectedPatient?.id === p.id ? '#ede9fe' : '#f3f4f6', border: selectedPatient?.id === p.id ? '2px solid #8b5cf6' : 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    <p style={{ margin: '0', fontWeight: 'bold', fontSize: '13px' }}>{p.name}</p>
                  </div>
                ))}
              </div>
              {selectedPatient && (
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Patient: {selectedPatient.name}</p>
                  <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Enter diagnosis..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '10px', minHeight: '80px', boxSizing: 'border-box' }} />
                  <textarea value={prescription} onChange={(e) => setPrescription(e.target.value)} placeholder="Enter prescription..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '10px', minHeight: '80px', boxSizing: 'border-box' }} />
                  <button onClick={() => { alert('✓ Diagnosis & Prescription Saved!'); setDiagnosis(''); setPrescription(''); }} style={{ width: '100%', padding: '10px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    💾 Save
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'emergency' && (
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>🚑 Emergency Alerts</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {emergencyAlerts.map((alert) => (
                  <div key={alert.id} style={{ border: '2px solid #dc2626', borderRadius: '12px', padding: '16px', background: '#fef2f2' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold', color: '#dc2626' }}>⚠️ {alert.patient}</p>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#333' }}>Status: <span style={{ fontWeight: 'bold' }}>{alert.status}</span></p>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Location: {alert.location}</p>
                    <p style={{ margin: '0', fontSize: '11px', color: '#999' }}>Time: {alert.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // NURSE DASHBOARD
  if (userRole === 'nurse') {
    return (
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', background: '#f5f7fa', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ width: '280px', background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', color: 'white', padding: '24px', overflowY: 'auto' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>🏥 MediLink</h1>
          <p style={{ fontSize: '12px', color: '#fbcfe8', marginBottom: '24px' }}>Nurse Portal</p>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            <button onClick={() => setActiveTab('medicines')} style={{ padding: '12px 16px', background: activeTab === 'medicines' ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === 'medicines' ? 'bold' : 'normal' }}>
              💊 Medicine Tracker
            </button>
            <button onClick={() => setActiveTab('notes')} style={{ padding: '12px 16px', background: activeTab === 'notes' ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === 'notes' ? 'bold' : 'normal' }}>
              📝 Patient Notes
            </button>
          </nav>
          <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            🚪 Logout ({currentUser.name})
          </button>
        </div>

        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {activeTab === 'medicines' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>💊 Medicine Distribution Tracker</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {nurseMedicineList.map((med) => (
                  <div key={med.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${medicineStatus[med.id] === 'given' ? '#10b981' : '#f59e0b'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '14px' }}>{med.patient}</p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>💊 {med.medicine} - {med.dosage}</p>
                        <p style={{ margin: '0', fontSize: '11px', color: '#999' }}>⏰ {med.time}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleMedicineStatus(med.id, 'given')} style={{ padding: '8px 12px', background: medicineStatus[med.id] === 'given' ? '#10b981' : '#f3f4f6', color: medicineStatus[med.id] === 'given' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                          ✅ Given
                        </button>
                        <button onClick={() => handleMedicineStatus(med.id, 'missed')} style={{ padding: '8px 12px', background: medicineStatus[med.id] === 'missed' ? '#ef4444' : '#f3f4f6', color: medicineStatus[med.id] === 'missed' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                          ❌ Missed
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>📝 Patient Care Notes</h2>
              <textarea value={nurseNotes} onChange={(e) => setNurseNotes(e.target.value)} placeholder="Add patient notes, observations, or concerns..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb', minHeight: '200px', boxSizing: 'border-box', fontSize: '14px' }} />
              <button onClick={() => { alert('✓ Notes Saved!'); setNurseNotes(''); }} style={{ marginTop: '12px', width: '100%', padding: '12px', background: '#ec4899', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                💾 Save Notes
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}
