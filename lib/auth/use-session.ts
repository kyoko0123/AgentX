/**
 * 統合セッションフック
 * デモモードとNextAuthの両方に対応
 */

'use client';

import { useSession as useNextAuthSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  twitterId?: string;
  username?: string;
}

export interface Session {
  user: SessionUser;
  expires: string;
}

export interface UseSessionReturn {
  data: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

/**
 * デモセッションを取得
 */
async function getDemoSession(): Promise<Session | null> {
  try {
    const response = await fetch('/api/auth/demo/session');
    if (response.ok) {
      const data = await response.json();
      return data.session;
    }
  } catch (error) {
    console.error('Failed to get demo session:', error);
  }
  return null;
}

/**
 * 統合セッションフック
 * デモモードの場合はデモセッション、通常モードの場合はNextAuthセッションを返す
 */
export function useSession(): UseSessionReturn {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const nextAuthSession = useNextAuthSession();
  const [demoSession, setDemoSession] = useState<Session | null>(null);
  const [demoStatus, setDemoStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    if (isDemoMode) {
      getDemoSession().then(session => {
        setDemoSession(session);
        setDemoStatus(session ? 'authenticated' : 'unauthenticated');
      });
    }
  }, [isDemoMode]);

  if (isDemoMode) {
    return {
      data: demoSession,
      status: demoStatus,
    };
  }

  return {
    data: nextAuthSession.data as Session | null,
    status: nextAuthSession.status,
  };
}
