var logger = require('./logger').logger,
    config = require('./config').get().server,
    runner = require('./qaautorunner'),
    cron = require('cron');

var cronJob = cron.CronJob;
var job;

exports.start = function(req, res) {
    var name = req.params.name;
    var schedule = req.params.schedule;

    if (job != undefined)
        job.stop();

    logger.info("Starting (" + schedule + ")...");

    // schedule example '00 */1 * * * *' (tick every minute)
    job = new cronJob(schedule, 
        function() {
            runner.run(name, res);
        }, 
        function() {
            logger.info("Stopped.");
        }, 
        true, 
        "America/Los_Angeles");
    res.send(200);
}

exports.stop = function() {
    logger.info("Stopping scheduler...");
    if (job != undefined)
        job.stop(); 
}

