const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    res.status(200).json({ message: 'success' })
})

router.use('/helloWorld', require('./subroutes/helloWorld'))

// used to make sure testing heroku-app is awake
router.use('/ping', (req, res, next) => {
  res.status(200).json({ message: 'me' })
})

module.exports = router
