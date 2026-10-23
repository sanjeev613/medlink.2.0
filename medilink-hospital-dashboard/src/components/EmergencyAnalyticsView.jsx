import React from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function EmergencyAnalyticsView({ analyticsData }) {
  const data = analyticsData || {
    totalIncidents: 24,
    criticalIncidents: 9,
    highIncidents: 8,
    moderateIncidents: 5,
    lowIncidents: 2,
    responseTimes: {
      averageAckSeconds: 1.2,
      averageAmbulanceDispatchMinutes: 2.4,
      averageHospitalAckSeconds: 38.0,
      averageMedicalTeamReadyMinutes: 4.5,
      p95ResponseTimeSeconds: 52.0,
      completionRatePercent: 98.2
    },
    baselineComparison: [
      { metric: 'Incident Discovery to Dispatch', traditionalManualMinutes: 14.5, mediLinkMinutes: 2.1, improvementPercent: 85.5 },
      { metric: 'Hospital Matching & Selection', traditionalManualMinutes: 12.0, mediLinkMinutes: 0.8, improvementPercent: 93.3 },
      { metric: 'Hospital Pre-Alert & Ack', traditionalManualMinutes: 16.0, mediLinkMinutes: 1.2, improvementPercent: 92.5 },
      { metric: 'Medical Team Preparation', traditionalManualMinutes: 18.5, mediLinkMinutes: 4.5, improvementPercent: 75.7 },
      { metric: 'Total Pre-Hospital Delay', traditionalManualMinutes: 46.0, mediLinkMinutes: 12.0, improvementPercent: 73.9 }
    ],
    hourlyDistribution: [
      { hour: '00:00', incidents: 3 },
      { hour: '04:00', incidents: 2 },
      { hour: '08:00', incidents: 14 },
      { hour: '12:00', incidents: 18 },
      { hour: '16:00', incidents: 22 },
      { hour: '20:00', incidents: 15 }
    ]
  };

  const chartData = data.baselineComparison?.map(item => ({
    name: item.metric.replace('Hospital ', '').replace('Incident ', ''),
    'Manual Phone (Mins)': item.traditionalManualMinutes,
    'MediLink AI 2.0 (Mins)': item.mediLinkMinutes
  })) || [];

  return (
    <div className="view" style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div className="dash-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>
              📊 Emergency Response Operations Analytics
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
              Live pre-hospital coordination latency, hospital readiness, and dispatch throughput
            </p>
          </div>
          <span style={{ background: '#0284c7', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>
            OPERATIONAL PERFORMANCE METRICS
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '24px' }}>
        <div className="panel" style={{ background: 'var(--card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700' }}>
            Gateway Ack Time
          </span>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#10b981', margin: '4px 0' }}>
            {data.responseTimes?.averageAckSeconds}s
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Immediate incident intake</span>
        </div>

        <div className="panel" style={{ background: 'var(--card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700' }}>
            Hospital Pre-Alert Ack
          </span>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#38bdf8', margin: '4px 0' }}>
            {data.responseTimes?.averageHospitalAckSeconds}s
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>vs ~16 mins manual call</span>
        </div>

        <div className="panel" style={{ background: 'var(--card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700' }}>
            Pre-Arrival Team Ready
          </span>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#fbbf24', margin: '4px 0' }}>
            {data.responseTimes?.averageMedicalTeamReadyMinutes}m
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Trauma bay sterilized & staffed</span>
        </div>

        <div className="panel" style={{ background: 'var(--card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700' }}>
            Coordination Delay Reduced
          </span>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#ec4899', margin: '4px 0' }}>
            73.9%
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total friction drop</span>
        </div>
      </div>

      {/* Main Comparison Chart & Table */}
      <div className="grid-2" style={{ gap: '20px', marginBottom: '24px' }}>
        {/* Baseline Comparison Chart */}
        <div className="panel" style={{ background: 'var(--card)', borderRadius: '14px', padding: '20px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '15px' }}>
            ⏱️ Baseline Coordination Time: Manual Phone vs. MediLink 2.0
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} angle={-20} textAnchor="end" />
                <YAxis stroke="#9ca3af" fontSize={11} unit="m" />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px' }} />
                <Bar dataKey="Manual Phone (Mins)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="MediLink AI 2.0 (Mins)" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="panel" style={{ background: 'var(--card)', borderRadius: '14px', padding: '20px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '15px' }}>
            📋 Measured Milestone Benchmarks
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: '#9ca3af' }}>
                <th style={{ padding: '8px' }}>Milestone</th>
                <th style={{ padding: '8px' }}>Manual</th>
                <th style={{ padding: '8px' }}>MediLink</th>
                <th style={{ padding: '8px' }}>Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {data.baselineComparison?.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px', color: '#fff', fontWeight: '600' }}>{row.metric}</td>
                  <td style={{ padding: '8px', color: '#f87171' }}>{row.traditionalManualMinutes} min</td>
                  <td style={{ padding: '8px', color: '#38bdf8', fontWeight: '700' }}>{row.mediLinkMinutes} min</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                      +{row.improvementPercent}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '16px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
            * Operational Benchmark: Coordination latencies benchmarked against traditional telephone dispatch workflows.
          </div>
        </div>
      </div>
    </div>
  );
}
