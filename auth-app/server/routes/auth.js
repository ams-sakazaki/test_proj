const express = require('express');
const router = express.Router();

// デフォルトのコールバックURL
const DEFAULT_CALLBACK_URL = process.env.DEFAULT_CALLBACK_URL || 'https://example.com/auth-success';

// POST /auth エンドポイント
router.post('/auth', (req, res) => {
  // POSTリクエストボディからcallbackパラメータを取得
  const callbackUrl = req.body.callback || DEFAULT_CALLBACK_URL;

  console.log(`POST /auth リクエスト受信 - callback: ${callbackUrl}`);

  // ログイン画面をレンダリング
  res.render('login', {
    callbackUrl: callbackUrl
  });
});

module.exports = router;
