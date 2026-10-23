import React, { useState } from 'react';

export default function SFICDemoBanner({ incident, onStep, onReset, loading }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const currentStatus = incident?.status || 'SOS_ACTIVATED';

  // Compute clear step progress (1 through 11)
  const getStepDetails = () => {
    if (!incident) {
      return {
        step: 1,
        total: 11,
        label: 'SOS Activated (Guindy Accident)',
        nextAction: 'Confirm Receiving Hospital'
      };
    }
    const st = incident.status;
    const isAccepted = incident.hospitalMatching?.selectedHospital?.status === 'Accepted';
    const isTeamReady = incident.medicalTeam?.teamReady;
    const isTeamAssigned = incident.medicalTeam?.assigned;
    const waypoint = incident.ambulance?.waypointStep || 0;

    if (st === 'SOS_ACTIVATED' || st === 'REQUEST_RECEIVED') {
      return {
        step: 2,
        total: 11,
        label: 'Incident Logged & AI Triage Evaluated',
        nextAction: 'Confirm Hospital Match'
      };
    }
    if (st === 'HOSPITAL_NOTIFIED' && !isAccepted) {
      return {
        step: 3,
        total: 11,
        label: 'Apollo Notified — Awaiting ER Ack',
        nextAction: 'ER Lead Accepts Incident'
      };
    }
    if (isAccepted && !isTeamAssigned) {
      return {
        step: 4,
        total: 11,
        label: 'Accepted by Apollo — Team Pending',
        nextAction: 'Assign Trauma Team'
      };
    }
    if (isAccepted && !isTeamReady) {
      return {
        step: 5,
        total: 11,
        label: 'Team Assigned — Checklist In Progress',
        nextAction: 'Mark Trauma Bay READY'
      };
    }
    if (st === 'PATIENT_PICKED_UP' || st === 'AMBULANCE_EN_ROUTE') {
      const loc = incident.ambulance?.routeWaypoints?.[waypoint]?.label || 'Transit Corridor';
      const stepIdx = Math.min(6 + waypoint, 9);
      return {
        step: stepIdx,
        total: 11,
        label: `Ambulance: ${loc}`,
        nextAction: waypoint < 6 ? 'Advance Waypoint' : 'Confirm Patient Arrival'
      };
    }
    if (st === 'PATIENT_ARRIVED') {
      return {
        step: 10,
        total: 11,
        label: 'Patient Arrived at Apollo Trauma Bay',
        nextAction: 'Complete Emergency Case'
      };
    }
    if (st === 'EMERGENCY_COMPLETED') {
      return {
        step: 11,
        total: 11,
        label: 'Emergency Completed & Logged',
        nextAction: 'Reset Scenario'
      };
    }
    return {
      step: 1,
      total: 11,
      label: currentStatus,
      nextAction: 'Next Step'
    };
  };

  const { step, total, label, nextAction } = getStepDetails();
  const progressPct = Math.round((step / total) * 100);

  // Minimized Compact Pill Mode
  if (isMinimized) {
    return (
      <aside aria-label="Demo Controller Minimized" className="sfic-demo-dock-minimized">
        <div
          className="sfic-mini-pill"
          onClick={() => setIsMinimized(false)}
          title="Click to expand SFIC 2026 Interactive Demo Controller"
        >
          <span className="sfic-live-dot"></span>
          <span className="sfic-mini-title">SFIC Demo</span>
          <span className="sfic-mini-step">Step {step}/{total}</span>
          <button
            type="button"
            className="sfic-mini-action-btn"
            disabled={loading}
            onClick={(e) => {
              e.stopPropagation();
              onStep('next');
            }}
            title={`Advance: ${nextAction}`}
          >
            ⏩ Next
          </button>
          <button
            type="button"
            className="sfic-mini-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }}
            title="Expand Controls"
          >
            ⤢
          </button>
        </div>
      </aside>
    );
  }

  // Expanded Floating Glassmorphism Dock (Non-intrusive, no top row)
  return (
    <aside aria-label="Demo Controller" className="sfic-demo-dock-floating">
      <div className="sfic-dock-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="sfic-live-dot"></span>
          <span className="sfic-dock-badge">SFIC 2026 DEMO CONTROLLER</span>
          <span className="sfic-dock-theme">Swasth Bharat</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            className="sfic-dock-control-btn"
            onClick={() => setIsMinimized(true)}
            title="Minimize to floating pill"
          >
            —
          </button>
        </div>
      </div>

      <div className="sfic-dock-body">
        <div className="sfic-dock-meta-row">
          <div className="sfic-dock-step-tag">
            Step {step} of {total}
          </div>
          <div className="sfic-dock-status-tag">
            {currentStatus}
          </div>
          {incident && (
            <span className="sfic-dock-inc-id">
              {incident.incidentId}
            </span>
          )}
        </div>

        <div className="sfic-dock-label" title={label}>
          {label}
        </div>

        <div className="sfic-dock-progress-track">
          <div
            className="sfic-dock-progress-fill"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>

        <div className="sfic-dock-actions">
          <button
            type="button"
            className="sfic-dock-btn-primary"
            disabled={loading}
            onClick={() => onStep('next')}
            title="Advance scenario automatically to next milestone"
          >
            <span>⏩</span>
            <span>{loading ? 'Advancing...' : nextAction}</span>
          </button>

          <button
            type="button"
            className="sfic-dock-btn-ghost"
            disabled={loading}
            onClick={onReset}
            title="Reset simulation to initial Guindy accident state"
          >
            <span>🔄</span>
            <span>Reset</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
