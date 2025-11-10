/**
 * X API Client - Usage Examples
 * 実際の使用例を示すサンプルコード集
 */

import { getXApiClientFromEnv, createXApiClientWithOAuth } from './client'
import {
  searchRecentTweets,
  collectPostsByKeywords,
  getTweetMetrics,
  getTopTweets,
} from './posts'
import {
  createTweet,
  createTweetThread,
  deleteTweet,
  validateTweetText,
} from './publish'
import { AppError, ErrorCodes } from '../utils/errors'

// ============================================================================
// Example 1: 基本的な投稿検索
// ============================================================================

export async function example1_basicSearch() {
  console.log('=== Example 1: 基本的な投稿検索 ===\n')

  try {
    // クライアント初期化
    const client = getXApiClientFromEnv()

    // キーワード検索
    const result = await searchRecentTweets(client, 'Next.js', {
      maxResults: 10,
      minLikes: 5,
      language: 'ja',
    })

    console.log(`✅ 検索成功: ${result.meta.resultCount}件の投稿を取得`)

    // 結果を表示
    result.tweets.forEach((tweet, index) => {
      console.log(`\n${index + 1}. ${tweet.text}`)
      console.log(`   Likes: ${tweet.public_metrics?.like_count || 0}`)
      console.log(`   Retweets: ${tweet.public_metrics?.retweet_count || 0}`)
    })
  } catch (error) {
    handleError(error)
  }
}

// ============================================================================
// Example 2: 複数キーワードでの収集
// ============================================================================

export async function example2_multiKeywordCollection() {
  console.log('\n=== Example 2: 複数キーワードでの収集 ===\n')

  try {
    const client = getXApiClientFromEnv()

    const result = await collectPostsByKeywords(client, {
      keywords: ['AI', '機械学習', 'ChatGPT'],
      maxResultsPerKeyword: 50,
      minLikes: 10,
      language: 'ja',
    })

    console.log(`✅ 収集成功: ${result.totalCollected}件の投稿を取得`)
    console.log(`   重複削除: ${result.duplicatesRemoved}件`)

    console.log('\nキーワード別の件数:')
    Object.entries(result.byKeyword).forEach(([keyword, count]) => {
      console.log(`   ${keyword}: ${count}件`)
    })

    // エンゲージメントの高い投稿トップ5を表示
    const topTweets = getTopTweets(result.tweets, 5)
    console.log('\nトップ5の投稿:')
    topTweets.forEach((tweet, index) => {
      console.log(`\n${index + 1}. ${tweet.text.substring(0, 100)}...`)
      console.log(`   Engagement: ${tweet.public_metrics?.like_count || 0} likes`)
    })
  } catch (error) {
    handleError(error)
  }
}

// ============================================================================
// Example 3: エンゲージメントメトリクスの取得
// ============================================================================

export async function example3_getMetrics() {
  console.log('\n=== Example 3: エンゲージメントメトリクスの取得 ===\n')

  try {
    const client = getXApiClientFromEnv()

    // まず投稿を検索
    const searchResult = await searchRecentTweets(client, 'TypeScript', {
      maxResults: 5,
      minLikes: 20,
    })

    if (searchResult.tweets.length === 0) {
      console.log('投稿が見つかりませんでした')
      return
    }

    // 最初の投稿のメトリクスを取得
    const tweet = searchResult.tweets[0]
    const metrics = await getTweetMetrics(client, tweet.id)

    console.log(`✅ メトリクス取得成功`)
    console.log(`\n投稿: ${tweet.text.substring(0, 100)}...`)
    console.log(`\nメトリクス:`)
    console.log(`   Likes: ${metrics.likes}`)
    console.log(`   Retweets: ${metrics.retweets}`)
    console.log(`   Replies: ${metrics.replies}`)
    console.log(`   Impressions: ${metrics.impressions}`)
    console.log(`   Engagement Rate: ${metrics.engagementRate.toFixed(2)}%`)
  } catch (error) {
    handleError(error)
  }
}

// ============================================================================
// Example 4: 投稿の作成（OAuth 2.0必須）
// ============================================================================

