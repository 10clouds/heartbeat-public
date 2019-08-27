const logger = require('../utils/logger.js');
const request = require('../utils/request.js');

module.exports = exports = {
    uniqueId: 'dribbble',
    options: {
        serverUrl: 'https://api.dribbble.com/v2/user/shots',
        token: '',
    },
    httpRoute: '/dribbble/all',
    refetchInterval: 1000 * 5 * 60,
    fetchData,
};

const MaxOldShots = 15;

async function fetchData() {
    const [res] = await request({
        url: this.options.serverUrl,
        qs: {
            access_token: this.options.token,
        },
        json: true,
    });
    const maxLength = Math.min(MaxOldShots, res.body.length);

    return res.body.slice(0, maxLength).map(
        shots => shots.images.two_x || shots.images.normal
    );
}
