const API = window.__API;

const diceAnim = document.getElementById('diceAnim');
const prizeNameEl = document.getElementById('prizeName');
const remainingEl = document.getElementById('remaining');

const winnerBox = document.getElementById('winnerBox');
const bigCodeEl = document.getElementById('bigCode');
const fullNameEl = document.getElementById('fullName');
const departmentEl = document.getElementById('department');
const companyEl = document.getElementById('company');

// Audio
const audioRolling = new Audio('audio/rolling.mp3');
audioRolling.loop = true;
const audioWin = new Audio('audio/win.mp3');

let isSpinning = false;
let spinCancelController = null;
let prizeLocked = false;
const boardWrap = document.getElementById('board');
const reelsWrap = document.getElementById('reelsWrap');
const reelStrips = document.querySelectorAll('.reel-strip');

function diceHidden() {
    if (!reelsWrap || !boardWrap) return;
    reelsWrap.classList.add('hidden');
    boardWrap.classList.add('hidden');
}
function diceIdleSmall() {
    if (!reelsWrap || !boardWrap) return;
    reelsWrap.classList.remove('hidden');
    boardWrap.classList.remove('hidden');
    reelsWrap.style.transform = 'scale(1)';
}
function diceSpinningBig() {
    if (!reelsWrap || !boardWrap) return;
    reelsWrap.classList.remove('hidden');
    boardWrap.classList.remove('hidden');
    reelsWrap.style.transform = 'scale(1)';
}

function startDice3D() {
    reelStrips.forEach(strip => {
        const itemHeight = strip.closest('.reel').offsetHeight;
        strip.style.transition = 'none';
        strip.style.transform = `translateY(-${itemHeight * 9}px)`; // Reset về số 9
        void strip.offsetHeight; // force reflow
        strip.classList.add('spinning');
    });
}

async function stopDice3D(code, staggerMs = 0, slowDownTimeMs = 0) {
    const strips = document.querySelectorAll('.reel-strip');
    const delay = parseInt(staggerMs) || 0;
    const digits = (code || "000").split('').slice(-3);
    const isSlow = slowDownTimeMs > 0;
    console.log(`[Reels] Stopping with stagger delay: ${delay}ms, slowDown: ${slowDownTimeMs}ms for code: ${code}`);

    let maxStopTime = 0;

    for (let i = 0; i < strips.length; i++) {
        const stopTime = await stopSingleReel(i, digits[i], staggerMs, slowDownTimeMs);
        if (stopTime > maxStopTime) maxStopTime = stopTime;

        // If staggered (not slow), wait between starting EACH strip's stop transition
        if (!isSlow && delay > 0 && i < strips.length - 1) {
            console.log(`[Reels] Waiting ${delay}ms before stopping next digit...`);
            await sleep(delay);
        }
    }

    if (isSlow) {
        await sleep(maxStopTime * 1000 + 100);
    } else {
        const finalWait = delay > 0 ? 2500 : 3000;
        await sleep(finalWait);
    }
}

async function stopSingleReel(index, digitChar, staggerMs = 0, slowDownTimeMs = 0) {
    const strips = document.querySelectorAll('.reel-strip');
    const strip = strips[index];
    const delay = parseInt(staggerMs) || 0;
    const digit = parseInt(digitChar) || 0;
    const isSlow = slowDownTimeMs > 0;

    strip.classList.remove('spinning');
    strip.style.transition = 'none';
    strip.style.transform = 'translateY(0px)';
    void strip.offsetHeight; // force reflow

    const itemHeight = strip.closest('.reel').offsetHeight;

    let stopTime = delay > 0 ? 2.5 : (2 + index * 0.5);
    if (isSlow) {
        const gapSec = delay > 0 ? delay / 1000 : 0.5;
        stopTime = (slowDownTimeMs / 1000) - (strips.length - 1 - index) * gapSec;
        if (stopTime < 1) stopTime = 1;
    }

    let cycles = isSlow ? Math.min(60, Math.floor(stopTime * 6) + 10) : 10;
    cycles = Math.floor(cycles / 10) * 10;
    const y = -(digit + cycles) * itemHeight;

    strip.style.transition = `transform ${stopTime}s cubic-bezier(0.15, 0.9, 0.15, 1)`;
    strip.style.transform = `translateY(${y}px)`;

    if (fw) {
        setTimeout(() => {
            const parentReel = strip.closest('.reel');
            if (parentReel) {
                const rect = parentReel.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                if (!fw.running) fw.start();
                fw.explodeAt(centerX, centerY, 1.2, true);
            }
        }, (stopTime * 1000));
    }
    return stopTime;
}

function showCovers() {
    document.querySelectorAll('.reel-cover').forEach(cover => {
        cover.classList.remove('hidden', 'revealed');
        void cover.offsetHeight;
        cover.classList.add('active');
    });
}

function hideCovers() {
    document.querySelectorAll('.reel-cover').forEach(cover => {
        cover.classList.remove('active', 'revealed');
        cover.classList.add('hidden');
    });
}
// --- REMOTE CONTROL POLLING ---
// API URLs are already in window.__API (assigned to API const)

// Poll every 1s
setInterval(async () => {
    // Only poll if tab is visible to save resources? (Optional)
    if (document.hidden) return;

    // Don't spin if already spinning or locked
    if (isSpinning || prizeLocked) return;

    try {
        const res = await fetchJSON(API.checkRemote);
        if (res && res.ok && res.command === 'spin') {
            console.log("Remote spin command received!");
            if (!isSpinning && !prizeLocked) {
                spin();
            }
        }
    } catch (e) {
        // silence
    }
}, 1000);

