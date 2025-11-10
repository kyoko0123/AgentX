/**
 * Post Generation API Route
 * AI投稿生成エンドポイント
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma/client';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { AppError, ErrorCodes } from '@/lib/utils/errors';
import { createGenerationService } from '@/lib/ai/generation-service';

/**
 * POST /api/generation/create
 * AI投稿生成
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
      topic,
      tone,
      length = 'medium',
      includeHashtags = true,
      includeEmoji = false,
      variations = 1,
      basedOnPostId,
    } = body;

    // 必須フィールド
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Topic is required and must be a non-empty string',
        400
      );
    }

    if (topic.length > 200) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Topic must be 200 characters or less',
        400
      );
    }

    // オプションフィールドのバリデーション
    if (tone && !['professional', 'casual', 'humorous'].includes(tone)) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Tone must be one of: professional, casual, humorous',
        400
      );
    }

    if (length && !['short', 'medium', 'long'].includes(length)) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Length must be one of: short, medium, long',
        400
      );
    }

    if (typeof variations !== 'number' || variations < 1 || variations > 5) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Variations must be a number between 1 and 5',
        400
      );
    }

    // Generation Service初期化
    const generationService = createGenerationService(session.user.id, prisma);

    // 単一バリエーションの場合
    if (variations === 1) {
      const result = await generationService.generateAndSave({
        topic,
        tone: tone as any,
        length: length as any,
        includeHashtags,
        includeEmoji,
        basedOnPostId,
      });

      const responseData = {
        variations: [
          {
            id: result.saved.id,
            text: result.generated.text,
            tone: result.saved.tone.toLowerCase(),
            status: result.saved.status,
            hashtags: result.generated.hashtags,
            reasoning: result.generated.reasoning,
            createdAt: result.saved.createdAt.toISOString(),
          },
        ],
        basedOnTopic: topic,
        generatedAt: new Date().toISOString(),
      };

      return successResponse(responseData, 'Post generated successfully', 201);
    }

    // 複数バリエーションの場合
    const result = await generationService.generateVariationsAndSave({
      topic,
      tone: tone as any,
      length: length as any,
      includeHashtags,
      includeEmoji,
      variations,
      basedOnPostId,
    });

    const responseData = {
      variations: result.saved.map((saved, index) => {
        const variation = result.variations.variations[index];
        return {
          id: saved.id,
          text: saved.text,
          tone: saved.tone.toLowerCase(),
          status: saved.status,
          hashtags: variation?.hashtags || [],
          reasoning: variation?.reasoning,
          createdAt: saved.createdAt.toISOString(),
        };
      }),
      basedOnTopic: topic,
      generatedAt: new Date().toISOString(),
    };

    return successResponse(responseData, 'Posts generated successfully', 201);
  } catch (error) {
    console.error('Generation POST error:', error);

    // Claude API エラー
    if (error instanceof Error && error.message.includes('Claude API')) {
      return errorResponse(
        ErrorCodes.CLAUDE_API_ERROR,
        'Failed to generate post with Claude API',
        502,
        { originalError: error.message }
      );
    }

    // AppError
    if (error instanceof AppError) {
      return errorResponse(error.code, error.message, error.statusCode, error.details);
    }

    // その他のエラー
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to generate post',
      500
    );
  }
}
