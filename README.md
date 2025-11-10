# AgentX - X投稿分析・自動生成・自動投稿サービス

X（旧Twitter）の投稿分析からAI生成、自動投稿までを一気通貫で行うインテリジェントなソーシャルメディアマネジメントツール。

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes, Server Actions
- **データベース**: PostgreSQL (Vercel Postgres)
- **ORM**: Prisma
- **認証**: NextAuth.js (X OAuth 2.0)
- **デプロイ**: Vercel
- **外部API**: X API v2, Claude API (Anthropic)

## クイックスタート

**3分でデプロイ**: [QUICKSTART.md](./QUICKSTART.md)

**詳細なデプロイガイド**: [DEPLOYMENT.md](./DEPLOYMENT.md)

## ローカル開発セットアップ

### 1. 依存関係のインストール

\`\`\`bash
npm install
\`\`\`

### 2. 環境変数の設定

\`.env.example\`をコピーして\`.env.local\`を作成：

\`\`\`bash
cp .env.example .env.local
\`\`\`

必要な値を設定（詳細は\`.env.example\`内のコメントを参照）：

\`\`\`env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
TWITTER_CLIENT_ID="..."
TWITTER_CLIENT_SECRET="..."
ANTHROPIC_API_KEY="..."
ENCRYPTION_KEY="..."
\`\`\`

### 3. データベースのセットアップ

\`\`\`bash
npx prisma generate
npx prisma migrate dev --name init
\`\`\`

### 4. 開発サーバーの起動

\`\`\`bash
npm run dev
\`\`\`

## ドキュメント

- [要件定義書](../requirements.md)
- [システムアーキテクチャ](../architecture.md)
- [データベース設計](../database-design.md)
- [API設計](../api-design.md)
