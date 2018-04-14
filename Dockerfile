FROM node:8.9

# Create new user
RUN useradd -ms /bin/bash playola

# install heroku command line
# Install app dependencies


USER playola
WORKDIR /home/playola

USER root
RUN chown -R playola /usr/local
RUN apt-get update && apt-get -q -y install \
    nodejs\
    npm \
    git \
    build-essential

USER playola

COPY package.json /home/playola/

RUN npm install -g npm@latest \
    node-gyp \
    env-cmd \
    nodemon \
    env-cmd \
    ngrok
RUN npm install

USER root
COPY setBaseURLAndStart.sh /home/playola/setBaseURLAndStart.sh
RUN chmod +x /home/playola/setBaseURLAndStart.sh

USER playola
# Bundle app source
# (removing for -v instead)
# COPY . /usr/src/app          
