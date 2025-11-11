# Vercel環境変数セットアップガイド

## 📁 ファイルの場所

`.env.production` ファイルが以下の場所にあります：
```
/Users/kyoko/Desktop/dev/AgentX/app/.env.production
```

---

## 🚀 Vercel環境変数の設定方法

### 方法1: Webコンソールで手動設定（推奨）

1. **Vercelダッシュボードにアクセス**:
   ```
   https://vercel.com/kyoko-hattoris-projects/app/settings/environment-variables
   ```

2. **`.env.production`ファイルを開く**:
   ```bash
   cat /Users/kyoko/Desktop/dev/AgentX/app/.env.production
   ```

3. **各環境変数を追加**:
   - 「Add New」をクリック
   - 各行の `変数名=値` をコピペ
   - Environment: `Production`, `Preview`, `Development` すべてチェック
   - 「Save」をクリック

4. **追加する環境変数**（8個）:
   - `DEMO_MODE`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `ENCRYPTION_KEY`
   - `TWITTER_CLIENT_ID`
   - `TWITTER_CLIENT_SECRET`
   - `X_BEARER_TOKEN`
   - `ANTHROPIC_API_KEY`

---

### 方法2: Vercel CLIで一括設定（高度）

```bash
cd /Users/kyoko/Desktop/dev/AgentX/app

# 各環境変数を個別に追加
vercel env add DEMO_MODE production
# 入力: true

vercel env add NEXTAUTH_SECRET production
# 入力: HrLDZhKUGGSXHuC1ETQUyAw1U8ZCZQQnkycEfGQmoDg=

vercel env add NEXTAUTH_URL production
# 入力: https://app-1021kx3bp-kyoko-hattoris-projects.vercel.app

# ... 残りも同様に追加
```

---

## 🗄️ Vercel Postgresの追加

1. **Vercelダッシュボード**で「Storage」タブを開く
2. 「Create」→「Postgres」を選択
3. Database name: `agentx-db`
4. 「Create」をクリック

→ `DATABASE_URL`と`DIRECT_URL`が自動的に環境変数に追加されます

---

## 🔄 再デプロイ

環境変数を設定したら再デプロイが必要です：

### Webコンソールから:
1. 「Deployments」タブを開く
2. 最新のデプロイの「...」メニュー → 「Redeploy」

### CLIから:
```bash
vercel --prod
```

---

## ✅ 動作確認

再デプロイ完了後：
1. https://app-1021kx3bp-kyoko-hattoris-projects.vercel.app にアクセス
2. 青い「デモモードでログイン（API Key不要）」ボタンが表示される
3. ボタンをクリックしてダッシュボードにアクセス

---

## 🔧 トラブルシューティング

### 環境変数が反映されない
- 再デプロイを実行してください
- ブラウザのキャッシュをクリアしてください

### DATABASE_URLが見つからない
- Vercel Postgresを作成してください
- 作成後、自動的に環境変数に追加されます

### デモモードボタンが表示されない
- `DEMO_MODE=true` が設定されているか確認
- `NEXT_PUBLIC_DEMO_MODE` は自動的に `DEMO_MODE` から設定されます

---

## 📞 サポート

設定でお困りの場合は、以下を確認してください：
- `.env.production` ファイルの内容
- Vercel環境変数画面のスクリーンショット
- デプロイログ
