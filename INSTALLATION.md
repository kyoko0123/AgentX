# AgentX インストール手順

NextAuth.js認証システムを含む AgentX のセットアップ手順です。

## 前提条件

- Node.js 18.x 以上
- PostgreSQL 14.x 以上
- npm または yarn

## 1. 依存パッケージのインストール

```bash
# 基本パッケージ（すでにインストール済み）
npm install

# NextAuth.js Prisma Adapter のインストール
npm install @next-auth/prisma-adapter
```

## 2. 環境変数の設定

`.env.local` ファイルをプロジェクトルートに作成：

```bash
cp .env.example .env.local
```

以下の環境変数を設定：

### 必須の環境変数

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/agentx"
DIRECT_URL="postgresql://user:password@localhost:5432/agentx"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<生成したシークレット>"

# X (Twitter) OAuth 2.0
TWITTER_CLIENT_ID="<あなたのTwitter Client ID>"
TWITTER_CLIENT_SECRET="<あなたのTwitter Client Secret>"

# Encryption Key
ENCRYPTION_KEY="<生成した64文字のHEXキー>"

# Claude API
ANTHROPIC_API_KEY="<あなたのAnthropic API Key>"
```

### シークレットの生成

```bash
# NEXTAUTH_SECRET の生成
openssl rand -base64 32

# ENCRYPTION_KEY の生成（64文字のHEX）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Twitter Developer Portal でのOAuth設定

1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) にアクセス
2. 新しいプロジェクトとアプリを作成
3. **User authentication settings** を編集：
   - **OAuth 2.0** を有効化
   - **Type of App**: Web App, Automated App or Bot
   - **App permissions**: Read and write
   - **Callback URI**: `http://localhost:3000/api/auth/callback/twitter`
   - **Website URL**: `http://localhost:3000`
4. **Keys and tokens** タブで以下を取得：
   - **Client ID**
   - **Client Secret**
5. これらを `.env.local` に設定

## 4. データベースのセットアップ

```bash
# Prismaマイグレーションの実行
npx prisma migrate dev

# Prisma Clientの生成
npx prisma generate

# データベースのシード（オプション）
# npx prisma db seed
```

## 5. 開発サーバーの起動

```bash
npm run dev
```

サーバーが起動したら、[http://localhost:3000](http://localhost:3000) にアクセスしてください。

## 6. 認証のテスト

1. [http://localhost:3000/login](http://localhost:3000/login) にアクセス
2. "Sign in with X" ボタンをクリック
3. Twitter の認証画面で権限を承認
4. ダッシュボードにリダイレクトされることを確認

## トラブルシューティング

### データベース接続エラー

```
Error: Can't reach database server
```

**解決方法:**
- PostgreSQL サーバーが起動していることを確認
- DATABASE_URL が正しいことを確認
- データベースが存在することを確認

```bash
# データベースの作成
psql -U postgres
CREATE DATABASE agentx;
```

### Twitter OAuth エラー

```
Error: invalid_client
```

**解決方法:**
- Client ID と Client Secret が正しいか確認
- Callback URL が `http://localhost:3000/api/auth/callback/twitter` に設定されているか確認
- OAuth 2.0 が有効化されているか確認

### 暗号化キーエラー

```
Error: ENCRYPTION_KEY must be 64 characters
```

**解決方法:**
- ENCRYPTION_KEY が正確に64文字のHEX文字列であることを確認
- 再生成する場合：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Prisma エラー

```
Error: @prisma/client did not initialize yet
```

**解決方法:**

```bash
npx prisma generate
```

## 本番環境へのデプロイ

### Vercel へのデプロイ

1. Vercel にプロジェクトをインポート
2. 環境変数を設定：
   - すべての `.env.local` の内容を追加
   - `NEXTAUTH_URL` を本番URLに変更（例: `https://your-app.vercel.app`）
3. Twitter Developer Portal で本番URLのCallback URIを追加：
   - `https://your-app.vercel.app/api/auth/callback/twitter`
4. デプロイを実行

### 環境変数の確認

デプロイ前に以下を確認：
- [ ] DATABASE_URL (Vercel Postgres 等)
- [ ] DIRECT_URL
- [ ] NEXTAUTH_URL (本番URL)
- [ ] NEXTAUTH_SECRET
- [ ] TWITTER_CLIENT_ID
- [ ] TWITTER_CLIENT_SECRET
- [ ] ENCRYPTION_KEY
- [ ] ANTHROPIC_API_KEY

## 次のステップ

認証システムのセットアップが完了したら：

1. ダッシュボードページの実装
2. X API 統合（投稿収集・投稿機能）
3. Claude AI 統合（投稿生成機能）
4. スケジューリング機能の実装

詳細は `AUTH_SETUP.md` を参照してください。

## サポート

問題が発生した場合は、以下を確認してください：

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Twitter API Documentation](https://developer.twitter.com/en/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- プロジェクトの `AUTH_SETUP.md`
