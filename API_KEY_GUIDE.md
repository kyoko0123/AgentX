# API Key取得ガイド

AgentXを完全に動作させるには、以下のAPI Keyが必要です。

## 🔑 必要なAPI Key

### 1. Claude API Key（必須）

**料金**: 従量課金（投稿生成1回あたり約0.3円）

**取得方法**:
1. https://console.anthropic.com/ にアクセス
2. Anthropicアカウントを作成（Google/GitHubでサインアップ可能）
3. 「API Keys」タブをクリック
4. 「Create Key」ボタンをクリック
5. キー名を入力（例: "AgentX Production"）
6. 生成されたキーをコピー（`sk-ant-` で始まる文字列）

**⚠️ 重要**: 
- 生成されたキーは一度しか表示されないので、必ずコピーして安全な場所に保存してください
- 無料枠: $5 クレジット（約1,600回の投稿生成が可能）

---

### 2. X (Twitter) API Key（必須）

**料金**: Basic Plan $100/月（無料プランは機能制限あり）

**取得方法**:
1. https://developer.x.com/en/portal にアクセス
2. X Developer Accountを作成
3. 「Projects & Apps」→「Create App」をクリック
4. アプリ名を入力（例: "AgentX"）
5. OAuth 2.0を有効化：
   - 「User authentication settings」を編集
   - Type of App: Web App
   - Callback URL: `http://localhost:3000/api/auth/callback/twitter` (ローカル開発用)
   - Website URL: `https://your-domain.com`
6. 以下の値をコピー：
   - **Client ID** (`TWITTER_CLIENT_ID`)
   - **Client Secret** (`TWITTER_CLIENT_SECRET`)
7. 「Keys and tokens」タブで：
   - **Bearer Token** (`X_BEARER_TOKEN`)を生成

**必要なスコープ**:
- `tweet.read`
- `tweet.write`
- `users.read`
- `offline.access`

**⚠️ 重要**: 
- Basic Planが必要（投稿作成・OAuth 2.0に必須）
- Free Planでは読み取り専用

---

## 🎯 デモモード（API Keyなし）

API Keyがない場合、デモモードでデプロイできます：

### デモモードの制限
- ✅ UIとデザインの確認が可能
- ✅ 認証フローの動作確認（モック）
- ❌ 実際の投稿生成は不可
- ❌ X APIからの投稿収集は不可

### デモモード用の環境変数

```bash
# NextAuth（必須）
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=<生成済みの値>
ENCRYPTION_KEY=<生成済みの値>

# デモモード用のダミー値
TWITTER_CLIENT_ID=demo_client_id
TWITTER_CLIENT_SECRET=demo_client_secret
X_BEARER_TOKEN=demo_bearer_token
ANTHROPIC_API_KEY=demo_api_key

# デモモードフラグ
DEMO_MODE=true
```

---

## 💡 推奨：段階的なセットアップ

### Phase 1: デモモードでデプロイ（今すぐ）
1. デモモード環境変数でVercelにデプロイ
2. UIとデザインを確認
3. 基本的な動作をテスト

### Phase 2: Claude APIを追加（1-2日後）
1. Anthropicアカウントを作成
2. Claude API Keyを取得
3. Vercel環境変数を更新
4. AI投稿生成機能が使用可能に

### Phase 3: X APIを追加（予算確保後）
1. X Developer Accountを作成
2. Basic Plan（$100/月）に登録
3. X API Keyを取得
4. Vercel環境変数を更新
5. 投稿収集・自動投稿機能が使用可能に

---

## 🔐 環境変数の設定方法

### Vercelダッシュボードで設定
1. Vercelプロジェクトページにアクセス
2. 「Settings」→「Environment Variables」
3. 各変数を追加：
   - Name: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...`（取得したキー）
   - Environment: `Production`, `Preview`, `Development` すべてチェック
4. 「Save」をクリック
5. 「Deployments」タブで「Redeploy」

---

## 💰 コスト概算

### 最小構成（デモモード）
- Vercel: $0
- Vercel Postgres: $0-20/月
- **合計: $0-20/月**

### 基本構成（Claude APIのみ）
- Vercel: $0
- Vercel Postgres: $0-20/月
- Claude API: ~$20/月（1,000回生成）
- **合計: $20-40/月**

### 完全構成（すべてのAPI）
- Vercel: $0
- Vercel Postgres: $0-20/月
- Claude API: ~$20/月
- X API Basic: $100/月
- **合計: $120-140/月**

---

## ❓ FAQ

### Q: X APIの無料プランでは使えませんか？
A: 無料プランでは投稿作成とOAuth 2.0が使用できないため、AgentXの主要機能が動作しません。Basic Plan（$100/月）が必要です。

### Q: Claude APIの代わりにOpenAI GPTは使えますか？
A: 現在の実装はClaude専用ですが、コードを修正すれば可能です（`lib/ai/claude-client.ts`を変更）。

### Q: デモモードで何ができますか？
A: UIの確認、ナビゲーション、ダッシュボードの表示などが可能です。実際のAPI連携は動作しません。

---

## 📞 サポート

API Key取得でお困りの場合：
- Anthropic: https://docs.anthropic.com/
- X Developer: https://developer.x.com/en/support
