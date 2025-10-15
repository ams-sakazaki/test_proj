# Feature Specification: 認証APIパラメータ変更とトークンエンドポイント追加

**Feature Branch**: `002-api-token-requirements`
**Created**: 2025-10-15
**Status**: Draft
**Input**: User description: "リクエスト受け取り時のパラメータ仕様が大幅に変更されました。また新規API「token」を追加してください。仕様は「./docs/requirements.md」に記載されています。"

## Execution Flow (main)
```
1. Parse user description from Input
   → Feature requires API parameter changes and new token endpoint
2. Extract key concepts from description
   → Actors: SaaSアプリケーション, Users
   → Actions: 認証ページ表示, トークン交換, リダイレクト
   → Data: OAuth2パラメータ, JWT, ユーザー情報, サービス情報
   → Constraints: モックサービス（固定値レスポンス）、既存の認証ページUIは維持
3. For each unclear aspect:
   → All specifications are defined in requirements.md
4. Fill User Scenarios & Testing section
   → OAuth2フロー実装
5. Generate Functional Requirements
   → Each requirement is testable
6. Identify Key Entities
   → User, Service, Token
7. Run Review Checklist
   → No implementation details included
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

---

## Clarifications

### Session 2025-10-15
- Q: 不正なパラメータや欠損パラメータに対するシステムの動作は？ → A: すべて無視して成功レスポンスを返す（モックなのでバリデーション不要）
- Q: `grant_type: "refresh_token"` の場合、必要なパラメータは？ → A: grant_type, refresh_token のみ
- Q: 認証ページからのリダイレクト時、codeとstateパラメータはどのように渡される？ → A: URLフラグメント（例: `#code=xxx&state=yyy`）
- Q: access_tokenとrefresh_tokenのJWT内部のペイロードは？ → A: 固定の文字列（JWTとして有効だが中身は空またはダミー）
- Q: 各エンドポイントのHTTPメソッドは？ → A: 両方ともPOST

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
SaaSアプリケーションが認証サービスを利用してユーザーを認証し、アクセストークンとユーザー情報を取得する。OAuth2認証コードフローに準拠したモック認証サービスを提供する。既存の認証ページUIは維持される。

### Acceptance Scenarios

#### シナリオ1: 認証ページ表示（エンドポイントとパラメータ変更）
1. **Given** SaaSアプリケーションが認証を開始する
2. **When** 以下のパラメータでPOSTリクエストを `/auth/sso/authorize` に送信する
   - client_id
   - redirect_uri
   - response_type
   - state
   - service_id
3. **Then** 既存の認証ログインページ（企業ID、メールアドレス、パスワードのフォーム）が表示される

#### シナリオ2: 認証成功とコード返却（パラメータ変更）
1. **Given** 認証ページが表示されている
2. **When** ユーザーがログインボタンをクリックする
3. **Then** システムはURLフラグメント形式で以下のパラメータとともに redirect_uri にリダイレクトする
   - code: "11d37eec2cb0d6be13a61282ff894c87359e6e5af170fe3a70fc74e2497a948d&"（固定値）
   - state: リクエスト時に受け取った state の値
   - 例: `https://example.com/callback#code=11d37...&state=abc123`

#### シナリオ3: 認証コードでトークン取得（新規エンドポイント）
1. **Given** SaaSアプリケーションが認証コードを受け取った
2. **When** 以下のパラメータでPOSTリクエストを `/auth/sso/token` に送信する
   - grant_type: "authorization_code"
   - code
   - client_id
   - client_secret
   - redirect_uri
3. **Then** システムはJWT形式のJSONレスポンスを返却する
   - access_token（JWT形式の固定文字列）
   - refresh_token（JWT形式の固定文字列）
   - token_type: "Bearer"
   - expires_in: 900
   - user オブジェクト（id, email, name, company_id, company_code, roles）
   - service オブジェクト（id, serviceCode, serviceName, externalApiConfig）

#### シナリオ4: リフレッシュトークンでトークン更新（新規機能）
1. **Given** SaaSアプリケーションが有効なリフレッシュトークンを持っている
2. **When** 以下のパラメータでPOSTリクエストを `/auth/sso/token` に送信する
   - grant_type: "refresh_token"
   - refresh_token
3. **Then** システムはJWT形式のJSONレスポンスを返却する
   - access_token（JWT形式の固定文字列、新規）
   - refresh_token（JWT形式の固定文字列、新規）

### Edge Cases
- 不正なパラメータや欠損パラメータ: モックサービスのためバリデーションは行わず、すべて成功レスポンスを返す
- redirect_uri が不正な形式: バリデーションせず、そのままリダイレクトを試みる
- grant_type が不正な値: バリデーションせず、デフォルトの成功レスポンスを返す

