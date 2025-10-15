# モック認証サービス

* 本サービスは、SaaSアプリケーションから使用されるダミーの認証サービスです
* モックサービスなので、テスト駆動の実装は必要ありません

# 認証ページ仕様

認証に必要な2つのエンドポイントを実装。

## エンドポイント一覧

|機能|URI|
|-|-|
|認証ページ表示|https://auth.prams-rfid.com/auth/sso/authorize|
|トークンエンドポイント|https://auth.prams-rfid.com/auth/sso/token|

## 認証ページ表示

### 受け取りパラメータ
* エンドポイントは以下のパラメータを受け取る
    ```
    client_id
    redirect_uri
    response_type
    state
    service_id
    ```

### 機能
* エンドポイントにアクセスされると認証Webページを表示する
* 認証Webページのログインボタンが押されると、以下をJWTのペイロードとして**redirect_uri**へ返却する（codeは固定値）
    |パラメータ名|データ|
    |-|-|
    |code|11d37eec2cb0d6be13a61282ff894c87359e6e5af170fe3a70fc74e2497a948d&|
    |state|認証ページアクセス時に取得した「state」の値|

## トークンエンドポイント

### 受け取りパラメータ
* エンドポイントは以下のパラメータを受け取る
    ```
    grant_type
    code
    client_id
    client_secret
    redirect_uri
    ```

### **grant_type**によって処理が分かれる
* "**authorization_code**"の場合
    * 以下のパラメータを含むJWTを返却する
        ```
        {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

* "**refresh_token**"の場合
    * 以下のパラメータを含むJWTを返却する
        ```
        {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        }
        ```