// ---------- helpers ----------
const screenEl = document.querySelector('.screen');
const lightSweep = document.getElementById('lightSweep');

function flashScreen() {
    if (!screenEl) return;
    screenEl.classList.add('flash', 'shake');
    setTimeout(() => screenEl.classList.remove('flash', 'shake'), 350);
}

function sweepLight() {
    if (!lightSweep) return;
    lightSweep.classList.add('active');
    setTimeout(() => lightSweep.classList.remove('active'), 700);
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function fetchJSON(url, options) {
    const res = await fetch(url, Object.assign({ cache: 'no-store' }, options || {}));
    const json = await res.json().catch(() => null);
    if (!json) throw new Error('Invalid JSON');
    return json;
}

// Dice GIF controls
function showDice() {
    if (!diceAnim) return;
    diceAnim.classList.remove('hidden');
}

function hideDice() {
    if (!diceAnim) return;
    diceAnim.classList.add('hidden');
}

function startDice() {
    if (!diceAnim) return;

    // restart gif animation
    const src = diceAnim.getAttribute('src') || '';
    diceAnim.setAttribute('src', src.split('?')[0] + '?t=' + Date.now());

    showDice();
    diceAnim.classList.add('spinning');
}

function stopDice() {
    if (!diceAnim) return;
    diceAnim.classList.remove('spinning');
}

// ---------- fireworks canvas ----------
let fw = null;
if (window.ModernFireworks) {
    fw = new ModernFireworks('fxCanvas');
}

async function fireworksShow(prizeType = 'special') {
    if (!fw) return;
    fw.fireSequence(); // Initial burst
    await sleep(1000);
    fw.startContinuous(); // Keep going until popup is dismissed
}

// async function fireworksShow(){
//     if (!ctx || !canvas) return;
//
//     fxRunning = true;
//     particles = [];
//     ctx.clearRect(0,0,canvas.width,canvas.height);
//
//     const cx = canvas.width/2;
//     const cy = canvas.height*0.38;
//
//     spawnBurst(cx, cy);
//     spawnBurst(cx - canvas.width*0.18, cy + canvas.height*0.06);
//     spawnBurst(cx + canvas.width*0.18, cy + canvas.height*0.06);
//
//     stepFX();
//     await sleep(1200);
// }

// ---------- petals canvas ----------
const petalCanvas = document.getElementById('petalCanvas');
const pctx = petalCanvas ? petalCanvas.getContext('2d') : null;
let petals = [];
let petalRunning = false;

function resizePetal() {
    if (!petalCanvas) return;
    petalCanvas.width = window.innerWidth;
    petalCanvas.height = window.innerHeight;
}

window.addEventListener('resize', resizePetal);
resizePetal();

function spawnPetals() {
    petals = [];
    const count = 200; // Increased density (was 80)
    for (let i = 0; i < count; i++) {
        petals.push({
            x: Math.random() * (petalCanvas ? petalCanvas.width : window.innerWidth),
            y: -Math.random() * 300,
            vy: 3 + Math.random() * 4,
            vx: -0.8 + Math.random() * 1.6,
            size: 5 + Math.random() * 7, // Slightly bigger (5-12px)
            rot: Math.random() * Math.PI,
            vr: -0.03 + Math.random() * 0.06,
        });
    }
}

function drawPetals() {
    if (!petalRunning || !pctx || !petalCanvas) return;

    pctx.clearRect(0, 0, petalCanvas.width, petalCanvas.height);

    petals.forEach(p => {
        p.y += p.vy;
        p.x += p.vx;
        p.rot += p.vr;

        pctx.save();
        pctx.translate(p.x, p.y);
        pctx.rotate(p.rot);
        pctx.fillStyle = "rgba(255,223,0,.9)"; // Bright gold for stars

        // Draw star
        pctx.beginPath();
        const spikes = 5;
        const outerRadius = p.size;
        const innerRadius = p.size / 2;
        let rot = Math.PI / 2 * 3;
        let x = 0;
        let y = 0;
        const step = Math.PI / spikes;

        pctx.moveTo(0, 0 - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = Math.cos(rot) * outerRadius;
            y = Math.sin(rot) * outerRadius;
            pctx.lineTo(x, y);
            rot += step;

            x = Math.cos(rot) * innerRadius;
            y = Math.sin(rot) * innerRadius;
            pctx.lineTo(x, y);
            rot += step;
        }
        pctx.lineTo(0, 0 - outerRadius);
        pctx.closePath();
        pctx.fill();
        pctx.restore();
    });

    // Remove petals that have fallen off screen
    petals = petals.filter(p => p.y < petalCanvas.height + 40);

    // Continuously spawn new petals while running - More stars, faster
    if (petals.length < 150) { // Maintain higher density
        for (let i = 0; i < 15; i++) {
            petals.push({
                x: Math.random() * petalCanvas.width,
                y: -Math.random() * 50,
                vy: 3 + Math.random() * 4,
                vx: -0.8 + Math.random() * 1.6,
                size: 5 + Math.random() * 7, // Slightly bigger
                rot: Math.random() * Math.PI,
                vr: -0.03 + Math.random() * 0.06,
            });
        }
    }

    requestAnimationFrame(drawPetals);
}

function petalsShow() {
    if (!pctx || !petalCanvas) return;
    petalRunning = true;
    spawnPetals();
    drawPetals();
}

function stopPetals() {
    petalRunning = false;
    petals = [];
    if (pctx && petalCanvas) {
        pctx.clearRect(0, 0, petalCanvas.width, petalCanvas.height);
    }
}

// ---------- load header info ----------
async function refreshPrizeAndStatus() {
    try {
        const p = await fetchJSON(API.prize);
        if (p.ok && p.data) {
            window.currentPrizeData = p.data; // Store globally
            if (p.data.quantity == p.data.awarded) {
                prizeLocked = true;
                prizeNameEl.textContent = 'ĐÃ QUAY XONG GIẢI';
                document.getElementById('btnNextPrize').classList.add('active');
            } else {
                prizeLocked = false; // Unlock if spots opened up
                prizeNameEl.textContent = p.data.prize_name;
                document.getElementById('btnNextPrize').classList.remove('active');
            }
            // Update counter
            const counter = document.getElementById('prizeCounter');
            if (counter) {
                counter.textContent = `${p.data.awarded} / ${p.data.quantity}`;
            }
        }
        if (p.ok && !p.data) prizeNameEl.textContent = 'ĐÃ QUAY XONG';
        const s = await fetchJSON(API.status);
        if (s.ok) remainingEl.textContent = "Còn lại: " + s.data.remaining;
    } catch (e) {
        // ignore
    }
}

// ===== BOOM (confetti) =====
const boomCanvas = document.getElementById('boomCanvas');
const bctx = boomCanvas ? boomCanvas.getContext('2d') : null;
let booms = [];
let boomRun = false;

function resizeBoom() {
    if (!boomCanvas) return;
    boomCanvas.width = window.innerWidth;
    boomCanvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeBoom);
resizeBoom();

function boomBurst() {
    if (!bctx || !boomCanvas) return;

    booms = [];
    boomRun = true;

    const cx = boomCanvas.width / 2;
    const cy = boomCanvas.height * 0.45;

    const count = 160;
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 3 + Math.random() * 10;
        booms.push({
            x: cx,
            y: cy,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - (2 + Math.random() * 3),
            g: 0.14,
            life: 50 + Math.random() * 40,
            s: 2 + Math.random() * 4,
            r: Math.random() * Math.PI,
            vr: (-0.2 + Math.random() * 0.4),
            // gold/white/red-ish
            col: (Math.random() < 0.33) ? '255,211,106' : (Math.random() < 0.5 ? '255,255,255' : '255,80,80')
        });
    }
    requestAnimationFrame(stepBoom);
}

