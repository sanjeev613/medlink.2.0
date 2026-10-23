import React, { useState } from 'react';

export default function HospitalReadinessHub({
  incident,
  onAccept,
  onDecline,
  onAssignTeam,
  onToggleChecklist,
  onMarkTeamReady,
  loading
}) {
  const [selectedDoctor, setSelectedDoctor] = useState('Dr. Anand Krishnamoorthy (Chief Trauma Surgeon)');
  const [selectedNurse, setSelectedNurse] = useState('Sister Priya Selvam (Senior ER Triage Nurse)');
  const [declineReason, setDeclineReason] = useState('ICU Bed Capacity Full');
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  if (!incident) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
        <h3>🏥 No Active Pre-Arrival Emergencies</h3>
        <p>Hospital Emergency Department standing by for incoming dispatch alerts.</p>
      </div>
    );
  }

  const triage = incident.triage || {};
  const patient = incident.patientInfo || {};
  const ambulance = incident.ambulance || {};
  const medicalTeam = incident.medicalTeam || {};
  const hospitalStatus = incident.hospitalMatching?.selectedHospital?.status || 'Pending';

  const isCritical = triage.priority === 'CRITICAL';
  const isAccepted = hospitalStatus === 'Accepted';
  const isDeclined = hospitalStatus === 'Declined';
  const isTeamReady = medicalTeam.teamReady;

  return (
    <div className="view" style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Pre-Arrival Alert Banner */}
      <div className={`pre-arrival-banner ${isCritical ? 'critical' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>🚨</span>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>
                PRE-ARRIVAL EMERGENCY READINESS ALERT
              </h2>
              <span className={`badge-priority ${triage.priority?.toLowerCase()}`}>
                {triage.priority}
              </span>
            </div>
            <p style={{ color: '#e5e7eb', fontSize: '14px', maxWidth: '700px', lineHeight: '1.4' }}>
              <strong>Primary Innovation:</strong> Connecting patient vitals and trauma mechanism to the receiving Emergency Room <em>before</em> ambulance arrival.
            </p>
          </div>

          <div style={{ textAlign: 'right', background: 'rgba(0,0,0,0.3)', padding: '10px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700' }}>
              Ambulance ETA to ER
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: ambulance.etaMinutes <= 3 ? '#ef4444' : '#38bdf8' }}>
              ~{ambulance.etaMinutes || 0} MINS
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
              Unit: <strong>{ambulance.ambulanceId}</strong> ({ambulance.vehicleNumber})
            </div>
          </div>
        </div>

        {/* Hospital Decision Action Bar */}
        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>ER Response Status:</span>
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              background: isAccepted ? 'rgba(16,185,129,0.2)' : isDeclined ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
              color: isAccepted ? '#34d399' : isDeclined ? '#f87171' : '#fbbf24',
              border: `1px solid ${isAccepted ? '#10b981' : isDeclined ? '#ef4444' : '#f59e0b'}`
            }}>
              {isAccepted ? '✓ HOSPITAL ACCEPTED' : isDeclined ? '✗ DECLINED' : '⏳ PENDING REVIEW'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {!isAccepted && (
              <button
                className="panel-action"
                style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                disabled={loading}
                onClick={onAccept}
              >
                ✓ ACCEPT EMERGENCY
              </button>
            )}

            {!isDeclined && (
              <button
                className="panel-action"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid #ef4444', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                disabled={loading}
                onClick={() => setShowDeclineModal(true)}
              >
                UNABLE TO ACCEPT
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1f2937', padding: '24px', borderRadius: '14px', maxWidth: '450px', width: '90%', border: '1px solid #374151' }}>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>Select Reason for Declining</h3>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '15px' }}>
              Coordinator will be notified immediately to re-route ambulance to the next best matched hospital.
            </p>
            <select
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#111827', color: '#fff', border: '1px solid #4b5563', marginBottom: '20px' }}
            >
              <option value="ICU Bed Capacity Full">ICU Bed Capacity Full</option>
              <option value="CT Scanner Currently Under Emergency Maintenance">CT Scanner Under Emergency Maintenance</option>
              <option value="Specialist Trauma Surgeon in Emergency Surgery">Specialist Trauma Surgeon in Emergency Surgery</option>
              <option value="Blood Bank Supply Restricted">Blood Bank Supply Restricted</option>
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                style={{ background: '#4b5563', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                onClick={() => setShowDeclineModal(false)}
              >
                Cancel
              </button>
              <button
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                onClick={() => {
                  onDecline(declineReason);
                  setShowDeclineModal(false);
                }}
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Patient Details + Medical Team & Preparation Checklist */}
      <div className="grid-2" style={{ gap: '20px' }}>
        {/* Left Column: Patient Triage & Vitals */}
        <div className="panel" style={{ background: 'var(--card)', borderRadius: '14px', padding: '20px', border: '1px solid var(--border)' }}>
          <div className="panel-header" style={{ marginBottom: '15px' }}>
            <div className="panel-title" style={{ fontSize: '16px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👤</span> Patient Pre-Arrival Medical Vault
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '18px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Patient Name</span>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{patient.name}</div>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Age: {patient.age} • {patient.gender}</div>
            </div>

            <div style={{ background: 'rgba(220,38,38,0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(220,38,38,0.3)' }}>
              <span style={{ fontSize: '11px', color: '#f87171', fontWeight: '700' }}>BLOOD GROUP (VERIFIED)</span>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff' }}>{patient.bloodGroup}</div>
              <div style={{ fontSize: '11px', color: '#fca5a5' }}>Pre-typing initiated</div>
            </div>
          </div>

          {/* Vitals Telemetry */}
          <div style={{ marginBottom: '18px' }}>
            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '8px' }}>
              En-Route Telemetry (First Responder Vitals)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <div style={{ background: '#111827', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>NIBP</span>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#38bdf8' }}>{patient.vitals?.bp}</div>
              </div>
              <div style={{ background: '#111827', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>Pulse</span>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444' }}>{patient.vitals?.pulse} bpm</div>
              </div>
              <div style={{ background: '#111827', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>SpO2</span>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>{patient.vitals?.spO2}%</div>
              </div>
              <div style={{ background: '#111827', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>AVPU</span>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#fbbf24' }}>{patient.vitals?.consciousness}</div>
              </div>
            </div>
          </div>

          {/* Critical Alerts */}
          <div style={{ background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.25)', marginBottom: '15px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#f87171', marginBottom: '4px' }}>
              ⚠️ CRITICAL ALLERGIES & WARNINGS:
            </div>
            <div style={{ fontSize: '13px', color: '#fecaca' }}>
              Allergies: <strong>{patient.allergies?.join(', ') || 'None reported'}</strong><br />
              Pre-existing: <strong>{patient.medicalConditions?.join(', ') || 'None'}</strong>
            </div>
          </div>

          {/* AI Triage Rationale */}
          <div style={{ background: 'rgba(2,132,199,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(2,132,199,0.25)' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8', marginBottom: '4px' }}>
              🧠 AI Triage Decision Support Logic:
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4', margin: 0 }}>
              {triage.ruleExplanation}
            </p>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', marginTop: '6px' }}>
              * {triage.disclaimer}
            </div>
          </div>
        </div>

        {/* Right Column: Medical Team Assignment & Preparation Checklist */}
        <div className="panel" style={{ background: 'var(--card)', borderRadius: '14px', padding: '20px', border: '1px solid var(--border)' }}>
          <div className="panel-header" style={{ marginBottom: '15px' }}>
            <div className="panel-title" style={{ fontSize: '16px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🩺</span> Trauma Resuscitation Team Assignment
            </div>
          </div>

          {/* Team Assignment Form */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                Attending Trauma Surgeon
              </label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#111827', color: '#fff', border: '1px solid #374151', fontSize: '13px' }}
              >
                <option value="Dr. Anand Krishnamoorthy (Chief Trauma Surgeon)">Dr. Anand Krishnamoorthy (Chief Trauma Surgeon)</option>
                <option value="Dr. Radhika Srinivasan (Lead Neuro-Trauma)">Dr. Radhika Srinivasan (Lead Neuro-Trauma)</option>
                <option value="Dr. V. Rajesh (Consultant Orthopedic Trauma)">Dr. V. Rajesh (Consultant Orthopedic Trauma)</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                Senior ER Triage Nurse
              </label>
              <select
                value={selectedNurse}
                onChange={(e) => setSelectedNurse(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#111827', color: '#fff', border: '1px solid #374151', fontSize: '13px' }}
              >
                <option value="Sister Priya Selvam (Senior ER Triage Nurse)">Sister Priya Selvam (Senior ER Triage Nurse)</option>
                <option value="Nurse Rajesh Nair (ICU Charge Nurse)">Nurse Rajesh Nair (ICU Charge Nurse)</option>
              </select>
            </div>

            <button
              className="panel-action"
              style={{ width: '100%', background: '#0284c7', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              disabled={loading}
              onClick={() => onAssignTeam({ leadDoctor: selectedDoctor, leadNurse: selectedNurse })}
            >
              Confirm Medical Team Mobilization
            </button>
          </div>

          {/* Pre-Arrival Preparation Checklist */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                📋 Pre-Hospital Readiness Protocol Checklist
              </h4>
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>
                {medicalTeam.checklist?.filter(c => c.done).length || 0} / {medicalTeam.checklist?.length || 5} Ready
              </span>
            </div>

            <div>
              {medicalTeam.checklist?.map((item, idx) => (
                <div
                  key={idx}
                  className={`checklist-item ${item.done ? 'checked' : ''}`}
                  onClick={() => onToggleChecklist(idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => {}}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '13px', color: item.done ? '#e2e8f0' : '#cbd5e1', fontWeight: item.done ? '600' : '400' }}>
                      {item.item}
                    </span>
                  </div>
                  {item.done && <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '700' }}>✓ READY</span>}
                </div>
              ))}
            </div>

            {/* Mark Team Ready Button */}
            <button
              style={{
                width: '100%',
                marginTop: '15px',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                background: isTeamReady ? '#10b981' : 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)',
                color: '#fff',
                boxShadow: isTeamReady ? '0 0 15px rgba(16,185,129,0.4)' : '0 0 15px rgba(220,38,38,0.4)',
                transition: 'all 0.3s'
              }}
              disabled={loading}
              onClick={onMarkTeamReady}
            >
              {isTeamReady ? '✓ MEDICAL TEAM & TRAUMA BAY MARKED READY' : '🚨 COMPLETE PREPARATION & MARK TEAM READY'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
