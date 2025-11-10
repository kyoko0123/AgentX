/**
 * X API v2 Type Definitions
 * Based on X API v2 documentation
 * https://developer.x.com/en/docs/twitter-api/tweets/search/api-reference
 */

// ============================================================================
// Tweet Types
// ============================================================================

export interface Tweet {
  id: string
  text: string
  author_id?: string
  created_at?: string
  edit_history_tweet_ids?: string[]
  conversation_id?: string
  in_reply_to_user_id?: string
  referenced_tweets?: ReferencedTweet[]
  attachments?: Attachments
  geo?: Geo
  context_annotations?: ContextAnnotation[]
  entities?: Entities
  withheld?: Withheld
  public_metrics?: TweetPublicMetrics
  non_public_metrics?: TweetNonPublicMetrics
  organic_metrics?: TweetOrganicMetrics
  promoted_metrics?: TweetPromotedMetrics
  possibly_sensitive?: boolean
  lang?: string
  reply_settings?: 'everyone' | 'mentionedUsers' | 'following'
}

export interface ReferencedTweet {
  type: 'retweeted' | 'quoted' | 'replied_to'
  id: string
}

export interface Attachments {
  media_keys?: string[]
  poll_ids?: string[]
}

export interface Geo {
  coordinates?: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  }
  place_id?: string
}

export interface ContextAnnotation {
  domain: {
    id: string
    name: string
    description?: string
  }
  entity: {
    id: string
    name: string
    description?: string
  }
}

export interface Entities {
  annotations?: Annotation[]
  urls?: Url[]
  hashtags?: Hashtag[]
  mentions?: Mention[]
  cashtags?: Cashtag[]
}

export interface Annotation {
  start: number
  end: number
  probability: number
  type: string
  normalized_text: string
}

export interface Url {
  start: number
  end: number
  url: string
  expanded_url?: string
  display_url?: string
  unwound_url?: string
}

export interface Hashtag {
  start: number
  end: number
  tag: string
}

export interface Mention {
  start: number
  end: number
  username: string
  id?: string
}

export interface Cashtag {
  start: number
  end: number
  tag: string
}

export interface Withheld {
  copyright: boolean
  country_codes: string[]
  scope?: 'tweet' | 'user'
}

// ============================================================================
// Metrics Types
// ============================================================================

export interface TweetPublicMetrics {
  retweet_count: number
  reply_count: number
  like_count: number
  quote_count: number
  bookmark_count: number
  impression_count: number
}

export interface TweetNonPublicMetrics {
  impression_count: number
  url_link_clicks?: number
  user_profile_clicks?: number
}

export interface TweetOrganicMetrics {
  impression_count: number
  like_count: number
  reply_count: number
  retweet_count: number
  url_link_clicks?: number
  user_profile_clicks?: number
}

export interface TweetPromotedMetrics {
  impression_count: number
  like_count: number
  reply_count: number
  retweet_count: number
  url_link_clicks?: number
  user_profile_clicks?: number
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string
  name: string
  username: string
  created_at?: string
  description?: string
  entities?: UserEntities
  location?: string
  pinned_tweet_id?: string
  profile_image_url?: string
  protected?: boolean
  public_metrics?: UserPublicMetrics
  url?: string
  verified?: boolean
  verified_type?: 'blue' | 'business' | 'government' | 'none'
  withheld?: Withheld
}

export interface UserEntities {
  url?: {
    urls: Url[]
  }
  description?: {
    urls?: Url[]
    hashtags?: Hashtag[]
    mentions?: Mention[]
    cashtags?: Cashtag[]
  }
}

export interface UserPublicMetrics {
  followers_count: number
  following_count: number
  tweet_count: number
  listed_count: number
  like_count: number
}

// ============================================================================
// Response Types
// ============================================================================

export interface TweetSearchResponse {
  data?: Tweet[]
  includes?: Includes
  meta: SearchMeta
  errors?: ApiError[]
}

export interface TweetLookupResponse {
  data?: Tweet | Tweet[]
  includes?: Includes
  errors?: ApiError[]
}

export interface CreateTweetResponse {
  data: {
    id: string
    text: string
  }
}

export interface DeleteTweetResponse {
  data: {
    deleted: boolean
  }
}

export interface Includes {
  tweets?: Tweet[]
  users?: User[]
  places?: Place[]
  media?: Media[]
  polls?: Poll[]
}

export interface Place {
  id: string
  full_name: string
  name?: string
  country?: string
  country_code?: string
  geo?: PlaceGeo
  place_type?: string
}

export interface PlaceGeo {
  type: string
  bbox?: number[]
  properties?: Record<string, any>
}

export interface Media {
  media_key: string
  type: 'photo' | 'video' | 'animated_gif'
  url?: string
  duration_ms?: number
  height?: number
  width?: number
  preview_image_url?: string
  public_metrics?: MediaPublicMetrics
  alt_text?: string
  variants?: MediaVariant[]
}

export interface MediaPublicMetrics {
  view_count?: number
}

export interface MediaVariant {
  bit_rate?: number
  content_type: string
  url: string
}

export interface Poll {
  id: string
  options: PollOption[]
  duration_minutes: number
  end_datetime: string
  voting_status: 'open' | 'closed'
}

export interface PollOption {
  position: number
  label: string
  votes: number
}

export interface SearchMeta {
  newest_id?: string
  oldest_id?: string
  result_count: number
  next_token?: string
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  message: string
  type: string
  title?: string
  detail?: string
  resource_type?: string
  parameter?: string
  value?: string
  section?: string
}

export interface RateLimitError {
  message: string
  reset: number // Unix timestamp
  limit: number
  remaining: number
}

// ============================================================================
// Request Types
// ============================================================================

export interface SearchTweetsParams {
  query: string
  max_results?: number // 10-100 (default: 10)
  start_time?: string // ISO 8601
  end_time?: string // ISO 8601
  since_id?: string
  until_id?: string
  next_token?: string
  sort_order?: 'recency' | 'relevancy'
  'tweet.fields'?: string // comma-separated
  'user.fields'?: string // comma-separated
  'media.fields'?: string // comma-separated
  'place.fields'?: string // comma-separated
  'poll.fields'?: string // comma-separated
  expansions?: string // comma-separated
}

export interface GetTweetParams {
  ids: string | string[]
  'tweet.fields'?: string
  'user.fields'?: string
  'media.fields'?: string
  'place.fields'?: string
  'poll.fields'?: string
  expansions?: string
}

export interface CreateTweetParams {
  text: string
  reply?: {
    in_reply_to_tweet_id: string
  }
  quote_tweet_id?: string
  media?: {
    media_ids: string[]
    tagged_user_ids?: string[]
  }
  poll?: {
    options: string[]
    duration_minutes: number
  }
  direct_message_deep_link?: string
  for_super_followers_only?: boolean
  geo?: {
    place_id: string
  }
  reply_settings?: 'everyone' | 'mentionedUsers' | 'following'
}

// ============================================================================
// Client Configuration Types
// ============================================================================

export interface XApiConfig {
  bearerToken?: string
  accessToken?: string
  refreshToken?: string
  clientId?: string
  clientSecret?: string
  baseUrl?: string
}

export interface XApiCredentials {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number // Unix timestamp
}

export interface XApiResponse<T> {
  data: T
  rateLimit?: RateLimitInfo
}

// ============================================================================
// Rate Limiter Types
// ============================================================================

export interface RateLimiterConfig {
  maxRequests: number
  windowMs: number
  endpoint: string
}

export interface TokenBucket {
  tokens: number
  lastRefill: number
  maxTokens: number
  refillRate: number // tokens per millisecond
}
