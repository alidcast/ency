/**
 * Initialize task factory.
 *
 * @param {Function} runner - operation runner
 */
export default function instanceFactory (runner) {
  /**
   * A {TaskInstance} exposes the state and controls for an instance of
   * the task's core operation.
   *
   * @param {Function} data - instance data
   * @constructor Task Instance
   */
  return ({ operation, params, options }) => ({
    _operation: operation,
    _runningOperation: null,

    // per instance data
    params,
    options: {
      keepActive: options ? options.keepActive : false
    },

    // results
    value: null,
    error: null,

    // states
    hasStarted: false,
    isCanceled: false,
    isRejected: false,
    isResolved: false,

    // computed states
    isDropped: false,
    isRestarted: false,
    isRunning: false,
    isFinished: false,
    state: 'waiting',
    _updateComputed () {
      this.isDropped = !this.hasStarted && this.isCanceled
      this.isRestarted = this.hasStarted && this.isCanceled
      this.isFinished = this.isCanceled || this.isRejected || this.isResolved
      this.isRunning = this.hasStarted && !this.isFinished
      this.state = getState(this)
    },

    _start () {
      this._runningOperation = runner.runThrough(this)
      return this._runningOperation
    },

    /**
     *  An instance can be canceled by the 'scheduler' (e.g. due to flow control)
     *  or 'self' canceled (e.g. if the task was aborted).
     */
    selfCanceled: false,
    cancel () {
      return this._cancel('self')
    },
    _cancel (canceler = 'scheduler') {
      if (canceler === 'self') this.selfCanceled = true
      runner.triggerCancel(this)
      return this._runningOperation
    },

    dispose () { // cancel and remove an instance that was kept active
      if (!this.isFinished) this._cancel('self')
      // call the resulting handle method returned by runner
      this._runningOperation.then(resolved => resolved())
      return this._runningOperation
    }
  })
}

function getState (tp) {
  if (tp.isDropped) return 'dropped'
  else if (tp.isCanceled) return 'canceled'
  else if (tp.isRejected) return 'rejected'
  else if (tp.isResolved) return 'resolved'
  else if (tp.isRunning) return 'running'
  else return 'waiting'
}
