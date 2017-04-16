/* eslint-disable no-unused-expressions */
/* global describe, it, expect, beforeEach */

import createTask from 'src/task/index'
import createScheduler from 'src/task/Scheduler'
import createPolicies from 'src/task/modifiers/policies'

function * exTask (error = false) {
  yield 'ongoing'
  if (error) throw new Error()
  else return yield 'passed'
}

describe('Task Scheduler', function () {
  var task,
      ti1,
      ti2,
      ti3,
      ti4,
      scheduler,
      autoScheduler

  beforeEach(() => {
    const { policies } = createPolicies('enqueue', 2)
    task = createTask(null, exTask, false)
    ti1 = task.run()
    ti2 = task.run()
    ti3 = task.run()
    ti4 = task.run(true)
    scheduler = createScheduler(task, policies, false)
    autoScheduler = createScheduler(task, policies, true)
  })

  it('schedules the task', () => {
    scheduler.schedule(ti1)
    expect(scheduler.waiting.size).to.equal(1)
    expect(scheduler.running.size).to.equal(0)
  })

  it('schedules multiple tasks', () => {
    scheduler.schedule(ti1).schedule(ti2).schedule(ti3)
    expect(scheduler.waiting.size).to.equal(3)
    expect(scheduler.running.size).to.equal(0)
  })

  it('moves one task from waiting to running', () => {
    scheduler.schedule(ti1).schedule(ti2).schedule(ti3)
    expect(task.lastStarted).to.be.null
    scheduler.advance()
    expect(scheduler.waiting.size).to.equal(2)
    expect(scheduler.running.size).to.equal(1)
    expect(task.lastStarted).to.equal(ti1)
  })

  it('moves multiple tasks from waiting to running', () => {
    scheduler.schedule(ti1).schedule(ti2).advance().advance()
    expect(scheduler.waiting.size).to.equal(0)
    expect(scheduler.running.size).to.equal(2)
  })

  it('removes one finished task from running', async () => {
    scheduler.schedule(ti1).advance()
    await ti1._runningOperation
    expect(scheduler.running.size).to.equal(0)
  })

  it('removes multiple finished tasks from running', async () => {
    scheduler.schedule(ti1).schedule(ti2).advance().advance()
    await ti1._runningOperation
    await ti2._runningOperation
    expect(scheduler.running.size).to.equal(0)
  })

  it('finalizes canceled instances', async () => {
    scheduler.schedule(ti1).advance()
    await ti1._cancel()
    expect(task.lastCanceled).to.equal(ti1)
    expect(scheduler.running.size).to.equal(0)
    expect(scheduler.running.isActive).to.be.false
  })

  it('gets is active', async () => {
    scheduler.schedule(ti1)
    expect(scheduler.isActive).to.be.true
    scheduler.advance()
    expect(scheduler.isActive).to.be.true
    await ti1._runningOperation
    expect(scheduler.isActive).to.be.false
  })

  it('returns cleared instances', () => {
    scheduler.schedule(ti1).schedule(ti2).advance(ti3)
    const canceledInstances = scheduler.clear()
    expect(canceledInstances.length).to.equal(3)
  })

  it('updates last resolved', async () => {
    scheduler.schedule(ti1).advance()
    await ti1._runningOperation
    expect(task.lastResolved).to.equal(ti1)
  })

  it('updates last rejected', async () => {
    scheduler.schedule(ti4).advance()
    await ti4._runningOperation
    expect(task.lastRejected).to.equal(ti4)
    expect(task.lastResolved).to.be.null
    expect(task.lastCanceled).to.be.null
  })

  it('updates last canceled', async () => {
    scheduler.schedule(ti1)
    ti1._cancel()
    scheduler.advance()
    await ti1._runningOperation
    expect(task.lastCanceled).to.equal(ti1)
    expect(task.lastResolved).to.be.null
    expect(task.lastRejected).to.be.null
  })

  it('updates multiple last', async () => {
    scheduler.schedule(ti1).schedule(ti4).schedule(ti2)
    ti2._cancel()
    scheduler.advance()
    await ti1._runningOperation
    scheduler.advance()
    await ti4._runningOperation
    scheduler.advance()
    await ti2._runningOperation
    expect(task.lastResolved).to.equal(ti1)
    expect(task.lastRejected).to.equal(ti4)
    expect(task.lastCanceled).to.equal(ti2)
  })

  it('runs differently finished functions', async () => {
    scheduler.schedule(ti1).schedule(ti2).advance().advance()
    ti2._cancel()
    await ti1._runningOperation
    expect(scheduler.waiting.size).to.equal(0)
    expect(scheduler.running.size).to.equal(0)
    expect(task.lastCanceled).to.be.equal(ti2)
    expect(task.lastResolved).to.be.equal(ti1)
  })

  it('auto - empties out queues and cancels instances', async () => {
    scheduler.schedule(ti1).schedule(ti2).schedule(ti3).advance().clear()
    expect(scheduler.waiting.size).to.equal(0)
    expect(scheduler.running.size).to.equal(0)
    expect(ti1.isCanceled).to.be.true
    expect(ti2.isCanceled).to.be.true
    expect(ti3.isCanceled).to.be.true
  })

  it('auto - runs resolved', async () => {
    autoScheduler.schedule(ti1)
    await ti1._runningOperation
    expect(autoScheduler.waiting.size).to.equal(0)
    expect(autoScheduler.running.size).to.equal(0)
    expect(task.lastResolved).to.equal(ti1)
  })

  it('auto - runs rejected', async () => {
    autoScheduler.schedule(ti4)
    await ti4._runningOperation
    expect(autoScheduler.waiting.size).to.equal(0)
    expect(autoScheduler.running.size).to.equal(0)
    expect(task.lastRejected).to.equal(ti4)
  })

  it('auto - concurrently runs differently finished functions', async () => {
    autoScheduler.schedule(ti1).schedule(ti2).schedule(ti4).schedule(ti3)
    ti2._cancel()
    await ti1._runningOperation
    expect(task.lastResolved).to.be.equal(ti1)
    await ti4._runningOperation
    await ti3._runningOperation
    expect(autoScheduler.waiting.size).to.equal(0)
    expect(autoScheduler.running.size).to.equal(0)
    expect(task.lastCanceled).to.be.equal(ti2)
    expect(task.lastResolved).to.be.equal(ti3)
    expect(task.lastRejected).to.be.equal(ti4)
  })

  it('(concurrency) does not pass running limit', async () => {
    autoScheduler.schedule(ti1).schedule(ti2).schedule(ti3)
    expect(autoScheduler.waiting.size).to.equal(1)
    expect(autoScheduler.running.size).to.equal(2)
  })

  it('(flow) default - runs all instances and updates scheduler last', async () => {
    const defaultPolicies = createPolicies().policies
    const defaultScheduler = createScheduler(task, defaultPolicies, true)
    defaultScheduler.schedule(ti1).schedule(ti2)
    expect(task.lastStarted).to.equal(ti2)
    await ti2._runningOperation
    expect(ti1.hasStarted).to.be.true
    expect(ti2.hasStarted).to.be.true
    expect(task.lastResolved).to.equal(ti2)
  })

  it('(flow) drop - ignores repeat calls and updates last', async () => {
    const dropPolicies = createPolicies('drop', 1).policies
    const dropScheduler = createScheduler(task, dropPolicies, true)
    dropScheduler
      .schedule(ti1)
      .schedule(ti2) // dropped
    await ti1._runningOperation
    await ti2._runningOperation
    expect(task.lastResolved).to.equal(ti1)
    expect(task.lastCanceled).to.equal(ti2)
    expect(ti2.isDropped).to.be.true
    expect(dropScheduler.isActive).to.be.false
  })

  it('(flow) restart - cancels previous calls and updates last', async () => {
    const restartPolicies = createPolicies('restart', 1).policies
    const restartScheduler = createScheduler(task, restartPolicies, true)
    restartScheduler
      .schedule(ti1) // canceled
      .schedule(ti2) // started
    await ti1._runningOperation
    await ti2._runningOperation
    expect(task.lastStarted).to.equal(ti2)
    expect(task.lastCanceled).to.equal(ti1)
    expect(ti2.isResolved).to.be.true
    expect(ti1.isCanceled).to.be.true
  })
})
