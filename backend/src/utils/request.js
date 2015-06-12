var Promise = require('bluebird');

var request = Promise.promisify(require('request'));
request.BadResponse = function BadResponse(e) {
    return e.code >= 400;
};

module.exports = exports = request;