let megaConfettiActive = false;
let megaLoopId = null;

function startMegaConfetti() {
    if (!bctx || !boomCanvas) return;
    // booms = [];
    boomRun = true;
    megaConfettiActive = true;

    // Start animation loop if not already running effectively
    // logic in stepBoom handles the loop, but we need to ensure it's kicked off
    if (booms.length === 0) requestAnimationFrame(stepBoom);

    function spawnLoop() {
        if (!megaConfettiActive) return;
        spawnMegaBatch();
        megaLoopId = setTimeout(spawnLoop, 200); // Continuous spawn every 200ms
    }
    spawnLoop();
}

function stopMegaConfetti() {
    megaConfettiActive = false;
    boomRun = false; // Add this to signal stepBoom to stop
    if (megaLoopId) clearTimeout(megaLoopId);
}

function spawnMegaBatch() {
    if (!bctx || !boomCanvas) return;
    const W = boomCanvas.width;
    const H = boomCanvas.height;
    const count = 50; // spawn per batch

    // Left side
    for (let i = 0; i < count; i++) {
        const x = -10;
        const y = H * 0.9 - (Math.random() * 50); // Lower, closer to bottom
        // Angle: Shoot mostly UP, slightly right. (-90 to -60 degrees)
        // -PI/2 is UP.
        const angle = -Math.PI / 2 + (Math.random() * 0.5);
        const sp = 18 + Math.random() * 15;
        booms.push(createConfettiParticle(x, y, sp, angle));
    }

    // Right side
    for (let i = 0; i < count; i++) {
        const x = W + 10;
        const y = H * 0.9 - (Math.random() * 50);
        // Angle: Shoot mostly UP, slightly left. (-120 to -90 degrees)
        const angle = -Math.PI / 2 - (Math.random() * 0.5);
        const sp = 18 + Math.random() * 15;
        booms.push(createConfettiParticle(x, y, sp, angle));
    }
}

function createConfettiParticle(x, y, sp, angle) {
    return {
        x: x,
        y: y,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp,
        g: 0.25, // heavier gravity
        life: 100 + Math.random() * 60,
        s: 2 + Math.random() * 4,
        r: Math.random() * Math.PI,
        vr: (-0.2 + Math.random() * 0.4),
        col: getRandomColor()
    };
}

