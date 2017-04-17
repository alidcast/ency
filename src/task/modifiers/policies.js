import assert, { isObj } from '../../util/assert'

/**
*  Scheduling {Policies} define if and when task instances are be run.
*
*  @constructs task policies
*/
export default function createPolicies (_type = 'default', _num = 1, _time = 0) {
  const flowTypes = ['default', 'enqueue', 'restart', 'drop']

  const currentPolicies = {
    flow: _type,
    delay: _time,
    maxRunning: _num
  }

  return {
    get policies () {
      return currentPolicies
    },

    /**
     *  Sets the scheduling rule for repeat calls.
     *  @this the {Task} property where the task policy is destructured.
     */
    flow (type, opts = {}) {
      assert(flowTypes.indexOf(type) > -1, `${type} is not a flow control option`)
      assert(isObj(opts), `Additional flow options must be passed as an object.`)
      currentPolicies.flow = type
      if (Reflect.has(opts, 'delay')) currentPolicies.delay = opts.delay
      if (Reflect.has(opts, 'maxRunning')) currentPolicies.maxRunning = opts.maxRunning
      return this
    }
  }
}
