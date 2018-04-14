const { assert } = require('chai')
const faker = require('faker')
const mocha = require('mocha')
const after = mocha.after
const before = mocha.before
const beforeEach = mocha.beforeEach
const afterEach = mocha.afterEach
const describe = mocha.describe
const it = mocha.it
const sinon = require('sinon')

const services = require('../lib/services')
const lib = require('../lib/lib')
const events = require('../lib/events')

describe('Hello World', function () {
  var publishStub
  // stub services
  beforeEach(function () {
    publishStub = sinon.stub(services.world, 'publish')
  })

  after(function () {
    publishStub.restore()
  })

  it ('hellos the world', async function () {
    const result = await lib.helloWorld()
    assert.equal(result.message, 'Hello World')
    sinon.assert.calledWith(publishStub, events.WORLD_CREATED, result) 
  })
})