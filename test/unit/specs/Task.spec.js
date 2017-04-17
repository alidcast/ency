/* eslint-disable no-unused-expressions */
/* global describe, it, expect, beforeEach, sinon */

import initTask from 'src/task/index'

const { spy } = sinon
const createTask = initTask(null) // init without a host

function * exTask () { return yield 'passed' }

describe('Task', function () {
  var task,
      callback
  beforeEach(() => {
    task = createTask(exTask, true)
    callback = spy()
  })

  it('has correct states', () => {
    expect(task.isActive).to.be.false
    expect(task.isIdle).to.be.true
  })

  it('has correct last data', () => {
    expect(task.lastCalled).to.not.be.undefined
    expect(task.lastStarted).to.not.be.undefined
    expect(task.lastResolved).to.not.be.undefined
    expect(task.lastRejected).to.not.be.undefined
    expect(task.lastCanceled).to.not.be.undefined
  })

  it('has correct actions', () => {
    expect(task.run).to.not.be.undefined
    expect(task.abort).to.not.be.undefined
  })

  it('run - schedules task and returns task instance', async () => {
    const ti = task.run()
    expect(ti).to.not.be.undefined
    await ti._runningOperation
    expect(ti.isResolved).to.be.true
  })

  it('aborts all instances and clears queue', async () => {
    const ti1 = task.run()
    const ti2 = task.run()
    task.abort()
    expect(ti1.isCanceled).to.be.true
    expect(ti2.isCanceled).to.be.true
    await ti1._runningOperation
    await ti2._runningOperation
    expect(task.isActive).to.be.false
  })

  it('updates and resets isAborted', async () => {
    task.run()
    task.abort()
    expect(task.isAborted).to.be.true
    task.run()
    expect(task.isAborted).to.be.false
  })

  it('bindings - keeps instance alive and runs `onDispose` callback', async () => {
    const infiniteTask = createTask(exTask, true)
        .nthCall(1, { keepActive: true })
        .onDispose(() => callback())
    const ti = infiniteTask.run()
    await ti._runningOperation
    expect(infiniteTask.isActive).to.be.true
    infiniteTask.abort()
    expect(infiniteTask.isActive).to.be.false
    await ti._runningOperation
    expect(callback.called).to.be.true
  })

  it('subscriptions - finalizes dropped instances', async () => {
    const task = createTask(exTask, true)
      .flow('drop')
      .onFinish(() => callback())
    const ti1 = task.run()
    const ti2 = task.run()
    ti2.cancel()
    await ti1._runningOperation
    expect(ti2.isDropped).to.be.true
    expect(ti1.hasStarted).to.be.true
    expect(callback.called).to.be.true
  })

  it('subscriptions - finalizes waiting tasks', async () => {
    const task = createTask(exTask, true)
        .flow('enqueue')
        .onFinish(() => callback())
    task.run()
    task.run()
    const ti3 = task.run()
    task.abort()
    await ti3._runningOperation
    expect(callback.calledThrice).to.be.true
  })
})
