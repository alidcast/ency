import createTimeout from './Timeout'

/**
 * {TaskInjections} are helpers functions for common async operations that
 * automatically clean up after themselves (or have ways of being identified
 * and canceled) upon task cancelation.
 */
export default function createTaskInjections () {
  return {
    timeout: (duration) => createTimeout(duration)
  }
}
