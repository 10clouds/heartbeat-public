# SETUP
Be sure you have docker installed. Then run following commands:
```bash
docker-compose build
docker-compose run --rm frontend bower install --allow-root
docker-compose run --rm backend npm install
docker-compose up
```

Visit http://localhost:8080 to run app

# MANAGING
 - call `docker-compose start` / `docker-compose stop` to fastly start/stop containers
 - you need call `docker-compose up` when you make some changes to `docker-compose.yml` file
 - extend `backend/Dockerfile` or `frontend/Dockerfile` to install global container dependencies
 - Use `docker-compose run` cmd to manage application. Examples:
    - `docker-compose run --rm backend npm update`
    - `docker-compose run --rm frontend bower update --allow-root`

# How does it work?
When user connect, he'll recive most actuall data via socket communication.
Every later data fetch occures at different frequency, which depends on the source.
After every fetch, server stores results in file. So after every crash server would load stored file data.

# API
Server can response which every data collected via GET request (JSON):
 - *GET /all* - Sends all data object
 - *GET /ion/all* - Sends all data about ion
 - *GET /github/all* - Sends all data about github
 - *GET /rooms/all* - Sends all data about rooms
 - *GET /hipchat/all* - Sends all data about hipchat
 - *GET /weather/all* - Sends all data about weather

# DEPLOYING
First build docker images, for both, heartbeat backend and frontend.
```bash
docker build --rm -t heartbeat_backend backend
docker build --rm -t heartbeat_frontend frontend
```

Now run node server container and nginx container, use this commands:
```bash
docker run --rm -it -p 3000:3000 -p 8123:8123 -v /mnt/heartbeat.docker.volume:/mnt/external.volume.stats heartbeat_backend
docker run --rm -it -p 8080:80 heartbeat_frontend
```

It's will try to listening on following host ports: 8080, 3000, 8123
Port 8080 is heartbeat site static content. Second ones are backend.
Customize ports if you need it. Above commands run processes that should
be automatically pick up when their fall.
