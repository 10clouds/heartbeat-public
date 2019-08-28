FROM node:12.4.0

MAINTAINER wiktor.obrebski <wiktor.obrebski@10clouds.com>

RUN npm install -g bower gulp

ADD . /app

WORKDIR /app

RUN bower install --allow-root
