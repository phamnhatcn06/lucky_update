<!doctype html>
<html lang="vi">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Admin Login</title>
    <link href="<?php echo Yii::app()->request->baseUrl; ?>/css/lato.css" rel="stylesheet">
</head>
<body style="margin:0;font-family:'Lato', system-ui, sans-serif;background:#0b0610;color:#fff;display:grid;place-items:center;height:100vh">
<form method="post" style="width:min(420px,92vw);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:18px">
    <h2 style="margin:0 0 8px">Admin</h2>
    <div>Tài khoản</div>
    <input name="username" required style="width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.35);color:#fff;outline:none;margin-top:8px">
    <div style="margin-top:10px">Mật khẩu</div>
    <input type="password" name="password" required style="width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.35);color:#fff;outline:none;margin-top:8px">
    <button style="width:100%;margin-top:12px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(180deg,#ff2a3a,#b4001b);color:#fff;font-weight:800;cursor:pointer">Đăng nhập</button>
    <?php if (!empty($error)): ?>
        <div style="color:#ffd1d1;margin-top:10px"><?php echo CHtml::encode($error); ?></div>
    <?php endif; ?>
</form>
</body>
</html>
