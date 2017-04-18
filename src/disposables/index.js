import createTimeout from './Timeout'

export const timeout = (duration) => createTimeout(duration)

/**
 * {Disposables} are async helper operations that automatically clean up
 * after themselves (or have ways of being identified and canceled) upon
 * task cancelation.
 */
export default function createDisposables () {
  return {
    timeout
  }
}
