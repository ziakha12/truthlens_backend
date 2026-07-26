// Wraps async route handlers so we don't repeat try/catch everywhere.
// Any error thrown inside the handler is passed to Express's error middleware.
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

module.exports = asyncHandler;
