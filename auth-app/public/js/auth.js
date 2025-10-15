// JWT生成とリダイレクト処理

// DOMコンテンツ読み込み完了後に実行
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginButton = document.getElementById('loginButton');
  const loadingSpinner = document.getElementById('loadingSpinner');

  // フォーム送信イベント
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 入力値取得
    const companyId = document.getElementById('companyId').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // バリデーション
    let isValid = true;

    // エラークラスをリセット
    document.querySelectorAll('.form-control').forEach((input) => {
      input.classList.remove('is-invalid');
    });

    // 企業IDチェック
    if (!companyId) {
      document.getElementById('companyId').classList.add('is-invalid');
      isValid = false;
    }

    // メールチェック
    if (!email) {
      document.getElementById('email').classList.add('is-invalid');
      isValid = false;
    }

    // パスワードチェック
    if (!password) {
      document.getElementById('password').classList.add('is-invalid');
      isValid = false;
    }

    // バリデーションエラーの場合は終了
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
      console.log('認証コード:', code);
      console.log('state:', state);

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
});
