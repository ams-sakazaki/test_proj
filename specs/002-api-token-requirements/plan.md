# Implementation Plan: 認証APIパラメータ変更とトークンエンドポイント追加

**Feature Branch**: `002-api-token-requirements`
**Created**: 2025-10-15
**Status**: Ready for Implementation

## Execution Flow (main)
```
1. Parse feature spec from FEATURE_SPEC
   → OAuth2-style authentication API with parameter changes and new token endpoint
2. Load constitution.md (if exists)
   → No specific project constitution defined (template only)
3. Fill Technical Context section
   → Node.js/Express/EJS stack, mock service, no database
4. Fill Constitution Check section
   → Validated against CLAUDE.md development principles
5. Run Phase 0: Research
   → Analyzed existing /auth endpoint and JWT generation logic
6. Run Phase 1: Design & Contracts
   → Defined API contracts for both endpoints
7. Fill Phase 2: Tasks section
   → Implementation approach documented
8. Return: SUCCESS (plan ready for /tasks)
```

---

## Technical Context

### Language & Stack
- **言語**: JavaScript (Node.js >= 22.0.0)
- **フレームワーク**: Express 4.18.2
- **テンプレートエンジン**: EJS 3.1.9
- **フロントエンド**: Bootstrap 5, vanilla JavaScript with jose library for JWT
- **開発ツール**: nodemon 3.0.1

### Platform & Deployment
- **プラットフォーム**: Linux (AWS Lightsail)
- **プロセス管理**: PM2
- **リバースプロキシ**: Nginx
- **SSL**: Let's Encrypt
- **ドメイン**: https://dummyauth.prams-rfid.com

### Dependencies
- **本番依存関係**:
  - express: HTTPサーバー
  - ejs: サーバーサイドテンプレート
- **クライアント依存関係**:
  - jose: JWT生成（CDN経由）
  - Bootstrap 5: UIコンポーネント（CDN経由）

### Architecture Notes
- モックサービスのためデータベース不要
- すべてのレスポンスは固定値
- パラメータバリデーション不要
- 既存の認証ページUI（企業ID、メールアドレス、パスワードのフォーム）を維持

---

## Constitution Check

### CLAUDE.md 開発原則への準拠

#### 開発原則1: 日本語使用
✅ **準拠**: すべてのドキュメント、コメント、変数名（必要に応じて）を日本語で記述

#### 開発原則2: UTF-8エンコード
✅ **準拠**: すべてのテキストファイルをUTF-8エンコードで生成

#### 開発原則3: 計画失敗時の確認
✅ **準拠**: 実装中に問題が発生した場合、代替案を勝手に実行せず確認を取る

#### 開発原則4: 最低限の機能実装
✅ **準拠**: 仕様に記載された機能のみを実装し、過剰な機能追加を行わない
- `/auth/sso/authorize` エンドポイント（既存 `/auth` の変更）
- `/auth/sso/token` エンドポイント（新規）
- 既存UIの維持
- 固定レスポンスのみ

#### 開発原則5: ユーザー決定権の尊重
✅ **準拠**: 仕様通りに実装し、最適化や変更を勝手に行わない

#### 開発原則6: ルール遵守
✅ **準拠**: これらの原則を歪曲せず厳格に遵守

### プロジェクト固有の制約
- **モックサービス**: テスト駆動開発不要（requirements.mdに明記）
- **Bootstrap使用**: 表示周りにはBootstrapを積極的に使用（既に適用済み）
- **固定値レスポンス**: すべてのAPIレスポンスは固定値

---

## Phase 0: Research

### 既存実装の調査

#### 現在の `/auth` エンドポイント (server/routes/auth.js:8-18)
```javascript
router.post('/auth', (req, res) => {
  const callbackUrl = req.body.redirect_uri || DEFAULT_CALLBACK_URL;
  console.log(`POST /auth リクエスト受信 - redirect_uri: ${callbackUrl}`);
  res.render('login', {
    callbackUrl: callbackUrl
  });
});
```
**所見**:
- 既に `redirect_uri` パラメータを受け取っている（前回の変更で実装済み）
- 他のOAuth2パラメータ（client_id, response_type, state, service_id）は受け取っていない
- ログインページ（login.ejs）をレンダリング

