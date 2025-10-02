# ログインインターフェース仕様

**日付**: 2025-10-02
**バージョン**: 1.0.0
**プロジェクト**: モックログイン認証サービス

---

## 概要

このドキュメントは、モックログイン認証サービスのインターフェース仕様を定義します。
Node.js + Expressバックエンドで、POSTリクエストボディからコールバックURLを受け取り、Bootstrap 5でスタイリングされたログイン画面を返却します。

---

## エンドポイント

### ログインページ

**URL**: `https://<host>/auth`

**メソッド**: POST

**リクエストボディ**:
| パラメータ名 | 型 | 必須 | 説明 | デフォルト値 |
|------------|-----|------|------|------------|
| callback | string | ❌ | 認証成功後のリダイレクト先URL | https://example.com/auth-success |

**Content-Type**: `application/json` または `application/x-www-form-urlencoded`

**例（JSON）**:
```bash
curl -X POST https://auth.example.com/auth \
  -H "Content-Type: application/json" \
  -d '{"callback": "https://myapp.com/dashboard"}'
```

**例（Form）**:
```bash
curl -X POST https://auth.example.com/auth \
  -d "callback=https://myapp.com/dashboard"
```

**レスポンス**: HTML（ログイン画面、Bootstrap 5でスタイリング済み）

---

## 入力（フォーム）

### フィールド定義

| フィールド名 | HTML要素 | 型 | 必須 | バリデーション | 説明 |
|------------|---------|-----|------|--------------|------|
| companyId | `<input type="text" class="form-control">` | string | ✅ | 空でないこと | 企業ID（Bootstrapスタイル） |
| email | `<input type="email" class="form-control">` | string | ✅ | 空でないこと | メールアドレス（Bootstrapスタイル） |
| password | `<input type="password" class="form-control">` | string | ✅ | 空でないこと | パスワード（Bootstrapスタイル） |

**Bootstrapクラス使用**:
- `form-control`: フィールドのスタイリング
- `is-invalid`: バリデーションエラー時に追加
- `invalid-feedback`: エラーメッセージ表示

### フォーム送信

**トリガー**: ログインボタンのクリック

**動作**:
1. バリデーション実行
2. エラーがある場合:
   - 該当フィールドをハイライト表示
   - フォーム送信を中止
3. エラーがない場合:
   - JWT生成
   - リダイレクト実行

---

## 出力（リダイレクト）

### リダイレクト仕様

**リダイレクト先URL**:
```
{callbackUrl}#token={jwt}
```

**例**:
```
https://myapp.com/dashboard#token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb21wYW55SWQiOiJjb21wYW55LTEyMyIsInVzZXJJZCI6Im1vY2stdXNlci0xMjMiLCJhY2Nlc3NUb2tlbiI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NWQ0MDBhMCIsImV4cGlyZXNBdCI6MTY5NjMyMzYwMH0.XYZ123abc
```

### URLフラグメント形式

**形式**: `#token={jwt}`

**理由**:
- URLフラグメントはサーバーに送信されない（セキュリティ）
- JavaScriptで簡単に取得可能
- SPA（Single Page Application）との親和性が高い

**取得方法（呼び出し側）**:
```javascript
// リダイレクト先ページで実行
const fragment = window.location.hash; // "#token=eyJ..."
const token = fragment.replace('#token=', '');
```

---

## JWT構造

### ヘッダー

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### ペイロード

```json
{
  "companyId": "<入力された企業ID>",
  "userId": "mock-user-123",
  "accessToken": "<UUID v4>",
  "expiresAt": <現在時刻 + 86400秒のUnix timestamp>
}
```

**フィールド説明**:
| フィールド名 | 型 | 説明 | 例 |
|------------|-----|------|-----|
| companyId | string | ユーザーが入力した企業ID | "company-123" |
| userId | string | ハードコードされたユーザーID | "mock-user-123" |
| accessToken | string | ランダム生成されたUUID v4 | "550e8400-e29b-41d4-a716-446655d400a0" |
| expiresAt | number | アクセストークンの有効期限（Unix timestamp） | 1696323600 |

