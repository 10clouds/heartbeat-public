const moment = require('moment');
const request = require('../utils/request.js');
const co = require('bluebird').coroutine;
const logger = require('../utils/logger.js');
const _ = require('lodash');

module.exports = exports = {
    uniqueId: 'ion-employees',
    options: {},
    httpRoute: '/ion-employees/all',
    refetchInterval: 1000 * 60 * 60,
    fetchData: co(fetchData)
};

function* fetchData() {
    var reqOptions = {
        rejectUnauthorized: false,
        url: this.options.serverUrl + '/api/users/?page=2',
        headers: {
            Authorization: this.options.token
        }
    };

    var params = yield request(reqOptions);
    var response = params[0];

    if (response.statusCode !== 200) {
        logger.warn('Failed fetching ion new employees data', response.statusCode, response.body);
        return null;
    }

    var data = JSON.parse(params[1]);
    var people = data.results.filter(function(person) {
      return person.role !== 'TEST USER';
    });
    return _.takeRight(people, 10);
}
