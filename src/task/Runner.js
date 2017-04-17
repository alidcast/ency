import { isObj } from '../util/assert'

/**
 * A {Runner} is responsible for running operation while managing an
 * instance's state and handling the executing of the necessary callbacks.
 *
 * @param {Object} callbacks - subscription callbacks
 * @constructs Runner
 */
export default function createRunner (callbacks) {
  /**
   * Helpers for handling the different stages of an instance's operation.
   */
  const handle = {
    async start (ti) {
      await callbacks.asyncBeforeStart(ti)
      ti.hasStarted = true
      ti._updateComputed()
      return ti
    },

    success (ti, val) {
      ti.isResolved = true
      ti.value = val
      ti._updateComputed()
      callbacks.onSuccess(ti)
      return ti
    },

    error (ti, err) {
      ti.isRejected = true
      ti.error = err
      ti._updateComputed()
      callbacks.onError(ti)
      return ti
    },

    cancel (ti, iter = null) {
      if (!ti.isDropped && iter) iter.return() // terminate early
      callbacks.onCancel(ti)
      return ti
    },

    end (ti, resultCallback, keptActive = false) {
      resultCallback()
      callbacks.onFinish(ti)
      if (keptActive) callbacks.onDispose(ti)
      return ti
    }
  }

  return {
    // For generator functions, on every yield, we store any cancelable promises
    // so that they can be canceled immediately upon cancelation
    _disposable: null,

    triggerCancel (ti) {
      if (ti.isFinished) return ti
      if (this._disposable) this._disposable.unsubscribe() // dispose immediately
      ti.isCanceled = true
      ti._updateComputed()
      // dropped instances are still "run" so that the runner can handle
      // the per instance logic (it won't actually run the operation)
      if (ti.isDropped) this.runThrough(ti)
      return ti
    },

    async runThrough (ti) {
      const { keepActive } = ti.options

      let resultCallback
      if (ti.isDropped) resultCallback = handle.cancel.bind(null, ti)           // CANCELED / PRE-START
      else if (!ti.hasStarted) {
        await handle.start(ti)
        if (ti.isCanceled) resultCallback = handle.cancel.bind(null, ti)        // CANCELED / POST-START
        else resultCallback = await runOperation(this, ti, handle)              // RESOLVED / REJECTED / CANCELED
      }

      if (!keepActive) return handle.end(ti, resultCallback)
      // defer execution of final callback for when instance is destroyed
      else return handle.end.bind(null, ti, resultCallback, true)
    }
  }
}

async function runOperation (runner, ti, handle) {
  var oper

  // Generator Function
  async function iterThrough (prev = undefined) {
    var output

    try {
      // await callbacks.asyncBeforeYield(ti) // TODO
      output = oper.next(prev)
    } catch (err) {                                                             // REJECTED
      return handle.error.bind(null, ti, err)
    }
    let val = output.value
    if (isObj(val) && val.unsubscribe) runner._disposable = val
    if (ti.isCanceled) return handle.cancel.bind(null, ti, oper)                // CANCELED / POST-YIELD

    val = await val
    if (output.done) return handle.success.bind(null, ti, val)                  // RESOLVED
    else return await iterThrough(val)
  }

  // Promise Function
  async function syncThrough () {
    return oper
      .then(val => handle.success.bind(null, ti, val))                          // RESOLVED
      .catch(err => handle.error.bind(null, ti, err))                           // REJECTED
  }

  oper = ti._operation() // start iterable or promise
  return 'next' in oper
    ? await iterThrough()
    : await syncThrough()
}
