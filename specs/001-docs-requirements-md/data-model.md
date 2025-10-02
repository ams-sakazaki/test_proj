# データモデル: ログイン認証サービス

**日付**: 2025-10-02
**プロジェクト**: モックログイン認証サービス
**目的**: エンティティ定義とデータ構造の明確化

---

## エンティティ一覧

### 1. LoginCredentials（ログイン資格情報）

**説明**: ユーザーがログインフォームに入力する認証情報

**フィールド**:
| フィールド名 | 型 | 必須 | 説明 | バリデーション |
|------------|-----|------|------|--------------|
| companyId | string | ✅ | 企業ID | 空でないこと |
| email | string | ✅ | メールアドレス | 空でないこと |
| password | string | ✅ | パスワード | 空でないこと |

**バリデーションルール**:
- すべてのフィールドが空でないことを確認（フロントエンド検証のみ）
- 形式チェックは不要（モックサービスのため）
- どの値でも受け付ける（FR-010）

**ライフサイクル**:
1. ユーザーがフォームに入力
2. バリデーション実行
3. JWT生成に使用
4. 破棄（保存しない）

---

### 2. JWTPayload（JWTペイロード）

**説明**: 生成されるJWTトークンに含まれるペイロードデータ

**フィールド**:
| フィールド名 | 型 | 必須 | 説明 | 値 |
|------------|-----|------|------|-----|
| companyId | string | ✅ | 企業ID | 入力値をそのまま使用 |
| userId | string | ✅ | ユーザーID | ハードコード: "mock-user-123" |
| accessToken | string | ✅ | アクセストークン | UUID v4（ランダム生成） |
| expiresAt | number | ✅ | アクセストークン有効期限 | Unix timestamp（現在時刻 + 86400秒） |

**生成ロジック**:
```javascript
const payload = {
  companyId: loginCredentials.companyId,
  userId: "mock-user-123",
  accessToken: crypto.randomUUID(),
  expiresAt: Math.floor(Date.now() / 1000) + 86400
};
```

**JWT構造**:
- ヘッダー: `{ "alg": "HS256", "typ": "JWT" }`
- ペイロード: 上記フィールド
- 署名: HMAC SHA256（秘密鍵: "mock-secret-key-do-not-use-in-production"）
- 有効期限（exp claim）: なし（JWT自体は無期限、FR-007）

---

### 3. CallbackParameters（コールバックパラメータ）

**説明**: 認証後のリダイレクト先を決定するパラメータ

**フィールド**:
| フィールド名 | 型 | 必須 | 説明 | デフォルト値 |
|------------|-----|------|------|------------|
| callbackUrl | string | ❌ | コールバックURL | https://example.com/auth-success |

**取得方法**:
- URLクエリパラメータ `?callback=<URL>` から取得
- 未提供の場合はデフォルト値を使用（FR-001）

**使用例**:
```
入力URL: https://auth.example.com/?callback=https://myapp.com/dashboard
リダイレクト先: https://myapp.com/dashboard#token=eyJhbG...
```

---

## データフロー

### 全体フロー図

```
[ユーザー入力]
  ↓
[LoginCredentials]
  ├─ companyId ──┐
  ├─ email       │（バリデーション）
  └─ password ───┘
  ↓
[JWT生成]
  ├─ companyId → JWTPayload.companyId
  ├─ "mock-user-123" → JWTPayload.userId
  ├─ UUID v4 → JWTPayload.accessToken
  └─ 現在時刻+24h → JWTPayload.expiresAt
  ↓
[JWT文字列]
  ↓
[リダイレクト]
  └─ {callbackUrl}#token={jwt}
```

### シーケンス

1. **ページロード**
   - URLパラメータから `callbackUrl` を取得
   - デフォルト値を設定（未提供の場合）

2. **ユーザー入力**
   - フォームに `companyId`, `email`, `password` を入力

3. **ログインボタンクリック**
   - バリデーション実行（空チェック）
   - エラーがあれば該当フィールドをハイライト（FR-009）
   - エラーなければJWT生成へ進む

4. **JWT生成**
   - `JWTPayload` オブジェクトを構築
   - jose/jsonwebtoken で署名
   - JWT文字列を取得

5. **リダイレクト**
   - `{callbackUrl}#token={jwt}` へリダイレクト（FR-008）

---

## 状態管理

### UIステート

| 状態 | 説明 | 表示 |
|------|------|------|
| Initial | 初期状態 | 入力フォームとログインボタン |
| Validating | バリデーション中 | ボタン無効化 |
| ValidationError | バリデーションエラー | エラーフィールドをハイライト |
| Generating | JWT生成中 | ローディング表示 |
| Redirecting | リダイレクト中 | ローディング表示 |

### 状態遷移図

```
Initial
  ↓ [ログインボタンクリック]
Validating
  ├─ [エラーあり] → ValidationError → Initial（ユーザー修正後）
  └─ [エラーなし] → Generating → Redirecting
```

---

## 型定義（TypeScript参考）

```typescript
// ログイン資格情報
interface LoginCredentials {
  companyId: string;
  email: string;
  password: string;
}

// JWTペイロード
interface JWTPayload {
  companyId: string;
  userId: string;
  accessToken: string;
  expiresAt: number; // Unix timestamp
}

// コールバックパラメータ
interface CallbackParameters {
  callbackUrl: string;
}

// バリデーション結果
interface ValidationResult {
  isValid: boolean;
  errors: {
    companyId?: string;
    email?: string;
    password?: string;
  };
}
```

---

## セキュリティとプライバシー

**注意事項**:
- このサービスはモック用途のみ
- 本番環境では使用しないこと
- 秘密鍵がハードコードされている
- 実際の認証は行われない（どの値でもログイン成功）
- HTTPS必須（平文で送信されるため）

**推奨事項**:
- 本番環境では適切な認証サービス（Auth0, Firebase Auth等）を使用
- 秘密鍵は環境変数で管理
- JWTの有効期限を適切に設定
- トークンのリフレッシュ機能を実装

---

## まとめ

すべてのエンティティとデータフローが定義されました。
次のステップ: コントラクト定義（contracts/login-interface.md）
