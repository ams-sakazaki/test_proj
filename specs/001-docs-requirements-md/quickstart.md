# クイックスタート: ログイン認証サービス

**日付**: 2025-10-02
**プロジェクト**: モックログイン認証サービス
**目的**: 手動テストシナリオと動作確認手順

---

## 前提条件

### 必要な環境
- モダンブラウザ（Chrome, Firefox, Safari, Edge 最新版）
- HTTPSサーバー（GitHub Pages, Netlify, Vercel等）またはローカルHTTPSサーバー

### セットアップ
1. リポジトリをクローン
2. `auth-app/` ディレクトリに移動
3. ホスティングサービスにデプロイ、またはローカルサーバーを起動

---

## テストシナリオ

### シナリオ1: 正常系 - すべてのフィールドを入力してログイン

**目的**: 基本的なログインフローが正常に動作することを確認

**手順**:
1. ブラウザで以下のURLにアクセス:
   ```
   https://auth.example.com/?callback=https://example.com/success
   ```

2. ログイン画面が表示されることを確認:
   - 企業IDフィールド
   - メールアドレスフィールド
   - パスワードフィールド
   - ログインボタン

3. 各フィールドに以下の値を入力:
   - 企業ID: `company-123`
   - メール: `user@example.com`
   - パスワード: `password123`

4. ログインボタンをクリック

**期待結果**:
- リダイレクトが実行される
- リダイレクト先URL:
  ```
  https://example.com/success#token=eyJhbGci...
  ```
- URLフラグメントにJWTトークンが含まれている

**検証**:
1. ブラウザの開発者ツールを開く
2. コンソールで以下を実行:
   ```javascript
   const token = window.location.hash.replace('#token=', '');
   console.log('JWT Token:', token);
   
   // JWTをデコード（jwt-decode.comなど）
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Payload:', payload);
   ```

3. ペイロードを確認:
   ```json
   {
     "companyId": "company-123",
     "userId": "mock-user-123",
     "accessToken": "<UUID>",
     "expiresAt": <Unix timestamp>
   }
   ```

4. `expiresAt` が現在時刻+24時間であることを確認:
   ```javascript
   const now = Math.floor(Date.now() / 1000);
   const expiresIn = payload.expiresAt - now;
   console.log('有効期限まで（秒）:', expiresIn); // 約86400秒
   ```

**合格基準**:
- ✅ リダイレクトが実行される
- ✅ JWTトークンがURLフラグメントに含まれる
- ✅ ペイロードに4つのフィールドが含まれる
- ✅ companyIdが入力値と一致する
- ✅ expiresAtが現在時刻+24時間（±60秒）

---

### シナリオ2: エッジケース - 入力フィールドが空

**目的**: バリデーションが正しく機能し、空フィールドがハイライト表示されることを確認

**手順**:
1. ブラウザで以下のURLにアクセス:
   ```
   https://auth.example.com/?callback=https://example.com/success
   ```

2. 企業IDフィールドを空のままにする:
   - 企業ID: （空）
   - メール: `user@example.com`
   - パスワード: `password123`

3. ログインボタンをクリック

**期待結果**:
- 企業IDフィールドがハイライト表示される（赤枠など）
- リダイレクトは実行されない
- ページはログイン画面のまま

**検証**:
1. ブラウザの開発者ツールでHTML要素を確認
2. 企業IDフィールドに `error` クラスが追加されていることを確認:
   ```html
   <input type="text" class="error" ...>
   ```

3. 現在のURLを確認:
   ```javascript
   console.log(window.location.href); // リダイレクトされていないこと
   ```

**合格基準**:
- ✅ 企業IDフィールドがハイライト表示される
- ✅ リダイレクトが実行されない
- ✅ 他のフィールド（メール、パスワード）はハイライトされない

**追加テスト**:
- メールフィールドを空にして同様にテスト
- パスワードフィールドを空にして同様にテスト
- 複数フィールドを空にして同様にテスト

---

### シナリオ3: エッジケース - コールバックURLなし

**目的**: コールバックURLが未提供の場合、デフォルトURLにリダイレクトされることを確認

**手順**:
1. ブラウザで以下のURLにアクセス（callbackパラメータなし）:
   ```
   https://auth.example.com/
   ```

