const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Runs after express-validator rules, collects errors and throws if any
// Usage: put validate after your rules array in the route definition

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map(e => e.msg).join(', ');
    throw new ApiError(message, 400);
  }
  next();
};

module.exports = validate;
