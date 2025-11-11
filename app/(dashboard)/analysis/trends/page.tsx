/**
 * Trends Analysis Page
 * トレンド分析ページ
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
import { Button } from '@/components/ui/Button';

interface TrendingTopic {
  topic: string;
  volume: number;
  growth: number;
  category: string;
}

interface PopularPost {
  id: string;
  username: string;
  content: string;
  likes: number;
  retweets: number;
  replies: number;
  timestamp: string;
}

export default function TrendsAnalysisPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // デモモード用のダミーデータ
  const trendingTopics: TrendingTopic[] = [
    { topic: 'AI技術', volume: 125000, growth: 45, category: 'テクノロジー' },
    { topic: 'スタートアップ', volume: 89000, growth: 32, category: 'ビジネス' },
    { topic: 'Web3', volume: 67000, growth: 28, category: 'テクノロジー' },
    { topic: 'リモートワーク', volume: 54000, growth: 15, category: 'ワークスタイル' },
    { topic: 'プログラミング', volume: 48000, growth: 22, category: 'テクノロジー' },
  ];

  const popularPosts: PopularPost[] = [
    {
      id: '1',
      username: 'tech_guru',
      content: 'AI技術の最新トレンドについて解説します。GPT-4の登場により、自然言語処理の分野が大きく進化しています。',
      likes: 2340,
      retweets: 890,
      replies: 234,
      timestamp: '2時間前',
    },
    {
      id: '2',
      username: 'startup_news',
      content: 'スタートアップの資金調達ラウンドが活況！2024年はシード段階の投資が前年比150%増加。',
      likes: 1890,
      retweets: 654,
      replies: 178,
      timestamp: '4時間前',
    },
    {
      id: '3',
      username: 'web3_enthusiast',
      content: 'Web3の普及に向けた課題と解決策。ユーザー体験の改善が今後の鍵となる。',
      likes: 1560,
      retweets: 432,
      replies: 145,
      timestamp: '6時間前',
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // デモモードでは2秒待機するだけ
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            トレンド分析
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            X（Twitter）のトレンドと人気投稿を分析
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          isLoading={isRefreshing}
          disabled={isRefreshing}
          variant="outline"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          更新
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trending Topics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>トレンドトピック</CardTitle>
              <CardDescription>
                現在話題になっているトピック
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendingTopics.map((topic, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {topic.topic}
                        </h3>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {topic.category}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                        <span>{formatNumber(topic.volume)} 投稿</span>
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                          +{topic.growth}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Demo Notice */}
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
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
                    これはデモデータです。実際のX
                    APIと連携するには、OAuth認証を設定してください。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Posts */}
        <Card>
          <CardHeader>
            <CardTitle>人気投稿</CardTitle>
            <CardDescription>
              高エンゲージメントの投稿
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      {post.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        @{post.username}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {post.timestamp}
                      </p>
                    </div>
                  </div>
                  <p className="mb-3 text-sm text-zinc-700 dark:text-zinc-300">
                    {post.content}
                  </p>
                  <div className="flex gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      {formatNumber(post.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                      {formatNumber(post.retweets)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      {formatNumber(post.replies)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
