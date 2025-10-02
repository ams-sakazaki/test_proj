const express = require('express');
const path = require('path');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// EJSをビューエンジンとして設定
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ミドルウェア設定
app.use(express.json()); // JSONボディパーサー
app.use(express.urlencoded({ extended: true })); // URLエンコードされたボディパーサー
app.use(express.static(path.join(__dirname, '../public'))); // 静的ファイル提供

// ルーター統合
app.use('/', authRouter);

// ルートエンドポイント
app.get('/', (req, res) => {
  res.send('モックログイン認証サービス - POST /auth にアクセスしてください');
});

// 404ハンドラー
app.use((req, res) => {
  res.status(404).send('ページが見つかりません');
});

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error('エラー:', err);
  res.status(500).send('サーバーエラーが発生しました');
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
  console.log(`http://localhost:${PORT}`);
  console.log(`POST /auth でログイン画面を表示`);
});
