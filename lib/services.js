const EventStream = require('../deps/event-stream/EventStream')
const EventStreamGroup = require('../deps/event-stream/EventStreamGroup')

const instance = new EventStreamGroup([
  new EventStream('world', process.env.CLOUDAMQP_URL),
])

Object.freeze(instance)
module.exports = instance