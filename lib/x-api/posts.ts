/**
 * X API v2 - Post Collection Functions
 * Functions for searching and retrieving tweets
 */

import { XApiClient } from './client'
import {
  SearchTweetsParams,
  GetTweetParams,
  TweetSearchResponse,
  TweetLookupResponse,
  Tweet,
  TweetPublicMetrics,
} from './types'
import { AppError, ErrorCodes } from '../utils/errors'

// ============================================================================
// Search Functions
// ============================================================================

export interface SearchRecentOptions {
  maxResults?: number // 10-100
  startTime?: Date
  endTime?: Date
  sinceId?: string
  untilId?: string
  sortOrder?: 'recency' | 'relevancy'
  nextToken?: string
  minLikes?: number
  minRetweets?: number
  language?: 'ja' | 'en' | string
}

/**
 * Search recent tweets by query
 * @param client X API client
 * @param query Search query (supports X search operators)
 * @param options Search options
 * @returns Search results with tweets
 */
export async function searchRecentTweets(
  client: XApiClient,
  query: string,
  options: SearchRecentOptions = {}
): Promise<{
  tweets: Tweet[]
  meta: {
    resultCount: number
    nextToken?: string
    newestId?: string
    oldestId?: string
  }
}> {
  // Build query with filters
  let finalQuery = query

  if (options.minLikes) {
    finalQuery += ` min_faves:${options.minLikes}`
  }

  if (options.minRetweets) {
    finalQuery += ` min_retweets:${options.minRetweets}`
  }

  if (options.language) {
    finalQuery += ` lang:${options.language}`
  }

  // Remove replies and retweets by default
  finalQuery += ' -is:reply -is:retweet'

  // Build params
  const params: SearchTweetsParams = {
    query: finalQuery,
    max_results: Math.min(options.maxResults || 100, 100),
    sort_order: options.sortOrder || 'recency',
    'tweet.fields':
      'id,text,author_id,created_at,public_metrics,entities,lang,conversation_id',
    'user.fields': 'id,name,username,profile_image_url,verified,verified_type',
    expansions: 'author_id',
  }

  if (options.startTime) {
    params.start_time = options.startTime.toISOString()
  }

  if (options.endTime) {
    params.end_time = options.endTime.toISOString()
  }

  if (options.sinceId) {
    params.since_id = options.sinceId
  }

  if (options.untilId) {
    params.until_id = options.untilId
  }

  if (options.nextToken) {
    params.next_token = options.nextToken
  }

  try {
    const response = await client.get<TweetSearchResponse>(
      'tweets/search/recent',
      params
    )

    return {
      tweets: response.data.data || [],
      meta: {
        resultCount: response.data.meta.result_count,
        nextToken: response.data.meta.next_token,
        newestId: response.data.meta.newest_id,
        oldestId: response.data.meta.oldest_id,
      },
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    throw new AppError(
      500,
      ErrorCodes.X_API_ERROR,
      'Failed to search tweets',
      error
    )
  }
}

/**
 * Search tweets with pagination support
 * Automatically fetches all pages up to maxTotalResults
 */
export async function searchRecentTweetsWithPagination(
  client: XApiClient,
  query: string,
  options: SearchRecentOptions & { maxTotalResults?: number } = {}
): Promise<Tweet[]> {
  const maxTotalResults = options.maxTotalResults || 1000
  const tweets: Tweet[] = []
  let nextToken: string | undefined

  while (tweets.length < maxTotalResults) {
    const result = await searchRecentTweets(client, query, {
      ...options,
      nextToken,
      maxResults: Math.min(100, maxTotalResults - tweets.length),
    })

    tweets.push(...result.tweets)

    if (!result.meta.nextToken || result.tweets.length === 0) {
      break
    }

    nextToken = result.meta.nextToken

    // Add delay to respect rate limits
    await sleep(1000)
  }

  return tweets
}

// ============================================================================
// Tweet Lookup Functions
// ============================================================================

/**
 * Get tweets by IDs
 * @param client X API client
 * @param ids Tweet IDs (up to 100)
 * @returns Array of tweets
 */
export async function getTweetsByIds(
  client: XApiClient,
  ids: string[]
): Promise<Tweet[]> {
  if (ids.length === 0) {
    return []
  }

  if (ids.length > 100) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Maximum 100 tweet IDs allowed per request'
    )
  }

  const params: GetTweetParams = {
    ids: ids.join(','),
    'tweet.fields':
      'id,text,author_id,created_at,public_metrics,entities,lang,conversation_id',
    'user.fields': 'id,name,username,profile_image_url,verified,verified_type',
    expansions: 'author_id',
  }

  try {
    const response = await client.get<TweetLookupResponse>('tweets', params)

    return response.data.data
      ? Array.isArray(response.data.data)
        ? response.data.data
        : [response.data.data]
      : []
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    throw new AppError(
      500,
      ErrorCodes.X_API_ERROR,
      'Failed to get tweets',
      error
    )
  }
}

