# モックログイン認証サービス

SaaSアプリケーション向けのモック認証サービスです。POSTリクエストでコールバックURLを受け取り、ログイン画面を表示し、ハードコードされたJWTトークンを返却します。

## 特徴

- **モックサービス**: テスト・開発用途専用
- **POSTリクエスト対応**: コールバックURLをPOSTボディで受け取り
- **Bootstrap 5**: レスポンシブで美しいUI
- **JWT生成**: ブラウザ側でJWT生成（jose使用）
- **URLフラグメント**: `#token=...` 形式でJWTを返却

## 技術スタック

- **バックエンド**: Node.js 22+, Express 4.x, EJS
- **フロントエンド**: HTML5, CSS3, JavaScript ES6+, Bootstrap 5
- **JWT生成**: jose (CDN経由)

## セットアップ

### 前提条件

- Node.js 22以降

### インストール

```bash
# リポジトリをクローン
cd auth-app

# 依存関係をインストール
npm install
```

### 起動

```bash
# 開発モード（nodemon使用）
npm run dev

# 本番モード
npm start
```

サーバーは http://localhost:3000 で起動します。

## 使用方法

### POSTリクエストでログイン画面を表示

```bash
# curlを使用した例
curl -X POST http://localhost:3000/auth \
  -H "Content-Type: application/json" \
  -d '{"callback": "https://myapp.com/dashboard"}'
```

または

```bash
# フォームデータとして送信
curl -X POST http://localhost:3000/auth \
  -d "callback=https://myapp.com/dashboard"
```

### ログインフロー

1. SaaSアプリが `/auth` にPOSTリクエスト送信
2. ログイン画面が表示される（Bootstrap 5スタイル）
3. ユーザーが企業ID、メール、パスワードを入力
4. ログインボタンをクリック
5. ブラウザ側でJWT生成
6. `{callbackUrl}#token={jwt}` にリダイレクト

### JWTペイロード

```json
{
  "companyId": "<入力された企業ID>",
  "userId": "mock-user-123",
  "accessToken": "<UUID v4>",
  "expiresAt": <現在時刻 + 86400秒>
}
```

- **署名アルゴリズム**: HS256
- **秘密鍵**: `mock-secret-key-do-not-use-in-production`
- **JWT有効期限**: 無制限（exp claimなし）
- **アクセストークン有効期限**: 24時間

## 環境変数

`.env.example` を参考に `.env` ファイルを作成できます（オプション）。

```bash
PORT=3000
DEFAULT_CALLBACK_URL=https://example.com/auth-success
JWT_SECRET=mock-secret-key-do-not-use-in-production
```

## プロジェクト構造

```
auth-app/
├── server/
│   ├── index.js         # Expressサーバー
│   ├── routes/
│   │   └── auth.js      # POST /auth エンドポイント
│   └── views/
│       └── login.ejs    # ログイン画面テンプレート
├── public/
│   ├── css/
│   │   └── custom.css   # カスタムスタイル
│   └── js/
│       └── auth.js      # JWT生成とリダイレクト
├── package.json
└── README.md
```

## テスト

手動テストシナリオは `/specs/001-docs-requirements-md/quickstart.md` を参照してください。

### テストシナリオ

1. 正常系: すべてのフィールドを入力してログイン
2. エッジケース: 入力フィールドが空
3. エッジケース: コールバックURLなし
4. 認証チェックなし: どの値でもログイン成功

## 注意事項

⚠️ **このサービスはモック用途専用です**

- 本番環境では絶対に使用しないでください
- 秘密鍵がハードコードされています
- 実際の認証は行われません（どの入力値でもログイン成功）
- セキュリティ対策は最小限です

## ライセンス

MIT

## 関連ドキュメント

- [仕様書](../specs/001-docs-requirements-md/spec.md)
- [実装プラン](../specs/001-docs-requirements-md/plan.md)
- [クイックスタート](../specs/001-docs-requirements-md/quickstart.md)
- [タスクリスト](../specs/001-docs-requirements-md/tasks.md)
