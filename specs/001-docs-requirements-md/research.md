# リサーチ: ログイン認証サービス

**日付**: 2025-10-02
**プロジェクト**: モックログイン認証サービス
**目的**: 技術選択と実装アプローチの決定

## 1. JWT生成方法

### 決定
ブラウザ側でのJWT生成を採用

### 理由
- サーバーレス要件を満たす
- フロントエンドのみで完結し、サーバーコストがゼロ
- モックサービスとしての用途に適している

### 検討した代替案
1. **サーバーサイドでのJWT生成**
   - メリット: セキュリティが高い、秘密鍵の保護が可能
   - デメリット: サーバーコストが発生、要件の「可能な限りサーバーレス」に反する
   - 却下理由: コスト要件とモックサービスという性質に合わない

2. **Cloudflare Workers等のエッジコンピューティング**
   - メリット: サーバーレス、低コスト
   - デメリット: 設定の複雑度が増加、学習コスト
   - 却下理由: シンプルさを優先

### 実装方法
- ライブラリ: jose（Pure JavaScript）またはjsonwebtoken（CDN経由）
- 秘密鍵: ハードコード（モックサービスのため許容）
- 署名アルゴリズム: HMAC SHA256

---

## 2. 静的ホスティングサービス

### 決定
GitHub Pages / Netlify / Vercel のいずれかを推奨

### 理由
- すべて無料プランが利用可能
- 設定が簡単（Gitリポジトリと連携）
- 自動デプロイ機能あり
- HTTPS対応（標準）
- カスタムドメイン対応

### 比較

| サービス | メリット | デメリット |
|---------|---------|----------|
| GitHub Pages | GitHubと統合、シンプル | 機能が限定的 |
| Netlify | 高機能、フォーム処理可能 | やや複雑 |
| Vercel | 高速、Edge Functions利用可能 | やや複雑 |

### 検討した代替案
1. **AWS S3 + CloudFront**
   - メリット: 大規模トラフィックに対応可能
   - デメリット: 設定が複雑、無料枠超過でコスト発生の可能性
   - 却下理由: オーバースペック、コストリスク

2. **Firebase Hosting**
   - メリット: Googleのインフラ、高速
   - デメリット: Googleアカウント必要、やや複雑
   - 却下理由: シンプルさを優先

---

## 3. POSTリクエストボディの受け取り方法

### 決定
バックエンドサーバーを実装し、POSTリクエストのボディでコールバックURLを受け取る

### 理由
- 仕様要件として「POSTリクエストのボディ」での受け取りが必須
- サーバーレスであることよりも仕様遵守を優先
- 軽量なバックエンド実装で対応可能

### 実装詳細
**バックエンド（Node.js + Express）**:
```javascript
app.post('/auth', (req, res) => {
  const callbackUrl = req.body.callback || 'https://example.com/auth-success';
  // HTMLページを返却し、callbackUrlをテンプレートに埋め込む
  res.render('login', { callbackUrl });
});
```

**フロントエンド**:
```javascript
// サーバーから渡されたcallbackUrlを使用
const callbackUrl = window.CALLBACK_URL || 'https://example.com/auth-success';
```

### 検討した代替案
1. **URLクエリパラメータ**
   - メリット: フロントエンドのみで完結、シンプル
   - デメリット: 仕様要件（POSTボディ）に反する
   - 却下理由: ユーザーの仕様変更不可の要求

2. **Cloudflare Workers等のサーバーレス関数**
   - メリット: サーバーレス、低コスト
   - デメリット: 設定が複雑
   - 検討中: 実装候補の一つ

3. **localStorageに事前保存**
   - メリット: URLパラメータ不要
   - デメリット: 呼び出し側との連携が複雑、POSTリクエストと無関係
   - 却下理由: 仕様要件を満たさない

---

## 4. JWT生成ライブラリ

### 決定
jose（Pure JavaScript、ブラウザネイティブ対応）を第一候補とする

### 理由
- Pure JavaScript、依存関係なし
- ブラウザのWeb Crypto APIを使用（高速、セキュア）
- モダンなAPI設計
- TypeScript対応

### 代替: jsonwebtoken（CDN経由）
- 広く使われている、成熟したライブラリ
- ドキュメントが豊富
- CDN経由で簡単に導入可能

### 実装例（jose）
```javascript
import { SignJWT } from 'jose';

const secret = new TextEncoder().encode('mock-secret-key-do-not-use-in-production');

const jwt = await new SignJWT({
  companyId: companyId,
  userId: 'mock-user-123',
  accessToken: crypto.randomUUID(),
  expiresAt: Math.floor(Date.now() / 1000) + 86400
})
  .setProtectedHeader({ alg: 'HS256' })
  .sign(secret);
```

### 検討した代替案
1. **自前実装**
   - メリット: 完全な制御、依存関係ゼロ
   - デメリット: セキュリティリスク、実装の複雑さ
   - 却下理由: セキュリティとメンテナンス性

2. **jwt-simple**
   - メリット: シンプル、軽量
   - デメリット: メンテナンスが不活発
   - 却下理由: 更新頻度が低い

---

## 5. UI/UXデザイン

### 決定
シンプルでモダンなフォームデザイン

### デザイン要件
- レスポンシブデザイン（モバイル対応）
- アクセシビリティ対応（ラベル、フォーカス管理）
- エラー表示（空フィールドのハイライト）
- ローディング状態の表示

### 技術選択
- Pure CSS（フレームワーク不要）
- CSS Grid / Flexbox（レイアウト）
- CSS Variables（テーマ管理）

### 参考デザイン
- Google/Microsoft等のログイン画面（シンプル、信頼性）
- Material Design（視覚的フィードバック）

---

## 6. バックエンド技術選択

### 決定
Node.js + Express（軽量Webフレームワーク）

### 理由
- シンプルで学習コストが低い
- POSTリクエスト処理が容易
- テンプレートエンジン（EJS等）で動的HTML生成可能
- デプロイが簡単（Heroku、Render、Railway等の無料プラン利用可能）

### 実装方針
- 最小限の機能実装（POSTエンドポイント1つのみ）
- テンプレートエンジンでログイン画面を動的生成
- JWT生成はブラウザ側で実行（サーバー負荷軽減）

### 検討した代替案
1. **Python + Flask**
   - メリット: シンプル、Python環境
   - デメリット: JavaScript統一性の欠如
   - 却下理由: フロントエンドとの技術統一性

2. **Cloudflare Workers**
   - メリット: サーバーレス、エッジで動作
   - デメリット: 設定が複雑、制約あり
   - 検討可能: 将来の最適化候補

---

## まとめ

すべての技術選択が完了し、NEEDS CLARIFICATIONは解決されました。

**採用技術スタック**:
- **バックエンド**: Node.js + Express + EJS（テンプレートエンジン）
- **フロントエンド**: HTML5/CSS3/JavaScript (ES6+)
- **JWT生成**: jsonwebtoken（Node.js）またはブラウザ側でjose
- **ホスティング**: Heroku / Render / Railway（バックエンド）
- **データ受け渡し**: POSTリクエストボディ（仕様遵守）

**アーキテクチャ**:
```
SaaSアプリ → POST /auth (callback in body) → バックエンド
                                                ↓
                                    ログイン画面HTML返却
                                                ↓
                                    ユーザー入力 + JWT生成（ブラウザ）
                                                ↓
                                    リダイレクト（callback#token=...）
```

**次のステップ**:
フェーズ1: データモデル設計とコントラクト定義
