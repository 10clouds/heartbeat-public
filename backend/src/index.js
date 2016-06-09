'use strict';

try {
    var config = require('./local.config');
} catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
        console.log(
            'You need define local config (`local.config.js`) ' +
            'before running this app.'
        );
        return;
    } else {
        throw err;
    }
}

var Promise    = require('bluebird');
var co         = Promise.coroutine;
var Hapi       = require('hapi');
var httpServer = new Hapi.Server();
var io         = require('socket.io')(config.WebSocketsPort);
var merge      = require('merge');

var logger = require('./utils/logger');
var cache  = require('./utils/cache');

var SupportedPlugins = [
    require('./plugins/ion'),
    require('./plugins/rooms'),
    require('./plugins/github'),
    // require('./plugins/hipchat'),
    require('./plugins/weather'),
    require('./plugins/breaking'),
    require('./plugins/network'),
    require('./plugins/slack')
];
SupportedPlugins.forEach(function (plugin) {
    merge(plugin.options, config.plugins[plugin.uniqueId]);
});
var pluginsResults = {};

var refetchPluginData = co(function* refetchPluginData(plugin) {
    logger.info('Refetching %s data.', plugin.uniqueId);
    var oldData = pluginsResults[plugin.uniqueId];
    try {
        pluginsResults[plugin.uniqueId] = yield plugin.fetchData(oldData || {});
    }
    catch (err) {
        logger.warn('Can not fetch %s data. %s.', plugin.uniqueId, err.code, err);
        if (oldData === void 8) {
            pluginsResults[plugin.uniqueId] = null;
        }
    }
    var result = pluginsResults[plugin.uniqueId];
    if (result !== oldData) {
        io.emit(plugin.uniqueId, result);
        cache.store(pluginsResults);
    }
});

var initializePlugins = co(function* initializePlugins() {
    var refetchClosure = function (plugin) {
        return function refetchPlugin() { return refetchPluginData(plugin); };
    };

    var promises = [];
    SupportedPlugins.forEach(function (plugin) {
        promises.push(refetchPluginData(plugin));
        setInterval(refetchClosure(plugin), plugin.refetchInterval);
    });

    yield Promise.all(promises);
});

function setupHttpRoutes() {
    httpServer.connection({
        port: config.HttpPort,
        labels: ['web']
    });

    var goodOptions = {
        opsInterval: 1000,
        reporters: [
            {
                reporter: require('good-console'),
                args:[{ log: '*', response: '*' }]
            },
            {
                reporter: require('good-file'),
                args: [
                    './logs/good.log', {
                    log: '*'
                }]
            }
        ]
    };

    httpServer.register({
        register: require('good'),
        options: goodOptions
    }, function (err) {
        if (err) {
            logger.error(err);
        }
        else {
            httpServer.start(function (x) {
                httpServer.log('info', 'Server running at: ' + httpServer.info.uri);
            });
        }
    });

    httpServer.route({
        method: 'GET',
        path:'/all',
        handler: function (request, reply) {
           reply(pluginsResults);
        }
    });

    SupportedPlugins.forEach(function (plugin) {
        // HTTP ROUTES
        httpServer.route({
            method: 'GET',
            path: plugin.httpRoute,
            handler: function (request, reply) {
                var data = pluginsResults[plugin.uniqueId];
                reply(data);
            }
        });
    });
}

function setupWebSockets() {
    io.on('connection', function (socket) {
        logger.info('New socket.io client connected.');
        socket.once('established', function () {
            for (var i = 0; i < SupportedPlugins.length; i++) {
                var plugin = SupportedPlugins[i];
                socket.emit(plugin.uniqueId, pluginsResults[plugin.uniqueId]);
            }
        });
    });
}

function* main () {
    var cachedResults = yield cache.restore();

    if (cachedResults) {
        pluginsResults = cachedResults;
    }
    setupWebSockets();
    setupHttpRoutes();

    yield initializePlugins();
    logger.info('--- All plugins initialized. ---');
    logger.info('--- HEARTBEAT ---');
}

co(main)();
