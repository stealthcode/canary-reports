define(['model', 'jquery', 'ko', 'underscore'], 
    function(model, $, ko, _) {
        function CategoryList() {
            var self = this;
            self.categories = ko.observableArray([]);
            self.filters = ko.observableArray(['failed', 'passed', 'backtrace']);
            self.visibleStoryId = ko.observable(0);
            self.shouldShowTestDetails = ko.observable(false);
            self.selectedTest = ko.observable(null);
            self.showDetail = ko.observable(true);            

            self.toggleShowTestDetails = function() {
                var x = self.shouldShowTestDetails();
                self.shouldShowTestDetails(!x);
            }

            function renderCategories(categories) 
            {
                self.categories.removeAll();
                _.each(categories, function(category) {
                    self.categories.push(category);
                });
            }

            self.showTest = function(selectedTest) {
                self.selectedTest(selectedTest);
                model.getCategories(selectedTest, renderCategories);
            }

            self.showDetails = function(story) {
                if (self.visibleStoryId() == story.id)
                    self.visibleStoryId(0);
                else
                    self.visibleStoryId(story.id);
            }
        }

        function TestPaginatedList(categories, selectedHost, limit, page) {
            var self = this;
            self.testLimit = ko.observable(limit || 15);
            self.testPage = ko.observable(page || 1);
            self.testRows = ko.observableArray([]);
            self.highlightedTestId = ko.observable(0);
            self.showDetail = ko.observable(true);
            self.selectedHost = ko.observable(selectedHost || "");

            function renderChanges(data) {
                self.testRows.removeAll();
                _.each(data, function(test) {
                    self.testRows.push(test);
                });
                if (self.testRows().length)
                    self.showStories(self.testRows()[0]);
            }

            self.showTests = function() {
                model.getTests(self.selectedHost(), self.testLimit(), (self.testPage()-1)*self.testLimit(), renderChanges);
                localStorage.selectedHost = self.selectedHost();
                localStorage.testLimit = self.testLimit();
                localStorage.testPage = self.testPage();
            }

            self.showStories = function(test) {
                if (categories) {
                    self.highlightedTestId(test.testId);
                    categories.showTest(test);
                }
            }
            if (categories)
                self.showTests();
        }
        
        var parameterMap = (function(allParameterPairs) {
        if (allParameterPairs == "") return {};
        var allParameters = {};
        for (var i = 0; i < allParameterPairs.length; ++i)
        {
            var pair=allParameterPairs[i].split('=');
            if (pair.length != 2) continue;
            allParameters[pair[0]] = decodeURIComponent(pair[1].replace(/\+/g, " "));
        }
        return allParameters;
        })(window.location.search.substr(1).split('&'));

        var show = parameterMap["_"] ? false : true;

        var categories = new CategoryList();
        categories.showDetail(show);
        var tests = new TestPaginatedList(categories, localStorage.selectedHost, localStorage.testLimit, localStorage.testPage);
        tests.showDetail(show);        

        return {
            testList: tests,
        categoryList: categories
        }        
    }
);