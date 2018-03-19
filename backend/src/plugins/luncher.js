var co      = require('bluebird').coroutine;
var request = require('../utils/request.js');
var logger      = require('../utils/logger.js');

module.exports = exports = {
    uniqueId: 'luncher',
    options: {
        serverUrl: 'http://???',
        timeout: 5000
    },
    httpRoute: '/luncher/all',
    refetchInterval: 1000 * 15 * 60,
    fetchData: co(fetchData)
};

function* fetchData() {
    var todayDate = new Date().toISOString().slice(0, 10);

    var result = yield request({
        url: 'http://luncher.org/api/post?day='+ todayDate +'&hasChild=false&includeRestaurant=true',
        timeout: this.options.timeout
    });

    var response = result[0];

    if (response.statusCode !== 200) {
        return null;
    }

    var results = JSON.parse(response.body);

    return {
        results: results.posts
    };
}
