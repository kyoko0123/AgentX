# AgentX MVP API テストガイド

## 実装したAPIエンドポイント

### 1. ユーザープロフィールAPI
- **GET** `/api/user/profile` - プロフィール取得
- **PUT** `/api/user/profile` - プロフィール更新

### 2. 投稿生成API
- **POST** `/api/generation/create` - AI投稿生成

### 3. 下書き一覧API
- **GET** `/api/generation/drafts` - 下書き一覧取得

### 4. 投稿収集API
- **POST** `/api/posts/collect` - キーワードで投稿収集

### 5. ヘルスチェックAPI
- **GET** `/api/health` - サービスヘルスチェック

---

## テスト方法

### 前提条件
1. サーバーが起動している (`npm run dev`)
2. データベースマイグレーション済み
3. 認証済みのセッションCookieを取得

---

## 1. ヘルスチェック（認証不要）

```bash
# ヘルスチェック
curl http://localhost:3000/api/health
```

**期待されるレスポンス:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-11-11T...",
    "uptime": 123,
    "services": {
      "database": "healthy",
      "xApi": "healthy",
      "claudeApi": "healthy"
    }
  }
}
```

---

## 2. 認証が必要なエンドポイントのテスト

### セッションCookie取得方法

#### 方法1: ブラウザの開発者ツールを使用
1. ブラウザで `http://localhost:3000` にアクセス
2. X認証でログイン
3. 開発者ツール → Application → Cookies
4. `next-auth.session-token` の値をコピー

#### 方法2: 以下のcurlコマンドで認証
```bash
# まずブラウザでログインしてからセッションCookieを使用
SESSION_TOKEN="your-session-token-here"
```

---

## 3. ユーザープロフィールAPI

### プロフィール取得
```bash
curl http://localhost:3000/api/user/profile \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN"
```

**期待されるレスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "user@example.com",
    "name": "User Name",
    "image": "...",
    "username": "twitter_username",
    "expertise": [],
    "interests": [],
    "tone": "professional",
    "avoidTopics": [],
    "targetAudience": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### プロフィール更新
```bash
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "expertise": ["AI", "Web Development"],
    "interests": ["Technology", "Innovation"],
    "tone": "casual",
    "targetAudience": "Tech enthusiasts"
  }'
```

**期待されるレスポンス:**
```json
{
  "success": true,
  "data": { /* 更新されたプロフィール */ },
  "message": "Profile updated successfully"
}
```

---

## 4. 投稿生成API

### 単一投稿生成
```bash
curl -X POST http://localhost:3000/api/generation/create \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "AIがもたらす未来の働き方について",
    "tone": "professional",
    "length": "medium",
    "includeHashtags": true,
    "variations": 1
  }'
```

**期待されるレスポンス:**
```json
{
  "success": true,
  "data": {
    "variations": [
      {
        "id": "...",
        "text": "生成された投稿テキスト...",
        "tone": "professional",
        "status": "DRAFT",
        "hashtags": ["#AI", "#未来"],
        "reasoning": "...",
        "createdAt": "..."
      }
    ],
    "basedOnTopic": "AIがもたらす未来の働き方について",
    "generatedAt": "..."
  },
  "message": "Post generated successfully"
}
```

### 複数バリエーション生成
```bash
curl -X POST http://localhost:3000/api/generation/create \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Web3の可能性",
    "tone": "casual",
    "length": "short",
    "variations": 3
  }'
```

---

## 5. 下書き一覧API

### 下書き一覧取得（デフォルト: 最新10件）
```bash
curl http://localhost:3000/api/generation/drafts \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN"
```

### フィルター・ソート付き取得
```bash
# DRAFT状態の投稿を20件取得
curl "http://localhost:3000/api/generation/drafts?limit=20&status=DRAFT&sortBy=createdAt&order=desc" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN"
```

**期待されるレスポンス:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "text": "投稿テキスト...",
      "basedOnTopic": "...",
      "tone": "professional",
      "version": 1,
      "status": "DRAFT",
      "model": "claude-3-5-sonnet-20241022",
      "hashtags": ["#AI"],
      "reasoning": "...",
      "scheduledPost": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

## 6. 投稿収集API

