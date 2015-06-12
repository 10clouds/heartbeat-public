var Promise = require('bluebird');
var co      = require('bluebird').coroutine;
var parser  = require('parse-rss');
var logger  = require('../utils/logger.js');
var parser  = require('parse-rss');

module.exports = exports = {
    uniqueId: 'breaking',
    options: {
        serverUrl: 'https://news.google.com/news?pz=1&cf=all&ned=pl_pl&hl=pl&output=rss',
    },
    httpRoute: '/breaking/',
    refetchInterval: 1000 * 60 * 4,
    fetchData: co(fetchData)
};

function* fetchData() {
    var parse = Promise.promisify(parser);

    return yield parse(this.options.serverUrl)
    .then(function (rss) {
        var titlesArr =  rss.reduce(function (titles, current) {
            titles.push(current.title);
            return titles;
        }, []);
        return {data:titlesArr};
    })
    .catch(function(err){
        logger.warn('Breaking err', err);
    });
}
