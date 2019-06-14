const _       = require('lodash');
const http    = require('http');
const logger  = require('../utils/logger.js');
const Promise = require('bluebird');
const request = require('../utils/request.js');

module.exports = exports = {
    uniqueId: 'github',
    options: {
        serverUrl: 'https://api.github.com',
        user: '',
        org: '',
    },
    httpRoute: '/github/all',
    refetchInterval: 1000 * 60 * 5,
    fetchData: Promise.coroutine(fetchData)
};

function* fetchData() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var weekAgo = new Date(today.getTime());
    weekAgo.setDate(today.getDate() - 7);

    var stats = {
        pullRequestsCount: 0,
        todayCommitsCount: 0,
        topCommiter: 'Nobody'
    };

    // we must get all repositories and sort them locally - cauze
    // stupid github api have sort flag support only for fetching repos
    // per user - and have not per orgs
    //logger.info('Github: looking for active repositories.');
    var repos = yield githubRequestAllPages('/orgs/%org/repos', {type:'all'});

    var activeRepos = repos.filter(function(repo) {
        var updated = new Date(Math.max(
            new Date(repo.pushed_at),
            new Date(repo.updated_at)
        ));

        return updated >= weekAgo;
    });

    var pullsPromises = activeRepos.map(function(repo) {
        //logger.info('Github: Fetching "%s" pull requests.', repo.name);
        return githubRequestAllPages('/repos/%org/' + repo.name + '/pulls');
    });

    function isRecentEvent(event) {
        return new Date(event.created_at) >= today;
    }

    function hasRecentEvents(eventsPage) {
        return !_.some(eventsPage, isRecentEvent);
    }

    var events = yield githubRequestAllPages(
        '/users/%user/events/orgs/%org',
        {},
        hasRecentEvents  // stop if the fetched page
                         // doesn't have anything recent
    );

    var totalCommits = 0;
    var commitStats = {};

    events
    .filter(isRecentEvent)
    .filter(function isPushEvent(event) {
        return event.type === 'PushEvent';
    })
    .forEach(function addEventCommits(event) {
        if (commitStats[event.actor.login] === undefined) {
            commitStats[event.actor.login] = 0;
        }

        commitStats[event.actor.login] += event.payload.distinct_size;
        totalCommits += event.payload.distinct_size;
    });

    var topCommiter = {
        login: 'Nobody',
        commits: 0
    };

    if (totalCommits) {
        topCommiter = _
            .chain(commitStats)
            .pairs()
            .max(function(pair) { return pair[1]; })
            .value();

        topCommiter = {
            login: topCommiter[0],
            commits: topCommiter[1]
        };
    }

    stats.todayCommitsCount = totalCommits;
    stats.topCommiter = topCommiter.login;
    //logger.info('Fetched', totalCommits, 'commits');
    //logger.info('Commit stats', commitStats);
    //logger.info('Top Committer', topCommiter);

    var results = yield Promise.settle(pullsPromises);
    results.forEach(function (result) {
        if (result.isFulfilled()) {
            stats.pullRequestsCount += result.value().length;
        }
    });

    return {
        pull_requests: stats.pullRequestsCount,
        commits: stats.todayCommitsCount,
        top_commiter: stats.topCommiter
    };
}

function githubRequest(path, qs) {
    path = path
           .replace('%org', exports.options.org)
           .replace('%user', exports.options.user);

    var config = {
        url: exports.options.serverUrl + path,
        headers: {
            'User-Agent': 'Heartbeat',
            Accept: 'application/vnd.github.v3+json',
            Authorization: exports.options.authorizationToken
        },
        qs: qs,
        json: true
    };

    return request(config).then(function(result) {
        var response = result[0];

        if (response.statusCode < 400) {
            return response;
        }

        var error = new Error(
            path +
            ': ' +
            http.STATUS_CODES[response.statusCode] +
            ': ' +
            JSON.stringify(response.body)
        );
        error.config = config;
        error.response = response;
        throw error;
    });
}

function githubRequestAllPages(path, qs, shouldStop) {
    var items = [];
    qs = qs || {};

    function getRest(page) {
        var pageQuery = _.merge(qs, {
            page: page,
            per_page: qs.per_page || 100
        });

        return githubRequest(path, pageQuery)
            .then(function(response) {
                items.push.apply(items, response.body);

                var hasNext = response.headers.link &&
                              response.headers.link.indexOf('rel="next"') >= 0;

                var done = !hasNext || (shouldStop && shouldStop(response.body));
                return done ? items : getRest(page + 1);
            });
    }

    return getRest(1);
}
