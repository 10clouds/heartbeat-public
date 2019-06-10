var co = require('bluebird').coroutine;
var request = require('../utils/request.js');
var logger = require('../utils/logger.js');


module.exports = exports = {
    uniqueId: 'instagram',
    options: {
        serverUrl: 'http://???',
        timeout: 5000
    },
    httpRoute: '/instagram/all',
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
        logger.warn('Failed fetching instagram data');
        return null;
    }

    var results = JSON.parse(response.body);

    var photos = results.user.media.nodes;

    photos.forEach(function (item) {


        var imagesAllSizes = item.thumbnail_resources;


        imagesAllSizes.forEach(function (img) {

            logger.info('----------------------------------' + img.src);

            if (img.config_width == 640) {
                selectedPhotos.push({'picture': img.src})
            }
        })
    });

    logger.info(selectedPhotos);

    return selectedPhotos;
}
