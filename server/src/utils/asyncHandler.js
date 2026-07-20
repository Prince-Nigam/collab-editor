// Wraps async route handlers so we don't need try/catch in every controller
// Usage: router.get('/', asyncHandler(async (req, res) => { ... }))
// Any thrown error gets passed to Express's next(err) automatically

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
