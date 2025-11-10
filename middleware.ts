/**
 * Next.js Middleware
 * 認証チェックとルート保護を実装
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * 保護されたルートのパス
 */
const protectedPaths = [
  '/dashboard',
  '/api/user',
  '/api/posts',
  '/api/analysis',
  '/api/generation',
  '/api/scheduling',
  '/api/performance',
];

/**
 * 公開ルートのパス（認証不要）
 */
const publicPaths = [
  '/',
  '/login',
  '/api/auth',
  '/api/health',
];

/**
 * パスが保護されているかチェック
 */
function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some(path => pathname.startsWith(path));
}

/**
 * パスが公開されているかチェック
 */
function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => pathname.startsWith(path));
}

/**
 * Middleware メイン関数
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公開パスの場合は認証チェックをスキップ
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 保護されたパスの場合は認証チェック
  if (isProtectedPath(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // 認証されていない場合
    if (!token) {
      // API ルートの場合は 401 を返す
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          },
          { status: 401 }
        );
      }

      // ページの場合はログインページにリダイレクト
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // トークンエラーがある場合（リフレッシュ失敗など）
    if (token.error === 'RefreshAccessTokenError') {
      // 再ログインを促すためログインページにリダイレクト
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'SessionExpired');
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // セキュリティヘッダーを追加
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CSP ヘッダー（開発環境では緩和）
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.twitter.com https://api.anthropic.com;"
    );
  }

  return response;
}

/**
 * Middleware を実行するパスの設定
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
