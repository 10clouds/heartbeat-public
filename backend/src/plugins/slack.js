const Promise     = require('bluebird');
const co          = Promise.coroutine;
const _           = require('lodash');
const SlackNode   = require('slack-node');
const logger      = require('../utils/logger.js');
const request     = require('../utils/request.js');

module.exports = exports = {
    uniqueId: 'slack',
    options: {},
    httpRoute: '/slack/all',
    refetchInterval: 1000 * 60 * 5,
    fetchData: co(fetchData)
};

function* fetchData(lastValues) {
    logger.info('----------' + this.options.token);

    var slack = new Slack(this.options);

    try {
        var activeMembers = yield slack.activeUsersInChannels(
            this.options.channels
        );
        var lastGifUrl = yield slack.fetchLastGif(
            this.options.channels
        );

        return {
            uniqueUsers: activeMembers || 0,
            lastGif: lastGifUrl ? lastGifUrl : lastValues.lastGif
        };
    } catch (err) {
        logger.error('Slack error: %s', err);
    }

    return {
        uniqueUsers: 0,
        lastGif: lastValues.lastGif
    };
}

var GIF_REGEX = /(https?.*?\.gif(\?.*?)?)(>|\s|$)+/m;

function Slack(options) {
    if (Slack.instance) {
        return Slack.instance;
    }
    SlackNode.call(this, options.token);
    this.apiAsync = Promise.promisify(this.api);
    this.api = co(function* () {
        var response = yield this.apiAsync.apply(this, arguments);
        if (!response.ok) {
            throw response.error;
        }
        return response;
    });
    Slack.instance = this;
}
Slack.prototype = _.create(SlackNode.prototype, {
    activeUsersInChannels: co(function * (supportedChannels) {


        var fullInfo = yield this.api('rtm.start');

        var idsInSupportedChannels = _(fullInfo.channels)
            .filter(function fromIncludedChannels(channel) {

                return supportedChannels.indexOf(channel.name) !== -1 &&
                    channel.members &&
                    channel.is_archived === false;
            })
            .pluck('members')
            .flatten().uniq()
            .value();
        var isInSupportedChannels = _.partial(_.includes, idsInSupportedChannels);


        var count = _(fullInfo.users)
            .filter('presence', 'active')
            .pluck('id')
            .filter(isInSupportedChannels)
            .size();


        var users = fullInfo.users;

        logger.info('----------' + users.length);


        return count;
    }),
    fetchLastGif: co(function* (includeChannels) {
        var queries = _.flatten([
            includeChannels.map(function (channel) {
                return 'in:#' + channel;
            }),
            'gif'
        ]);
        var historyResponse = yield this.api('search.messages', {
            query: queries.join(' '),
            count: 30
        });

        var potentialGifs = historyResponse.messages.matches;
        var lastGifUrl = null;
        for (var i = 0; i < potentialGifs.length; i++) {
            var match = potentialGifs[i].text.match(GIF_REGEX);
            if (match === null) {
                continue;
            }
            var url = match[1];
            var getResults = yield request(url);
            var response = getResults[0];
            if (response.statusCode < 400) {
                lastGifUrl = url;
                break;
            }
        }

        return lastGifUrl;
    })
});
