var fs      = require('fs');
var logger  = require('../utils/logger.js');
var Promise = require('bluebird');
var co      = Promise.coroutine;

var readFile = Promise.promisify(fs.readFile);

module.exports = exports = {
    uniqueId: 'network',
    options: {
        sourceFilePath: '/data/network.txt',
    },
    httpRoute: '/network/all',
    refetchInterval: 1000 * 60.5,
    fetchData: co(fetchData)
};

var previousUsage;

function mapUsageUnits(rawUsage, options) {
    return (rawUsage / options.maxCap) * 1000;
}

// var tmpTest = 0;
var sampleNetworkUsage = co(function* sampleNetworkUsage(options) {
    // tmpTest += Math.floor(Math.random() * 200000000);
    // return tmpTest;
    var newCapData = yield readFile(options.sourceFilePath, 'utf8');
    return Number(newCapData);
});

function* fetchData(networkCache) {
    var usageHistory = networkCache.usageHistory || [];

    var currentUsage = yield sampleNetworkUsage(this.options);

    if (previousUsage === void 8 || currentUsage < previousUsage) {
        // we not have proper data, let's use last one result.
        // next time it should looks better.
        previousUsage = currentUsage;
    } else {
        var lastMinuteUsage = (currentUsage - previousUsage);

        if (lastMinuteUsage > this.options.maxCap) {
            logger.warn('Network usage is bigger that network max cap. Why?');
            logger.warn(
                'Max cap: ' + this.options.maxCap + '\n' +
                'Usage delta: ' + this.lastMinuteUsage
            );
        } else {
            previousUsage = currentUsage;
            if (usageHistory.length >= this.options.maxCharPoints) {
              usageHistory.shift();
            }
            usageHistory.push({
                bytes: mapUsageUnits(lastMinuteUsage, this.options),
                time: new Date()
            });
        }
    }

    if (usageHistory.length >= this.options.maxCharPoints) {
        // clean usage history
        usageHistory = usageHistory.slice(
            usageHistory.length - this.options.maxCharPoints
        );
    }

    return {
        usageHistory: usageHistory,
        maxCap: this.options.maxCap,
        maxCharPoints: this.options.maxCharPoints
    };
}
