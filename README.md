# ログイン認証サービス

callback URLパラメータを受け取り、JWTトークンをURLフラグメントとして返却する認証サービス

## 機能概要

- **ログイン処理**: ハードコードされたJWTトークン(HS256署名、7日間有効)を生成
- **リダイレクト**: callback URLにJWTフラグメント `#<jwt>` を付与してリダイレクト
- **多言語対応**: 日本語、英語、中国語のログイン画面を提供
- **フォールバック**: callback URL未指定時はログイン画面を表示

## セットアップ

### 前提条件

- Node.js 20以上
- npm または yarn

### インストール

```bash
# 依存関係インストール
cd backend
npm install
```

### 環境変数設定

`.env`ファイルを作成:

```bash
cp backend/.env.example backend/.env
```

`.env`ファイルを編集してJWT_SECRETを設定:

```env
JWT_SECRET=your-super-secret-key-minimum-32-characters-long-please
PORT=3000
NODE_ENV=development
```

**重要**: 本番環境では強力なランダム文字列(最低32文字)を使用してください。

### ビルドと起動

```bash
# TypeScriptビルド
cd backend
npm run build

# サーバー起動
npm start

# または開発モード (自動再起動)
npm run dev
```

サーバーが起動すると `http://localhost:3000` でアクセス可能になります。

## 使用方法

### シナリオ 1: callback URLありのログイン

1. ログイン画面にアクセス (callback URL付き):
   ```
   http://localhost:3000/login?callback=https://example.com/dashboard
   ```

2. ログインボタンをクリック

3. JWTフラグメント付きURLにリダイレクト:
   ```
   https://example.com/dashboard#eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### シナリオ 2: callback URLなしのログイン

1. ログイン画面にアクセス:
   ```
   http://localhost:3000/login
   ```

2. ログインボタンをクリック

3. ログイン画面に留まる (リダイレクトなし)

### シナリオ 3: API直接呼び出し

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"callback":"https://example.com/dashboard"}'
```

レスポンス:
```json
{
  "redirectUrl": "https://example.com/dashboard#eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## テスト

```bash
cd backend

# 全テスト実行
npm test

# 契約テスト実行
npm run test:contract

# 統合テスト実行
npm run test:integration

# ユニットテスト実行
npm run test:unit

# カバレッジ確認
npm run test:coverage
```

## JWT検証

生成されたJWTトークンを検証:

```bash
cd backend
npx ts-node scripts/verify-jwt.ts <JWT_TOKEN>
```

出力例:
```
🔍 JWT Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

📦 JWT Payload:
{
  "userId": "hardcoded-user-id",
  "accessToken": "hardcoded-access-token",
  "exp": 1734567890
}

✅ Payload Validation:
  userId: ✅ (hardcoded-user-id)
  accessToken: ✅ (hardcoded-access-token)
  exp: 1734567890 (expires in 7 days)
  ✅ Token is still valid

🔐 Signature Verification:
  ✅ Signature is valid
```

## API仕様

### POST /api/auth/login

ログイン処理とJWT発行

**リクエスト**:
```json
{
  "callback": "https://example.com/dashboard" // オプション
}
```

**レスポンス**:
```json
{
  "redirectUrl": "https://example.com/dashboard#eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /login

多言語対応のログイン画面HTMLを返却

**クエリパラメータ**:
- `callback` (オプション): リダイレクト先URL

### GET /health

ヘルスチェック

**レスポンス**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-02T10:30:00Z"
}
```

詳細は [OpenAPI仕様](./specs/001-callback-url-jwt/contracts/auth-api.yaml) を参照してください。

## プロジェクト構造

```
.
├── backend/
│   ├── src/
│   │   ├── models/          # 型定義
│   │   ├── services/        # ビジネスロジック
│   │   ├── routes/          # エンドポイント
│   │   ├── middleware/      # ミドルウェア
│   │   ├── scripts/         # ユーティリティスクリプト
│   │   └── app.ts           # Expressアプリケーション
│   └── tests/
│       ├── contract/        # 契約テスト
│       ├── integration/     # 統合テスト
│       ├── unit/            # ユニットテスト
│       └── performance/     # パフォーマンステスト
├── frontend/
│   ├── public/
│   │   └── login.html       # ログイン画面
│   └── src/
│       ├── js/              # フロントエンドJS
│       └── locales/         # 翻訳ファイル
└── specs/                   # 設計ドキュメント
```

## パフォーマンス

- **レスポンスタイム目標**: <500ms
- **処理能力目標**: 100 req/s

パフォーマンステストで検証:
```bash
npm run test:performance
```

## 多言語対応

サポート言語:
- 日本語 (ja)
- 英語 (en)
- 中国語 (zh)

ブラウザの`Accept-Language`ヘッダーから自動検出。サポート外の言語は英語にフォールバック。

## 開発

### コードフォーマット

```bash
cd backend
npm run format
```

### リント

```bash
cd backend
npm run lint
```

## 関連ドキュメント

- [機能仕様](./specs/001-callback-url-jwt/spec.md)
- [技術調査](./specs/001-callback-url-jwt/research.md)
- [データモデル](./specs/001-callback-url-jwt/data-model.md)
- [実装計画](./specs/001-callback-url-jwt/plan.md)
- [タスク一覧](./specs/001-callback-url-jwt/tasks.md)
- [クイックスタート](./specs/001-callback-url-jwt/quickstart.md)

## ライセンス

ISC