#### 現在のJWT生成とリダイレクト (public/js/auth.js:54-88)
```javascript
// JWTペイロード生成
const payload = {
  userId: 'USER-2025-001',
  userName: '山田太郎',
  companyId: 'COMP-2025-001',
  companyName: '株式会社サンプル商事',
  storeId: 'xn-ams-nk4c6lre4725av5km35dro0d.myshopify.com',
  storeName: 'サンプルストア東京',
  accessToken: crypto.randomUUID(),
  expireAt: Math.floor(Date.now() / 1000) + 86400,
  ecserviceAccessToken: 'mock_shopify_admin_access_token_xxxxx',
};

// JWT生成（joseライブラリ使用）
const jwt = await new window.SignJWT(payload)
  .setProtectedHeader({ alg: 'HS256' })
  .sign(secret);

// コールバックURLにリダイレクト
const redirectUrl = `${callbackUrl}#token=${jwt}`;
window.location.href = redirectUrl;
```
**所見**:
- クライアントサイドでJWT生成している（joseライブラリ使用）
- リダイレクトはURLフラグメント形式 `#token=${jwt}`
- 新仕様では `#code=xxx&state=yyy` 形式に変更が必要

#### 認証ページUI
- 既存のフォーム: 企業ID、メールアドレス、パスワード
- Bootstrap 5スタイリング適用済み
- **仕様**: このUIは維持する

### 新規実装が必要な項目

#### 1. `/auth/sso/authorize` エンドポイント変更
- **変更点**:
  - エンドポイントパス: `/auth` → `/auth/sso/authorize`
  - 受け取りパラメータ追加: client_id, response_type, state, service_id
  - リダイレクト形式変更: `#token=${jwt}` → `#code=${固定値}&state=${受信値}`

#### 2. `/auth/sso/token` エンドポイント（新規）
- **実装内容**:
  - POSTエンドポイント
  - grant_type による分岐処理:
    - `authorization_code`: フル情報（user, service含む）を返却
    - `refresh_token`: access_tokenとrefresh_tokenのみ返却
  - すべて固定値のJSON応答

### 技術的課題と解決策

#### 課題1: JWT生成場所
**現状**: クライアントサイドでJWT生成
**新仕様**: `/auth/sso/token` エンドポイントでJWT返却が必要
**解決策**: 
- クライアントサイドのJWT生成ロジックは削除せず、単純化（固定codeのみ返却）
- サーバーサイドで新たにJWT生成ロジックを実装

#### 課題2: JWT生成ライブラリ
**選択肢**: 
1. jsonwebtoken (npmパッケージ、最も一般的)
2. jose (Node.js版、クライアントで既に使用中)
**推奨**: jsonwebtoken（サーバーサイドで標準的、シンプル）

#### 課題3: 固定JWT文字列の生成方法
**要件**: 有効なJWT形式だがペイロードは空またはダミー
**実装方針**: 
- 空のペイロード `{}` または最小限のダミーペイロード `{sub: "mock"}`
- 固定シークレットで署名
- access_tokenとrefresh_tokenは異なる固定文字列（事前生成）

### 依存関係の追加
```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.0"
  }
}
```

---

## Phase 1: Design & Contracts

### API Contracts

#### Contract 1: POST /auth/sso/authorize

**目的**: OAuth2認証コードフローの認証ページ表示

**リクエスト**:
```
POST /auth/sso/authorize
Content-Type: application/x-www-form-urlencoded

client_id=<string>
redirect_uri=<url>
response_type=<string>
state=<string>
service_id=<string>
```

**レスポンス**:
- **Content-Type**: text/html
- **ボディ**: 認証ページHTML（既存のlogin.ejsテンプレート）

**ログインボタン押下後の動作**:
```
リダイレクト先: ${redirect_uri}#code=11d37eec2cb0d6be13a61282ff894c87359e6e5af170fe3a70fc74e2497a948d&state=${受信したstate}

例:
https://example.com/callback#code=11d37eec2cb0d6be13a61282ff894c87359e6e5af170fe3a70fc74e2497a948d&state=abc123
```

