const { createLogger, format, transports } = require('winston');
const path = require('path');

const logDirectory = path.join(__dirname, '..', 'logs');

const logger = createLogger({
    level: 'silly',
    format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message, ...meta }) => {
            let log = `[${timestamp}] [${level}]: ${message}`;
            if (Object.keys(meta).length) {
                log += ` ${JSON.stringify(meta)}`;
            }
            return log;
        })
    ),
    defaultMeta: { service: 'equiledger-service' },
    transports: [
        new transports.Console(),
        new transports.File({ filename: path.join(logDirectory, 'error.log'), level: 'error' }),
        new transports.File({ filename: path.join(logDirectory, 'combined.log') }),
    ],
});


module.exports = logger;