export async function example4_createTweet(
  accessToken: string,
  userId: string
) {
  console.log('\n=== Example 4: 投稿の作成 ===\n')

  try {
    // OAuth 2.0クライアントを初期化
    const client = createXApiClientWithOAuth(accessToken)

    // 投稿テキストをバリデーション
    const text = 'AgentXからの自動投稿テストです！ #AgentX #AI'
    const validation = validateTweetText(text)

    if (!validation.valid) {
      console.error('❌ バリデーションエラー:', validation.errors)
      return
    }

    // 投稿を作成
    const result = await createTweet(client, text, userId)

    console.log(`✅ 投稿成功!`)
    console.log(`   Tweet ID: ${result.tweetId}`)
    console.log(`   URL: ${result.url}`)
  } catch (error) {
    handleError(error)
  }
}

// ============================================================================
// Example 5: スレッド作成
// ============================================================================

export async function example5_createThread(
  accessToken: string,
  userId: string
) {
  console.log('\n=== Example 5: スレッド作成 ===\n')

  try {
    const client = createXApiClientWithOAuth(accessToken)

    const threadTweets = [
      '🧵 AgentXの主な機能について紹介します (1/4)',
      '1️⃣ 投稿収集: X APIを使ってトレンドの投稿を自動収集 (2/4)',
      '2️⃣ AI分析: Claude APIで投稿を分析し、インサイトを抽出 (3/4)',
      '3️⃣ 自動投稿: 分析結果をもとに最適な投稿を自動生成・投稿 (4/4)',
    ]

    console.log(`スレッド作成中... (${threadTweets.length}件の投稿)`)

    const results = await createTweetThread(
      client,
      threadTweets,
      userId,
      3000 // 3秒間隔
    )

    console.log(`✅ スレッド作成成功: ${results.length}件の投稿`)
    results.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.url}`)
    })
  } catch (error) {
    handleError(error)
  }
}

// ============================================================================
// Example 6: 投稿の削除
// ============================================================================

export async function example6_deleteTweet(
  accessToken: string,
  tweetId: string,
  userId: string
) {
  console.log('\n=== Example 6: 投稿の削除 ===\n')

  try {
    const client = createXApiClientWithOAuth(accessToken)

    const result = await deleteTweet(client, tweetId, userId)

    if (result.deleted) {
      console.log(`✅ 投稿削除成功: ${result.tweetId}`)
    } else {
      console.log(`❌ 投稿削除失敗`)
    }
  } catch (error) {
    handleError(error)
  }
}

// ============================================================================
// Example 7: Rate Limitのモニタリング
// ============================================================================

export async function example7_rateLimitMonitoring() {
  console.log('\n=== Example 7: Rate Limitのモニタリング ===\n')

  try {
    const client = getXApiClientFromEnv()

    // Rate Limiterを取得
    const rateLimiter = client.getRateLimiter()

    // 検索エンドポイントのRate Limitをチェック
    const searchLimit = await rateLimiter.checkLimit('search/recent', 'app')

    console.log('Search Recent API:')
    console.log(`   利用可能: ${searchLimit.allowed ? 'はい' : 'いいえ'}`)
    console.log(`   残り: ${searchLimit.remaining}リクエスト`)
    console.log(
      `   リセットまで: ${Math.ceil(searchLimit.resetIn / 1000)}秒`
    )

    // 実際にリクエストを実行
    console.log('\n検索を実行中...')
    await searchRecentTweets(client, 'test', { maxResults: 10 })

    // 再度チェック
    const afterLimit = await rateLimiter.checkLimit('search/recent', 'app')
    console.log('\n実行後:')
    console.log(`   残り: ${afterLimit.remaining}リクエスト`)
  } catch (error) {
    handleError(error)
  }
}

// ============================================================================
// Example 8: エラーハンドリングの例
// ============================================================================

export async function example8_errorHandling() {
  console.log('\n=== Example 8: エラーハンドリング ===\n')

  const client = getXApiClientFromEnv()

  // 1. Rate Limitエラー
  console.log('1. Rate Limitエラーのテスト')
  try {
    // 大量のリクエストを送信（テスト用）
    for (let i = 0; i < 500; i++) {
      await searchRecentTweets(client, 'test', { maxResults: 10 })
    }
  } catch (error) {
    if (error instanceof AppError && error.code === ErrorCodes.X_RATE_LIMIT) {
      console.log('   ✅ Rate Limitエラーを正常に検知')
      console.log(`   待機時間: ${error.details?.resetIn}ms`)
    }
  }

  // 2. 存在しない投稿の取得
  console.log('\n2. 存在しない投稿の取得')
  try {
    await getTweetMetrics(client, '999999999999999999')
  } catch (error) {
    if (error instanceof AppError && error.code === ErrorCodes.NOT_FOUND) {
      console.log('   ✅ NOT FOUNDエラーを正常に検知')
    }
  }

  // 3. バリデーションエラー
  console.log('\n3. バリデーションエラー')
  try {
    const longText = 'あ'.repeat(300) // 280文字超過
    const validation = validateTweetText(longText)
    if (!validation.valid) {
      console.log('   ✅ バリデーションエラーを正常に検知')
      console.log(`   エラー: ${validation.errors.join(', ')}`)
    }
  } catch (error) {
    handleError(error)
  }
}

// ============================================================================
// Example 9: 実際のワークフロー（収集→分析→投稿）
// ============================================================================

export async function example9_completeWorkflow(
  accessToken: string,
  userId: string
) {
  console.log('\n=== Example 9: 完全なワークフロー ===\n')

  try {
    // Step 1: 投稿収集
    console.log('Step 1: 投稿を収集中...')
    const searchClient = getXApiClientFromEnv()

    const collected = await collectPostsByKeywords(searchClient, {
      keywords: ['Next.js 14', 'Server Actions'],
      maxResultsPerKeyword: 30,
      minLikes: 20,
      language: 'en',
    })

    console.log(`✅ ${collected.totalCollected}件の投稿を収集`)

    // Step 2: トップ投稿を分析
    console.log('\nStep 2: トップ投稿を分析中...')
    const topTweets = getTopTweets(collected.tweets, 3)

    topTweets.forEach((tweet, index) => {
      console.log(`\n${index + 1}. ${tweet.text.substring(0, 100)}...`)
      console.log(`   Likes: ${tweet.public_metrics?.like_count}`)
    })

    // Step 3: 投稿を作成（実際にはClaude APIで生成）
    console.log('\nStep 3: 投稿を作成中...')
    const postClient = createXApiClientWithOAuth(accessToken)

    // この例では固定テキストを使用（実際にはClaude APIで生成）
    const generatedText = `Next.js 14のServer Actionsについて調査しました！
詳細はこちら: https://example.com/blog/nextjs-14

#NextJS #ServerActions #WebDev`

    const validation = validateTweetText(generatedText)
    if (!validation.valid) {
      console.error('バリデーションエラー:', validation.errors)
      return
    }

    const posted = await createTweet(postClient, generatedText, userId)

    console.log(`✅ 投稿成功!`)
    console.log(`   URL: ${posted.url}`)

    console.log('\n🎉 ワークフロー完了!')
  } catch (error) {
    handleError(error)
  }
}