function getRandomColor() {
    const colors = [
        '255,0,0', '0,255,0', '0,0,255', '255,255,0', '0,255,255', '255,0,255', // basic
        '255,99,71', '144,238,144', '135,206,235', '255,215,0', // fancy
        '255,165,0', '128,0,128', '255,192,203', '64,224,208', // orange, purple, pink, turquoise
        '255,255,255' // white
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}


function stepBoom() {
    if (!boomRun || !bctx || !boomCanvas) return;

    bctx.clearRect(0, 0, boomCanvas.width, boomCanvas.height);

    booms = booms.filter(p => p.life > 0);

    for (const p of booms) {
        p.life -= 1;
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;

        const alpha = Math.max(0, p.life / 90);
        bctx.save();
        bctx.translate(p.x, p.y);
        bctx.rotate(p.r);
        bctx.fillStyle = `rgba(${p.col},${alpha})`;
        bctx.fillRect(-p.s, -p.s, p.s * 2, p.s * 2);
        bctx.restore();
    }

    if (booms.length === 0) {
        boomRun = false;
        bctx.clearRect(0, 0, boomCanvas.width, boomCanvas.height);
        return;
    }
    requestAnimationFrame(stepBoom);
}

// ===== WINNER POPUP =====
const winnerPopup = document.getElementById('winnerPopup');
const wpPrize = document.getElementById('wpPrize');
const wpCode = document.getElementById('wpCode');
const wpName = document.getElementById('wpName');
const wpDept = document.getElementById('wpDept');
const wpCompany = document.getElementById('wpCompany');

function hidePopup() {
    if (!winnerPopup) return;
    winnerPopup.classList.remove('show');
}

function showPopup(data) {
    if (!winnerPopup) return;
    wpPrize.textContent = data.prize.name;
    wpCode.textContent = data.winner.code;
    wpName.textContent = data.winner.full_name;
    wpDept.textContent = data.winner.department;
    wpCompany.textContent = data.winner.company;

    winnerPopup.classList.add('show');
}

function explodeDice() {
    // confetti burst
    boomBurst();

    setTimeout(() => {
        diceHidden();
    }, 560);
}

function showWinner(winners) {
    if (Array.isArray(winners)) {
        if (winners.length === 1) {
            document.getElementById('singleWinnerWrapper').classList.remove('hidden');
            document.getElementById('multiWinnerContainer').classList.add('hidden');
            const data = winners[0];
            document.getElementById('bigCode').textContent = data.code || '----';
            document.getElementById('fullName').textContent = data.full_name || '—';
            document.getElementById('department').textContent = data.department || '—';
            document.getElementById('company').textContent = data.company || '—';
        } else {
            document.getElementById('singleWinnerWrapper').classList.add('hidden');
            const multiContainer = document.getElementById('multiWinnerContainer');
            multiContainer.classList.remove('hidden');
            
            multiContainer.innerHTML = '';
            winners.forEach(w => {
                multiContainer.innerHTML += `
                    <div class="multi-winner-item">
                        <div class="m-code">${w.code || '----'}</div>
                        <div class="m-name">${w.full_name || '—'}</div>
                        <div class="m-dept">${w.department || ''} ${w.company ? '- ' + w.company : ''}</div>
                    </div>
                `;
            });
        }
    } else {
        document.getElementById('singleWinnerWrapper').classList.remove('hidden');
        document.getElementById('multiWinnerContainer').classList.add('hidden');
        document.getElementById('bigCode').textContent = winners.code || '----';
        document.getElementById('fullName').textContent = winners.full_name || '—';
        document.getElementById('department').textContent = winners.department || '—';
        document.getElementById('company').textContent = winners.company || '—';
    }
    
    document.getElementById('winnerOverlay').classList.remove('hidden');
    const popup = document.getElementById('winnerPopup');
    popup.classList.remove('hidden');
    requestAnimationFrame(() => popup.classList.add('show'));

    // Check special prize for mega confetti
    const pCode = (window.currentPrizeData && window.currentPrizeData.code) ? window.currentPrizeData.code : '';
    if (pCode.toLowerCase() === 'special') {
        startMegaConfetti();
    }
}

function hideWinner() {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
    }
    stopMegaConfetti(); // Stop confetti loop
    
    // Stop fireworks and stars
    if (fw) {
        fw.stopContinuous();
        fw.stop();
    }
    if (typeof stopPetals === 'function') {
        stopPetals();
    }

    document.getElementById('winnerOverlay').classList.add('hidden');
    const popup = document.getElementById('winnerPopup');
    popup.classList.remove('show');
    
    // Hide Consolation Board
    const consolationBoard = document.getElementById('consolationBoard');
    if (consolationBoard) {
        consolationBoard.classList.add('hidden');
        document.getElementById('consolationGrid').innerHTML = '';
        document.getElementById('consolationActions').classList.add('hidden');
    }

    // Restore dice/board to idle state (so prize name is visible)
    diceIdleSmall();

    setTimeout(() => popup.classList.add('hidden'), 200);
}
function updateWinnerSides() {
    const left = document.getElementById('winnerListLeft');
    const right = document.getElementById('winnerListRight');
    const center = document.getElementById('winnerListCenter');

    if (left && left.children.length > 0) {
        document.getElementById('winnersLeft')?.classList.remove('hidden');
    } else {
        document.getElementById('winnersLeft')?.classList.add('hidden');
    }

    if (right && right.children.length > 0) {
        document.getElementById('winnersRight')?.classList.remove('hidden');
    } else {
        document.getElementById('winnersRight')?.classList.add('hidden');
    }

    if (center && center.children.length > 0) {
        document.getElementById('winnerCenter')?.classList.remove('hidden');
    } else {
        document.getElementById('winnerCenter')?.classList.add('hidden');
    }
}

// ---------- main spin ----------
let currentWinners = null;
let currentPrizeId = null;

