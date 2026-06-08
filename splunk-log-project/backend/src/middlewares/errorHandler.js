const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  const childLogger = req.logger ?? logger;

  childLogger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    endpoint: req.originalUrl
  });

  res.status(err.status ?? 500).json({
    error: err.message ?? 'Internal Server Error'
  });
}

module.exports = errorHandler;