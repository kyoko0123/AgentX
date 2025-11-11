/**
 * AI Post Generation Page
 * AI投稿生成ページ
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';

interface GenerationResult {
  id: string;
  content: string;
  topic: string;
  tone: string;
  length: string;
}

export default function GeneratePage() {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toneOptions = [
    { value: 'professional', label: 'プロフェッショナル' },
    { value: 'casual', label: 'カジュアル' },
    { value: 'humorous', label: 'ユーモラス' },
  ];

  const lengthOptions = [
    { value: 'short', label: '短い (50-100文字)' },
    { value: 'medium', label: '普通 (100-200文字)' },
    { value: 'long', label: '長い (200-280文字)' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      setError('トピックを入力してください');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch('/api/generation/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          tone,
          length,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '投稿の生成に失敗しました');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setResult(null);
    handleGenerate(new Event('submit') as any);
  };

  const handleCopy = async () => {
    if (result?.content) {
      await navigator.clipboard.writeText(result.content);
      alert('クリップボードにコピーしました！');
    }
  };

  const handleReset = () => {
    setResult(null);
    setTopic('');
    setTone('professional');
    setLength('medium');
    setError(null);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          投稿生成
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          AIを使ってX投稿を自動生成します
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input form */}
        <Card>
          <CardHeader>
            <CardTitle>投稿設定</CardTitle>
            <CardDescription>
              投稿のパラメータを設定してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <Input
                id="topic"
                label="トピック"
                placeholder="投稿のトピックを入力してください..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                disabled={isGenerating}
                helperText="何について投稿しますか？"
              />

              <Select
                id="tone"
                label="トーン"
                options={toneOptions}
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                disabled={isGenerating}
                helperText="投稿のトーンを選択してください"
              />

              <Select
                id="length"
                label="長さ"
                options={lengthOptions}
                value={length}
                onChange={(e) => setLength(e.target.value)}
                disabled={isGenerating}
                helperText="希望する長さを選択してください"
              />

              {error && (
                <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={isGenerating}
                  disabled={isGenerating}
                >
                  {isGenerating ? '生成中...' : '投稿を生成'}
                </Button>
                {result && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={isGenerating}
                  >
                    リセット
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Result display */}
        <Card>
          <CardHeader>
            <CardTitle>生成された投稿</CardTitle>
            <CardDescription>
              AIが生成したコンテンツがここに表示されます
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <p className="whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
                    {result.content}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {result.tone}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                      {result.length}
                    </span>
                    <span className="ml-auto">
                      {result.content.length} 文字
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    variant="secondary"
                    className="flex-1"
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
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    コピー
                  </Button>
                  <Button
                    onClick={handleRegenerate}
                    variant="outline"
                    className="flex-1"
                    isLoading={isGenerating}
                    disabled={isGenerating}
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
                    再生成
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700">
                <div className="text-center">
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
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    トピックを入力して「生成」をクリック
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>より良い結果を得るためのヒント</CardTitle>
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
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>トピックは具体的に指定すると、より的確なコンテンツが生成されます</span>
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                ブランドや個人のスタイルに合わせてトーンを選択してください
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
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>最初の結果が気に入らない場合は、再生成を使用してください</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
