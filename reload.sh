#!/bin/bash
docker stop heartbeat_backend_container
docker stop heartbeat_frontend_container
git pull
docker build --rm -t heartbeat_frontend frontend
docker build --rm -t heartbeat_backend backend
docker rm heartbeat_backend_container heartbeat_frontend_container
docker run -d -it -p 3000:3000 -p 8123:8123 -v /mnt/heartbeat.docker.volume:/mnt/external.volume --name heartbeat_backend_container heartbeat_backend
docker run -d -it -p 8080:80 --name heartbeat_frontend_container heartbeat_frontend
