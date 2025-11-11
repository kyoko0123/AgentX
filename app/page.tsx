/**
 * ルートページ
 * 認証状態に応じてリダイレクト
 */

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

export default async function HomePage() {
  const session = await getSession();

  // セッションがある場合はダッシュボードへ
  if (session) {
    redirect('/dashboard');
  }

  // セッションがない場合はログインページへ
  redirect('/login');
}
