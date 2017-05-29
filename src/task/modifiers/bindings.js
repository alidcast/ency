import assert, { isObj } from '../../util/assert'

/**
*  Task {Bindings} define options for a specific task instance.
*
*  @constructs task bindings
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
     *  @this the {Task} property where the bindings are destructured.
     */
    nthCall (id, opts = {}) {
      assert(isObj(opts), `Per instance options must be passed as an object.`)
      options[id] = opts
      return this
    }
  }
}
