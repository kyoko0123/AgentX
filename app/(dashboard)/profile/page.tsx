/**
 * Profile Settings Page
 * プロフィール設定ページ
 */

'use client';

import { useSession } from 'next-auth/react';
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
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'humorous', label: 'Humorous' },
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
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      if (data.profile) {
        setExpertiseInput(data.profile.expertise?.join(', ') || '');
        setInterestsInput(data.profile.interests?.join(', ') || '');
        setDefaultTone(data.profile.defaultTone || 'professional');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
        throw new Error(errorData.error || 'Failed to save profile');
      }

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
          Profile Settings
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Customize your profile to get better AI-generated posts
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* User info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Name
              </label>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                {session?.user?.name || 'Not set'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Email
              </label>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                {session?.user?.email || 'Not set'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Content Preferences</CardTitle>
            <CardDescription>
              Help AI understand your style and interests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="expertise"
              label="Expertise"
              placeholder="e.g., AI, Machine Learning, Web Development"
              value={expertiseInput}
              onChange={(e) => setExpertiseInput(e.target.value)}
              helperText="Enter your areas of expertise, separated by commas"
            />

            <Input
              id="interests"
              label="Interests"
              placeholder="e.g., Technology, Business, Design"
              value={interestsInput}
              onChange={(e) => setInterestsInput(e.target.value)}
              helperText="Enter your interests, separated by commas"
            />

            <Select
              id="defaultTone"
              label="Default Tone"
              options={toneOptions}
              value={defaultTone}
              onChange={(e) => setDefaultTone(e.target.value)}
              helperText="The default tone for your generated posts"
            />
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              isLoading={isSaving}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
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
                  Error
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
                  Success
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
          <CardTitle>Profile Tips</CardTitle>
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
                Add your expertise to help AI generate more relevant and
                informed content
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
                List your interests to get post suggestions aligned with your
                passions
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
                Set a default tone to match your brand voice across all posts
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