### 署名

**アルゴリズム**: HMAC SHA256

**秘密鍵**: `"mock-secret-key-do-not-use-in-production"`（ハードコード）

**注意**: モック用途のため秘密鍵がハードコードされています。本番環境では使用しないでください。

### 有効期限

**JWT自体の有効期限（exp claim）**: なし（無期限、FR-007）

**アクセストークンの有効期限（expiresAtフィールド）**: 24時間（86400秒、FR-006）

---

## エラーハンドリング

### バリデーションエラー

**トリガー**: 入力フィールドが空

**動作**:
1. 該当フィールドに `error` クラスを追加
2. 赤枠またはハイライトで視覚的にフィードバック
3. リダイレクトは実行しない

**例（Bootstrap使用）**:
```html
<div class="mb-3">
  <label for="companyId" class="form-label">企業ID</label>
  <input type="text" class="form-control is-invalid" id="companyId">
  <div class="invalid-feedback">
    企業IDを入力してください
  </div>
</div>
```

### コールバックURL未提供

**トリガー**: POSTリクエストボディに `callback` がない

**動作**:
- デフォルトURL（`https://example.com/auth-success`）を使用
- エラーは発生しない

---

## セキュリティ考慮事項

### HTTPS必須

**理由**: URLパラメータとフラグメントが平文で送信されるため

**推奨**: すべての通信をHTTPSで行う

### CORS設定

**必要性**: なし（静的HTMLページのため）

### XSS対策

**対策**:
- ユーザー入力をそのままDOMに挿入しない
- エスケープ処理を実施

---

## 使用例

### 1. 正常系フロー

```
1. SaaSアプリがPOSTリクエスト送信
   POST https://auth.example.com/auth
   Body: {"callback": "https://myapp.com/dashboard"}

2. ログイン画面表示（Bootstrap 5スタイル）
   - 企業ID: company-123
   - メール: user@example.com
   - パスワード: password123

3. ログインボタンクリック

4. JWT生成（クライアント側）
   ペイロード: {"companyId":"company-123","userId":"mock-user-123",...}

5. リダイレクト
   https://myapp.com/dashboard#token=eyJhbGci...
```

### 2. バリデーションエラー

```
1. ユーザーがアクセス

2. ログイン画面表示
   - 企業ID: （空）
   - メール: user@example.com
   - パスワード: password123

3. ログインボタンクリック

4. バリデーションエラー
   - 企業IDフィールドが赤枠で表示
   - リダイレクトなし
```

### 3. コールバックURL未提供

```
1. SaaSアプリがPOSTリクエスト送信（callbackなし）
   POST https://auth.example.com/auth
   Body: {}

2. デフォルトURLを設定
   callbackUrl = "https://example.com/auth-success"

3. ログイン成功後
   https://example.com/auth-success#token=eyJhbGci...
```

---

## テスト仕様

### 手動テストケース

| # | テストケース | 期待結果 |
|---|------------|---------|
| 1 | すべてのフィールドを入力してログイン | JWTが生成され、コールバックURLにリダイレクト |
| 2 | 企業IDを空にしてログイン | 企業IDフィールドがハイライト、リダイレクトなし |
| 3 | メールを空にしてログイン | メールフィールドがハイライト、リダイレクトなし |
| 4 | パスワードを空にしてログイン | パスワードフィールドがハイライト、リダイレクトなし |
| 5 | コールバックURLなしでアクセス | デフォルトURLにリダイレクト |
| 6 | JWTペイロードを確認 | companyId, userId, accessToken, expiresAtが含まれる |
| 7 | アクセストークン有効期限を確認 | 現在時刻+24時間 |

---

## バージョン履歴

| バージョン | 日付 | 変更内容 |
|----------|------|---------|
| 1.0.0 | 2025-10-02 | 初版作成 |

---

## 参考資料

- [JWT仕様（RFC 7519）](https://tools.ietf.org/html/rfc7519)
- [jose ライブラリ](https://github.com/panva/jose)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
