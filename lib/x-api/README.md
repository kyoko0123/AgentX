# X API v2 Client

X API v2のクライアントライブラリです。投稿収集、投稿作成、Rate Limit管理、エラーハンドリングなどの機能を提供します。

## 特徴

- ✅ **X API v2対応**: 最新のX API v2エンドポイントをサポート
- ✅ **認証**: Bearer Token (App Auth) と OAuth 2.0 (User Context) の両方をサポート
- ✅ **Rate Limit管理**: トークンバケットアルゴリズムによる自動Rate Limit管理
- ✅ **エラーハンドリング**: 統一されたエラーハンドリングとAppErrorクラスの使用
- ✅ **リトライロジック**: Exponential Backoffによる自動リトライ
- ✅ **TypeScript完全対応**: 完全な型定義

## ファイル構成

```
lib/x-api/
├── client.ts         # ベースクライアント（認証、HTTP通信）
├── posts.ts          # 投稿収集機能
├── publish.ts        # 投稿作成・削除機能
├── rate-limiter.ts   # Rate Limit管理
├── types.ts          # 型定義
└── README.md         # このファイル
```

## インストール

必要なパッケージはすでに`package.json`に含まれています。追加のインストールは不要です。

## 環境変数

`.env.local`に以下の環境変数を設定してください：

```bash
# X API Bearer Token (App-only authentication)
X_BEARER_TOKEN=your_bearer_token_here

# OAuth 2.0 Credentials (User context authentication)
X_CLIENT_ID=your_client_id
X_CLIENT_SECRET=your_client_secret
```

## 基本的な使い方

### 1. クライアントの初期化

#### Bearer Token認証（App Context）

```typescript
import { createXApiClient } from '@/lib/x-api/client'

// Bearer Tokenで初期化
const client = createXApiClient(process.env.X_BEARER_TOKEN!)

// または環境変数から自動取得
import { getXApiClientFromEnv } from '@/lib/x-api/client'
const client = getXApiClientFromEnv()
```

#### OAuth 2.0認証（User Context）

```typescript
import { createXApiClientWithOAuth } from '@/lib/x-api/client'

// ユーザーのアクセストークンで初期化
const client = createXApiClientWithOAuth(
  userAccessToken,
  userRefreshToken // オプショナル
)
```

### 2. 投稿の検索・収集

#### キーワード検索

```typescript
import { searchRecentTweets } from '@/lib/x-api/posts'

const result = await searchRecentTweets(client, 'Next.js', {
  maxResults: 50,
  minLikes: 10,
  language: 'ja',
  sortOrder: 'recency',
})

console.log(`Found ${result.meta.resultCount} tweets`)
result.tweets.forEach((tweet) => {
  console.log(`${tweet.text} - ${tweet.public_metrics?.like_count} likes`)
})
```

#### 複数キーワードで収集

```typescript
import { collectPostsByKeywords } from '@/lib/x-api/posts'

const result = await collectPostsByKeywords(client, {
  keywords: ['Next.js', 'React', 'TypeScript'],
  maxResultsPerKeyword: 100,
  minLikes: 5,
  language: 'ja',
})

console.log(`Collected ${result.totalCollected} unique tweets`)
console.log(`Removed ${result.duplicatesRemoved} duplicates`)
console.log('By keyword:', result.byKeyword)
```

#### ページネーション付き検索

```typescript
import { searchRecentTweetsWithPagination } from '@/lib/x-api/posts'

// 最大1000件まで自動でページネーション
const tweets = await searchRecentTweetsWithPagination(client, 'AI', {
  maxTotalResults: 1000,
  minLikes: 20,
})

console.log(`Collected ${tweets.length} tweets`)
```

### 3. 投稿の取得

#### IDで投稿を取得

```typescript
import { getTweetById, getTweetsByIds } from '@/lib/x-api/posts'

// 単一の投稿
const tweet = await getTweetById(client, '1234567890')

// 複数の投稿（最大100件）
const tweets = await getTweetsByIds(client, [
  '1234567890',
  '0987654321',
  '1122334455',
])
```

#### エンゲージメントメトリクス取得

```typescript
import { getTweetMetrics } from '@/lib/x-api/posts'

const metrics = await getTweetMetrics(client, '1234567890')

console.log(`Likes: ${metrics.likes}`)
console.log(`Retweets: ${metrics.retweets}`)
console.log(`Engagement Rate: ${metrics.engagementRate.toFixed(2)}%`)
```

### 4. 投稿の作成

#### シンプルな投稿

```typescript
import { createTweet } from '@/lib/x-api/publish'

const result = await createTweet(
  client,
  'Hello from AgentX! 🚀',
  userId
)

console.log(`Tweet created: ${result.url}`)
```

#### リプライ投稿

```typescript
import { createReplyTweet } from '@/lib/x-api/publish'

const reply = await createReplyTweet(
  client,
  'Great point! 👍',
  originalTweetId,
  userId
)
```

#### スレッド作成

```typescript
import { createTweetThread } from '@/lib/x-api/publish'

const thread = await createTweetThread(
  client,
  [
    '1/ Thread about Next.js 14 🧵',
    '2/ Server Actions are amazing!',
    '3/ App Router is the future.',
  ],
  userId
)

console.log(`Created thread with ${thread.length} tweets`)
```

### 5. 投稿の削除

```typescript
import { deleteTweet } from '@/lib/x-api/publish'

const result = await deleteTweet(client, tweetId, userId)

if (result.deleted) {
  console.log('Tweet deleted successfully')
}
```

