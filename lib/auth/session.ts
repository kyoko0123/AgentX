/**
 * 認証セッション ユーティリティ
 * Server Components でセッションを取得するためのヘルパー関数
 */

import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';

/**
 * 現在のセッションを取得
 * Server Components で使用
 */
export async function getSession() {
  return await auth();
}

/**
 * 認証済みセッションを取得（認証必須）
 * 認証されていない場合はログインページにリダイレクト
 */
export async function getAuthSession() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return session;
}

/**
 * 現在のユーザーIDを取得
 * 認証されていない場合は null を返す
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}

/**
 * 現在のユーザーIDを取得（認証必須）
 * 認証されていない場合はログインページにリダイレクト
 */
export async function getRequiredUserId(): Promise<string> {
  const session = await getAuthSession();
  return session.user.id;
}

/**
 * 現在のユーザー情報を取得
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

/**
 * 認証済みユーザー情報を取得（認証必須）
 * 認証されていない場合はログインページにリダイレクト
 */
export async function getRequiredUser() {
  const session = await getAuthSession();
  return session.user;
}

/**
 * セッションが有効かチェック
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return !!session;
}

/**
 * セッションエラーをチェック
 * トークンリフレッシュエラーがある場合は true を返す
 */
export async function hasSessionError(): Promise<boolean> {
  const session = await auth();
  return !!session?.error;
}
