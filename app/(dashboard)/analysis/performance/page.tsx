/**
 * Performance Analysis Page
 * パフォーマンス分析ページ
 */

'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';

interface PerformanceMetrics {
  totalPosts: number;
  totalImpressions: number;
  totalEngagements: number;
  engagementRate: number;
  followers: number;
  followersGrowth: number;
}

interface TopPost {
  id: string;
  content: string;
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
  engagementRate: number;
  postedAt: string;
}

export default function PerformanceAnalysisPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // デモモード用のダミーデータ
  const metrics: PerformanceMetrics = {
    totalPosts: 45,
    totalImpressions: 125000,
    totalEngagements: 8500,
    engagementRate: 6.8,
    followers: 3420,
    followersGrowth: 12.5,
  };

  const topPosts: TopPost[] = [
    {
      id: '1',
      content: 'AI技術の最新トレンドについて解説。GPT-4の登場により自然言語処理が大きく進化...',
      likes: 450,
      retweets: 180,
      replies: 65,
      impressions: 12500,
      engagementRate: 5.56,
      postedAt: '2025-11-08 10:00',
    },
    {
      id: '2',
      content: 'スタートアップの資金調達ラウンドが活況！2024年はシード段階の投資が増加傾向...',
      likes: 380,
      retweets: 145,
      replies: 48,
      impressions: 10200,
      engagementRate: 5.62,
      postedAt: '2025-11-06 15:30',
    },
    {
      id: '3',
      content: 'リモートワークの生産性向上のコツ。5年間の経験から学んだベストプラクティスをシェア...',
      likes: 320,
      retweets: 125,
      replies: 42,
      impressions: 9800,
      engagementRate: 4.97,
      postedAt: '2025-11-04 12:00',
    },
  ];

  const periodLabels = {
    '7d': '過去7日間',
    '30d': '過去30日間',
    '90d': '過去90日間',
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            パフォーマンス分析
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            投稿のエンゲージメントとインサイトを分析
          </p>
        </div>
        <div className="flex gap-2">
          {(Object.keys(periodLabels) as Array<keyof typeof periodLabels>).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {periodLabels[period]}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="mb-6 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                投稿数
              </p>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {metrics.totalPosts}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                インプレッション
              </p>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatNumber(metrics.totalImpressions)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                エンゲージメント
              </p>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatNumber(metrics.totalEngagements)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                エンゲージメント率
              </p>
              <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                {metrics.engagementRate}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                フォロワー
              </p>
              <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatNumber(metrics.followers)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                フォロワー増加
              </p>
              <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                +{metrics.followersGrowth}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Posts */}
      <Card>
        <CardHeader>
          <CardTitle>トップパフォーマンス投稿</CardTitle>
          <CardDescription>
            最も高いエンゲージメントを獲得した投稿
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPosts.map((post, index) => (
              <div
                key={post.id}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(post.postedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      {post.content}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                  <div className="text-center">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">いいね</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatNumber(post.likes)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">リツイート</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatNumber(post.retweets)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">返信</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatNumber(post.replies)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">表示</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatNumber(post.impressions)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">率</p>
                    <p className="mt-1 text-sm font-semibold text-green-600 dark:text-green-400">
                      {post.engagementRate}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Notice */}
      <Card className="mt-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400">
                デモモード
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                これはデモデータです。実際のパフォーマンス分析を表示するには、X
                APIと連携してください。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
