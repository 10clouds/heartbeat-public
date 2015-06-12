var co      = require('bluebird').coroutine;
var request = require('../utils/request.js');

module.exports = exports = {
    uniqueId: 'rooms',
    options: {
        serverUrl: 'http://???',
        timeout: 5000
    },
    httpRoute: '/rooms/all',
    refetchInterval: 1000*62,
    fetchData: co(fetchData)
};

function* fetchData() {
    var result = yield request({
        url: this.options.serverUrl,
        timeout: this.options.timeout
    });

    var response = result[0];

    if (response.statusCode !== 200) {
        return null;
    }

    var results = JSON.parse(response.body);

    return {
        conferenceRoom: results.rooms[0].events,
        socialRoom: results.rooms[1].events,
        hamakowniaRoom: results.rooms[2].events,
    };
}
