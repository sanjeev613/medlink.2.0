const request = require('supertest');
const app = require('../server');
const { evaluateTriage } = require('../services/triageEngine');
const { matchHospitals, calculateDistance } = require('../services/matchingEngine');

describe('MediLink AI 2.0 - Emergency Coordination Test Suite', () => {
  test('Triage Engine: Severe trauma & bleeding triggers CRITICAL priority', () => {
    const triage = evaluateTriage({
      emergencyType: 'Accident',
      symptoms: ['Chest impact', 'Severe bleeding'],
      consciousness: 'Pain Responsive',
      breathingDifficulty: true,
      severeBleeding: true
    });

    expect(triage.priority).toBe('CRITICAL');
    expect(triage.warningSigns.length).toBeGreaterThan(0);
    expect(triage.disclaimer).toContain('EXPERIMENTAL DECISION SUPPORT ONLY');
  });

  test('Triage Engine: Mild case triggers MODERATE or LOW', () => {
    const triage = evaluateTriage({
      emergencyType: 'Accident',
      symptoms: ['Bruise on arm'],
      consciousness: 'Alert',
      breathingDifficulty: false,
      severeBleeding: false
    });

    expect(['LOW', 'MODERATE']).toContain(triage.priority);
  });

  test('Matching Engine: Ranks hospitals and flags unverified availability', () => {
    const res = matchHospitals({
      patientLat: 13.0067,
      patientLng: 80.2036,
      emergencyType: 'Accident',
      priority: 'CRITICAL'
    });

    expect(res.recommendations.length).toBeGreaterThan(0);
    const top = res.recommendations[0];
    expect(top.totalScore).toBeGreaterThan(0);
    expect(top.distanceKm).toBeDefined();
    expect(top.etaMinutes).toBeDefined();

    // Check that at least one hospital is marked with verification status
    const verifiedHosp = res.recommendations.find(h => h.availabilityVerified === true);
    expect(verifiedHosp).toBeDefined();
    expect(verifiedHosp.verifiedStatusLabel).toContain('Verified live');
  });

  test('POST /api/emergency/sos creates a new emergency incident', async () => {
    const res = await request(app)
      .post('/api/emergency/sos')
      .send({
        idempotencyKey: 'TEST-IDEMP-001',
        latitude: 13.0067,
        longitude: 80.2036,
        address: 'Guindy Flyover, Chennai',
        emergencyType: 'Accident',
        severeBleeding: true,
        breathingDifficulty: true,
        consciousness: 'Pain Responsive',
        patientInfo: {
          name: 'Karthik Ramanathan',
          bloodGroup: 'O+',
          allergies: ['Penicillin']
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.incident.incidentId).toBeDefined();
    expect(res.body.incident.triage.priority).toBe('CRITICAL');
    expect(res.body.incident.status).toBe('SOS_ACTIVATED');
  });

  test('POST /api/emergency/sos handles deduplication gracefully', async () => {
    const res = await request(app)
      .post('/api/emergency/sos')
      .send({
        idempotencyKey: 'TEST-IDEMP-001',
        latitude: 13.0067,
        longitude: 80.2036
      });

    expect(res.status).toBe(200);
    expect(res.body.isDuplicate).toBe(true);
  });

  test('PATCH /api/emergency/incidents/:id/status updates status and timeline', async () => {
    const incId = 'INC-2026-CH01';
    const res = await request(app)
      .patch(`/api/emergency/incidents/${incId}/status`)
      .send({
        status: 'AMBULANCE_ASSIGNED',
        actor: 'Dispatcher',
        note: 'Ambulance Unit AMB-09 assigned'
      });

    expect(res.status).toBe(200);
    expect(res.body.incident.status).toBe('AMBULANCE_ASSIGNED');
    const lastTimeline = res.body.incident.timeline.slice(-1)[0];
    expect(lastTimeline.status).toBe('AMBULANCE_ASSIGNED');
  });

  test('POST /api/emergency/incidents/:id/hospital-ack records ER response', async () => {
    const incId = 'INC-2026-CH01';
    const res = await request(app)
      .post(`/api/emergency/incidents/${incId}/hospital-ack`)
      .send({
        decision: 'Accepted',
        hospitalName: 'Apollo Speciality Hospital'
      });

    expect(res.status).toBe(200);
    expect(res.body.incident.status).toBe('HOSPITAL_ACKNOWLEDGED');
  });

  test('POST /api/emergency/incidents/:id/ambulance-step advances simulation', async () => {
    const incId = 'INC-2026-CH01';
    const res = await request(app)
      .post(`/api/emergency/incidents/${incId}/ambulance-step`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.waypointStep).toBeGreaterThan(0);
  });

  test('GET /api/emergency/analytics returns measurable SFIC baseline comparison', async () => {
    const res = await request(app)
      .get('/api/emergency/analytics');

    expect(res.status).toBe(200);
    expect(res.body.analytics.baselineComparison.length).toBeGreaterThan(0);
    expect(res.body.analytics.responseTimes).toBeDefined();
  });
});
