
**Feature Branch**: `002-api-token-requirements`
**Input**: Design documents from `/home/dev/Project/auth-api/specs/002-api-token-requirements/`
**Prerequisites**: plan.md (available), spec.md (available)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: Node.js/Express/EJS, Bootstrap 5
   → Architecture: モックサービス、固定値レスポンス、バリデーション不要
2. Load optional design documents:
   → data-model.md: 該当なし（モックサービスのためデータモデル不要）
   → contracts/: 該当なし（plan.mdに契約定義済み）
   → research.md: 該当なし（plan.mdにPhase 0リサーチ含む）
3. Generate tasks by category:
   → Setup: 依存関係追加、固定値モジュール作成
   → Tests: モックサービスのためTDD不要（requirements.mdに明記）
   → Core: エンドポイント実装、クライアント修正
   → Integration: 該当なし（既存システム統合済み）
   → Polish: 動作確認テスト、本番デプロイ
4. Apply task rules:
   → T001-T002: 準備作業（順次実行）
   → T003-T004: 異なるファイル（並列可能 [P]）
   → T005: サーバーサイド新規エンドポイント
   → T006-T008: テストと検証（順次実行）
5. Number tasks sequentially (T001-T008)
6. Generate dependency graph
7. Validate task completeness
8. Return: SUCCESS (tasks ready for execution)
```

---

## Format: `[ID] [P?] Description`
- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- 各タスクに正確なファイルパスを記載

---

## Phase 3.1: Setup（セットアップ）

### T001: 依存関係追加
**Status**: pending
**Parallel**: No
**Dependencies**: なし
**File**: `/home/dev/Project/auth-api/auth-app/package.json`

**Description**:
jsonwebtokenパッケージをpackage.jsonに追加し、npm installを実行する。

**Acceptance Criteria**:
- package.jsonの dependencies に `"jsonwebtoken": "^9.0.0"` が追加されている
- `npm install` が正常に完了する
- node_modules/jsonwebtoken/ が存在する

**Implementation Notes**:
```bash
cd /home/dev/Project/auth-api/auth-app
npm install jsonwebtoken --save
```

---

### T002: 固定値モジュール作成
**Status**: pending
**Parallel**: No
**Dependencies**: T001完了後
**File**: `/home/dev/Project/auth-api/auth-app/server/constants/mockData.js` (新規作成)

**Description**:
固定のJWTトークン、認証コード、ユーザー情報、サービス情報を定義する共通モジュールを作成する。

**Acceptance Criteria**:
- `server/constants/mockData.js` ファイルが作成されている
- UTF-8 BOMエンコードで保存されている
- 以下の定数がエクスポートされている:
  - `FIXED_AUTH_CODE`: "11d37eec2cb0d6be13a61282ff894c87359e6e5af170fe3a70fc74e2497a948d&"
  - `FIXED_ACCESS_TOKEN`: 有効なJWT形式の固定文字列
  - `FIXED_REFRESH_TOKEN`: 有効なJWT形式の固定文字列
  - `MOCK_USER`: ユーザー情報オブジェクト（spec.mdのFR-014準拠）
  - `MOCK_SERVICE`: サービス情報オブジェクト（spec.mdのFR-015, FR-016準拠）

**Implementation Notes**:
- jsonwebtokenを使用してJWTトークンを事前生成
- ペイロードは `{sub: "mock-access"}` と `{sub: "mock-refresh"}` のような最小限のダミー
- シークレットは固定値 `"mock-secret-key-do-not-use-in-production"`

**Sample Code Structure**:
```javascript
const jwt = require('jsonwebtoken');

const SECRET = 'mock-secret-key-do-not-use-in-production';

// 固定JWTトークン生成
const FIXED_ACCESS_TOKEN = jwt.sign({ sub: 'mock-access' }, SECRET);
const FIXED_REFRESH_TOKEN = jwt.sign({ sub: 'mock-refresh' }, SECRET);

const FIXED_AUTH_CODE = "11d37eec2cb0d6be13a61282ff894c87359e6e5af170fe3a70fc74e2497a948d&";

