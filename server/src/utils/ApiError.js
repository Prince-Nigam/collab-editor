// Custom error class so we can attach HTTP status codes to errors
// Instead of throwing generic Error, we throw ApiError({ message, status })
// This makes the global error handler much cleaner

class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguish from unexpected crashes
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
