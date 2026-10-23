const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { authenticate } = require('../middleware/auth');

/**
 * @route   GET /api/wallet/balance
 * @desc    Get wallet balance
 * @access  Private
 */
router.get('/balance', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('walletBalance');

    res.json({
      walletBalance: user.walletBalance,
      currency: 'INR'
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/wallet/credit
 * @desc    Credit government funds to wallet (Admin only - for simulation)
 * @access  Private
 */
router.post('/credit', authenticate, async (req, res) => {
  try {
    const { amount, scheme } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount required' });
    }

    const user = await User.findById(req.userId);
    const oldBalance = user.walletBalance;
    user.walletBalance += amount;
    await user.save();

    // Log transaction
    const transaction = new Transaction({
      userId: req.userId,
      transactionType: 'Wallet_Credit',
      amount,
      walletBalance: user.walletBalance,
      description: `Government funds credited - ${scheme || 'Scheme'}`,
      status: 'Completed',
      completedAt: new Date()
    });
    await transaction.save();

    res.json({
      message: 'Wallet credited successfully',
      oldBalance,
      newBalance: user.walletBalance,
      transaction
    });
  } catch (error) {
    console.error('Credit wallet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/wallet/pay
 * @desc    Make payment using wallet
 * @access  Private
 */
router.post('/pay', authenticate, async (req, res) => {
  try {
    const { amount, paymentType, referenceId, referenceName } = req.body;

    if (!amount || amount <= 0 || !paymentType) {
      return res.status(400).json({ message: 'Valid amount and payment type required' });
    }

    const validPaymentTypes = ['Hospital_Payment', 'Pharmacy_Payment', 'Lab_Test_Payment'];
    if (!validPaymentTypes.includes(paymentType)) {
      return res.status(400).json({ message: 'Invalid payment type' });
    }

    const user = await User.findById(req.userId);

    if (user.walletBalance < amount) {
      return res.status(400).json({
        message: 'Insufficient wallet balance',
        required: amount,
        available: user.walletBalance
      });
    }

    // Deduct from wallet
    const oldBalance = user.walletBalance;
    user.walletBalance -= amount;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: req.userId,
      transactionType: paymentType,
      amount,
      walletBalance: user.walletBalance,
      referenceId,
      referenceName,
      status: 'Completed',
      completedAt: new Date()
    });
    await transaction.save();

    // Generate QR code for payment confirmation (in production)
    const qrData = Buffer.from(JSON.stringify({
      transactionId: transaction._id,
      amount,
      timestamp: new Date().toISOString()
    })).toString('base64');

    res.json({
      message: 'Payment successful',
      transaction: {
        id: transaction._id,
        amount,
        type: paymentType,
        status: 'Completed',
        walletBalance: user.walletBalance,
        timestamp: transaction.completedAt
      },
      qrCode: qrData
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/wallet/transactions
 * @desc    Get wallet transaction history
 * @access  Private
 */
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ transactionDate: -1 })
      .limit(50);

    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/wallet/verify-qr
 * @desc    Verify QR payment at merchant
 * @access  Public (Hospital/Pharmacy)
 */
router.post('/verify-qr', async (req, res) => {
  try {
    const { qrData, merchantId } = req.body;

    if (!qrData) {
      return res.status(400).json({ message: 'QR data required' });
    }

    // Decode QR data
    const decoded = Buffer.from(qrData, 'base64').toString('utf8');
    const paymentData = JSON.parse(decoded);

    // Verify transaction
    const transaction = await Transaction.findById(paymentData.transactionId);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'Completed') {
      return res.status(400).json({ message: 'Transaction not completed' });
    }

    res.json({
      message: 'QR verification successful',
      transactionId: transaction._id,
      amount: transaction.amount,
      verified: true
    });
  } catch (error) {
    console.error('QR verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
