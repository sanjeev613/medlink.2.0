const express = require('express');
const router = express.Router();
const Insurance = require('../models/Insurance');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const axios = require('axios');

/**
 * @route   GET /api/insurance/plans
 * @desc    Get available insurance plans
 * @access  Public
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await Insurance.find({ isActive: true })
      .select('-networkHospitals') // Exclude large array
      .limit(20);

    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/insurance/recommendations
 * @desc    Get AI-based insurance recommendations
 * @access  Private
 */
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    // Get AI prediction for risk assessment
    let userRiskProfile = [];
    try {
      const aiResponse = await axios.post(
        `${process.env.AI_SERVICE_URL}/assess-risk`,
        {
          age: new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear(),
          medicalConditions: user.medicalConditions,
          bmi: user.weight / ((user.height / 100) ** 2)
        },
        { timeout: 3000 }
      );
      userRiskProfile = aiResponse.data.riskFactors || [];
    } catch (error) {
      console.error('AI assessment failed, using medical conditions');
      userRiskProfile = user.medicalConditions;
    }

    // Find matching insurance plans
    const recommendations = await Insurance.find({
      isActive: true,
      $or: [
        { targetRiskProfiles: { $in: userRiskProfile } },
        { targetRiskProfiles: { $size: 0 } } // General plans
      ]
    })
      .sort({ monthlyPremium: 1 })
      .limit(5);

    res.json({
      userProfile: {
        age: new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear(),
        riskFactors: userRiskProfile
      },
      recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/insurance/enroll
 * @desc    Enroll in insurance plan
 * @access  Private
 */
router.post('/enroll', authenticate, async (req, res) => {
  try {
    const { insurancePlanId } = req.body;

    if (!insurancePlanId) {
      return res.status(400).json({ message: 'Insurance plan ID required' });
    }

    const plan = await Insurance.findById(insurancePlanId);

    if (!plan) {
      return res.status(404).json({ message: 'Insurance plan not found' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        'insurancePolicy.providerId': plan._id,
        'insurancePolicy.policyNumber': generatePolicyNumber(),
        'insurancePolicy.coverageAmount': plan.baseCoverageAmount
      },
      { new: true }
    ).select('insurancePolicy firstName lastName');

    res.json({
      message: 'Insurance enrollment successful',
      policy: {
        provider: plan.providerName,
        plan: plan.planName,
        policyNumber: user.insurancePolicy.policyNumber,
        coverageAmount: plan.baseCoverageAmount,
        monthlyPremium: plan.monthlyPremium,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      }
    });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/insurance/my-policy
 * @desc    Get user's current insurance policy
 * @access  Private
 */
router.get('/my-policy', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('insurancePolicy.providerId');

    if (!user.insurancePolicy.providerId) {
      return res.status(404).json({ message: 'No active insurance policy' });
    }

    const plan = user.insurancePolicy.providerId;

    res.json({
      policy: {
        policyNumber: user.insurancePolicy.policyNumber,
        provider: plan.providerName,
        plan: plan.planName,
        coverage: user.insurancePolicy.coverageAmount,
        benefits: plan.benefits,
        exclusions: plan.exclusions,
        networkHospitals: plan.networkHospitalsCount,
        claimProcessingTime: plan.claimProcessingTime
      }
    });
  } catch (error) {
    console.error('Get policy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Helper function to generate policy number
 */
function generatePolicyNumber() {
  const prefix = 'ML';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

module.exports = router;
