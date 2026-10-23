const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const EmergencySOS = require('../models/EmergencySOS');
const { authenticateHospital } = require('../middleware/auth');

/**
 * @route   GET /api/hospital/list
 * @desc    Get list of hospitals (public)
 * @access  Public
 */
router.get('/list', async (req, res) => {
  try {
    const { city, latitude, longitude, radiusKm } = req.query;

    let query = { isActive: true };

    if (city) {
      query.city = new RegExp(city, 'i');
    }

    const hospitals = await Hospital.find(query).select('-apiSecret');

    // If location provided, calculate distance
    if (latitude && longitude) {
      const filtered = hospitals
        .map(h => ({
          ...h.toObject(),
          distance: calculateDistance(latitude, longitude, h.latitude, h.longitude)
        }))
        .filter(h => !radiusKm || h.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      return res.json(filtered);
    }

    res.json(hospitals);
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/hospital/:hospitalId
 * @desc    Get hospital details
 * @access  Public
 */
router.get('/:hospitalId', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.hospitalId)
      .populate('networkHospitals', 'name city')
      .select('-apiSecret');

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    res.json(hospital);
  } catch (error) {
    console.error('Get hospital error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/hospital/emergency-alert
 * @desc    Receive emergency alert (from backend SOS service)
 * @access  Private
 */
router.post('/emergency-alert', authenticateHospital, async (req, res) => {
  try {
    const { sosId, patientName, patientPhone, location, estimatedArrivalTime, medicalData } = req.body;

    const sos = await EmergencySOS.findById(sosId);

    if (!sos) {
      return res.status(404).json({ message: 'SOS not found' });
    }

    // Update SOS with hospital notification status
    sos.hospitalReceivedAt = new Date();
    sos.notificationsSent.push({
      type: 'HospitalAlert',
      sentAt: new Date()
    });
    sos.status = 'Hospital_Alert_Sent';
    await sos.save();

    // In production: Send notification to hospital staff via Firebase/SMS
    console.log(`🏥 Emergency Alert for ${sos.selectedHospitalName}: ${patientName}`);

    res.json({ message: 'Hospital alert received and processed' });
  } catch (error) {
    console.error('Emergency alert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/hospital/respond-emergency/:sosId
 * @desc    Hospital accepts or rejects emergency
 * @access  Private
 */
router.post('/respond-emergency/:sosId', authenticateHospital, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const sos = await EmergencySOS.findById(req.params.sosId);

    if (!sos) {
      return res.status(404).json({ message: 'SOS not found' });
    }

    if (status === 'Accepted') {
      sos.hospitalResponseStatus = 'Accepted';
      sos.hospitalAcceptedAt = new Date();
      sos.status = 'Ambulance_Assigned'; // Can now send data
    } else {
      sos.hospitalResponseStatus = 'Rejected';
      sos.hospitalRejectionReason = rejectionReason;
    }

    await sos.save();

    res.json({
      message: `Emergency ${status.toLowerCase()} successfully`,
      sos
    });
  } catch (error) {
    console.error('Respond emergency error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/hospital/emergencies
 * @desc    Get active emergencies for hospital
 * @access  Private
 */
router.get('/emergencies/active', authenticateHospital, async (req, res) => {
  try {
    const hospitalId = req.hospitalId; // from token

    const emergencies = await EmergencySOS.find({
      selectedHospitalId: hospitalId,
      status: { $nin: ['Completed', 'Cancelled'] },
      hospitalResponseStatus: { $in: ['Pending', 'Accepted'] }
    })
      .populate('userId', 'firstName lastName phoneNumber')
      .sort({ createdAt: -1 });

    res.json(emergencies);
  } catch (error) {
    console.error('Get emergencies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/hospital/emergency/:sosId/update-status
 * @desc    Update emergency status
 * @access  Private
 */
router.put('/emergency/:sosId/update-status', authenticateHospital, async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['In_Transit', 'Arrived', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const sos = await EmergencySOS.findByIdAndUpdate(
      req.params.sosId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    res.json({ message: 'Emergency status updated', sos });
  } catch (error) {
    console.error('Update emergency status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
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
