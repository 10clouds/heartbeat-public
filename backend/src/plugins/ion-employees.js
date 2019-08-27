const moment = require('moment');
const request = require('../utils/request.js');
const logger = require('../utils/logger.js');
const _ = require('lodash');

module.exports = exports = {
    uniqueId: 'ion-employees',
    options: {},
    httpRoute: '/ion-employees/all',
    refetchInterval: 1000 * 60 * 60,
    fetchData
};

async function fetchData() {
    const reqOptions = {
        rejectUnauthorized: false,
        url: this.options.serverUrl + '/api/users/?page=2',
        headers: {
            Authorization: this.options.token
        }
    };

    const [response, data] = await request(reqOptions);

    if (response.statusCode !== 200) {
        logger.warn('Failed fetching ion new employees data', response.statusCode, response.body);
        return null;
    }

    const parsedData = JSON.parse(data);
    const people = parsedData.results.filter(person => person.role !== 'TEST USER');
    return _.takeRight(people, 10);
}