const MOCK_USER = {
  id: "company-admin-uuid-001",
  email: "admin@dbtest.com",
  name: "admin",
  company_id: "34025c02-8732-473b-a3a2-07c4026c55ec",
  company_code: "DB-INT-TEST-001",
  roles: ["company_admin"]
};

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

module.exports = {
  FIXED_AUTH_CODE,
  FIXED_ACCESS_TOKEN,
  FIXED_REFRESH_TOKEN,
  MOCK_USER,
  MOCK_SERVICE
};
```

---

## Phase 3.2: Core Implementation（コア実装）

### T003 [P]: /auth/sso/authorize エンドポイント実装
**Status**: pending
**Parallel**: Yes（T004と並列実行可能）
**Dependencies**: T002完了後
**File**: `/home/dev/Project/auth-api/auth-app/server/routes/auth.js`

**Description**:
既存の `/auth` エンドポイントを `/auth/sso/authorize` に変更し、OAuth2パラメータ（client_id, response_type, state, service_id）を受け取り、stateをテンプレートに渡す。

**Acceptance Criteria**:
- エンドポイントパスが `POST /auth/sso/authorize` に変更されている
- リクエストボディから以下のパラメータを取得: client_id, redirect_uri, response_type, state, service_id
- stateパラメータを `res.render('login', {...})` に渡している
- console.logで受信パラメータをログ出力
- バリデーションは行わない（モックサービスのため）

**Implementation Notes**:
- 既存の `/auth` エンドポイントのルート定義を変更
- `router.post('/auth/sso/authorize', (req, res) => {...})`
- `req.body.state` を取得してEJSテンプレートに渡す

**Sample Code**:
```javascript
// POST /auth/sso/authorize エンドポイント
router.post('/auth/sso/authorize', (req, res) => {
  // OAuth2パラメータを取得
  const { client_id, redirect_uri, response_type, state, service_id } = req.body;
  const callbackUrl = redirect_uri || DEFAULT_CALLBACK_URL;

  console.log(`POST /auth/sso/authorize リクエスト受信`);
  console.log(`  client_id: ${client_id}`);
  console.log(`  redirect_uri: ${redirect_uri}`);
  console.log(`  response_type: ${response_type}`);
  console.log(`  state: ${state}`);
  console.log(`  service_id: ${service_id}`);

  // ログイン画面をレンダリング（stateを渡す）
  res.render('login', {
    callbackUrl: callbackUrl,
    state: state || ''
  });
});
```

---

### T004 [P]: クライアントサイドリダイレクト変更
**Status**: pending
**Parallel**: Yes（T003と並列実行可能）
**Dependencies**: T002完了後
**File**: `/home/dev/Project/auth-api/auth-app/public/js/auth.js`

**Description**:
JWT生成ロジックを削除し、固定の認証コードとstateパラメータをURLフラグメント形式で返却するように変更する。

**Acceptance Criteria**:
- JWT生成ロジック（jose SignJWT呼び出し）が削除されている
- リダイレクトURLが `${callbackUrl}#code=${固定code}&state=${state}` 形式になっている
- 固定codeは `11d37eec2cb0d6be13a61282ff894c87359e6e5af170fe3a70fc74e2497a948d&`
- stateはサーバーから渡された値を使用
- 既存のバリデーションロジックは維持

**Implementation Notes**:
- `window.STATE` グローバル変数からstateを取得（login.ejsで設定）
- 固定codeを直接使用（モジュールインポート不要、クライアントサイドのため）
- joseライブラリの読み込みは削除可能（使用しないため）

