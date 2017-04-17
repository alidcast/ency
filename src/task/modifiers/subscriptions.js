/**
*  Callback {Subscribtions} are called depending on the stage or result
*  of the task.
*
*  @note
*  - We pass the taskInstance as the first parameter to all subscription
*    callbacks. It can be used directly, `(instance) => ..` or
*    destructured `{ selfCanceled }`.
*  - The caveat is that if using a task instance's methods that relies on its
*    own `this` context, such as the `cancel` method, then it cannot be
*    destructured and must be called as `instance.cancel()`, because `this`
*    is always the object that the method is called on. (Another option would
*    be to call it via the task property e.g. `this.task.lastCalled.cancel()`.)
*
*
*  @constructs task subscriptions
*/
export default function createSubscriptions (host) {
  var startFn,
      yieldFn,
      cancelFn,
      errorFn,
      successFn,
      finishFn,
      disposeFn

  return {
    /**
     * Task instance `before` callbacks.
     *  @note The functions are sync so that they can be used with timeout logic.
     */
    async asyncBeforeStart (taskInstance) {
      if (startFn) await Reflect.apply(startFn, host, [taskInstance])
    },
    async asyncBeforeYield (taskInstance) {
      if (yieldFn) await Reflect.apply(yieldFn, host, [taskInstance])
    },
    /**
     * Task instance `on` callbacks.
     */
    onCancel (taskInstance) {
      if (cancelFn) Reflect.apply(cancelFn, host, [taskInstance])
    },
    onError (taskInstance) {
      if (errorFn) Reflect.apply(errorFn, host, [taskInstance])
    },
    onSuccess (taskInstance) {
      if (successFn) Reflect.apply(successFn, host, [taskInstance])
    },
    onFinish (taskInstance) {
      if (finishFn) Reflect.apply(finishFn, host, [taskInstance])
    },
    /**
     * Task `on` callbacks.
     */
    onDispose (taskInstance) {
      if (disposeFn) Reflect.apply(disposeFn, host, [taskInstance])
    },

    /**
     * @this the {Task} property where the subscriptions are destructured.
     */
    subscriptions: {
      beforeStart (fn) {
        startFn = fn
        return this
      },
      beforeYield (fn) {
        yieldFn = fn
        return this
      },
      onCancel (fn) {
        cancelFn = fn
        return this
      },
      onError (fn) {
        errorFn = fn
        return this
      },
      onSuccess (fn) {
        successFn = fn
        return this
      },
      onFinish (fn) {
        finishFn = fn
        return this
      },
      onDispose (fn) {
        disposeFn = fn
        return this
      }
    }
  }
}
