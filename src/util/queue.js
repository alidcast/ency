/**
 * Creates a Queue implementation using array properties.
 * @param  {Array}  queue - starting queue
 *
 * @constructs Queue
 */
export default function createQueue (queue = []) {
  return {
    forEach: queue.forEach.bind(queue),
    map: queue.map.bind(queue),
    concat: queue.concat.bind(queue),

    /**
     * Adds an item or a list of items to the queue.
     *
     * @example
     *  [4, 3, 2] -> [3, 2]
     */
    add (...args) {
      args.forEach(item => queue.push(item))
      return queue.slice()
    },

    /**
     * Removes an item or a group of items from the queue.
     *
     * @example
     *  [4, 3, 2, 1] -> [2, 1] (returns [4, 3])
     */
    remove (num = 1) {
      let amount = num >= this.size ? this.size : num
      const removed = []
      while (amount > 0) {
        const item = queue.shift() // remove from beginning
        removed.push(item)
        amount--
      }
      return num === 1 ? removed.pop() : removed
    },

    /**
     * Extracts items from array based on predicate.
     *
     * @example
     *  [1, 'string'].extract((item) => typeof item == 'number') -> ['string']
     */
    extract (pred) {
      const extracted = []
      for (let i = queue.length - 1; i >= 0; i--) {
        if (pred(this.peek(i))) {
          const removed = queue.splice(i, 1)
          extracted.unshift(...removed)
        }
      }
      return extracted
    },

    clear () { // empties out entire array.
      queue.length = 0
    },

    peek (index = 0) { // return shallow copy of a value inside the array
      return queue.slice(index, index + 1).pop()
    },

    peekAll () { // return a shallow copy of entire array
      return queue.slice()
    },

    get size () {
      return queue.length
    },

    get isActive () {
      return this.size > 0
    }
  }
}
