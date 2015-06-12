var co      = require('bluebird').coroutine;
var request = require('../utils/request.js');

module.exports = exports = {
    uniqueId: 'weather',
    options: {
        serverUrl: '',
    },
    httpRoute: '/weather/all',
    refetchInterval: 1000 * 5 * 56,
    fetchData: co(fetchData)
};

function* fetchData() {
    var params = yield request(this.options.serverUrl);
    var body = params[1];

    var data = JSON.parse(body);

    return {
        desc: data.weather[0].main,
        icon: data.weather[0].icon,
        temp: data.main.temp
    };
}
