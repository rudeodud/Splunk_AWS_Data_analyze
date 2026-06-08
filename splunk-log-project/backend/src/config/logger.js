const pino = require('pino');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const logDir = path.resolve(__dirname, '../../logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const transport = pino.transport({
  targets: [
    {
      target: 'pino/file',
      options: {
        destination: path.resolve(
          __dirname,
          '../../logs/app.log'
        )
      }
    },
    {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  ]
});

const logger = pino(
  {
    level: 'info',
    base: {
      service: 'order-api',
      environment: process.env.NODE_ENV
    },
    timestamp: pino.stdTimeFunctions.isoTime
  },
  transport
);

module.exports = logger;