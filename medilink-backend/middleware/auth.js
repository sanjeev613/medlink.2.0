const jwt = require('jsonwebtoken');

/**
 * Authenticate user requests
 */
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Authenticate hospital requests
 */
const authenticateHospital = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const hospitalId = req.headers['x-hospital-id'];

    if (!apiKey || !hospitalId) {
      return res.status(401).json({ message: 'Hospital credentials required' });
    }

    // In production: Verify API key against database
    req.hospitalId = hospitalId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

module.exports = { authenticate, authenticateHospital };
