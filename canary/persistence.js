var mongo = require('mongodb'),
    _ = require('underscore'),
    logger = require('./logger').logger,
    config = require('./config').get().autotest;

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure,
    Grid = mongo.Grid,
    GridStore = mongo.GridStore;

var collections = ['test', 'story', 'release'];
var mongoString = config.mongo.host + " " + config.mongo.db + " " + config.mongo.port;

logger.info("Testing conneciton to MongoDB ["+mongoString+"]");

var server = new Server(config.mongo.host, config.mongo.port, {auto_reconnect: true});
db = new Db(config.mongo.db, server, {safe:true});

db.open(function(err, db) {
    if(!err) {
        logger.info("Connected to '"+config.mongo.db+"' database");
        for (var i = 0; i < collections.length; i++) {
            var name = collections[i];
            db.collection(name, {safe:true}, function(err, collection) {
                if (err) {
                    logger.warn("Cannot connect to collection '"+name+"'. "+ err);
                }
            });
        }
    }
    else {
        logger.error("Unable to connect to MongoDB ["+mongoString+"]. " + err);
    }
});

var grid = new Grid(db);
    
function query(name, filter, options, callback) {
    filter = filter || {};
    options = options || {};
    if (options['limit'] == undefined || options['limit'] == 0) {
        options['limit'] = config.defaults.limit
    }
    db.collection(name, function(err, collection) {
        collection.find(filter, options).toArray(function(err, item) {
            if(!err) {
                callback(item);
            }
            else {
                callback({message: 'Error querying the '+name+' collection.', error: err});
            }
        });
    });
}

exports.getRelease = function(req, res)  {
    res.setHeader('Cache-Control', 'no-cache');
    var limit = (req.params.limit || '').match(/\d+/) || config.defaults.limit;
    var skip = (req.params.skip || '').match(/\d+/) || 0;
    var releaseId = req.params.releaseId;
    var filter = {};
    if (releaseId) {
        if (!releaseId.match(/\w{24}/)) {
            res.send({message: 'ReleaseId must be a 24 character hexadecimal string.', error: 'Invalid Argument'});
            return;
        }
        filter.release_id = new BSON.ObjectID(releaseId);
    }
    query('release', filter, {limit: limit, skip: skip, sort: [['_id', -1]]}, function(releases) {
        var queryResult = []
        _.each(releases, function(release) {
            if (release.dirty) {
                var test_filter = {_id: {$in: release.tests}}; 
                if (release.statistics && release.statistics.last_test_date) 
                    test_filter.start_date = {$gt : release.statistics.last_test_date};
                query("test", test_filter, {}, function (tests) {
                    logger.info("Calculating statistics for " + tests.length+" tests.");
                    var statistics = {};
                    if (release.statistics)
                        statistics = calcStatistics(release.statistics, tests);
                    else
                        statistics = newStats(tests);
                    db.collection('release', function(err, collection) {
                        collection.update({_id: release._id}, {$set: {dirty: false, statistics: statistics}}, {safe:false});
                    });
                    release.dirty = false;
                    release.statistics = statistics;
                    queryResult.push(release);
                });
            }
            else
                queryResult.push(release);
        });
        res.send(queryResult);
    });
}

function newStats(tests) {
    var stats = {
        test_count: 1,
        first_test_date: tests[0].start_date,
        last_test_date: tests[0].start_date,
        story_count: tests[0].story_count,
        pass_count: tests[0].passed_count,
        fail_count: tests[0].failed_count,
        in_progress: tests[0].in_progress ? 1:0,
        cancelled: tests[0].was_cancelled ? 1:0,
        total_duration: tests[0].end_date - tests[0].start_date,
        max_duration: tests[0].end_date - tests[0].start_date,
        min_duration: tests[0].end_date - tests[0].start_date
    }
    return calcStatistics(stats, tests.slice(1));
}

function calcStatistics(stats, tests) {
    _.each(tests, function(e) {
        stats.test_count += 1;
        stats.story_count += e.story_count;
        stats.pass_count += e.passed_count;
        stats.fail_count += e.failed_count;
        stats.in_progress += e.in_progress ? 1:0;
        stats.cancelled += e.was_cancelled ? 1:0;

        if (stats.first_test_date > e.start_date)
            stats.first_test_date = e.start_date;
        if (stats.last_test_date < e.start_date)
            stats.last_test_date = e.start_date;

        var duration = e.end_date - e.start_date;
        stats.total_duration += duration;
        if (stats.min_duration > duration)
            stats.min_duration = duration;
        if (stats.max_duration < duration)
            stats.max_duration = duration;
    });
    return stats;
}

exports.getTest = function(req, res) {
    res.setHeader('Cache-Control', 'no-cache');
    var limit = (req.params.limit || '').match(/\d+/) || config.defaults.limit;
    var skip = (req.params.skip || '').match(/\d+/) || 0;
    filter = {};
    query('test', filter, {limit: limit, skip: skip, sort: [['start_date', -1]]}, function(result) {
        res.send(result);
    });
};

exports.getCategory = function(req, res) {
    res.setHeader('Cache-Control', 'no-cache');
    var testId = req.params.testId;
    if (testId != undefined) {
        if (!testId.match(/\w{24}/)) {
            res.send({message: 'TestId must be a 24 character hexadecimal string.', error: 'Invalid Argument'});
            return;
        }
        filter = {test_id: new BSON.ObjectID(testId)};    
    }
    query('category', filter, {limit: 1}, function(result) {
        res.send(result);
    });
}

exports.getStory = function(req, res) {
    res.setHeader('Cache-Control', 'no-cache');
    var testId = req.params.testId;
    var filter = {};
    if (testId != undefined) {
        if (!testId.match(/\w{24}/)) {
            res.send({message: 'TestId must be a 24 character hexadecimal string.', error: 'Invalid Argument'});
            return;
        }
        filter.test_id = new BSON.ObjectID(testId);    
    }
    var limit = req.params.limit || config.defaults.limit;
    var skip = req.params.skip || 0;

    query('story', filter, {limit: limit, skip: skip, sort: [['start_date', -1]]}, function(result) {
        res.send(result);
    });
};

exports.getScreenshot = function(req, res) {
    var id = req.params.screenshotId;
    if (!id.match(/\w{24}/)) {
        res.send({message: 'TestId must be a 24 character hexadecimal string.', error: 'Invalid Argument'});
        return;
    }

    var bsonId = new BSON.ObjectID(id);
    var store = new GridStore(db, bsonId, "r");
    store.open(function(err, file) {
        if (!err) {
            res.type(file.contentType);
            file.stream(true).pipe(res);
        }
        else {
            var msg = {message: 'Error fetching screenshot "'+id+'"', error: err};
            res.send(msg);
        }
    });

}

exports.updateStory = function(req, res) {
    var id = req.params.storyId;
    logger.debug('Derp: '+ id);
    console.log(req);
    var property = req.body;
    var storyId = new BSON.ObjectID(id);
    logger.debug('Derp2: '+ storyId);
    if (storyId == undefined || !/\w{24}/.test(storyId)) {
        res.send({message: 'StoryId must be a 24 character hexadecimal string.', error: 'Invalid Argument'});
        return;
    }
    
    db.collection('story', function(err, collection) {
        if (err)
            res.send({message: 'Cannot connect to "story" collection.', error: err});
        collection.update({_id: storyId}, {$set: property}, {safe:true}, function(err, item) {
            if(!err) {
                res.send({status: 'success'});
            }
            else {
                res.send({message: 'Error updating story with _id "'+id+'".', error: err});
            }
        });
    });
}