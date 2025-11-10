# AgentX Claude API統合 - 実装サマリー

## 実装日
2025年11月11日

## 概要
AgentXのClaude API統合（AI投稿生成）を完全に実装しました。Anthropic Claude 3.5 Sonnetを使用して、ユーザーの専門性と興味に基づいたパーソナライズされたX投稿を生成します。

## 実装したファイル

### 1. `/lib/ai/claude-client.ts`
**Claude APIクライアント**

- Anthropic Claude API v1クライアント実装
- 自動リトライロジック（エクスポネンシャルバックオフ）
- レート制限対策（リクエスト間1秒）
- エラーハンドリングと分類
- JSON応答パース機能
- 接続テスト機能

**主要機能:**
- `sendMessage()` - メッセージ送信
- `sendMessageJSON()` - JSON形式での応答取得
- `testConnection()` - 接続テスト

**設定:**
- Model: `claude-3-5-sonnet-20241022`
- Max Tokens: 300（デフォルト）
- Temperature: 0.7（デフォルト）
- Max Retries: 3回

### 2. `/lib/ai/prompts.ts`
**プロンプトテンプレート**

- システムプロンプト（X投稿の専門家ペルソナ）
- ユーザープロンプト構築関数
- 再生成プロンプト
- 改善提案プロンプト
- バリエーション生成プロンプト
- トピック抽出プロンプト
- ハッシュタグ提案プロンプト
- コンテンツポリシーチェックプロンプト

**コンテキスト設定:**
- トーン: professional / casual / humorous
- 長さ: short (~100-150) / medium (~150-220) / long (~220-280)
- ユーザーの専門性
- ユーザーの興味
- トレンドトピック
- ターゲットオーディエンス
- 避けるトピック

### 3. `/lib/ai/content-filter.ts`
**コンテンツフィルタリング**

- 文字数チェック（280文字制限）
- 禁止ワード検出
- スパムパターン検出
- センシティブトピック検出
- URL安全性チェック
- 過度な大文字使用チェック
- 繰り返しコンテンツチェック
- Xコンテンツポリシー遵守チェック

**フィルター結果:**
- `passed`: フィルタ通過の可否
- `issues`: 検出された問題のリスト
- `severity`: none / low / medium / high
- `recommendation`: approve / revise / reject

### 4. `/lib/ai/post-generator.ts`
**投稿生成機能**

- 単一投稿生成
- 複数バリエーション生成（1-5個）
- フィードバックに基づく再生成
- 投稿改善提案分析
- 自動コンテンツフィルタリング

**主要関数:**
- `generatePost()` - 単一投稿生成
- `generatePostVariations()` - 複数バリエーション生成
- `regeneratePost()` - 再生成
- `improvePost()` - 改善提案

### 5. `/lib/ai/generation-service.ts`
**サービス層（Prisma統合）**

- Prismaデータベース統合
- 生成履歴の自動保存
- ユーザープロファイル連携
- エラーログ記録
- 下書き承認機能
- 生成履歴取得

**主要機能:**
- `generateAndSave()` - 生成して保存
- `generateVariationsAndSave()` - バリエーション生成して保存
- `regenerateAndSave()` - 再生成して保存
- `analyzeDraft()` - 下書き分析
- `approveDraft()` - 下書き承認
- `getHistory()` - 履歴取得
- `deletePost()` - 投稿削除

### 6. `/lib/ai/examples.ts`
**使用例とテストコード**

8つの実用的な使用例:
1. シンプルな投稿生成
2. パーソナライズされた投稿生成
3. 複数バリエーション生成
4. フィードバックに基づく再生成
5. 改善提案の取得
6. コンテンツフィルタリング
7. GenerationServiceの使用（Prisma）
8. 完全なワークフロー

### 7. `/lib/ai/index.ts`
**エクスポートファイル**

すべての機能を一箇所からエクスポート

### 8. `/lib/ai/README.md`
**ドキュメント**

完全な使用ガイドとAPIリファレンス

## インストール

```bash
npm install @anthropic-ai/sdk
```

## 環境変数

`.env.local`に以下を設定：

```env
ANTHROPIC_API_KEY=your_api_key_here
DATABASE_URL=your_database_url
```

## 基本的な使用方法

### 1. シンプルな投稿生成

```typescript
import { generatePost } from '@/lib/ai';

const post = await generatePost({
  topic: 'The future of AI in software development',
  tone: 'professional',
  length: 'medium',
  includeHashtags: true,
});

console.log(post.text);
// Output: "AI is revolutionizing software development..."
console.log(post.hashtags);
// Output: ["AI", "SoftwareDevelopment", "FutureTech"]
```

