import assert, { isObj } from '../../util/assert'

/**
*  The {TaskPolicy} sets the default scheduling for the task
*  with configuration option.
*
*  @this the {TaskProperty} where the task policy is destructured
*  @constructs TaskPolicy
*/
export default function createTaskPolicy (_type = 'default', _num = 1, _time = 0) {
  const flowTypes = ['default', 'enqueue', 'restart', 'drop']

  const currentPolicy = {
    flow: _type,
    delay: _time,
    maxRunning: _num
  }

  return {
    // default configuration
    get policies () {
      return currentPolicy
    },

    /**
     *  Sets the scheduling rule for repeat calls.
     */
    flow (type, opts = {}) {
      assert(flowTypes.indexOf(type) > -1, `${type} is not a flow control option`)
      assert(isObj(opts), `Additional flow options must be passed as an object.`)
      currentPolicy.flow = type
      if (Reflect.has(opts, 'delay')) currentPolicy.delay = opts.delay
      if (Reflect.has(opts, 'maxRunning')) currentPolicy.maxRunning = opts.maxRunning
      return this
    }
  }
}
