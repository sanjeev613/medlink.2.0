const fs = require('fs');
const path = require('path');

// Haversine formula for distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

// Estimate travel time in minutes based on urban traffic average (approx 30 km/h)
function estimateTravelTime(distanceKm) {
  const baseMinutes = (distanceKm / 30) * 60;
  const buffer = 2; // Traffic / signal buffer
  return Math.max(3, Math.round(baseMinutes + buffer));
}

/**
 * Hospital Matching Algorithm
 * Weights:
 * - 35% Travel Time Suitability
 * - 30% Medical Capability Match
 * - 20% Verified Availability
 * - 15% Emergency Readiness
 */
function matchHospitals({
  patientLat,
  patientLng,
  emergencyType = 'Accident',
  priority = 'CRITICAL',
  customWeights = null,
  candidateHospitals = null
}) {
  const weights = customWeights || {
    travelTime: 0.35,
    capability: 0.30,
    availability: 0.20,
    readiness: 0.15
  };

  // Load candidate hospitals if not supplied
  let hospitals = candidateHospitals;
  if (!hospitals || hospitals.length === 0) {
    try {
      const seedFile = path.join(__dirname, '../data/seed_hospitals.json');
      hospitals = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
    } catch (e) {
      hospitals = [];
    }
  }

  const scoredHospitals = hospitals.map(h => {
    const distanceKm = calculateDistance(patientLat, patientLng, h.latitude, h.longitude);
    const etaMinutes = estimateTravelTime(distanceKm);

    // 1. Travel Time Score (0-100): Faster ETA gets higher score
    // 5 mins -> ~95, 10 mins -> ~85, 20 mins -> ~60, 30+ mins -> ~30
    const travelTimeScore = Math.max(10, Math.min(100, Math.round(105 - (etaMinutes * 2.5))));

    // 2. Capability Score (0-100) based on emergency type
    let capabilityScore = 60;
    const keyCapabilities = [];
    const typeLower = (emergencyType || '').toLowerCase();

    if (h.isLevel1Trauma) {
      capabilityScore += 25;
      keyCapabilities.push('Level 1 Trauma Center');
    }
    if (h.hasBloodBank) {
      capabilityScore += 10;
      keyCapabilities.push('24/7 Blood Bank');
    }
    if (typeLower.includes('cardiac') && h.hasCathLab) {
      capabilityScore += 20;
      keyCapabilities.push('Active 24/7 Cath Lab');
    }
    if (typeLower.includes('accident') || typeLower.includes('trauma')) {
      if (h.hasNeuroICU) {
        capabilityScore += 10;
        keyCapabilities.push('Dedicated Neuro ICU');
      }
    }
    if (typeLower.includes('burn') && h.hasBurnUnit) {
      capabilityScore += 20;
      keyCapabilities.push('Specialized Burn ICU');
    }
    capabilityScore = Math.min(100, capabilityScore);

    // 3. Verified Availability Score (0-100)
    // CRITICAL REQUIREMENT: Do NOT invent fake verified data!
    let availabilityScore = 30; // Unverified baseline
    if (h.availabilityVerified) {
      availabilityScore = (h.availableICUBeds && h.availableICUBeds > 0) ? 95 : 60;
    }

    // 4. Emergency Readiness Score (0-100)
    let readinessScore = 50;
    if (h.readinessStatus === 'Ready') readinessScore = 95;
    else if (h.readinessStatus === 'Normal') readinessScore = 75;
    else if (h.readinessStatus === 'Constrained') readinessScore = 40;

    // Total Weighted Score
    const totalScore = parseFloat((
      (travelTimeScore * weights.travelTime) +
      (capabilityScore * weights.capability) +
      (availabilityScore * weights.availability) +
      (readinessScore * weights.readiness)
    ).toFixed(2));

    let recommendationReason = '';
    if (h.isLevel1Trauma && travelTimeScore >= 80) {
      recommendationReason = `Optimal Level-1 trauma capability within rapid ${etaMinutes} min travel window.`;
    } else if (h.isLevel1Trauma) {
      recommendationReason = `Comprehensive tertiary trauma facilities (${etaMinutes} min transit).`;
    } else {
      recommendationReason = `Secondary care hospital nearby for rapid stabilization.`;
    }

    return {
      hospitalId: h.id || h._id,
      name: h.name,
      city: h.city,
      address: h.address,
      phone: h.phoneNumber || h.emergencyHotline,
      emergencyHotline: h.emergencyHotline,
      latitude: h.latitude,
      longitude: h.longitude,
      distanceKm,
      etaMinutes,
      travelTimeScore,
      capabilityScore,
      availabilityScore,
      readinessScore,
      totalScore,
      availabilityVerified: Boolean(h.availabilityVerified),
      verifiedStatusLabel: h.availabilityVerified ? 'Verified live by hospital staff' : 'Availability not verified',
      readinessStatus: h.readinessStatus || 'Normal',
      availableICUBeds: h.availableICUBeds,
      keyCapabilities,
      recommendationReason
    };
  });

  // Sort descending by totalScore and return top 3
  scoredHospitals.sort((a, b) => b.totalScore - a.totalScore);
  const topThree = scoredHospitals.slice(0, 3);

  return {
    weights,
    matchedCount: scoredHospitals.length,
    recommendations: topThree,
    explanation: 'Scored via configurable multi-factor algorithm prioritizing transit safety, trauma capability match, and verified hospital operational readiness.',
    disclaimer: 'Hospital readiness data reflects reported hospital availability. Actual bed assignment confirmed upon hospital acceptance.'
  };
}

module.exports = {
  calculateDistance,
  estimateTravelTime,
  matchHospitals
};