**バリデーション**: なし（モックサービスのため）

---

#### Contract 2: POST /auth/sso/token

**目的**: 認証コードまたはリフレッシュトークンをアクセストークンに交換

**リクエスト（grant_type: authorization_code）**:
```
POST /auth/sso/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
code=<string>
client_id=<string>
client_secret=<string>
redirect_uri=<url>
```

**レスポンス（grant_type: authorization_code）**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLWFjY2VzcyJ9.xxxxxxxxxxx",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXJlZnJlc2gifQ.yyyyyyyyyyy",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "company-admin-uuid-001",
    "email": "admin@dbtest.com",
    "name": "admin",
    "company_id": "34025c02-8732-473b-a3a2-07c4026c55ec",
    "company_code": "DB-INT-TEST-001",
    "roles": ["company_admin"]
  },
  "service": {
    "id": "8d33a262-5619-4254-85ba-1bc75ce049ce",
    "serviceCode": "shopify-order",
    "serviceName": "Shopifyオーダー",
    "externalApiConfig": {
      "shopify": {
        "adminAccessToken": "mock_shopify_admin_access_token_xxxxx",
        "storeAccessToken": "mock_shopify_store_access_token_xxxxx",
        "shopDomain": "xn-ams-nk4c6lre4725av5km35dro0d.myshopify.com"
      }
    }
  }
}
```

**リクエスト（grant_type: refresh_token）**:
```
POST /auth/sso/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
refresh_token=<string>
```

**レスポンス（grant_type: refresh_token）**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLWFjY2VzcyJ9.xxxxxxxxxxx",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrLXJlZnJlc2gifQ.yyyyyyyyyyy"
}
```

**バリデーション**: なし（モックサービスのため）

**エラーレスポンス**: なし（すべて成功レスポンスを返す）

---

### Data Model

**該当なし**: モックサービスのためデータベースやデータモデルは不要。すべて固定値のレスポンスを返却する。

固定値の定義:
```javascript
// 固定の認証コード
const FIXED_AUTH_CODE = "11d37eec2cb0d6be13a61282ff894c87359e6e5af170fe3a70fc74e2497a948d&";

// 固定のJWTトークン（事前生成）
const FIXED_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const FIXED_REFRESH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// 固定のユーザー情報
const MOCK_USER = {
  id: "company-admin-uuid-001",
  email: "admin@dbtest.com",
  name: "admin",
  company_id: "34025c02-8732-473b-a3a2-07c4026c55ec",
  company_code: "DB-INT-TEST-001",
  roles: ["company_admin"]
};

// 固定のサービス情報
const MOCK_SERVICE = {
  id: "8d33a262-5619-4254-85ba-1bc75ce049ce",
  serviceCode: "shopify-order",
  serviceName: "Shopifyオーダー",
  externalApiConfig: {
    shopify: {
      adminAccessToken: "mock_shopify_admin_access_token_xxxxx",
      storeAccessToken: "mock_shopify_store_access_token_xxxxx",
      shopDomain: "xn-ams-nk4c6lre4725av5km35dro0d.myshopify.com"
    }
  }
};
```

---

### Quickstart

#### ローカル開発環境でのテスト

**1. 依存関係のインストール**
```bash
cd /home/dev/Project/auth-api/auth-app
npm install
```

**2. 開発サーバー起動**
```bash
npm run dev
```

**3. OAuth2フローのテスト**

**ステップ1: 認証ページ表示**
```bash
curl -X POST http://localhost:3000/auth/sso/authorize \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=test-client" \
  -d "redirect_uri=https://example.com/callback" \
  -d "response_type=code" \
  -d "state=random-state-123" \
  -d "service_id=test-service"
```
→ HTMLページが返却される

**ステップ2: ブラウザで認証ページアクセス**
```
Postmanまたはブラウザで POST http://localhost:3000/auth/sso/authorize
Body (x-www-form-urlencoded):
  client_id: test-client
  redirect_uri: http://localhost:3000/callback-test
  response_type: code
  state: my-state-123
  service_id: shopify-order
```
→ ログインボタンをクリック
→ `http://localhost:3000/callback-test#code=11d37...&state=my-state-123` にリダイレクト

