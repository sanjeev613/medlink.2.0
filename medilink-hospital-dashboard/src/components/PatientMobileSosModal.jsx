import React, { useState, useEffect } from 'react';

export default function PatientMobileSosModal({
  isOpen,
  onClose,
  activeIncident,
  onTriggerSOS,
  loading
}) {
  const [emergencyType, setEmergencyType] = useState('Accident');
  const [severeBleeding, setSevereBleeding] = useState(true);
  const [breathingDifficulty, setBreathingDifficulty] = useState(true);
  const [consciousness, setConsciousness] = useState('Pain Responsive');
  const [offlineMode, setOfflineMode] = useState(false);
  const [queuedRequests, setQueuedRequests] = useState([]);
  const [smsCopied, setSmsCopied] = useState(false);

  if (!isOpen) return null;

  const currentStatus = activeIncident?.status || null;

  const steps = [
    { key: 'SOS_ACTIVATED', label: 'SOS Activated' },
    { key: 'AMBULANCE_ASSIGNED', label: 'Ambulance Assigned' },
    { key: 'HOSPITAL_NOTIFIED', label: 'Hospital Pre-Alert' },
    { key: 'HOSPITAL_ACKNOWLEDGED', label: 'ER Acknowledged' },
    { key: 'PATIENT_ARRIVED', label: 'Patient Arrived' }
  ];

  const getStepIndex = (st) => {
    if (!st) return -1;
    if (st === 'SOS_ACTIVATED' || st === 'REQUEST_RECEIVED') return 0;
    if (st === 'AMBULANCE_ASSIGNED' || st === 'AMBULANCE_EN_ROUTE') return 1;
    if (st === 'HOSPITAL_NOTIFIED') return 2;
    if (st === 'HOSPITAL_ACKNOWLEDGED' || st === 'PATIENT_PICKED_UP') return 3;
    if (st === 'PATIENT_ARRIVED' || st === 'EMERGENCY_COMPLETED') return 4;
    return 0;
  };

  const currentStepIdx = getStepIndex(currentStatus);

  const handleActivate = () => {
    if (offlineMode) {
      // Local queue
      const queued = {
        id: `QUEUE-${Date.now()}`,
        emergencyType,
        severeBleeding,
        breathingDifficulty,
        consciousness,
        queuedAt: new Date().toLocaleTimeString()
      };
      setQueuedRequests([...queuedRequests, queued]);
      return;
    }

    onTriggerSOS({
      emergencyType,
      severeBleeding,
      breathingDifficulty,
      consciousness,
      latitude: 13.0067,
      longitude: 80.2036,
      address: 'Anna Salai near Guindy Flyover, Chennai'
    });
  };

  // Reconnect retry
  const handleReconnect = () => {
    setOfflineMode(false);
    if (queuedRequests.length > 0) {
      const last = queuedRequests[queuedRequests.length - 1];
      onTriggerSOS({
        emergencyType: last.emergencyType,
        severeBleeding: last.severeBleeding,
        breathingDifficulty: last.breathingDifficulty,
        consciousness: last.consciousness,
        latitude: 13.0067,
        longitude: 80.2036,
        address: 'Anna Salai near Guindy Flyover, Chennai (Synced from Offline Cache)'
      });
      setQueuedRequests([]);
    }
  };

  const generateSmsText = () => {
    return `EMERGENCY ALERT: Need urgent ambulance. Location: 13.0067, 80.2036 (Guindy Flyover, Chennai). Patient: Karthik Ramanathan, Blood O+, Allergies: Penicillin. Type: ${emergencyType}. Call 112 immediately.`;
  };

  const copySms = () => {
    navigator.clipboard?.writeText(generateSmsText());
    setSmsCopied(true);
    setTimeout(() => setSmsCopied(false), 3000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: '#111827',
        borderRadius: '16px',
        maxWidth: '520px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1.5px solid #dc2626',
        padding: '24px',
        boxShadow: '0 0 30px rgba(220,38,38,0.3)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🚨</span>
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '800', margin: 0 }}>
              One-Tap Emergency SOS Portal
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Phase 6: Low-Network Emergency Switch */}
        <div style={{
          background: offlineMode ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${offlineMode ? '#eab308' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: offlineMode ? '#fde047' : '#9ca3af' }}>
              {offlineMode ? '⚠️ LOW-NETWORK / OFFLINE MODE ACTIVE' : '🌐 Network Status: Online (4G/5G)'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {offlineMode ? 'No mobile internet. Emergency requests cached locally.' : 'Direct HTTP/WebSocket gateway connection.'}
            </div>
          </div>
          <button
            onClick={() => (offlineMode ? handleReconnect() : setOfflineMode(true))}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '700',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: offlineMode ? '#10b981' : '#eab308',
              color: '#000'
            }}
          >
            {offlineMode ? 'Reconnect 4G' : 'Simulate Offline'}
          </button>
        </div>

        {/* Offline Warning & 112 Dial */}
        {offlineMode && (
          <div style={{ background: '#7f1d1d', border: '1px solid #ef4444', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#fecaca', marginBottom: '6px' }}>
              ⚠️ Emergency request not delivered over internet. Call emergency services immediately.
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <a
                href="tel:112"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  background: '#ef4444',
                  color: '#fff',
                  padding: '10px',
                  borderRadius: '6px',
                  fontWeight: '800',
                  fontSize: '13px',
                  textDecoration: 'none'
                }}
              >
                📞 Call 112 (National Emergency)
              </a>
              <button
                onClick={copySms}
                style={{
                  flex: 1,
                  background: '#374151',
                  color: '#fff',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {smsCopied ? '✓ SMS Text Copied!' : '📋 Copy Emergency SMS'}
              </button>
            </div>
            {queuedRequests.length > 0 && (
              <div style={{ fontSize: '11px', color: '#fef08a', marginTop: '8px' }}>
                ✓ {queuedRequests.length} request(s) cached in local memory. Will auto-retry upon reconnection.
              </div>
            )}
          </div>
        )}

        {/* Big One-Tap SOS Activation Button */}
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <button
            onClick={handleActivate}
            disabled={loading}
            style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #ef4444 0%, #b91c1c 80%)',
              color: '#fff',
              border: '4px solid #fecaca',
              boxShadow: '0 0 30px rgba(239,68,68,0.7)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '36px', marginBottom: '4px' }}>🚨</span>
            <span style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '1px' }}>
              ACTIVATE SOS
            </span>
          </button>
          <span style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginTop: '10px' }}>
            One-Tap Emergency Broadcast with GPS Location Permission
          </span>
        </div>

        {/* Rapid Triage Toggles */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '18px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
            Rapid Condition Assessment
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={severeBleeding}
                onChange={(e) => setSevereBleeding(e.target.checked)}
              />
              Severe / Active Bleeding
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={breathingDifficulty}
                onChange={(e) => setBreathingDifficulty(e.target.checked)}
              />
              Breathing Difficulty
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af' }}>
            <span>Consciousness Level:</span>
            <select
              value={consciousness}
              onChange={(e) => setConsciousness(e.target.value)}
              style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '4px', padding: '4px 8px' }}
            >
              <option value="Alert">Alert (Fully conscious)</option>
              <option value="Voice">Voice Responsive (Confused)</option>
              <option value="Pain Responsive">Pain Responsive (Drowsy/Trauma)</option>
              <option value="Unresponsive">Unresponsive (Critical)</option>
            </select>
          </div>
        </div>

        {/* Phase 1: Real-Time Event Status Tracker Stepper */}
        {activeIncident && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>
              Incident Progression: {activeIncident.incidentId}
            </div>

            <div className="status-stepper">
              {steps.map((st, idx) => {
                const isPassed = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={st.key} className={`step-node ${isCurrent ? 'active' : ''} ${isPassed ? 'completed' : ''}`}>
                    <div className="step-circle">
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <div className="step-label">{st.label}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: '#1f2937', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#cbd5e1', marginTop: '10px' }}>
              <strong>Current Status:</strong> <span style={{ color: '#38bdf8', fontWeight: '700' }}>{currentStatus}</span><br />
              Receiving Hospital: <strong>{activeIncident.hospitalMatching?.selectedHospital?.name || 'Searching...'}</strong><br />
              Ambulance ETA: <strong>~{activeIncident.ambulance?.etaMinutes || 8} mins</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
