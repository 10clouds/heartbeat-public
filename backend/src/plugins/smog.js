const co      = require('bluebird').coroutine;
const request = require('../utils/request.js');
const logger      = require('../utils/logger.js');

module.exports = exports = {
    uniqueId: 'smog',
    options: {
        serverUrl: '',
        timeout: 5000
    },
    httpRoute: '/smog/all',
    refetchInterval: 1000 * 15 * 60,
    fetchData: co(fetchData)
};

function* fetchData() {

    var result = yield request({
        url: this.options.serverUrl,
        timeout: this.options.timeout
    });

    var response = result[0];

    if (response.statusCode !== 200) {
        logger.warn('Failed fetching smog data', response.statusCode, response.body);
        return null;
    }

    var results = JSON.parse(response.body);

    logger.info('----------' + JSON.stringify(results.currentMeasurements));

    return {
        results: results.currentMeasurements
    };
}
