# 実装プラン: ログイン認証サービス

**ブランチ**: `001-docs-requirements-md` | **日付**: 2025-10-02 | **仕様書**: [spec.md](./spec.md)
**入力**: 機能仕様書 `/specs/001-docs-requirements-md/spec.md`

## 実行フロー（/planコマンドスコープ）
```
1. 入力パスから機能仕様書をロード
   → ✅ 完了
2. 技術コンテキストを記入（NEEDS CLARIFICATIONをスキャン）
   → ✅ プロジェクトタイプを検出: Web（フロントエンド中心）
   → ✅ 構造決定を設定
3. 憲法チェックセクションを記入
   → ✅ 憲法ファイルはテンプレートのみ（プロジェクト固有の憲法なし）
4. 憲法チェックセクションを評価
   → ✅ プロジェクト固有の憲法なし、基本原則に従う
   → ✅ 進捗追跡を更新: 初期憲法チェック
5. フェーズ0を実行 → research.md
   → ✅ NEEDS CLARIFICATIONなし
6. フェーズ1を実行 → contracts, data-model.md, quickstart.md, エージェントファイル
7. 憲法チェックセクションを再評価
   → フェーズ1完了後に実施
   → 進捗追跡を更新: 設計後憲法チェック
8. フェーズ2を計画 → タスク生成アプローチを記述（tasks.mdは作成しない）
9. 停止 - /tasksコマンドの準備完了
```

**重要**: /planコマンドはステップ7で停止します。フェーズ2-4は他のコマンドで実行されます:
- フェーズ2: /tasksコマンドがtasks.mdを作成
- フェーズ3-4: 実装実行（手動またはツール経由）

## 概要
モックログイン認証サービスの実装。SaaSアプリケーション向けに、Bootstrap 5で構築されたログイン画面を提供し、POSTリクエストボディでコールバックURLを受け取り、ハードコードされたJWTトークンを返却する。Node.js + Expressバックエンドと、レスポンシブなフロントエンドの実装で、低コストを優先する。

## 技術コンテキスト
**言語/バージョン**: Node.js 22+ (バックエンド)、HTML5/CSS3/JavaScript ES6+ (フロントエンド)
**主要依存関係**: Express 4.x, EJS (テンプレートエンジン), Bootstrap 5.x (UIフレームワーク), jose (JWT生成、ブラウザ側)
**ストレージ**: N/A（モックサービスのためデータ永続化なし）
**テスト**: ブラウザ手動テスト（モックサービスのため自動テストは不要）
**ターゲットプラットフォーム**: Node.js 22+サーバー + モダンブラウザ（Chrome, Firefox, Safari, Edge最新版）
**プロジェクトタイプ**: Web（バックエンド + フロントエンド）
**パフォーマンス目標**: <1秒でJWT生成とリダイレクト
**制約**: 低コスト、POSTリクエストボディでコールバックURL受け取り必須
**スケール/スコープ**: 1エンドポイント（POST /auth）、1ページ（ログイン画面）、モック用途のみ

## 憲法チェック
*ゲート: フェーズ0リサーチ前に合格必須。フェーズ1設計後に再チェック。*

プロジェクト固有の憲法ファイルはテンプレートのみで、具体的な制約は定義されていません。
以下の基本原則に従います:
- ✅ シンプルさを優先（フロントエンドのみ、依存関係最小限）
- ✅ モックサービスとしての要件を満たす
- ✅ 過剰な機能を追加しない

**ステータス**: 合格

## プロジェクト構造

### ドキュメント（この機能）
```
specs/001-docs-requirements-md/
├── plan.md              # このファイル（/planコマンド出力）
├── research.md          # フェーズ0出力（/planコマンド）
├── data-model.md        # フェーズ1出力（/planコマンド）
├── quickstart.md        # フェーズ1出力（/planコマンド）
├── contracts/           # フェーズ1出力（/planコマンド）
└── tasks.md             # フェーズ2出力（/tasksコマンド - /planでは作成しない）
```

