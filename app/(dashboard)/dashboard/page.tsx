/**
 * Dashboard Home Page
 * ダッシュボードホームページ
 */

'use client';

import { useSession } from '@/lib/auth/use-session';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Draft {
  id: string;
  topic: string;
  content: string;
  tone: string;
  createdAt: string;
}

interface Stats {
  totalDrafts: number;
  draftsThisWeek: number;
  draftsThisMonth: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 最近の下書きを取得
      const draftsResponse = await fetch('/api/generation/drafts?limit=5');
      if (!draftsResponse.ok) {
        throw new Error('Failed to load drafts');
      }
      const draftsData = await draftsResponse.json();
      setDrafts(draftsData.drafts || []);

      // 統計データを計算
      const allDraftsResponse = await fetch('/api/generation/drafts');
      if (allDraftsResponse.ok) {
        const allDraftsData = await allDraftsResponse.json();
        const allDrafts = allDraftsData.drafts || [];

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const draftsThisWeek = allDrafts.filter(
          (d: Draft) => new Date(d.createdAt) >= weekAgo
        ).length;
        const draftsThisMonth = allDrafts.filter(
          (d: Draft) => new Date(d.createdAt) >= monthAgo
        ).length;

        setStats({
          totalDrafts: allDrafts.length,
          draftsThisWeek,
          draftsThisMonth,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Welcome back, {session?.user?.name || 'User'}!
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Here is your X post generation dashboard
        </p>
      </div>

      {/* Quick actions */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <CardHeader>
            <CardTitle>Generate New Post</CardTitle>
            <CardDescription>
              Create AI-powered X posts based on your topic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/generate">
              <Button className="w-full">Start Generating</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
          <CardHeader>
            <CardTitle>Update Profile</CardTitle>
            <CardDescription>
              Customize your expertise and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/profile">
              <Button variant="secondary" className="w-full">
                Edit Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Total Posts
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {stats.totalDrafts}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  This Week
                </p>
                <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.draftsThisWeek}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  This Month
                </p>
                <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.draftsThisMonth}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent drafts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Drafts</CardTitle>
          <CardDescription>Your latest generated posts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-center dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDashboardData}
                className="mt-3"
              >
                Retry
              </Button>
            </div>
          ) : drafts.length === 0 ? (
            <div className="rounded-lg bg-zinc-50 p-8 text-center dark:bg-zinc-800/50">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                No drafts yet. Start generating your first post!
              </p>
              <Link href="/generate">
                <Button className="mt-4">Generate Post</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
                >
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                        {draft.topic}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {draft.content.substring(0, 100)}
                        {draft.content.length > 100 ? '...' : ''}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {draft.tone}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    {formatDate(draft.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
