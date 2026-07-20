const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Protect middleware — validates JWT on every protected route
// Attaches the user object to req.user so controllers can use it

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // JWT sent as: Authorization: Bearer <token>
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError('Not authorized — no token', 401);
  }

  // Verify token — throws JsonWebTokenError or TokenExpiredError on failure
  // Those are caught by our global errorHandler automatically
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Attach user to request (minus password)
  req.user = await User.findById(decoded.id).select('-password');

  if (!req.user) {
    throw new ApiError('User no longer exists', 401);
  }

  next();
});

module.exports = protect;
