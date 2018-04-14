#!/bin/bash

unset BASE_URL
until [ "${BASE_URL:-}" ]
do
  echo "DOING"
    rootURL=$(curl --connect-timeout 5 'pl_song_service_ngrok:4040/api/tunnels' \
              | sed -nE 's/.*public_url":"https:..([^"]*).*/\1/p')
    echo $rootUrL
    if [ -n "$rootURL" ]
    then
      export BASE_URL="https://${rootURL}"
    else
      sleep 2
    fi
done 

echo "SETTING BASE_URL to: ${BASE_URL}"
env-cmd .env nodemon index.js