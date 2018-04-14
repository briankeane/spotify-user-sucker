const lib = require('./lib')
const status = require('./status')

function onWorldCreated(world) {
  console.log('react to worldCreated here')
}

module.exports = {
  onWorldCreated
}