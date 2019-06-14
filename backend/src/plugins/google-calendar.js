const logger = require('../utils/logger.js');
const { google } = require('googleapis');
const googleCredentials = require('../google-account-creds.js');

module.exports = exports = {
    uniqueId: 'google-calendar',
    options: {
        calendarId: '',
    },
    httpRoute: '/google-calendar/all',
    refetchInterval: 1000 * 5 * 60,
    fetchData,
};

const DefaultEvent = {
    summary: 'Brak nadchodzących wydarzeń',
    startDate: '',
};

async function fetchData() {
    if (!googleCredentials) {
        logger.warn('Can not find "google-auth.json" file with google credentials.');
        return DefaultEvent;
    }

    const auth = await google.auth.getClient({
        credentials: googleCredentials,
        scopes: [
            'https://www.googleapis.com/auth/calendar.events.readonly'
        ]
    });

    // obtain the current project Id
    const project = await google.auth.getProjectId();

    const calendar = google.calendar({version: 'v3', project, auth});

    const now = (new Date()).toISOString();
    const calendarsRes = await calendar.events.list({
      timeMin: now,
      calendarId: this.options.calendarId,
      maxResults: 1,
    });

    const items = calendarsRes.data.items;
    const nextEvent = calendarsRes.data.items.length > 0 ?
        mapExternalEvent(items[0]) : DefaultEvent;
    return nextEvent;
}

function mapExternalEvent(event) {
    return {
        summary: event.summary,
        startDate: event.start.date,
    }
}
