/**
 * AgentX - TypeScript型定義
 *
 * このファイルには、AgentXアプリケーション全体で使用される
 * 共通の型定義が含まれています。
 *
 * @version 1.0
 * @date 2025-11-11
 */

// ============================================================================
// エンティティ型（Prismaスキーマに対応）
// ============================================================================

/**
 * ユーザー
 */
export interface User {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;

  // X連携情報
  twitterId: string;
  username: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiry: Date | null;

  // プロフィール設定
  expertise: string[];
  interests: string[];
  tone: PostTone;
  avoidTopics: string[];
  targetAudience: string | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 投稿のトーン
 */
export type PostTone = 'professional' | 'casual' | 'humorous';

/**
 * 投稿の長さ
 */
export type PostLength = 'short' | 'medium' | 'long';

/**
 * 投稿ステータス
 */
export type PostStatus = 'DRAFT' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';

/**
 * スケジュールステータス
 */
export type ScheduleStatus = 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';

/**
 * 感情分析結果
 */
export type Sentiment = 'positive' | 'negative' | 'neutral';

/**
 * 繰り返しパターン
 */
export type RecurringPattern = 'daily' | 'weekly' | 'monthly';

/**
 * 収集した投稿
 */
export interface CollectedPost {
  id: string;

  // X投稿データ
  tweetId: string;
  text: string;
  authorId: string;
  authorUsername: string;
  authorFollowers: number | null;
  createdAt: Date;

  // エンゲージメント
  likes: number;
  retweets: number;
  replies: number;
  impressions: number | null;

  // 分析データ
  topics: string[];
  sentiment: Sentiment | null;
  engagementRate: number | null;

  // リレーション
  userId: string;
  user?: User;

  collectedAt: Date;
  updatedAt: Date;
}

/**
 * 生成した投稿
 */
export interface GeneratedPost {
  id: string;

  // 投稿内容
  text: string;

  // 生成メタデータ
  basedOnTopic: string | null;
  tone: PostTone;
  version: number;

  // ステータス
  status: PostStatus;

  // AI生成情報
  model: string;
  prompt: string | null;

  // リレーション
  userId: string;
  user?: User;
  scheduledPost?: ScheduledPost;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * スケジュール投稿
 */
export interface ScheduledPost {
  id: string;

  // スケジュール設定
  scheduledFor: Date;
  timezone: string;

  // 繰り返し設定
  recurring: boolean;
  recurringPattern: RecurringPattern | null;

  // 投稿結果
  publishedAt: Date | null;
  tweetId: string | null;

  // エンゲージメント（投稿後）
  likes: number | null;
  retweets: number | null;
  replies: number | null;
  impressions: number | null;

  // ステータス
  status: ScheduleStatus;
  error: string | null;

  // リレーション
  userId: string;
  user?: User;
  generatedPostId: string;
  generatedPost?: GeneratedPost;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * キーワード設定
 */
export interface Keyword {
  id: string;
  keyword: string;
  userId: string;
  active: boolean;
  createdAt: Date;
}

/**
 * 日次分析
 */
export interface DailyAnalytics {
  id: string;
  date: Date;

  // 投稿統計
  postsPublished: number;
  totalLikes: number;
  totalRetweets: number;
  totalReplies: number;

  // トレンド
  topTopics: string[];
  avgEngagement: number | null;

