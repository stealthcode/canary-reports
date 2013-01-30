var winston = require('winston'),
    config = require('./config').get().logger;

var logger = new (winston.Logger);
logger.exitOnError = function(err) {
    logger.error(config.exceptions.level, err);
    return false;
}

if (config.transports.console)
    logger.add(winston.transports.Console, config.console);
if (config.transports.file)
    logger.add(winston.transports.File, config.file);

exports.logger = logger;
logger.customerStreamWriter = {
    write: function(message, encoding){
        if (config.transports.logRequests)
            logger.log(config.httpAccess.level, message, {from: 'express'});
    }
};