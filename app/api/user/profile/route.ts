/**
 * User Profile API Route
 * ユーザープロフィールの取得・更新
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma/client';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { AppError, ErrorCodes } from '@/lib/utils/errors';

/**
 * GET /api/user/profile
 * プロフィール取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
    }

    // ユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
      },
    });

    if (!user) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'User not found', 404);
    }

    // プロフィール取得（存在しない場合はデフォルト値）
    let profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    // プロフィールが存在しない場合は作成
    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          userId: session.user.id,
          tone: 'PROFESSIONAL',
        },
      });
    }

    // X アカウント情報取得
    const xAccount = await prisma.xAccount.findUnique({
      where: { userId: session.user.id },
      select: {
        username: true,
        twitterId: true,
      },
    });

    // レスポンス整形
    const responseData = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      username: xAccount?.username || null,
      expertise: profile.expertise,
      interests: profile.interests,
      tone: profile.tone.toLowerCase(),
      avoidTopics: profile.avoidTopics,
      targetAudience: profile.targetAudience,
      createdAt: user.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };

    return successResponse(responseData);
  } catch (error) {
    console.error('Profile GET error:', error);
    if (error instanceof AppError) {
      return errorResponse(error.code, error.message, error.statusCode, error.details);
    }
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch profile',
      500
    );
  }
}

/**
 * PUT /api/user/profile
 * プロフィール更新
 */
export async function PUT(request: NextRequest) {
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
      name,
      email,
      expertise,
      interests,
      targetAudience,
      tone,
      avoidTopics,
    } = body;

    // 基本的なバリデーション
    if (name !== undefined && (typeof name !== 'string' || name.length > 100)) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Name must be a string with max 100 characters',
        400
      );
    }

    if (email !== undefined && typeof email !== 'string') {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Email must be a valid email address',
        400
      );
    }

    if (expertise !== undefined && (!Array.isArray(expertise) || expertise.length > 10)) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Expertise must be an array with max 10 items',
        400
      );
    }

    if (interests !== undefined && (!Array.isArray(interests) || interests.length > 20)) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Interests must be an array with max 20 items',
        400
      );
    }

    if (targetAudience !== undefined && typeof targetAudience !== 'string') {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Target audience must be a string',
        400
      );
    }

    if (tone !== undefined && !['professional', 'casual', 'humorous'].includes(tone)) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Tone must be one of: professional, casual, humorous',
        400
      );
    }

    if (avoidTopics !== undefined && (!Array.isArray(avoidTopics) || avoidTopics.length > 20)) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Avoid topics must be an array with max 20 items',
        400
      );
    }

    // トランザクション開始
    const result = await prisma.$transaction(async (tx) => {
      // User テーブル更新（name, emailのみ）
      const userUpdate: any = {};
      if (name !== undefined) userUpdate.name = name;
      if (email !== undefined) userUpdate.email = email;

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: session.user.id },
          data: userUpdate,
        });
      }

      // UserProfile テーブル更新
      const profileUpdate: any = {};
      if (expertise !== undefined) profileUpdate.expertise = expertise;
      if (interests !== undefined) profileUpdate.interests = interests;
      if (targetAudience !== undefined) profileUpdate.targetAudience = targetAudience;
      if (tone !== undefined) profileUpdate.tone = tone.toUpperCase();
      if (avoidTopics !== undefined) profileUpdate.avoidTopics = avoidTopics;

      let profile = await tx.userProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!profile) {
        // プロフィールが存在しない場合は作成
        profile = await tx.userProfile.create({
          data: {
            userId: session.user.id,
            tone: 'PROFESSIONAL',
            ...profileUpdate,
          },
        });
      } else if (Object.keys(profileUpdate).length > 0) {
        // プロフィール更新
        profile = await tx.userProfile.update({
          where: { userId: session.user.id },
          data: profileUpdate,
        });
      }

      // 更新後のユーザー情報取得
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          createdAt: true,
        },
      });

      const xAccount = await tx.xAccount.findUnique({
        where: { userId: session.user.id },
        select: {
          username: true,
          twitterId: true,
        },
      });

      return { user, profile, xAccount };
    });

    // レスポンス整形
    const responseData = {
      id: result.user!.id,
      email: result.user!.email,
      name: result.user!.name,
      image: result.user!.image,
      username: result.xAccount?.username || null,
      expertise: result.profile.expertise,
      interests: result.profile.interests,
      tone: result.profile.tone.toLowerCase(),
      avoidTopics: result.profile.avoidTopics,
      targetAudience: result.profile.targetAudience,
      createdAt: result.user!.createdAt.toISOString(),
      updatedAt: result.profile.updatedAt.toISOString(),
    };

    return successResponse(responseData, 'Profile updated successfully');
  } catch (error) {
    console.error('Profile PUT error:', error);
    if (error instanceof AppError) {
      return errorResponse(error.code, error.message, error.statusCode, error.details);
    }
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to update profile',
      500
    );
  }
}
