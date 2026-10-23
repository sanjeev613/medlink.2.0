const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// OTP storage (in production, use Redis or database)
const otpStorage = {};

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to Aadhaar linked phone number
 * @access  Public
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { aadhaarNumber, phoneNumber } = req.body;

    if (!aadhaarNumber || !phoneNumber) {
      return res.status(400).json({ message: 'Aadhaar and phone number required' });
    }

    // Validate Aadhaar and phone number format
    if (!/^\d{12}$/.test(aadhaarNumber) || !/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid Aadhaar or phone number format' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiry (5 minutes)
    otpStorage[phoneNumber] = {
      otp,
      aadhaarNumber,
      expiresAt: Date.now() + 5 * 60 * 1000
    };

    // In production: Send OTP via SMS gateway (Twilio, AWS SNS, etc.)
    console.log(`📱 OTP for ${phoneNumber}: ${otp}`);

    res.json({
      message: 'OTP sent successfully',
      demo_otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and authenticate user
 * @access  Public
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp, role } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP required' });
    }

    // Verify OTP
    const otpData = otpStorage[phoneNumber];
    if (!otpData) {
      return res.status(400).json({ message: 'No OTP found. Please request new OTP.' });
    }

    if (Date.now() > otpData.expiresAt) {
      delete otpStorage[phoneNumber];
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if user exists
    let user = await User.findOne({ phoneNumber });

    if (!user) {
      // Create new user with default values
      user = new User({
        phoneNumber,
        aadhaarNumber: otpData.aadhaarNumber,
        aadhaarVerified: true,
        firstName: 'User',
        lastName: '',
        gender: 'Not Specified',
        bloodGroup: 'Not Specified',
        role: role || 'patient',
        walletBalance: 5000
      });
      await user.save();
    } else if (role) {
      // Update role if provided and user exists
      user.role = role;
      await user.save();
    }

    // Clean up OTP
    delete otpStorage[phoneNumber];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, phoneNumber: user.phoneNumber, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Authentication successful',
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        profileComplete: !!(user.firstName && user.lastName)
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/auth/verify-token
 * @desc    Verify JWT token
 * @access  Private
 */
router.get('/verify-token', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, userId: decoded.userId });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  }
});

module.exports = router;
