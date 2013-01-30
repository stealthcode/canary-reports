var logger = require('./logger').logger,
    config = require('./config').get().qaautorunner,
    exec = require('child_process').exec;

var remote_runner_path = config.remote_runner_path;

var run = function (name, response) {
    var d = new Date();
        var date = d.toLocaleDateString();
        var time = d.toLocaleTimeString();
    logger.info(date + " " + time + " QA Automation Started..");

    var cmd = 'powershell -NoProfile -OutputFormat Text -InputFormat none -Command icm -ScriptBlock {';
    cmd += remote_runner_path + 'bundle exec rspec script\\' + name + '.rb}';

    child = exec(cmd,
        function (error, stdout, stderr) {
            logger.info('stdout: ' + stdout);
            if (stderr != '') {
                logger.error('stderr: ' + stderr);
                response.send(500);
            }
            else if (error != null) {
              logger.error('exec error: ' + error);
              response.send(500);
            }
            else
                response.send(200);
        }
    );
}

exports.manualRun = function(req, res) {
    var name = req.params.name;
    run(name, res);
}

exports.run = run;