**Sample Code**:
```javascript
// フォーム送信イベント
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // 入力値取得
  const companyId = document.getElementById('companyId').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  // バリデーション（既存ロジックを維持）
  let isValid = true;
  // ... バリデーションコード ...

  if (!isValid) {
    return;
  }

  // ローディング表示
  loginButton.disabled = true;
  loginForm.style.display = 'none';
  loadingSpinner.style.display = 'block';

  try {
    // 固定の認証コード
    const code = "11d37eec2cb0d6be13a61282ff894c87359e6e5af170fe3a70fc74e2497a948d&";
    const state = window.STATE || ''; // サーバーから渡されたstate

    // コールバックURLにリダイレクト（URLフラグメント形式）
    const callbackUrl = window.CALLBACK_URL || 'https://example.com/auth-success';
    const redirectUrl = `${callbackUrl}#code=${code}&state=${state}`;

    console.log('リダイレクト先:', redirectUrl);

    // 少し待ってからリダイレクト（UX向上）
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 500);
  } catch (error) {
    console.error('リダイレクトエラー:', error);
    alert('リダイレクト中にエラーが発生しました: ' + error.message);

    // エラー時はフォームを再表示
    loginButton.disabled = false;
    loginForm.style.display = 'block';
    loadingSpinner.style.display = 'none';
  }
});
```

**EJS Template Changes** (login.ejs):
```html
<script>
  window.CALLBACK_URL = '<%= callbackUrl %>';
  window.STATE = '<%= state %>';
</script>
```

---

### T005: /auth/sso/token エンドポイント実装
**Status**: pending
**Parallel**: No（auth.jsを変更するため、T003完了後に実行）
**Dependencies**: T002, T003完了後
**File**: `/home/dev/Project/auth-api/auth-app/server/routes/auth.js`

**Description**:
新規POSTエンドポイント `/auth/sso/token` を実装し、grant_typeによる分岐処理を行い、固定値のJSONレスポンスを返却する。

**Acceptance Criteria**:
- `POST /auth/sso/token` エンドポイントが実装されている
- grant_type が "authorization_code" の場合:
  - access_token, refresh_token, token_type, expires_in, user, service を含むJSONを返却
  - spec.mdのFR-011に準拠
- grant_type が "refresh_token" の場合:
  - access_token, refresh_token のみを含むJSONを返却
  - spec.mdのFR-013に準拠
- バリデーションは行わない（モックサービスのため）
- console.logでリクエストパラメータをログ出力

**Implementation Notes**:
- `server/constants/mockData.js` から固定値をインポート
- grant_type による分岐処理
- すべてのレスポンスは固定値

**Sample Code**:
```javascript
const {
  FIXED_ACCESS_TOKEN,
  FIXED_REFRESH_TOKEN,
  MOCK_USER,
  MOCK_SERVICE
} = require('../constants/mockData');

// POST /auth/sso/token エンドポイント
router.post('/auth/sso/token', (req, res) => {
  const { grant_type, code, client_id, client_secret, redirect_uri, refresh_token } = req.body;

  console.log(`POST /auth/sso/token リクエスト受信`);
  console.log(`  grant_type: ${grant_type}`);

  // grant_typeによる分岐
  if (grant_type === 'authorization_code') {
    console.log(`  code: ${code}`);
    console.log(`  client_id: ${client_id}`);
    console.log(`  client_secret: ${client_secret}`);
    console.log(`  redirect_uri: ${redirect_uri}`);

    // フル情報を返却
    return res.json({
      access_token: FIXED_ACCESS_TOKEN,
      refresh_token: FIXED_REFRESH_TOKEN,
      token_type: 'Bearer',
      expires_in: 900,
      user: MOCK_USER,
      service: MOCK_SERVICE
    });
  } else if (grant_type === 'refresh_token') {
    console.log(`  refresh_token: ${refresh_token}`);

    // トークンのみ返却
    return res.json({
      access_token: FIXED_ACCESS_TOKEN,
      refresh_token: FIXED_REFRESH_TOKEN
    });
  } else {
    // モックサービスのため、不正なgrant_typeでもデフォルトレスポンスを返す
    console.log(`  未知のgrant_type、デフォルトレスポンスを返却`);
    return res.json({
      access_token: FIXED_ACCESS_TOKEN,
      refresh_token: FIXED_REFRESH_TOKEN
    });
  }
});
```

---

## Phase 3.3: Polish（仕上げと検証）

### T006: ローカル動作確認テスト
**Status**: pending
**Parallel**: No
**Dependencies**: T003, T004, T005完了後
**File**: なし（手動テスト）

**Description**:
開発サーバーを起動し、curlコマンドとブラウザで両エンドポイントの動作を確認する。

**Acceptance Criteria**:
- `npm run dev` でサーバーが起動する
- `/auth/sso/authorize` エンドポイントがHTMLページを返す
- ログインボタンクリックで正しいフラグメント形式でリダイレクトされる（`#code=...&state=...`）
- `/auth/sso/token` エンドポイント（authorization_code）が正しいJSONを返す
- `/auth/sso/token` エンドポイント（refresh_token）が正しいJSONを返す

