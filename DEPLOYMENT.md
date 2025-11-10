# AgentX Vercel デプロイガイド

AgentX MVPをVercelにデプロイするための包括的なガイドです。

## 目次

- [前提条件](#前提条件)
- [デプロイ手順](#デプロイ手順)
- [環境変数の設定](#環境変数の設定)
- [データベースセットアップ](#データベースセットアップ)
- [トラブルシューティング](#トラブルシューティング)
- [本番環境チェックリスト](#本番環境チェックリスト)

---

## 前提条件

### 必要なアカウント

1. **GitHub アカウント**
   - コードをホストするために必要
   - https://github.com で無料登録

2. **Vercel アカウント**
   - アプリケーションをデプロイするために必要
   - https://vercel.com で無料登録（GitHubアカウントで連携可能）

3. **X (Twitter) Developer アカウント**
   - X API v2へのアクセスに必要
   - https://developer.twitter.com で申請
   - OAuth 2.0アプリケーションの作成が必要

4. **Anthropic アカウント**
   - Claude API利用のために必要
   - https://console.anthropic.com で登録
   - API Keyの発行が必要

### 必要なAPI Key・認証情報

以下の情報を事前に取得しておいてください：

- ✅ X API OAuth 2.0 クライアントID・シークレット
- ✅ Anthropic API Key
- ✅ PostgreSQLデータベース（Vercel Postgres推奨）

---

## デプロイ手順

### ステップ1: GitHubリポジトリの作成

#### 1-1. 新しいリポジトリを作成

```bash
# プロジェクトディレクトリに移動
cd /Users/kyoko/Desktop/dev/AgentX/app

# Git初期化（まだの場合）
git init

# .gitignoreが正しく設定されているか確認
cat .gitignore
```

#### 1-2. 初期コミット

```bash
# すべてのファイルをステージング
git add .

# 初回コミット
git commit -m "Initial commit: AgentX MVP"

# GitHubでリポジトリを作成してからリモートを追加
git remote add origin https://github.com/YOUR_USERNAME/agentx.git

# プッシュ
git branch -M main
git push -u origin main
```

> **注意**: `.env.local`や`.env`ファイルは絶対にコミットしないでください。`.gitignore`に含まれていることを確認してください。

---

### ステップ2: Vercelプロジェクトのインポート

#### 2-1. Vercelダッシュボードにアクセス

1. https://vercel.com/dashboard にアクセス
2. "Add New..." → "Project" をクリック

#### 2-2. GitHubリポジトリをインポート

1. "Import Git Repository" セクションでGitHubを選択
2. AgentXリポジトリを選択
3. "Import" をクリック

#### 2-3. プロジェクト設定

- **Framework Preset**: Next.js を選択（自動検出されます）
- **Root Directory**: `./` のまま
- **Build Command**: `npm run build`（デフォルト）
- **Output Directory**: `.next`（デフォルト）
- **Install Command**: `npm install`（デフォルト）

> **重要**: まだ "Deploy" をクリックしないでください。先に環境変数を設定します。

---

### ステップ3: 環境変数の設定

Vercelプロジェクト設定画面で "Environment Variables" セクションに移動し、以下をすべて設定します。

#### 3-1. データベース環境変数

```bash
# 後のステップでVercel Postgresから取得
DATABASE_URL="postgres://..."
DIRECT_URL="postgres://..."
```

#### 3-2. NextAuth.js 環境変数

```bash
# 本番環境のURL（後で更新）
NEXTAUTH_URL="https://your-project.vercel.app"

# ランダムな秘密鍵を生成して設定
# 生成方法: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret-here"
```

**NEXTAUTH_SECRETの生成方法**:
```bash
# ローカルターミナルで実行
openssl rand -base64 32
```

#### 3-3. X (Twitter) OAuth 環境変数

```bash
TWITTER_CLIENT_ID="your-twitter-client-id"
TWITTER_CLIENT_SECRET="your-twitter-client-secret"
```

**取得方法**:
1. https://developer.twitter.com/en/portal/dashboard にアクセス
2. プロジェクトとアプリを作成
3. "User authentication settings" で OAuth 2.0を有効化
4. **Type of App**: Web App
5. **Callback URLs**: `https://your-project.vercel.app/api/auth/callback/twitter`
6. **Website URL**: `https://your-project.vercel.app`
7. Client IDとClient Secretをコピー

#### 3-4. Anthropic API Key

```bash
ANTHROPIC_API_KEY="sk-ant-..."
```

**取得方法**:
1. https://console.anthropic.com にアクセス
2. "API Keys" セクションで新しいキーを作成
3. キーをコピー（再表示できないので注意）

#### 3-5. 暗号化キー

```bash
# 32バイト（64文字の16進数）のランダムキー
ENCRYPTION_KEY="your-64-character-hex-key"
```

**生成方法**:
```bash
# ローカルターミナルで実行
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 3-6. オプション: Cron Secret（スケジュール投稿用）

```bash
CRON_SECRET="your-cron-secret"
```

**生成方法**:
```bash
openssl rand -base64 32
```

---

### ステップ4: Vercel Postgresのセットアップ

#### 4-1. Vercel Postgresを追加

1. Vercelプロジェクトダッシュボードで "Storage" タブに移動
2. "Create Database" をクリック
3. "Postgres" を選択
4. データベース名を入力（例: `agentx-db`）
5. リージョンを選択（アプリと同じリージョンを推奨）
6. "Create" をクリック

#### 4-2. 環境変数の自動設定

Vercel Postgresを作成すると、以下の環境変数が自動的に設定されます：

- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- など

#### 4-3. Prisma用に環境変数をマッピング

Vercelの "Environment Variables" セクションで、以下のように設定します：

```bash
# Prismaのプール接続用
DATABASE_URL="${POSTGRES_PRISMA_URL}"

# Prismaのマイグレーション用（プールを使わない直接接続）
DIRECT_URL="${POSTGRES_URL_NON_POOLING}"
```

または、直接値をコピー:

```bash
DATABASE_URL="postgres://default:xxxxx@xxx-pooler.aws.com/verceldb?sslmode=require"
DIRECT_URL="postgres://default:xxxxx@xxx.aws.com/verceldb?sslmode=require"
```

---

### ステップ5: Prismaマイグレーションの実行

#### 5-1. 初回デプロイ

すべての環境変数を設定したら、"Deploy" をクリックしてください。

初回デプロイは失敗する可能性があります（データベースマイグレーションがまだ実行されていないため）。これは正常です。

#### 5-2. Vercel CLIでマイグレーション実行

ローカル環境から Vercel CLI を使ってマイグレーションを実行します。

```bash
# Vercel CLIのインストール（未インストールの場合）
npm install -g vercel

# Vercelにログイン
vercel login

# プロジェクトにリンク
vercel link

# 本番環境の環境変数を取得
vercel env pull .env.production

# マイグレーションを実行
# DATABASE_URLを.env.productionから読み込んで実行
npx dotenv -e .env.production -- npx prisma migrate deploy

# または、DATABASE_URLを直接指定
DATABASE_URL="your-production-database-url" npx prisma migrate deploy
```

#### 5-3. 代替方法: Vercel Build Scriptで自動実行

`package.json`の`build`スクリプトは既にPrisma生成を含んでいます：

```json
"scripts": {
  "build": "prisma generate && next build",
  "postinstall": "prisma generate"
}
```

マイグレーションも自動化したい場合（**注意: 本番では推奨されません**）：

```json
"scripts": {
  "build": "prisma migrate deploy && prisma generate && next build"
}
```

> **警告**: ビルド時の自動マイグレーションは、マイグレーション失敗時にデプロイ全体が失敗するリスクがあります。手動実行を推奨します。

---

### ステップ6: デプロイ実行

#### 6-1. 再デプロイ

マイグレーションが完了したら、Vercelダッシュボードで:

1. "Deployments" タブに移動
2. "Redeploy" をクリック
3. または、GitHubに新しいコミットをプッシュ

```bash
# 小さな変更をコミット
git commit --allow-empty -m "Trigger redeploy after migration"
git push origin main
```

#### 6-2. ビルドログを確認

デプロイ中のログを確認して、エラーがないことを確認してください。

---

### ステップ7: 動作確認

#### 7-1. アプリケーションにアクセス

デプロイが成功したら、`https://your-project.vercel.app` にアクセスします。

#### 7-2. 基本動作確認

1. **ヘルスチェック**:
   ```bash
   curl https://your-project.vercel.app/api/health
   ```

   期待されるレスポンス:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-11-11T..."
   }
   ```

2. **認証フロー**:
   - ログインページにアクセス
   - "Sign in with X" をクリック
   - X OAuth認証フローを完了
   - ダッシュボードにリダイレクトされることを確認

3. **データベース接続**:
   - ログイン後、プロフィール設定ページにアクセス
   - データが正常に表示されることを確認

#### 7-3. X API連携確認

1. ダッシュボードで "Collect Posts" 機能をテスト
2. X APIからデータが取得できることを確認

#### 7-4. Claude API連携確認

1. "Generate Post" 機能をテスト
2. AI生成が正常に動作することを確認

---

## 環境変数一覧

### 必須環境変数

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `DATABASE_URL` | PostgreSQL接続URL（プール接続） | Vercel Postgres作成時に自動生成 |
| `DIRECT_URL` | PostgreSQL接続URL（直接接続、マイグレーション用） | Vercel Postgres作成時に自動生成 |
| `NEXTAUTH_URL` | アプリケーションの公開URL | `https://your-project.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth.js セッション暗号化用秘密鍵 | `openssl rand -base64 32` |
| `TWITTER_CLIENT_ID` | X OAuth 2.0 クライアントID | X Developer Portal |
| `TWITTER_CLIENT_SECRET` | X OAuth 2.0 クライアントシークレット | X Developer Portal |
| `ANTHROPIC_API_KEY` | Claude API キー | Anthropic Console |
| `ENCRYPTION_KEY` | トークン暗号化用キー（64文字16進数） | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

### オプション環境変数

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `CRON_SECRET` | スケジュール投稿API保護用シークレット | `openssl rand -base64 32` |
| `KV_URL` | Vercel KV URL（レート制限用） | Vercel KVストレージ作成時 |
| `KV_REST_API_URL` | Vercel KV REST API URL | Vercel KVストレージ作成時 |
| `KV_REST_API_TOKEN` | Vercel KV REST API トークン | Vercel KVストレージ作成時 |

---

## トラブルシューティング

### ビルドエラー

#### エラー: "Prisma Client could not be generated"

**原因**: Prismaクライアントの生成に失敗

**解決方法**:
```bash
# package.jsonのpostinstallスクリプトを確認
"postinstall": "prisma generate"

# Vercelの"Build & Development Settings"で
# "Install Command"が "npm install" になっていることを確認
```

#### エラー: "Module not found: Can't resolve '@prisma/client'"

**原因**: Prismaクライアントが生成されていない

**解決方法**:
1. `prisma/schema.prisma` がリポジトリに含まれているか確認
2. `package.json` の `postinstall` スクリプトを確認
3. Vercelで再デプロイ

### データベース接続エラー

#### エラー: "Can't reach database server"

**原因**: DATABASE_URLが正しく設定されていない

**解決方法**:
1. Vercelの環境変数を確認
2. `DATABASE_URL` と `DIRECT_URL` が正しいか確認
3. URLに `?sslmode=require` が含まれているか確認

#### エラー: "Prepared statement already exists"

**原因**: プール接続でマイグレーションを実行しようとした

**解決方法**:
- マイグレーション実行時は `DIRECT_URL` を使用
- `npx prisma migrate deploy` 実行時に `DATABASE_URL=$DIRECT_URL` を指定

### 認証エラー

#### エラー: "OAuthCallback Error: access_denied"

**原因**: X OAuth設定が正しくない

**解決方法**:
1. X Developer Portalで以下を確認:
   - Callback URL: `https://your-project.vercel.app/api/auth/callback/twitter`
   - Website URL: `https://your-project.vercel.app`
   - OAuth 2.0が有効になっているか
2. `TWITTER_CLIENT_ID` と `TWITTER_CLIENT_SECRET` が正しいか確認

#### エラー: "No session found"

**原因**: NEXTAUTH_SECRET が設定されていない、またはNEXTAUTH_URLが間違っている

**解決方法**:
1. `NEXTAUTH_SECRET` が環境変数に設定されているか確認
2. `NEXTAUTH_URL` がアプリの正しいURLになっているか確認
3. ブラウザのCookieをクリアして再試行

### API接続エラー

#### エラー: "Anthropic API Error: 401 Unauthorized"

**原因**: API Keyが無効または期限切れ

**解決方法**:
1. Anthropic Consoleで新しいAPI Keyを生成
2. Vercelの環境変数を更新
3. 再デプロイ

#### エラー: "X API Error: 429 Too Many Requests"

**原因**: X APIのレート制限に到達

**解決方法**:
1. レート制限を確認: https://developer.twitter.com/en/docs/twitter-api/rate-limits
2. リクエスト頻度を下げる
3. Vercel KVでレート制限実装を検討

### デプロイ後の問題

#### 症状: デプロイは成功するが、ページが500エラー

**原因**: ランタイムエラー（環境変数、データベース接続など）

**解決方法**:
1. Vercelの "Logs" タブでエラーログを確認
2. 環境変数がすべて設定されているか確認
3. データベースマイグレーションが完了しているか確認

#### 症状: 一部の機能だけ動かない

**原因**: 特定のAPI Keyや設定の問題

**解決方法**:
1. ブラウザの開発者ツールでNetwork タブを確認
2. 失敗しているAPIエンドポイントを特定
3. 該当するAPI Keyと設定を確認

---

## 本番環境チェックリスト

デプロイ前に以下を確認してください。

### セキュリティチェック

- [ ] `.env`、`.env.local` がリポジトリにコミットされていない
- [ ] `.gitignore` に環境変数ファイルが含まれている
- [ ] すべての秘密鍵がランダム生成されている（デフォルト値を使っていない）
- [ ] `ENCRYPTION_KEY` が本番用の安全なキー（64文字16進数）
- [ ] X OAuth Callback URLが本番URLになっている
- [ ] データベース接続がSSL有効（`?sslmode=require`）
- [ ] CORS設定が適切（必要に応じて）
- [ ] Rate limitingが設定されている（推奨）

### 環境変数チェック

- [ ] `DATABASE_URL` - Vercel Postgresから取得
- [ ] `DIRECT_URL` - Vercel Postgresから取得
- [ ] `NEXTAUTH_URL` - 本番URLに設定
- [ ] `NEXTAUTH_SECRET` - ランダム生成された値
- [ ] `TWITTER_CLIENT_ID` - X Developer Portalから取得
- [ ] `TWITTER_CLIENT_SECRET` - X Developer Portalから取得
- [ ] `ANTHROPIC_API_KEY` - Anthropic Consoleから取得
- [ ] `ENCRYPTION_KEY` - ランダム生成された64文字16進数
- [ ] `CRON_SECRET` - スケジュール投稿用（オプション）

### データベースチェック

- [ ] Prismaマイグレーションが本番DBに適用されている
- [ ] データベース接続が正常（`/api/health` で確認）
- [ ] バックアップ設定（Vercel Postgresは自動バックアップ有効）
- [ ] データベース容量を確認（Vercel Free Tierは256MB制限）

### パフォーマンスチェック

- [ ] 画像最適化が有効（Next.js Image Optimization）
- [ ] ビルドサイズを確認（Vercelの制限内か）
- [ ] 不要な依存関係を削除
- [ ] Production buildで動作確認（`npm run build && npm start`）

### 機能テスト

- [ ] ログイン・ログアウトが正常に動作
- [ ] X OAuth認証フローが完了
- [ ] プロフィール設定が保存できる
- [ ] 投稿収集機能が動作（X API連携）
- [ ] AI投稿生成機能が動作（Claude API連携）
- [ ] スケジュール投稿機能が動作（オプション）
- [ ] すべてのページがエラーなく表示される

### モニタリング設定

- [ ] Vercel Analyticsを有効化（推奨）
- [ ] エラートラッキング設定（Sentry等、オプション）
- [ ] ログモニタリング設定（Vercelログで基本的なものは確認可能）
- [ ] アップタイムモニタリング（オプション）

### ドキュメント

- [ ] README.mdが最新
- [ ] 環境変数のドキュメント更新
- [ ] チーム向けデプロイ手順の共有

### 本番運用準備

- [ ] ドメイン設定（カスタムドメイン使用の場合）
- [ ] DNS設定（カスタムドメイン使用の場合）
- [ ] SSL証明書確認（Vercelが自動発行）
- [ ] 利用規約・プライバシーポリシーの準備
- [ ] サポート体制の準備

---

## 継続的デプロイ (CI/CD)

Vercelは自動的にGitHubと連携して継続的デプロイを行います。

### ブランチ戦略

**本番ブランチ (`main`)**:
- `main` ブランチへのプッシュで自動的に本番環境にデプロイ
- 本番URL: `https://your-project.vercel.app`

**開発ブランチ (`develop`, `staging`)**:
- 他のブランチへのプッシュでプレビュー環境が自動作成
- プレビューURL: `https://your-project-git-branch-name.vercel.app`

### プルリクエストプレビュー

- プルリクエストごとに自動的にプレビュー環境が作成される
- レビュー時に実際の動作を確認可能

---

## リソース

### 公式ドキュメント

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
- [X API Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)

### サポート

問題が発生した場合:
1. このドキュメントの[トラブルシューティング](#トラブルシューティング)を確認
2. Vercelのログを確認
3. GitHub Issuesで報告
4. Vercel Supportに問い合わせ（Pro plan以上）

---

## 次のステップ

デプロイが完了したら:

1. **機能追加**: 新しい機能を開発
2. **モニタリング**: アプリの使用状況を監視
3. **最適化**: パフォーマンスとコストの最適化
4. **スケーリング**: 必要に応じてVercel Proプランへアップグレード

---

**完成です！AgentXが本番環境で稼働しています。**
