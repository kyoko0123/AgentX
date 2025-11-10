# AgentX 認証システム セットアップガイド

このドキュメントでは、AgentX の NextAuth.js 認証システムのセットアップ方法と使用方法について説明します。

## 実装済みファイル

### 1. コア認証ファイル

#### `/lib/crypto.ts`
トークンの暗号化/復号化ユーティリティ
- AES-256-GCM アルゴリズムによる暗号化
- X OAuth トークンを安全に保存

#### `/lib/prisma.ts`
Prisma Client のシングルトンインスタンス

#### `/lib/auth/config.ts`
NextAuth.js の設定ファイル
- X (Twitter) OAuth 2.0 Provider 設定
- JWT コールバック（トークン管理）
- セッション コールバック
- トークン自動リフレッシュロジック

#### `/lib/auth/session.ts`
Server Components 用のセッション取得ユーティリティ
- `getSession()` - セッション取得
- `getAuthSession()` - 認証必須のセッション取得
- `getCurrentUserId()` - ユーザーID取得
- `getRequiredUserId()` - 認証必須のユーザーID取得

#### `/middleware.ts`
ルート保護ミドルウェア
- `/dashboard/*` ルートの保護
- `/api/*` の認証チェック
- セキュリティヘッダーの追加

#### `/types/next-auth.d.ts`
NextAuth.js の型定義拡張

### 2. API Routes

#### `/app/api/auth/[...nextauth]/route.ts`
NextAuth.js の API ハンドラー

### 3. UI コンポーネント

#### `/app/providers.tsx`
クライアントサイド SessionProvider

#### `/app/(auth)/login/page.tsx`
ログインページ UI

## セットアップ手順

### 1. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定します：

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/agentx"
DIRECT_URL="postgresql://user:password@localhost:5432/agentx"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generated-secret"

# X (Twitter) OAuth 2.0
TWITTER_CLIENT_ID="your-twitter-client-id"
TWITTER_CLIENT_SECRET="your-twitter-client-secret"

# Encryption Key (64文字のHEX)
ENCRYPTION_KEY="generated-64-char-hex"
```

### 2. 暗号化キーとシークレットの生成

```bash
# NEXTAUTH_SECRET の生成
openssl rand -base64 32

# ENCRYPTION_KEY の生成（64文字のHEX）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. X (Twitter) OAuth アプリの設定

1. [Twitter Developer Portal](https://developer.twitter.com/en/portal) にアクセス
2. 新しいアプリを作成
3. OAuth 2.0 を有効化
4. 以下の設定を行う：
   - **Type of App**: Web App
   - **Callback URLs**: `http://localhost:3000/api/auth/callback/twitter`
   - **Website URL**: `http://localhost:3000`
   - **Permissions**: Read and write
5. Client ID と Client Secret を `.env.local` に設定

### 4. データベースのマイグレーション

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. 必要なパッケージのインストール

```bash
npm install @next-auth/prisma-adapter
```

## 使用方法

### Server Components でのセッション取得

```typescript
import { getAuthSession, getRequiredUserId } from '@/lib/auth/session';

export default async function DashboardPage() {
  const session = await getAuthSession();
  const userId = await getRequiredUserId();

  return <div>Hello, {session.user.name}!</div>;
}
```

### Client Components でのセッション取得

```typescript
'use client';

import { useSession } from 'next-auth/react';

export default function UserProfile() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'unauthenticated') return <div>Please sign in</div>;

  return <div>Hello, {session.user.name}!</div>;
}
```

### ログイン・ログアウト

```typescript
'use client';

import { signIn, signOut } from 'next-auth/react';

// ログイン
<button onClick={() => signIn('twitter')}>
  Sign in with X
</button>

// ログアウト
<button onClick={() => signOut()}>
  Sign out
</button>
```

### API Routes での認証チェック

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 認証済みの処理
  return NextResponse.json({ data: 'Protected data' });
}
```

### X API トークンの取得

```typescript
import { getDecryptedTokens } from '@/lib/auth/config';

const tokens = await getDecryptedTokens(userId);
const { accessToken, refreshToken } = tokens;

// X API にリクエスト
const response = await fetch('https://api.twitter.com/2/tweets', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

## 認証フロー

### 1. 初回サインイン

1. ユーザーが「Sign in with X」をクリック
2. X 認証ページへリダイレクト
3. ユーザーが権限を承認
4. コールバックで認証コードを受け取り
5. アクセストークンとリフレッシュトークンを取得
6. トークンを暗号化して `XAccount` テーブルに保存
7. JWT セッションを作成
8. ダッシュボードにリダイレクト

### 2. トークンリフレッシュ

- JWT コールバックで自動的にトークンの有効期限をチェック
- 期限切れの場合、リフレッシュトークンを使用して新しいアクセストークンを取得
- 新しいトークンを暗号化して保存
- リフレッシュ失敗時はセッションエラーとして処理

## セキュリティ機能

### 1. トークン暗号化
- AES-256-GCM による暗号化
- 16バイトのランダム IV
- 認証タグによる改ざん検知

### 2. ルート保護
- Middleware による自動認証チェック
- 未認証時は自動的にログインページへリダイレクト
- API ルートは 401 を返す

### 3. セキュリティヘッダー
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy（本番環境）

## トラブルシューティング

### ENCRYPTION_KEY エラー
```
Error: ENCRYPTION_KEY must be 64 characters
```
→ 64文字のHEX文字列を生成して設定してください

### Twitter OAuth エラー
```
Error: invalid_client
```
→ Client ID と Client Secret が正しいか確認してください

### セッション期限切れ
- セッションは30日間有効
- トークンは自動的にリフレッシュされます
- リフレッシュ失敗時は再ログインが必要

## 次のステップ

1. ダッシュボードページの作成 (`/app/dashboard/page.tsx`)
2. ユーザープロフィール編集機能の実装
3. X API 統合（投稿収集・投稿機能）
4. Claude API 統合（投稿生成機能）

## 参考ドキュメント

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [X API v2 OAuth 2.0](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Prisma Documentation](https://www.prisma.io/docs)
