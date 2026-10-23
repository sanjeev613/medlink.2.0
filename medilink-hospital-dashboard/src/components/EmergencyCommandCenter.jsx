import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Map markers
const incidentIcon = new L.DivIcon({
  className: 'custom-incident-marker',
  html: `<div style="background:#dc2626; width:22px; height:22px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 15px #dc2626; display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:bold;">🚨</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const ambulanceIcon = new L.DivIcon({
  className: 'custom-ambulance-marker',
  html: `<div style="background:#0284c7; width:26px; height:26px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 15px #0284c7; display:flex; align-items:center; justify-content:center; color:#fff; font-size:13px;">🚑</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

const hospitalIcon = new L.DivIcon({
  className: 'custom-hospital-marker',
  html: `<div style="background:#10b981; width:22px; height:22px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 10px #10b981; display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:bold;">🏥</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

function MapRecenter({ coords }) {
  const map = useMap();
  React.useEffect(() => {
    if (coords && coords.lat && coords.lng) {
      map.setView([coords.lat, coords.lng], 13);
    }
  }, [coords, map]);
  return null;
}

export default function EmergencyCommandCenter({
  incidents = [],
  activeIncident,
  onSelectIncident,
  onAssignHospital,
  onAdvanceAmbulance,
  onOverridePriority,
  loading
}) {
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overridePriority, setOverridePriority] = useState('HIGH');
  const [overrideReason, setOverrideReason] = useState('Airway secured by paramedic on scene');

  const selectedIncident = activeIncident || incidents[0] || null;

  const filteredIncidents = incidents.filter(inc => {
    if (priorityFilter !== 'ALL' && inc.triage?.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = inc.incidentId?.toLowerCase().includes(q);
      const matchName = inc.patientInfo?.name?.toLowerCase().includes(q);
      const matchAddr = inc.location?.address?.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchAddr) return false;
    }
    return true;
  });

  const waypoints = selectedIncident?.ambulance?.routeWaypoints || [];
  const polylineCoords = waypoints.map(wp => [wp.lat, wp.lng]);
  const currentAmbLoc = selectedIncident?.ambulance?.currentLocation || { lat: 13.0067, lng: 80.2036 };

  return (
    <div className="view" style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>
            📡 Real-Time Emergency Coordination Command Center
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Unified command monitoring: Patients, Ambulances, and Hospital Pre-Arrival Readiness
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className="pulse-dot green"></span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', fontFamily: 'monospace' }}>
            LIVE COORDINATION GRID ACTIVE
          </span>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {/* Priority Filter Pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                borderColor: priorityFilter === p ? (p === 'CRITICAL' ? '#dc2626' : '#0284c7') : 'var(--border)',
                background: priorityFilter === p ? (p === 'CRITICAL' ? 'rgba(220,38,38,0.2)' : 'rgba(2,132,199,0.2)') : 'var(--card)',
                color: priorityFilter === p ? '#fff' : 'var(--muted)'
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search Incident ID, Patient, Location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '8px 14px',
            color: '#fff',
            fontSize: '13px',
            minWidth: '280px'
          }}
        />
      </div>

      {/* Main Grid: Interactive Leaflet Map + Hospital Matching Cards */}
      <div className="grid-2" style={{ gap: '20px', marginBottom: '20px' }}>
        {/* Live Leaflet Map */}
        <div className="panel" style={{ background: 'var(--card)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🗺️</span> Live Emergency Tactical Map
            </div>
            <button
              disabled={loading}
              onClick={onAdvanceAmbulance}
              style={{
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                fontWeight: '700',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              title="Ping live ambulance GPS waypoint telemetry"
            >
              <span>📍</span> Ping Ambulance GPS
            </button>
          </div>

          <div style={{ height: '380px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <MapContainer
              center={[13.0300, 80.2280]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapRecenter coords={currentAmbLoc} />

              {/* Accident Incident Marker */}
              {selectedIncident && (
                <Marker position={[selectedIncident.location.latitude, selectedIncident.location.longitude]} icon={incidentIcon}>
                  <Popup>
                    <strong>🚨 Incident {selectedIncident.incidentId}</strong><br />
                    {selectedIncident.patientInfo?.name} ({selectedIncident.triage?.priority})<br />
                    {selectedIncident.location?.address}
                  </Popup>
                </Marker>
              )}

              {/* Moving Ambulance Marker */}
              <Marker position={[currentAmbLoc.latitude, currentAmbLoc.longitude]} icon={ambulanceIcon}>
                <Popup>
                  <strong>🚑 Ambulance Unit {selectedIncident?.ambulance?.ambulanceId}</strong><br />
                  Driver: {selectedIncident?.ambulance?.driverName}<br />
                  ETA to Hospital: ~{selectedIncident?.ambulance?.etaMinutes} mins
                </Popup>
              </Marker>

              {/* Destination Hospitals */}
              {selectedIncident?.hospitalMatching?.suggestedHospitals?.map((h, i) => (
                <Marker key={i} position={[h.latitude || 13.0569, h.longitude || 80.2525]} icon={hospitalIcon}>
                  <Popup>
                    <strong>🏥 {h.name}</strong><br />
                    {h.verifiedStatusLabel}<br />
                    ETA: ~{h.etaMinutes} mins ({h.distanceKm} km)<br />
                    Score: {h.totalScore}%
                  </Popup>
                </Marker>
              ))}

              {/* Road Polyline */}
              {polylineCoords.length > 0 && (
                <Polyline positions={polylineCoords} color="#0284c7" weight={4} dashArray="6, 8" />
              )}
            </MapContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '12px', color: '#94a3b8' }}>
            <span>📍 Incident: Guindy Flyover</span>
            <span>🛣️ Transit via Anna Salai / Mount Road</span>
            <span>🏥 Destination: Apollo Greams Road</span>
          </div>
        </div>

        {/* Phase 3: Intelligent Hospital Matching Engine */}
        <div className="panel" style={{ background: 'var(--card)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🧠</span> Multi-Factor Hospital Matching Engine
            </div>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>
              Weights: 35% Travel • 30% Capability • 20% Verified • 15% Ready
            </span>
          </div>

          {/* Top Recommended Hospitals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selectedIncident?.hospitalMatching?.suggestedHospitals?.map((hosp, idx) => {
              const isSelected = selectedIncident.hospitalMatching?.selectedHospital?.hospitalId === hosp.hospitalId;

              return (
                <div
                  key={idx}
                  style={{
                    background: isSelected ? 'rgba(2,132,199,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1.5px solid ${isSelected ? '#0284c7' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '10px',
                    padding: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                        #{idx + 1} {hosp.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Distance: <strong>{hosp.distanceKm} km</strong> • Travel ETA: <strong>~{hosp.etaMinutes} mins</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: idx === 0 ? '#10b981' : '#38bdf8' }}>
                        {hosp.totalScore}%
                      </div>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        color: hosp.availabilityVerified ? '#10b981' : '#f59e0b',
                        background: hosp.availabilityVerified ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {hosp.verifiedStatusLabel}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '8px' }}>
                    Capabilities: {hosp.keyCapabilities?.join(', ') || 'Level-1 Emergency'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                      {hosp.recommendationReason}
                    </span>

                    {isSelected ? (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7' }}>
                        ✓ SELECTED RECEIVING HOSPITAL
                      </span>
                    ) : (
                      <button
                        className="tiny-btn"
                        style={{ padding: '4px 12px', fontSize: '11px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        disabled={loading}
                        onClick={() => onAssignHospital(hosp)}
                      >
                        Select Hospital
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lower Row: Active Incidents Table + Live Audit Timeline */}
      <div className="grid-2" style={{ gap: '20px' }}>
        {/* Incidents Table */}
        <div className="panel" style={{ background: 'var(--card)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>
            🚨 Active Emergency Requests ({filteredIncidents.length})
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: '#94a3b8' }}>
                  <th style={{ padding: '8px' }}>Incident ID</th>
                  <th style={{ padding: '8px' }}>Patient</th>
                  <th style={{ padding: '8px' }}>Priority</th>
                  <th style={{ padding: '8px' }}>Status</th>
                  <th style={{ padding: '8px' }}>Ambulance</th>
                  <th style={{ padding: '8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((inc, i) => (
                  <tr
                    key={i}
                    onClick={() => onSelectIncident(inc)}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: selectedIncident?.incidentId === inc.incidentId ? 'rgba(2,132,199,0.1)' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <td style={{ padding: '8px', fontWeight: '700', color: '#fff' }}>{inc.incidentId}</td>
                    <td style={{ padding: '8px' }}>{inc.patientInfo?.name} ({inc.patientInfo?.bloodGroup})</td>
                    <td style={{ padding: '8px' }}>
                      <span className={`badge-priority ${inc.triage?.priority?.toLowerCase()}`}>
                        {inc.triage?.priority}
                      </span>
                    </td>
                    <td style={{ padding: '8px', color: '#fbbf24', fontWeight: '600' }}>{inc.status}</td>
                    <td style={{ padding: '8px' }}>{inc.ambulance?.ambulanceId} (~{inc.ambulance?.etaMinutes}m)</td>
                    <td style={{ padding: '8px' }}>
                      <button
                        className="tiny-btn"
                        style={{ fontSize: '10px', padding: '2px 6px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOverrideModalOpen(true);
                        }}
                      >
                        Override
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Timeline */}
        <div className="panel" style={{ background: 'var(--card)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border)', maxHeight: '350px', overflowY: 'auto' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📜</span> Real-Time Audit Trail & Coordination Events
          </div>

          <div>
            {selectedIncident?.timeline?.slice().reverse().map((ev, i) => (
              <div
                key={i}
                className={`timeline-event-card ${ev.status === 'SOS_ACTIVATED' ? 'critical' : ev.status === 'HOSPITAL_ACKNOWLEDGED' || ev.status === 'TEAM_READY' ? 'ready' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <strong style={{ fontSize: '12px', color: '#fff' }}>{ev.status}</strong>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>{ev.description}</div>
                <div style={{ fontSize: '10px', color: '#38bdf8', marginTop: '2px' }}>Actor: {ev.actor}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clinician Override Modal */}
      {overrideModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1f2937', padding: '24px', borderRadius: '14px', maxWidth: '420px', width: '90%', border: '1px solid #374151' }}>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>Override AI Triage Priority</h3>
            <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '15px' }}>
              Authorized emergency coordinator or clinician may override algorithm suggestions based on clinical inspection.
            </p>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>New Priority</label>
              <select
                value={overridePriority}
                onChange={(e) => setOverridePriority(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#111827', color: '#fff', border: '1px solid #4b5563' }}
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MODERATE">MODERATE</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Clinical Rationale</label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#111827', color: '#fff', border: '1px solid #4b5563' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                style={{ background: '#4b5563', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
                onClick={() => setOverrideModalOpen(false)}
              >
                Cancel
              </button>
              <button
                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                onClick={() => {
                  onOverridePriority(selectedIncident.incidentId, overridePriority, overrideReason);
                  setOverrideModalOpen(false);
                }}
              >
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
