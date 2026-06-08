const logger = require('../config/logger');
const { randomUUID } = require('crypto');
const { sendToSplunk } = require('../config/splunkHec');

function requestLogger(req, res, next) {
  const requestId = randomUUID();
  const startTime = Date.now();

  req.requestId = requestId;
  req.logger = logger.child({ requestId });

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;

    const logData = {
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      userId: req.headers['x-user-id'] ?? 'anonymous',
      requestId,
      item: req.body?.item,
      quantity: req.body?.quantity
    };

    req.logger.info(logData);
    sendToSplunk(logData);
  });

  next();
}

module.exports = requestLogger;