/**
 * Get a single tweet by ID
 * @param client X API client
 * @param id Tweet ID
 * @returns Tweet or null if not found
 */
export async function getTweetById(
  client: XApiClient,
  id: string
): Promise<Tweet | null> {
  const tweets = await getTweetsByIds(client, [id])
  return tweets[0] || null
}

// ============================================================================
// Engagement Metrics Functions
// ============================================================================

export interface TweetMetrics {
  tweetId: string
  likes: number
  retweets: number
  replies: number
  quotes: number
  bookmarks: number
  impressions: number
  engagementRate: number // (likes + retweets + replies) / impressions
}

/**
 * Get engagement metrics for a tweet
 * @param client X API client
 * @param tweetId Tweet ID
 * @returns Engagement metrics
 */
export async function getTweetMetrics(
  client: XApiClient,
  tweetId: string
): Promise<TweetMetrics> {
  const tweet = await getTweetById(client, tweetId)

  if (!tweet) {
    throw new AppError(404, ErrorCodes.NOT_FOUND, 'Tweet not found')
  }

  const metrics = tweet.public_metrics || {
    like_count: 0,
    retweet_count: 0,
    reply_count: 0,
    quote_count: 0,
    bookmark_count: 0,
    impression_count: 0,
  }

  const totalEngagement =
    metrics.like_count + metrics.retweet_count + metrics.reply_count

  const engagementRate =
    metrics.impression_count > 0
      ? (totalEngagement / metrics.impression_count) * 100
      : 0

  return {
    tweetId: tweet.id,
    likes: metrics.like_count,
    retweets: metrics.retweet_count,
    replies: metrics.reply_count,
    quotes: metrics.quote_count,
    bookmarks: metrics.bookmark_count,
    impressions: metrics.impression_count,
    engagementRate,
  }
}

/**
 * Get engagement metrics for multiple tweets
 * @param client X API client
 * @param tweetIds Tweet IDs
 * @returns Array of engagement metrics
 */
export async function getTweetMetricsBatch(
  client: XApiClient,
  tweetIds: string[]
): Promise<TweetMetrics[]> {
  const tweets = await getTweetsByIds(client, tweetIds)

  return tweets.map((tweet) => {
    const metrics = tweet.public_metrics || {
      like_count: 0,
      retweet_count: 0,
      reply_count: 0,
      quote_count: 0,
      bookmark_count: 0,
      impression_count: 0,
    }

    const totalEngagement =
      metrics.like_count + metrics.retweet_count + metrics.reply_count

    const engagementRate =
      metrics.impression_count > 0
        ? (totalEngagement / metrics.impression_count) * 100
        : 0

    return {
      tweetId: tweet.id,
      likes: metrics.like_count,
      retweets: metrics.retweet_count,
      replies: metrics.reply_count,
      quotes: metrics.quote_count,
      bookmarks: metrics.bookmark_count,
      impressions: metrics.impression_count,
      engagementRate,
    }
  })
}

