import initInstanceFactory from './Instance'
import createScheduler from './Scheduler'
import createRunner from './Runner'
import createPolicies from './modifiers/policies'
import createBindings from './modifiers/bindings'
import createSubscriptions from './modifiers/subscriptions'

var mods = {}

/**
 * Initialize task factory with additional task modifiers.
 *
 */
export default function initTask (_mods) {
  mods = _mods
  return createTask
}

/**
 * A {Task} exposes state of all task instances and controls for creating
 * and destroying them.
 *
 * @param {Function} operation - the task's core function
 * @param {Boolean} autorun - whether to run automatically (primarily for testing)
 * @constructor Task
 */
export function createTask (operation, autorun = true) {
  const host = this
  const { policies, ...configurations } = createPolicies()
  const { options, ...bindings } = createBindings()
  const { subscriptions, ...callbacks } = createSubscriptions(host)

  const runner = createRunner(callbacks)
  const createInstance = initInstanceFactory(runner)

  let scheduler // bound on run
  return {
    _operation: operation,

    // last instance data
    lastCalled: null,
    lastStarted: null,
    lastResolved: null,
    lastRejected: null,
    lastCanceled: null,

    // state data
    isActive: false,
    isIdle: true,
    isAborted: false,
    state: 'idle',
    _updateState () {
      this.isActive = scheduler.running.isActive
      this.isIdle = !scheduler.running.isActive
      this.state = this.isActive ? 'active' : 'idle'
    },

    run (...params) { // schedules new task instance to run
      if (!scheduler) scheduler = createScheduler(this, policies)
      resetData(this)
      const instanceData = {
        params,
        operation: operation.bind(host, ...params),
        options: getInstanceOptions(scheduler, options)
      }
      const ti = createInstance(instanceData)
      if (autorun) scheduler.schedule(ti)
      return ti
    },

    abort () { // cancels and destroys all scheduled task instances.
      let canceledInstances
      if (scheduler && scheduler.isActive) {
        canceledInstances = scheduler.clear()
        this.isAborted = true
      }
      return canceledInstances || []
    },

    // task modifiers
    ...configurations,
    ...subscriptions,
    ...bindings,
    ...mods
  }
}

function resetData (task) {
  task.isAborted = false
}

function getInstanceOptions (scheduler, options) {
  const count = scheduler.waiting.size + scheduler.running.size + 1
  let instanceOptions
  if (options[count]) instanceOptions = options[count]
  return instanceOptions
}
