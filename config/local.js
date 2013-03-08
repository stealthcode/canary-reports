var mongoHost = 'localhost',
    mongoPort = 27017,
    mongoDB = 'autotest';

module.exports = {
    name: 'Default configuration',
    logger: {
        transports: {
            console: true,
            file: true,
            logRequests: true
        },
        exceptions: {
            level: 'warn'
        },
        console: {
            handleExceptions: true,
            json: false,
            colorize: true,
            handleExceptions: true,
            level: 'info'
        },
        file: {
            filename: 'node_log.txt', 
            handleExceptions: true,
            json: false,
            level: 'info'
        },
        httpAccess: {
            level: 'info'
        }
    },
    autotest: {
        mongo: {
            host: mongoHost,
            port: mongoPort,
            db: mongoDB
        },
        defaults: {
            limit: 1000
        }
    },
    server: {
        expressFormat: 'tiny',
        port: process.env.PORT || 8081
    },
    qaautorunner: {
        remote_runner_path: 'c:\\automation'
    }
}