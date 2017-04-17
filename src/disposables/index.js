import createTimeout from './Timeout'

/**
 * {Disposables} are async helper operations that automatically clean up
 * after themselves (or have ways of being identified and canceled) upon
 * task cancelation.
 */
export default function createDisposables () {
  return {
    timeout: (duration) => createTimeout(duration)
  }
}
