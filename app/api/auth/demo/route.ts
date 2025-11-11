/**
 * デモモード認証API
 * API Keyなしでログインを可能にする
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isDemoMode, getOrCreateDemoUser } from '@/lib/auth/demo';

/**
 * POST /api/auth/demo
 * デモモードでログイン
 */
export async function POST(request: NextRequest) {
  try {
    // デモモードが有効か確認
    if (!isDemoMode()) {
      return NextResponse.json(
        { error: 'Demo mode is not enabled' },
        { status: 403 }
      );
    }

    // デモユーザーを取得または作成
    const user = await getOrCreateDemoUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create demo user' },
        { status: 500 }
      );
    }

    // セッションCookieを設定（NextAuth.jsの代わり）
    const cookieStore = await cookies();

    // セッション情報をJSON化
    const sessionData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        twitterId: 'demo_twitter_id',
        username: 'demo_user',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24時間
    };

    // Cookieに保存
    cookieStore.set('demo-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24時間
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json(
      { error: 'Failed to create demo session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/demo
 * デモモードでログアウト
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('demo-session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Demo logout error:', error);
    return NextResponse.json(
      { error: 'Failed to delete demo session' },
      { status: 500 }
    );
  }
}
