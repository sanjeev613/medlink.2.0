const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const axios = require('axios');

/**
 * @route   POST /api/medical/upload-report
 * @desc    Upload medical report/lab result
 * @access  Private
 */
router.post('/upload-report', authenticate, async (req, res) => {
  try {
    const { reportName, date, fileUrl, description } = req.body;

    if (!reportName || !fileUrl) {
      return res.status(400).json({ message: 'Report name and file URL required' });
    }

    const user = await User.findById(req.userId);
    user.labReports.push({
      reportName,
      date: date || new Date(),
      fileUrl,
      description
    });
    await user.save();

    res.json({ message: 'Report uploaded successfully', report: user.labReports[user.labReports.length - 1] });
  } catch (error) {
    console.error('Upload report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/medical/add-prescription
 * @desc    Add prescription to medical records
 * @access  Private
 */
router.post('/add-prescription', authenticate, async (req, res) => {
  try {
    const { doctorName, date, fileUrl, medications } = req.body;

    if (!doctorName || !medications || !Array.isArray(medications)) {
      return res.status(400).json({ message: 'Doctor name and medications required' });
    }

    const user = await User.findById(req.userId);
    user.prescriptions.push({
      doctorName,
      date: date || new Date(),
      fileUrl,
      medications
    });
    
    // Add medications to currentMedications if not already present
    medications.forEach(med => {
      if (!user.currentMedications.find(m => m.name === med)) {
        user.currentMedications.push({ name: med });
      }
    });

    await user.save();

    res.json({ message: 'Prescription added successfully', prescription: user.prescriptions[user.prescriptions.length - 1] });
  } catch (error) {
    console.error('Add prescription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/medical/records
 * @desc    Get all medical records
 * @access  Private
 */
router.get('/records', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    const records = {
      medicalConditions: user.medicalConditions,
      allergies: user.allergies,
      currentMedications: user.currentMedications,
      previousSurgeries: user.previousSurgeries,
      labReports: user.labReports,
      prescriptions: user.prescriptions,
      bloodGroup: user.bloodGroup,
      height: user.height,
      weight: user.weight
    };

    res.json(records);
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/medical/ai-prediction
 * @desc    Get AI disease prediction based on user data
 * @access  Private
 */
router.post('/ai-prediction', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const { symptoms = [], lifestyleData = {} } = req.body;

    // Prepare data for AI service
    const medicalData = {
      age: new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear(),
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      height: user.height,
      weight: user.weight,
      bmi: user.height && user.weight ? (user.weight / ((user.height / 100) ** 2)) : null,
      medicalConditions: user.medicalConditions,
      allergies: user.allergies,
      symptoms,
      ...lifestyleData
    };

    // Call AI service
    try {
      const aiResponse = await axios.post(
        `${process.env.AI_SERVICE_URL}/predict`,
        medicalData,
        { timeout: 5000 }
      );

      res.json({
        message: 'AI prediction completed',
        prediction: {
          primaryRisk: aiResponse.data.primaryRisk,
          riskLevel: aiResponse.data.riskLevel,
          riskPercentage: aiResponse.data.riskPercentage,
          suggestedTests: aiResponse.data.suggestedTests,
          preventiveMeasures: aiResponse.data.preventiveMeasures,
          recommendations: aiResponse.data.recommendations,
          generatedAt: new Date()
        }
      });
    } catch (aiError) {
      console.error('AI service error:', aiError);
      res.status(503).json({ message: 'AI service unavailable, please try again later' });
    }
  } catch (error) {
    console.error('AI prediction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/medical/export-qr
 * @desc    Generate QR code for offline medical data access
 * @access  Private
 */
router.get('/export-qr', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    const medicalData = {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      dateOfBirth: user.dateOfBirth,
      bloodGroup: user.bloodGroup,
      allergies: user.allergies,
      medicalConditions: user.medicalConditions,
      emergencyContact: user.emergencyContactPhone
    };

    // In production: Generate QR code using qrcode library
    const qrString = Buffer.from(JSON.stringify(medicalData)).toString('base64');

    res.json({
      message: 'QR code generated',
      qrData: qrString,
      medicalSummary: medicalData
    });
  } catch (error) {
    console.error('Export QR error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
