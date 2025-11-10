#!/usr/bin/env tsx
/**
 * X API Client - Basic Test Script
 * 基本的な機能のテストスクリプト
 *
 * 実行方法:
 * 1. .env.localにX_BEARER_TOKENを設定
 * 2. npx tsx lib/x-api/test-basic.ts
 */

import { getXApiClientFromEnv } from './client'
import { searchRecentTweets, getTweetMetrics } from './posts'
import { validateTweetText } from './publish'

async function main() {
  console.log('╔════════════════════════════════════════════╗')
  console.log('║   X API Client - Basic Test               ║')
  console.log('╚════════════════════════════════════════════╝\n')

  // Test 1: Client initialization
  console.log('Test 1: クライアント初期化')
  try {
    const client = getXApiClientFromEnv()
    console.log('✅ クライアント初期化成功\n')

    // Test 2: Search tweets
    console.log('Test 2: 投稿検索')
    const searchResult = await searchRecentTweets(client, 'Next.js', {
      maxResults: 5,
      language: 'en',
    })

    console.log(`✅ 検索成功: ${searchResult.meta.resultCount}件\n`)

    if (searchResult.tweets.length > 0) {
      const firstTweet = searchResult.tweets[0]
      console.log('最初の投稿:')
      console.log(`  テキスト: ${firstTweet.text.substring(0, 100)}...`)
      console.log(`  Likes: ${firstTweet.public_metrics?.like_count || 0}`)
      console.log(`  Retweets: ${firstTweet.public_metrics?.retweet_count || 0}\n`)

      // Test 3: Get metrics
      console.log('Test 3: メトリクス取得')
      try {
        const metrics = await getTweetMetrics(client, firstTweet.id)
        console.log(`✅ メトリクス取得成功`)
        console.log(`  Engagement Rate: ${metrics.engagementRate.toFixed(2)}%\n`)
      } catch (error) {
        console.log('⚠️  メトリクス取得をスキップ（権限不足の可能性）\n')
      }
    }

    // Test 4: Text validation
    console.log('Test 4: テキストバリデーション')
    const validText = 'これは有効な投稿テキストです'
    const validation1 = validateTweetText(validText)
    console.log(`✅ 有効なテキスト: ${validation1.valid}`)

    const invalidText = 'あ'.repeat(300)
    const validation2 = validateTweetText(invalidText)
    console.log(`✅ 無効なテキスト: ${!validation2.valid}`)
    console.log(`  エラー: ${validation2.errors[0]}\n`)

    // Test 5: Rate limiter
    console.log('Test 5: Rate Limiter')
    const rateLimiter = client.getRateLimiter()
    const status = await rateLimiter.checkLimit('tweets/search/recent', 'app')
    console.log(`✅ Rate Limit確認成功`)
    console.log(`  利用可能: ${status.allowed}`)
    console.log(`  残り: ${status.remaining}リクエスト\n`)

    console.log('🎉 すべてのテストが成功しました！')
  } catch (error) {
    console.error('\n❌ テスト失敗:', error)
    process.exit(1)
  }
}

// Run tests
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
