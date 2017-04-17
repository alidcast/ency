/* eslint-disable no-unused-expressions */
/* global describe, it, expect, beforeEach, sinon */

import createRunner from 'src/task/Runner'
import initInstanceFactory from 'src/task/Instance'
import createSubscriptions from 'src/task/modifiers/subscriptions'
import createCancelableTimeout from 'src/disposables/Timeout'
import { pause } from 'src/util/async'

const { stub, spy } = sinon

const { ...callbacks } = createSubscriptions()
const createInstance = initInstanceFactory()

function * simpleTask () {
  return 'success'
}

function * taskWithFinal (callback) {
  try {
    yield pause(500)
  } finally {
    callback()
  }
}

describe('Task Runner - Generator Functions', function () {
  var runner

  beforeEach(() => {
    runner = createRunner(callbacks)
  })

  it('solves empty function', async () => {
    const ti = createInstance({ operation: function * () {} })
    await runner.runThrough(ti)
    expect(ti.value).to.be.undefined
    expect(ti.error).to.be.null
  })

  it('resolves yields from primitives', async () => {
    const ti = createInstance({ operation: simpleTask })
    await runner.runThrough(ti)
    expect(ti.value).to.equal('success')
  })

  it('resolves yields from function', async () => {
    function * operation () { return yield stub().returns('success')() }
    const ti = createInstance({ operation })
    await runner.runThrough(ti)
    expect(ti.value).to.equal('success')
  })

  it('resolves yields from async function ', async () => {
    async function asyncFn () { return await stub().returns('success')() }
    const operation = function * () { return yield asyncFn() }
    const ti = createInstance({ operation })
    await runner.runThrough(ti)
    expect(ti.isResolved).to.true
    expect(ti.value).to.equal('success')
  })

  it('resolves the task instance', async () => {
    function * operation () { return 'success' }
    const ti = createInstance({ operation })
    await runner.runThrough(ti)
    expect(ti.hasStarted).to.be.true
    expect(ti.isResolved).to.be.true
    expect(ti.isRejected).to.be.false
    expect(ti.isCanceled).to.be.false
    expect(ti.value).to.equal('success')
  })

  it('rejects the task instance', async () => {
    function * operation () { return yield stub().returns('failed').throws()() }
    const ti = createInstance({ operation })
    await runner.runThrough(ti)
    expect(ti.isRejected).to.be.true
    expect(ti.isResolved).to.be.false
    expect(ti.isCanceled).to.be.false
    expect(ti.value).to.be.null
    expect(ti.error).to.not.be.null
  })

  it('drops the task', () => {
    const ti = createInstance({ operation: simpleTask })
    const runner = createRunner(callbacks)
    runner.triggerCancel(ti)
    runner.runThrough(ti)
    expect(ti.hasStarted).to.be.false
    expect(ti.isCanceled).to.be.true
    expect(ti.isDropped).to.be.true
    expect(ti.value).to.be.null
    expect(ti.error).to.be.null
  })

  it('cancels the task', async () => {
    function * operation () { return yield pause(500) }
    const ti = createInstance({ operation })
    const ongoing = runner.runThrough(ti)
    runner.triggerCancel(ti)
    await ongoing
    expect(ti.isCanceled).to.be.true
    expect(ti.isResolved).to.be.false
    expect(ti.isRejected).to.be.false
    expect(ti.value).to.be.null
    expect(ti.error).to.be.null
  })

  it('clears timeout upon cancelation', async () => {
    // test timeout cancelation individually
    const timeoutPreTest = createCancelableTimeout(600)
    timeoutPreTest.unsubscribe()
    expect(timeoutPreTest._v).to.be.equal('timeout canceled')
    expect(timeoutPreTest.isCanceled).to.be.true

    // test runner cancelation of timeout
    var timeout
    function * operation () {
      timeout = createCancelableTimeout(1800)
      yield timeout
    }
    const ti = createInstance({ operation })
    runner.runThrough(ti)
    await pause(0) // wait for timeout to be set
    runner.triggerCancel(ti)
    await timeout
    expect(ti.isCanceled).to.be.true
    expect(timeout.isCanceled).to.be.true
    expect(timeout._v).to.be.equal('timeout canceled')
  })

  it('does not run dropped instance at all', () => {
    const callback = spy()
    const ti = createInstance({ operation: taskWithFinal.bind(null, callback) })
    runner.triggerCancel(ti)
    runner.runThrough(ti)
    expect(ti.isDropped).to.be.true
    expect(callback.called).to.be.false
  })

  it('runs finally block upon completion', async () => {
    const callback = spy()
    const ti = createInstance({ operation: taskWithFinal.bind(null, callback) })
    await runner.runThrough(ti)
    expect(callback.called).to.be.true
  })

  it('runs finally block upon cancelation', async () => {
    const callback = spy()
    const ti = createInstance({ operation: taskWithFinal.bind(null, callback) })
    const runner = createRunner(callbacks)
    const ongoing = runner.runThrough(ti)
    await pause(5) // wait for instane to start
    runner.triggerCancel(ti)
    await ongoing
    expect(ti.isCanceled).to.be.true
    expect(callback.called).to.be.true
  })

  it('resolves yields server request', async () => {
    function * taskReq () {
      const server = sinon.fakeServer.create()
      server.respondWith('GET',
        '/fake/req',
        [200,
          { 'Content-Type': 'application/json' },
          'Success'
        ])

      function getReq () {
        const xhr = new XMLHttpRequest()
        let req
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4 && xhr.status === 200) {
            req = xhr.responseText
          }
        }
        xhr.open('GET', '/fake/req')
        xhr.send()
        server.respond()
        return req
      }
      return yield getReq()
    }

    const ti = createInstance({ operation: taskReq })
    const runner = createRunner(callbacks)
    await runner.runThrough(ti)
    expect(ti.isResolved).to.be.true
    expect(ti.isRejected).to.be.false
    expect(ti.value).to.equal('Success')
  })
})

describe('Task runner - Async Functions', function () {
  // TODO more async tests
  it('resolves operation', async () => {
    async function operation () { return 'success' }
    const ti = createInstance({ operation })
    const runner = createRunner(callbacks)
    await runner.runThrough(ti)
    expect(ti.isResolved).to.be.true
    expect(ti.isRejected).to.be.false
    expect(ti.value).to.equal('success')
    expect(ti.error).to.be.null
  })

  it('rejects the task instance', async () => {
    async function operation () { return await stub().returns('failed').throws()() }
    const ti = createInstance({ operation })
    const runner = createRunner(callbacks)
    await runner.runThrough(ti)
    expect(ti.isRejected).to.be.true
    expect(ti.isResolved).to.be.false
    expect(ti.value).to.be.null
    expect(ti.error).to.not.be.null
  })
})
