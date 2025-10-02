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
      // JWTペイロード生成
      const payload = {
        companyId: companyId,
        userId: 'mock-user-123',
        accessToken: crypto.randomUUID(),
        expiresAt: Math.floor(Date.now() / 1000) + 86400, // 24時間後
      };

      // 秘密鍵
      const secret = new TextEncoder().encode('mock-secret-key-do-not-use-in-production');

      // JWT生成（joseライブラリ使用）
      const jwt = await new window.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(secret);

      console.log('JWT生成成功:', jwt);
      console.log('ペイロード:', payload);

      // コールバックURLにリダイレクト
      const callbackUrl = window.CALLBACK_URL || 'https://example.com/auth-success';
      const redirectUrl = `${callbackUrl}#token=${jwt}`;

      console.log('リダイレクト先:', redirectUrl);

      // 少し待ってからリダイレクト（UX向上）
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 500);
    } catch (error) {
      console.error('JWT生成エラー:', error);
      alert('JWT生成中にエラーが発生しました: ' + error.message);

      // エラー時はフォームを再表示
      loginButton.disabled = false;
      loginForm.style.display = 'block';
      loadingSpinner.style.display = 'none';
    }
  });
});
