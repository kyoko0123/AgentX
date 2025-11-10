# X API Client - Integration Guide

AgentXプロジェクトへのX API Clientの統合ガイドです。

## 統合ポイント

### 1. NextAuth.jsとの統合

X API Clientは、NextAuth.jsのOAuth 2.0フローと統合する必要があります。

#### `app/api/auth/[...nextauth]/route.ts`

```typescript
import { createXApiClientWithOAuth } from '@/lib/x-api/client'

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'twitter',
      name: 'X (Twitter)',
      type: 'oauth',
      version: '2.0',
      // ... OAuth設定
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      // 初回ログイン時
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }

      // トークンの有効期限チェック
      if (Date.now() < token.expiresAt * 1000) {
        return token
      }

      // トークンリフレッシュ
      try {
        const client = createXApiClientWithOAuth(
          token.accessToken,
          token.refreshToken
        )

        const newCredentials = await client.refreshAccessToken(
          token.refreshToken,
          process.env.X_CLIENT_ID!,
          process.env.X_CLIENT_SECRET!
        )

        return {
          ...token,
          accessToken: newCredentials.accessToken,
          refreshToken: newCredentials.refreshToken,
          expiresAt: Math.floor(newCredentials.expiresAt! / 1000),
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
        return { ...token, error: 'RefreshAccessTokenError' }
      }
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.error = token.error
      return session
    },
  },
}
```

### 2. Server Actionsでの使用

#### `app/actions/posts.ts`

```typescript
'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createXApiClientWithOAuth } from '@/lib/x-api/client'
import { collectPostsByKeywords } from '@/lib/x-api/posts'
import { prisma } from '@/lib/prisma/client'
import { AppError } from '@/lib/utils/errors'

export async function collectPosts(keywords: string[]) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    throw new AppError(401, 'UNAUTHORIZED', 'Not authenticated')
  }

  // X API Clientを初期化
  const client = createXApiClientWithOAuth(
    session.accessToken,
    session.refreshToken
  )

  // 投稿を収集
  const result = await collectPostsByKeywords(client, {
    keywords,
    maxResultsPerKeyword: 100,
    minLikes: 10,
    language: 'ja',
  })

  // データベースに保存
  const saved = await prisma.collectedPost.createMany({
    data: result.tweets.map((tweet) => ({
      tweetId: tweet.id,
      text: tweet.text,
      authorId: tweet.author_id,
      createdAt: new Date(tweet.created_at!),
      likes: tweet.public_metrics?.like_count || 0,
      retweets: tweet.public_metrics?.retweet_count || 0,
      replies: tweet.public_metrics?.reply_count || 0,
      userId: session.user.id,
    })),
    skipDuplicates: true,
  })

  return {
    collected: result.totalCollected,
    saved: saved.count,
    byKeyword: result.byKeyword,
  }
}
```

#### `app/actions/publish.ts`

```typescript
'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createXApiClientWithOAuth } from '@/lib/x-api/client'
import { createTweet } from '@/lib/x-api/publish'
import { prisma } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'

export async function publishPost(generatedPostId: string) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    throw new Error('Not authenticated')
  }

  // 生成済み投稿を取得
  const generatedPost = await prisma.generatedPost.findUnique({
    where: { id: generatedPostId, userId: session.user.id },
  })

  if (!generatedPost) {
    throw new Error('Post not found')
  }

  // X API Clientで投稿
  const client = createXApiClientWithOAuth(session.accessToken)

  const result = await createTweet(
    client,
    generatedPost.text,
    session.user.id
  )

  // データベースを更新
  await prisma.generatedPost.update({
    where: { id: generatedPostId },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      tweetId: result.tweetId,
      tweetUrl: result.url,
    },
  })

  revalidatePath('/dashboard')

  return {
    success: true,
    tweetId: result.tweetId,
    url: result.url,
  }
}
```

### 3. API Routeでの使用

#### `app/api/posts/collect/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createXApiClientWithOAuth, searchRecentTweets } from '@/lib/x-api'
import { AppError, handleError } from '@/lib/utils/errors'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const body = await request.json()
    const { query, maxResults = 100 } = body

    // X API Client
    const client = createXApiClientWithOAuth(session.accessToken)

    const result = await searchRecentTweets(client, query, {
      maxResults,
      language: 'ja',
    })

    return NextResponse.json({
      success: true,
      data: {
        tweets: result.tweets,
        count: result.meta.resultCount,
      },
    })
  } catch (error) {
    const errorResponse = handleError(error)
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    })
  }
}
```

### 4. Cron Jobsでの使用

#### `app/api/cron/collect/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { getXApiClientFromEnv } from '@/lib/x-api/client'
import { collectPostsByKeywords } from '@/lib/x-api/posts'
import { prisma } from '@/lib/prisma/client'

