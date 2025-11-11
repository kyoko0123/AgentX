/**
 * Scheduling Page
 * スケジュール管理ページ
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

interface ScheduledPost {
  id: string;
  content: string;
  scheduledTime: string;
  status: 'scheduled' | 'posted' | 'failed';
  tone: string;
}

export default function SchedulingPage() {
  const [selectedTab, setSelectedTab] = useState<'scheduled' | 'history'>('scheduled');

  // デモモード用のダミーデータ
  const scheduledPosts: ScheduledPost[] = [
    {
      id: '1',
      content: 'AI技術の最新トレンドについて解説します。今日は自然言語処理の進化について...',
      scheduledTime: '2025-11-12 10:00',
      status: 'scheduled',
      tone: 'プロフェッショナル',
    },
    {
      id: '2',
      content: 'スタートアップの成功に必要な3つの要素とは？経験から学んだことをシェアします...',
      scheduledTime: '2025-11-12 15:30',
      status: 'scheduled',
      tone: 'カジュアル',
    },
    {
      id: '3',
      content: 'Web3の未来について考える。ブロックチェーン技術がもたらす変革とは...',
      scheduledTime: '2025-11-13 09:00',
      status: 'scheduled',
      tone: 'プロフェッショナル',
    },
  ];

  const postedHistory: ScheduledPost[] = [
    {
      id: '4',
      content: 'リモートワークの生産性向上のコツ。5年間の経験から学んだベストプラクティス...',
      scheduledTime: '2025-11-11 12:00',
      status: 'posted',
      tone: 'カジュアル',
    },
    {
      id: '5',
      content: 'プログラミング学習のロードマップ2024年版。初心者から上級者まで...',
      scheduledTime: '2025-11-10 14:00',
      status: 'posted',
      tone: 'プロフェッショナル',
    },
  ];

  const handleDeletePost = (id: string) => {
    alert(`投稿ID ${id} を削除しました（デモモード）`);
  };

  const handleEditPost = (id: string) => {
    alert(`投稿ID ${id} を編集します（デモモード）`);
  };

  const getStatusBadge = (status: ScheduledPost['status']) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      posted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };

    const labels = {
      scheduled: '予約済み',
      posted: '投稿済み',
      failed: '失敗',
    };

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const currentPosts = selectedTab === 'scheduled' ? scheduledPosts : postedHistory;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          スケジュール管理
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          投稿の予約と履歴を管理
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2 border-b border-zinc-200 dark:border-zinc-700">
        <button
          onClick={() => setSelectedTab('scheduled')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            selectedTab === 'scheduled'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          予約済み ({scheduledPosts.length})
        </button>
        <button
          onClick={() => setSelectedTab('history')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            selectedTab === 'history'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          履歴 ({postedHistory.length})
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {currentPosts.map((post) => (
          <Card key={post.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    {getStatusBadge(post.status)}
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDateTime(post.scheduledTime)}
                    </span>
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                      {post.tone}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {post.content}
                  </p>
                </div>
                {post.status === 'scheduled' && (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPost(post.id)}
                    >
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {currentPosts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                {selectedTab === 'scheduled'
                  ? '予約されている投稿がありません'
                  : '投稿履歴がありません'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

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
                これはデモデータです。実際の投稿スケジュール機能を使用するには、X
                APIと連携してください。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
