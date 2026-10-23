const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, email, dateOfBirth, gender, ...otherData } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        firstName,
        lastName,
        email,
        dateOfBirth,
        gender,
        ...otherData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/user/medical-profile
 * @desc    Update medical profile
 * @access  Private
 */
router.put('/medical-profile', authenticate, async (req, res) => {
  try {
    const {
      bloodGroup,
      height,
      weight,
      medicalConditions,
      allergies,
      currentMedications,
      previousSurgeries
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        bloodGroup,
        height,
        weight,
        medicalConditions,
        allergies,
        currentMedications,
        previousSurgeries,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    res.json({ message: 'Medical profile updated successfully', user });
  } catch (error) {
    console.error('Update medical profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/user/device-token
 * @desc    Register device token for push notifications
 * @access  Private
 */
router.post('/device-token', authenticate, async (req, res) => {
  try {
    const { deviceToken } = req.body;

    if (!deviceToken) {
      return res.status(400).json({ message: 'Device token required' });
    }

    const user = await User.findById(req.userId);
    
    if (!user.deviceTokens.includes(deviceToken)) {
      user.deviceTokens.push(deviceToken);
      await user.save();
    }

    res.json({ message: 'Device token registered' });
  } catch (error) {
    console.error('Device token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/user/update-location
 * @desc    Update user location
 * @access  Private
 */
router.post('/update-location', authenticate, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude required' });
    }

    await User.findByIdAndUpdate(
      req.userId,
      {
        'lastKnownLocation.latitude': latitude,
        'lastKnownLocation.longitude': longitude,
        'lastKnownLocation.updatedAt': new Date()
      }
    );

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/user/health-summary
 * @desc    Get health summary dashboard
 * @access  Private
 */
router.get('/health-summary', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    const summary = {
      bloodGroup: user.bloodGroup,
      height: user.height,
      weight: user.weight,
      bmi: user.height && user.weight ? (user.weight / ((user.height / 100) ** 2)).toFixed(2) : null,
      medicalConditions: user.medicalConditions,
      allergies: user.allergies,
      currentMedications: user.currentMedications,
      recentLabReports: user.labReports.slice(-3),
      walletBalance: user.walletBalance,
      insurancePolicy: user.insurancePolicy
    };

    res.json(summary);
  } catch (error) {
    console.error('Health summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
