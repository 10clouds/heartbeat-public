var co = require('bluebird').coroutine;
var request = require('../utils/request.js');
var logger = require('../utils/logger.js');


module.exports = exports = {
    uniqueId: 'facebook',
    options: {
        serverUrl: '',
        timeout: 5000
    },
    httpRoute: '/facebook/all',
    refetchInterval: 1000 * 15 * 60,
    fetchData: co(fetchData)
};

function* fetchData() {

    var selectedPhotos = [];

    var result = yield request({
        url:  this.options.serverUrl,
        timeout: this.options.timeout
    });

    var response = result[0];

    if (response.statusCode !== 200) {
        logger.warn('Failed fetching facebook data');
        return null;
    }

    var results = JSON.parse(response.body);

    var photos = results.albums.data[0].photos.data;

    photos.forEach(function (item) {
        var imagesAllSizes = item.images;

        imagesAllSizes.forEach(function (img) {
            if (img.height == 960) {
                selectedPhotos.push({'picture': img.source})
            }
        })
    });
    return selectedPhotos;
}