**Test Commands**:
```bash
# 1. サーバー起動
cd /home/dev/Project/auth-api/auth-app
npm run dev

# 2. /auth/sso/authorize テスト（別ターミナル）
curl -X POST http://localhost:3000/auth/sso/authorize \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=test-client" \
  -d "redirect_uri=https://example.com/callback" \
  -d "response_type=code" \
  -d "state=random-state-123" \
  -d "service_id=test-service"
# → HTMLページが返却されることを確認

# 3. /auth/sso/token テスト（authorization_code）
curl -X POST http://localhost:3000/auth/sso/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=11d37eec2cb0d6be13a61282ff894c87359e6e5af170fe3a70fc74e2497a948d&" \
  -d "client_id=test-client" \
  -d "client_secret=test-secret" \
  -d "redirect_uri=https://example.com/callback"
# → JSONレスポンス（user, service含む）が返却されることを確認

# 4. /auth/sso/token テスト（refresh_token）
curl -X POST http://localhost:3000/auth/sso/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=dummy-refresh-token"
# → JSONレスポンス（access_token, refresh_tokenのみ）が返却されることを確認

# 5. ブラウザテスト
# Postmanまたはブラウザで POST http://localhost:3000/auth/sso/authorize
# ログインボタンをクリック → リダイレクトURLのフラグメントを確認
```

**Validation**:
- すべてのcurlコマンドが期待通りのレスポンスを返す
- ブラウザでのログインフローが正常に動作する
- リダイレクトURLが `#code=11d37...&state=random-state-123` 形式になっている

---

### T007: 既存エンドポイント削除確認
**Status**: pending
**Parallel**: No
**Dependencies**: T006完了後
**File**: `/home/dev/Project/auth-api/auth-app/server/routes/auth.js`

**Description**:
旧エンドポイント `POST /auth` が削除されているか、または `/auth/sso/authorize` にリダイレクトされているかを確認する。

**Acceptance Criteria**:
- `POST /auth` エンドポイントが存在しない、または `/auth/sso/authorize` に301/302リダイレクトされている
- `server/routes/auth.js` に `/auth` のルート定義が残っていない（T003で変更済みのため）

**Implementation Notes**:
- T003で既に `/auth` を `/auth/sso/authorize` に変更しているため、確認のみ
- 必要に応じて旧エンドポイントへのアクセスをログで確認

---

### T008: 本番デプロイ
**Status**: pending
**Parallel**: No
**Dependencies**: T006, T007完了後
**File**: なし（デプロイ作業）

**Description**:
AWS Lightsail環境にコードをデプロイし、PM2を再起動し、本番環境での動作を確認する。

**Acceptance Criteria**:
- Gitリポジトリに変更がコミットされている
- AWS Lightsailサーバーに最新コードがデプロイされている
- PM2でプロセスが再起動されている
- https://dummyauth.prams-rfid.com/auth/sso/authorize が正常に動作する
- https://dummyauth.prams-rfid.com/auth/sso/token が正常に動作する

