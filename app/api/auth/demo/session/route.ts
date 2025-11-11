/**
 * デモセッション取得API
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isDemoMode } from '@/lib/auth/demo';

export async function GET() {
  try {
    if (!isDemoMode()) {
      return NextResponse.json(
        { error: 'Demo mode is not enabled' },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    const demoSession = cookieStore.get('demo-session');

    if (!demoSession) {
      return NextResponse.json({ session: null });
    }

    try {
      const sessionData = JSON.parse(demoSession.value);

      // セッションが有効期限内かチェック
      if (new Date(sessionData.expires) > new Date()) {
        return NextResponse.json({ session: sessionData });
      }
    } catch (error) {
      console.error('Failed to parse demo session:', error);
    }

    return NextResponse.json({ session: null });
  } catch (error) {
    console.error('Demo session fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demo session' },
      { status: 500 }
    );
  }
}
