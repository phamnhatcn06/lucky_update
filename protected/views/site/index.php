<?php
$baseUrl = Yii::app()->baseUrl;
?>
<!doctype html>
<html lang="vi">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Lucky Draw</title>
    <link rel="stylesheet" href="<?php echo $baseUrl; ?>/css/lucky-skin.css" />
</head>
<body>
<!-- Background -->
<div class="bg" style="background-image:url('<?php echo $baseUrl; ?>/images/bg.png')"></div>
<!-- Fireworks canvas -->
<canvas id="fxCanvas" class="fx"></canvas>

<div class="screen">
    <div class="topbar">
        <div class="logo-left"></div>
        <div class="title">LUCKY DRAW</div>
        <div class="logo-right"></div>
    </div>

    <div class="prize-line">
        <div id="prizeName" class="prize-name">GIẢI ĐẶC BIỆT</div>
    </div>

    <!-- DICE AREA (thay cho chạy số) -->
    <div class="dice-wrap">
        <div id="dice" class="dice" aria-label="dice">
            <div class="face f1">⚀</div>
            <div class="face f2">⚁</div>
            <div class="face f3">⚂</div>
            <div class="face f4">⚃</div>
            <div class="face f5">⚄</div>
            <div class="face f6">⚅</div>
        </div>
    </div>

    <!-- Winner reveal -->
    <div id="winnerBox" class="winner hidden">
        <div id="bigCode" class="code">----</div>
        <div id="fullName" class="line">—</div>
        <div id="department" class="line sub">—</div>
        <div id="company" class="line sub">—</div>
    </div>

    <!-- Controls -->
    <div class="controls">
        <select id="prizeSelect" class="select"></select>
        <button id="spinBtn" class="btn primary">QUAY</button>
        <a class="btn ghost" href="<?php echo $baseUrl; ?>/admin">ADMIN</a>
    </div>

    <div class="footer">
        <div id="progress" class="meta">—</div>
        <div id="remaining" class="meta">—</div>
    </div>
</div>

<script>
    window.__API = {
        prizes: "<?php echo $baseUrl; ?>/api/prizes",
        spin:   "<?php echo $baseUrl; ?>/api/spin",
        status: "<?php echo $baseUrl; ?>/api/status"
    };
</script>
<script src="<?php echo $baseUrl; ?>/js/lucky-skin.js"></script>
<script>
    window.__API = { latest: "<?php echo Yii::app()->baseUrl; ?>/api/latest" };
</script>
<script src="/js/show.js"></script>
</body>
</html>