**Deployment Commands**:
```bash
# 1. ローカルでコミット
cd /home/dev/Project/auth-api/auth-app
git add .
git commit -m "$(cat <<'EOF'
認証APIパラメータ変更とトークンエンドポイント追加

- /auth を /auth/sso/authorize に変更
- OAuth2パラメータ（client_id, response_type, state, service_id）対応
- 新規 /auth/sso/token エンドポイント追加
- grant_type による分岐処理（authorization_code, refresh_token）
- クライアントサイドリダイレクトをURLフラグメント形式に変更
- 固定値モジュール（mockData.js）作成

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# 2. リモートにプッシュ
git push origin main

# 3. Lightsailサーバーにデプロイ
ssh ubuntu@<lightsail-ip> "cd /path/to/auth-app && git pull origin main && npm install && pm2 restart auth-app"

# 4. 本番環境テスト
curl -X POST https://dummyauth.prams-rfid.com/auth/sso/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=test" \
  -d "client_id=test" \
  -d "client_secret=test" \
  -d "redirect_uri=https://example.com"
# → JSONレスポンスが返却されることを確認
```

**Validation**:
- 本番環境の両エンドポイントが正常に動作する
- PM2でプロセスが安定稼働している（`pm2 status`）
- nginxのアクセスログで正常なレスポンスを確認

---

## Dependencies（依存関係グラフ）

```
T001 (依存関係追加)
  ↓
T002 (固定値モジュール作成)
  ↓
  ├─→ T003 [P] (/auth/sso/authorize実装)
  │     ↓
  │     T005 (/auth/sso/token実装)
  │
  └─→ T004 [P] (クライアント修正)
        ↓
        T005 (/auth/sso/token実装)

T003, T004, T005 完了後
  ↓
T006 (ローカルテスト)
  ↓
T007 (旧エンドポイント確認)
  ↓
T008 (本番デプロイ)
```

**並列実行可能なタスク**:
- T003とT004は並列実行可能（異なるファイルを変更）

**順次実行が必要なタスク**:
- T001 → T002（モジュール作成前に依存関係が必要）
- T003 → T005（同じファイルauth.jsを変更するため）
- T006 → T007 → T008（テスト → 確認 → デプロイの順序）

---

## Parallel Execution Example（並列実行例）

### ステップ1: T003とT004を並列実行
```
Task 1: "/auth/sso/authorize エンドポイント実装（server/routes/auth.js）"
Task 2: "クライアントサイドリダイレクト変更（public/js/auth.js）"
```

これらは異なるファイルを変更するため、並列実行可能。

---

## Notes（注意事項）

### モックサービスの特性
- **TDD不要**: requirements.mdに「テスト駆動の実装は必要ありません」と明記されているため、Phase 3.2（Tests First）は省略
- **バリデーション不要**: すべてのパラメータは検証せず受け入れる
- **固定値レスポンス**: すべてのレスポンスは事前定義された固定値

### ファイルエンコーディング
- すべての新規JavaScriptファイルはUTF-8 BOMで保存（開発原則2）

### 既存UI維持
- login.ejsテンプレートは最小限の変更のみ（stateパラメータ追加）
- 既存のフォーム構造とBootstrapスタイリングは維持

### Git作業
- 各主要タスク完了後にコミット推奨
- T008でまとめてコミットも可能

---

## Validation Checklist（検証チェックリスト）

### 契約準拠
- [x] Contract 1（POST /auth/sso/authorize）に対応するタスク: T003
- [x] Contract 2（POST /auth/sso/token）に対応するタスク: T005

### エンティティ
- [x] データモデルなし（モックサービスのため該当なし）
- [x] 固定値の定義: T002で対応

### テスト
- [x] モックサービスのためTDD不要（requirements.md準拠）
- [x] 手動テスト: T006で対応

### 並列性
- [x] T003とT004は異なるファイル → 並列可能
- [x] T003とT005は同じファイル → 順次実行

### ファイルパス
- [x] すべてのタスクに正確なファイルパスを記載

### 実装順序
- [x] Setup (T001-T002) → Core (T003-T005) → Polish (T006-T008)

---

**Tasks Status**: ✅ Complete and ready for execution

**Total Tasks**: 8
- Setup: 2
- Core Implementation: 3
- Polish: 3

**Estimated Completion Time**: 2-3時間（ローカル開発 + テスト + デプロイ）