export async function POST(request: Request) {
  // Cron secret認証
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    // すべてのアクティブユーザーを取得
    const users = await prisma.user.findMany({
      where: { active: true },
      include: {
        keywords: {
          where: { active: true },
        },
      },
    })

    let totalCollected = 0
    const client = getXApiClientFromEnv()

    for (const user of users) {
      const keywords = user.keywords.map((k) => k.keyword)

      if (keywords.length === 0) continue

      const result = await collectPostsByKeywords(client, {
        keywords,
        maxResultsPerKeyword: 50,
        minLikes: 5,
      })

      // データベースに保存
      await prisma.collectedPost.createMany({
        data: result.tweets.map((tweet) => ({
          tweetId: tweet.id,
          text: tweet.text,
          authorId: tweet.author_id,
          createdAt: new Date(tweet.created_at!),
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          replies: tweet.public_metrics?.reply_count || 0,
          userId: user.id,
        })),
        skipDuplicates: true,
      })

      totalCollected += result.totalCollected

      // Rate Limitを考慮して待機
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }

    return NextResponse.json({
      success: true,
      data: {
        usersProcessed: users.length,
        postsCollected: totalCollected,
      },
    })
  } catch (error) {
    console.error('Cron collect error:', error)
    return NextResponse.json(
      { success: false, error: 'Collection failed' },
      { status: 500 }
    )
  }
}
```

### 5. 環境変数の設定

`.env.local`に以下を追加：

```bash
# X API Credentials
X_BEARER_TOKEN=your_bearer_token_here
X_CLIENT_ID=your_client_id
X_CLIENT_SECRET=your_client_secret

# Cron Secret (for scheduled jobs)
CRON_SECRET=your_random_secret_here
```

### 6. TypeScript型の拡張

`types/next-auth.d.ts`を作成：

```typescript
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    refreshToken?: string
    error?: string
  }

  interface JWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    error?: string
  }
}
```

## テスト方法

### 1. 基本テスト

```bash
# Bearer Tokenでのテスト
npx tsx lib/x-api/test-basic.ts
```

### 2. 統合テスト

```bash
# Next.js開発サーバーを起動
npm run dev

# ブラウザでログイン
# http://localhost:3000/api/auth/signin

# API経由でテスト
curl -X POST http://localhost:3000/api/posts/collect \
  -H "Content-Type: application/json" \
  -d '{"query": "Next.js", "maxResults": 10}'
```

## トラブルシューティング

### Rate Limit エラー

```typescript
if (error instanceof AppError && error.code === 'X_RATE_LIMIT') {
  const waitTime = error.details?.resetIn
  console.log(`Rate limit exceeded. Wait ${waitTime}ms`)
  // 待機またはユーザーに通知
}
```

### トークンリフレッシュ失敗

```typescript
if (session?.error === 'RefreshAccessTokenError') {
  // ユーザーを再ログインに誘導
  redirect('/api/auth/signin')
}
```

### ネットワークエラー

```typescript
if (error instanceof AppError && error.code === 'NETWORK_ERROR') {
  // リトライロジックは自動で実行される
  // 必要に応じて追加のハンドリング
}
```

## パフォーマンス最適化

### 1. バッチ処理の最適化

```typescript
// 大量の投稿IDを取得する場合は、100件ずつに分割
const chunks = chunkArray(tweetIds, 100)

for (const chunk of chunks) {
  const tweets = await getTweetsByIds(client, chunk)
  // 処理
  await sleep(1000) // Rate Limitを考慮
}
```

### 2. キャッシング

```typescript
// Redis等でレスポンスをキャッシュ
const cacheKey = `tweets:${query}`
const cached = await redis.get(cacheKey)

if (cached) {
  return JSON.parse(cached)
}

const result = await searchRecentTweets(client, query)
await redis.setex(cacheKey, 300, JSON.stringify(result)) // 5分間キャッシュ

return result
```

### 3. 並列処理

```typescript
// 複数のキーワードを並列で検索（Rate Limitに注意）
const results = await Promise.all(
  keywords.map((keyword) =>
    searchRecentTweets(client, keyword, { maxResults: 50 })
  )
)
```

## 次のステップ

1. NextAuth.js設定を完成させる
2. Prismaスキーマにtweetデータの保存先を追加
3. Cron Jobsを設定（Vercel Cron）
4. フロントエンドでの表示を実装
5. エラー通知の実装（メール、Slack等）

## 参考リンク

- [X API v2 Documentation](https://developer.x.com/en/docs/twitter-api)
- [NextAuth.js OAuth 2.0](https://next-auth.js.org/configuration/providers/oauth)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
