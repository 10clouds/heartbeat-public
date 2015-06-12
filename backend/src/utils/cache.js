var Promise = require('bluebird');
var co      = Promise.coroutine;
var fs      = require('fs');

var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);

var CACHE_FILE = 'data/results.json';

exports.store = co(function* (results) {
    try {
        yield writeFile(CACHE_FILE, JSON.stringify(results));
        return true;
    } catch (err) {
        return false;
    }
});

exports.restore = co(function* () {
    try {
        var data = yield readFile(CACHE_FILE, 'utf8');
        return JSON.parse(data);
    } catch(err) {
        return false;
    }
});

module.exports = exports;
