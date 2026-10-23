const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Transaction Details
  transactionType: {
    type: String,
    enum: ['Wallet_Credit', 'Hospital_Payment', 'Pharmacy_Payment', 'Lab_Test_Payment', 'Wallet_Reversal'],
    required: true
  },
  
  amount: {
    type: Number,
    required: true
  },
  
  walletBalance: {
    type: Number,
    required: true
  },
  
  // Reference Information
  referenceId: String, // Hospital ID, Pharmacy ID, etc.
  referenceName: String,
  
  // QR Code Details (if applicable)
  qrCodeData: String,
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['Wallet', 'UPI', 'Card', 'Bank_Transfer']
  },
  
  // Status
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Reversed'],
    default: 'Pending'
  },
  
  failureReason: String,
  
  // Timestamps
  transactionDate: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  
  // Description
  description: String,
  
  // Receipt
  receiptUrl: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ transactionType: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
