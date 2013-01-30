define(['ko', 'underscore'], 
    function(ko, _) {
        function parseUTC(input) {
            var x = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d{3})Z/.exec(input);
            return new Date(Date.UTC(x[1], x[2]-1, x[3], x[4], x[5], x[6], x[7]));
        }

        function getDuration(input) {
            return /.+(\d{2}:\d{2}:\d{2})\s\w{3}/.exec(new Date(input).toUTCString())[1];
        }

        function Release(jsonObject) {
            var self = this;
            self.releaseId = jsonObject['_id'];
            self.testCount = jsonObject['statistics']['test_count'];
            self.inProgressCount = jsonObject['statistics']['in_progress'];
            self.cancelledCount = jsonObject['statistics']['cancelled'];

            self.storyCount = jsonObject['statistics']['story_count'];
            self.passedCount = jsonObject['statistics']['pass_count'];
            self.failedCount = jsonObject['statistics']['fail_count'];
            self.passRate = (self.passedCount / self.storyCount * 100).toFixed();
            self.failRate = (self.failedCount / self.storyCount * 100).toFixed();
            
            self.firstTestDate = parseUTC(jsonObject['statistics']['first_test_date']).toLocaleDateString();
            self.firstTestTime = parseUTC(jsonObject['statistics']['first_test_date']).toLocaleTimeString().split("-")[0];
            self.lastTestDate = parseUTC(jsonObject['statistics']['last_test_date']).toLocaleDateString();
            self.lastTestTime = parseUTC(jsonObject['statistics']['last_test_date']).toLocaleTimeString().split("-")[0];
            self.targetVersions = translateVersions(jsonObject['application']);

            self.totalDuration = getDuration(jsonObject['statistics']['total_duration']);
            self.maxDuration = getDuration(jsonObject['statistics']['max_duration']);
            self.minDuration = getDuration(jsonObject['statistics']['min_duration']);
            self.avgTestDuration = getDuration(jsonObject['statistics']['total_duration'] / self.testCount);
            self.avgStoryDuration = getDuration(jsonObject['statistics']['total_duration'] / self.storyCount);
        }

        function TestExecution(jsonObject) {
            var self = this;
            self.start_date = parseUTC(jsonObject['start_date']).toLocaleDateString();
            self.start_time = parseUTC(jsonObject['start_date']).toLocaleTimeString().split("-")[0];
            if (jsonObject['end_date']) {
                self.end_date = parseUTC(jsonObject['end_date']).toLocaleDateString();
                self.end_time = parseUTC(jsonObject['end_date']).toLocaleTimeString().split("-")[0];
            }
            self.testId = jsonObject['_id'];
            self.isInProgress = jsonObject['in_progress'];
            self.wasCancelled = jsonObject['was_cancelled'];
            self.status = self.isInProgress ? 'In Progress' : 
                            self.wasCancelled ? 'Cancelled' : 'Finished';
            self.passedCount = ko.observable(jsonObject['passed_count'] || 0);
            self.failedCount = ko.observable(jsonObject['failed_count'] || 0);
            self.total = jsonObject['story_count'];
            self.inProgressCount = ko.computed(function() {
                return self.total - (self.passedCount() + self.failedCount());}
            );
            self.scriptHost = jsonObject['script_host'];
            self.targetEnv = jsonObject['target_env'];
            self.targetVersions = translateVersions(jsonObject['target_versions']);
        }

        function translateVersions(stuff) {
            arr = []
            _.each(stuff, function(value, key){
                arr.push({app_name: key, version: value.version});
            });
            return arr;
        }
        
        function Category(name, jsonObject) {
            var self = this;
            self.categoryId = jsonObject['id'];
            self.name = name;
            self.stories = ko.observableArray([]);
            self.subCategories = ko.observableArray([]);
            self.passedCount = ko.computed(function() {
                return _.where(self.stories(), { passed: true }).length || 0;
            });
            self.failedCount = ko.computed(function() { 
                return _.where(self.stories(), { passed: false }).length || 0;
            });

            self.total = ko.computed(function() { 
                return self.stories().length;}
            );
            self.inProgressCount = ko.computed(function() {
                return self.total - (self.passedCount() + self.failedCount());}
            );
            _.each(jsonObject, function(value, name) {
                if (name != "id")
                {
                    self.subCategories.push(new Category(name, value));
                }
            });
        }

        function Story(jsonObject) {
            var self = this;
            self.id = jsonObject['_id'];
            self.startTime = parseUTC(jsonObject['start_date']).toLocaleTimeString().split("-")[0];
            self.runTime = jsonObject['run_time'];
            self.showDetails = ko.observable(false);
            self.category = jsonObject['category'];
            self.description = jsonObject['description'];
            self.passed = jsonObject['passed'];
            self.statusText = ko.computed(function() {return self.passed ? "Passed" : "Failed"});
            self.screenshot_id = jsonObject['screenshot_id'];
            self.tasks = jsonObject['tasks'];
            self.fileName = jsonObject['file_name'];
            self.lineNumber = jsonObject['line_number'];
            self.exception = jsonObject['exception'];
            self.backtrace = jsonObject['backtrace'];
            self.actions = _.flatten(_.map(jsonObject['tasks'], function(e){
                return _.map(e.actions, function(a) {
                    return new StoryAction(a);
                });
            }));
            var context = _.flatten(_.map(self.tasks, function(e){
                return _.compact(e['task_context']);
            }));
            self.context = _.map(context, function(e){
                return "&lt;"+e+"&gt;";
            }).sort().join(',&nbsp;');
        }

        function StoryAction(jsonObject) {
            var self = this;
            self.wrappedClass = jsonObject['wrapped_class'];
            self.methodName = jsonObject['method_name'];
            self.arguments = jsonObject['arguments'].join(', ');
            self.result = jsonObject['result'];
            self.log = _.map(jsonObject['log'], function(e) {
                return {
                    description: e['description'],
                    features: e['features']
                };
            });
        }

        function getTests(limit, skip, callback) {
            $.ajax({
                type: 'GET',
                url: ['/test', limit, skip].join('/'),
                dataType: 'json',
                success: function(data) {
                    var tests = [];
                    _.each(data, function(e) {
                        tests.push(new TestExecution(e));
                    });
                    callback(tests);
                }
            });
        }

        function getReleases(callback) {
            $.ajax({
                type: 'GET',
                url: '/release',
                dataType: 'json',
                success: function(data) {
                    if (!(data instanceof Array))
                        data = [data];
                    var releases = [];
                    _.each(data, function(e) {
                        releases.push(new Release(e));
                    });
                    callback(releases);
                }
            });
        }

        var categoryCache = {};
        var storyCache = {};

        function getCategories(testId, isInProgress, callback) {
            if (!categoryCache[testId]) {
                $.ajax({
                    type: 'GET',
                    url: ['/category', testId].join('/'),
                    dataType: 'json',
                    success: function(data) {
                        categoryCache[testId] = [];
                        _.each(data, function(e) {
                            _.each(e, function(contents, name) {
                                if (name != '_id' && name != 'test_id') {
                                    var category = new Category(name, contents);
                                    categoryCache[testId].push(category);
                                }
                            });
                        });
                        fetchStories(testId, callback);
                    }
                });
            }
            else
                callback(categoryCache[testId]);
            if (isInProgress) 
                clearCache(testId);
        }

        function fetchStories(testId, callback) {
            if (!storyCache[testId]) {
                $.ajax({
                    type: 'GET',
                    url: ['/story', testId].join('/'),
                    dataType: 'json',
                    success: function(data) {
                        storyCache[testId] = {};
                        _.each(data, function(e) {
                            var story = new Story(e);
                            if (storyCache[testId][story.category] == undefined)
                                storyCache[testId][story.category] = [];
                            storyCache[testId][story.category].push(story);
                        });
                        fillAllCategories(testId);
                        callback(categoryCache[testId]);
                    }
                });
            }
        }

        function clearCache(testId) {
            categoryCache[testId] = false;
            storyCache[testId] = false;
        }

        function fillAllCategories(testId) {
            _.each(categoryCache[testId], function(c) {
                fillCategory(c, testId);
            });
        }

        function fillCategory(category, testId) {
            if (storyCache[testId][category.categoryId]) {
                _.each(storyCache[testId][category.categoryId].reverse(), function(story) {
                    category.stories.push(story);
                });
            }
            _.each(category.subCategories(), function(sub) {
                fillCategory(sub, testId);
            });
        }

        return {
            Release: Release,
            TestExecution: TestExecution,
            Category: Category,
            Story: Story,
            StoryAction: StoryAction,
            getReleases: getReleases,
            getTests: getTests,
            getCategories: getCategories
        }
    }
);