## Requirements *(mandatory)*

### Functional Requirements

#### 認証ページ表示エンドポイント（既存機能の変更）
- **FR-001**: システムは `/auth/sso/authorize` エンドポイントをPOSTメソッドで提供しなければならない（既存の `/auth` から変更）
- **FR-002**: システムは以下のパラメータを受け取らなければならない: client_id, redirect_uri, response_type, state, service_id（既存の callback パラメータから変更）
- **FR-003**: システムはパラメータのバリデーションを行わず、すべてのリクエストを受け入れなければならない（モックサービスのため）
- **FR-004**: システムは既存の認証ページ（企業ID、メールアドレス、パスワードのフォーム）を表示しなければならない
- **FR-005**: 認証ページには既存のログインボタンが配置されなければならない
- **FR-006**: ログインボタンが押されたとき、システムは redirect_uri にリダイレクトしなければならない
- **FR-007**: リダイレクト時、システムはURLフラグメント形式（`#`以降）で以下をパラメータとして含めなければならない
  - code: "11d37eec2cb0d6be13a61282ff894c87359e6e5af170fe3a70fc74e2497a948d&"（固定値）
  - state: リクエスト時に受け取った state パラメータの値

#### トークンエンドポイント（新規機能）
- **FR-008**: システムは `/auth/sso/token` エンドポイントをPOSTメソッドで提供しなければならない（新規）
- **FR-009**: システムはパラメータのバリデーションを行わず、すべてのリクエストを受け入れなければならない（モックサービスのため）
- **FR-010**: grant_type が "authorization_code" の場合、システムは以下のパラメータを受け取らなければならない: grant_type, code, client_id, client_secret, redirect_uri
- **FR-011**: grant_type が "authorization_code" の場合、システムは以下を含むJSONレスポンスを返却しなければならない
  - access_token（JWT形式の固定文字列）
  - refresh_token（JWT形式の固定文字列）
  - token_type: "Bearer"
  - expires_in: 900
  - user オブジェクト
  - service オブジェクト
- **FR-012**: grant_type が "refresh_token" の場合、システムは以下のパラメータを受け取らなければならない: grant_type, refresh_token
- **FR-013**: grant_type が "refresh_token" の場合、システムは以下を含むJSONレスポンスを返却しなければならない
  - access_token（JWT形式の固定文字列、新規）
  - refresh_token（JWT形式の固定文字列、新規）
- **FR-014**: user オブジェクトは以下のフィールドを含まなければならない
  - id: "company-admin-uuid-001"
  - email: "admin@dbtest.com"
  - name: "admin"
  - company_id: "34025c02-8732-473b-a3a2-07c4026c55ec"
  - company_code: "DB-INT-TEST-001"
  - roles: ["company_admin"]
- **FR-015**: service オブジェクトは以下のフィールドを含まなければならない
  - id: "8d33a262-5619-4254-85ba-1bc75ce049ce"
  - serviceCode: "shopify-order"
  - serviceName: "Shopifyオーダー"
  - externalApiConfig オブジェクト
- **FR-016**: externalApiConfig.shopify オブジェクトは以下のフィールドを含まなければならない
  - adminAccessToken: "mock_shopify_admin_access_token_xxxxx"
  - storeAccessToken: "mock_shopify_store_access_token_xxxxx"
  - shopDomain: "xn-ams-nk4c6lre4725av5km35dro0d.myshopify.com"
- **FR-017**: access_tokenとrefresh_tokenは有効なJWT形式の固定文字列でなければならない（ペイロードは空またはダミーでよい）
- **FR-018**: すべてのレスポンスデータは固定値でなければならない（モックサービスのため）
- **FR-019**: 既存の認証ページUI（企業ID、メールアドレス、パスワードのフォーム）は維持されなければならない

### Key Entities

- **User（ユーザー）**: 認証されるユーザー
  - 属性: id, email, name, company_id, company_code, roles
  - モックサービスでは固定値を返却

- **Service（サービス）**: SaaSアプリケーションが利用するサービス
  - 属性: id, serviceCode, serviceName, externalApiConfig
  - 外部API設定（Shopify連携情報など）を含む

- **Token（トークン）**: アクセストークンとリフレッシュトークン
  - JWT形式の固定文字列
  - access_tokenの有効期限: 900秒（15分）
  - モックサービスでは固定値を返却

- **Authorization Code（認証コード）**: OAuth2フローで使用される一時的なコード
  - 固定値: "11d37eec2cb0d6be13a61282ff894c87359e6e5af170fe3a70fc74e2497a948d&"

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
