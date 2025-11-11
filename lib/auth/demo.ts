/**
 * デモモード認証ヘルパー
 * API Keyなしでもアプリケーションの動作確認を可能にする
 */

import { prisma } from '@/lib/prisma/client';

/**
 * デモモードが有効かどうかを確認
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true';
}

/**
 * デモユーザーの取得または作成
 */
export async function getOrCreateDemoUser() {
  const demoEmail = 'demo@agentx.local';

  // 既存のデモユーザーを検索
  const existingUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (existingUser) {
    return existingUser;
  }

  // デモユーザーが存在しない場合は作成
  const newUser = await prisma.user.create({
    data: {
      email: demoEmail,
      name: 'デモユーザー',
      xAccount: {
        create: {
          twitterId: 'demo_twitter_id',
          username: 'demo_user',
          accessToken: 'demo_access_token',
          refreshToken: 'demo_refresh_token',
          tokenExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年後
        },
      },
      userProfile: {
        create: {
          tone: 'PROFESSIONAL',
          expertise: ['テクノロジー', 'スタートアップ', 'AI'],
          targetAudience: 'エンジニア、起業家',
        },
      },
    },
  });

  return newUser;
}

/**
 * デモモード用のセッショントークンを生成
 */
export function createDemoSessionToken(userId: string): string {
  // 簡易的なトークン生成（本番環境では使用しない）
  const payload = JSON.stringify({
    userId,
    demo: true,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24時間
  });

  return Buffer.from(payload).toString('base64');
}

/**
 * デモモード用のセッショントークンを検証
 */
export function verifyDemoSessionToken(token: string): { userId: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());

    // トークンが期限切れか確認
    if (payload.exp < Date.now()) {
      return null;
    }

    // デモモードのトークンか確認
    if (!payload.demo) {
      return null;
    }

    return { userId: payload.userId };
  } catch {
    return null;
  }
}

/**
 * デモモード用のモックデータ
 */
export const DEMO_DATA = {
  collectedPosts: [
    {
      id: 'demo-post-1',
      content: 'AI技術の最新動向について調査中。Claude 3.5 Sonnetの性能が素晴らしい！',
      author: 'tech_innovator',
      engagementRate: 8.5,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'demo-post-2',
      content: 'スタートアップの資金調達ラウンドについて学んでいます。シード→シリーズA→シリーズBの流れが理解できた！',
      author: 'startup_founder',
      engagementRate: 12.3,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: 'demo-post-3',
      content: 'Next.js 15とTurbopackの組み合わせで開発速度が爆上がり。もう戻れない...',
      author: 'web_developer',
      engagementRate: 15.7,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ],

  generatedPosts: [
    {
      id: 'demo-gen-1',
      content: 'AI開発の最前線から：Claude 3.5 Sonnetを使った投稿生成システムを構築中。自然な文章生成の精度に驚いています。',
      status: 'DRAFT',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      id: 'demo-gen-2',
      content: 'スタートアップの成長戦略について考察。プロダクトマーケットフィットを見つけることが最重要課題ですね。',
      status: 'DRAFT',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  ],

  analytics: {
    totalPosts: 156,
    totalEngagement: 2340,
    averageEngagementRate: 15.0,
    topKeywords: [
      { keyword: 'AI', count: 45 },
      { keyword: 'スタートアップ', count: 32 },
      { keyword: 'Next.js', count: 28 },
      { keyword: 'TypeScript', count: 24 },
      { keyword: 'Vercel', count: 18 },
    ],
  },
};
