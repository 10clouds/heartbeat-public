const co = require('bluebird').coroutine;
const request = require('../utils/request.js');
const logger = require('../utils/logger.js');
const rp = require('request-promise');
const _ = require('lodash');


module.exports = exports = {
    uniqueId: 'bimba',
    options: {
        serverUrl: '',
        timeout: 5000
    },
    httpRoute: '/bimba/all',
    refetchInterval: 1000 * 60,
    fetchData: co(fetchData)
};

function* fetchData() {
    var stopsData = [
            {
                'id': 'WROC72',
                'walkingMinutes': '4'
            },
            {
                'id': 'AWF41',
                'walkingMinutes': '8'
            },
            {
                'id': 'MOST01',
                'walkingMinutes': '7'
            }
        ],
        stopsLines = ['5', '6', '16', '90'],
        options = [],
        responseList = [],
        timeout = this.options.timeout;


    stopsData.forEach(function (elem) {
        options.push(rp({
            method: 'POST',
            url: 'https://www.peka.poznan.pl/vm/method.vm',
            body: 'method=getTimes&p0=%7B%22symbol%22%3A%22' + elem.id + '%22%7D',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            timeout: timeout
        }));
    });

    return Promise.all(options)
        .then((result) => {
            var responseData = [];
            result.forEach(function (elem) {
                responseData.push(JSON.parse(elem).success)
            });

            responseData.forEach(function (item) {
                var stops = item.times,
                    selectedStops = [];

                var minutes = stopsData.filter(function (elem) {
                    if (elem.id === item.bollard.symbol) {
                        return elem;
                    }
                })[0].walkingMinutes;

                stops.forEach(function (elem) {
                    if (stopsLines.indexOf(elem.line) > -1) {
                        elem['timeToGo'] = ((elem.minutes - minutes) > 0 ? (elem.minutes - minutes) : '<1');

                        if((elem.minutes - minutes) > -2){
                            selectedStops.push(elem);
                        }
                    }
                });

                responseList.push({
                    stopName: item.bollard.name,
                    times: _.takeRight(selectedStops, 4),
                    walking: minutes
                });
            });

            // return responseData;
            return responseList;

        })
        .catch(function (err) {
            logger.warn('Failed fetching bimba data', err);
            return null;
        });
}
