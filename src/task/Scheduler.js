import createQueue from '../util/queue'
import { pause } from '../util/async'

/**
 * A {Scheduler} is responsible for scheduling and running task instances
 * according to set concurrency policies.
 *
 * @param {Object} task - the task property
 * @param {Object} policy - scheduling policies
 * @param {Boolean} autorun - whether to run automatically (primarily for testing)
 * @constructs Task Scheduler
 */
export default function createTaskScheduler (task, policies, autorun = true) {
  var waiting = createQueue(),
      running = createQueue(),
      { flow, maxRunning, delay } = policies

  function shouldDrop () {
    return flow === 'drop' && (waiting.size + running.size === maxRunning)
  }

  function shouldRestart () {
    return flow === 'restart' && running.size === maxRunning
  }

  function shouldKeep () {
    return flow === 'keepLatest' && running.size === maxRunning
  }

  function shouldWait () {
    return flow !== 'default' // only custom flow types
  }

  function shouldRun () {
    return flow === 'default' || (waiting.isActive && running.size < maxRunning)
  }

  return {
    schedule (ti) { // determine if and when instance should be run
      task.lastCalled = ti
      if (shouldDrop()) {
        ti._cancel()
        this.finalize(ti, false)
      } else if (shouldWait()) {
        if (shouldRestart()) cancelQueued(running)
        else if (shouldKeep()) cancelQueued(waiting)
        waiting.add(ti)
        if (autorun) this.advance()
      } else this.advance(ti)
      return this
    },

    advance (ti = null) { // run instance directly OR get from waiting
      if (shouldRun()) {
        if (!ti) ti = waiting.remove()
        task.lastStarted = ti
        startInstance(ti, delay)
          .then(() => this.finalize(ti))
        running.add(ti)
        task._updateState()
      }
      return this
    },

    finalize (ti, didRun = true) { // update final state and cleanup
      const keep = ti.options.keepActive
      if (didRun && !keep) running.extract(item => item === ti) // remove itself
      updateLastFinished(task, ti)
      task._updateState()
      if (autorun && waiting.isActive) this.advance()
      return this
    },

    clear () { // cancel and clear all instances
      const instances = waiting.concat(running)
      cancelQueued(waiting, 'all').then(waiting.clear())
      cancelQueued(running, 'all') // running instances remove themselves
      task._updateState()
      return instances
    },

    get isActive () {
      return waiting.isActive || running.isActive
    },

    waiting: {
      get isActive () {
        return waiting.isActive
      },

      get size () {
        return waiting.size
      },

      peek () {
        return waiting.peekAll()
      },

      alias () {
        return waiting.alias
      }
    },

    running: {
      get isActive () {
        return running.isActive
      },

      get size () {
        return running.size
      },

      peek () {
        return running.peekAll()
      },

      alias () {
        return running.alias
      }
    }
  }
}

function startInstance (ti, delay) {
  if (delay > 0) return pause(delay).then(() => ti._start())
  else return ti._start()
}

function cancelQueued (queue, type = 'race') {
  // If there's only one item in queue, then we just cancel it directly (this
  // made the task-graph demo smoother, so it's "noticably" faster)
  if (queue.size === 1) {
    const ti = queue.remove()
    if (ti.options.keepActive) return ti.dispose()
    else return ti._cancel()
  } else {
    const canceledOperations = queue.map(ti => {
      if (ti.options.keepActive) return ti.dispose()
      else return ti._cancel()
    })
    return Promise[type](canceledOperations)
  }
}

function updateLastFinished (task, ti) {
  if (ti.isCanceled) task.lastCanceled = ti
  else if (ti.isRejected) task.lastRejected = ti
  else if (ti.isResolved) task.lastResolved = ti
}