### 6. バッチ処理

#### 複数投稿を作成

```typescript
import { createTweetsBatch } from '@/lib/x-api/publish'

const tweets = [
  'First tweet',
  'Second tweet',
  'Third tweet',
]

const results = await createTweetsBatch(
  client,
  tweets,
  userId,
  5000 // 5秒の間隔
)

results.forEach((result, index) => {
  if (result.success) {
    console.log(`Tweet ${index + 1}: ${result.url}`)
  } else {
    console.error(`Tweet ${index + 1} failed: ${result.error}`)
  }
})
```

## 高度な使い方

### Rate Limit管理

Rate Limitは自動的に管理されますが、手動で確認することもできます：

```typescript
const rateLimiter = client.getRateLimiter()

const status = await rateLimiter.checkLimit('tweets/search/recent', 'app')

console.log(`Allowed: ${status.allowed}`)
console.log(`Remaining: ${status.remaining}`)
console.log(`Reset in: ${status.resetIn}ms`)
```

### エラーハンドリング

```typescript
import { AppError, ErrorCodes } from '@/lib/utils/errors'

try {
  const result = await searchRecentTweets(client, 'test')
} catch (error) {
  if (error instanceof AppError) {
    if (error.code === ErrorCodes.X_RATE_LIMIT) {
      console.error('Rate limit exceeded:', error.details)
      // 待機時間を取得
      const waitTime = error.details?.resetIn
    } else if (error.code === ErrorCodes.UNAUTHORIZED) {
      console.error('Authentication failed')
      // トークンをリフレッシュ
    }
  }
}
```

### カスタムリトライ設定

```typescript
import { RetryHandler } from '@/lib/x-api/rate-limiter'

const retryHandler = new RetryHandler({
  maxRetries: 5,
  initialDelayMs: 2000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
})

const result = await retryHandler.execute(async () => {
  return await searchRecentTweets(client, 'test')
})
```

### トークンリフレッシュ

```typescript
// NextAuth.jsのjwtコールバックで使用
const newCredentials = await client.refreshAccessToken(
  refreshToken,
  clientId,
  clientSecret
)

// 新しいクレデンシャルを保存
token.accessToken = newCredentials.accessToken
token.refreshToken = newCredentials.refreshToken
token.expiresAt = newCredentials.expiresAt
```

## Utility関数

### 投稿のフィルタリングとソート

```typescript
import {
  filterByEngagement,
  sortByEngagement,
  getTopTweets,
} from '@/lib/x-api/posts'

// エンゲージメント率でフィルター
const highEngagement = filterByEngagement(tweets, 5.0) // 5%以上

// ソート
const sorted = sortByEngagement(tweets, 'desc')

// トップ10を取得
const topTweets = getTopTweets(tweets, 10)
```

### テキストのバリデーション

```typescript
import {
  validateTweetText,
  isValidTweetText,
  truncateTweetText,
} from '@/lib/x-api/publish'

// バリデーション
const validation = validateTweetText(text)
if (!validation.valid) {
  console.error('Validation errors:', validation.errors)
}

// 簡易チェック
if (isValidTweetText(text)) {
  await createTweet(client, text, userId)
}

// 自動切り詰め
const truncated = truncateTweetText(longText)
```

## Rate Limit情報

X API v2のRate Limit（15分間）：

| エンドポイント | App Context | User Context |
|-------------|-------------|--------------|
| Search Recent | 450 requests | 180 requests |
| Tweet Lookup | 300 requests | 300 requests |
| Create Tweet | - | 200 requests |
| Delete Tweet | - | 50 requests |

## エラーコード

| コード | 説明 |
|-------|------|
| `UNAUTHORIZED` | 認証エラー |
| `FORBIDDEN` | 権限エラー |
| `NOT_FOUND` | リソースが見つからない |
| `VALIDATION_ERROR` | バリデーションエラー |
| `X_API_ERROR` | X APIエラー |
| `X_RATE_LIMIT` | Rate Limit超過 |
| `NETWORK_ERROR` | ネットワークエラー |

## テスト

簡単なテストスクリプトの例：

```typescript
// test-x-api.ts
import { getXApiClientFromEnv } from '@/lib/x-api/client'
import { searchRecentTweets } from '@/lib/x-api/posts'

async function test() {
  const client = getXApiClientFromEnv()

  try {
    const result = await searchRecentTweets(client, 'Next.js', {
      maxResults: 10,
      language: 'ja',
    })

    console.log('✅ Search successful')
    console.log(`Found ${result.meta.resultCount} tweets`)
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

test()
```

## 注意事項

1. **Rate Limit**: X APIのRate Limitは厳格です。本番環境では必ずRate Limiterを使用してください。

2. **認証**: 投稿作成・削除にはOAuth 2.0 User Contextが必要です。Bearer Tokenでは実行できません。

3. **トークンリフレッシュ**: アクセストークンの有効期限は2時間です。NextAuth.jsのrefreshトークン機能と連携してください。

4. **エラーハンドリング**: すべての関数は`AppError`をthrowします。適切にキャッチして処理してください。

5. **メモリ使用量**: Rate Limiterはメモリベースです。本番環境ではRedisへの移行を検討してください。

## 今後の拡張予定

- [ ] Redis対応のRate Limiter
- [ ] メディアアップロード機能
- [ ] User lookup機能
- [ ] Streaming API対応
- [ ] Webhook対応

## ライセンス

このコードはAgentXプロジェクトの一部です。
