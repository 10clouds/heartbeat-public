var winston = require('winston');

var logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            timestamp: true,
            colorize: true
        })
    ]
});
logger.info('Winston logger initilized.');

module.exports = exports = logger;
