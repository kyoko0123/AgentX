/**
 * X API v2 Client - Main Export
 * すべてのX API機能をエクスポート
 */

// Client
export {
  XApiClient,
  createXApiClient,
  createXApiClientWithOAuth,
  getXApiClientFromEnv,
} from './client'

// Posts (Collection)
export {
  searchRecentTweets,
  searchRecentTweetsWithPagination,
  getTweetsByIds,
  getTweetById,
  getTweetMetrics,
  getTweetMetricsBatch,
  collectPostsByKeywords,
  calculateEngagementRate,
  filterByEngagement,
  sortByEngagement,
  getTopTweets,
} from './posts'

export type {
  SearchRecentOptions,
  TweetMetrics,
  CollectPostsOptions,
  CollectedPostsResult,
} from './posts'

// Publish (Creation & Deletion)
export {
  createTweet,
  createSimpleTweet,
  createReplyTweet,
  createQuoteTweet,
  deleteTweet,
  validateTweetText,
  isValidTweetText,
  truncateTweetText,
  createTweetsBatch,
  deleteTweetsBatch,
  createTweetThread,
  formatTweetUrl,
  extractTweetIdFromUrl,
} from './publish'

export type {
  CreateTweetOptions,
  BatchTweetResult,
} from './publish'

// Rate Limiter
export {
  RateLimiter,
  RateLimiterManager,
  RetryHandler,
  RATE_LIMITS,
  calculateWaitTime,
  parseRateLimitHeaders,
  createRateLimitError,
} from './rate-limiter'

export type {
  RetryOptions,
} from './rate-limiter'

// Types
export type {
  // Tweet Types
  Tweet,
  ReferencedTweet,
  Attachments,
  Geo,
  ContextAnnotation,
  Entities,
  Annotation,
  Url,
  Hashtag,
  Mention,
  Cashtag,
  Withheld,

  // Metrics Types
  TweetPublicMetrics,
  TweetNonPublicMetrics,
  TweetOrganicMetrics,
  TweetPromotedMetrics,

  // User Types
  User,
  UserEntities,
  UserPublicMetrics,

  // Response Types
  TweetSearchResponse,
  TweetLookupResponse,
  CreateTweetResponse,
  DeleteTweetResponse,
  Includes,
  Place,
  PlaceGeo,
  Media,
  MediaPublicMetrics,
  MediaVariant,
  Poll,
  PollOption,
  SearchMeta,

  // Error Types
  ApiError,
  RateLimitError,

  // Request Types
  SearchTweetsParams,
  GetTweetParams,
  CreateTweetParams,

  // Config Types
  XApiConfig,
  XApiCredentials,
  RateLimitInfo,
  XApiResponse,

  // Rate Limiter Types
  RateLimiterConfig,
  TokenBucket,
} from './types'
