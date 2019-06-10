FROM jorgenfb/nginx-nodejs
MAINTAINER wiktor.obrebski <wiktor.obrebski@10clouds.com>

RUN npm install -g bower gulp

ADD ./bower.json /usr/share/nginx/html/bower.json
ADD . /usr/share/nginx/html

WORKDIR /usr/share/nginx/html
RUN bower install --allow-root

ADD ./nginx.conf /etc/nginx/nginx.conf

CMD 'nginx'