### 2. パーソナライズされた投稿

```typescript
const post = await generatePost({
  topic: 'New web development trends',
  userExpertise: ['React', 'TypeScript', 'Next.js'],
  userInterests: ['Web Performance', 'Developer Experience'],
  tone: 'casual',
  targetAudience: 'Frontend developers',
});
```

### 3. データベース統合（推奨）

```typescript
import { createGenerationService } from '@/lib/ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const service = createGenerationService(userId, prisma);

// 生成して自動保存
const { generated, saved } = await service.generateAndSave({
  topic: 'Code review best practices',
  tone: 'professional',
  length: 'medium',
});

console.log('Saved ID:', saved.id);
console.log('Post:', saved.text);

// 下書き承認
await service.approveDraft(saved.id);
```

### 4. バリエーション生成

```typescript
const result = await generatePostVariations({
  topic: 'Remote work productivity tips',
  variations: 3,
  tone: 'professional',
});

result.variations.forEach((v, i) => {
  console.log(`Variation ${i + 1}: ${v.text}`);
});
```

### 5. 改善提案

```typescript
const analysis = await improvePost(draftText);

console.log('Score:', analysis.score, '/ 10');
console.log('Engagement:', analysis.engagementPrediction);
console.log('Improvements:', analysis.improvements);
```

## アーキテクチャ設計

```
User Request
    ↓
GenerationService (Prisma統合)
    ↓
PostGenerator (ビジネスロジック)
    ↓
ClaudeClient (API通信)
    ↓
Anthropic Claude API
    ↓
ContentFilter (検証)
    ↓
Database (保存)
```

## 主要な設計判断

### 1. シングルトンパターン
ClaudeClientはシングルトンで実装し、リソースの無駄を防止

### 2. レイヤー分離
- ClaudeClient: API通信のみ
- PostGenerator: ビジネスロジック
- GenerationService: データベース操作

### 3. エラーハンドリング
- リトライ可能なエラーの自動リトライ
- エラーの分類と適切なメッセージ
- データベースへのエラーログ記録

### 4. コンテンツフィルタリング
生成前・生成後の二段階チェック

### 5. 型安全性
TypeScriptの厳密な型チェックを活用

## パフォーマンス最適化

1. **レート制限**: リクエスト間1秒のディレイ
2. **キャッシング**: ユーザープロファイルの取得最適化
3. **バッチ処理**: バリエーション生成の効率化
4. **エラーリトライ**: エクスポネンシャルバックオフ

## セキュリティ対策

1. **API Key保護**: 環境変数での管理
2. **コンテンツフィルタリング**: 不適切なコンテンツの検出
3. **入力サニタイゼーション**: 危険な文字の除去
4. **レート制限**: 過度なAPI使用の防止

## テスト方法

### クイックテスト

```typescript
import { quickTest } from '@/lib/ai/examples';

await quickTest();
```

### 全例の実行

```typescript
import { runAllExamples } from '@/lib/ai/examples';

await runAllExamples();
```

## 今後の拡張案

1. **画像生成統合**: DALL-E等の画像生成API統合
2. **スレッド投稿**: 長文を自動的にスレッド化
3. **A/Bテスト**: 複数バリエーションのパフォーマンス比較
4. **パフォーマンス予測**: 過去データに基づくエンゲージメント予測
5. **自動スケジューリング**: 最適な投稿時間の提案
6. **マルチ言語対応**: 英語以外の言語での投稿生成
7. **トレンド自動検出**: リアルタイムトレンドの自動取得

## トラブルシューティング

### API Key エラー
```
Error: Invalid Claude API key
```
→ `.env.local`のANTHROPIC_API_KEYを確認

### レート制限エラー
```
Error: Claude API rate limit exceeded
```
→ 一定時間待ってから再試行

### 文字数超過
```
Error: Post exceeds 280 character limit
```
→ lengthオプションを'short'または'medium'に変更

### データベースエラー
```
Error: Post not found
```
→ ユーザーIDと投稿IDの所有権を確認

## パッケージ依存関係

```json
{
  "@anthropic-ai/sdk": "^0.x.x",
  "@prisma/client": "^6.19.0",
  "typescript": "^5.x.x"
}
```

## ライセンス
MIT

## 作成者
AgentX Development Team

## 最終更新
2025年11月11日
