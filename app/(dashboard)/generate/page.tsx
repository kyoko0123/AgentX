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
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'humorous', label: 'Humorous' },
  ];

  const lengthOptions = [
    { value: 'short', label: 'Short (50-100 chars)' },
    { value: 'medium', label: 'Medium (100-200 chars)' },
    { value: 'long', label: 'Long (200-280 chars)' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      setError('Please enter a topic');
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
        throw new Error(errorData.error || 'Failed to generate post');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
      alert('Copied to clipboard!');
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
          Generate Post
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Create AI-powered X posts tailored to your needs
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input form */}
        <Card>
          <CardHeader>
            <CardTitle>Post Settings</CardTitle>
            <CardDescription>
              Configure your post parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <Input
                id="topic"
                label="Topic"
                placeholder="Enter your post topic..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                disabled={isGenerating}
                helperText="What do you want to post about?"
              />

              <Select
                id="tone"
                label="Tone"
                options={toneOptions}
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                disabled={isGenerating}
                helperText="Choose the tone of your post"
              />

              <Select
                id="length"
                label="Length"
                options={lengthOptions}
                value={length}
                onChange={(e) => setLength(e.target.value)}
                disabled={isGenerating}
                helperText="Select the desired length"
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
                  {isGenerating ? 'Generating...' : 'Generate Post'}
                </Button>
                {result && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={isGenerating}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Result display */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Post</CardTitle>
            <CardDescription>
              Your AI-generated content appears here
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
                      {result.content.length} chars
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
                    Copy
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
                    Regenerate
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
                    Enter a topic and click Generate
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
          <CardTitle>Tips for Better Results</CardTitle>
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
              <span>Be specific with your topic for more targeted content</span>
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
                Choose a tone that matches your brand or personal style
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
              <span>Use regenerate if the first result does not match your needs</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