**ステップ3: トークン取得（authorization_code）**
```bash
curl -X POST http://localhost:3000/auth/sso/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=11d37eec2cb0d6be13a61282ff894c87359e6e5af170fe3a70fc74e2497a948d&" \
  -d "client_id=test-client" \
  -d "client_secret=test-secret" \
  -d "redirect_uri=https://example.com/callback"
```
→ JSONレスポンス（access_token, refresh_token, user, service含む）

**ステップ4: トークン更新（refresh_token）**
```bash
curl -X POST http://localhost:3000/auth/sso/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
→ JSONレスポンス（access_tokenとrefresh_tokenのみ）

---

## Phase 2: Tasks (Approach)

実装タスクは以下のカテゴリに分類され、dependency順に実行される:

### カテゴリ1: サーバーサイド準備
1. **依存関係追加**: jsonwebtokenパッケージのインストール
2. **固定値モジュール作成**: 固定JWT、ユーザー、サービス情報を定義する共通モジュール

### カテゴリ2: エンドポイント実装
3. **`/auth/sso/authorize` エンドポイント実装**:
   - 既存 `/auth` を `/auth/sso/authorize` に変更
   - OAuth2パラメータ（client_id, response_type, state, service_id）を受け取る
   - stateをEJSテンプレートに渡す
4. **クライアントサイドリダイレクト変更**:
   - `public/js/auth.js` を修正
   - JWT生成ロジックを削除
   - 固定code値とstate値をURLフラグメントで返却

### カテゴリ3: 新規トークンエンドポイント
5. **`/auth/sso/token` エンドポイント実装**:
   - POSTエンドポイント追加
   - grant_type による分岐処理
   - 固定値JSONレスポンス返却

### カテゴリ4: テストと検証
6. **ローカルテスト**: curlコマンドでエンドポイントテスト
7. **統合テスト**: ブラウザでOAuth2フロー全体をテスト
8. **本番デプロイ**: PM2再起動とnginx設定確認

### 依存関係
- タスク2は独立
- タスク3,4はタスク2に依存（固定値を使用）
- タスク5はタスク2に依存
- タスク6,7はタスク3,4,5完了後
- タスク8はタスク6,7完了後

### 非機能要件
- **UTF-8 BOM**: すべての新規ファイルはUTF-8 BOM付きで生成
- **既存UI維持**: login.ejsテンプレートは変更しない（stateパラメータ追加のみ）
- **ログ**: console.logで各エンドポイントのアクセスログ出力

---

## Review Checklist

### Phase 0 Completion
- [x] 既存実装の調査完了（/auth エンドポイント、JWT生成、UI）
- [x] 技術的課題の特定（JWT生成場所、ライブラリ選定、固定値生成）
- [x] 依存関係の追加特定（jsonwebtoken）

### Phase 1 Completion
- [x] API契約定義完了（2エンドポイント）
- [x] リクエスト/レスポンス形式明確化
- [x] 固定値の定義完了
- [x] Quickstartガイド作成完了

### Phase 2 Readiness
- [x] タスクカテゴリ分類完了
- [x] 依存関係マップ作成完了
- [x] 非機能要件の明確化完了

### Constitution Compliance
- [x] CLAUDE.md開発原則への準拠確認
- [x] UTF-8 BOMエンコード要件の明記
- [x] 最低限の機能実装方針の確認
- [x] モックサービス制約の理解

---

## Next Steps

**Ready for**: `/tasks` コマンド実行

`/tasks` コマンドを実行すると、Phase 2で定義したアプローチに基づいて、具体的な実装タスク（tasks.md）が生成されます。

**Expected tasks.md structure**:
```markdown
# Task 1: 依存関係追加
Status: pending
Dependencies: なし
Description: jsonwebtokenパッケージをインストール

# Task 2: 固定値モジュール作成
Status: pending
Dependencies: Task 1
Description: server/constants/mockData.js を作成

# Task 3: /auth/sso/authorize エンドポイント実装
...
```

---

**Plan Status**: ✅ Complete and ready for task generation
