var Promise = require('bluebird');
var co      = Promise.coroutine;
var fs      = require('fs');

var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);

var CACHE_FOLDER = 'data';
var CACHE_FILE = CACHE_FOLDER+'/results.json';

var isJsonString = function(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
};

exports.store = co(function* (results) {
    if (!fs.existsSync(CACHE_FOLDER)){
        fs.mkdirSync(CACHE_FOLDER);
    }

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

        if(!isJsonString(data)) {
            return {};
        }

        return JSON.parse(data);
    } catch(err) {
        return false;
    }
});

module.exports = exports;
