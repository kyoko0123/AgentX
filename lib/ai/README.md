# AgentX AI Post Generation Module

Claude APIを使用したX投稿の自動生成システム

## 概要

このモジュールは、Anthropic Claude 3.5 Sonnetを使用して、高品質なX（旧Twitter）投稿を生成します。ユーザーの専門性、興味、トーンに基づいてパーソナライズされた投稿を作成し、コンテンツフィルタリングとPrismaデータベース統合を提供します。

## 主要機能

### 1. Claude API Client (`claude-client.ts`)

- Anthropic Claude API v1統合
- 自動リトライロジック（エクスポネンシャルバックオフ）
- レート制限対策
- エラーハンドリング
- JSON応答のパース

### 2. Post Generator (`post-generator.ts`)

- 単一投稿の生成
- 複数バリエーションの生成（最大5つ）
- フィードバックに基づく再生成
- 投稿改善提案
- コンテンツフィルタリング統合

### 3. Prompt Templates (`prompts.ts`)

- システムプロンプト
- ユーザープロンプト構築
- 再生成プロンプト
- 改善提案プロンプト
- バリエーション生成プロンプト

### 4. Content Filter (`content-filter.ts`)

- 文字数チェック（280文字制限）
- 禁止ワード検出
- スパムパターン検出
- センシティブトピック検出
- URL安全性チェック
- 過度な大文字使用チェック
- 繰り返しコンテンツチェック

### 5. Generation Service (`generation-service.ts`)

- Prismaデータベース統合
- 生成履歴の保存
- ユーザープロファイル連携
- エラーログ記録
- 下書き承認機能

## インストール

```bash
npm install @anthropic-ai/sdk
```

## 環境変数

`.env.local`に以下を追加：

```env
ANTHROPIC_API_KEY=your_api_key_here
DATABASE_URL=your_database_url
```

## 使用方法

### 基本的な投稿生成

```typescript
import { generatePost } from '@/lib/ai';

const post = await generatePost({
  topic: 'The future of AI in software development',
  tone: 'professional',
  length: 'medium',
  includeHashtags: true,
  includeEmoji: false,
});

console.log(post.text);
console.log(post.hashtags);
```

### パーソナライズされた投稿生成

```typescript
import { generatePost } from '@/lib/ai';

const post = await generatePost({
  topic: 'New web development trends',
  userExpertise: ['React', 'TypeScript', 'Next.js'],
  userInterests: ['Web Performance', 'Developer Experience'],
  tone: 'casual',
  length: 'medium',
  targetAudience: 'Frontend developers',
  includeHashtags: true,
  includeEmoji: true,
});
```

### 複数バリエーションの生成

```typescript
import { generatePostVariations } from '@/lib/ai';

const result = await generatePostVariations({
  topic: 'Tips for remote work productivity',
  tone: 'professional',
  length: 'short',
  variations: 3,
  includeHashtags: true,
});

result.variations.forEach((variation, index) => {
  console.log(`Variation ${index + 1}:`, variation.text);
});
```

### フィードバックに基づく再生成

```typescript
import { regeneratePost } from '@/lib/ai';

const improved = await regeneratePost(
  originalPost.text,
  'Make it more specific and add a call-to-action',
  {
    tone: 'professional',
    length: 'medium',
    includeHashtags: true,
  }
);
```

### 投稿改善提案

```typescript
import { improvePost } from '@/lib/ai';

const analysis = await improvePost(draftText);

console.log('Score:', analysis.score);
console.log('Engagement Prediction:', analysis.engagementPrediction);
console.log('Strengths:', analysis.strengths);
console.log('Improvements:', analysis.improvements);
```

### Generation Service（Prisma統合）

```typescript
import { createGenerationService } from '@/lib/ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const service = createGenerationService(userId, prisma);

// 生成して保存
const { generated, saved } = await service.generateAndSave({
  topic: 'The importance of code reviews',
  tone: 'professional',
  length: 'medium',
});

console.log('Saved post ID:', saved.id);

// 履歴取得
const history = await service.getHistory(10);

// 下書き承認
await service.approveDraft(postId);
```

### コンテンツフィルタリング

```typescript
import { ContentFilter } from '@/lib/ai';

const result = await ContentFilter.filterContent(postText);

if (result.passed) {
  console.log('Content is safe to publish');
} else {
  console.log('Issues found:', result.issues);
  console.log('Recommendation:', result.recommendation);
}
```

## API リファレンス

### GenerationOptions

```typescript
interface GenerationOptions {
  topic?: string;                    // 投稿トピック
  trendingTopics?: string[];         // トレンドトピック
  userExpertise?: string[];          // ユーザーの専門性
  userInterests?: string[];          // ユーザーの興味
  tone?: 'professional' | 'casual' | 'humorous';  // トーン
  length?: 'short' | 'medium' | 'long';           // 長さ
  includeHashtags?: boolean;         // ハッシュタグを含める
  includeEmoji?: boolean;            // 絵文字を含める
  avoidTopics?: string[];            // 避けるトピック
  targetAudience?: string;           // ターゲットオーディエンス
  variations?: number;               // バリエーション数（1-5）
}
```

### GeneratedPost

```typescript
interface GeneratedPost {
  text: string;         // 投稿本文（最大280文字）
  hashtags: string[];   // ハッシュタグリスト
  reasoning?: string;   // 生成理由の説明
}
```

### ContentFilterResult

```typescript
interface ContentFilterResult {
  passed: boolean;                                    // フィルタ通過
  issues: string[];                                   // 検出された問題
  severity: 'none' | 'low' | 'medium' | 'high';      // 深刻度
  recommendation: 'approve' | 'revise' | 'reject';   // 推奨アクション
  filteredText?: string;                              // フィルタ後のテキスト
}
```

## 設定

### Claude API設定

- **モデル**: `claude-3-5-sonnet-20241022`
- **max_tokens**: 300（投稿用）、500（分析用）
- **temperature**: 0.7（デフォルト）
- **レート制限**: リクエスト間1秒

### コンテンツポリシー

- 最大文字数: 280文字
- 最大ハッシュタグ: 5個
- 最大メンション: 5個
- 禁止ワードチェック
- スパムパターン検出
- センシティブトピック警告

## エラーハンドリング

```typescript
try {
  const post = await generatePost(options);
} catch (error) {
  if (error.message.includes('rate limit')) {
    // レート制限エラー
  } else if (error.message.includes('API key')) {
    // API認証エラー
  } else if (error.message.includes('content filter')) {
    // コンテンツフィルタエラー
  } else {
    // その他のエラー
  }
}
```

## テスト

例を実行：

```typescript
import { runAllExamples, quickTest } from '@/lib/ai/examples';

// クイックテスト
await quickTest();

// すべての例を実行
await runAllExamples();
```

## ファイル構成

```
lib/ai/
├── claude-client.ts       # Claude APIクライアント
├── post-generator.ts      # 投稿生成ロジック
├── prompts.ts             # プロンプトテンプレート
├── content-filter.ts      # コンテンツフィルタリング
├── generation-service.ts  # サービス層（Prisma統合）
├── examples.ts            # 使用例
├── index.ts               # エクスポート
└── README.md              # このファイル
```

## 制限事項

- Claude APIのレート制限に従う
- 投稿は280文字まで
- バリエーション生成は最大5つ
- リトライは最大3回

## 今後の拡張

- [ ] 画像生成統合
- [ ] スレッド投稿対応
- [ ] A/Bテスト機能
- [ ] パフォーマンス予測
- [ ] 自動スケジューリング最適化

## ライセンス

MIT

## 作成者

AgentX Development Team
