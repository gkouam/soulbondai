import { cache } from './redis-cache'

interface CacheDecoratorOptions {
  ttl?: number
  keyPrefix?: string
  condition?: (...args: any[]) => boolean
}

/**
 * Decorator to cache function results
 * @param options Cache options
 */
export function Cacheable(options: CacheDecoratorOptions = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      // Check if caching should be applied
      if (options.condition && !options.condition(...args)) {
        return originalMethod.apply(this, args)
      }

      // Generate cache key
      const keyPrefix = options.keyPrefix || `${target.constructor.name}:${propertyName}`
      const argsKey = JSON.stringify(args)
      const cacheKey = `${keyPrefix}:${argsKey}`

      // Try to get from cache
      const cached = await cache.get(cacheKey)
      if (cached !== null) {
        console.log(`Cache hit: ${cacheKey}`)
        return cached
      }

      // Execute original method
      const result = await originalMethod.apply(this, args)

      // Store in cache
      await cache.set(cacheKey, result, options.ttl)
      console.log(`Cache miss: ${cacheKey}`)

      return result
    }

    return descriptor
  }
}

/**
 * Decorator to invalidate cache
 * @param patterns Cache key patterns to invalidate
 */
export function CacheInvalidate(...patterns: string[]) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      // Execute original method
      const result = await originalMethod.apply(this, args)

      // Invalidate cache patterns
      for (const pattern of patterns) {
        await cache.deletePattern(pattern)
        console.log(`Cache invalidated: ${pattern}`)
      }

      return result
    }

    return descriptor
  }
}

/**
 * Wrapper function to cache async function results
 * @param fn Async function to cache
 * @param key Cache key
 * @param ttl Time to live in seconds
 */
export async function withCache<T>(
  fn: () => Promise<T>,
  key: string,
  ttl?: number
): Promise<T> {
  // Try to get from cache
  const cached = await cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Execute function
  const result = await fn()

  // Store in cache
  await cache.set(key, result, ttl)

  return result
}