/**
 * デモログアウトAPI
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isDemoMode } from '@/lib/auth/demo';

export async function POST() {
  try {
    if (!isDemoMode()) {
      return NextResponse.json(
        { error: 'Demo mode is not enabled' },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.delete('demo-session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Demo logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