async function spin() {
    if (isSpinning) return;
    isSpinning = true;
    const prize = await fetchJSON(API.prize);
    if (prize.data.finished) {
        prizeLocked = true;
        // alert('Giải này đã quay đủ, hãy bấm NEXT'); // Bỏ alert theo yêu cầu "không tác dụng"
        document.getElementById('btnNextPrize').classList.add('active'); // Ensure button is highlighted
        return;
    }
    hideWinner();

    // 1) hiện dice nhỏ trước (như “chuẩn bị”)
    diceIdleSmall();
    await sleep(80);

    // 2) phóng to + quay
    if (typeof flashScreen === 'function') flashScreen();
    diceSpinningBig(); 
    startDice3D();

    try {
        spinCancelController = new AbortController();
        const apiPromise = fetchJSON(API.spin, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
            signal: spinCancelController.signal
        });

        // Reset trạng thái
        $('#winner-popup').hide();
        $('#fireworks-container').hide();
        $('.confetti-container').remove(); // Xóa confetti cũ

        // Play rolling sound
        audioRolling.currentTime = 0;
        audioRolling.play().catch(e => console.log('Audio autoplay blocked:', e));

        // Đợi API trả về để biết duration
        const res = await apiPromise;

        if (!res.ok) {
            if (spinCancelController) spinCancelController.abort();

            // Stop audio
            audioRolling.pause();
            audioWin.pause();

            // Lỗi -> dừng luôn
            stopDice3D();
            diceIdleSmall();
            await sleep(180);
            diceHidden();
            document.getElementById('specialMsg').classList.add('hidden');
            alert(res.error || 'Quay thất bại');
            await refreshPrizeAndStatus();
            return;
        }

        // Lấy duration từ API (nếu có), mặc định 3200ms
        const spinDuration = (res.data.prize && res.data.prize.duration) ? res.data.prize.duration : 3200;
        console.log('Spin duration:', spinDuration);

        // Show Special Message if code is 'special' - But delay it halfway
        const pCode = (res.data.prize && res.data.prize.code) ? res.data.prize.code : '';
        let specialMsgTimeout = null;

        if (pCode.toLowerCase() === 'special') {
            const delayTime = spinDuration / 2;
            specialMsgTimeout = setTimeout(() => {
                document.getElementById('specialMsg').classList.remove('hidden');
            }, delayTime);
        }
        console.log('Spin duration:', spinDuration);

        // Đợi nốt phần thời gian còn lại (trừ đi thời gian đã chờ request)
        // Tuy nhiên để đơn giản và mượt, ta cứ chờ đủ duration tính từ lúc bắt đầu quay
        // Hoặc đơn giản là: sau khi có kết quả, chờ thêm (duration) rồi mới dừng.
        // Cách tốt nhất: song song request và sleep(minimum), sau đó check duration.

        // Ở đây ta làm cách đơn giản: Chờ request xong, lấy duration, rồi wait thêm một chút hoặc wait cho đủ tổng duration.
        // Nhưng vì request có thể nhanh/chậm, ta nên wait một khoảng cố định + duration của giải.

        // Logic mới:
        // 1. Start quay
        // 2. Gọi API
        // 3. API trả về duration (VD: 5000ms)
        // 4. Đảm bảo tổng thời gian quay >= duration.

        // await sleep(3200); // <-- BỎ dòng này đi vì ta sẽ wait động

        // Tính toán thời gian cần wait thêm
        // Giả sử request mất 200ms, duration = 5000ms -> wait thêm 4800ms.
        // Nhưng ta không đo chính xác thời gian request ở đây start/end.
        // Cách đơn giản nhất: Chờ request xong -> wait duration (chính xác là wait duration từ lúc request xong cũng được, hoặc hard set).

        const prizeName = (res.data.prize && res.data.prize.name) ? res.data.prize.name.toLowerCase() : '';
        const isSpecial = pCode.toLowerCase() === 'special' || prizeName.includes('đặc biệt');
        const isFirstPrize = (prizeName.includes('nhất') || pCode === '1' || isSpecial);
        const spinCountSetting = (res.data.prize && res.data.prize.spin_count) ? parseInt(res.data.prize.spin_count) : 1;
        const isMultiSpin = (spinCountSetting > 1) || (Array.isArray(res.data.winners) && res.data.winners.length > 1);

        let staggerMs = (res.data.prize && res.data.prize.stagger_duration) ? parseInt(res.data.prize.stagger_duration) : 0;
        
        if (isMultiSpin) {
            // Quay Nhiều Giải 1 Lần: Xoay vòng số 1/2 thời gian thì bất ngờ biến mất!
            const halfTime = spinDuration ? Math.floor(spinDuration / 2) : 1500;
            await sleep(halfTime);
            
            audioRolling.pause();
            audioWin.currentTime = 0;
            audioWin.play().catch(e => console.log('Audio autoplay blocked:', e));

            // Lưu lại chiều cao TRƯỚC khi hide để tính toán đúng
            const stripHeights = Array.from(document.querySelectorAll('.reel-strip')).map(strip => strip.closest('.reel').offsetHeight);

            // Đang quay nửa chừng thì giấu đi ngay lập tức
            diceHidden();

            // Khôi phục vòng quay về dạng 999 tĩnh ở dưới background, để khi bấm Xác nhận nó không bị kẹt ở số cũ
            const strips = document.querySelectorAll('.reel-strip');
            strips.forEach((strip, index) => {
                strip.classList.remove('spinning');
                strip.style.transition = 'none';
                strip.style.transform = `translateY(-${stripHeights[index] * 9}px)`;
            });

            currentWinners = res.data.winners || [res.data.winner];
            currentPrizeId = res.data.prize.id;

            document.getElementById('specialMsg').classList.add('hidden');
            if (specialMsgTimeout) clearTimeout(specialMsgTimeout);
            hideCovers();

            await renderConsolationWinners(currentWinners);
            await refreshPrizeAndStatus();
            return;
        } else if (isSpecial) {
            // Quy trình Giải Đặc Biệt: Hiện màn che -> Đợi click
            const waitTime = (spinDuration * 2) / 3;
            await sleep(waitTime);
            
            showCovers();
            
            // Promise để đợi cả 3 tấm màn được click
            const primaryWinner = (Array.isArray(res.data.winners) && res.data.winners.length > 0) ? res.data.winners[0] : (res.data.winner || {code: '000'});
            const digits = primaryWinner.code.split('').slice(-3);
            const revealPromises = [];
            
            document.querySelectorAll('.reel-cover').forEach((cover, idx) => {
                const p = new Promise(resolve => {
                    cover.onclick = async () => {
                        cover.onclick = null; // Tránh click nhiều lần
                        cover.classList.add('revealed');
                        
                        // Dừng ngay cột này
                        const stopTime = await stopSingleReel(idx, digits[idx], staggerMs, spinDuration / 2);
                        setTimeout(resolve, stopTime * 1000);
                    };
                });
                revealPromises.push(p);
            });
            
            await Promise.all(revealPromises);
            
            audioRolling.pause();
            audioWin.currentTime = 0;
            audioWin.play().catch(e => console.log('Audio autoplay blocked:', e));
            
        } else if (isFirstPrize) {
            // Cho giải nhất: Quay full tốc độ 1.5s rồi mới bắt đầu hãm chậm dần
            await sleep(1500);
            
            let slowTimeMs = spinDuration - 1500;
            if (slowTimeMs < 2000) slowTimeMs = 2000;

            const stopCode = (Array.isArray(res.data.winners) && res.data.winners.length > 0) ? res.data.winners[0].code : (res.data.winner ? res.data.winner.code : '000');
            await stopDice3D(stopCode, staggerMs, slowTimeMs);
            
            audioRolling.pause();
            audioWin.currentTime = 0;
            audioWin.play().catch(e => console.log('Audio autoplay blocked:', e));
        } else {
            // Các giải khác: đợi xong spinDuration rồi mới bắt đầu dừng
            await sleep(spinDuration);

            // --- KẾT THÚC QUAY (Success) ---
            audioRolling.pause();
            audioWin.currentTime = 0;
            audioWin.play().catch(e => console.log('Audio autoplay blocked:', e));

            const stopCode = (Array.isArray(res.data.winners) && res.data.winners.length > 0) ? res.data.winners[0].code : (res.data.winner ? res.data.winner.code : '000');
            await stopDice3D(stopCode, staggerMs, 0);
        }
        
        document.getElementById('specialMsg').classList.add('hidden');
        if (specialMsgTimeout) clearTimeout(specialMsgTimeout);

        diceIdleSmall();
        // Wait a bit before hiding to ensure smooth transition
        await sleep(500); 
        diceHidden();
        hideCovers(); // Dọn dẹp màn che sau khi xong
        if (!res.ok) {
            alert(res.error || 'Quay thất bại');
            await refreshPrizeAndStatus();
            return;
        }

        // 4) pháo hoa + petals + sweep
        await fireworksShow(res.data.prize.code);

        // Only show stars (petals) if NOT special prize
        const prizeCode = (res.data.prize && res.data.prize.code) ? res.data.prize.code.toLowerCase() : '';
        if (typeof petalsShow === 'function' && prizeCode !== 'special') {
            petalsShow();
        }

        if (typeof sweepLight === 'function') sweepLight();
        await sleep(250);

        // 5) show winner
        currentWinners = res.data.winners || [res.data.winner];
        currentPrizeId = res.data.prize.id;
        showWinner(currentWinners);
        await refreshPrizeAndStatus();

    } catch (e) {
        diceHidden();
        alert('Lỗi hệ thống: ' + (e.message || e));
        console.error(e);
    } finally {
        isSpinning = false;
    }
}

