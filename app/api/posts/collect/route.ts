/**
 * Posts Collection API Route
 * X投稿収集エンドポイント
 */

import { NextRequest } from 'next/server';
import { auth, getDecryptedTokens } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma/client';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { AppError, ErrorCodes } from '@/lib/utils/errors';
import { createXApiClientWithOAuth, collectPostsByKeywords } from '@/lib/x-api';

/**
 * POST /api/posts/collect
 * キーワードで投稿収集
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
    }

    // リクエストボディ取得
    const body = await request.json();

    // バリデーション
    const {
      keyword,
      maxResults = 10,
      minLikes = 0,
    } = body;

    // 必須フィールド
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Keyword is required and must be a non-empty string',
        400
      );
    }

    if (keyword.length > 100) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Keyword must be 100 characters or less',
        400
      );
    }

    // オプションフィールドのバリデーション
    if (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 100) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Max results must be a number between 1 and 100',
        400
      );
    }

    if (typeof minLikes !== 'number' || minLikes < 0) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Min likes must be a non-negative number',
        400
      );
    }

    // X APIトークン取得
    const tokens = await getDecryptedTokens(session.user.id);

    // X APIクライアント作成
    const xApiClient = createXApiClientWithOAuth(
      tokens.accessToken,
      tokens.refreshToken || undefined
    );

    // 投稿収集
    const result = await collectPostsByKeywords(xApiClient, {
      keywords: [keyword],
      maxResultsPerKeyword: maxResults,
      minLikes,
      language: 'ja',
    });

    // 収集した投稿をDBに保存
    let savedCount = 0;
    let duplicateCount = 0;

    for (const tweet of result.tweets) {
      try {
        // 重複チェック
        const existing = await prisma.collectedPost.findFirst({
          where: {
            tweetId: tweet.id,
            userId: session.user.id,
          },
        });

        if (existing) {
          duplicateCount++;
          continue;
        }

        // public_metricsが存在しない場合はスキップ
        if (!tweet.public_metrics) {
          console.warn('Tweet missing public_metrics:', tweet.id);
          continue;
        }

        // MVPではエンゲージメント率を簡易計算（follower数がないため）
        // 実装: (likes + retweets + replies) / impressions * 100
        const totalEngagement =
          tweet.public_metrics.like_count +
          tweet.public_metrics.retweet_count +
          tweet.public_metrics.reply_count;

        const engagementRate = tweet.public_metrics.impression_count > 0
          ? (totalEngagement / tweet.public_metrics.impression_count) * 100
          : 0;

        // 保存
        await prisma.collectedPost.create({
          data: {
            userId: session.user.id,
            tweetId: tweet.id,
            text: tweet.text,
            authorId: tweet.author_id || 'unknown',
            authorUsername: 'unknown', // MVPでは別途取得が必要
            authorFollowers: null, // MVPでは別途取得が必要
            likes: tweet.public_metrics.like_count,
            retweets: tweet.public_metrics.retweet_count,
            replies: tweet.public_metrics.reply_count,
            impressions: tweet.public_metrics.impression_count || null,
            engagementRate,
            topics: [], // MVPでは空
            sentiment: null, // MVPでは未実装
            tweetCreatedAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
          },
        });

        savedCount++;
      } catch (saveError) {
        console.error('Failed to save tweet:', tweet.id, saveError);
        // 個別の保存エラーは続行
      }
    }

    const responseData = {
      collected: savedCount,
      duplicates: duplicateCount,
      keyword,
      totalFound: result.tweets.length,
    };

    return successResponse(responseData, 'Posts collected successfully', 201);
  } catch (error) {
    console.error('Posts collection error:', error);

    // X API エラー
    if (error instanceof Error) {
      if (error.message.includes('Rate limit') || error.message.includes('429')) {
        return errorResponse(
          ErrorCodes.X_RATE_LIMIT,
          'X API rate limit exceeded. Please try again later.',
          429,
          { originalError: error.message }
        );
      }

      if (
        error.message.includes('X API') ||
        error.message.includes('Twitter') ||
        error.message.includes('401') ||
        error.message.includes('403')
      ) {
        return errorResponse(
          ErrorCodes.X_API_ERROR,
          'Failed to collect posts from X API',
          502,
          { originalError: error.message }
        );
      }
    }

    // AppError
    if (error instanceof AppError) {
      return errorResponse(error.code, error.message, error.statusCode, error.details);
    }

    // その他のエラー
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to collect posts',
      500
    );
  }
}
