const express = require('express')
const router = express.Router()
const lib = require('../../../lib/lib')

function helloWorld(req, res, next) {
  lib.helloWorld()
    .then(result => res.status(200).json({ message: result.message }))
    .catch(err => handleError(res, err))
}

function handleError(res, err) {
  console.log(err);
  return res.status(err.statusCode).json({ message: err.message })
}

router.get('/', helloWorld)

module.exports = router
