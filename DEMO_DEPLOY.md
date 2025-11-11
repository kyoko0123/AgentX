# AgentX - デモモードで今すぐデプロイ

API KeyなしでUIを確認できるデモモードでデプロイします。

## 🎯 デモモードで何ができる？

✅ **確認できること**:
- モダンなUIデザイン
- レスポンシブレイアウト
- ダッシュボード画面
- ナビゲーション
- フォーム入力

❌ **動作しないこと**:
- 実際のX投稿収集
- AI投稿生成（Claude API）
- X認証ログイン

**後でAPI Keyを追加すれば、すべての機能が使えるようになります！**

---

## 🚀 5分でデプロイ

### ステップ1: GitHubリポジトリを作成（1分）

1. https://github.com/new にアクセス
2. リポジトリ名: `agentx`
3. Private または Public を選択
4. 「Create repository」をクリック

### ステップ2: コードをプッシュ（1分）

GitHubの指示に従って：

```bash
cd /Users/kyoko/Desktop/dev/AgentX/app

# GitHubリポジトリのURLを設定（YOUR_USERNAMEを置き換え）
git remote add origin https://github.com/YOUR_USERNAME/agentx.git

# プッシュ
git branch -M main
git push -u origin main
```

### ステップ3: Vercelでインポート（1分）

1. https://vercel.com/new にアクセス
2. 「Import Git Repository」をクリック
3. 先ほど作成した`agentx`リポジトリを選択
4. プロジェクト名: `agentx`（または任意）
5. Framework Preset: `Next.js`（自動検出）
6. **まだ「Deploy」をクリックしない**

### ステップ4: 環境変数を設定（2分）

「Environment Variables」セクションで以下を追加：

#### 必須の秘密鍵（既に生成済み）

```bash
NEXTAUTH_SECRET
HrLDZhKUGGSXHuC1ETQUyAw1U8ZCZQQnkycEfGQmoDg=

ENCRYPTION_KEY
818540fddf17130159a692ca3f91332d180c6ae737a9d43720328a31a8d57417
```

#### デモモード用のダミー値

```bash
TWITTER_CLIENT_ID
demo_twitter_client

TWITTER_CLIENT_SECRET
demo_twitter_secret

X_BEARER_TOKEN
demo_bearer_token

ANTHROPIC_API_KEY
demo_anthropic_key

DEMO_MODE
true
```

#### デプロイ後に設定（デプロイURLが分かってから）

```bash
NEXTAUTH_URL
https://your-project.vercel.app
```

**⚠️ 重要**: 
- `NEXTAUTH_URL`はデプロイ後に設定するため、**一旦スキップ**してOK
- 後で「Settings」→「Environment Variables」で追加します

### ステップ5: Vercel Postgresを追加（30秒）

1. 「Storage」タブをクリック
2. 「Create」→「Postgres」を選択
3. Database name: `agentx-db`
4. Region: 自動選択でOK
5. 「Create」をクリック

→ `DATABASE_URL`と`DIRECT_URL`が自動的に環境変数に追加されます

### ステップ6: デプロイ実行（30秒）

1. 「Deploy」ボタンをクリック
2. ビルド完了を待つ（1-2分）
3. デプロイURLが表示されます（例: `https://agentx-abc123.vercel.app`）

### ステップ7: NEXTAUTH_URLを追加（30秒）

1. Vercelプロジェクトページで「Settings」→「Environment Variables」
2. 新しい環境変数を追加：
   - Name: `NEXTAUTH_URL`
   - Value: `https://あなたのデプロイURL`（ステップ6で表示されたURL）
   - Environment: Production, Preview, Development すべてチェック
3. 「Save」をクリック

### ステップ8: 再デプロイ（30秒）

1. 「Deployments」タブ
2. 最新のデプロイの「...」メニュー → 「Redeploy」
3. 完了を待つ（1分）

### ステップ9: 動作確認（1分）

1. デプロイURLにアクセス（`https://your-project.vercel.app`）
2. 画面が表示されることを確認
3. ダッシュボードを確認

---

## 🎉 デプロイ完了！

デモモードでAgentXが動作しています！

### 次のステップ

#### すぐに実行（オプション）
- カスタムドメインの設定
- Vercel Analyticsの有効化

#### 後で実行（機能を有効化）
1. **Claude API Keyを取得**（`API_KEY_GUIDE.md`参照）
   - https://console.anthropic.com/
   - 無料枠: $5（約1,600回生成可能）
   
2. **環境変数を更新**：
   ```bash
   ANTHROPIC_API_KEY=sk-ant-xxx（実際のキー）
   DEMO_MODE=false  # デモモードを無効化
   ```

3. **再デプロイ**して、AI投稿生成機能が使えるように！

---

## 🐛 トラブルシューティング

### ビルドエラーが発生
- 環境変数がすべて設定されているか確認
- `NEXTAUTH_SECRET`と`ENCRYPTION_KEY`が正しいか確認

### 画面が真っ白
- ブラウザのコンソールでエラーを確認
- `NEXTAUTH_URL`がデプロイURLと一致しているか確認

### データベースエラー
- Vercel Postgresが正しく作成されているか確認
- `DATABASE_URL`環境変数が自動設定されているか確認

---

## 📞 サポート

- 詳細なデプロイガイド: `DEPLOYMENT.md`
- API Key取得方法: `API_KEY_GUIDE.md`
- クイックスタート: `QUICKSTART.md`
