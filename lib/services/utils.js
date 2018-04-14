const HttpError = require('../models/HttpError')

function httpErrorFromAPIError(error) {
  console.log('error: ', error)
  const res = error.response
  return new HttpError(res.status, res.data.message)
}

module.exports = {
  httpErrorFromAPIError
}