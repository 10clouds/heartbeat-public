FROM node:0.11.16-onbuild
MAINTAINER wiktor.obrebski <wiktor.obrebski@10clouds.com>

# Install file system watcher to auto-reload node during development
RUN mkdir -p /mnt/external.volume && echo '5' > /mnt/external.volume/network.stats
RUN /usr/local/bin/npm install -g nodemon@1.3.5
CMD ["node", "--harmony", "src/index.js"]
