const moment = require('moment');
const request = require('../utils/request.js');
const co = require('bluebird').coroutine;
const logger = require('../utils/logger.js');

module.exports = exports = {
    uniqueId: 'ion',
    options: {
        serverUrl: '',
        homeLocationIndex: 0,
    },
    httpRoute: '/ion/all',
    refetchInterval: 1000 * 60 * 15,
    fetchData: co(fetchData)
};

function* fetchData() {
    var date = moment().format('YYYY-MM-DD');
    var homeOfficeCnt = 0;
    var usersCnt = 0;
    var reqOptions = {
        rejectUnauthorized: false,
        url: this.options.serverUrl + '/api/events/availability/' +
        '?on=' + date +
        '&format=json' +
        '&overlapping=false',
        headers: {
            Authorization: this.options.token
        }
    };

    var params = yield request(reqOptions);
    var response = params[0];

    if (response.statusCode !== 200) {
        logger.warn('Failed fetching ion data', response.statusCode, response.body);
        return {users: 0, homeoffice: 0};
    }

    var data = JSON.parse(params[1]);


    function aggregateUserEvents(events) {
        events.forEach(function (event) {
            event.start = new Date(event.start);
            event.end = new Date(event.end);
        });

        return events.reduce(function (info, event) {

            if (event.start < new Date() && event.end > new Date()) {

                var time = event.end - event.start;

                if (event.type === 'work-schedule') {
                    var location = event.data.location;
                    info.timeWorking = time;
                    info.timeAt[location] = info.timeAt[location] || 0;
                    info.timeAt[location] += time;
                }
                else if (event.type === 'time-off') {
                    info.timeAway += time;
                }
            }

            return info;
        }, {
            timeWorking: 0,
            timeAway: 0,
            timeAt: {}
        });
    }


    for (var username in data.users) {
        var aggregates = aggregateUserEvents(data.users[username]);

        if (aggregates.timeAt[this.options.homeLocationIndex]) {
            homeOfficeCnt++;
        }
        else if (aggregates.timeWorking > 0) {
            usersCnt++;
        }
    }

    return {
        users: usersCnt,
        homeoffice: homeOfficeCnt,
    };
}
