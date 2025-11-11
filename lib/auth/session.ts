/**
 * セッション管理ヘルパー
 * 通常の認証とデモモードの両方をサポート
 */

import { cookies } from 'next/headers';
import { auth } from '@/lib/auth/config';
import { isDemoMode } from '@/lib/auth/demo';

export interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  twitterId?: string;
  username?: string;
  image?: string | null;
}

export interface Session {
  user: SessionUser;
  expires: string;
}

/**
 * 現在のセッションを取得
 * デモモードと通常モードの両方に対応
 */
export async function getSession(): Promise<Session | null> {
  // デモモードの場合
  if (isDemoMode()) {
    const cookieStore = await cookies();
    const demoSession = cookieStore.get('demo-session');

    if (demoSession) {
      try {
        const sessionData = JSON.parse(demoSession.value);

        // 有効期限を確認
        if (new Date(sessionData.expires) > new Date()) {
          return sessionData;
        }
      } catch (error) {
        console.error('Failed to parse demo session:', error);
      }
    }

    return null;
  }

  // 通常モードの場合
  const session = await auth();
  return session as Session | null;
}

/**
 * 認証が必要なページで使用
 * セッションがない場合はnullを返す
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

/**
 * ユーザーIDを取得
 */
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id || null;
}
