/**
 * X API Rate Limiter
 * Implements token bucket algorithm for rate limiting
 * Memory-based implementation (can be extended to Redis for production)
 */

import { TokenBucket, RateLimiterConfig } from './types'

// ============================================================================
// Rate Limit Configurations for X API v2
// ============================================================================

export const RATE_LIMITS = {
  // Search endpoints
  SEARCH_RECENT_APP: {
    maxRequests: 450,
    windowMs: 15 * 60 * 1000, // 15 minutes
    endpoint: 'search/recent',
  },
  SEARCH_RECENT_USER: {
    maxRequests: 180,
    windowMs: 15 * 60 * 1000, // 15 minutes
    endpoint: 'search/recent',
  },

  // Tweet lookup
  TWEET_LOOKUP: {
    maxRequests: 300,
    windowMs: 15 * 60 * 1000, // 15 minutes
    endpoint: 'tweets',
  },

  // Post tweets
  CREATE_TWEET: {
    maxRequests: 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
    endpoint: 'tweets/create',
  },

  // Delete tweets
  DELETE_TWEET: {
    maxRequests: 50,
    windowMs: 15 * 60 * 1000, // 15 minutes
    endpoint: 'tweets/delete',
  },

  // User lookup
  USER_LOOKUP: {
    maxRequests: 300,
    windowMs: 15 * 60 * 1000, // 15 minutes
    endpoint: 'users',
  },
} as const

// ============================================================================
// Token Bucket Implementation
// ============================================================================

export class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map()

  constructor(private config: RateLimiterConfig) {}

  /**
   * Check if a request can be made and consume a token
   * @returns true if request is allowed, false otherwise
   */
  async checkLimit(identifier: string): Promise<boolean> {
    const bucket = this.getOrCreateBucket(identifier)
    this.refillBucket(bucket)

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1
      return true
    }

    return false
  }

  /**
   * Get the remaining tokens for an identifier
   */
  getRemainingTokens(identifier: string): number {
    const bucket = this.getOrCreateBucket(identifier)
    this.refillBucket(bucket)
    return Math.floor(bucket.tokens)
  }

  /**
   * Get the time until the next token refill (ms)
   */
  getTimeUntilReset(identifier: string): number {
    const bucket = this.getOrCreateBucket(identifier)
    const now = Date.now()
    const timeSinceLastRefill = now - bucket.lastRefill
    const timeUntilNextToken = (1 / bucket.refillRate) - timeSinceLastRefill

    return Math.max(0, timeUntilNextToken)
  }

  /**
   * Reset the rate limit for an identifier
   */
  reset(identifier: string): void {
    this.buckets.delete(identifier)
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.buckets.clear()
  }

  private getOrCreateBucket(identifier: string): TokenBucket {
    let bucket = this.buckets.get(identifier)

    if (!bucket) {
      bucket = {
        tokens: this.config.maxRequests,
        lastRefill: Date.now(),
        maxTokens: this.config.maxRequests,
        refillRate: this.config.maxRequests / this.config.windowMs,
      }
      this.buckets.set(identifier, bucket)
    }

    return bucket
  }

  private refillBucket(bucket: TokenBucket): void {
    const now = Date.now()
    const timePassed = now - bucket.lastRefill
    const tokensToAdd = timePassed * bucket.refillRate

    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now
  }
}

// ============================================================================
// Rate Limiter Manager
// ============================================================================

export class RateLimiterManager {
  private limiters: Map<string, RateLimiter> = new Map()

  constructor() {
    // Initialize limiters for each endpoint
    Object.entries(RATE_LIMITS).forEach(([key, config]) => {
      this.limiters.set(config.endpoint, new RateLimiter(config))
    })
  }

  /**
   * Check rate limit for a specific endpoint
   */
  async checkLimit(
    endpoint: string,
    identifier: string
  ): Promise<{
    allowed: boolean
    remaining: number
    resetIn: number
  }> {
    const limiter = this.limiters.get(endpoint)

    if (!limiter) {
      // No rate limit configured for this endpoint, allow by default
      return {
        allowed: true,
        remaining: Infinity,
        resetIn: 0,
      }
    }

    const allowed = await limiter.checkLimit(identifier)
    const remaining = limiter.getRemainingTokens(identifier)
    const resetIn = limiter.getTimeUntilReset(identifier)

    return {
      allowed,
      remaining,
      resetIn,
    }
  }

  /**
   * Get limiter for specific endpoint
   */
  getLimiter(endpoint: string): RateLimiter | undefined {
    return this.limiters.get(endpoint)
  }

  /**
   * Reset rate limit for specific endpoint and identifier
   */
  reset(endpoint: string, identifier: string): void {
    const limiter = this.limiters.get(endpoint)
    if (limiter) {
      limiter.reset(identifier)
    }
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.limiters.forEach((limiter) => limiter.clearAll())
  }
}

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

export interface RetryOptions {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  retryableStatusCodes?: number[]
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
  retryableStatusCodes: [429, 500, 502, 503, 504],
}

export class RetryHandler {
  private options: Required<RetryOptions>

  constructor(options: RetryOptions = {}) {
    this.options = { ...DEFAULT_RETRY_OPTIONS, ...options }
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: { endpoint?: string; identifier?: string }
  ): Promise<T> {
    let lastError: Error | undefined
    let delay = this.options.initialDelayMs

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw error
        }

        // Don't retry on last attempt
        if (attempt === this.options.maxRetries) {
          break
        }

        // Calculate delay with exponential backoff
        const currentDelay = Math.min(
          delay,
          this.options.maxDelayMs
        )

        console.warn(
          `Retry attempt ${attempt + 1}/${this.options.maxRetries} after ${currentDelay}ms`,
          context
        )

        // Wait before retrying
        await this.sleep(currentDelay)

        // Increase delay for next attempt
        delay *= this.options.backoffMultiplier
      }
    }

    throw lastError
  }

  private isRetryableError(error: unknown): boolean {
    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
      const statusCode = (error as { statusCode: number }).statusCode
      return this.options.retryableStatusCodes.includes(statusCode)
    }

    // Retry on network errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('econnreset') ||
        message.includes('econnrefused')
      )
    }

    return false
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate wait time until rate limit resets
 */
export function calculateWaitTime(resetTimestamp: number): number {
  const now = Math.floor(Date.now() / 1000)
  const waitTime = Math.max(0, resetTimestamp - now)
  return waitTime * 1000 // Convert to milliseconds
}

/**
 * Parse rate limit headers from X API response
 */
export function parseRateLimitHeaders(headers: Headers): {
  limit: number
  remaining: number
  reset: number
} | null {
  const limit = headers.get('x-rate-limit-limit')
  const remaining = headers.get('x-rate-limit-remaining')
  const reset = headers.get('x-rate-limit-reset')

  if (!limit || !remaining || !reset) {
    return null
  }

  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    reset: parseInt(reset, 10),
  }
}

/**
 * Create a rate limit error
 */
export function createRateLimitError(
  resetTimestamp: number,
  endpoint: string
): Error {
  const waitTime = calculateWaitTime(resetTimestamp)
  const resetDate = new Date(resetTimestamp * 1000)

  const error = new Error(
    `Rate limit exceeded for ${endpoint}. Resets at ${resetDate.toISOString()} (in ${Math.ceil(waitTime / 1000)}s)`
  )

  ;(error as any).statusCode = 429
  ;(error as any).resetTimestamp = resetTimestamp
  ;(error as any).waitTime = waitTime

  return error
}
