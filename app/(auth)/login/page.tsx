/**
 * ログインページ
 * X (Twitter) OAuth 認証のエントリーポイント
 */

'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSignIn = () => {
    setLoading(true);
    signIn('twitter', { callbackUrl });
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const response = await fetch('/api/auth/demo', {
        method: 'POST',
      });

      if (response.ok) {
        router.push(callbackUrl);
      } else {
        alert('デモログインに失敗しました');
        setDemoLoading(false);
      }
    } catch (err) {
      console.error('Demo login error:', err);
      alert('デモログインに失敗しました');
      setDemoLoading(false);
    }
  };

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-md w-full px-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* ロゴ・タイトル */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">AgentX</h1>
            <p className="text-slate-600">
              AI-Powered X Post Management
            </p>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                {error === 'SessionExpired'
                  ? 'セッションの有効期限が切れました。再度ログインしてください。'
                  : '認証中にエラーが発生しました。もう一度お試しください。'}
              </p>
            </div>
          )}

          {/* サインインボタン */}
          {isDemoMode ? (
            <>
              {/* デモモードボタン */}
              <button
                onClick={handleDemoLogin}
                disabled={demoLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              >
                {demoLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    ログイン中...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    デモモードでログイン（API Key不要）
                  </>
                )}
              </button>

              {/* X認証ボタン（デモモード時は無効） */}
              <button
                disabled
                className="w-full bg-slate-300 text-slate-500 font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-3 cursor-not-allowed"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Sign in with X（OAuth 2.0設定が必要）
              </button>

              {/* デモモード説明 */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>デモモード:</strong> API Keyなしでアプリのデザインと機能を確認できます。実際の投稿収集・AI生成は動作しません。
                </p>
              </div>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-black hover:bg-slate-800 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  認証中...
                </>
              ) : (
                <>
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Sign in with X
                </>
              )}
            </button>
          )}

          {/* 説明 */}
          <div className="mt-8 space-y-4">
            <div className="text-center text-sm text-slate-600">
              <p className="font-medium mb-3">AgentX でできること</p>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>トレンド分析と高エンゲージメント投稿の収集</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>AI による投稿の自動生成とパーソナライズ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>投稿のスケジューリングと自動投稿</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>パフォーマンス分析とインサイト取得</span>
              </li>
            </ul>
          </div>

          {/* プライバシーノート */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              サインインすることで、
              <a href="#" className="underline hover:text-slate-700">
                利用規約
              </a>
              と
              <a href="#" className="underline hover:text-slate-700">
                プライバシーポリシー
              </a>
              に同意したものとみなされます。
            </p>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center text-sm text-slate-400">
          <p>Powered by Claude AI & X API</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
