module.exports = {
    override: function(configModule) {
        options = configModule;
        return this.get();
    },
    get: function() {
        return options;
    }
};