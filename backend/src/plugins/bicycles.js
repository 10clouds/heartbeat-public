const co = require('bluebird').coroutine;
const request = require('../utils/request.js');
const logger = require('../utils/logger.js');
const converter = require('xml-js');

module.exports = exports = {
    uniqueId: 'bicycles',
    options: {
        serverUrl: '',
        timeout: 5000
    },
    httpRoute: '/bicycles/all',
    refetchInterval: 1000 * 5 * 60,
    fetchData: co(fetchData)
};

function* fetchData() {
    var closestStationsIds = [9685, 9682, 96821, 9681, 9704],
        closestStations = [];

    var result = yield request({
        url: this.options.serverUrl,
        timeout: this.options.timeout
    });

    var response =  converter.xml2json(result[0].body, {compact: true, spaces: 4});
    var results = JSON.parse(response);
    var bikeStops = results.markers.country.city.place;

    bikeStops.forEach(function(elem){
        if(closestStationsIds.indexOf(parseInt(elem._attributes.number)) > -1){
            closestStations.push(elem._attributes);
        }
    });

    closestStations.sort(function(a, b){
        return closestStationsIds.indexOf(parseInt(a.number)) > closestStationsIds.indexOf(parseInt(b.number)) ? 1 : -1
    });

    return closestStations;
}