  userId: string;
  createdAt: Date;
}

// ============================================================================
// APIリクエスト/レスポンス型
// ============================================================================

/**
 * 標準APIレスポンス
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

/**
 * APIエラー
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

/**
 * ページネーション
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// ============================================================================
// ユーザー関連
// ============================================================================

/**
 * プロフィール更新リクエスト
 */
export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  expertise?: string[];
  interests?: string[];
  targetAudience?: string;
}

/**
 * 設定更新リクエスト
 */
export interface UpdatePreferencesRequest {
  tone?: PostTone;
  avoidTopics?: string[];
}

/**
 * キーワード追加リクエスト
 */
export interface AddKeywordRequest {
  keyword: string;
}

/**
 * ユーザーエクスポートデータ
 */
export interface UserExportData {
  user: User;
  collectedPosts: CollectedPost[];
  generatedPosts: GeneratedPost[];
  scheduledPosts: ScheduledPost[];
}

// ============================================================================
// 投稿収集関連
// ============================================================================

/**
 * 投稿収集リクエスト
 */
export interface CollectPostsRequest {
  keywords?: string[];
  maxResults?: number;
  minLikes?: number;
  language?: 'ja' | 'en';
}

/**
 * 投稿収集レスポンス
 */
export interface CollectPostsResponse {
  collected: number;
  duplicates: number;
  keywords: string[];
  jobId: string;
}

/**
 * 収集済み投稿一覧リクエスト
 */
export interface ListCollectedPostsRequest {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'engagementRate' | 'likes';
  order?: 'asc' | 'desc';
  keyword?: string;
  minEngagement?: number;
  topic?: string;
}

// ============================================================================
// 分析関連
// ============================================================================

/**
 * 分析タイプ
 */
export type AnalysisType = 'engagement' | 'topics' | 'sentiment' | 'all';

/**
 * 分析実行リクエスト
 */
export interface RunAnalysisRequest {
  postIds?: string[];
  analysisType: AnalysisType;
}

/**
 * 分析ステータス
 */
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * 時系列データ
 */
export interface TimeSeriesData {
  timestamp: Date;
  value: number;
}

/**
 * トピッククラスター
 */
export interface TopicCluster {
  topic: string;
  count: number;
  avgEngagement: number;
  posts: CollectedPost[];
}

/**
 * キーワード頻度
 */
export interface KeywordFrequency {
  keyword: string;
  frequency: number;
  trend: 'rising' | 'stable' | 'declining';
}

/**
 * エンゲージメント分析結果
 */
export interface EngagementAnalysis {
  avgEngagementRate: number;
  topPosts: CollectedPost[];
  trends: TimeSeriesData[];
}

/**
 * トピック分析結果
 */
export interface TopicAnalysis {
  clusters: TopicCluster[];
  keywords: KeywordFrequency[];
}

/**
 * 感情分析結果
 */
export interface SentimentAnalysis {
  positive: number;
  negative: number;
  neutral: number;
}

/**
 * 分析結果
 */
export interface AnalysisResult {
  id: string;
  status: AnalysisStatus;
  result: {
    engagement?: EngagementAnalysis;
    topics?: TopicAnalysis;
    sentiment?: SentimentAnalysis;
  };
  createdAt: Date;
  completedAt: Date | null;
}

/**
 * トピック
 */
export interface Topic {
  name: string;
  score: number;
  posts: number;
}

/**
 * 推奨事項
 */
export interface Recommendation {
  type: 'topic' | 'timing' | 'tone' | 'hashtag';
  title: string;
  description: string;
  confidence: number; // 0-100
}

/**
 * インサイト
 */
export interface Insight {
  category: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
}

/**
 * インサイト取得リクエスト
 */
export interface GetInsightsRequest {
  period?: '7d' | '30d' | '90d';
  limit?: number;
}

/**
 * インサイト取得レスポンス
 */
export interface GetInsightsResponse {
  trendingTopics: Topic[];
  recommendations: Recommendation[];
  opportunityScore: number;
  insights: Insight[];
}

/**
 * トレンド
 */
export interface Trend {
  topic: string;
  volume: number;
  growth: number; // %
  engagementRate: number;
}

/**
 * トレンド分析レスポンス
 */
export interface TrendsAnalysisResponse {
  trends: Trend[];
  growingTopics: Topic[];
  decliningTopics: Topic[];
}

/**
 * トピック分布
 */
export interface TopicDistribution {
  topic: string;
  percentage: number;
}

/**
 * トピック分析レスポンス
 */
export interface TopicsAnalysisResponse {
  topics: TopicCluster[];
  totalTopics: number;
  distribution: TopicDistribution[];
}

// ============================================================================
// 投稿生成関連
// ============================================================================

/**
 * 投稿生成リクエスト
 */
export interface GeneratePostRequest {
  topic: string;
  tone?: PostTone;
  length?: PostLength;
  includeHashtags?: boolean;
  includeEmoji?: boolean;
  variations?: number;
  basedOnPostId?: string;
}

/**
 * 投稿生成レスポンス
 */
export interface GeneratePostResponse {
  variations: GeneratedPost[];
  basedOnTopic: string;
  generatedAt: Date;
}

/**
 * 投稿再生成リクエスト
 */
export interface RegeneratePostRequest {
  postId: string;
  keepTone?: boolean;
  feedback?: string;
}

/**
 * 下書き一覧リクエスト
 */
export interface ListDraftsRequest {
  page?: number;
  limit?: number;
  status?: PostStatus;
  sortBy?: 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

/**
 * 下書き更新リクエスト
 */
export interface UpdateDraftRequest {
  text: string;
}

// ============================================================================
// スケジューリング関連
// ============================================================================

/**
 * 投稿スケジュールリクエスト
 */
export interface SchedulePostRequest {
  generatedPostId: string;
  scheduledFor: string; // ISO 8601
  timezone?: string;
  recurring?: boolean;
  recurringPattern?: RecurringPattern;
  notifyBefore?: number;
}

/**
 * スケジュール一覧リクエスト
 */
export interface ListScheduledPostsRequest {
  page?: number;
  limit?: number;
  status?: ScheduleStatus;
  from?: string; // ISO 8601
  to?: string; // ISO 8601
  sortBy?: 'scheduledFor' | 'createdAt';
  order?: 'asc' | 'desc';
}

/**
 * スケジュール更新リクエスト
 */
export interface UpdateScheduleRequest {
  scheduledFor?: string; // ISO 8601
  timezone?: string;
}

/**
 * 投稿実行レスポンス
 */
export interface PublishPostResponse {
  tweetId: string;
  publishedAt: Date;
  url: string;
}

// ============================================================================
// パフォーマンス関連
// ============================================================================

/**
 * ダッシュボードデータリクエスト
 */
export interface GetDashboardDataRequest {
  period?: '7d' | '30d' | '90d';
}

/**
 * 期間比較データ
 */
export interface PeriodComparison {
  posts: number; // %変化
  engagement: number; // %変化
  engagementRate: number; // %変化
}

/**
 * 投稿タイプ統計
 */
export interface PostTypeStats {
  type: string;
  count: number;
  engagement: number;
}

/**
 * 概要統計
 */
export interface OverviewStats {
  totalPosts: number;
  totalEngagement: number;
  avgEngagementRate: number;
  followerGrowth: number;
  periodComparison: PeriodComparison;
}

/**
 * ダッシュボードデータレスポンス
 */
export interface DashboardDataResponse {
  overview: OverviewStats;
  topPosts: ScheduledPost[];
  engagementTrend: TimeSeriesData[];
  postTypeBreakdown: PostTypeStats[];
}

/**
 * 投稿メトリクス
 */
export interface PostMetrics {
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
  engagementRate: number;
}

/**
 * 投稿比較データ
 */
export interface PostComparison {
  vsAverage: number; // %差
  rank: number; // 全投稿中の順位
}

/**
 * エンゲージメントタイムライン
 */
export interface EngagementTimeline {
  timestamp: Date;
  likes: number;
  retweets: number;
  replies: number;
  totalEngagement: number;
}

/**
 * 個別投稿パフォーマンスレスポンス
 */
export interface PostPerformanceResponse {
  post: ScheduledPost;
  metrics: PostMetrics;
  comparison: PostComparison;
  timeline: EngagementTimeline[];
}

/**
 * 日次統計リクエスト
 */
export interface GetDailyAnalyticsRequest {
  from?: string; // ISO 8601 date
  to?: string; // ISO 8601 date
}

/**
 * 日次統計サマリー
 */
export interface DailyAnalyticsSummary {
  totalPosts: number;
  totalLikes: number;
  totalRetweets: number;
  avgEngagement: number;
}

/**
 * 日次統計レスポンス
 */
export interface DailyAnalyticsResponse {
  analytics: DailyAnalytics[];
  summary: DailyAnalyticsSummary;
}

/**
 * 投稿比較統計
 */
export interface ComparisonStats {
  count: number;
  avgEngagement: number;
}

/**
 * 業界ベンチマーク
 */
export interface IndustryBenchmark {
  avgEngagement: number;
  percentile: number;
}

/**
 * 比較分析レスポンス
 */
export interface ComparisonAnalysisResponse {
  aiGenerated: ComparisonStats;
  manual: ComparisonStats;
  industryBenchmark: IndustryBenchmark;
}

// ============================================================================
// Cronジョブ関連
// ============================================================================

/**
 * 収集ジョブレスポンス
 */
export interface CollectionJobResponse {
  usersProcessed: number;
  postsCollected: number;
  errors: number;
}

/**
 * 投稿ジョブレスポンス
 */
export interface PostingJobResponse {
  postsProcessed: number;
  published: number;
  failed: number;
}

/**
 * 分析ジョブレスポンス
 */
export interface AnalyticsJobResponse {
  analyticsUpdated: number;
}

/**
 * メトリクスジョブレスポンス
 */
export interface MetricsJobResponse {
  postsUpdated: number;
}

// ============================================================================
// ヘルスチェック関連
// ============================================================================

/**
 * サービスステータス
 */
export type ServiceStatus = 'healthy' | 'unhealthy';

/**
 * サービスヘルス
 */
export interface ServiceHealth {
  database: ServiceStatus;
  xApi: ServiceStatus;
  claudeApi: ServiceStatus;
}

/**
 * ヘルスチェックレスポンス
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: ServiceHealth;
}

// ============================================================================
// Server Actions関連
// ============================================================================

/**
 * Server Action結果
 */
export type ActionResult<T = any> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; details?: any };

/**
 * フォーム状態
 */
export interface FormState<T = any> {
  message: string;
  errors?: Record<string, string[]>;
  data?: T;
}

/**
 * スケジュールフォームデータ
 */
export interface ScheduleFormData {
  generatedPostId: string;
  scheduledFor: Date;
  timezone: string;
  recurring: boolean;
  recurringPattern?: RecurringPattern;
}

// ============================================================================
// X API関連型
// ============================================================================

/**
 * X投稿作成レスポンス
 */
export interface XTweetCreateResponse {
  id: string;
  text: string;
}

/**
 * X検索結果
 */
export interface XSearchResult {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    impression_count?: number;
  };
}

/**
 * Xユーザー情報
 */
export interface XUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
}

