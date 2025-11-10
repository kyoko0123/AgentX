# AgentX クイックスタートガイド

最短3分でVercelにデプロイする方法

---

## 前提条件

以下を事前に準備してください：

- [ ] GitHubアカウント
- [ ] Vercelアカウント（GitHubで連携可能）
- [ ] X Developer アカウント（OAuth 2.0アプリ作成済み）
- [ ] Anthropic API Key

---

## 3分デプロイ手順

### 1. GitHubにプッシュ（30秒）

```bash
cd /Users/kyoko/Desktop/dev/AgentX/app
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/agentx.git
git push -u origin main
```

### 2. Vercelにインポート（30秒）

1. https://vercel.com/new にアクセス
2. GitHubリポジトリを選択
3. "Import" をクリック
4. **まだデプロイしない**

### 3. 環境変数を設定（1分30秒）

Vercelプロジェクト設定で以下を追加：

```bash
# データベース（後で設定）
DATABASE_URL="dummy"
DIRECT_URL="dummy"

# 認証
NEXTAUTH_URL="https://your-project.vercel.app"
NEXTAUTH_SECRET="生成したランダムキー"

# X API
TWITTER_CLIENT_ID="X Developer Portalから取得"
TWITTER_CLIENT_SECRET="X Developer Portalから取得"

# Claude API
ANTHROPIC_API_KEY="sk-ant-xxxxx"

# 暗号化
ENCRYPTION_KEY="生成した64文字16進数キー"
```

**秘密鍵の生成**:

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Vercel Postgresを追加（30秒）

1. Vercelプロジェクトで "Storage" → "Create Database"
2. "Postgres" を選択
3. 名前を入力して "Create"
4. 環境変数を更新：
   - `DATABASE_URL` → `${POSTGRES_PRISMA_URL}`
   - `DIRECT_URL` → `${POSTGRES_URL_NON_POOLING}`

### 5. デプロイ（30秒）

1. "Deploy" をクリック
2. ビルドログを確認

### 6. マイグレーション実行（1分）

```bash
# ローカルで実行
npm install -g vercel
vercel login
vercel link

# 本番環境変数を取得
vercel env pull .env.production

# マイグレーション
npx dotenv -e .env.production -- npx prisma migrate deploy
```

### 7. 再デプロイ（30秒）

```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

### 8. 動作確認（30秒）

```bash
# ヘルスチェック
curl https://your-project.vercel.app/api/health

# ブラウザでアクセス
open https://your-project.vercel.app
```

---

## 完了！

アプリケーションが本番環境で動作しています。

---

## 次のステップ

### X OAuth Callback URLを更新

1. X Developer Portal にアクセス
2. アプリ設定を開く
3. Callback URL を更新:
   ```
   https://your-project.vercel.app/api/auth/callback/twitter
   ```
4. Website URL を更新:
   ```
   https://your-project.vercel.app
   ```

### 初回セットアップ確認

- [ ] ログイン機能をテスト
- [ ] X OAuth認証フローを確認
- [ ] プロフィール設定を確認
- [ ] 投稿収集機能をテスト
- [ ] AI生成機能をテスト

---

## トラブルシューティング

### デプロイが失敗する

**ビルドエラー**:
```bash
# ローカルでビルドテスト
npm run build
```

**環境変数エラー**:
- すべての必須環境変数が設定されているか確認

### ログインできない

**X OAuth エラー**:
- Callback URLが正しいか確認
- Client IDとSecretが正しいか確認

**NextAuth エラー**:
- `NEXTAUTH_URL` が正しいURLか確認
- `NEXTAUTH_SECRET` が設定されているか確認

### データベース接続エラー

```bash
# マイグレーションが完了しているか確認
npx dotenv -e .env.production -- npx prisma migrate status

# 再実行
npx dotenv -e .env.production -- npx prisma migrate deploy
```

---

## ワンクリックデプロイ（オプション）

以下のボタンでデプロイ可能にすることもできます：

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/agentx)
```

### vercel.json 設定

プロジェクトルートに `vercel.json` を作成：

```json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs",
  "env": {
    "DATABASE_URL": {
      "description": "PostgreSQL connection URL (pooled)",
      "required": true
    },
    "DIRECT_URL": {
      "description": "PostgreSQL connection URL (direct, for migrations)",
      "required": true
    },
    "NEXTAUTH_URL": {
      "description": "Application URL",
      "value": "https://your-project.vercel.app"
    },
    "NEXTAUTH_SECRET": {
      "description": "NextAuth.js secret (generate with: openssl rand -base64 32)",
      "required": true
    },
    "TWITTER_CLIENT_ID": {
      "description": "X OAuth 2.0 Client ID",
      "required": true
    },
    "TWITTER_CLIENT_SECRET": {
      "description": "X OAuth 2.0 Client Secret",
      "required": true
    },
    "ANTHROPIC_API_KEY": {
      "description": "Anthropic Claude API Key",
      "required": true
    },
    "ENCRYPTION_KEY": {
      "description": "Encryption key for tokens (64 hex characters)",
      "required": true
    }
  }
}
```

---

## チェックリスト

デプロイ前の最終確認：

### 必須設定

- [ ] GitHub リポジトリ作成
- [ ] Vercel プロジェクト作成
- [ ] Vercel Postgres 作成
- [ ] 環境変数すべて設定
- [ ] Prismaマイグレーション実行
- [ ] X OAuth Callback URL更新

### セキュリティ

- [ ] `.env` ファイルをコミットしていない
- [ ] すべての秘密鍵がランダム生成
- [ ] データベース接続がSSL有効

### 動作確認

- [ ] アプリにアクセス可能
- [ ] ログイン・ログアウト動作
- [ ] X認証フロー完了
- [ ] 基本機能動作確認

---

## さらに詳しく

より詳細な情報は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

- 環境変数の詳細説明
- トラブルシューティング
- セキュリティベストプラクティス
- 本番環境チェックリスト
- CI/CD設定

---

**準備完了です！AgentXをお楽しみください。**