// Assuming API object is defined somewhere above, e.g.:
// const API = {
//     prize: baseUrl + '/api/prize',
//     spin: baseUrl + '/api/spin',
//     confirm: baseUrl + '/api/confirm',
//     cancel: baseUrl + '/api/cancel',
// };
// We need to add checkAuth to it. For this example, I'll assume it's defined right before the global variables.
// If API object is not defined, this would be an error.
// For the purpose of this edit, I will insert the new API endpoint definition here,
// assuming the original API object definition ends with 'cancel' and a comma.
// If the API object is defined in a different file or structure, this placement might need adjustment.
// Given the instruction, I'll place it as if it's part of the API object definition.
// Since I don't have the full API object, I'll assume it's part of a larger definition.
// The provided snippet shows `cancel: baseUrl + '/api/cancel', checkAuth: baseUrl + '/api/checkAuth' };`
// This implies modifying an existing API object. I will place the new functions and call before the global variables.

// --- AUTHENTICATION ---
const AUTH_COOKIE = 'lucky_auth_token';
const AUTH_DURATION_HOURS = 3;

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function setCookie(name, value, hours) {
    const d = new Date();
    d.setTime(d.getTime() + (hours * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

async function checkAccess() {
    const token = getCookie(AUTH_COOKIE);
    if (!token) {
        // Block UI and ask for code
        const { value: code } = await Swal.fire({
            title: 'Nhập MÃ KÍCH HOẠT',
            input: 'password',
            inputLabel: 'Mã bảo mật để truy cập',
            inputPlaceholder: 'Nhập mã code...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            confirmButtonText: 'Truy cập',
            preConfirm: async (code) => {
                if (!code) {
                    Swal.showValidationMessage('Vui lòng nhập mã');
                    return false;
                }
                try {
                    // Assuming API object is accessible globally
                    const res = await fetchJSON(API.checkAuth, {
                        method: 'POST',
                        body: JSON.stringify({ code: code })
                    });
                    if (!res.ok) {
                        Swal.showValidationMessage(res.msg || 'Mã không đúng');
                        return false;
                    }
                    return true;
                } catch (e) {
                    Swal.showValidationMessage('Lỗi kết nối: ' + e);
                    return false;
                }
            }
        });

        if (code) {
            setCookie(AUTH_COOKIE, 'granted', AUTH_DURATION_HOURS);
            Swal.fire({
                icon: 'success',
                title: 'Truy cập thành công!',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            // Auto reload logic after expiration
            scheduleReload();
        }
    } else {
        // Already authenticated, schedule reload based on remaining time?
        // Simple approach: just schedule for the full duration from now (or slightly less if we stored timestamp).
        // Since we don't know when the cookie started without parsing it or storing extra data, 
        // we'll just check periodically or set a safe timeout.
        // User said "Nếu hết hạn thì tự động reload".
        // We can just rely on the next checkAccess validation?
        // But if the page isn't refreshed, JS doesn't know.
        // Let's set a timer for 3 hours from NOW to be safe, or check cookie existence every minute.
        setInterval(checkCookieExpiry, 60000); // Check every minute
    }
}

function checkCookieExpiry() {
    if (!getCookie(AUTH_COOKIE)) {
        location.reload(); // Reload to trigger auth popup again
    }
}

function scheduleReload() {
    setTimeout(() => {
        location.reload();
    }, AUTH_DURATION_HOURS * 60 * 60 * 1000);
}

// Start Auth Check
checkAccess();

// isSpinning is already declared elsewhere

async function confirmWinner() {
    stopPetals(); // Stop falling stars
    if (fw) fw.stopContinuous(); // Stop fireworks
    await fetchJSON(API.confirm, {
        method: 'POST',
        body: JSON.stringify({
            id: 'all',
            prize_id: currentPrizeId
        })
    });
    
    if (Array.isArray(currentWinners)) {
        currentWinners.forEach(w => {
            addWinnerToSide({ ...w });
        });
    }

    // ✅ ĐẨY SANG CÁNH GÀ
    updateWinnerSides();
    hideWinner();

    // TODO: gọi API confirm nếu cần
    console.log('Đã xác nhận kết quả');
    await refreshPrizeAndStatus();
}

async function cancelWinner() {
    // Confirm before cancelling the current winner popup
    const result = await Swal.fire({
        title: 'Bạn có chắc chắn muốn huỷ?',
        text: "Kết quả này sẽ không được ghi nhận!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Đúng, huỷ kết quả!',
        cancelButtonText: 'Không, giữ lại'
    });

    if (!result.isConfirmed) return;

    stopPetals(); // Stop falling stars
    stopMegaConfetti(); // Ensure special confetti stops
    if (fw) fw.stopContinuous(); // Stop fireworks

    // Call API to cancel the winner (delete from DB)
    if (currentWinners && currentWinners.length > 0) {
        try {
            const res = await fetchJSON(API.cancel, {
                method: 'POST',
                body: JSON.stringify({
                    id: 'all',
                    prize_id: currentPrizeId
                })
            });
            if (!res.ok) console.error("Failed to cancel winners:", res);
        } catch (e) {
            console.error("Error cancelling winners:", e);
        }
    }

    hideWinner();
    await refreshPrizeAndStatus();
}



// SPACE = spin
document.addEventListener('keydown', function (e) {
    const isSpace = (e.code === 'Space' || e.keyCode === 32);
    const isEnter = (e.code === 'Enter' || e.keyCode === 13);

    // Check if popup is open
    const popup = document.getElementById('winnerPopup');
    const isPopupVisible = popup && !popup.classList.contains('hidden');

    // Enter confirms winner if popup is open
    if (isEnter && isPopupVisible) {
        e.preventDefault();
        confirmWinner();
        return;
    }

    if (!isSpace) return;

    if (isPopupVisible) {
        e.preventDefault();
        return;
    }

    if (prizeLocked) {
        return;
    }

    e.preventDefault();
    spin();
});

// ✅ Ẩn dice ngay từ đầu
// ✅ Ẩn dice ngay từ đầu nhưng hiện board (để hiện tên giải)
// hideDice(); // Don't hide completely, use idle state
diceIdleSmall(); // Show board and small dice
refreshPrizeAndStatus();

let sideToggle = false;

function addWinnerToSide(winner) {
    const li = document.createElement('li');
    li.innerHTML = `
         <span class="numberBlock">
            ${winner.code}
         </span>
         <span class="partInfo">
            <span class="partname">${winner.full_name}</span>
            <span class="job">${winner.department || ''}</span>
         </span>
         <button class="btn-delete" data-id="${winner.id || winner.participant_id}" data-prize="${currentPrizeId}" title="Xoá người này">❌</button>
    `;

    // Event handled by delegation


    // Check if single winner mode (quantity == 1)
    const isSingleWinner = window.currentPrizeData && window.currentPrizeData.quantity == 1;

    if (isSingleWinner) {
        // Render to center
        const centerList = document.getElementById('winnerListCenter');
        // Add special markup for center
        li.innerHTML = `
            <span class="center-content">
                <span class="numberBlock">${winner.code}</span>
                 <div class="info-block">
                    <span class="partname">${winner.full_name}</span>
                    <span class="job">${winner.department || ''}</span>
                 </div>
            </span>
             <button class="btn-delete" data-id="${winner.id || winner.participant_id}" data-prize="${currentPrizeId}" title="Xoá người này">🗑</button>
         `;

        if (centerList) {
            centerList.innerHTML = ''; // Ensure only one if logic requires, but prepend is fine too
            centerList.prepend(li);
            document.getElementById('winnerCenter').classList.remove('hidden');
            // Hide sides just in case
            document.getElementById('winnersLeft').classList.add('hidden');
            document.getElementById('winnersRight').classList.add('hidden');
        }
        return;
    }

    if (!sideToggle) {
        document.getElementById('winnerListLeft').prepend(li);
    } else {
        document.getElementById('winnerListRight').prepend(li);
    }
    sideToggle = !sideToggle;
}

// Event Delegation for Delete Buttons
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-delete')) {
        const btn = e.target;
        const li = btn.closest('li');

        const id = btn.getAttribute('data-id');
        const prizeId = btn.getAttribute('data-prize');
        const namePart = li.querySelector('.partname');
        const name = namePart ? namePart.textContent : '---';

        handleRemoveWinnerClick(id, prizeId, name, li);
    }
});

async function handleRemoveWinnerClick(id, prizeId, name, li) {
    if (!id) {
        console.error('Missing ID');
        return;
    }

    const result = await Swal.fire({
        title: 'Xoá người trúng giải?',
        text: `Bạn có chắc muốn huỷ kết quả của: ${name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Xoá ngay',
        cancelButtonText: 'Thôi'
    });

    if (!result.isConfirmed) return;

    try {
        const res = await fetchJSON(API.cancel, {
            method: 'POST',
            body: JSON.stringify({
                id: id,
                prize_id: prizeId || currentPrizeId
            })
        });

        if (res.ok) {
            li.remove();
            // Refetch status to update counter and "Next" button state
            await refreshPrizeAndStatus();

            // Show success alert
            Swal.fire(
                'Đã xoá!',
                'Người trúng giải đã bị xoá khỏi danh sách.',
                'success'
            );
        } else {
            Swal.fire('Lỗi', res.msg || 'Không thể xoá', 'error');
        }
    } catch (e) {
        Swal.fire('Lỗi', 'Lỗi hệ thống khi xoá', 'error');
        console.error(e);
    }
}
async function nextPrize() {
    const res = await fetchJSON(API.nextPrize, { method: 'POST' });
    if (!res.ok) {
        alert(res.msg);
        return;
    }
    location.reload();
}
function nextPrizeManual() {
    prizeLocked = false;
    nextPrize(); // hàm cũ của bạn
}

document.querySelectorAll('.winners-side')
    .forEach(el => el.classList.add('show'));
document.getElementById('btnNextPrize').onclick = () => {
    if (prizeLocked) {
        nextPrizeManual();
    }
};

// Render Consolation Winners
async function renderConsolationWinners(winners) {
    const board = document.getElementById('consolationBoard');
    const grid = document.getElementById('consolationGrid');
    const actions = document.getElementById('consolationActions');
    
    // Reset bảng
    board.classList.remove('hidden');
    grid.innerHTML = '';
    actions.classList.add('hidden');
    
    document.getElementById('winnerOverlay').classList.remove('hidden');

    if (!Array.isArray(winners)) {
        winners = [winners];
    }
    
    // Thêm các item rỗng trước
    for (let i = 0; i < winners.length; i++) {
        const w = winners[i];
        const displayDept = w.department ? w.department : '';
        const displayComp = w.company ? '- ' + w.company : '';
        const deptStr = `${displayDept} ${displayComp}`;
        
        let html = `
            <div class="cons-item" id="cons-item-${i}">
                <button class="btn-cancel-cons" onclick="cancelSingleConsolation(${w.id}, this)">✖</button>
                <div class="c-code">${w.code || '----'}</div>
                <div class="c-name">${w.full_name || '—'}</div>
                <div class="c-dept">${deptStr}</div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', html);
    }
    
    // Start fireworks engine if not running
    if (fw && !fw.running) {
        fw.start();
    }
    
    // Bật hiệu ứng từng thẻ
    for (let i = 0; i < winners.length; i++) {
        await sleep(300); // 0.3s delay between each card

        const el = document.getElementById(`cons-item-${i}`);
        if(el) {
            el.classList.add('show');
            
            // Toạ độ trung tâm của thẻ để nổ pháo
            const rect = el.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            if (typeof fw !== 'undefined' && fw.explodeAt) {
                fw.explodeAt(x, y, 1.2, true); 
            }
        }
    }
    
    // Cuối cùng chờ 1 chút hiện nút xác nhận
    await sleep(500);
    actions.classList.remove('hidden');
}

async function cancelSingleConsolation(uid, btnEl) {
    const result = await Swal.fire({
        title: 'Xoá kết quả này?',
        text: "Người này sẽ bị huỷ thưởng và bạn có thể quay lại bù lượt",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Đúng, huỷ ngay!',
        cancelButtonText: 'Không huỷ'
    });

    if (!result.isConfirmed) return;

    try {
        const res = await fetchJSON(API.cancel, {
            method: 'POST',
            body: JSON.stringify({
                id: uid,
                prize_id: currentPrizeId
            })
        });

        if (res.ok) {
            // Remove from currentWinners array
            if (Array.isArray(currentWinners)) {
                currentWinners = currentWinners.filter(w => w.id != uid);
            }
            // Animate removal of item
            const item = btnEl.closest('.cons-item');
            if (item) {
                item.style.transition = 'all 0.4s';
                item.style.opacity = '0';
                item.style.transform = 'scale(0)';
                setTimeout(() => item.remove(), 400);
            }
            await refreshPrizeAndStatus();
        } else {
            Swal.fire('Lỗi', 'Không huỷ được: ' + res.error, 'error');
        }
    } catch (e) {
        Swal.fire('Lỗi', 'Lỗi hệ thống khi huỷ', 'error');
        console.error(e);
    }
}
