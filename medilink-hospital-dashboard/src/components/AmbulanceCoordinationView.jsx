import React from 'react';

export default function AmbulanceCoordinationView({
  incident,
  onStatusChange,
  onAdvanceAmbulance,
  loading
}) {
  if (!incident) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
        <h3>🚑 No Active Ambulance Dispatches</h3>
        <p>Ambulance fleet standing by at base stations.</p>
      </div>
    );
  }

  const amb = incident.ambulance || {};
  const patient = incident.patientInfo || {};
  const hosp = incident.hospitalMatching?.selectedHospital || {};
  const isTeamReady = incident.medicalTeam?.teamReady;
  const currentStep = amb.waypointStep || 0;
  const waypoints = amb.routeWaypoints || [];
  const currentWaypoint = waypoints[currentStep] || waypoints[0];

  const statuses = [
    'AVAILABLE',
    'ASSIGNED',
    'EN_ROUTE',
    'PATIENT_PICKED_UP',
    'TRANSPORTING',
    'ARRIVED'
  ];

  return (
    <div className="view" style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>
            🚑 Smart Ambulance Coordination & Navigation Portal
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Unit: <strong>{amb.ambulanceId}</strong> • Vehicle: <strong>{amb.vehicleNumber}</strong> • Driver: <strong>{amb.driverName} ({amb.driverPhone})</strong>
          </p>
        </div>

        {/* Destination Hospital Readiness Status */}
        <div style={{
          background: isTeamReady ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
          border: `1.5px solid ${isTeamReady ? '#10b981' : '#f59e0b'}`,
          padding: '10px 16px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>{isTeamReady ? '🏥' : '⏳'}</span>
          <div>
            <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700' }}>
              Receiving ER Readiness
            </div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: isTeamReady ? '#34d399' : '#fbbf24' }}>
              {isTeamReady ? `${hosp.name || 'Hospital'}: TRAUMA BAY READY` : `${hosp.name || 'Hospital'}: PREPARING TEAM...`}
            </div>
          </div>
        </div>
      </div>

      {/* Ambulance Status Selector */}
      <div className="panel" style={{ background: 'var(--card)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border)', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase' }}>
          Ambulance Operational Status
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {statuses.map(s => {
            const isActive = amb.status === s;
            return (
              <button
                key={s}
                disabled={loading}
                onClick={() => onStatusChange(s)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '12px',
                  background: isActive ? (s === 'ARRIVED' ? '#10b981' : '#0284c7') : 'rgba(255,255,255,0.03)',
                  borderColor: isActive ? '#38bdf8' : 'rgba(255,255,255,0.1)',
                  color: isActive ? '#fff' : '#9ca3af',
                  boxShadow: isActive ? '0 0 12px rgba(2,132,199,0.4)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {isActive ? '✓ ' : ''}{s.replace(/_/g, ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Turn Navigation & Route Telemetry */}
      <div className="grid-2" style={{ gap: '20px' }}>
        {/* Navigation Directions */}
        <div className="panel" style={{ background: 'var(--card)', borderRadius: '14px', padding: '20px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🧭</span> Turn-by-Turn Route Navigation
            </div>
            <button
              disabled={loading || currentStep >= waypoints.length - 1}
              onClick={onAdvanceAmbulance}
              style={{
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                fontWeight: '700',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              title="Record arrival at next road checkpoint"
            >
              <span>📍</span> Update Route Checkpoint
            </button>
          </div>

          <div style={{ background: '#111827', padding: '16px', borderRadius: '10px', border: '1px solid #374151', marginBottom: '15px' }}>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700', textTransform: 'uppercase' }}>
              Current Position (Step {currentStep + 1} of {waypoints.length})
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: '6px 0' }}>
              📍 {currentWaypoint?.label || 'Navigating Anna Salai'}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              GPS: {amb.currentLocation?.latitude?.toFixed(4)}, {amb.currentLocation?.longitude?.toFixed(4)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '15px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Distance Remaining</span>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#38bdf8' }}>
                {amb.distanceRemainingKm || 0} km
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Estimated Transit Time</span>
              <div style={{ fontSize: '22px', fontWeight: '800', color: amb.etaMinutes <= 3 ? '#ef4444' : '#fbbf24' }}>
                ~{amb.etaMinutes || 0} mins
              </div>
            </div>
          </div>

          {/* Waypoint list */}
          <div>
            <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
              Corridor Waypoints:
            </span>
            {waypoints.map((wp, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  fontSize: '12px',
                  background: idx === currentStep ? 'rgba(2,132,199,0.15)' : idx < currentStep ? 'rgba(16,185,129,0.08)' : 'transparent',
                  color: idx === currentStep ? '#38bdf8' : idx < currentStep ? '#10b981' : '#94a3b8',
                  fontWeight: idx === currentStep ? '700' : '400'
                }}
              >
                <span>{idx < currentStep ? '✓' : idx === currentStep ? '🚑' : '○'}</span>
                <span>{wp.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Patient On-Board Critical Data */}
        <div className="panel" style={{ background: 'var(--card)', borderRadius: '14px', padding: '20px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📋</span> Patient Transport Critical Sheet
          </div>

          <div style={{ background: 'rgba(220,38,38,0.1)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(220,38,38,0.3)', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{patient.name}</div>
                <div style={{ fontSize: '12px', color: '#fca5a5' }}>Blood Group: <strong style={{ fontSize: '16px' }}>{patient.bloodGroup}</strong></div>
              </div>
              <span className="badge-priority critical">CRITICAL TRAUMA</span>
            </div>
          </div>

          <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '15px' }}>
            <p>🚨 <strong>Mechanism:</strong> {incident.triage?.accidentDetails || 'Road traffic collision'}</p>
            <p>🩸 <strong>Allergies:</strong> {patient.allergies?.join(', ') || 'None reported'}</p>
            <p>🩺 <strong>Emergency Contact:</strong> {patient.emergencyContact?.name} ({patient.emergencyContact?.phone})</p>
          </div>

          <div style={{ background: '#111827', padding: '14px', borderRadius: '8px', border: '1px solid #374151' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8', marginBottom: '6px' }}>
              Hospital Reception Instructions:
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0 }}>
              Hospital ER confirmed Level-1 Trauma Bay 1 readiness. Direct ramp access via Greams Lane Gate 2. Attending Surgeon: <strong>{incident.medicalTeam?.leadDoctor || 'Trauma Lead'}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