// ============================================================================
// ヘルパー関数
// ============================================================================

function handleError(error: unknown) {
  if (error instanceof AppError) {
    console.error(`\n❌ エラー: ${error.message}`)
    console.error(`   コード: ${error.code}`)
    console.error(`   ステータス: ${error.statusCode}`)

    if (error.details) {
      console.error(`   詳細:`, error.details)
    }
  } else if (error instanceof Error) {
    console.error(`\n❌ エラー: ${error.message}`)
  } else {
    console.error(`\n❌ 不明なエラー:`, error)
  }
}

// ============================================================================
// メイン実行関数（デモ用）
// ============================================================================

export async function runAllExamples() {
  console.log('╔════════════════════════════════════════════╗')
  console.log('║   X API Client - Usage Examples           ║')
  console.log('╚════════════════════════════════════════════╝\n')

  // 読み取り専用の例（Bearer Tokenで実行可能）
  await example1_basicSearch()
  await example2_multiKeywordCollection()
  await example3_getMetrics()
  await example7_rateLimitMonitoring()
  await example8_errorHandling()

  // 書き込みの例はOAuth 2.0が必要なのでコメントアウト
  // await example4_createTweet(accessToken, userId)
  // await example5_createThread(accessToken, userId)
  // await example6_deleteTweet(accessToken, tweetId, userId)
  // await example9_completeWorkflow(accessToken, userId)

  console.log('\n✅ すべての例を実行完了!')
}

// ============================================================================
// 実行（直接このファイルを実行した場合）
// ============================================================================

if (require.main === module) {
  runAllExamples().catch(console.error)
}