// ============================================================================
// Keyword-based Collection
// ============================================================================

export interface CollectPostsOptions {
  keywords: string[]
  maxResultsPerKeyword?: number
  minLikes?: number
  language?: 'ja' | 'en' | string
  startTime?: Date
  endTime?: Date
}

export interface CollectedPostsResult {
  tweets: Tweet[]
  totalCollected: number
  byKeyword: Record<string, number>
  duplicatesRemoved: number
}

/**
 * Collect posts by multiple keywords
 * Automatically deduplicates tweets
 * @param client X API client
 * @param options Collection options
 * @returns Collected tweets with statistics
 */
export async function collectPostsByKeywords(
  client: XApiClient,
  options: CollectPostsOptions
): Promise<CollectedPostsResult> {
  const { keywords, maxResultsPerKeyword = 100 } = options

  if (keywords.length === 0) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'At least one keyword is required'
    )
  }

  const allTweets: Tweet[] = []
  const byKeyword: Record<string, number> = {}
  const seenIds = new Set<string>()

  for (const keyword of keywords) {
    try {
      const tweets = await searchRecentTweetsWithPagination(client, keyword, {
        maxResults: maxResultsPerKeyword,
        maxTotalResults: maxResultsPerKeyword,
        minLikes: options.minLikes,
        language: options.language,
        startTime: options.startTime,
        endTime: options.endTime,
      })

      byKeyword[keyword] = tweets.length

      // Deduplicate
      for (const tweet of tweets) {
        if (!seenIds.has(tweet.id)) {
          seenIds.add(tweet.id)
          allTweets.push(tweet)
        }
      }

      // Add delay between keyword searches
      if (keywords.indexOf(keyword) < keywords.length - 1) {
        await sleep(2000)
      }
    } catch (error) {
      console.error(`Failed to collect tweets for keyword "${keyword}":`, error)
      byKeyword[keyword] = 0
    }
  }

  // Calculate total collected (with duplicates)
  const totalWithDuplicates = Object.values(byKeyword).reduce(
    (sum, count) => sum + count,
    0
  )

  return {
    tweets: allTweets,
    totalCollected: allTweets.length,
    byKeyword,
    duplicatesRemoved: totalWithDuplicates - allTweets.length,
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate engagement rate from metrics
 */
export function calculateEngagementRate(
  metrics: TweetPublicMetrics
): number {
  const totalEngagement =
    metrics.like_count + metrics.retweet_count + metrics.reply_count

  if (metrics.impression_count === 0) {
    return 0
  }

  return (totalEngagement / metrics.impression_count) * 100
}

/**
 * Filter tweets by minimum engagement
 */
export function filterByEngagement(
  tweets: Tweet[],
  minEngagementRate: number
): Tweet[] {
  return tweets.filter((tweet) => {
    if (!tweet.public_metrics) {
      return false
    }
    const rate = calculateEngagementRate(tweet.public_metrics)
    return rate >= minEngagementRate
  })
}

/**
 * Sort tweets by engagement rate
 */
export function sortByEngagement(
  tweets: Tweet[],
  order: 'asc' | 'desc' = 'desc'
): Tweet[] {
  return [...tweets].sort((a, b) => {
    const rateA = a.public_metrics
      ? calculateEngagementRate(a.public_metrics)
      : 0
    const rateB = b.public_metrics
      ? calculateEngagementRate(b.public_metrics)
      : 0

    return order === 'desc' ? rateB - rateA : rateA - rateB
  })
}

/**
 * Get top tweets by engagement
 */
export function getTopTweets(tweets: Tweet[], limit: number = 10): Tweet[] {
  return sortByEngagement(tweets, 'desc').slice(0, limit)
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