// ============================================================================
// Claude API関連型
// ============================================================================

/**
 * Claude生成リクエスト
 */
export interface ClaudeGenerateRequest {
  topic: string;
  tone: PostTone;
  length?: PostLength;
  userExpertise: string[];
  userInterests: string[];
  avoidTopics: string[];
  examplePosts?: string[];
  feedback?: string;
}

/**
 * Claudeレスポンス
 */
export interface ClaudeGenerateResponse {
  text: string;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// ============================================================================
// ユーティリティ型
// ============================================================================

/**
 * Partial Update - 一部フィールドのみ更新可能
 */
export type PartialUpdate<T> = Partial<T>;

/**
 * Required Fields - 指定フィールドを必須にする
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Omit Multiple - 複数フィールドを除外
 */
export type OmitMultiple<T, K extends keyof T> = Omit<T, K>;

/**
 * Pick Multiple - 複数フィールドのみ選択
 */
export type PickMultiple<T, K extends keyof T> = Pick<T, K>;

// ============================================================================
// バリデーションスキーマ型（Zod用）
// ============================================================================

/**
 * Profile Validation Schema型推論用
 */
export type ProfileInput = UpdateProfileRequest;

/**
 * Preferences Validation Schema型推論用
 */
export type PreferencesInput = UpdatePreferencesRequest;

/**
 * Keyword Validation Schema型推論用
 */
export type KeywordInput = AddKeywordRequest;

/**
 * Post Generation Validation Schema型推論用
 */
export type GeneratePostInput = GeneratePostRequest;

/**
 * Schedule Validation Schema型推論用
 */
export type SchedulePostInput = SchedulePostRequest;

// ============================================================================
// エクスポート
// ============================================================================

export default {};
