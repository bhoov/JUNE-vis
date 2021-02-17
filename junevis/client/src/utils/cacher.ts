// Use require syntax. import * doesn't work with TS
var LRU = require("lru-cache")

/**
 * Memoize an arbitrary function
 *
 * @param fn Function to memoize the result of
 */
export function memoize<T>(fn: (...args: any[]) => T): (...args: any[]) => T {
    const cache = new LRU(100) // Sets max size

    return (...args: any[]) => {
        const key = JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key)
        }

        const result = fn(...args)
        cache.set(key, result)
        return result
    }
}
