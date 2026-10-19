const prizeSelect = document.getElementById('prizeSelect');
const spinBtn = document.getElementById('spinBtn');
const dice = document.getElementById('dice');

const prizeNameEl = document.getElementById('prizeName');
const winnerBox = document.getElementById('winnerBox');
const bigCodeEl = document.getElementById('bigCode');
const fullNameEl = document.getElementById('fullName');
const departmentEl = document.getElementById('department');
const companyEl = document.getElementById('company');

const progressEl = document.getElementById('progress');
const remainingEl = document.getElementById('remaining');

const API = window.__API;

let prizes = [];
let isSpinning = false;

// ---------- helpers ----------
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url, options){
    const res = await fetch(url, options);
    const json = await res.json().catch(() => null);
    if (!json) throw new Error('Invalid JSON');
    return json;
}

function setWinnerHidden(){
    winnerBox.classList.add('hidden');
    winnerBox.classList.remove('pop');
}

function setWinner(data){
    bigCodeEl.textContent = data.code || '----';
    fullNameEl.textContent = data.full_name || '—';
    departmentEl.textContent = data.department || '—';
    companyEl.textContent = data.company || '—';

    winnerBox.classList.remove('hidden');
    // restart pop animation
    winnerBox.classList.remove('pop');
    void winnerBox.offsetWidth;
    winnerBox.classList.add('pop');
}

function renderPrizes(){
    prizeSelect.innerHTML = '';
    prizes.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.prize_order}. ${p.prize_name} (${p.awarded}/${p.quantity})`;
        prizeSelect.appendChild(opt);
    });
}

function updateProgress(){
    const pid = Number(prizeSelect.value);
    const p = prizes.find(x => Number(x.id) === pid) || prizes[0];
    if (!p) return;
    prizeNameEl.textContent = p.prize_name;
    progressEl.textContent = `Tiến độ: ${p.awarded}/${p.quantity} suất`;
}

async function loadPrizes(){
    const r = await fetchJSON(API.prizes);
    if (!r.ok) throw new Error(r.error || 'Load prizes failed');
    prizes = r.data;
    renderPrizes();
    updateProgress();
}

async function loadStatus(){
    const r = await fetchJSON(API.status);
    if (!r.ok) return;
    remainingEl.textContent = `Còn lại: ${r.data.remaining} người chưa trúng`;
}

function startDice(){
    dice.classList.add('spinning');
}
function stopDice(){
    dice.classList.remove('spinning');
}

// ---------- FIREWORKS (Canvas) ----------
const canvas = document.getElementById('fxCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let particles = [];
let fxRunning = false;

function rand(min,max){ return Math.random()*(max-min)+min; }

function spawnBurst(x,y){
    const count = 90;
    for(let i=0;i<count;i++){
        const angle = rand(0, Math.PI*2);
        const speed = rand(2.5, 8.5);
        particles.push({
            x,y,
            vx: Math.cos(angle)*speed,
            vy: Math.sin(angle)*speed,
            life: rand(35, 70),
            size: rand(1.2, 2.8),
            gravity: 0.08,
            alpha: 1
        });
    }
}

function stepFX(){
    if (!fxRunning) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // fade trail
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    particles = particles.filter(p => p.life > 0);

    particles.forEach(p => {
        p.life -= 1;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = Math.max(0, p.life/70);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.fill();
    });

    if (particles.length === 0){
        fxRunning = false;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        return;
    }

    requestAnimationFrame(stepFX);
}

async function fireworksShow(){
    // 3 bursts around center
    fxRunning = true;
    particles = [];
    const cx = canvas.width/2;
    const cy = canvas.height*0.38;

    spawnBurst(cx, cy);
    spawnBurst(cx - canvas.width*0.18, cy + canvas.height*0.06);
    spawnBurst(cx + canvas.width*0.18, cy + canvas.height*0.06);

    stepFX();
    await sleep(1200);
    // fx will auto stop when particles done
}

// ---------- MAIN SPIN ----------
async function spin(){
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;

    const prizeId = Number(prizeSelect.value);
    const p = prizes.find(x => Number(x.id) === prizeId);
    if (!p){
        isSpinning = false; spinBtn.disabled = false;
        alert('Chưa chọn giải');
        return;
    }
    if (Number(p.awarded) >= Number(p.quantity)){
        isSpinning = false; spinBtn.disabled = false;
        alert('Giải này đã quay đủ số lượng.');
        return;
    }

    setWinnerHidden();
    prizeNameEl.textContent = p.prize_name;

    // start dice
    startDice();

    try{
        // call API now but show after delay
        const apiPromise = fetchJSON(API.spin, {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ prize_id: prizeId })
        });

        // shake time
        await sleep(2200);
        const res = await apiPromise;

        stopDice();

        if (!res.ok){
            alert(res.error || 'Quay thất bại');
            return;
        }

        // fireworks
        await fireworksShow();

        // reveal winner
        setWinner(res.data.winner);

        // refresh prizes + status
        await loadPrizes();
        await loadStatus();

    } catch(e){
        stopDice();
        alert('Lỗi hệ thống khi quay.');
    } finally {
        isSpinning = false;
        spinBtn.disabled = false;
    }
}

// ---------- init ----------
prizeSelect.addEventListener('change', updateProgress);
spinBtn.addEventListener('click', spin);

(async function init(){
    await loadPrizes();
    await loadStatus();
})();
