const prizeSelect = document.getElementById('prizeSelect');
const spinBtn = document.getElementById('spinBtn');

const dice = document.getElementById('dice');

const prizeNameEl = document.getElementById('prizeName');
const bigCodeEl = document.getElementById('bigCode');
const fullNameEl = document.getElementById('fullName');
const departmentEl = document.getElementById('department');
const companyEl = document.getElementById('company');
const progressEl = document.getElementById('progress');
const remainingEl = document.getElementById('remaining');
const historyList = document.getElementById('historyList');

let prizes = [];
let isSpinning = false;
// ===== 3D DICE SETUP =====
const diceWrap = document.getElementById('diceWrap');
const cubes = [
    document.getElementById('c1'),
    document.getElementById('c2'),
    document.getElementById('c3'),
];

const PIPS = {
    1:['p5'],
    2:['p1','p9'],
    3:['p1','p5','p9'],
    4:['p1','p3','p7','p9'],
    5:['p1','p3','p5','p7','p9'],
    6:['p1','p3','p4','p6','p7','p9'],
};
const FACE_NUM = { front:1, back:6, right:3, left:4, top:2, bottom:5 };
const FACE_ORDER = ['front','right','left','back','top','bottom'];

function makeFace(name, num){
    const f = document.createElement('div');
    f.className = `face ${name}`;
    (PIPS[num] || []).forEach(p=>{
        const dot = document.createElement('span');
        dot.className = `pip ${p}`;
        f.appendChild(dot);
    });
    return f;
}

function buildCube(el){
    if (!el) return;
    el.innerHTML = '';
    FACE_ORDER.forEach(name => el.appendChild(makeFace(name, FACE_NUM[name])));
}

cubes.forEach(buildCube);

const diceState = cubes.map((el,i)=>({
    el,
    rx: -28 + i*6,
    ry:  35 + i*10,
    rz:  0,
    vx: 0, vy: 0, vz: 0,
    spinning: false,
}));

function applyDice(d){
    if (!d.el) return;
    d.el.style.transform = `rotateX(${d.rx}deg) rotateY(${d.ry}deg) rotateZ(${d.rz}deg)`;
}

function randVel(){
    const s = () => (Math.random() > 0.5 ? 1 : -1);
    return {
        vx: s() * (16 + Math.random()*30),
        vy: s() * (18 + Math.random()*34),
        vz: s() * (12 + Math.random()*26),
    };
}

function startDice3D(){
    diceState.forEach(d=>{
        const v = randVel();
        d.vx=v.vx; d.vy=v.vy; d.vz=v.vz;
        d.spinning = true;
    });
}

function stopDice3D(){
    diceState.forEach(d => d.spinning = false);
}

function diceRAF(){
    diceState.forEach(d=>{
        if (d.spinning){
            if (Math.random() < 0.03){
                const v = randVel();
                d.vx=v.vx; d.vy=v.vy; d.vz=v.vz;
            }
            d.rx += d.vx;
            d.ry += d.vy;
            d.rz += d.vz;
        }
        applyDice(d);
    });
    requestAnimationFrame(diceRAF);
}
diceRAF();

// show/hide/scale states
function diceHidden(){
    if (!diceWrap) return;
    diceWrap.classList.add('hidden');
    diceWrap.classList.remove('isSpinning','isIdle');
}
function diceIdleSmall(){
    if (!diceWrap) return;
    diceWrap.classList.remove('hidden','isSpinning');
    diceWrap.classList.add('isIdle');
}
function diceSpinningBig(){
    if (!diceWrap) return;
    diceWrap.classList.remove('hidden','isIdle');
    diceWrap.classList.add('isSpinning');
}

function setResultEmpty() {
    prizeNameEl.textContent = '—';
    bigCodeEl.textContent = '----';
    fullNameEl.textContent = '—';
    departmentEl.textContent = '—';
    companyEl.textContent = '—';
}

function toast(msg){ alert(msg); }

async function fetchJSON(url, options){
    const res = await fetch(url, options);
    const data = await res.json().catch(() => null);
    if (!data) throw new Error('Invalid JSON');
    return data;
}

function renderPrizes() {
    prizeSelect.innerHTML = '';
    prizes.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.prize_order}. ${p.prize_name} (${p.awarded}/${p.quantity})`;
        prizeSelect.appendChild(opt);
    });
}

function updateProgressLine(){
    const prizeId = Number(prizeSelect.value);
    const p = prizes.find(x => Number(x.id) === prizeId);
    progressEl.textContent = p ? `Tiến độ: ${p.awarded}/${p.quantity} suất` : '—';
    if (p) prizeNameEl.textContent = p.prize_name;
}

async function loadPrizes(){
    const r = await fetchJSON('/api/prizes');
    if (!r.ok) throw new Error(r.error || 'Failed');
    prizes = r.data;
    renderPrizes();
    updateProgressLine();
}

async function loadStatus(){
    const r = await fetchJSON('/api/status');
    if (!r.ok) return;

    remainingEl.textContent = `Còn lại: ${r.data.remaining} người chưa trúng`;

    historyList.innerHTML = '';
    (r.data.last_winners || []).forEach(item => {
        const div = document.createElement('div');
        div.className = 'history__item';
        div.innerHTML = `<b>${item.prize_name}</b> • ${item.code} • ${item.full_name} • ${item.department} • ${item.company}`;
        historyList.appendChild(div);
    });
}

function startDice(){ dice.classList.add('is-spinning'); }
function stopDice(){ dice.classList.remove('is-spinning'); }
async function spin(){
    if (isSpinning) return;
    isSpinning = true;

    hideWinner();

    // 1) hiện dice nhỏ trước (như “chuẩn bị”)
    diceIdleSmall();
    await sleep(80);

    // 2) phóng to + quay
    if (typeof flashScreen === 'function') flashScreen();
    diceSpinningBig();
    startDice3D();

    try{
        const apiPromise = fetchJSON(API.spin, {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({})
        });

        // cho quay đủ đã
        await sleep(2200);

        // 3) dừng + thu nhỏ + ẩn
        stopDice3D();
        diceIdleSmall();
        await sleep(180);
        diceHidden();

        const res = await apiPromise;
        if (!res.ok){
            alert(res.error || 'Quay thất bại');
            await refreshPrizeAndStatus();
            return;
        }

        // 4) pháo hoa + petals + sweep
        await fireworksShow();
        if (typeof petalsShow === 'function') petalsShow();
        if (typeof sweepLight === 'function') sweepLight();
        await sleep(250);

        // 5) show winner
        showWinner(res.data);
        await refreshPrizeAndStatus();

    } catch(e){
        diceHidden();
        alert('Lỗi hệ thống');
    } finally {
        isSpinning = false;
    }
}

prizeSelect.addEventListener('change', updateProgressLine);
spinBtn.addEventListener('click', spin);

(async function init(){
    await loadPrizes();
    await loadStatus();
})();
