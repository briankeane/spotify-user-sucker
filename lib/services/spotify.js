const axios = require('axios')
const api = axios.create({
  baseURL: process.env.SERVICE_BASE_URL_SPOTIFY_INTERFACE
})
const { httpErrorFromAPIError } = require('./utils')

// use this to talk to the other services
function getSongWithID(spotifyID) {
  return new Promise((resolve, reject) => {
    api.get(`/songs/${spotifyID}`)
      .then(res => resolve(res.data))
      .catch(err => {
        if (err.statusCode && (err.statusCode == 503)) {
          getSongWithID(spotifyID)
            .then(data => resolve(data))
            .catch(err => reject(err))
        } else {
          reject(httpErrorFromAPIError(err))
        }
      })
  })
}

module.exports = {
  getSongWithID
}