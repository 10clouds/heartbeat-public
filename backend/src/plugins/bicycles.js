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
    fetchData
};

const ClosestStationsIds = [9685, 9682, 96821, 9681, 9704];

async function fetchData() {
    const result = await request({
        url: this.options.serverUrl,
        timeout: this.options.timeout
    });

    const response =  converter.xml2json(result[0].body, {compact: true, spaces: 4});
    const results = JSON.parse(response);
    const bikeStops = results.markers.country.city.place;

    const closestStations = bikeStops
        .filter(elem => ClosestStationsIds.includes(parseInt(elem._attributes.number)))
        .map(elem => elem._attributes);

    closestStations.sort(function(a, b){
        const stationId1 = parseInt(a.number);
        const stationId2 = parseInt(b.number);
        return ClosestStationsIds.indexOf(stationId1) - ClosestStationsIds.indexOf(parseInt(stationId2));
    });

    return closestStations;
}