### ソースコード（リポジトリルート）
```
auth-app/
├── server/
│   ├── index.js         # Expressサーバーのエントリーポイント
│   ├── routes/
│   │   └── auth.js      # POST /auth エンドポイント
│   └── views/
│       └── login.ejs    # ログイン画面のEJSテンプレート（Bootstrap使用）
├── public/
│   ├── css/
│   │   └── custom.css   # カスタムスタイル（Bootstrap拡張）
│   └── js/
│       └── auth.js      # JWT生成とリダイレクト処理（クライアント側）
├── package.json         # Node.js依存関係
└── README.md            # アプリケーションの使用方法
```

**構造決定**: バックエンド（Node.js + Express）とフロントエンド（EJS + Bootstrap）の構成を採用。POSTリクエストボディでコールバックURLを受け取る仕様を満たすため、サーバー側実装が必要。Bootstrap 5.xをCDN経由で使用し、レスポンシブで美しいUIを提供。Heroku、Render、Railway等の無料プランで動作する。

## フェーズ0: アウトラインとリサーチ

### リサーチタスク

1. **JWT生成方法の調査**
   - 決定: ブラウザ側でのJWT生成
   - 理由: サーバーレス要件を満たし、フロントエンドのみで完結する
   - 検討した代替案: サーバーサイドでのJWT生成（コストがかかる、要件外）

2. **静的ホスティングの選択肢**
   - 決定: GitHub Pages / Netlify / Vercel（いずれも無料プラン利用可能）
   - 理由: コストゼロ、設定が簡単、HTTPSサポート
   - 検討した代替案: AWS S3+CloudFront（設定複雑、コストがかかる可能性）

3. **POSTリクエストボディの受け取り方法**
   - 決定: URLパラメータとして受け取る（静的ページのため）
   - 理由: 静的HTMLページではPOSTリクエストを直接処理できないため、クエリパラメータで代替
   - 検討した代替案: 軽量サーバー（Cloudflare Workers）を使用（複雑度増加）

4. **JWT生成ライブラリ**
   - 決定: jose（Pure JavaScript、ブラウザ対応）またはjsonwebtoken（CDN経由）
   - 理由: 軽量、ブラウザで動作、外部依存最小限
   - 検討した代替案: 自前実装（セキュリティリスク、複雑）

**出力**: research.md（すべてのNEEDS CLARIFICATION解決済み）

## フェーズ1: 設計とコントラクト
*前提条件: research.md完了*

### 1. データモデル設計 → `data-model.md`

#### エンティティ定義

**LoginCredentials（ログイン資格情報）**
- companyId: string（企業ID）
- email: string（メールアドレス）
- password: string（パスワード）
- バリデーション: すべて空でないこと（フロントエンド検証のみ）

**JWTPayload（JWTペイロード）**
- companyId: string（企業ID - 入力値をそのまま使用）
- userId: string（ユーザーID - ハードコード: "mock-user-123"）
- accessToken: string（アクセストークン - UUID v4など）
- expiresAt: number（アクセストークン有効期限 - 現在時刻 + 24時間、Unix timestamp）

**CallbackParameters（コールバックパラメータ）**
- callbackUrl: string（コールバックURL - クエリパラメータまたはデフォルト値）

### 2. APIコントラクト生成

フロントエンドのみのため、従来のAPI仕様ではなく、インターフェース定義を作成:

**contracts/login-interface.md**
```
# ログインインターフェース

## 入力（URLパラメータ）
- callback: string（オプション）- コールバックURL

## 入力（フォーム）
- companyId: string（必須）
- email: string（必須）
- password: string（必須）

## 出力（リダイレクト）
- URL: {callbackUrl}#token={jwt}
- callbackUrlが未提供の場合: {defaultUrl}#token={jwt}
- defaultUrl: https://example.com/auth-success

## JWT構造
ペイロード:
{
  "companyId": "<入力値>",
  "userId": "mock-user-123",
  "accessToken": "<UUID>",
  "expiresAt": <現在時刻 + 86400秒>
}

署名: HMAC SHA256（秘密鍵: "mock-secret-key-do-not-use-in-production"）
有効期限: なし（exp claimなし）
```

### 3. コントラクトテスト生成

モックサービスかつフロントエンドのみのため、自動テストは不要（要件に明記）。
手動テストシナリオをquickstart.mdに記載。

### 4. テストシナリオ抽出 → `quickstart.md`

ユーザーストーリーから以下のテストシナリオを抽出:

1. **正常系: すべてのフィールドを入力してログイン**
   - 企業ID、メール、パスワードを入力
   - ログインボタンをクリック
   - JWTが生成され、コールバックURLにリダイレクトされる

2. **エッジケース: 入力フィールドが空**
   - いずれかのフィールドを空にする
   - ログインボタンをクリック
   - 空のフィールドがハイライト表示される
   - リダイレクトされない

3. **エッジケース: コールバックURLなし**
   - URLパラメータなしでアクセス
   - 正常にログイン
   - デフォルトURLにリダイレクトされる

### 5. エージェントファイル更新

`.specify/scripts/bash/update-agent-context.sh`は存在しないため、手動でCLAUDE.mdを更新:
- 新技術: HTML5, CSS3, JavaScript (ES6+), JWT (jose/jsonwebtoken)
- 最近の変更: ログイン認証サービス追加

**出力**: data-model.md, /contracts/*, quickstart.md, CLAUDE.md更新

## フェーズ2: タスク計画アプローチ
*このセクションは/tasksコマンドが何を行うかを記述 - /plan中は実行しない*

**タスク生成戦略**:
- `.specify/templates/tasks-template.md`をベースとして読み込む
- フェーズ1設計ドキュメントからタスクを生成（コントラクト、データモデル、クイックスタート）
- 各HTMLファイル → 作成タスク [P]
- 各JSファイル → 実装タスク [P]
- 各CSSファイル → スタイリングタスク [P]
- 各ユーザーストーリー → 手動テストシナリオタスク

**順序付け戦略**:
- 依存関係順: HTML → CSS → JavaScript
- [P]マーク: 独立ファイルの並列実行

**推定出力**: 8-12個の番号付き、順序付けされたタスク in tasks.md

**重要**: このフェーズは/tasksコマンドで実行され、/planでは実行されない

## フェーズ3+: 今後の実装
*これらのフェーズは/planコマンドのスコープ外*

**フェーズ3**: タスク実行（/tasksコマンドがtasks.mdを作成）
**フェーズ4**: 実装（憲法原則に従ってtasks.mdを実行）
**フェーズ5**: 検証（テスト実行、quickstart.md実行、パフォーマンス検証）

## 複雑度追跡
*憲法チェックに違反がある場合のみ記入*

プロジェクト固有の憲法が定義されていないため、該当なし。

## 進捗追跡
*このチェックリストは実行フロー中に更新される*

**フェーズステータス**:
- [x] フェーズ0: リサーチ完了（/planコマンド）
- [x] フェーズ1: 設計完了（/planコマンド）
- [x] フェーズ2: タスク計画完了（/planコマンド - アプローチ記述のみ）
- [ ] フェーズ3: タスク生成完了（/tasksコマンド）
- [ ] フェーズ4: 実装完了
- [ ] フェーズ5: 検証合格

**ゲートステータス**:
- [x] 初期憲法チェック: 合格
- [x] 設計後憲法チェック: 合格
- [x] すべてのNEEDS CLARIFICATION解決済み
- [x] 複雑度の逸脱を文書化

---
*憲法 v2.1.1に基づく - `/memory/constitution.md`を参照*
