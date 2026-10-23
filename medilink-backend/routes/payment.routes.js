const express = require('express');
const router = express.Router();

/**
 * @route   POST /api/payment/initiate-upi
 * @desc    Initiate UPI payment (for non-wallet payments)
 * @access  Private
 */
router.post('/initiate-upi', async (req, res) => {
  try {
    const { amount, paymentDescription, returnUrl } = req.body;

    // In production: Integrate with Razorpay, PayU, or other payment gateway
    const paymentData = {
      orderId: generateOrderId(),
      amount,
      currency: 'INR',
      description: paymentDescription,
      upiLink: `upi://pay?pa=medilink@bank&pn=MediLink&am=${amount}&tn=${encodeURIComponent(paymentDescription)}`
    };

    res.json({
      message: 'Payment initiated',
      payment: paymentData
    });
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/payment/verify
 * @desc    Verify payment completion
 * @access  Public
 */
router.post('/verify', async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    // In production: Verify signature with payment gateway
    res.json({
      message: 'Payment verified successfully',
      verified: true,
      orderId
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

function generateOrderId() {
  return `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

module.exports = router;
