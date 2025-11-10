/**
 * Health Check API Route
 * サービスヘルスチェック
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { ErrorCodes } from '@/lib/utils/errors';
import { prisma } from '@/lib/prisma/client';
import Anthropic from '@anthropic-ai/sdk';

const startTime = Date.now();

/**
 * GET /api/health
 * ヘルスチェック
 */
export async function GET(request: NextRequest) {
  try {
    const services: {
      database: 'healthy' | 'unhealthy';
      xApi: 'healthy' | 'unhealthy';
      claudeApi: 'healthy' | 'unhealthy';
    } = {
      database: 'unhealthy',
      xApi: 'unhealthy',
      claudeApi: 'unhealthy',
    };

    // データベース接続確認
    try {
      await prisma.$queryRaw`SELECT 1`;
      services.database = 'healthy';
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
    }

    // X API接続確認（環境変数チェック）
    try {
      const hasXApiCredentials =
        process.env.TWITTER_CLIENT_ID &&
        process.env.TWITTER_CLIENT_SECRET;

      if (hasXApiCredentials) {
        services.xApi = 'healthy';
      } else {
        console.warn('X API credentials not configured');
      }
    } catch (xApiError) {
      console.error('X API health check failed:', xApiError);
    }

    // Claude API接続確認（環境変数チェック）
    try {
      const hasClaudeApiKey = process.env.ANTHROPIC_API_KEY;

      if (hasClaudeApiKey) {
        // 簡単なAPIコール確認（オプショナル）
        // Rate limitを考慮して、環境変数の存在チェックのみ
        services.claudeApi = 'healthy';

        // より厳密なチェックが必要な場合（コメント解除）
        /*
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        // 最小限のテストリクエスト
        await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }],
        });
        */
      } else {
        console.warn('Claude API key not configured');
      }
    } catch (claudeError) {
      console.error('Claude API health check failed:', claudeError);
    }

    // 全体のステータス判定
    const allHealthy =
      services.database === 'healthy' &&
      services.xApi === 'healthy' &&
      services.claudeApi === 'healthy';

    const status = allHealthy ? 'healthy' : 'unhealthy';

    const responseData = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000), // seconds
      services,
    };

    // 一部でも unhealthy なら 503 を返す
    if (!allHealthy) {
      return errorResponse(
        'SERVICE_UNAVAILABLE',
        'One or more services are unhealthy',
        503,
        responseData
      );
    }

    return successResponse(responseData);
  } catch (error) {
    console.error('Health check error:', error);

    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Health check failed',
      500,
      {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    );
  }
}
