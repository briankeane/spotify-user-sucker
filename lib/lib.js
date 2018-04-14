const spotify = require('./services/spotify')
const AWS = require('aws-sdk')
const services = require('./services')
const errors = require('./errors')
const events = require('./events')

function helloWorld() {
  return new Promise((resolve, reject) => {
    function finish(err, world) {
      if (err) return reject(err)
      services.world.publish(
        events.WORLD_CREATED,
        world
      )
      resolve(world)
    }
    console.log('finishing')
    finish(null, { message: 'Hello World'})
  })
}
module.exports = { 
  helloWorld
}
