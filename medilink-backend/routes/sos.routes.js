const express = require('express');
const router = express.Router();
const EmergencySOS = require('../models/EmergencySOS');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const { authenticate } = require('../middleware/auth');
const axios = require('axios');

/**
 * @route   POST /api/sos/activate
 * @desc    Activate SOS emergency and dispatch ambulance
 * @access  Private
 */
router.post('/activate', authenticate, async (req, res) => {
  try {
    const { emergencyType, description, latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Location coordinates required' });
    }

    // Get user information
    const user = await User.findById(req.userId);

    // Create SOS record
    const sos = new EmergencySOS({
      userId: req.userId,
      emergencyType: emergencyType || 'Medical',
      description,
      latitude,
      longitude,
      address,
      status: 'Initiated',
      patientName: `${user.firstName} ${user.lastName}`,
      patientAge: new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear(),
      patientBloodGroup: user.bloodGroup,
      allergies: user.allergies,
      currentMedications: user.currentMedications.map(m => m.name)
    });

    await sos.save();

    // Find nearest hospital within 15km
    const nearestHospitals = await findNearestHospitals(latitude, longitude, 15);
    
    if (nearestHospitals.length === 0) {
      return res.status(404).json({
        message: 'No hospitals found within acceptable range',
        sos: sos
      });
    }

    const selectedHospital = nearestHospitals[0];

    // Assign ambulance (simulate)
    sos.ambulanceId = '60d5ec49c1234567890abcde'; // Simulated ID
    sos.ambulanceDriverName = 'Rajesh Kumar';
    sos.ambulanceDriverPhone = '+91-9876543210';
    sos.ambulanceLicense = 'TN-09-AB-1234';
    sos.estimatedArrivalTime = Math.ceil(Math.random() * 10) + 5; // 5-15 minutes
    
    // Select hospital
    sos.selectedHospitalId = selectedHospital._id;
    sos.selectedHospitalName = selectedHospital.name;
    sos.hospitalLatitude = selectedHospital.latitude;
    sos.hospitalLongitude = selectedHospital.longitude;
    sos.estimatedReachTime = Math.ceil(calculateDistance(latitude, longitude, selectedHospital.latitude, selectedHospital.longitude) / 60); // Assuming 60km/hr
    
    sos.status = 'Ambulance_Assigned';
    await sos.save();

    // Send real-time alert to hospital
    try {
      await axios.post(
        `${process.env.HOSPITAL_NOTIFICATION_URL}/emergency-alert`,
        {
          sosId: sos._id,
          patientName: sos.patientName,
          patientPhone: user.phoneNumber,
          location: { latitude, longitude, address },
          estimatedArrivalTime: sos.estimatedReachTime,
          medicalData: {
            bloodGroup: user.bloodGroup,
            allergies: user.allergies,
            medicalConditions: user.medicalConditions
          }
        },
        { timeout: 3000 }
      );
    } catch (error) {
      console.error('Hospital notification failed:', error);
      // Continue despite notification failure
    }

    res.json({
      message: 'SOS activated successfully',
      sos: {
        sosId: sos._id,
        status: sos.status,
        ambulance: {
          driverName: sos.ambulanceDriverName,
          phone: sos.ambulanceDriverPhone,
          estimatedArrival: sos.estimatedArrivalTime
        },
        hospital: {
          name: sos.selectedHospitalName,
          address: selectedHospital.address,
          phone: selectedHospital.phoneNumber,
          estimatedReach: sos.estimatedReachTime
        }
      }
    });
  } catch (error) {
    console.error('Activate SOS error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/sos/status/:sosId
 * @desc    Get SOS status updates
 * @access  Private
 */
router.get('/status/:sosId', authenticate, async (req, res) => {
  try {
    const sos = await EmergencySOS.findById(req.params.sosId);

    if (!sos) {
      return res.status(404).json({ message: 'SOS not found' });
    }

    if (sos.userId.toString() !== req.userId && sos.selectedHospitalId) {
      // Check if request is from authorized hospital
    }

    res.json({
      sosId: sos._id,
      status: sos.status,
      ambulance: {
        name: sos.ambulanceDriverName,
        phone: sos.ambulanceDriverPhone,
        location: sos.ambulanceLocation,
        estimatedArrival: sos.estimatedArrivalTime
      },
      hospital: {
        name: sos.selectedHospitalName,
        responseStatus: sos.hospitalResponseStatus,
        estimatedReach: sos.estimatedReachTime
      },
      timeline: {
        activatedAt: sos.activatedAt,
        ambulanceArrivedAt: sos.ambulanceArrivedAt,
        completedAt: sos.completedAt
      }
    });
  } catch (error) {
    console.error('Get SOS status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/sos/cancel/:sosId
 * @desc    Cancel active SOS
 * @access  Private
 */
router.post('/cancel/:sosId', authenticate, async (req, res) => {
  try {
    const sos = await EmergencySOS.findById(req.params.sosId);

    if (!sos) {
      return res.status(404).json({ message: 'SOS not found' });
    }

    if (sos.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (['Completed', 'Cancelled'].includes(sos.status)) {
      return res.status(400).json({ message: 'Cannot cancel completed or already cancelled SOS' });
    }

    sos.status = 'Cancelled';
    await sos.save();

    res.json({ message: 'SOS cancelled successfully' });
  } catch (error) {
    console.error('Cancel SOS error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/sos/history
 * @desc    Get user's SOS history
 * @access  Private
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const sos = await EmergencySOS.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(sos);
  } catch (error) {
    console.error('Get SOS history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to find nearest hospitals
async function findNearestHospitals(latitude, longitude, radiusKm) {
  const hospitals = await Hospital.find({
    isActive: true,
    isAcceptingEmergencies: true
  });

  const filtered = hospitals
    .map(h => ({
      ...h.toObject(),
      distance: calculateDistance(latitude, longitude, h.latitude, h.longitude)
    }))
    .filter(h => h.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);

  return filtered;
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = router;
