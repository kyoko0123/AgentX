/**
 * Profile Settings Page
 * プロフィール設定ページ
 */

'use client';

import { useSession } from '@/lib/auth/use-session';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface UserProfile {
  expertise: string[];
  interests: string[];
  defaultTone: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [expertiseInput, setExpertiseInput] = useState('');
  const [interestsInput, setInterestsInput] = useState('');
  const [defaultTone, setDefaultTone] = useState('professional');

  const toneOptions = [
    { value: 'professional', label: 'プロフェッショナル' },
    { value: 'casual', label: 'カジュアル' },
    { value: 'humorous', label: 'ユーモラス' },
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user/profile');
      if (!response.ok) {
        throw new Error('プロフィールの読み込みに失敗しました');
      }

      const data = await response.json();
      if (data.profile) {
        setExpertiseInput(data.profile.expertise?.join(', ') || '');
        setInterestsInput(data.profile.interests?.join(', ') || '');
        setDefaultTone(data.profile.defaultTone || 'professional');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      // カンマ区切りから配列に変換
      const expertise = expertiseInput
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const interests = interestsInput
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expertise,
          interests,
          defaultTone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'プロフィールの保存に失敗しました');
      }

      setSuccessMessage('プロフィールが正常に更新されました！');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          プロフィール設定
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          プロフィールをカスタマイズして、より良いAI生成投稿を取得
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* User info */}
        <Card>
          <CardHeader>
            <CardTitle>アカウント情報</CardTitle>
            <CardDescription>基本的なアカウント詳細</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                名前
              </label>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                {session?.user?.name || '未設定'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                メール
              </label>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                {session?.user?.email || '未設定'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>コンテンツ設定</CardTitle>
            <CardDescription>
              AIにあなたのスタイルと興味を理解させる
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="expertise"
              label="専門分野"
              placeholder="例: AI、機械学習、Web開発"
              value={expertiseInput}
              onChange={(e) => setExpertiseInput(e.target.value)}
              helperText="専門分野をカンマ区切りで入力してください"
            />

            <Input
              id="interests"
              label="興味"
              placeholder="例: テクノロジー、ビジネス、デザイン"
              value={interestsInput}
              onChange={(e) => setInterestsInput(e.target.value)}
              helperText="興味をカンマ区切りで入力してください"
            />

            <Select
              id="defaultTone"
              label="デフォルトトーン"
              options={toneOptions}
              value={defaultTone}
              onChange={(e) => setDefaultTone(e.target.value)}
              helperText="生成される投稿のデフォルトトーン"
            />
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              isLoading={isSaving}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '変更を保存'}
            </Button>
          </CardFooter>
        </Card>

        {/* Messages */}
        {error && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  エラー
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div
            className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
            role="status"
          >
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800 dark:text-green-400">
                  成功
                </h3>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Tips */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>プロフィールのヒント</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                専門分野を追加すると、AIがより関連性の高い情報豊富なコンテンツを生成します
              </span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                興味をリストアップすると、あなたの情熱に沿った投稿の提案が得られます
              </span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                デフォルトトーンを設定して、すべての投稿でブランドボイスを統一
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
