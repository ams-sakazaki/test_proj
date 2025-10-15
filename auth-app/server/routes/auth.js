const express = require('express');
const router = express.Router();
const {
  FIXED_ACCESS_TOKEN,
  FIXED_REFRESH_TOKEN,
  MOCK_USER,
  MOCK_SERVICE
} = require('../constants/mockData');

// デフォルトのコールバックURL
const DEFAULT_CALLBACK_URL = process.env.DEFAULT_CALLBACK_URL || 'https://example.com/auth-success';

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

module.exports = router;