2. 各フィールドに値を入力:
   - 企業ID: `company-456`
   - メール: `test@example.com`
   - パスワード: `test123`

3. ログインボタンをクリック

**期待結果**:
- デフォルトURLにリダイレクトされる:
  ```
  https://example.com/auth-success#token=eyJhbGci...
  ```

**検証**:
1. リダイレクト先URLを確認:
   ```javascript
   console.log(window.location.href);
   // https://example.com/auth-success#token=...
   ```

2. JWTペイロードを確認:
   ```javascript
   const token = window.location.hash.replace('#token=', '');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Payload:', payload);
   // { "companyId": "company-456", ... }
   ```

**合格基準**:
- ✅ デフォルトURL（https://example.com/auth-success）にリダイレクトされる
- ✅ JWTトークンがURLフラグメントに含まれる
- ✅ ペイロードが正しく生成されている

---

### シナリオ4: 認証チェックなし - どの値でもログイン成功

**目的**: モックサービスとして、どのような入力値でもログインが成功することを確認

**手順**:
1. ブラウザでログイン画面にアクセス

2. 任意の値を入力（ランダムな文字列）:
   - 企業ID: `random-company-xyz`
   - メール: `invalid@not-a-domain`
   - パスワード: `aaaaaaa`

3. ログインボタンをクリック

**期待結果**:
- ログインが成功する
- JWTが生成され、リダイレクトされる

**検証**:
```javascript
const token = window.location.hash.replace('#token=', '');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Payload:', payload);
// { "companyId": "random-company-xyz", ... }
```

**合格基準**:
- ✅ どのような値でもログインが成功する
- ✅ 入力されたcompanyIdがペイロードに反映される
- ✅ エラーが発生しない

---

## パフォーマンステスト

### JWT生成速度

**目的**: JWT生成とリダイレクトが1秒以内に完了することを確認

**手順**:
1. ブラウザの開発者ツールを開く
2. Performanceタブを開始
3. ログインを実行
4. Performanceタブを停止

**期待結果**:
- ログインボタンクリックからリダイレクトまで < 1秒

**検証**:
```javascript
// auth.js内に計測コードを追加
const startTime = performance.now();
// JWT生成処理
const endTime = performance.now();
console.log(`JWT生成時間: ${endTime - startTime}ms`);
```

**合格基準**:
- ✅ JWT生成時間 < 500ms
- ✅ リダイレクトまでの合計時間 < 1000ms

---

## トラブルシューティング

### 問題1: リダイレクトが実行されない

**原因**:
- バリデーションエラー
- JavaScriptエラー

**解決方法**:
1. ブラウザの開発者ツールでコンソールを確認
2. エラーメッセージを確認
3. すべてのフィールドに値が入力されているか確認

### 問題2: JWTがデコードできない

**原因**:
- JWT生成ライブラリの読み込みエラー
- 不正なJWT形式

**解決方法**:
1. ネットワークタブでjoseライブラリが読み込まれているか確認
2. コンソールでエラーを確認
3. JWT形式を確認（3つのパートが`.`で区切られているか）

### 問題3: HTTPSエラー

**原因**:
- HTTPでアクセスしている
- 自己署名証明書

**解決方法**:
1. HTTPSでアクセスする
2. ローカル開発の場合は `localhost` を使用（HTTPでも動作）
3. GitHub Pages等のホスティングサービスを使用

---

## まとめ

### テスト実施チェックリスト

- [ ] シナリオ1: 正常系テスト完了
- [ ] シナリオ2: 空フィールドテスト完了（企業ID、メール、パスワード）
- [ ] シナリオ3: コールバックURLなしテスト完了
- [ ] シナリオ4: 任意の値でログイン成功テスト完了
- [ ] パフォーマンステスト完了（< 1秒）
- [ ] すべての合格基準を満たしている

### 次のステップ

すべてのテストが合格した場合:
1. 実装完了とマーク
2. デプロイ
3. 呼び出し側アプリケーションとの統合テスト

---

## 参考資料

- [JWT Debugger](https://jwt.io/) - JWTのデコードとデバッグ
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/) - ブラウザ開発者ツール
- [MDN Web Docs](https://developer.mozilla.org/) - Web技術リファレンス
