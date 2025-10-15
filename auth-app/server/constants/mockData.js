const jwt = require('jsonwebtoken');

// 固定シークレットキー（モックサービス用）
const SECRET = 'mock-secret-key-do-not-use-in-production';

// 固定JWTトークン生成
const FIXED_ACCESS_TOKEN = jwt.sign({ sub: 'mock-access' }, SECRET);
const FIXED_REFRESH_TOKEN = jwt.sign({ sub: 'mock-refresh' }, SECRET);

// 固定の認証コード
const FIXED_AUTH_CODE = "11d37eec2cb0d6be13a61282ff894c87359e6e5af170fe3a70fc74e2497a948d&";

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
      adminAccessToken: process.env.MOCK_SHOPIFY_ADMIN_TOKEN || "mock_shopify_admin_access_token_xxxxx",
      storeAccessToken: process.env.MOCK_SHOPIFY_STORE_TOKEN || "mock_shopify_store_access_token_xxxxx",
      shopDomain: process.env.MOCK_SHOPIFY_DOMAIN || "xn-ams-nk4c6lre4725av5km35dro0d.myshopify.com"
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
