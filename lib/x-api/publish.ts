/**
 * X API v2 - Post Publishing Functions
 * Functions for creating, deleting, and managing tweets
 */

import { XApiClient } from './client'
import {
  CreateTweetParams,
  CreateTweetResponse,
  DeleteTweetResponse,
} from './types'
import { AppError, ErrorCodes } from '../utils/errors'

// ============================================================================
// Tweet Creation
// ============================================================================

export interface CreateTweetOptions {
  text: string
  replyToTweetId?: string
  quoteTweetId?: string
  mediaIds?: string[]
  pollOptions?: string[]
  pollDurationMinutes?: number
  forSuperFollowersOnly?: boolean
  replySettings?: 'everyone' | 'mentionedUsers' | 'following'
}

/**
 * Create a tweet (post)
 * @param client X API client (must have OAuth 2.0 user credentials)
 * @param text Tweet text (max 280 characters)
 * @param userId User ID (for validation/logging)
 * @param options Additional tweet options
 * @returns Created tweet with ID
 */
export async function createTweet(
  client: XApiClient,
  text: string,
  userId: string,
  options: Omit<CreateTweetOptions, 'text'> = {}
): Promise<{
  tweetId: string
  text: string
  url: string
}> {
  // Validate text length
  if (!text || text.trim().length === 0) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Tweet text cannot be empty'
    )
  }

  if (text.length > 280) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Tweet text exceeds 280 characters'
    )
  }

  // Build request params
  const params: CreateTweetParams = {
    text: text.trim(),
  }

  // Add reply
  if (options.replyToTweetId) {
    params.reply = {
      in_reply_to_tweet_id: options.replyToTweetId,
    }
  }

  // Add quote tweet
  if (options.quoteTweetId) {
    params.quote_tweet_id = options.quoteTweetId
  }

  // Add media
  if (options.mediaIds && options.mediaIds.length > 0) {
    params.media = {
      media_ids: options.mediaIds,
    }
  }

  // Add poll
  if (options.pollOptions && options.pollOptions.length > 0) {
    if (options.pollOptions.length < 2 || options.pollOptions.length > 4) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        'Poll must have 2-4 options'
      )
    }

    params.poll = {
      options: options.pollOptions,
      duration_minutes: options.pollDurationMinutes || 1440, // 24 hours default
    }
  }

  // Add reply settings
  if (options.replySettings) {
    params.reply_settings = options.replySettings
  }

  // Add super followers only flag
  if (options.forSuperFollowersOnly) {
    params.for_super_followers_only = true
  }

  try {
    const response = await client.post<CreateTweetResponse>('tweets', params)

    const tweetId = response.data.data.id
    const username = await getUsernameFromUserId(userId) // You'll need to implement this

    return {
      tweetId,
      text: response.data.data.text,
      url: `https://x.com/${username}/status/${tweetId}`,
    }
  } catch (error) {
    if (error instanceof AppError) {
      // Add context to error
      if (error.code === ErrorCodes.X_RATE_LIMIT) {
        throw new AppError(
          429,
          ErrorCodes.X_RATE_LIMIT,
          'Tweet rate limit exceeded. Please try again later.',
          error.details
        )
      }
      throw error
    }

    throw new AppError(
      500,
      ErrorCodes.X_API_ERROR,
      'Failed to create tweet',
      error
    )
  }
}

/**
 * Create a simple text tweet
 * @param client X API client
 * @param text Tweet text
 * @param userId User ID
 * @returns Created tweet info
 */
export async function createSimpleTweet(
  client: XApiClient,
  text: string,
  userId: string
): Promise<{ tweetId: string; url: string }> {
  return createTweet(client, text, userId)
}

/**
 * Create a reply tweet
 * @param client X API client
 * @param text Reply text
 * @param replyToTweetId Tweet ID to reply to
 * @param userId User ID
 * @returns Created reply info
 */
export async function createReplyTweet(
  client: XApiClient,
  text: string,
  replyToTweetId: string,
  userId: string
): Promise<{ tweetId: string; url: string }> {
  return createTweet(client, text, userId, { replyToTweetId })
}

/**
 * Create a quote tweet
 * @param client X API client
 * @param text Quote text
 * @param quoteTweetId Tweet ID to quote
 * @param userId User ID
 * @returns Created quote tweet info
 */
export async function createQuoteTweet(
  client: XApiClient,
  text: string,
  quoteTweetId: string,
  userId: string
): Promise<{ tweetId: string; url: string }> {
  return createTweet(client, text, userId, { quoteTweetId })
}

// ============================================================================
// Tweet Deletion
// ============================================================================

/**
 * Delete a tweet
 * @param client X API client (must have OAuth 2.0 user credentials)
 * @param tweetId Tweet ID to delete
 * @param userId User ID (for validation)
 * @returns Deletion confirmation
 */
export async function deleteTweet(
  client: XApiClient,
  tweetId: string,
  userId: string
): Promise<{ deleted: boolean; tweetId: string }> {
  if (!tweetId) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Tweet ID is required'
    )
  }

  try {
    const response = await client.delete<DeleteTweetResponse>(
      `tweets/${tweetId}`
    )

    return {
      deleted: response.data.data.deleted,
      tweetId,
    }
  } catch (error) {
    if (error instanceof AppError) {
      // Handle specific errors
      if (error.statusCode === 404) {
        throw new AppError(
          404,
          ErrorCodes.NOT_FOUND,
          'Tweet not found or already deleted'
        )
      }

      if (error.statusCode === 403) {
        throw new AppError(
          403,
          ErrorCodes.FORBIDDEN,
          'You do not have permission to delete this tweet'
        )
      }

      throw error
    }

    throw new AppError(
      500,
      ErrorCodes.X_API_ERROR,
      'Failed to delete tweet',
      error
    )
  }
}

