/**
 *  Cancelable Timeout hack.
 *
 *  @notes
 *    - Super() does not have `this` context so we have to use closures
 *      for the cancelation data.
 *    - Methods outside the constuctor do not persist with the extended
 *      promise object so we have to declare them via `this`.
 *
 *  @constructor Timeout
 */
export default function createCancelableTimeout (duration) {
  var timerId,
      cancelPromise

  class Timer extends Promise {
    constructor () {
      // Promise Construction
      super((resolve, reject) => {
        cancelPromise = resolve.bind(null, 'timeout canceled')
        timerId = setTimeout(function () {
          resolve('timeout done')
        }, duration)
      })
      // Timer Cancelation
      this.isCanceled = false
      this.unsubscribe = function () {
        if (this._v !== 'timeout done') {
          cancelPromise()
          clearTimeout(timerId)
          this.isCanceled = true
        }
      }
    }
  }
  // For this to work in Safari, we have to convert the timer back to a Promise
  Timer.prototype.constructor = Promise
  return new Timer()
}
