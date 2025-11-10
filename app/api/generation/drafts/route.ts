/**
 * Drafts API Route
 * 下書き一覧取得
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma/client';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { AppError, ErrorCodes } from '@/lib/utils/errors';

/**
 * GET /api/generation/drafts
 * 下書き一覧取得（最新10件）
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
    }

    // URLパラメータ取得
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const statusParam = searchParams.get('status');
    const sortByParam = searchParams.get('sortBy') || 'createdAt';
    const orderParam = searchParams.get('order') || 'desc';

    // パラメータバリデーション
    let limit = 10;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Limit must be a number between 1 and 100',
          400
        );
      }
      limit = parsedLimit;
    }

    // ステータスフィルター
    const validStatuses = ['DRAFT', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED'];
    if (statusParam && !validStatuses.includes(statusParam)) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        `Status must be one of: ${validStatuses.join(', ')}`,
        400
      );
    }

    // ソートフィールドバリデーション
    const validSortFields = ['createdAt', 'updatedAt'];
    if (!validSortFields.includes(sortByParam)) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        `Sort by must be one of: ${validSortFields.join(', ')}`,
        400
      );
    }

    // ソート順バリデーション
    if (!['asc', 'desc'].includes(orderParam)) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Order must be either asc or desc',
        400
      );
    }

    // クエリ条件構築
    const whereClause: any = {
      userId: session.user.id,
    };

    if (statusParam) {
      whereClause.status = statusParam;
    }

    // 下書き取得
    const drafts = await prisma.generatedPost.findMany({
      where: whereClause,
      orderBy: {
        [sortByParam]: orderParam,
      },
      take: limit,
      select: {
        id: true,
        text: true,
        basedOnTopic: true,
        tone: true,
        version: true,
        status: true,
        model: true,
        prompt: true,
        createdAt: true,
        updatedAt: true,
        scheduledPost: {
          select: {
            id: true,
            scheduledFor: true,
            status: true,
          },
        },
      },
    });

    // レスポンス整形
    const responseData = drafts.map((draft) => {
      // promptからメタデータを取り出す
      let hashtags: string[] = [];
      let reasoning: string | undefined;

      if (draft.prompt) {
        try {
          const metadata = JSON.parse(draft.prompt);
          hashtags = metadata.hashtags || [];
          reasoning = metadata.reasoning;
        } catch (e) {
          // JSON parse error - ignore
        }
      }

      return {
        id: draft.id,
        text: draft.text,
        basedOnTopic: draft.basedOnTopic,
        tone: draft.tone.toLowerCase(),
        version: draft.version,
        status: draft.status,
        model: draft.model,
        hashtags,
        reasoning,
        scheduledPost: draft.scheduledPost
          ? {
              id: draft.scheduledPost.id,
              scheduledFor: draft.scheduledPost.scheduledFor.toISOString(),
              status: draft.scheduledPost.status,
            }
          : null,
        createdAt: draft.createdAt.toISOString(),
        updatedAt: draft.updatedAt.toISOString(),
      };
    });

    return successResponse(responseData);
  } catch (error) {
    console.error('Drafts GET error:', error);

    if (error instanceof AppError) {
      return errorResponse(error.code, error.message, error.statusCode, error.details);
    }

    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch drafts',
      500
    );
  }
}