// ============================================================================
// Tweet Validation
// ============================================================================

/**
 * Validate tweet text
 * @param text Tweet text
 * @returns Validation result
 */
export function validateTweetText(text: string): {
  valid: boolean
  length: number
  errors: string[]
} {
  const errors: string[] = []

  if (!text || text.trim().length === 0) {
    errors.push('Tweet text cannot be empty')
  }

  const length = text.length

  if (length > 280) {
    errors.push(`Tweet text exceeds 280 characters (${length} characters)`)
  }

  return {
    valid: errors.length === 0,
    length,
    errors,
  }
}

/**
 * Check if tweet text is valid
 * @param text Tweet text
 * @returns true if valid
 */
export function isValidTweetText(text: string): boolean {
  return validateTweetText(text).valid
}

/**
 * Truncate tweet text to 280 characters
 * @param text Tweet text
 * @param suffix Suffix to add if truncated (default: '...')
 * @returns Truncated text
 */
export function truncateTweetText(text: string, suffix: string = '...'): string {
  if (text.length <= 280) {
    return text
  }

  const maxLength = 280 - suffix.length
  return text.substring(0, maxLength) + suffix
}

// ============================================================================
// Batch Operations
// ============================================================================

export interface BatchTweetResult {
  success: boolean
  tweetId?: string
  url?: string
  error?: string
}

/**
 * Create multiple tweets with delay between each
 * @param client X API client
 * @param tweets Array of tweet texts
 * @param userId User ID
 * @param delayMs Delay between tweets in milliseconds (default: 5000)
 * @returns Array of results
 */
export async function createTweetsBatch(
  client: XApiClient,
  tweets: string[],
  userId: string,
  delayMs: number = 5000
): Promise<BatchTweetResult[]> {
  const results: BatchTweetResult[] = []

  for (let i = 0; i < tweets.length; i++) {
    try {
      const result = await createTweet(client, tweets[i], userId)
      results.push({
        success: true,
        tweetId: result.tweetId,
        url: result.url,
      })

      // Add delay between tweets (except for the last one)
      if (i < tweets.length - 1) {
        await sleep(delayMs)
      }
    } catch (error) {
      results.push({
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      })
    }
  }

  return results
}

/**
 * Delete multiple tweets with delay between each
 * @param client X API client
 * @param tweetIds Array of tweet IDs
 * @param userId User ID
 * @param delayMs Delay between deletions in milliseconds (default: 2000)
 * @returns Array of results
 */
export async function deleteTweetsBatch(
  client: XApiClient,
  tweetIds: string[],
  userId: string,
  delayMs: number = 2000
): Promise<BatchTweetResult[]> {
  const results: BatchTweetResult[] = []

  for (let i = 0; i < tweetIds.length; i++) {
    try {
      const result = await deleteTweet(client, tweetIds[i], userId)
      results.push({
        success: result.deleted,
        tweetId: result.tweetId,
      })

      // Add delay between deletions (except for the last one)
      if (i < tweetIds.length - 1) {
        await sleep(delayMs)
      }
    } catch (error) {
      results.push({
        success: false,
        tweetId: tweetIds[i],
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      })
    }
  }

  return results
}

// ============================================================================
// Thread Creation
// ============================================================================

/**
 * Create a tweet thread
 * @param client X API client
 * @param tweets Array of tweet texts (in order)
 * @param userId User ID
 * @param delayMs Delay between tweets in milliseconds (default: 2000)
 * @returns Array of created tweet info
 */
export async function createTweetThread(
  client: XApiClient,
  tweets: string[],
  userId: string,
  delayMs: number = 2000
): Promise<Array<{ tweetId: string; url: string }>> {
  if (tweets.length === 0) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'At least one tweet is required for a thread'
    )
  }

  const results: Array<{ tweetId: string; url: string }> = []
  let previousTweetId: string | undefined

  for (let i = 0; i < tweets.length; i++) {
    try {
      const result = await createTweet(client, tweets[i], userId, {
        replyToTweetId: previousTweetId,
      })

      results.push(result)
      previousTweetId = result.tweetId

      // Add delay between tweets (except for the last one)
      if (i < tweets.length - 1) {
        await sleep(delayMs)
      }
    } catch (error) {
      // If a tweet in the thread fails, stop and return what we have
      console.error(`Failed to create tweet ${i + 1} in thread:`, error)
      break
    }
  }

  return results
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get username from user ID (placeholder - implement with actual user lookup)
 * This should be implemented by fetching from database or X API
 */
async function getUsernameFromUserId(userId: string): Promise<string> {
  // TODO: Implement actual user lookup
  // For now, return a placeholder
  return 'user'
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Format tweet URL
 */
export function formatTweetUrl(username: string, tweetId: string): string {
  return `https://x.com/${username}/status/${tweetId}`
}

/**
 * Extract tweet ID from URL
 */
export function extractTweetIdFromUrl(url: string): string | null {
  const match = url.match(/status\/(\d+)/)
  return match ? match[1] : null
}
