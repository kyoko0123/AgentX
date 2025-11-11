# AgentX - すぐにデプロイする手順

## 🚀 Vercelダッシュボードでデプロイ（推奨）

### ステップ1: GitHubにプッシュ（2分）

```bash
# 1. GitHubで新しいリポジトリを作成
# https://github.com/new

# 2. リモートリポジトリを追加
cd /Users/kyoko/Desktop/dev/AgentX/app
git remote add origin <your-github-repo-url>

# 3. プッシュ
git push -u origin main
```

### ステップ2: Vercelにインポート（1分）

1. https://vercel.com/new にアクセス
2. 「Import Git Repository」をクリック
3. GitHubリポジトリを選択
4. プロジェクト名: `agentx` (または任意の名前)
5. Framework Preset: `Next.js` (自動検出)
6. 「Deploy」ボタンは**まだクリックしない**

### ステップ3: 環境変数を設定（3分）

Vercelダッシュボードで以下の環境変数を設定：

#### 必須環境変数

1. **Database (Vercel Postgres)**
   - Vercelダッシュボードで「Storage」→「Create」→「Postgres」
   - 自動的に`DATABASE_URL`と`DIRECT_URL`が設定されます

2. **NextAuth.js**
   ```bash
   NEXTAUTH_URL=https://your-project.vercel.app
   NEXTAUTH_SECRET=<openssl rand -base64 32で生成>
   ```

3. **X (Twitter) API**
   ```bash
   TWITTER_CLIENT_ID=<X Developer Portalから取得>
   TWITTER_CLIENT_SECRET=<X Developer Portalから取得>
   X_BEARER_TOKEN=<X Developer Portalから取得>
   ```

4. **Claude API**
   ```bash
   ANTHROPIC_API_KEY=<Anthropic Consoleから取得>
   ```

5. **暗号化キー**
   ```bash
   ENCRYPTION_KEY=<node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"で生成>
   ```

### ステップ4: 初回デプロイ（30秒）

1. 「Deploy」ボタンをクリック
2. デプロイ完了を待つ（約1-2分）

### ステップ5: Prismaマイグレーション（1分）

デプロイ完了後、Vercelダッシュボードで：

1. プロジェクトページ → 「Settings」→「Environment Variables」で`DATABASE_URL`を確認
2. ローカルで実行：

```bash
# DATABASE_URLを一時的にコピー
export DATABASE_URL="<Vercel PostgresのURL>"

# マイグレーション実行
npx prisma migrate deploy

# または、Vercel上で実行（推奨）
# Vercel CLI経由:
vercel env pull .env.production
npx prisma migrate deploy
```

### ステップ6: 再デプロイ（30秒）

1. Vercelダッシュボードで「Deployments」タブ
2. 「Redeploy」ボタンをクリック

### ステップ7: X OAuth Callback URL更新（1分）

1. https://developer.x.com/en/portal にアクセス
2. あなたのアプリを選択
3. 「OAuth 2.0 Settings」で以下を追加：
   ```
   https://your-project.vercel.app/api/auth/callback/twitter
   ```

### ステップ8: 動作確認（1分）

1. `https://your-project.vercel.app` にアクセス
2. 「ログイン」をクリック
3. X認証でログイン
4. ダッシュボードが表示されることを確認

---

## 🎉 デプロイ完了！

これでAgentXが本番環境で動作しています！

次のステップ：
- カスタムドメインの設定（オプション）
- Vercel Analyticsの有効化
- エラーモニタリング設定

---

## トラブルシューティング

### ビルドエラーが発生した場合
- 環境変数が正しく設定されているか確認
- `NEXTAUTH_URL`がデプロイ後のURLになっているか確認

### データベース接続エラー
- Vercel Postgresが正しく作成されているか確認
- マイグレーションが実行されているか確認

### 認証エラー
- X OAuth Callback URLが正しいか確認
- `NEXTAUTH_SECRET`が設定されているか確認

詳細は`DEPLOYMENT.md`を参照してください。
