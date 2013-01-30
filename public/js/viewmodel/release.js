define(['model', 'jquery', 'ko', 'underscore'], 
    function(model, $, ko, _) {

        function ReleaseList() {
            var self = this;
            self.releases = ko.observableArray([]);
            self.selectedReleaseId = ko.observable(0);

            self.renderChanges = function(data) {
                self.releases.removeAll();
                _.each(data, function(release) {
                    self.releases.push(release);
                });
            }

            self.showReleaseDetails = function(release) {
                if (self.selectedReleaseId() == release.releaseId)
                    self.selectedReleaseId(false);
                else
                    self.selectedReleaseId(release.releaseId);
            }
        }
        var releases = new ReleaseList();
        model.getReleases(releases.renderChanges);
        return {releaseList: releases};
    }
);