import assert, { isObj } from '../../util/assert'

export default function createTaskPolicy () {
  // const optionTypes = ['keepRunning']
  const options = {}

  return {
    get options () {
      return options
    },

    /**
     *  Per instance configuration.
     */
    nthCall (id, opts = {}) {
      assert(isObj(opts), `Per instance options must be passed as an object.`)
      options[id] = opts
      return this
    }
  }
}