### キーワードで投稿収集
```bash
curl -X POST http://localhost:3000/api/posts/collect \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "AI開発",
    "maxResults": 10,
    "minLikes": 5
  }'
```

**期待されるレスポンス:**
```json
{
  "success": true,
  "data": {
    "collected": 8,
    "duplicates": 2,
    "keyword": "AI開発",
    "totalFound": 10
  },
  "message": "Posts collected successfully"
}
```

---

## エラーレスポンス例

### 認証エラー
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### バリデーションエラー
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Topic is required and must be a non-empty string"
  }
}
```

### X APIエラー
```json
{
  "success": false,
  "error": {
    "code": "X_RATE_LIMIT",
    "message": "X API rate limit exceeded. Please try again later.",
    "details": {
      "originalError": "..."
    }
  }
}
```

### Claude APIエラー
```json
{
  "success": false,
  "error": {
    "code": "CLAUDE_API_ERROR",
    "message": "Failed to generate post with Claude API",
    "details": {
      "originalError": "..."
    }
  }
}
```

---

## テストスクリプト（自動化）

### test-apis.sh
```bash
#!/bin/bash

# 環境変数設定
BASE_URL="http://localhost:3000"
SESSION_TOKEN="your-session-token-here"

echo "=== AgentX API Tests ==="
echo ""

# 1. ヘルスチェック
echo "1. Health Check..."
curl -s "$BASE_URL/api/health" | jq
echo ""

# 2. プロフィール取得
echo "2. Get Profile..."
curl -s "$BASE_URL/api/user/profile" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" | jq
echo ""

# 3. 下書き一覧取得
echo "3. Get Drafts..."
curl -s "$BASE_URL/api/generation/drafts?limit=5" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" | jq
echo ""

# 4. 投稿生成
echo "4. Generate Post..."
curl -s -X POST "$BASE_URL/api/generation/create" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "テスト投稿",
    "tone": "casual",
    "variations": 1
  }' | jq
echo ""

echo "=== Tests Complete ==="
```

---

## Postmanコレクション

以下の内容でPostmanコレクションをインポート可能:

```json
{
  "info": {
    "name": "AgentX MVP API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/health"
      }
    },
    {
      "name": "Get Profile",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/user/profile",
        "header": [
          {
            "key": "Cookie",
            "value": "next-auth.session-token={{sessionToken}}"
          }
        ]
      }
    },
    {
      "name": "Update Profile",
      "request": {
        "method": "PUT",
        "url": "{{baseUrl}}/api/user/profile",
        "header": [
          {
            "key": "Cookie",
            "value": "next-auth.session-token={{sessionToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"expertise\": [\"AI\", \"Web Development\"],\n  \"tone\": \"casual\"\n}"
        }
      }
    },
    {
      "name": "Generate Post",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/generation/create",
        "header": [
          {
            "key": "Cookie",
            "value": "next-auth.session-token={{sessionToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"topic\": \"AIの未来\",\n  \"tone\": \"professional\",\n  \"length\": \"medium\",\n  \"variations\": 1\n}"
        }
      }
    },
    {
      "name": "Get Drafts",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/generation/drafts?limit=10",
        "header": [
          {
            "key": "Cookie",
            "value": "next-auth.session-token={{sessionToken}}"
          }
        ]
      }
    },
    {
      "name": "Collect Posts",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/posts/collect",
        "header": [
          {
            "key": "Cookie",
            "value": "next-auth.session-token={{sessionToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"keyword\": \"AI開発\",\n  \"maxResults\": 10,\n  \"minLikes\": 5\n}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "sessionToken",
      "value": "your-session-token-here"
    }
  ]
}
```

---

## トラブルシューティング

### 1. 認証エラー（401）
- セッションCookieが正しく設定されているか確認
- ブラウザで再度ログイン

### 2. X API エラー（502, 429）
- X API認証情報が正しいか確認（.env.local）
- Rate limitに達していないか確認

### 3. Claude API エラー（502）
- `ANTHROPIC_API_KEY` が設定されているか確認
- APIキーが有効か確認

### 4. データベースエラー（500）
- Prismaマイグレーションが完了しているか確認
- データベース接続情報が正しいか確認

---

## 次のステップ

1. フロントエンドからAPIを呼び出す
2. エラーハンドリングの改善
3. Rate limiting実装
4. より詳細なテストケース追加
