import assert, { isObj } from '../../util/assert'

/**
*  Task {Bindings} define options for a specific task instance.
*
*  @constructs TaskPolicy
*/
export default function createBindings () {
  // const optionTypes = ['keepRunning']
  const options = {}

  return {
    get options () {
      return options
    },

    /**
     *  Per instance configuration.
     *  @this the {Task} property where the task policy is destructured.
     */
    nthCall (id, opts = {}) {
      assert(isObj(opts), `Per instance options must be passed as an object.`)
      options[id] = opts
      return this
    }
  }
}
