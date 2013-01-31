var configFile = './config/' + (process.env.CONFIG_KEY ? process.env.CONFIG_KEY : 'local');
 
var config = require('./canary/config').override(require(configFile)), 
    express = require('express'),
    persistence = require('./canary/persistence'),
    logger = require('./canary/logger').logger,
    scheduler = require('./canary/scheduler'),
    runner = require('./canary/qaautorunner');

logger.info("Configured using '"+config.name+"'.");

var server = express();

server.configure(function () {
    server.use(express.logger({format: config.expressFormat, stream:logger.customerStreamWriter}));
    server.use(express.bodyParser());
});

server.get('/release', persistence.getRelease);
server.get('/test', persistence.getTest);
server.get('/test/:limit', persistence.getTest);
server.get('/test/:limit/:skip', persistence.getTest);
server.get('/category/:testId', persistence.getCategory);
server.get('/story', persistence.getStory);
server.put('/story/:storyId', persistence.updateStory);
server.get('/story/:testId', persistence.getStory);
server.get('/story/:testId/:limit', persistence.getStory);
server.get('/story/:testId/:limit/:skip', persistence.getStory);
server.get('/screenshot/:screenshotId', persistence.getScreenshot);
server.get('/scheduler/start/:schedule/:name', scheduler.start);
server.get('/scheduler/stop', scheduler.stop)
server.get('/run/:name', runner.manualRun)
server.use(express.static(__dirname + '/public'));
server.use(function(req, res, next){
    res.send(404, '404!');
});
server.use(function(err, req, res, next){
    logger.error(err.stack);
    res.send(500, {error: err});
});

server.listen(config.server.port);
logger.info('Listening on port '+config.server.port+'...');
