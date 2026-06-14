const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a user
 * @param {string} userId - The user ID
 * @returns {string} - The signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = { generateToken };
